const cluster = require('cluster');
const twilio = require('twilio');
require('dotenv').config();

const Chatbot = require('./src/Chatbot');
const Rivebot = require('./src/Rivebot');
const Updater = require('./src/Updater');
const Messenger = require('./src/Messenger');
const constants = require('./src/constants');
const api = require('./src/api');
const server = require('./server.js');
const helpers = require('./helpers');

const numCPUs = require('os').cpus().length;

let workerCount = 0;

/**
 * This creates node cluster workers for bot app
 * Workers maximizes the CPU utility and ensure that the bot runs with less likelihood of a downtime
 * For more info, see: https://www.sitepoint.com/how-to-create-a-node-js-cluster-for-speeding-up-your-apps/
 * and https://medium.com/the-andela-way/scaling-out-with-node-clusters-1dca4a39a2a
 */
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Creates as many workers as the number of available CPUs
  while (workerCount <= numCPUs) {
    cluster.fork();
    workerCount += 1;
  }

  // Starts a new worker when one worker exits/dies
  cluster.on('exit', (worker, code, signal) => {
    console.log(
      'worker %d died (%s). restarting...',
      worker.process.pid, signal || code
    );
    cluster.fork();
  });
} else {
  // Set up an Express-powered webserver to webhook endpoints
  server(
    fbEndpoint,
    twilioReceiveSmsController,
    getCoachResponse,
    testTwilioCredentialsController
  );
  console.log(`Worker ${process.pid} started
    listening on server port ${process.env.PORT || 3002}`);
}

/**
 * This function is responsible for receiving the SMS from Twilio
 * @param {object} request
 * @param {object} response
 */
async function twilioReceiveSmsController(request) {
  const message = request.body;
  const userPlatformId = message.From;
  const userMessage = message.Body;
  await run({
    platform: constants.SMS,
    userPlatformId,
    userMessage
  });
}

/**
 * @description This function is responsible for testing the Twilio credentials provided by orgs
 * @param {object} request
 * @param {object} response
 * @returns {object} http response object
 */
async function testTwilioCredentialsController(request, response) {
  try {
    const {
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    } = request.body;
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    const message = await twilioClient.messages
      .create({
        body: 'Testing the Twilio credentials for ' + twilioPhoneNumber,
        from: twilioPhoneNumber,
        to: process.env.TEST_PHONE_NUMBER,
      });
    if (message.sid) {
      return response.status(200).json({
        message,
      });
    }
    return response.json({
      message,
    });
  } catch (error) {
    return response.json({
      error,
    });
  }
}

if (helpers.isProductionEnvironment()) {
  setInterval(() => {
    messageAllClientsWithOverdueCheckinsOrFollowups();
  }, 5400000); // 5400000 check all clients for checkin messages every 90 minutes
}

// takes in the request FB sends and formats that data and passes it into the run() function.
async function fbEndpoint(req, res) {
  res.status(200);
  res.send('ok');
  const body = req.body;
  const messageObject = body.entry[0].messaging[0];
  const userPlatformId = messageObject.sender.id;
  let userMessage = null;
  let fbNewUserPhone = null;
  if (messageObject.message) {
    // if message came from user messaging FB
    userMessage = messageObject.message.text;
  } else if (messageObject.postback) {
    // triggered if user presses any button
    userMessage = messageObject.postback.title;
    if (messageObject.postback.referral) {
      // if message came from user pressing GET STARTED on FB, get the referral code (which is the user's phone number attached to the m.me link)
      fbNewUserPhone = getPhoneNumberFromFBLink(
        messageObject.postback.referral.ref
      );
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

async function getCoachResponse(req, res) {
  if (req.query && req.query.user_id) {
    const userId = req.query.user_id;
    const coachMessage = await getMostRecentUserMessage(userId);
    if (coachMessage && coachMessage.to_user === parseInt(userId, 10)) {
      // if the coach message exists and the person receiving the message is the user (this should always be true)
      const user = await api.getUserFromId(userId);
      const platform = user.platform === 'FBOOK' ? constants.FB : constants.SMS;
      const userPlatformId = user.platform === 'FBOOK' ? user.fb_id : user.phone;
      if (coachMessage.topic === 'directmessage') {
        await run({
          platform,
          userPlatformId,
          userMessage: 'startprompt',
          topic: 'directmessage',
          coachDirectMessage: coachMessage.text,
          isMessageSentFromCheckIn: true,
        });
      } else {
        await run({
          platform,
          userPlatformId,
          userMessage: 'startprompt',
          topic: 'helpcoachresponse',
          coachHelpResponse: coachMessage.text,
          isMessageSentFromCheckIn: true,
          helpRequestId: coachMessage.request_id
        });
      }
    } else {
      console.log("coach's message was not received by client " + userId);
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
      const userPlatformId =
        user.platform === 'FBOOK' ? user.fb_id : user.phone;
      if (userPlatformId) {
        // this line is needed in case a user created a FB account but hasn't messaged on FB (meaning the user.fb_id would be null since the bot has no way of knowing the fb id)
        if (userShouldReceiveFollowupMessage(user)) {
          // send user a follow up message
          await run({
            // eslint-disable-line
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
            await run({
              // eslint-disable-line
              platform,
              userPlatformId,
              userMessage: eligibleCheckin.message,
              topic: eligibleCheckin.topic,
              recurringTaskId: eligibleCheckin.recurringTaskId,
              isMessageSentFromCheckIn
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
  if (
    followUpAppointment &&
    new Date(followUpAppointment).valueOf() < Date.now()
  ) {
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
    coachHelpResponse,
    coachDirectMessage,
    helpRequestId
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
    coachHelpResponse,
    coachDirectMessage,
    helpRequestId
  });
  try {
    await chatbot.getResponse();
  } catch (e) {
    chatbot.shouldMessageClient = false;
    chatbot.shouldUpdateClient = false;
    console.log('error with user ' + chatbot.userPlatformId);
    console.log(e);
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
