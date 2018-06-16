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
  updateUser
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
  });
  listOfMedia = JSON.parse(listOfMedia);
  return listOfMedia.filter((media) => {
    return media.type === 'STORY' || media.type === 'GENERAL_EDUCATION';
  });
}

async function getViewedMediaIds(id) {
  let viewedMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/viewed_media'
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
    }
  });
  return JSON.parse(request);
}

async function getUserRequests(userId) {
  const requests = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + userId + '/requests'
  });
  return JSON.parse(requests);
}

async function createMessage(requestId, clientId, coachId, helpMessage) {
  const message = await rp({
    method: 'POST',
    uri: assetUrls.url + '/messages',
    body: {
      text: helpMessage,
      to_user: coachId,
      from_user: clientId,
      media_id: null,
      request_id: requestId,
      timestamp: new Date(),
      responses: null
    }
  });
  return JSON.parse(message);
}

async function updateUser(userId, userData) {
  const user = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/clients/' + userId,
    body: userData
  });
  return JSON.parse(user);
}
