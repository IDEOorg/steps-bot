const bot = require('./bothelper');

bot.setupFirebase().then((db) => {
  bot.getResponse(db, 'fb', '10', 'startprompt').then((response) => {
    console.log(response);
  });
});
