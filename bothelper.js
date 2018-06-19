require('dotenv').config();
const RiveScript = require('rivescript');
const assetUrls = require('./data/assets-manifest.json');
const api = require('./apihelper');

const self = this;
self.riveBot = setupRiveScript();

module.exports = {
  getResponse,
  resetVariables
};

function resetVariables(userPlatformId) {
  const { riveBot } = self;
  riveBot.setUservar(userPlatformId, 'timeOfDay', null);
  riveBot.setUservar(userPlatformId, 'days', null);
  riveBot.setUservar(userPlatformId, 'hours', null);
  riveBot.setUservar(userPlatformId, 'nextTopic', null);
  riveBot.setUservar(userPlatformId, 'nextMessage', null);
  riveBot.setUservar(userPlatformId, 'contentViewed', null);
  riveBot.setUservar(userPlatformId, 'taskComplete', null);
  riveBot.setUservar(userPlatformId, 'resetHelp', null);
  riveBot.setUservar(userPlatformId, 'helpMessage', null);
  riveBot.setUservar(userPlatformId, 'sendHelpMessage', null);
}

async function getResponse(platform, userPlatformId, userMessage, topic, fbNewUserId) {
  const BOT_ID = 41;
  let userInfo = null;
  userInfo = await api.getUserDataFromDB(platform, userPlatformId);
  if (!userInfo) {
    // user doesn't exist in db
    let errMessage = null;
    if (platform === 'sms') {
      errMessage = 'Sorry, we didn\'t recognize the phone number you sent this from. If you believe this is a mistake, contact your coach.';
      return {
        messages: [{
          type: 'text',
          message: errMessage
        }]
      };
    }
    userInfo = await api.createMockFBUser(userPlatformId);
    userInfo.topic = 'welcome';
  }
  await api.createMessage(null, userInfo.id, BOT_ID, userMessage);
  if (userMessage.toLowerCase().trim() === 'ff') {
    const checkInTimes = userInfo.checkin_times;
    let soonestTime = Number.MAX_VALUE;
    let soonestCheckInIndex = null;
    for (let i = 0; i < checkInTimes.length; i++) {
      const checkInTime = checkInTimes[i];
      const { time } = checkInTime;
      if (time !== null && time < soonestTime) {
        soonestTime = time;
        soonestCheckInIndex = i;
      }
    }

    if (soonestCheckInIndex !== null) {
      userMessage = checkInTimes[soonestCheckInIndex].message;
      topic = checkInTimes[soonestCheckInIndex].topic; // eslint-disable-line
      userInfo.checkin_times.splice(soonestCheckInIndex, 1);
      userInfo.topic = topic;
      await api.updateUser(userInfo.id, userInfo);
    }
  }
  const tasks = await api.getClientTasks(userInfo.id);
  userInfo.tasks = tasks;
  await loadVarsToRiveBot(self.riveBot, userInfo, platform, userMessage, fbNewUserId);
  if (topic) {
    self.riveBot.setUservar(userPlatformId, 'topic', topic);
  }
  const currTopic = self.riveBot.getUservar(userPlatformId, 'topic');
  if (tasks.length === 0 && (currTopic !== 'welcome' && currTopic !== 'welcomewait')) {
    self.riveBot.setUservar(userPlatformId, 'topic', 'introtask');
    return {
      messages: [
        {
          type: 'text',
          message: 'We\'re still waiting on your coach to upload your list of tasks. Check back some other time.'
        }
      ],
      variables: {
        topic: 'introtask',
        days: 1,
        timeOfDay: 'morning',
        nextTopic: 'introtask',
        nextMessage: 'startprompt',
      }
    };
  }
  const botResponse = self.riveBot.reply(userPlatformId, userMessage, self);
  const messages = parseResponse(botResponse, platform);
  return {
    messages,
    variables: self.riveBot.getUservars(userPlatformId)
  };
}

