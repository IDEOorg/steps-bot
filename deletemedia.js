const rp = require('request-promise');
require('dotenv').config();

const url = 'https://helloroo.org/api';

deleteMedia(47);

async function deleteMedia(id) {
  const clients = await rp({ // eslint-disable-line
    method: 'GET',
    uri: url + '/clients/',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  });
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const viewedMedia = await rp({ // eslint-disable-line
      method: 'GET',
      uri: url + '/clients/' + client.id + '/viewed_media/',
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      },
      json: true
    });
    for (let j = 0; j < viewedMedia.length; j++) {
      if (viewedMedia[j].id === id) {
        await rp({ // eslint-disable-line
          method: 'DELETE',
          uri: url + '/clients/' + client.id + '/viewed_media/' + id,
          headers: {
            Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
          }
        });
      }
    }
  }
  await rp({ // eslint-disable-line
    method: 'DELETE',
    uri: url + '/media/' + id,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  });
}
