const { BitlyClient } = require('bitly');

const bitlyClient = new BitlyClient(process.env.BITLY_TOKEN, {});

async function shortenURL(url) {
  const shortenedURL = await bitlyClient
    .shorten(url)
    .then((result) => {
      return result.url;
    }).catch((error) => {
      console.error(error);
    });
  return shortenedURL;
}

module.exports = {
  shortenURL
};
