require('dotenv').config();
const bot = require('./bothelper');
const sender = require('./senderhelper');
const api = require('./apihelper');
const updater = require('./updater');
const Botkit = require('botkit');
const server = require('./server.js');

// Create the Botkit controller, which controls all instances of the bot.
const fbController = Botkit.facebookbot({
  verify_token: process.env.FB_VERIFY_TOKEN,
  access_token: process.env.FB_PAGE_ACCESS_TOKEN,
  require_delivery: true,
  receive_via_postback: true
});
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
  const body = req.body;
  console.log(body.entry);
  console.log(body.entry[0].messaging[0]);
  res.status(200);
  res.send('ok');
}
fbController.hears('.*', 'message_received,facebook_postback', (_, message) => {
  const userPlatformId = message.user;
  const userMessage = message.text;
  // get message payload here for new users
  const fbNewUserId = userPlatformId;
  console.log(message);
  console.log('awesome');
  bot.getResponse('fb', userPlatformId, userMessage, null, fbNewUserId).then((response) => {
    console.log(response);
    sender.sendReply('fb', userPlatformId, response.messages).then(() => {
      updater.updateUserToDB(userPlatformId, 'fb', response.variables).then(() => {
        bot.resetVariables(userPlatformId);
      });
    });
  });
});

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
