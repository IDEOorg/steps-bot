require('dotenv').config();
const bot = require('./bothelper');
const sender = require('./senderhelper');
const api = require('./apihelper');
const updater = require('./updater');
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
server(fbEndpoint, twilioController);

function fbEndpoint(req, res) {
  res.status(200);
  res.send('ok');
  const body = req.body;
  const messageObject = body.entry[0].messaging[0];
  console.log(messageObject);
  const userPlatformId = messageObject.sender.id;
  let userMessage = null;
  let fbNewUserPhone = null;
  if (messageObject.message) {
    userMessage = messageObject.message.text;
  } else if (messageObject.postback) {
    userMessage = messageObject.postback.title;
    fbNewUserPhone = '+1' + messageObject.postback.referral.ref;
  } else {
    return; // this is critical. If it's not a message being sent to the api then it's a delivery receipt confirmation, which if not exited will cause an infinite loop
  }
  // get message payload here for new users
  bot.getResponse('fb', userPlatformId, userMessage, null, fbNewUserPhone).then((response) => {
    console.log('response0');
    console.log(response);
    sender.sendReply('fb', userPlatformId, response.messages).then(() => {
      console.log('response1');
      console.log(response);
      if (response.variables) {
        updater.updateUserToDB(userPlatformId, 'fb', response.variables).then(() => {
          bot.resetVariables(userPlatformId);
        });
      }
    });
  });
}

twilioController.hears('.*', 'message_received', (_, message) => {
  const userPlatformId = message.user;
  const userMessage = message.text;
  bot.getResponse('sms', userPlatformId, userMessage).then((response) => {
    console.log('sending message....');
    sender.sendReply('sms', userPlatformId, response.messages).then(() => {
      console.log('updating db...');
      updater.updateUserToDB(userPlatformId, 'sms', response.variables).then(() => {
        bot.resetVariables(userPlatformId);
      });
    });
  });
});
// setInterval(() => {
// updateAllClients();
// }, 1800000);

async function updateAllClients() {
  const users = await getAllClients();
  // TODO handle scenario where user has fb platform but hasn't signed up on messenger yet.
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const checkIns = user.checkin_times;
    const eligibleCheckIns = [];
    if (checkIns) {
      for (let j = checkIns.length - 1; j >= 0; j--) {
        const checkIn = checkIns[j];
        if (checkIn.time < Date.now()) {
          eligibleCheckIns.push(checkIns.splice(checkIns[j], 1)[0]);
        }
      }
      // TODO PUT request for user await for it to finish
      let platform = null;
      let userPlatformId = null;
      if (user.platform === 'FBOOK') {
        platform = 'fb';
        userPlatformId = user.fb_id;
      } else { // sms
        platform = 'sms';
        userPlatformId = user.phone;
      }
      for (let j = 0; j < eligibleCheckIns.length; j++) {
        const checkIn = eligibleCheckIns[j];
        // arguments for below function are wrong
        bot.getResponse(platform, userPlatformId, checkIn.message, checkIn.time).then((response) => { // eslint-disable-line
          sender.sendReply(platform, userPlatformId, response.messages).then(() => {
            updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
              bot.resetVariables(userPlatformId);
            });
          });
        });
      }
    }
  }
}

async function getAllClients() {
  const clients = await api.getAllClients();
  return clients;
}
