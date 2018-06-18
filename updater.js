const moment = require('moment-timezone');
const api = require('./apihelper');
const sgMail = require('@sendgrid/mail');

module.exports = {
  updateUserToDB
};

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function updateUserToDB(userPlatformId, platform, variables) {
  const {
    topic,
    days,
    hours,
    timeOfDay,
    nextTopic,
    nextMessage,
    contentViewed,
    contentId,
    resetHelp,
    helpMessage,
    sendHelpMessage,
    taskComplete
  } = variables;
  const allClients = api.getAllClients();
  let client = null;
  for (let i = 0; i < allClients.length; i++) {
    const tempClient = allClients[i];
    if ((platform === 'fb' && tempClient.fb_id === userPlatformId) || (platform === 'sms' && tempClient.phone === userPlatformId)) {
      client = tempClient;
      break;
    }
  }
  if (!client) {
    return;
  }
  const { tasks } = await api.getClientTasks(client.id);
  let currentTask = null;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task.recurring && task.status === 'ACTIVE') {
      currentTask = task;
      break;
    }
  }
  const clientCheckInTimes = client.checkInTimes;
  if (resetHelp) {
    client.checkInTimes = clientCheckInTimes.filter((checkInTime) => {
      return checkInTime.topic !== 'help';
    });
  }
  if (taskComplete) {
    client.checkInTimes = clientCheckInTimes.filter((checkInTime) => {
      return checkInTime.recurring;
    });
  }
  const nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
  if (nextCheckInDate) {
    client.checkInTimes = clientCheckInTimes.filter((checkInTime) => {
      return checkInTime.recurring;
    });
  }
  if (helpMessage) {
    client.tempHelpMessage = helpMessage; // TODO waiting on 8th light to add tempHelpMessage field
  }
  if (sendHelpMessage) {
    const requests = await api.getUserRequests(client.id);
    let request = null;
    for (let i = 0; i < requests.length; i++) {
      if (requests[i].task_id === currentTask.id) {
        request = requests[i];
      }
    }
    if (!request) {
      request = await api.createRequest(client.id, currentTask.id);
    }
    const requestMessage = await api.createMessage(request.id, client.id, client.coach_id, helpMessage);
    const coach = await api.getCoach(client.coach_id);
    sendHelpEmailToCoach(client, coach, helpMessage, requestMessage.timestamp, request, currentTask);
    client.tempHelpMessage = null;
  }
  if (taskComplete) {
    currentTask.status = 'COMPLETED';
    api.updateTask(currentTask.id, currentTask);
  }
  if (contentViewed) {
    api.markMediaAsViewed(client.id, parseInt(contentId, 10));
  }

  client.topic = topic;
  client.checkin_times.push({
    topic: nextTopic,
    message: nextMessage,
    time: nextCheckInDate
  });
  // update user
  api.updateUser(client.id, client);
}

function getNextCheckInDate(days, hours, timeOfDay) {
  if (!days && !hours && !timeOfDay) {
    return null;
  }
  let checkInDate = moment();
  if (days) {
    checkInDate = checkInDate.add(parseInt(days, 10), 'days');
  }
  if (hours) {
    checkInDate = checkInDate.add(parseInt(hours, 10), 'hours');
    return checkInDate.valueOf();
  }
  if (timeOfDay) {
    if (timeOfDay.toUpperCase() === 'MORNING') {
      checkInDate = checkInDate.hours(14).minutes(0).seconds(0);
    } else if (timeOfDay.toUpperCase() === 'AFTERNOON') {
      checkInDate = checkInDate.hours(18).minutes(30).seconds(0);
    }
  }
  return checkInDate.tz('America/New_York').valueOf();
}

function sendHelpEmailToCoach(client, coach, helpMessage, messageTimestamp, request, currentTask) {
  const clientId = client.id;
  const clientFirstName = client.first_name;
  const clientLastName = client.last_name;
  const coachId = coach.id; // can also do client.coach_id
  const coachFirstName = coach.first_name;
  const coachEmail = coach.email;
  const taskTitle = currentTask.title;
  const taskSteps = currentTask.steps; // [{text: 'step', note: 'usually null'}]
  // TODO Optional: handle case where taskClientIsStuckOn is null (meaning user completed all tasks and is asking for help for something totally separate)
  
  // TODO MEPLER IMPLEMENT SENDING THE EMAIL
  const url = 'https://helloroo.org/clients';
  const steps = taskSteps.map(step => {
    `<li>${step.text}</li>`
  });

  const msg = {
    to: coachEmail,
    from: 'no-reply@helloroo.org',
    subject: `[Roo] ${client.first_name} ${client.last_name} has requested assistance.`,
    html: `<html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title>Coach Help Request</title>
            </head>

            <body>
              <div class="wrapper" style="background: #c4e6f7;margin: 0 auto; padding: 5px;text-align: center; min-width: 300px;max-width: 600px;">
                <table style="border:none; width:100%">
                  <tr style="height:200px">
                    <td style="text-align:left">
                      <h1 style="color: #333333;font-family: sans-serif;font-size: 24px;margin: 10px 25px 25px 25px;">
                        ${clientFirstName} ${clientLastName} needs your help!
                      </h1>
                    </td>
                  </tr>
                  <tr class="bodyText" style="background: white;color: #333333;font-family: sans-serif;font-size: 18px;padding: 15px;text-align: left;">
                    <td colspan="2" style="padding:15px">
                        <p style="margin-top:0">
                          ${coachFirstName},
                        </p>  

                        <p style="margin-bottom:45px">Your client ${clientFirstName} ${clientLastName} has requested help from Roo the chatbot. 
                        </p>

                        <div class="cta-button" style="background: #00bf8d;border-radius: 25px;-webkit-box-shadow: -3px 3px 6px -2px rgba(0,0,0,0.15);
                        -moz-box-shadow: -3px 3px 6px -2px rgba(0,0,0,0.15);box-shadow: -3px 3px 6px -2px rgba(0,0,0,0.15);margin: 0 auto;
                        padding: 15px;text-align: center;width: 50%;">
                          <a style="color: white;text-decoration: none;"href="${url}/${clientId}/chat/help">
                            REPLY NOW
                          </a>
                        </div>

                        <p style="margin-top:45px"><strong>Help text</strong> 
                          <!-- <em>(${currentTask.updated || currentTask.timestamp})</em> -->
                        </p>
                        
                        <p>${helpMessage}</p>
                        
                        <strong>Current Action Item</strong>
                        <p>${taskTitle}</p>

                        <strong>Action Item Steps</strong>
                        <ul>
                          ${steps}
                        </ul>
                    </td>
                  </tr>
                </table>
              <div>
            </body>
            </html>`

  sgMail.send(msg)
    .then(() => {
      console.log(`email sent to ${coachEmail}`);
    })
    .catch(((err) => {
      console.error(err.toString());
      // const {message, code, response} = error;
      // const {headers, body} = response;
    });;
}
