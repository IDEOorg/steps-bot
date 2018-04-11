require('dotenv').config();
const Botkit = require('botkit');
const firebase = require('firebase');
const RiveScript = require('rivescript');

setupFirebase();
const self = this;
self.riveBot = setupRiveScript();
self.userStatus = null;
const controller = setupBotkitServer();
// setInterval(() => {
//   console.log('hey');
// }, 300000);

controller.hears('.*', 'message_received', (bot, message) => {
  if (!self.userStatus) {
    self.riveBot.reply('bagel', message, self);
    self.userStatus = 'newtask';
  } else if (self.userStatus === 'newtask') {
    self.riveBot.reply('bagel', 'message', self);
  }
});

function setupBotkitServer() {
  const newController = Botkit.twiliosmsbot({
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_number: process.env.TWILIO_NUMBER,
    debug: true
  });

  const instance = newController.spawn({});

  newController.setupWebserver(process.env.PORT || 3000, () => {
    newController.createWebhookEndpoints(newController.webserver, instance, () => {
      console.log('TwilioSMSBot is online!');
    });
  });
}

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('chatscripts');
  bot.sortReplies();
  return bot;
}

function setupFirebase() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'bedstuy-bdf4e.firebaseapp.com',
    databaseURL: 'https://bedstuy-bdf4e.firebaseio.com',
    projectId: 'bedstuy-bdf4e',
    storageBucket: 'bedstuy-bdf4e.appspot.com'
  };
  firebase.initializeApp(config);
}
