const rp = require('request-promise');
const assetUrls = require('./data/assets-manifest.json');
const seedTasksData = require('./db/seedtasks.json');
const sgMail = require('@sendgrid/mail');
const { trackMessageSent } = require('./tracker');

const botId = 41;

async function getAllClients() {
  const clients = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients'
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return JSON.parse(clients);
}

async function getOrgName(id) {
  let org = await rp({
    method: 'GET',
    uri: assetUrls.url + '/orgs/' + id.toString()
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
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
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
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
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return JSON.parse(coach);
}

async function getClientTasks(id) {
  let tasks = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/tasks'
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  tasks = JSON.parse(tasks);
  return tasks;
}

async function getAllMedia() {
  let listOfMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/media'
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
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
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
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
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return request;
}

async function getUserRequests(userId) {
  const requests = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + userId + '/requests'
  }).catch((e) => {
    console.log(e);
  });
  return JSON.parse(requests);
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
    json: true
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });

  trackMessageSent(body);

  return message;
}

async function updateUser(userId, userData) {
  console.log('updateUser func');
  console.log(userId);
  console.log(userData);
  const user = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/clients/' + userId,
    body: userData,
    json: true
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return user;
}

async function updateTask(id, taskData) {
  const task = await rp({
    method: 'PUT',
    uri: assetUrls.url + '/tasks/' + id,
    body: taskData,
    json: true
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return task;
}

async function markMediaAsViewed(clientId, mediaId) {
  const media = await rp({
    method: 'POST',
    uri: assetUrls.url + '/clients/' + clientId + '/viewed_media/' + mediaId,
    json: true
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  return media;
}

// if there's a user, return api/client/id data, otherwise return null
async function getUserDataFromDB(platform, userPlatformId) {
  const clients = await getAllClients();
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (platform === 'sms' && client.phone !== null && (client.phone === userPlatformId || '+1' + client.phone === userPlatformId)) {
      client.phone = userPlatformId;
      return client;
    }
    if (platform === 'fb' && client.fb_id === userPlatformId) {
      return client;
    }
    if (platform === 'fb' && (client.phone === userPlatformId || '+1' + client.phone === userPlatformId)) {
      return client;
    }
  }
  return null;
}

async function createMockTasks(id) {
  const tasks = seedTasksData.tasks;
  for (let i = 0; i < 7; i++) {
    const taskData = tasks[i];
    taskData.date_created = new Date();
    taskData.user_id = id;
    await rp({ // eslint-disable-line
      method: 'POST',
      uri: assetUrls.url + '/tasks',
      body: taskData,
      json: true
    }).catch((err) => {
      console.log(err);
      sgMail.send({
        to: 'support@helloroo.zendesk.com',
        from: 'no-reply@helloroo.org',
        subject: 'Roo bot error',
        text: `An error occurred on the bot server: \n ${err}`,
      });
    });
  }
}


async function createMockFBUser(userPlatformId) {
  const userData = {
    first_name: 'Friend',
    last_name: 'Friend',
    email: 'test123@ideo.org',
    phone: null,
    coach_id: 2,
    org_id: 3,
    color: 'blue',
    goals: [
      'Buy a house'
    ],
    status: 'WORKING',
    updated: new Date(),
    platform: 'FBOOK',
    image: null,
    follow_up_date: '2018-07-18T12:14:58.914Z',
    plan_url: null,
    checkin_times: [],
    topic: null,
    fb_id: userPlatformId,
    temp_help_response: null
  };
  const user = await rp({
    method: 'POST',
    uri: assetUrls.url + '/clients',
    body: userData,
    json: true
  }).catch((e) => {
    console.log(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  await createMockTasks(user.id);
  return user;
}

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
  getUserDataFromDB,
  botId
};
