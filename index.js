require('dotenv').config()
const Botkit = require('botkit')
var firebase = require("firebase")

var config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "bedstuy-bdf4e.firebaseapp.com",
  databaseURL: "https://bedstuy-bdf4e.firebaseio.com",
  projectId: "bedstuy-bdf4e",
  storageBucket: "bedstuy-bdf4e.appspot.com"
}
firebase.initializeApp(config)

initBotkit()

 function initBotkit() {
   console.log(process.env)
   console.log(config)
   firebaseStorage = require('./botkit-storage-firebase')(config, {
     email: process.env.FIREBASE_EMAIL,
     password: process.env.FIREBASE_PASSWORD
   })
   firebaseStorage.then(function (d) {
     console.log('ddddddd')
     console.log(d)
     setupBotkit(d)
   })
 }

 function setupBotkit(storageModule) {
   const controller = Botkit.twiliosmsbot({
       account_sid: process.env.TWILIO_ACCOUNT_SID,
       auth_token: process.env.TWILIO_AUTH_TOKEN,
       twilio_number: process.env.TWILIO_NUMBER,
       debug: true,
       storage: storageModule
   })

   const bot = controller.spawn({});

   controller.setupWebserver(process.env.PORT || 3000, function (err, webserver) {
     controller.createWebhookEndpoints(controller.webserver, bot, function () {
       console.log('TwilioSMSBot is online!')
     })
   })

   initScript(bot, controller);
}

function initScript (bot, controller) {
  bot.say(
    {
        text: 'my message_text',
        channel: '+1(650)-224-0108' // a valid facebook user id or phone number
    }
  );
  controller.hears('.*', 'message_received', (bot, message) => {
    bot.createConversation(message, function (err, convo) {
      convo.addMessage({text: 'Hi there! It\'s Roo, hope you\'re ready for your task. Let\'s get started.'}, 'day1');
      convo.say('Hi there! It\'s Roo, your financial chatbot assistant\n\nCongratulations on taking that first step and seeing a financial counselor!');
      convo.say('We\'ll be in touch tomorrow with your first task.');
      convo.addQuestion({text: 'We\'ll be in touch tomorrow with your first task.'},function(res, convo) {
        convo.setTimeout(10000);
        convo.onTimeout(function(convo) {
          convo.gotoThread('day1');
          convo.next();
        });
      },{},'default');
      convo.activate();
    });
  })
}
