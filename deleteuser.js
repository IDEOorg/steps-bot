const rp = require('request-promise');

const url = 'https://helloroo.org/api';

deleteUser(45);

async function deleteUser(id) {
  console.log('function running....');
  let tasks = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/tasks'
  });
  tasks = JSON.parse(tasks);
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/tasks/' + task.id
    });
  }
  console.log('*********TASKS*********');
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
  console.log('*********REQUESTS*********');

  let viewedMedia = await rp({
    method: 'GET',
    uri: url + '/clients/' + id + '/viewed_media'
  });
  viewedMedia = JSON.parse(viewedMedia);
  for (let i = 0; i < viewedMedia.length; i++) {
    const viewed = viewedMedia[i];
    console.log('viewed');
    console.log(viewed);
    await rp({ // eslint-disable-line
      method: 'DELETE',
      uri: url + '/clients/' + id + '/viewed_media/' + viewed.id
    });
  }
  console.log('*********viewed mediatt*********');

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
    });
  }
  rp({
    method: 'DELETE',
    uri: url + '/clients/' + id
  });
}
