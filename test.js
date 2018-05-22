const bot = require('./bothelper');

setTimeout(() => {
  console.log(bot.getResponse('fb', '10', 'start'));
}, 1000);
