const rp = require('request-promise');
const seedData = require('./seed.json');
const seedMediaData = require('./seedmedia.json');
const seedTasksData = require('./seedtasks.json');

const url = 'http://localhost:3001';

populateDB();

async function populateDB() {
  const org = await rp({
    method: 'POST',
    uri: url + '/api/orgs',
    body: seedData.orgs[0],
    json: true // Automatically stringifies the body to JSON
  });
  const orgId = org.id.id;
  const coachData = seedData.coaches[0];
  coachData.org_id = orgId;
  const coach = await rp({
    method: 'POST',
    uri: url + '/api/coaches',
    body: coachData,
    json: true // Automatically stringifies the body to JSON
  });
  const coachId = coach.id.id;

  // create templated tasks
  const tasks = seedTasksData.tasks;
  for (let i = 0; i < tasks.length; i++) {
    const taskData = tasks[i];
    taskData.date_created = new Date();
    await rp({ // eslint-disable-line
      method: 'POST',
      uri: url + '/api/tasks',
      body: taskData,
      json: true // Automatically stringifies the body to JSON
    });
  }
  console.log(tasks.length);
  const taskOptions = [
    [0, 18],
    [],
    [1, 12, 13],
    [2, 3, 4, 5, 6, 20, 21],
    [7, 14, 22, 21, 15],
    [8, 9],
    [19],
    [16, 23, 24, 25],
    [26, 3, 7, 9, 5, 12, 1, 8, 21, 22, 14],
    [17, 10, 11]
  ];

  const usersData = seedData.users;
  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    userData.coach_id = coachId;
    userData.org_id = orgId;
    const user = await rp({ // eslint-disable-line
      method: 'POST',
      uri: url + '/api/clients',
      body: userData,
      json: true // Automatically stringifies the body to JSON
    });

    const userTaskIds = taskOptions[Math.floor(Math.random() * taskOptions.length)];
    for (let j = 0; j < userTaskIds.length; j++) {
      const userTaskId = userTaskIds[j];
      const userTaskData = tasks[userTaskId];
      userTaskData.date_created = new Date();
      userTaskData.user_id = user.id;
      await rp({ // eslint-disable-line
        method: 'POST',
        uri: url + '/api/tasks',
        body: userTaskData,
        json: true // Automatically stringifies the body to JSON
      });
    }
  }

  const medias = seedMediaData.media;
  for (let i = 0; i < medias.length; i++) {
    const mediaData = medias[i];
    mediaData.published_by = orgId;
    await rp({ // eslint-disable-line
      method: 'POST',
      uri: url + '/api/media',
      body: mediaData,
      json: true // Automatically stringifies the body to JSON
    });
  }
}
