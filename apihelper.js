const rp = require('request-promise');
const assetUrls = require('./data/assets-manifest.json');

module.exports = {
  getAllUsers
};

async function getAllUsers() {
  let users = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients'
  });
  users = JSON.parse(users);
  return users;
}
