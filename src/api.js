const rp = require('request-promise');
const assetUrls = require('./assets-manifest.json');
const sgMail = require('@sendgrid/mail');
const { trackMessageSent } = require('../tracker');
require('dotenv').config();

const botId = 41;

async function getAllClients() {
  const clients = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log('getAllClients api method failed');
    sendErrorToZendesk(e);
  });
  return clients;
}

async function getOrgName(id) {
  const org = await rp({
    method: 'GET',
    uri: assetUrls.url + '/orgs/' + id.toString(),
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log('getOrgName api method failed for org id ' + id);
    sendErrorToZendesk(e);
  });
  if (org) {
    return org.name;
  }
  return null;
}

async function getCoach(id) {
  const coach = await rp({
    method: 'GET',
    uri: assetUrls.url + '/users/' + id.toString(),
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log('getCoach api method failed for coach id ' + id);
    sendErrorToZendesk(e);
  });
  return coach;
}

async function getClientTasks(id) {
  const tasks = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/tasks',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return tasks;
}

async function getAllMedia() {
  let listOfMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/media',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  listOfMedia = JSON.parse(listOfMedia);
  return listOfMedia.filter((media) => {
    return media.task_id === null && (media.type === 'STORY' || media.type === 'GENERAL_EDUCATION');
  });
}

async function getViewedMediaIds(id) {
  let viewedMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/viewed_media',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  viewedMedia = JSON.parse(viewedMedia);
  return viewedMedia.map((media) => {
    return media.id;
  });
}

async function createRequest(userId, taskId) {
  const request = await rp({
    method: 'POST',
    uri: assetUrls.url + '/requests',
    body: {
      status: 'NEEDS_ASSISTANCE',
      user_id: userId,
      task_id: taskId
    },
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return request;
}

async function setRequestByTaskId(clientId, taskId, status) {
  if (clientId) {
    const requests = await rp({
      method: 'GET',
      uri: assetUrls.url + '/clients/' + clientId + '/requests',
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      },
      json: true
    }).catch((e) => {
      console.log(e);
    });
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (request.task_id === taskId) {
        await rp({ // eslint-disable-line
          method: 'PUT',
          uri: assetUrls.url + '/requests/' + request.id,
          headers: {
            Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
          },
          body: {
            status,
            user_id: clientId,
            task_id: taskId
          },
          json: true
        }).catch((e) => {
          console.log(e);
        });
      }
    }
  }
}

async function getUserRequests(userId) {
  const requests = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + userId + '/requests',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return requests;
}

async function getUserMessages(userId) {
  const messages = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + userId + '/messages',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return messages;
}

async function createMessage(requestId, fromId, toId, messageToSend, topic) {
  const body = {
    text: messageToSend,
    to_user: toId,
    from_user: fromId,
    media_id: null,
    request_id: requestId,
    timestamp: new Date(),
    topic: topic || 'NO_TOPIC',
    responses: null
  };

  const message = await rp({
    method: 'POST',
    uri: assetUrls.url + '/messages',
    body,
    json: true,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });

  if (fromId !== 41) trackMessageSent(body);

  return message;
}

async function updateUser(userId, userData) {
  const user = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/clients/' + userId,
    body: userData,
    json: true,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return user;
}

async function updateTask(id, taskData) {
  const task = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/tasks/' + id,
    body: taskData,
    json: true,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return task;
}

async function markMediaAsViewed(clientId, mediaId) {
  const media = await rp({
    method: 'POST',
    uri: assetUrls.url + '/clients/' + clientId + '/viewed_media/' + mediaId,
    json: true,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return media;
}

async function getUserFromId(id) {
  const user = await rp({
    method: 'GET',
    uri: assetUrls.url + '/users/' + id,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    console.log(e);
    sendErrorToZendesk(e);
  });
  return JSON.parse(user);
}

async function getTask(id) {
  const task = await rp({
    method: 'GET',
    uri: assetUrls.url + '/tasks/' + id,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  }).catch((e) => {
    console.log(e);
  });
  return task;
}

// if there's a user, return api/client/id data, otherwise return null
async function getUserDataFromDB(platform, userPlatformId) {
  const clients = await getAllClients();
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (platform === 'sms' && client.phone !== null && (client.phone === userPlatformId || formatPhoneNumber(client.phone) === userPlatformId)) {
      client.phone = userPlatformId;
      return client;
    }
    if (platform === 'fb' && client.fb_id === userPlatformId) {
      return client;
    }
    if (platform === 'fb' && (client.phone === userPlatformId || formatPhoneNumber(client.phone) === userPlatformId)) {
      return client;
    }
  }
  return null;
}

function formatPhoneNumber(unformattedNumber) {
  if (!unformattedNumber) {
    return null;
  }
  const digitsOnlyNumber = unformattedNumber.replace(/\D/g, '');
  if (digitsOnlyNumber.length === 10) {
    return '+1' + digitsOnlyNumber;
  } else if (digitsOnlyNumber.length === 11 && digitsOnlyNumber[0] === '1') {
    return '+' + digitsOnlyNumber;
  }
  return null;
}

function sendErrorToZendesk(error) {
  sgMail.send({
    to: 'support@helloroo.zendesk.com',
    from: 'no-reply@helloroo.org',
    subject: 'Roo bot error',
    text: `An error occurred on the bot server: \n ${error}`,
  });
}

module.exports = {
  getAllClients,
  getOrgName,
  getCoach,
  getClientTasks,
  getAllMedia,
  getViewedMediaIds,
  createRequest,
  getUserFromId,
  setRequestByTaskId,
  getUserRequests,
  getUserMessages,
  createMessage,
  updateUser,
  updateTask,
  markMediaAsViewed,
  getTask,
  getUserDataFromDB,
  botId
};
