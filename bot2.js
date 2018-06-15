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
  debug: true
});
const twilioController = Botkit.twiliosmsbot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER,
  debug: true
});
// Set up an Express-powered webserver to expose oauth and webhook endpoints
// We are passing the controller object into our express server module
// so we can extend it and process incoming message payloads
server(fbController, twilioController);
api.getAllUsers().then((users) => {
  console.log(users);
});

// Wildcard hears response, will respond to all user input with 'Hello World!'
fbController.hears('.*', 'message_received,facebook_postback', (_, message) => {
  const userId = message.user;
  const userMessage = message.text;
  bot.getResponse('fb', userId, userMessage).then((response) => {
    sender.sendReply('fb', userId, response.messages).then(() => {
      updater.updateFirebase(db, userId, response.variables);
      bot.resetVariables(userId);
    });
  });
});

twilioController.hears('.*', 'message_received', (_, message) => {
  const userId = message.user;
  const userMessage = message.text;
  bot.getResponse('sms', userId, userMessage).then((response) => {
    sender.sendReply('sms', userId, response.messages);
    updater.updateFirebase(db, userId, response.variables);
  });
});
setInterval(() => {
  const users = getAllUsers();
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
      let userId = null;
      if (user.platform === 'FBOOK') {
        platform = 'fb';
        userId = user.fb_id;
      } else { // sms
        platform = 'sms';
        userId = user.phone;
      }
      for (let j = 0; j < eligibleCheckIns.length; j++) {
        const checkIn = eligibleCheckIns[j];
        bot.getResponse(platform, userId, checkIn.message, checkIn.time).then((response) => { // eslint-disable-line
          sender.sendReply(platform, userId, response.messages).then(() => {
            updater.updateFirebase(db, userId, response.variables);
            bot.resetVariables(userId);
          });
        });
      }
    }
  }
}, 3600000);

async function getAllUsers() {
  const users = await api.getAllUsers();
  return users;
}