async function loadVarsToRiveBot(riveBot, userInfo, platform, userMessage, fbNewUserId) {
  const firstName = userInfo.first_name;
  const workplanUrl = `https://www.helloroo.org/clients/${userInfo.id}/tasks`;
  const {
    tasks,
  } = userInfo;
  const userPlatform = userInfo.platform;
  let {
    topic
  } = userInfo;
  const orgName = await api.getOrgName(userInfo.org_id);
  const coachName = await api.getCoachName(userInfo.coach_id);
  console.log('*******************topic*********************');
  console.log(topic);
  let viewedMedia = null;
  let userPlatformId = null;
  if (topic === null) {
    userPlatformId = userInfo.phone;
    if (userPlatform === 'FBOOK') {
      topic = 'setupfb';
    } else {
      topic = 'welcome';
    }
  } else if (userPlatform === 'FBOOK') {
    console.log(fbNewUserId);
    userPlatformId = fbNewUserId;
    if (platform === 'sms') { // user has registered fb account but sends SMS
      // TODO do nothing
    }
    if (!userInfo.fb_id) {
      // TODO first fb message
      topic = 'welcome'; // change it from setup
    }
    userPlatformId = userInfo.fb_id;
  } else { // is SMS
    userPlatformId = userInfo.phone;
  }

  let taskNum = 0;
  let currentTask = null;
  let currentTaskDescription = null;
  let currentTaskSteps = null;
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].recurring) {
      taskNum = i + 1;
    }
    if (tasks[i].status === 'ACTIVE' && !tasks[i].recurring) {
      let steps = tasks[i].steps; // eslint-disable-line
      if (steps === null) {
        steps = [];
      }
      currentTask = tasks[i].title;
      currentTaskSteps = steps;
      currentTaskDescription = tasks[i].description;
      break;
    }
  }
  // TODO handle all tasks completed scenario
  if (currentTask === null) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'ACTIVE';
      await api.updateTask(task.id, task); // eslint-disable-line
    }
    if (tasks.length !== 0) {
      let steps = tasks[0].steps; // eslint-disable-line
      if (steps === null) {
        steps = [];
      }
      currentTask = tasks[0].title;
      currentTaskSteps = steps;
      currentTaskDescription = tasks[0].description;
    } else {
      currentTask = null;
      currentTaskDescription = null;
      currentTaskSteps = null;
    }
  }

  if (currentTaskDescription && currentTaskDescription.length !== 0) {
    currentTaskDescription = '▪️ Why it matters:\n' + currentTaskDescription;
  }

  if (currentTaskSteps !== null) {
    currentTaskSteps = currentTaskSteps.map((step, i) => {
      return `▪️ Step ${i + 1}: ${step.text}`;
    });
    currentTaskSteps = currentTaskSteps.join('\n\n');
  }

  let contentIdChosen = null;
  let contentText = null;
  let contentUrl = null;
  let contentImgUrl = null;
  let contentDescription = null;
  const formattedUserMessage = userMessage.toLowerCase().trim();
  if (topic === 'content' || formattedUserMessage === 'contenttopic' || formattedUserMessage === 'ff') {
    viewedMedia = await api.getViewedMediaIds(userInfo.id);
    // TODO handle case where user has viewed all media
    const allContent = await api.getAllMedia();
    for (let i = 0; i < allContent.length; i++) {
      const content = allContent[i];
      if (!viewedMedia || !viewedMedia.includes(content.id)) {
        contentIdChosen = content.id;
        contentText = content.title;
        contentUrl = content.url;
        contentImgUrl = content.image;
        contentDescription = content.description;
        break;
      }
    }
  }
  if (topic === 'helpuserresponse') {
    riveBot.setUservar(userPlatformId, 'helpMessage', userMessage);
  }
  const storiesImgUrl = assetUrls.baseUrl + assetUrls.stories.path + getRandomItemFromArray(assetUrls.stories.images);
  const celebrationImgUrl = assetUrls.baseUrl + assetUrls.done.path + getRandomItemFromArray(assetUrls.done.images);
  const welcomeImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + getRandomItemFromArray(assetUrls.welcome.images);
  const workplanImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + assetUrls.welcome.workplanImgUrl;
  const introCelebrateImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + assetUrls.welcome.introCelebrateUrl;
  const checkinImgUrl = assetUrls.baseUrl + assetUrls.checkin.path + getRandomItemFromArray(assetUrls.checkin.images);
  const taskNumUrl = assetUrls.baseUrl + assetUrls.tasks.path + taskNum + '.png'; // eslint-disable-line
  riveBot.setUservar(userPlatformId, 'topic', topic);
  riveBot.setUservar(userPlatformId, 'username', firstName);
  riveBot.setUservar(userPlatformId, 'coachName', coachName);
  riveBot.setUservar(userPlatformId, 'orgName', orgName);
  riveBot.setUservar(userPlatformId, 'taskNum', taskNum);
  riveBot.setUservar(userPlatformId, 'contentId', contentIdChosen);
  riveBot.setUservar(userPlatformId, 'content', contentText);
  riveBot.setUservar(userPlatformId, 'contentDescription', contentDescription);
  riveBot.setUservar(userPlatformId, 'contentImgUrl', contentImgUrl);
  riveBot.setUservar(userPlatformId, 'contentUrl', contentUrl);
  riveBot.setUservar(userPlatformId, 'currentTask', currentTask);
  riveBot.setUservar(userPlatformId, 'currentTaskSteps', currentTaskSteps);
  riveBot.setUservar(userPlatformId, 'currentTaskDescription', currentTaskDescription);
  riveBot.setUservar(userPlatformId, 'storiesImgUrl', storiesImgUrl);
  riveBot.setUservar(userPlatformId, 'celebrationImgUrl', celebrationImgUrl);
  riveBot.setUservar(userPlatformId, 'welcomeImgUrl', welcomeImgUrl);
  riveBot.setUservar(userPlatformId, 'workplanImgUrl', workplanImgUrl);
  riveBot.setUservar(userPlatformId, 'introCelebrateImgUrl', introCelebrateImgUrl);
  riveBot.setUservar(userPlatformId, 'taskNumImgUrl', taskNumUrl);
  riveBot.setUservar(userPlatformId, 'checkinImgUrl', checkinImgUrl);
  riveBot.setUservar(userPlatformId, 'workplanLink', workplanUrl);
  riveBot.setUservar(userPlatformId, 'introVideoLink', assetUrls.videoUrl);
  riveBot.setUservar(userPlatformId, 'platform', platform);
  riveBot.setUservar(userPlatformId, 'id', userPlatformId);
  console.log("riveBot.getUservar(userPlatformId, 'topic')");
  console.log(userPlatformId);
  console.log(riveBot.getUservar(userPlatformId, 'topic'));
}

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('scriptsv2', () => {
    bot.sortReplies();
  });
  return bot;
}

