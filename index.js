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
// Set up an Express-powered webserver to expose oauth and webhook endpoints
// We are passing the controller object into our express server module
// so we can extend it and process incoming message payloads
server(fbEndpoint, twilioController, getCoachResponse);

async function run(opts) {
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
  await chatbot.getResponse();
  console.log(chatbot);
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
  console.log('...updating......');
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
  }
}

async function fbEndpoint(req, res) {
  res.status(200);
  res.send('ok');
  const body = req.body;
  const messageObject = body.entry[0].messaging[0];
  const userPlatformId = messageObject.sender.id;
  let userMessage = null;
  let fbNewUserPhone = null;
  if (messageObject.message) {
    userMessage = messageObject.message.text;
  } else if (messageObject.postback) {
    userMessage = messageObject.postback.title;
    if (messageObject.postback.referral) {
      fbNewUserPhone = '+1' + messageObject.postback.referral.ref;
    }
  } else {
    return; // this is critical. If it's not a message being sent to the api then it's a delivery receipt confirmation, which if not exited will cause an infinite loop, send thousands of messages per hour to a user, and get you banned on fb messenger
  }

  run({
    platform: constants.FB,
    userPlatformId,
    userMessage,
    fbNewUserPhone
  });
}

twilioController.hears('.*', 'message_received', (_, message) => {
  console.log('message receiveddd');
  console.log(message);
  console.log(message.user);
  console.log(message.text);
  const userPlatformId = message.user;
  const userMessage = message.text;

  run({
    platform: constants.SMS,
    userPlatformId,
    userMessage
  });
});

setInterval(() => {
  updateAllClients();
}, 5400000); // 1800000 is 30 minutes

async function updateAllClients() {
  const isMessageSentFromCheckIn = true;
  let users = [];
  const currentTimeHour = (new Date()).getHours();
  if (currentTimeHour > 12 || currentTimeHour < 4) {
    users = await api.getAllClients();
  }
  users = await api.getAllClients();
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const checkins = user.checkin_times;
    const followUpAppointment = user.follow_up_date;
    const eligibleCheckins = [];
    let platform = null;
    let userPlatformId = null;
    if (user.platform === 'FBOOK') {
      platform = constants.FB;
      userPlatformId = user.fb_id;
    } else {
      platform = constants.SMS;
      userPlatformId = user.phone;
    }
    if (followUpAppointment && new Date(followUpAppointment).valueOf() < Date.now()) { // send user a follow up message
      await sleep(2000); // eslint-disable-line
      run({
        platform,
        userPlatformId,
        userMessage: 'startprompt',
        topic: 'followup',
        isMessageSentFromCheckIn
      });
    }
    if (checkins) {
      for (let j = checkins.length - 1; j >= 0; j--) {
        const checkin = checkins[j];
        if (checkin.time < Date.now()) {
          eligibleCheckins.push(checkin.splice(checkins[j], 1)[0]);
        }
      }
      if (platform !== null && userPlatformId !== null) {
        for (let j = 0; j < eligibleCheckins.length; j++) {
          const eligibleCheckin = eligibleCheckins[j];
          // arguments for below function are wrong
          await sleep(2000); // eslint-disable-line
          run({
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
  }
}

async function getCoachResponse(req, res) {
  if (req.query && req.query.user_id) {
    const userId = req.query.user_id;
    let messages = await api.getUserMessages(userId);
    messages = messages.sort((a, b) => {
      return Date.parse(a.timestamp) > Date.parse(b.timestamp);
    });
    if (messages.length) {
      const coachMessage = messages[messages.length - 1];
      if (coachMessage.to_user === parseInt(userId, 10)) {
        const user = await api.getUserFromId(userId);
        let platform = constants.platform;
        let userPlatformId = user.phone;
        if (user.platform === 'FBOOK') {
          platform = constants.platform;
          userPlatformId = user.fb_id;
        }
        run({
          platform,
          userPlatformId,
          userMessage: 'startprompt',
          topic: 'helpcoachresponse',
          coachHelpResponse: coachMessage.text,
          isMessageSentFromCheckIn: true
        });
      }
    }
  }
  res.send('OK');
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
