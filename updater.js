const moment = require('moment-timezone');
const api = require('./apihelper');

module.exports = {
  updateUserToDB
};

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
  // console.log({
  //   topic,
  //   days,
  //   hours,
  //   timeOfDay,
  //   nextTopic,
  //   nextMessage,
  //   contentViewed,
  //   contentId,
  //   resetHelp,
  //   helpMessage,
  //   sendHelpMessage,
  //   taskComplete
  // });
  const client = await api.getUserDataFromDB(platform, userPlatformId);
  if (!client) {
    return;
  }
  const tasks = await api.getClientTasks(client.id);
  let currentTask = null;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task.recurring && task.status === 'ACTIVE') {
      currentTask = task;
      break;
    }
  }
  if (client.checkin_times === null) {
    client.checkin_times = [];
  }
  const clientCheckInTimes = client.checkin_times;
  if (resetHelp) {
    if (!sendHelpMessage) {
      client.temp_help_response = null;
    }
    client.checkin_times = clientCheckInTimes.filter((checkInTime) => {
      return checkInTime.topic !== 'help';
    });
  }
  if (taskComplete) {
    client.checkin_times = clientCheckInTimes.filter((checkInTime) => {
      if (checkInTime.recurring) {
        return true;
      }
      return false;
    });
  }
  const nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
  if (nextCheckInDate) {
    client.checkin_times = clientCheckInTimes.filter((checkInTime) => {
      if (checkInTime.recurring) {
        return true;
      }
      return false;
    });
  }
  if (helpMessage) {
    client.temp_help_response = helpMessage;
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
    console.log('client.temp_help_response');
    console.log(client.temp_help_response);
    const requestMessage = await api.createMessage(request.id, client.id, client.coach_id, client.temp_help_response);
    console.log('****************requestMessage**************');
    console.log(requestMessage);
    const coach = await api.getCoach(client.coach_id);
    sendHelpEmailToCoach(client, coach, client.temp_help_response, requestMessage.timestamp, request, currentTask);
    client.temp_help_response = null;
  }
  if (taskComplete) {
    currentTask.status = 'COMPLETED';
    api.updateTask(currentTask.id, currentTask);
  }
  if (contentViewed) {
    api.markMediaAsViewed(client.id, parseInt(contentId, 10));
  }

  client.topic = topic;
  if (nextTopic !== null && nextMessage !== null && nextCheckInDate !== null && nextCheckInDate !== undefined) {
    client.checkin_times.push({
      topic: nextTopic,
      message: nextMessage,
      time: nextCheckInDate
    });
  }
  console.log('*******************************client firm you***********************');
  console.log(client.temp_help_response);

  // update user
  api.updateUser(client.id, client).then(() => {
    console.log('updated client ' + client.id);
  });
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
  const coachEmail = coach.email;
  const taskTitle = currentTask.title;
  const taskSteps = currentTask.steps; // [{text: 'step', note: 'usually null'}]
  // TODO Optional: handle case where taskClientIsStuckOn is null (meaning user completed all tasks and is asking for help for something totally separate)
  // TODO MEPLER IMPLEMENT SENDING THE EMAIL
}
