const rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const log4js = require('log4js');

const log = log4js.getLogger('deleteuser.js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const url = 'https://steps-admin.herokuapp.com/api';

deleteUser(1303);

async function deleteUser(id) {
  const media = await rp({
    method: 'GET',
    uri: url + '/media',
    json: true,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  });
  let messages = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/messages',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  });
  messages = JSON.parse(messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/messages/' + message.id,
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      }
    }).catch((e) => {
      log.error(e);
      sgMail.send({
        to: 'support@helloroo.zendesk.com',
        from: 'no-reply@helloroo.org',
        subject: 'Roo bot error',
        text: `An error occurred on the bot server: \n ${e}`,
      });
    });
  }
  let requests = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/requests',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  });
  requests = JSON.parse(requests);
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/requests/' + request.id,
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      }
    });
  }
  let tasks = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/tasks',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    log.error(e);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
  tasks = JSON.parse(tasks);
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    for (let j = 0; j < media.length; j++) {
      const m = media[j];
      if (m.task_id === task.id) {
        await rp({ // eslint-disable-line
          method: 'DELETE',
          uri: url + '/media/' + m.id,
          headers: {
            Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
          }
        }).catch((e) => {
          log.error(e);
        });
      }
    }
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/tasks/' + task.id,
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      }
    }).catch((e) => {
      log.error(e);
      sgMail.send({
        to: 'support@helloroo.zendesk.com',
        from: 'no-reply@helloroo.org',
        subject: 'Roo bot error',
        text: `An error occurred on the bot server: \n ${e}`,
      });
    });
  }
  let viewedMedia = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/viewed_media',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  });
  viewedMedia = JSON.parse(viewedMedia);
  for (let i = 0; i < viewedMedia.length; i++) {
    const viewed = viewedMedia[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/clients/' + id + '/viewed_media/' + viewed.id,
      headers: {
        Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
      }
    }).catch((e) => {
      log.debug(viewed.id + ' not deleted');
      log.error(e);
      // sgMail.send({
      //   to: 'support@helloroo.zendesk.com',
      //   from: 'no-reply@helloroo.org',
      //   subject: 'Roo bot error',
      //   text: `An error occurred on the bot server: \n ${e}`,
      // });
    });
  }
  await rp({
    method: 'DELETE',
    uri: url + '/clients/' + id,
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    }
  }).catch((e) => {
    log.debug('client not deleted');
    log.error(e);
    // sgMail.send({
    //   to: 'support@helloroo.zendesk.com',
    //   from: 'no-reply@helloroo.org',
    //   subject: 'Roo bot error',
    //   text: `An error occurred on the bot server: \n ${e}`,
    // });
  });
}
