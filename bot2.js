require('dotenv').config();
const bot = require('./bothelper');
const sender = require('./senderhelper');
const Botkit = require('botkit');
const firebase = require('firebase');
const server = require('./server.js');
// const moment = require('moment-timezone');

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

setupFirebase().then((db) => {
  // Wildcard hears response, will respond to all user input with 'Hello World!'
  fbController.hears('.*', 'message_received', (_, message) => {
    const userId = message.user;
    const userMessage = message.text;
    console.log('message********************************************');
    console.log(message);
    bot.getResponse(db, 'fb', userId, userMessage).then((response) => {
      sender.sendReply('fb', userId, response.messages);
      updateFirebase(db, response.variables);
    });
  });

  twilioController.hears('.*', 'message_received', (_, message) => {
    const userId = message.user;
    const userMessage = message.text;
    bot.getResponse(db, 'sms', userId, userMessage).then((response) => {
      sender.sendReply('sms', userId, response.messages);
      updateFirebase(db, response.variables);
    });
  });
  // setInterval(() => {
  //   const usersRef = db.ref('users');
  //   usersRef.once('value').then((snapshot) => {
  //     const usersData = snapshot.val();
  //     const users = Object.keys(usersData);
  //     for (let i = 0; i < users.length; i++) {
  //       const userId = users[i];
  //       const futureCheckIns = usersData[userId].followUpCheckIns;
  //       if (futureCheckIns) {
  //         const checkInIds = Object.keys(futureCheckIns);
  //         for (let j = 0; j < checkInIds.length; j++) {
  //           const checkInId = checkInIds[j];
  //           const {
  //             date,
  //             topic,
  //             message
  //           } = futureCheckIns[checkInId];
  //           if (date < Date.now()) {
  //             bot.getResponse(db, 'fb', userId, message);
  //           }
  //         }
  //       }
  //     }
  //   });
  // }, 300000);
});

async function setupFirebase() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'bedstuy-bdf4e.firebaseapp.com',
    databaseURL: 'https://bedstuy-bdf4e.firebaseio.com',
    projectId: 'bedstuy-bdf4e',
    storageBucket: 'bedstuy-bdf4e.appspot.com'
  };
  firebase.initializeApp(config);
  await firebase.auth().signInWithEmailAndPassword(process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD);
  return firebase.database();
}

function updateFirebase(db, variables) {

}
function getNextCheckInDate(days, hours, timeOfDay) {
  if (!days && !hours && !timeOfDay) {
    return null;
  }
  let checkInDate = moment();
  if (days) {
    checkInDate = checkInDate.add(parseInt(days, 10), 'days');
  }
  if (hours) {
    checkInDate = checkInDate.add(parseInt(hours, 10), 'hours');
    return checkInDate.valueOf();
  }
  if (timeOfDay) {
    if (timeOfDay.toUpperCase() === 'MORNING') {
      checkInDate = checkInDate.hours(9).minutes(0).seconds(0);
    } else if (timeOfDay.toUpperCase() === 'AFTERNOON') {
      checkInDate = checkInDate.hours(14).minutes(30).seconds(0);
    }
  }
  return checkInDate.tz('America/New_York').valueOf();
}
