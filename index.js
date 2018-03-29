require('dotenv').config();
const Botkit = require('botkit');
const firebase = require('firebase');

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'bedstuy-bdf4e.firebaseapp.com',
  databaseURL: 'https://bedstuy-bdf4e.firebaseio.com',
  projectId: 'bedstuy-bdf4e',
  storageBucket: 'bedstuy-bdf4e.appspot.com'
};
firebase.initializeApp(config);

setupBotkit();

function setupBotkit() {
  const controller = Botkit.twiliosmsbot({
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_number: process.env.TWILIO_NUMBER,
    debug: true
  });

  const instance = controller.spawn({});

  controller.setupWebserver(process.env.PORT || 3000, () => {
    controller.createWebhookEndpoints(controller.webserver, instance, () => {
      console.log('TwilioSMSBot is online!');
    });
  });

  controller.hears('.*', 'message_received', (bot, message) => {
    bot.createConversation(message, (err, convo) => {
      convo.addMessage({ text: 'Hi there! It\'s Roo, hope you\'re ready for your task. Let\'s get started.' }, 'day1');
      convo.say('Hi there! It\'s Roo, your financial chatbot assistant\n\nCongratulations on taking that first step and seeing a financial counselor!');
      convo.say('We\'ll be in touch tomorrow with your first task.');
      convo.activate();
    });
  });
}
