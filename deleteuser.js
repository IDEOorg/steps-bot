const rp = require('request-promise');
const sgMail = require('@sendgrid/mail');

const url = 'https://helloroo.org/api';

deleteUser(201);

async function deleteUser(id) {
  const media = await rp({
    method: 'GET',
    uri: url + '/media',
    json: true
  });
  let messages = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/messages'
  });
  messages = JSON.parse(messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/messages/' + message.id
    }).catch((e) => {
      console.log(e);
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
    uri: url + '/clients/' + id + '/requests'
  });
  requests = JSON.parse(requests);
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/requests/' + request.id
    });
  }
  let tasks = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/tasks'
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
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    for (let j = 0; j < media.length; j++) {
      const m = media[j];
      if (m.task_id === task.id) {
        await rp({ // eslint-disable-line
          method: 'DELETE',
          uri: url + '/media/' + m.id
        }).catch((e) => {
          console.log(e);
        });
      }
    }
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/tasks/' + task.id
    }).catch((e) => {
      console.log(e);
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
    uri: url + '/clients/' + id + '/viewed_media'
  });
  viewedMedia = JSON.parse(viewedMedia);
  for (let i = 0; i < viewedMedia.length; i++) {
    const viewed = viewedMedia[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/clients/' + id + '/viewed_media/' + viewed.id
    }).catch((e) => {
      sgMail.send({
        to: 'support@helloroo.zendesk.com',
        from: 'no-reply@helloroo.org',
        subject: 'Roo bot error',
        text: `An error occurred on the bot server: \n ${e}`,
      });
    });
  }
  rp({
    method: 'DELETE',
    uri: url + '/clients/' + id
  }).catch((e) => {
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${e}`,
    });
  });
}
