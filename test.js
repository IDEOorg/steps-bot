const bot = require('./bothelper');

setTimeout(() => {
  const message = '^template(`quickreply`, `Finished!`, `Have a few questions...`, `Working on it.`)';
  const output = message.replace(/\^template\((.*?)\)/g, '$1');
  let ay = output.match(/`(.*?)`/g);
  console.log(ay);
  // for (let i = 0; i < ay.length; i++) {
  //   console.log(ay[i]);
  // }
}, 1000);
