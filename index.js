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
server(fbEndpoint, twilioController, getCoachResponse);

function fbEndpoint(req, res) {
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
    return; // this is critical. If it's not a message being sent to the api then it's a delivery receipt confirmation, which if not exited will cause an infinite loop and get you banned on fb messenger
  }
  // get message payload here for new users
  bot.getResponse('fb', userPlatformId, userMessage, null, fbNewUserPhone).then((response) => {
    sender.sendReply('fb', userPlatformId, response.messages).then(() => {
      if (response.variables) {
        const idToUpdate = fbNewUserPhone || userPlatformId;
        updater.updateUserToDB(idToUpdate, 'fb', response.variables).then(() => {
          bot.resetVariables(userPlatformId);
        });
      }
    }).catch((e) => {
      if (response.variables) {
        const idToUpdate = fbNewUserPhone || userPlatformId;
        updater.updateUserToDB(idToUpdate, 'fb', response.variables).then(() => {
          bot.resetVariables(userPlatformId);
        });
      }
      console.log(e);
    });
  });
}

twilioController.hears('.*', 'message_received', (_, message) => {
  const userPlatformId = message.user;
  const userMessage = message.text;

  bot.getResponse('sms', userPlatformId, userMessage).then((response) => {
    if (response !== null) {
      sender.sendReply('sms', userPlatformId, response.messages).then(() => {
        updater.updateUserToDB(userPlatformId, 'sms', response.variables).then(() => {
          bot.resetVariables(userPlatformId);
        }).catch((e) => {
          console.log(e);
        });
      }).catch((e) => {
        console.log(e);
        updater.updateUserToDB(userPlatformId, 'sms', response.variables).then(() => {
          bot.resetVariables(userPlatformId);
        }).catch((err) => {
          console.log(err);
        });
      });
    }
  }).catch((e) => {
    console.log(e);
  });
});
setInterval(() => {
  updateAllClients();
}, 5400000); // 1800000 is 30 minutes

async function updateAllClients() {
  const isUpdateMessage = true;
  let users = [];
  const currentTimeHour = (new Date()).getHours();
  if (currentTimeHour > 12 || currentTimeHour < 4) {
    users = await api.getAllClients();
  }
  users = await api.getAllClients();
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const checkIns = user.checkin_times;
    const followUpAppointment = user.follow_up_date;
    const eligibleCheckIns = [];
    let platform = null;
    let userPlatformId = null;
    if (user.platform === 'FBOOK') {
      platform = 'fb';
      userPlatformId = user.fb_id;
    } else {
      platform = 'sms';
      userPlatformId = user.phone;
    }
    if (followUpAppointment && new Date(followUpAppointment).valueOf() < Date.now() && user.id === 759) {
      bot.getResponse(platform, userPlatformId, 'startprompt', 'followup', null, null, null).then((response) => { // eslint-disable-line
        sender.sendReply(platform, userPlatformId, response.messages, isUpdateMessage).then(() => {
          updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
            bot.resetVariables(userPlatformId);
          }).catch((e) => {
            console.log(e);
          });
        }).catch((e) => {
          console.log(e);
          updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
            bot.resetVariables(userPlatformId);
          }).catch((err) => {
            console.log(err);
          });
        });
      }).catch((e) => {
        console.log(e);
      });
    }
    if (checkIns) {
      for (let j = checkIns.length - 1; j >= 0; j--) {
        const checkIn = checkIns[j];
        if (checkIn.time < Date.now()) {
          eligibleCheckIns.push(checkIns.splice(checkIns[j], 1)[0]);
        }
      }
      if (platform !== null && userPlatformId !== null) {
        for (let j = 0; j < eligibleCheckIns.length; j++) {
          const checkIn = eligibleCheckIns[j];
          // arguments for below function are wrong
          await sleep(2000); // eslint-disable-line
          bot.getResponse(platform, userPlatformId, checkIn.message, checkIn.topic, null, null, checkIn.task_id).then((response) => { // eslint-disable-line
            sender.sendReply(platform, userPlatformId, response.messages, isUpdateMessage).then(() => {
              updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
                bot.resetVariables(userPlatformId);
              }).catch((e) => {
                console.log(e);
              });
            }).catch((e) => {
              console.log(e);
              updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
                bot.resetVariables(userPlatformId);
              }).catch((err) => {
                console.log(err);
              });
            });
          }).catch((e) => {
            console.log(e);
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
        let platform = 'sms';
        let userPlatformId = user.phone;
        if (user.platform === 'FBOOK') {
          platform = 'fb';
          userPlatformId = user.fb_id;
        }
        bot.getResponse(platform, userPlatformId, 'startprompt', 'helpcoachresponse', null, coachMessage.text).then((response) => {
          sender.sendReply(platform, userPlatformId, response.messages).then(() => {
            if (response.variables) {
              updater.updateUserToDB(userPlatformId, 'fb', response.variables).then(() => {
                bot.resetVariables(userPlatformId);
              });
            }
          }).catch((e) => {
            console.log(e);
            updater.updateUserToDB(userPlatformId, platform, response.variables).then(() => {
              bot.resetVariables(userPlatformId);
            }).catch((err) => {
              console.log(err);
            });
          });
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