function parseResponse(response, platform) {
  const sendRegex = /<send>/g;
  const regex = {
    image: /\^image\("(.*?)"\)/g,
    imageForSplit: /\^image\(".*"\)/g,
    template: /\^template\(([\s\S]*?)\)/g,
    templateForSplit: /\^template\(([\s\S]*)\)/g,
    templateStrings: /`([\s\S]*?)`/g,
    sms: /<sms>([\s\S]*?)<\/sms>/g,
    fb: /<fb>([\s\S]*?)<\/fb>/g,
    nonwhitespaceChars: /\S/
  };
  if (platform === 'fb') {
    response = response.replace(regex.sms, '');
    response = response.replace(regex.fb, '$1');
  } else if (platform === 'sms') {
    response = response.replace(regex.fb, '');
    response = response.replace(regex.sms, '$1');
  }
  const messages = response.split(sendRegex);
  const finalMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const messageType = getMessageType(message, regex);
    if (messageType === 'text') {
      prepareTextMessage(finalMessages, message);
    } else if (messageType === 'image') {
      prepareImageMessage(finalMessages, message, regex);
    } else if (messageType === 'template') {
      prepareTemplateMessage(finalMessages, message, regex);
    }
  }
  return finalMessages;
}

function getMessageType(message, regex) {
  if (message.match(regex.image)) {
    return 'image';
  } else if (message.match(regex.template)) {
    return 'template';
  }
  return 'text';
}

function prepareTextMessage(finalMessages, message) {
  if (message.length) {
    finalMessages.push({
      type: 'text',
      message
    });
  }
}

function prepareImageMessage(finalMessages, message, regex) {
  const imageUrls = message.match(regex.image).map(tag => tag.replace(regex.image, '$1'));
  const textMessages = message.split(regex.imageForSplit);
  let text = null;
  const image = imageUrls[0];
  finalMessages.push({
    type: 'image',
    image
  });
  for (let j = 0; j < textMessages.length; j++) {
    if (textMessages[j] && regex.nonwhitespaceChars.test(textMessages[j])) {
      text = textMessages[j];
      finalMessages.push({
        type: 'text',
        message: text
      });
      break;
    }
  }
}

function prepareTemplateMessage(finalMessages, message, regex) {
  const defaultErrorMessage = {
    type: 'text',
    message: 'There was an error on our side. Type START and try again.'
  };
  let templateArgs = message.replace(regex.template, '$1').match(regex.templateStrings);
  if (templateArgs.length === 0) {
    finalMessages.push(defaultErrorMessage);
    return;
  }
  templateArgs = templateArgs.map(arg => arg.replace(/`/g, ''));
  const templateType = templateArgs[0];
  let messageToPush = null;
  if (templateType === 'quickreply') {
    let introText = null;
    const introTextBits = message.split(regex.templateForSplit);
    for (let i = 0; i < introTextBits.length; i++) {
      if (regex.nonwhitespaceChars.test(introTextBits[i] && i !== 1)) {
        introText = introTextBits[i];
        break;
      }
    }
    messageToPush = {
      type: templateType,
      text: introText,
      buttons: templateArgs.slice(1)
    };
  } else if (templateType === 'genericurl' || templateType === 'generic') {
    if (templateArgs.length < 4) {
      messageToPush = defaultErrorMessage;
    }
    const imageUrl = templateArgs[1];
    const content = templateArgs[2];
    const buttons = JSON.parse(templateArgs[3]);
    messageToPush = {
      type: templateType,
      imageUrl,
      content,
      buttons
    };
  } else if (templateType === 'button') {
    if (templateArgs.length < 3) {
      messageToPush = defaultErrorMessage;
    }
    const content = templateArgs[1];
    const buttons = JSON.parse(templateArgs[2]);
    messageToPush = {
      type: templateType,
      content,
      buttons
    };
  } else {
    messageToPush = defaultErrorMessage;
  }
  finalMessages.push(messageToPush);
}

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}
