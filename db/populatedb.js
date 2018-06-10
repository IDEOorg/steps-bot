const rp = require('request-promise');

const options = {
  method: 'POST',
  uri: 'http://api.posttestserver.com/post',
  body: {
    some: 'payload'
  },
  json: true // Automatically stringifies the body to JSON
};

rp(options)
.then(function (parsedBody) {
    // POST succeeded...
})
.catch(function (err) {
    // POST failed...
});
