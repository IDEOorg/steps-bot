const Chatbot = require('./src/Chatbot');
const Rivebot = require('./src/Rivebot');
const Updater = require('./src/Updater');
const Messenger = require('./src/Messenger');
const constants = require('./src/constants');
require('dotenv').config();
const api = require('./src/api');
const Botkit = require('botkit');
const server = require('./server.js');

// Create the Botkit controller, which controls all instances of the bot.
const twilioController = Botkit.twiliosmsbot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER
});

// Set up an Express-powered webserver to webhook endpoints
server(fbEndpoint, twilioController, getCoachResponse);

setInterval(() => {
  messageAllClientsWithOverdueCheckinsOrFollowups();
}, 5400000); // 5400000 check all clients for checkin messages every 90 minutes

// takes in the request FB sends and formats that data and passes it into the run() function.
async function fbEndpoint(req, res) {
  console.log('index.js..fbEndpoint called', req.body);
  res.status(200);
  res.send('ok');
  const body = req.body;
  const messageObject = body.entry[0].messaging[0];
  const userPlatformId = messageObject.sender.id;
  let userMessage = null;
  let fbNewUserPhone = null;
  if (messageObject.message) { // if message came from user messaging FB
    userMessage = messageObject.message.text;
  } else if (messageObject.postback) { // triggered if user presses any button
    userMessage = messageObject.postback.title;
    if (messageObject.postback.referral) { // if message came from user pressing GET STARTED on FB, get the referral code (which is the user's phone number attached to the m.me link)
      fbNewUserPhone = getPhoneNumberFromFBLink(messageObject.postback.referral.ref);
    }
  } else {
    return; // this is critical. Do not delete without thorough testing. If it's not a message being sent to the api then it could be a delivery receipt confirmation, which if not exited will cause an infinite loop, send hundreds of messages per minute to a user, and get you banned on fb messenger
  }
  await run({
    platform: constants.FB,
    userPlatformId,
    userMessage,
    fbNewUserPhone
  });
}

twilioController.hears('.*', 'message_received', async (_, message) => {
  const userPlatformId = message.user;
  const userMessage = message.text;
  await run({
    platform: constants.SMS,
    userPlatformId,
    userMessage
  });
});

async function getCoachResponse(req, res) {
  if (req.query && req.query.user_id) {
    const userId = req.query.user_id;
    const coachMessage = await getMostRecentUserMessage(userId);
    if (coachMessage && coachMessage.to_user === parseInt(userId, 10)) { // if the coach message exists and the person receiving the message is the user (this should always be true)
      const user = await api.getUserFromId(userId);
      const platform = user.platform === 'FBOOK' ? constants.FB : constants.SMS;
      const userPlatformId = user.platform === 'FBOOK' ? user.fb_id : user.phone;
      await run({
        platform,
        userPlatformId,
        userMessage: 'startprompt',
        topic: 'helpcoachresponse',
        coachHelpResponse: coachMessage.text,
        isMessageSentFromCheckIn: true
      });
    } else {
      console.log('coach\'s message was not received by client ' + userId);
    }
  }
  res.send('OK');
}

// this sorts the user's messages and gets the latest message the user received, which should be the coach's message
async function getMostRecentUserMessage(userId) {
  let messages = await api.getUserMessages(userId);
  messages = messages.sort((a, b) => {
    return Date.parse(a.timestamp) > Date.parse(b.timestamp);
  });
  if (messages.length) {
    const coachMessage = messages[messages.length - 1];
    return coachMessage;
  }
  return null;
}

