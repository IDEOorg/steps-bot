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
    taskComplete,
    newFacebookId,
    userAskedToStop,
    requestResolved,
    removeFollowup
  } = variables;
  const client = await api.getUserDataFromDB(platform, userPlatformId);
  if (!client) {
    return;
  }
  const tasks = await api.getClientTasks(client.id);
  let currentTask = null;
  for (let i = 0; i < tasks.length; i++) { // gets the current task
    const task = tasks[i];
    if (!task.recurring && task.status === 'ACTIVE') {
      currentTask = task;
      break;
    }
  }
  if (removeFollowup) {
    client.follow_up_date = null;
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
      return checkInTime.topic !== 'help'; // removes all checkins of topic help if the user no longer needs help (as indicated by resetHelp boolean)
    });
  }

  if (taskComplete || topic === 'ultimatedone') { // removes all non-recurring checkins if the user has completed the task or is done with their workplan
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
    const request = await api.createRequest(client.id, currentTask.id);
    const requestMessage = await api.createMessage(request.id, client.id, client.coach_id, client.temp_help_response, client.topic);
    const coach = await api.getCoach(client.coach_id);
    sendHelpEmailToCoach(client, coach, client.temp_help_response, requestMessage.timestamp, request, currentTask);
    client.temp_help_response = null;
    client.status = 'AWAITING_HELP';
  }
  if (taskComplete) {
    currentTask.status = 'COMPLETED';
    currentTask.date_completed = new Date();
    api.updateTask(currentTask.id, currentTask);
  }
  if (contentViewed) {
    api.markMediaAsViewed(client.id, parseInt(contentId, 10));
  }
  if (newFacebookId) {
    client.fb_id = newFacebookId;
  }

  if (topic !== 'recurring' && topic !== 'random' && topic !== 'followup') {
    client.topic = topic;
  }
  if (nextTopic !== null && nextMessage !== null && nextCheckInDate !== null && nextCheckInDate !== undefined) {
    client.checkin_times.push({
      topic: nextTopic,
      message: nextMessage,
      time: nextCheckInDate
    });
  }
  // TODO fill in any deleted recurring tasks, added recurring tasks, and updated recurring tasks
  // given tasks list and clientCheckInTimes
  const recurringTasks = tasks.filter((task) => {
    return task.recurring;
  });
  for (let i = 0; i < recurringTasks.length; i++) { // add new recurring tasks
    const task = recurringTasks[i];
    let taskFound = false;
    for (let j = 0; j < client.checkin_times.length; j++) {
      const checkInTime = client.checkin_times[j];
      if (checkInTime.task_id === task.id) {
        taskFound = true;
      }
    }
    if (taskFound === false) {
      client.checkin_times.push({
        topic: 'recurring',
        message: 'startprompt',
        time: getNextCheckInDate(1, null, 'AFTERNOON'),
        createdDate: new Date(),
        task_id: task.id
      });
    }
  }
  for (let i = 0; i < client.checkin_times.length; i++) {
    const checkInTime = client.checkin_times[i];
    if (checkInTime.task_id) {
      if (client.checkin_times[i].time < Date.now()) {
        for (let j = 0; j < recurringTasks.length; j++) {
          const task = recurringTasks[j];
          if (checkInTime.task_id === task.id) {
            if (task.duration && getNextCheckInDate(-1 * task.duration, null, null) > checkInTime.createdDate) {
              break;
            } else {
              checkInTime.time = getNextCheckInDate(task.frequency ? task.frequency : 1, null, 'AFTERNOON');
            }
          }
        }
        break;
      }
    }
  }

  if (userAskedToStop) { // important that this comes after all the other check in logic has been included. Otherwise it's possible that check in times will still be populated.
    client.checkin_times = [];
  }
  if (requestResolved === 'true') { // rivebot converts text to strings, hence why these aren't booleans
    api.setRequestByTaskId(client.id, currentTask.id, 'RESOLVED');
    client.status = 'WORKING';
  } else if (requestResolved === 'false') {
    api.setRequestByTaskId(client.id, currentTask.id, 'NEEDS_ASSISTANCE');
    client.status = 'AWAITING_HELP';
  }
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
    } else {
      checkInDate = checkInDate.hours(14).minutes(0).seconds(0); // this is if there's a mistake in the script and no time of day is indicated, default the text to be sent in the morning rather than 12am.
    }
  }
  return checkInDate.tz('America/New_York').valueOf();
}
