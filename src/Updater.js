require('dotenv').config();
const api = require('./api');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');

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
      newFacebookId,
      userAskedToStop,
      requestResolved,
      removeFollowup
    } = this.variables;

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
        return checkInTime.topic !== 'help'; // removes all checkins of topic help if the user no longer needs help (as indicated by resetHelp boolean)
      });
    }

    if (taskComplete || topic === 'ultimatedone') { // removes all non-recurring checkins if the user has completed the task or is done with their workplan
      this.client.checkin_times = this.client.checkin_times.filter((checkInTime) => {
        if (checkInTime.recurring) {
          return true;
        }
        return false;
      });
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
      this.client.status = 'AWAITING_HELP';
    }
    if (taskComplete) {
      if (this.currentTask) {
        this.currentTask.status = 'COMPLETED';
        this.currentTask.date_completed = new Date();
      }
    }
    if (newFacebookId) {
      this.client.fb_id = newFacebookId;
    }
    const recurringTasks = this.client.tasks.filter((task) => {
      return task.recurring;
    });
    if (this.client.topic === 'recurring') {
      for (let i = 0; i < this.client.checkin_times.length; i++) {
        const checkInTime = this.client.checkin_times[i];
        if (checkInTime.recurringTaskId) {
          if (this.client.checkin_times[i].time < Date.now()) {
            for (let j = 0; j < recurringTasks.length; j++) {
              const task = recurringTasks[j];
              if (checkInTime.recurringTaskId === task.id) {
                const duration = task.recurring.duration;
                const frequency = task.recurring.frequency;
                if (duration && getNextCheckInDate(-1 * duration, null, null) > checkInTime.createdDate) { // recurring task has ended
                  this.client.checkin_times.splice(i, 1); // remove check in
                } else {
                  checkInTime.time = getNextCheckInDate(frequency || 1, null, 'AFTERNOON');
                }
              }
            }
            break;
          }
        }
      }
    }
    if (topic !== 'recurring' && topic !== 'random' && topic !== 'followup') {
      this.client.topic = topic;
    }
    if (nextTopic !== null && nextMessage !== null && nextCheckInDate !== null && nextCheckInDate !== undefined) {
      this.client.checkin_times.push({
        topic: nextTopic,
        message: nextMessage,
        time: nextCheckInDate
      });
    }
    if (userAskedToStop) { // important that this comes after all the other check in logic has been included. Otherwise it's possible that check in times will still be populated.
      this.client.checkin_times = [];
    }
    if (requestResolved === 'true') { // rivebot converts text to strings, hence why these aren't booleans
      this.client.status = 'WORKING';
    } else if (requestResolved === 'false') {
      this.client.status = 'AWAITING_HELP';
    }
  }

  async updateClientToDB() {
    if (this.variables.sendHelpMessage) {
      const request = await api.createRequest(this.client.id, this.currentTask.id);
      const requestMessage = await api.createMessage(request.id, this.client.id, this.client.coach_id, this.client.temp_help_response, this.client.topic);
      const coach = await api.getCoach(this.client.coach_id);
      sendHelpEmailToCoach(this.client, coach, this.client.temp_help_response, requestMessage.timestamp, request, this.currentTask);
      this.client.temp_help_response = null;
    }
    if (this.variables.taskComplete) {
      if (this.currentTask) {
        api.updateTask(this.currentTask.id, this.currentTask);
      }
    }
    if (this.variables.contentViewed) {
      api.markMediaAsViewed(this.client.id, parseInt(this.variables.contentId, 10));
    }
    if (this.variables.requestResolved === 'true') { // rivebot converts text to strings, hence why these aren't booleans
      api.setRequestByTaskId(this.client.id, this.currentTask.id, 'RESOLVED');
    } else if (this.variables.requestResolved === 'false') {
      api.setRequestByTaskId(this.client.id, this.currentTask.id, 'NEEDS_ASSISTANCE');
    }
    this.adjustClientForUpdate();
    // update user
    api.updateUser(this.client.id, this.client).then(() => {
      console.log('updated client ' + this.client.id);
    });
  }
  /* ***** HELPER FUNCTIONS FOR updateClientToDB FUNCTION ****** */
  adjustClientForUpdate() {
    delete this.client.tasks;
  }
};

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

function sendHelpEmailToCoach(client, coach, helpMessage, messageTimestamp, request, currentTask) {
  const clientId = client.id;
  const clientFirstName = client.first_name;
  const clientLastName = client.last_name;
  const coachFirstName = coach.first_name;
  const coachEmail = coach.email;
  const taskTitle = currentTask.title;
  const taskSteps = currentTask.steps; // [{text: 'step', note: 'usually null'}]
  // TODO Optional: handle case where taskClientIsStuckOn is null (meaning user completed all tasks and is asking for help for something totally separate)

  const url = 'https://helloroo.org/clients';
  const steps = taskSteps.map((step) => {
    return `<li>${step.text}</li>`;
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
  };

  sgMail.send(msg)
    .then(() => {
      console.log(`email sent to ${coachEmail}`);
    })
    .catch((err) => {
      console.error(err.toString());
      sgMail.send({
        to: 'support@helloroo.zendesk.com',
        from: 'no-reply@helloroo.org',
        subject: `Coach notification email error - ${Date.now()}`,
        text: `Unable to send help request notification email to ${coachEmail} on behalf of
              ${client.first_name} ${client.last_name}\n Here is the error: ${err.toString()}`,
      });
    });
}
