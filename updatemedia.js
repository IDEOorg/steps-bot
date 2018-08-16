const rp = require('request-promise');
const assetUrls = require('./data/assets-manifest.json');
require('dotenv').config();
 const data = {
  id: 41,
  task_id: null,
  title: "Nicole's Story",
  category: "PODCAST",
  description: "Check out Nicole's story and learn how financial coaching helped her.",
  url: "https://soundcloud.com/roothebot/nicole",
  image: "https://s3.amazonaws.com/steps-application-public/media_assets/podcast_nicole_382_200.jpg",
  published_by: 3,
  type: 'STORY'
};
 updateMedia(data, 41);
 async function updateMedia(data, id) {
  await rp({ // eslint-disable-line
    method: 'PUT',
    uri: process.env.API_URL + '/media/' + id,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    body: data,
    json: true
  }).catch((e) => {
    console.log(e);
  });
}
