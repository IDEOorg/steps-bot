/* eslint-disable function-paren-newline */
const throng = require('throng');
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
const handleError = require('./utilities/errorHandler');
const errorConstants = require('./utilities/constants');

const WORKERS = process.env.WEB_CONCURRENCY || 1;

/**
 * @description This creates node cluster workers for bot app
 * Workers maximizes the CPU utility and ensure that the bot runs with less likelihood of a downtime
 * For more info, see: https://devcenter.heroku.com/articles/node-concurrency
 */
throng({
  workers: WORKERS,
  lifetime: Infinity,
  master: masterProcess,
  start,
});

function start() {
  // Set up an Express-powered webserver to webhook endpoints
  server(
    fbEndpoint,
    twilioReceiveSmsController,
    getCoachResponse,
    testTwilioCredentialsController,
  );
}

/**
 * @description this function will only run on the master process.
 * It is used to send followups to clients with due followup dates
 * every 24 hours.
 *
 * @returns {void}
 */
function masterProcess() {
  setInterval(() => {
    messageAllClientsWithOverdueCheckinsOrFollowups();
  }, 86400000);
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
    userMessage,
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
    const message = await twilioClient.messages.create({
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
        messageObject.postback.referral.ref,
      );
    }
  } else {
    return; // this is critical. Do not delete without thorough testing. If it's not a message being sent to the api then it could be a delivery receipt confirmation, which if not exited will cause an infinite loop, send hundreds of messages per minute to a user, and get you banned on fb messenger
  }
  await run({
    platform: constants.FB,
    userPlatformId,
    userMessage,
    fbNewUserPhone,
  });
}

async function getCoachResponse(req, res) {
  try {
    if (req.query && req.query.user_id) {
      const userId = req.query.user_id;
      const coachMessage = await getMostRecentUserMessage(userId);
      if (coachMessage && coachMessage.to_user === parseInt(userId, 10)) {
        // if the coach message exists and the person receiving the message is the user (this should always be true)
        const user = await api.getUserFromId(userId);
        const platform =
          user.platform === 'FBOOK' ? constants.FB : constants.SMS;
        const userPlatformId =
          user.platform === 'FBOOK' ? user.fb_id : user.phone;

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
            helpRequestId: coachMessage.request_id,
          });
        }
      } else {
        console.log("coach's message was not received by client " + userId);
      }
      res.send('OK');
    }
  } catch (e) {
    e.custom =
      "There's been an error. \n Error occurred while trying to fetch coach's response";
    console.log(e.custom, e);
  }
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

/**
 * @description Messages all clients with due checkins or followups
 *
 * @returns {void}
 */
async function messageAllClientsWithOverdueCheckinsOrFollowups() {
  const isMessageSentFromCheckIn = true;
  const clients = await api.getClientsWithOverdueFollowups();

  if (!clients.length) {
    return;
  }

  await Promise.all(
    clients.map(async (client) => {
      const platform =
        client.platform === 'FBOOK' ? constants.FB : constants.SMS;
      const clientPlatformId =
        client.platform === 'FBOOK' ? client.fb_id : client.phone;

      await run({
        platform,
        userPlatformId: clientPlatformId,
        userMessage: 'startprompt',
        topic: 'followup',
        isMessageSentFromCheckIn,
      });

      const eligibleCheckins = getAllCheckinMessagesUserShouldReceive(client);

      await Promise.all(
        eligibleCheckins.map(async (checkin) => {
          await run({
            platform,
            userPlatformId: clientPlatformId,
            userMessage: checkin.message,
            topic: checkin.topic,
            recurringTaskId: checkin.recurringTaskId,
            isMessageSentFromCheckIn,
          });
        }),
      );
    }),
  );
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
    helpRequestId,
  } = opts;
  const rivebot = new Rivebot();
  await handleError(
    rivebot.loadChatScripts(),
    errorConstants.LOAD_CHAT_SCRIPTS,
  );
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
    helpRequestId,
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
      isMessageSentFromCheckIn,
    });
    await messenger.sendReply();
  }
  if (chatbot.client && chatbot.shouldUpdateClient) {
    const variables = await rivebot.getVariables(userPlatformId);
    const updater = new Updater({
      userPlatformId,
      client: chatbot.client,
      currentTask: chatbot.currentTask,
      variables,
    });
    await handleError(
      updater.loadNewInfoToClient(),
      errorConstants.LOAD_INFO_TO_CLIENT,
    );
    await handleError(
      updater.updateClientToDB(),
      errorConstants.UPDATE_CLIENT_TO_DB,
    );
    await handleError(
      rivebot.resetVariables(userPlatformId),
      errorConstants.RESET_VARIABLES,
    );
  }
}

/* if user clicks on http://m.me/188976981789653?ref=REFERRAL_ID`, and then presses GET START,
 * then the REFERRAL_ID, in this case the user's phone number, will be passed along as an argument.
 */
function getPhoneNumberFromFBLink(referral) {
  return '+1' + referral;
}