async function messageAllClientsWithOverdueCheckinsOrFollowups() {
  const isMessageSentFromCheckIn = true;
  const users = await api.getAllClients();
  if (!users.length) {
    return;
  }
  for (let i = 0; i < users.length; i++) {
    try {
      const user = users[i];
      const platform = user.platform === 'FBOOK' ? constants.FB : constants.SMS;
      const userPlatformId = user.platform === 'FBOOK' ? user.fb_id : user.phone;
      if (userPlatformId) { // this line is needed in case a user created a FB account but hasn't messaged on FB (meaning the user.fb_id would be null since the bot has no way of knowing the fb id)
        if (userShouldReceiveFollowupMessage(user)) { // send user a follow up message
          await run({ // eslint-disable-line
            platform,
            userPlatformId,
            userMessage: 'startprompt',
            topic: 'followup',
            isMessageSentFromCheckIn
          });
          await sleep(2000); // eslint-disable-line
        }
        const eligibleCheckins = getAllCheckinMessagesUserShouldReceive(user);
        if (platform !== null && userPlatformId !== null) {
          for (let j = 0; j < eligibleCheckins.length; j++) {
            const eligibleCheckin = eligibleCheckins[j];
            await sleep(2000); // eslint-disable-line
            await run({ // eslint-disable-line
              platform,
              userPlatformId,
              userMessage: eligibleCheckin.message,
              topic: eligibleCheckin.topic,
              recurringTaskId: eligibleCheckin.recurringTaskId,
              isMessageSentFromCheckIn,
            });
          }
        }
      }
    } catch (e) {
      console.log('error updating user ' + users[i].id);
      console.log(users[i]);
    }
  }
}

// returns true if it's time for the user to receive a follow up message
function userShouldReceiveFollowupMessage(user) {
  const followUpAppointment = user.follow_up_date;
  if (followUpAppointment && new Date(followUpAppointment).valueOf() < Date.now()) {
    return true;
  }
  return false;
}

// returns all check in messages that are overdue and will be sent to the user
function getAllCheckinMessagesUserShouldReceive(user) {
  const checkins = user.checkin_times;
  const eligibleCheckins = [];
  if (checkins) {
    for (let j = checkins.length - 1; j >= 0; j--) {
      const checkin = checkins[j];
      if (checkin.time < Date.now()) {
        const removedCheckinFromClient = checkins.splice(j, 1)[0];
        eligibleCheckins.push(removedCheckinFromClient);
      }
    }
  }
  return eligibleCheckins;
}

// This function is the heart of the chatbot. It takes in user / platform data, figures out what the bot should respond to the client with, and then updates the client
async function run(opts) {
  // platform, userPlatformId, and userMessage are required fields in the run() function
  const {
    platform,
    userPlatformId,
    userMessage,
    fbNewUserPhone,
    topic,
    recurringTaskId,
    isMessageSentFromCheckIn,
    coachHelpResponse
  } = opts;
  const rivebot = new Rivebot();
  await rivebot.loadChatScripts();
  const chatbot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload: fbNewUserPhone,
    topic,
    recurringTaskId,
    coachHelpResponse
  });
  try {
    await chatbot.getResponse();
  } catch (e) {
    chatbot.shouldMessageClient = false;
    chatbot.shouldUpdateClient = false;
    console.log('error with user ' + chatbot.userPlatformId);
    console.log(chatbot.client);
  }
  if (chatbot.shouldMessageClient) {
    const messenger = new Messenger({
      platform,
      userPlatformId,
      messages: chatbot.messagesToSendToClient,
      client: chatbot.client,
      isMessageSentFromCheckIn
    });
    await messenger.sendReply();
  }
  if (chatbot.client && chatbot.shouldUpdateClient) {
    const variables = await rivebot.getVariables(userPlatformId);
    const updater = new Updater({
      userPlatformId,
      client: chatbot.client,
      currentTask: chatbot.currentTask,
      variables
    });
    await updater.loadNewInfoToClient();
    await updater.updateClientToDB();
    await rivebot.resetVariables(userPlatformId);
  }
}

/* if user clicks on http://m.me/188976981789653?ref=REFERRAL_ID`, and then presses GET START,
* then the REFERRAL_ID, in this case the user's phone number, will be passed along as an argument.
*/
function getPhoneNumberFromFBLink(referral) {
  return '+1' + referral;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
