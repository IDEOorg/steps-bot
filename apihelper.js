const rp = require('request-promise');
const assetUrls = require('./data/assets-manifest.json');

module.exports = {
  getAllClients,
  getOrgName,
  getCoachName,
  getCoach,
  getClientTasks,
  getAllMedia,
  getViewedMediaIds,
  createRequest,
  getUserRequests,
  createMessage,
  updateUser,
  updateTask,
  markMediaAsViewed,
  getUserDataFromDB
};

async function getAllClients() {
  const clients = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients'
  });
  return JSON.parse(clients);
}

async function getOrgName(id) {
  let org = await rp({
    method: 'GET',
    uri: assetUrls.url + '/orgs/' + id.toString()
  });
  org = JSON.parse(org);
  if (org) {
    return org.name;
  }
  return null;
}

async function getCoachName(id) {
  let coach = await rp({
    method: 'GET',
    uri: assetUrls.url + '/coaches/' + id.toString()
  });
  coach = JSON.parse(coach);
  if (coach) {
    return coach.first_name;
  }
  return null;
}

async function getCoach(id) {
  const coach = await rp({
    method: 'GET',
    uri: assetUrls.url + '/coaches/' + id.toString()
  });
  return JSON.parse(coach);
}

async function getClientTasks(id) {
  let tasks = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/tasks'
  });
  tasks = JSON.parse(tasks);
  return tasks;
}

async function getAllMedia() {
  let listOfMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/media'
  }).catch((e) => {
    // // console.log(e);
  });
  listOfMedia = JSON.parse(listOfMedia);
  return listOfMedia.filter((media) => {
    return media.task_id === null && (media.type === 'STORY' || media.type === 'GENERAL_EDUCATION');
  });
}

async function getViewedMediaIds(id) {
  let viewedMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/viewed_media'
  }).catch((e) => {
    // console.log(e);
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
    json: true
  }).catch((e) => {
    // console.log(e);
  });
  return request;
}

async function getUserRequests(userId) {
  const requests = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + userId + '/requests'
  });
  return JSON.parse(requests);
}

async function createMessage(requestId, clientId, otherId, messageToSend) {
  const message = await rp({
    method: 'POST',
    uri: assetUrls.url + '/messages',
    body: {
      text: messageToSend,
      to_user: otherId,
      from_user: clientId,
      media_id: null,
      request_id: requestId,
      timestamp: new Date(),
      responses: null
    },
    json: true
  });
  return message;
}

async function updateUser(userId, userData) {
  const user = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/clients/' + userId,
    body: userData,
    json: true
  }).catch((e) => {
    // console.log(e);
  });
  return user;
}

async function updateTask(id, taskData) {
  const task = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/tasks/' + id,
    body: taskData,
    json: true
  });
  return task;
}

async function markMediaAsViewed(clientId, mediaId) {
  const media = await rp({
    method: 'POST',
    uri: assetUrls.url + '/clients/' + clientId + '/viewed_media/' + mediaId,
    json: true
  }).catch((e) => {
    // console.log(e);
  });
  return media;
}

// if there's a user, return api/client/id data, otherwise return null
async function getUserDataFromDB(platform, userPlatformId) {
  const clients = await getAllClients();
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (platform === 'sms' && (client.phone === userPlatformId || '+1' + client.phone === userPlatformId)) {
      client.phone = userPlatformId;
      return client;
    }
    if (platform === 'fb' && client.fb_id === userPlatformId) {
      return client;
    }
  }
  return null;
}
