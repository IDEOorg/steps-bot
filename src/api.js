const constants = require ('./constants');
const rp = require ('request-promise');
const sgMail = require ('@sendgrid/mail');
const {trackMessageSent} = require ('./tracker');
require ('dotenv').config ();

const TOPICS = constants.TOPICS;
const STATUS = constants.STATUS;

sgMail.setApiKey (process.env.SENDGRID_API_KEY);

async function getAllClients() {
  let clients = null;
  try {
    clients = await rp({
      method: 'GET',
      uri: `${process.env.API_URL}/clients`,
      headers: {
        Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
      },
      json: true,
    });
  } catch (e) {
    console.log('getAllClients api method failed', e.message);
    if (e.statusCode === 401) {
      return constants.UNAUTHORIZED;
    }
    sendErrorToZendesk(e);
  }
  return clients;
}

/**
 * Fetches the details of an organization from the steps app database
 * @param {number} id
 * @returns {object | null} organization info or nothing
 */
async function getOrg(id) {
  const org = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/orgs/${id.toString()}`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true
  }).catch((e) => {
    console.log('getOrg api method failed for org id ' + id, e.message);
    sendErrorToZendesk(e);
  });
  if (org) {
    return org;
  }
  return null;
}

async function getCoach(id) {
  const coach = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/users/${id.toString ()}`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true
  }).catch((e) => {
    console.log('getCoach api method failed for coach id ' + id, e.message);
    sendErrorToZendesk(e);
  });
  return coach;
}

async function getClientTasks(id) {
  const tasks = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/clients/${id.toString()}/tasks`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true
  }).catch((e) => {
    console.log(
      'getClientTasks api method failed for client id ' + id,
      e.message
    );
    sendErrorToZendesk(e);
  });
  return tasks;
}

async function getAllMedia() {
  let listOfMedia = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/media`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    }
  }).catch((e) => {
    console.log('getAllMedia method failed', e.message);
    sendErrorToZendesk(e);
  });
  listOfMedia = JSON.parse(listOfMedia);
  return listOfMedia.filter((media) => {
    return (
      media.task_id === null &&
      (media.type === 'STORY' || media.type === 'GENERAL_EDUCATION')
    );
  });
}

async function getViewedMediaIds(id) {
  let viewedMedia = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/clients/${id.toString()}/viewed_media`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
    }
  }).catch((e) => {
    console.log(
      'getViewedMediaIds method failed for client id ' + id,
      e.message
    );
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
    uri: `${process.env.API_URL}/requests`,
    body: {
      status: STATUS.NEEDS_ASSISTANCE,
      user_id: userId,
      task_id: taskId,
    },
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true,
  }).catch((e) => {
    console.log(
      'createRequest method failed with user id ' +
        userId +
        ' on task id ' +
        taskId,
      e.message
    );
    sendErrorToZendesk(e);
  });
  return request;
}

async function setRequestByTaskId(requestId, clientId, taskId, status) {
  if (clientId) {
    await rp({
        // eslint-disable-line
      method: 'PUT',
      uri: `${process.env.API_URL}/requests/${requestId}`,
      headers: {
        Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
      },
      body: {
        status,
        user_id: clientId,
        task_id: taskId
      },
      json: true
    }).catch((e) => {
      console.log(
        'setRequestByTaskId failed: issue in the for loop',
        e.message
      );
      sendErrorToZendesk(e);
    });
  }
}

async function getUserRequests(userId) {
  const requests = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/clients/${userId}/requests`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true,
  }).catch((e) => {
    console.log('getUserRequests method failed for user ' + userId, e.message);
    sendErrorToZendesk(e);
  });
  return requests;
}

async function getUserMessages(userId) {
  const messages = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/clients/${userId}/messages`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true,
  }).catch((e) => {
    console.log('getUserMessages method failed for user ' + userId, e.message);
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
    topic: topic || TOPICS.NO_TOPIC,
    responses: null
  };
  const message = await rp({
    method: 'POST',
    uri: `${process.env.API_URL}/messages`,
    body,
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
    }
  }).catch((e) => {
    console.log(
      'createMessage method failed for user ' + fromId + ' to ' + toId,
      e.message
    );
    sendErrorToZendesk(e);
  });

  if (fromId !== 41) trackMessageSent(body);

  return message;
}

async function updateUser(userId, userData) {
  const user = await rp({
    method: 'PUT',
    uri: `${process.env.API_URL}/clients/${userId}`,
    body: userData,
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
    }
  }).catch((e) => {
    console.log('updateUser method failed for user ' + userId, e.message);
    sendErrorToZendesk(e);
  });
  return user;
}

async function updateTask(id, taskData) {
  const task = await rp({
    method: 'PUT',
    uri: `${process.env.API_URL}/tasks/${id}`,
    body: taskData,
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
    }
  }).catch((e) => {
    console.log('failed to update task with id ' + id, e.message);
    sendErrorToZendesk(e);
  });
  return task;
}

async function markMediaAsViewed(clientId, mediaId) {
  if (mediaId) {
    const media = await rp({
      method: 'POST',
      uri: `${process.env.API_URL}/clients/${clientId}/viewed_media/${mediaId}`,
      json: true,
      headers: {
        Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
      }
    }).catch((e) => {
      console.log(
        'failed to mark media as viewed with media id ' + mediaId,
        e.message
      );
      sendErrorToZendesk(e);
    });
    return media;
  }
  return null;
}

async function getUserFromId(id) {
  const user = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/users/${id}`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`
    }
  }).catch((e) => {
    console.log('getUserFromId failed to find user id ' + id, e.message);
    sendErrorToZendesk(e);
  });
  return JSON.parse(user);
}

async function getTask(id) {
  const task = await rp({
    method: 'GET',
    uri: `${process.env.API_URL}/tasks/${id}`,
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_ACCESS_TOKEN}`,
    },
    json: true,
  }).catch((e) => {
    console.log('getTask failed to find task id ' + id, e.message);
    sendErrorToZendesk(e);
  });
  return task;
}

// if there's a user, return api/client/id data, otherwise return null
async function getUserDataFromDB(platform, userPlatformId) {
  const clients = await this.getAllClients();
  if (clients === constants.UNAUTHORIZED) {
    return constants.UNAUTHORIZED;
  }
  if (!clients) {
    return null;
  }
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (
      platform === constants.SMS &&
      client.phone !== null &&
      (client.phone === userPlatformId ||
        formatPhoneNumber(client.phone) === userPlatformId)
    ) {
      client.phone = userPlatformId;
      return client;
    }
    if (platform === constants.FB && client.fb_id === userPlatformId) {
      return client;
    }
    if (
      platform === constants.FB &&
      (client.phone === userPlatformId ||
        formatPhoneNumber(client.phone) === userPlatformId)
    ) {
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
    text: `An error occurred on the bot server: \n ${error}`
  });
}

module.exports = {
  getAllClients,
  getOrg,
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
};
