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
    console.log(user);
  }
}
