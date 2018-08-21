require('dotenv').config();
const RiveScript = require('rivescript');
const assetUrls = require('./src/assets-manifest.json');
const api = require('./apihelper');
const sgMail = require('@sendgrid/mail');
const { trackStopRequest } = require('./tracker');
// Bitly used for tracking Media links - uses v3 of the Bitly API
const { BitlyClient } = require('bitly');
const { trackMediaSent } = require('./src/tracker');

const token = process.env.BITLY_TOKEN; // see mepler if you don't have this in your .env file
const bitly = new BitlyClient(token);

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
  riveBot.setUservar(userPlatformId, 'newFacebookId', null);
  riveBot.setUservar(userPlatformId, 'coachHelpResponse', null);
  riveBot.setUservar(userPlatformId, 'userAskedToStop', null);
  riveBot.setUservar(userPlatformId, 'requestResolved', null);
}

async function getResponse(platform, userPlatformId, userMessage, topic, fbNewUserPhone, coachHelpResponse, recurringTaskId) {
  const BOT_ID = 41;
  let userInfo = null;
  if (fbNewUserPhone) {
    userInfo = await api.getUserDataFromDB(platform, fbNewUserPhone);
    if (userInfo) {
      userInfo.topic = 'welcome';
      userInfo.fb_id = userPlatformId;
    }
  } else {
    userInfo = await api.getUserDataFromDB(platform, userPlatformId);
  }
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
    } else if (platform === 'fb') {
      errMessage = 'Sorry, we didn\'t recognize the Facebook account you sent this from. If you believe this is a mistake, contact your coach.';
      return {
        messages: [{
          type: 'text',
          message: errMessage
        }]
      };
    }
  }
  if (userMessage !== 'startprompt' && userMessage !== 'pinguser') {
    await api.createMessage(null, userInfo.id, BOT_ID, userMessage, userInfo.topic);
  }
  if (userMessage.toLowerCase().trim() === 'stop') {
    userInfo.checkin_times = [];
    await api.updateUser(userInfo.id, userInfo);
    return null;
  }

  // fast forward script start
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
      recurringTaskId = checkInTimes[soonestCheckInIndex].task_id;
      userInfo.checkin_times.splice(soonestCheckInIndex, 1);
      userInfo.topic = topic;
      await api.updateUser(userInfo.id, userInfo);
    }
  }
  // fast forward script end
  const tasks = await api.getClientTasks(userInfo.id);
  userInfo.tasks = tasks;
  await loadVarsToRiveBot(self.riveBot, userInfo, platform, userMessage, topic);
  if (topic) {
    self.riveBot.setUservar(userPlatformId, 'topic', topic);
  }
  if (fbNewUserPhone) {
    self.riveBot.setUservar(userPlatformId, 'newFacebookId', userPlatformId);
  }
  if (coachHelpResponse) {
    self.riveBot.setUservar(userPlatformId, 'coachHelpResponse', coachHelpResponse);
  }
  if (recurringTaskId) {
    const recurringTask = await api.getTask(recurringTaskId);
    self.riveBot.setUservar(userPlatformId, 'recurringTaskContent', recurringTask.title);
  }
  const currTopic = self.riveBot.getUservar(userPlatformId, 'topic');
  if (tasks.length === 0 && (currTopic !== 'setupfb' && currTopic !== 'welcome' && currTopic !== 'welcomewait')) {
    self.riveBot.setUservar(userPlatformId, 'topic', 'introtask');
    return {
      dontSendMessage: true,
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

async function loadVarsToRiveBot(riveBot, userInfo, platform, userMessage, forceTopic) {
  const firstName = userInfo.first_name;
  const workplanUrl = 'https://www.helloroo.org/my-tasks';
  const {
    tasks,
  } = userInfo;
  const userPlatform = userInfo.platform;
  let {
    topic
  } = userInfo;
  if (forceTopic) {
    topic = forceTopic;
  }
  const orgName = await api.getOrgName(userInfo.org_id);
  const coach = await api.getCoach(userInfo.coach_id);
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
    if (platform === 'sms') { // user has registered fb account but sends SMS
      topic = 'setupfb';
      userPlatformId = userInfo.phone;
    } else {
      if (topic === 'setupfb') {
        topic = 'welcome';
      }
      userPlatformId = userInfo.fb_id;
    }
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
  if (currentTask === null && tasks.length > 0) {
    topic = 'ultimatedone';
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
  if (formattedUserMessage === 'stop') {
    riveBot.setUservar(userPlatformId, 'userAskedToStop', true);
    trackStopRequest({ topic, userId: userInfo.id });
  }
  if (topic === 'content' || formattedUserMessage === 'contenttopic' || formattedUserMessage === 'ff') {
    viewedMedia = await api.getViewedMediaIds(userInfo.id);
    // TODO handle case where user has viewed all media
    const allContent = await api.getAllMedia();
    for (let i = 0; i < allContent.length; i++) {
      const content = allContent[i];
      if (!viewedMedia || !viewedMedia.includes(content.id)) {
        contentIdChosen = content.id;
        contentText = content.title;
        contentUrl = await buildContentUrl(content, userInfo); // eslint-disable-line
        contentImgUrl = content.image;
        contentDescription = content.description;
        break;
      }
    }
  }
  if (topic === 'helpuserresponse') {
    riveBot.setUservar(userPlatformId, 'helpMessage', userMessage);
  }
  const storiesImgUrl = process.env.BOT_URL + assetUrls.stories.path + getRandomItemFromArray(assetUrls.stories.images);
  const celebrationImgUrl = process.env.BOT_URL + assetUrls.done.path + getRandomItemFromArray(assetUrls.done.images);
  const welcomeImgUrl = process.env.BOT_URL + assetUrls.welcome.path + getRandomItemFromArray(assetUrls.welcome.images);
  const workplanImgUrl = process.env.BOT_URL + assetUrls.welcome.path + assetUrls.welcome.workplanImgUrl;
  const introCelebrateImgUrl = process.env.BOT_URL + assetUrls.welcome.path + assetUrls.welcome.introCelebrateUrl;
  const recurringImgUrl = process.env.BOT_URL + assetUrls.recurring.path + getRandomItemFromArray(assetUrls.recurring.images);
  const checkinImgUrl = process.env.BOT_URL + assetUrls.checkin.path + getRandomItemFromArray(assetUrls.checkin.images);
  const coachSaysImgUrl = process.env.BOT_URL + assetUrls.help.path + getRandomItemFromArray(assetUrls.help.images);
  const taskNumUrl = process.env.BOT_URL + assetUrls.tasks.path + '04_Number' + taskNum + '.gif'; // eslint-disable-line
  const referralId = userPlatformId && userPlatformId.length > 2 ? userPlatformId.slice(2) : userPlatformId; // just the phone number without the +1
  riveBot.setUservar(userPlatformId, 'topic', topic);
  riveBot.setUservar(userPlatformId, 'username', firstName);
  riveBot.setUservar(userPlatformId, 'coachName', coach.first_name);
  riveBot.setUservar(userPlatformId, 'coachEmail', coach.email);
  riveBot.setUservar(userPlatformId, 'orgName', orgName);
  riveBot.setUservar(userPlatformId, 'taskNum', taskNum);
  riveBot.setUservar(userPlatformId, 'contentId', contentIdChosen);
  riveBot.setUservar(userPlatformId, 'content', contentText);
  riveBot.setUservar(userPlatformId, 'contentDescription', contentDescription);
  riveBot.setUservar(userPlatformId, 'contentImgUrl', contentImgUrl);
  riveBot.setUservar(userPlatformId, 'contentUrl', contentUrl);
  riveBot.setUservar(userPlatformId, 'recurringImgUrl', recurringImgUrl);
  riveBot.setUservar(userPlatformId, 'currentTask', currentTask);
  riveBot.setUservar(userPlatformId, 'currentTaskSteps', currentTaskSteps);
  riveBot.setUservar(userPlatformId, 'currentTaskDescription', currentTaskDescription);
  riveBot.setUservar(userPlatformId, 'storiesImgUrl', storiesImgUrl);
  riveBot.setUservar(userPlatformId, 'celebrationImgUrl', celebrationImgUrl);
  riveBot.setUservar(userPlatformId, 'welcomeImgUrl', welcomeImgUrl);
  riveBot.setUservar(userPlatformId, 'workplanImgUrl', workplanImgUrl);
  riveBot.setUservar(userPlatformId, 'introCelebrateImgUrl', introCelebrateImgUrl);
  riveBot.setUservar(userPlatformId, 'coachSaysImgUrl', coachSaysImgUrl);
  riveBot.setUservar(userPlatformId, 'taskNumImgUrl', taskNumUrl);
  riveBot.setUservar(userPlatformId, 'checkinImgUrl', checkinImgUrl);
  riveBot.setUservar(userPlatformId, 'workplanLink', workplanUrl);
  riveBot.setUservar(userPlatformId, 'introVideoLink', assetUrls.videoUrl);
  riveBot.setUservar(userPlatformId, 'platform', platform);
  riveBot.setUservar(userPlatformId, 'referralId', referralId);
}

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('scripts', () => {
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

const serverUrl = 'https://stepsroobot.herokuapp.com';
async function buildContentUrl(content, user) {
  // redirect (on this server) URL is wrapped in a bit.ly link with the content.id, content.url, and user.id
  // user clicks bit.ly link and is taken to redirect URL
  // the "view" is recorded in analytics with the params in the bit.ly link
  // user is redirected to content.url
  if (content === null) {
    return null;
  }
  // create redirect Url to send them to our sever for tracking before being sent to final destination
  const redirectUrl = `${serverUrl}/redirect?contentId=${content.id}&contentUrl=${content.url}&userId=${user.id}`;

  // wrap redirect url in a bitly link
  let bitlyUrl = null;
  try {
    bitlyUrl = await bitly.shorten(redirectUrl);
  } catch (err) {
    console.error('Unable to create Bitly link');
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: `Bitly error - ${Date.now()}`,
      text: `Unable to create Bitly link for ${content.url}. \n Here is the error: ${err}`,
    });
  }

  trackMediaSent(content, user);
  return bitlyUrl.url;
}
