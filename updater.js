const moment = require('moment');

module.exports = {
  updateFirebase
};

function updateFirebase(db, userId, variables) {
  const {
    topic,
    days,
    hours,
    timeOfDay,
    nextTopic,
    nextMessage,
    contentViewed,
    contentId
  } = variables;
  const userRef = db.ref('users').child(userId);
  const nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
  const update = {};
  update.topic = topic;
  if (nextCheckInDate) {
    const checkInKey = userRef.child('followUpCheckIns').push().key;
    update['/followUpCheckIns/' + checkInKey] = {
      time: nextCheckInDate,
      message: nextMessage,
      topic: nextTopic
    };
  }
  if (contentViewed) {
    const viewedMediaKey = userRef.child('viewedMedia').push().key;
    update['/viewedMedia/' + viewedMediaKey] = contentId;
  }
  userRef.update(update);
  console.log('varstart');
  console.log(variables);
  console.log('varend');
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
      checkInDate = checkInDate.hours(9).minutes(0).seconds(0);
    } else if (timeOfDay.toUpperCase() === 'AFTERNOON') {
      checkInDate = checkInDate.hours(14).minutes(30).seconds(0);
    }
  }
  return checkInDate.tz('America/New_York').valueOf();
}
