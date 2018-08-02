const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const fakeClients = require('./fakeclients.json');
require('dotenv').config();

getClientData();

async function getClientData() {
  let outputText = '';
  outputText += 'ID,Client,Coach,Organization,Client Email,Client Phone,Client Platform,Client Sign Up Date,Client Follow Up Appointment,Tasks Completed,Tasks Assigned,Messages Sent By Bot,Messages Sent By Client,Messages Sent By Coach,Requests for Help, Date of Last Message From Bot, Date of Next Bot Message, Current Topic\n';
  const orgs = await rp({
    method: 'GET',
    uri: 'https://steps-admin.herokuapp.com/api' + '/orgs/',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  });
  let coaches = await rp({
    method: 'GET',
    uri: 'https://steps-admin.herokuapp.com/api' + '/coaches/',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  });
  coaches = coaches.filter((coach) => {
    return coach.coach_id === null;
  })
  const clients = await rp({
    method: 'GET',
    uri: 'https://steps-admin.herokuapp.com/api' + '/clients/',
    headers: {
      Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
    },
    json: true
  });

  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    const orgId = org.id;
    if (org.name === 'IDEO.org' || org.name === 'Org' || org.name === '8th Light' || org.name === 'Adorable') {
      continue;
    }
    for (let j = 0; j < coaches.length; j++) {
      const coach = coaches[j];
      const coachId = coaches[j].id;
      if (coach.org_id === orgId) {
        for (let k = 0; k < clients.length; k++) {
          const client = clients[k];
          if (client.coach_id === coachId && !fakeClients.fakes.includes(client.id)) {
            const clientId = client.id;
            const clientName = client.first_name + ' ' + client.last_name;
            const coachName = coach.first_name + ' ' + coach.last_name;
            const orgName = org.name;
            const email = client.email;
            const clientPhone = client.phone;
            const platform = client.platform;
            const signUpDate = client.created_at;
            const topic = client.topic;
            const followUpDate = client.follow_up_date;
            let nextCheckInDate = null;
            if (client.checkin_times && client.checkin_times.length > 0) {
              nextCheckInDate = new Date(client.checkin_times[0].time);
            }
            const tasks = await rp({ // eslint-disable-line
              method: 'GET',
              uri: 'https://steps-admin.herokuapp.com/api' + '/clients/' + client.id.toString() + '/tasks',
              headers: {
                Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
              },
              json: true
            });
            const tasksAssigned = tasks.length;
            const tasksCompleted = tasks.filter(task => task.status === 'COMPLETED').length;
            const messages = await rp({ // eslint-disable-line
              method: 'GET',
              uri: 'https://steps-admin.herokuapp.com/api' + '/clients/' + client.id.toString() + '/messages',
              headers: {
                Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
              },
              json: true
            });
            const requests = await rp({ // eslint-disable-line
              method: 'GET',
              uri: 'https://steps-admin.herokuapp.com/api' + '/clients/' + client.id.toString() + '/requests',
              headers: {
                Authorization: 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN
              },
              json: true
            });

            let messagesSentByBot = messages.filter(message => message.from_user === 41);
            const totalMessagesSentByClient = messages.filter(message => message.from_user === client.id && message.text !== 'startprompt' && message.text !== 'pinguser').length;
            const totalMessagesSentByBot = messagesSentByBot.length;
            const totalMessagesSentByCoach = messages.filter(message => message.from_user === coach.id).length;
            const totalRequestsForHelp = requests.length;
            // Date of last bot message
            messagesSentByBot = messagesSentByBot.sort((a, b) => {
              return Date.parse(a.timestamp) > Date.parse(b.timestamp);
            });
            let dateOfLastBotMessage = null;
            if (messagesSentByBot.length > 0) {
              dateOfLastBotMessage = messagesSentByBot[messagesSentByBot.length - 1].timestamp;
            }

            const clientRow = [clientId, clientName, coachName, orgName, email, clientPhone, platform, signUpDate, followUpDate, tasksCompleted, tasksAssigned, totalMessagesSentByBot, totalMessagesSentByClient, totalMessagesSentByCoach, totalRequestsForHelp, dateOfLastBotMessage, nextCheckInDate, topic];
            outputText = outputText + clientRow.join(',') + '\n';
          }
        }
      }
    }
  }
  const currentTime = new Date();
  const timestamp = currentTime.getFullYear() + '' + currentTime.getMonth() + '' + currentTime.getDate() + '' + currentTime.getHours() + '' + currentTime.getMinutes();
  fs.writeFileSync(path.resolve(__dirname, 'analytics' + timestamp + '.csv'), outputText);
}
