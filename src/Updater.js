require('dotenv').config();
const api = require('./api');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');

const sendEMail = require('./services/Email');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { TOPICS, STATUS } = require('./constants');

module.exports = class Updater {
  constructor(opts) {
    this.userPlatformId = opts.userPlatformId;
    this.client = opts.client;
    this.currentTask = opts.currentTask;
    this.variables = opts.variables;
  }
  async loadNewInfoToClient() {
    if (!this.client) {
      return;
    }
    const {
      topic,
      days,
      hours,
      timeOfDay,
      nextTopic,
      nextMessage,
      resetHelp,
      helpMessage,
      sendHelpMessage,
      taskComplete,
      userAskedToStop,
      requestResolved,
      removeFollowup,
      coachName,
      coachEmail,
    } = this.variables;

    /* eslint-disable */
    const {
      first_name,
      last_name,
      plan_url,
      email,
      phone,
      id
    } = this.client;

    if (removeFollowup) {
      this.client.follow_up_date = null;
    }
    if (this.client.checkin_times === null) {
      this.client.checkin_times = [];
    }
    if (resetHelp) {
      if (!sendHelpMessage) {
        this.client.temp_help_response = null;
      }
      this.client.checkin_times = this.client.checkin_times.filter((checkInTime) => {
        return checkInTime.topic !== TOPICS.HELP; // removes all checkins of topic help if the user no longer needs help (as indicated by resetHelp boolean)
      });
    }

    if (taskComplete || topic === TOPICS.ULTIMATE_DONE) {
      // removes all non-recurring checkins if the user has completed the task or is done with their workplan
      this.client.checkin_times = this.client.checkin_times.filter((checkInTime) => {
        if (checkInTime.recurring) {
          return true;
        }
        return false;
      });
    }
    
  if (topic === TOPICS.ULTIMATE_DONE) {
      const substitution = {
        coach_name: coachName,
        coach_email: coachEmail,
        client_first_name: first_name,
        client_last_name: last_name,
        client_email: email,
        client_phone: phone,
        client_plan_url: `${process.env.BASE_URL}/clients/${id}/tasks`,
        client_id: id
      };
      sendEMail.sendCoachEmail(substitution);
    }

    const nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
    if (nextCheckInDate) {
      this.client.checkin_times = this.client.checkin_times.filter((checkInTime) => {
        if (checkInTime.recurring) {
          return true;
        }
        return false;
      });
    }
    if (helpMessage) {
      this.client.temp_help_response = helpMessage;
    }
    if (sendHelpMessage) {
      this.client.status = STATUS.AWAITING_HELP;
    }
    if (taskComplete) {
      if (this.currentTask) {
        this.currentTask.status = STATUS.COMPLETED;
        this.currentTask.date_completed = new Date();
      }
    }
    const recurringTasks = this.client.tasks.filter((task) => {
      return task.recurring;
    });
    if (this.client.topic === TOPICS.RECURRING) {
      for (let i = 0; i < this.client.checkin_times.length; i++) {
        const checkInTime = this.client.checkin_times[i];
        if (checkInTime.recurringTaskId) {
          if (this.client.checkin_times[i].time < Date.now()) {
            for (let j = 0; j < recurringTasks.length; j++) {
              const task = recurringTasks[j];
              if (checkInTime.recurringTaskId === task.id) {
                const duration = task.recurring.duration;
                const frequency = task.recurring.frequency;
                if (
                  duration &&
                  getNextCheckInDate(-1 * duration, null, null) >
                    checkInTime.createdDate
                ) {
                  // recurring task has ended
                  this.client.checkin_times.splice(i, 1); // remove check in
                } else {
                  checkInTime.time = getNextCheckInDate(
                    frequency || 1,
                    null,
                    'AFTERNOON'
                  );
                }
              }
            }
            break;
          }
        }
      }
    }
    if (
      topic !== TOPICS.RECURRING &&
      topic !== TOPICS.RANDOM &&
      topic !== TOPICS.FOLLOW_UP
    ) {
      this.client.topic = topic;
    }
    if (
      nextTopic !== null &&
      nextMessage !== null &&
      nextCheckInDate !== null &&
      nextCheckInDate !== undefined
    ) {
      this.client.checkin_times.push({
        topic: nextTopic,
        message: nextMessage,
        time: nextCheckInDate,
      });
    }
    if (userAskedToStop) {
      // important that this comes after all the other check in logic has been included. Otherwise it's possible that check in times will still be populated.
      this.client.checkin_times = [];
    }
    if (requestResolved === 'true') {
      // rivebot converts text to strings, hence why these aren't booleans
      this.client.status = STATUS.WORKING;
    } else if (requestResolved === 'false') {
      this.client.status = STATUS.AWAITING_HELP;
    }
  }

  async updateClientToDB() {
    if (this.variables.sendHelpMessage) {
      const request = await api.createRequest(
        this.client.id,
        this.currentTask.id
      );
      const requestMessage = await api.createMessage(
        request.id,
        this.client.id,
        this.client.coach_id,
        this.client.temp_help_response,
        this.client.topic
      );
      const coach = await api.getCoach(this.client.coach_id);
      sendHelpEmailToCoach(
        this.client,
        coach,
        this.client.temp_help_response,
        requestMessage.timestamp,
        request,
        this.currentTask
      );
      this.client.temp_help_response = null;
    }
    if (this.variables.taskComplete) {
      if (this.currentTask) {
        api.updateTask(this.currentTask.id, this.currentTask);
      }
    }
    if (this.variables.contentViewed) {
      api.markMediaAsViewed(
        this.client.id,
        parseInt(this.variables.contentId, 10)
      );
    }
    if (this.variables.requestResolved === 'true') {
      // rivebot converts text to strings, hence why these aren't booleans
      api.setRequestByTaskId(this.variables.helpRequestId, this.client.id, this.currentTask.id, 'RESOLVED');
    } else if (this.variables.requestResolved === 'false') {
      api.setRequestByTaskId(
        this.client.id,
        this.currentTask.id,
        STATUS.NEEDS_ASSISTANCE
      );
    }
    delete this.client.tasks;
    // update user
    await api.updateUser(this.client.id, this.client).then(() => {
      console.log('updated client ' + this.client.id);
    });
  }
};

/* ***** HELPER FUNCTIONS FOR updateClientToDB FUNCTION ****** */
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
  return checkInDate.valueOf();
}

function sendHelpEmailToCoach(
  client,
  coach,
  helpMessage,
  messageTimestamp,
  request,
  currentTask
) {
  const clientId = client.id;
  const clientFirstName = client.first_name;
  const clientLastName = client.last_name;
  const coachFirstName = coach.first_name;
  const coachEmail = coach.email;
  const taskTitle = currentTask.title;
  const taskSteps = currentTask.steps; // [{text: 'step', note: 'usually null'}]
  // TODO Optional: handle case where taskClientIsStuckOn is null (meaning user completed all tasks and is asking for help for something totally separate)
  const protocol = client.plan_url.split('/')[0];
  const domain = client.plan_url.split('//')[1].split('/')[0];
  const url = `${protocol}//${domain}/clients`;
  const steps = taskSteps.map((step) => {
    return `<li>${step.text}</li>`;
  });
  const userData = {
    clientId,
    clientFirstName,
    clientLastName,
    coachFirstName,
    coachEmail,
    taskTitle,
    url,
    steps,
    helpMessage
  }
  sendEMail.sendHelpPMEmailToCoach(userData);
}
