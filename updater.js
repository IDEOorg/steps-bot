const moment = require('moment-timezone');

module.exports = {
  updateUserToDB
};

function updateUserToDB(userId, variables) {
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
    helpResponse,
    sendHelpResponse,
    taskComplete,
    taskNum
  } = variables;
  const userRef = db.ref('users').child(userId);
  const nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
  const update = {};
  update.topic = topic;
  // this if-condition has to run before the follow up check ins bit runs
  const checkInsRef = userRef.child('followUpCheckIns');
  updateUserCheckIns(checkInsRef, taskComplete, resetHelp).then(() => {
    if (nextCheckInDate) {
      const checkInKey = userRef.child('followUpCheckIns').push().key;
      update['/followUpCheckIns/' + checkInKey] = {
        time: nextCheckInDate,
        message: nextMessage,
        topic: nextTopic
      };
    }
    if (helpResponse) {
      update.helpResponse = helpResponse;
    }
    if (sendHelpResponse) {
      // SEND RESPONSE
      // TODO Mepler where the email is sent helpResponse contains what user typed
      userRef.child('helpResponse').remove();
    }
    if (taskComplete) {
      const tasksRef = userRef.child('tasks');
      tasksRef.child(taskNum).update({
        complete: true
      });
    }
    if (contentViewed) {
      const viewedMediaKey = userRef.child('viewedMedia').push().key;
      update['/viewedMedia/' + viewedMediaKey] = contentId;
    }
    userRef.update(update);
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

async function updateUserCheckIns(checkInsRef, taskComplete, resetHelp) {
  const snapshot = await checkInsRef.once('value');
  const nodes = snapshot.val();
  if (!nodes) {
    return;
  }
  const nodeKeys = Object.keys(nodes);
  if (taskComplete) {
    for (let i = 0; i < nodeKeys.length; i++) {
      const nodeKey = nodeKeys[i];
      if (!nodes[nodeKey].recurring) {
        checkInsRef.child(nodeKey).remove();
      }
    }
  } else if (resetHelp) {
    for (let i = 0; i < nodeKeys.length; i++) {
      const nodeKey = nodeKeys[i];
      if (nodes[nodeKey].topic === 'help') {
        checkInsRef.child(nodeKey).remove();
      }
    }
  }
}
