const rp = require('request-promise');


const options = {
  method: 'POST',
  uri: 'https://localhost:3001/api/clients',
  body: {
    some: 'payload'
  },
  json: true // Automatically stringifies the body to JSON
};

rp(options)
  .then((response) => {
    console.log(response);
  }).catch((err) => {
    console.log(err);
  });
