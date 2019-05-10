require('dotenv').config();
const constants = require('./constants');
const assetUrls = require('./assets-manifest.json');
const path = require('path');
const RiveScript = require('rivescript');
const helpers = require('../helpers');

const { TOPICS } = constants;

module.exports = class Rivebot {
  constructor() {
    this.rivebot = new RiveScript();
  }

  async loadChatScripts() {
    await this.rivebot.loadDirectory(path.resolve(__dirname, '../scripts'));
    this.rivebot.sortReplies();
  }

  async loadVarsToRiveBot(opts) {
    const {
      client,
      platform,
      userPlatformId,
      org,
      coach,
      currentTaskTitle,
      currentTaskSteps,
      currentTaskDescription,
      taskNum,
      contentIdChosen,
      contentText,
      contentUrl,
      contentImgUrl,
      contentDescription,
      recurringTaskContent,
      helpMessage,
      coachHelpResponse,
      coachDirectMessage,
      isFinalTask,
      helpRequestId,
      userAskedToStop,
      userMessage
    } = opts;
    await this.rivebot.setUservar(userPlatformId, 'topic', client.topic);
    await this.rivebot.setUservar(
      userPlatformId,
      'username',
      client.first_name
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'coachName',
      coach.first_name
    );
    await this.rivebot.setUservar(userPlatformId, 'coachEmail', coach.email);
    await this.rivebot.setUservar(userPlatformId, 'orgName', org.name);
    await this.rivebot.setUservar(userPlatformId, 'orgPhone', org.phone);
    await this.rivebot.setUservar(userPlatformId, 'taskNum', taskNum);
    await this.rivebot.setUservar(
      userPlatformId,
      'currentTaskTitle',
      currentTaskTitle
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'currentTaskSteps',
      currentTaskSteps
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'currentTaskDescription',
      currentTaskDescription
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'contentId',
      contentIdChosen
    );
    await this.rivebot.setUservar(userPlatformId, 'content', contentText);
    await this.rivebot.setUservar(
      userPlatformId,
      'contentDescription',
      contentDescription
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'contentImgUrl',
      contentImgUrl
    );
    await this.rivebot.setUservar(userPlatformId, 'contentUrl', contentUrl);
    await this.rivebot.setUservar(
      userPlatformId,
      'workplanLink',
      client.plan_url
    );
    const chatUrl = client.plan_url.replace('plan', 'clientChat');
    await this.rivebot.setUservar(
      userPlatformId,
      'chatLink',
      chatUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'introVideoLink',
      constants.INTRO_VIDEO_URL
    );
    await this.rivebot.setUservar(userPlatformId, 'platform', platform);
    await this.rivebot.setUservar(
      userPlatformId,
      'recurringTaskContent',
      recurringTaskContent
    );
    await this.rivebot.setUservar(userPlatformId, 'helpMessage', helpMessage);
    await this.rivebot.setUservar(
      userPlatformId,
      'coachHelpResponse',
      coachHelpResponse
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'coachDirectMessage',
      coachDirectMessage
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'helpRequestId',
      helpRequestId
    );

    await this.rivebot.setUservar(userPlatformId, 'userMessage', userMessage);
    await this.rivebot.setUservar(userPlatformId, 'userAskedToStop', userAskedToStop);

    const referralLink = formatReferralLinkForNewFBSignups(userPlatformId);
    await this.rivebot.setUservar(
      userPlatformId,
      'referralLink',
      referralLink
    );
    await this.rivebot.setUservar(userPlatformId, 'isFinalTask', isFinalTask);
    await this.loadGifUrlsToRivebot(userPlatformId, taskNum);
  }

  async loadGifUrlsToRivebot(userPlatformId, taskNum) {
    const welcomeImgUrl = assetUrls.gifPath + assetUrls.welcome.introImgUrl;
    const workplanImgUrl = assetUrls.gifPath + assetUrls.welcome.workplanImgUrl;
    const introCelebrateImgUrl =
      assetUrls.gifPath + assetUrls.welcome.introCelebrateImgUrl;
    const taskNumImgUrl = taskNum !== null && taskNum > 0 && taskNum < 10
      ? assetUrls.gifPath + '04_Number' + taskNum + '.gif'
      : null;
    const storiesImgUrl =
      assetUrls.gifPath + getRandomItemFromArray(assetUrls.stories);
    const celebrationImgUrl =
      assetUrls.gifPath + getRandomItemFromArray(assetUrls.done);
    const recurringImgUrl =
      assetUrls.gifPath + getRandomItemFromArray(assetUrls.recurring);
    const checkinImgUrl =
      assetUrls.gifPath + getRandomItemFromArray(assetUrls.checkin);
    const coachSaysImgUrl =
      assetUrls.gifPath + getRandomItemFromArray(assetUrls.help);
    await this.rivebot.setUservar(
      userPlatformId,
      'recurringImgUrl',
      recurringImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'storiesImgUrl',
      storiesImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'celebrationImgUrl',
      celebrationImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'welcomeImgUrl',
      welcomeImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'workplanImgUrl',
      workplanImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'introCelebrateImgUrl',
      introCelebrateImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'coachSaysImgUrl',
      coachSaysImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'taskNumImgUrl',
      taskNumImgUrl
    );
    await this.rivebot.setUservar(
      userPlatformId,
      'checkinImgUrl',
      checkinImgUrl
    );
  }

  async overrideVarsInRivebot(opts, userPlatformId) {
    const keys = Object.keys(opts);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      await this.rivebot.setUservar (userPlatformId, key, opts[key]); // eslint-disable-line
    }
  }

  async getVariables(userPlatformId) {
    const variables = await this.rivebot.getUservars(userPlatformId);
    return variables ? variables[userPlatformId] : null;
  }

  // takes in the bot's message and platform and parses it into a more friendly message for Twilio + Facebook
  parseResponse(response, platform) {
    const sendRegex = /<send>/g;
    const regex = {
      image: /\^image\("(.*?)"\)/g,
      imageForSplit: /\^image\(".*"\)/g,
      template: /\^template\(([\s\S]*?)\)/g,
      templateForSplit: /\^template\(([\s\S]*)\)/g,
      templateStrings: /`([\s\S]*?)`/g,
      sms: /<sms>([\s\S]*?)<\/sms>/g,
      fb: /<fb>([\s\S]*?)<\/fb>/g,
      nonwhitespaceChars: /\S/,
    };
    if (platform === constants.FB) {
      response = response.replace(regex.sms, '');
      response = response.replace(regex.fb, '$1');
    } else if (platform === constants.SMS) {
      response = response.replace(regex.fb, '');
      response = response.replace(regex.sms, '$1');
    }
    const messages = response.split(sendRegex);
    const finalMessages = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageType = this.getMessageType(message, regex);
      if (messageType === 'text') {
        this.prepareTextMessage(finalMessages, message);
      } else if (messageType === 'image') {
        this.prepareImageMessage(finalMessages, message, regex);
      } else if (messageType === 'template') {
        this.prepareTemplateMessage(finalMessages, message, regex);
      }
    }
    return finalMessages;
  }

  getMessageType(message, regex) {
    // eslint-disable-line
    if (message.match(regex.image)) {
      return 'image';
    } else if (message.match(regex.template)) {
      return 'template';
    }
    return 'text';
  }

  prepareTextMessage(finalMessages, message) {
    // eslint-disable-line
    if (message.length) {
      finalMessages.push({
        type: 'text',
        message,
      });
    }
  }

  prepareImageMessage(finalMessages, message, regex) {
    // eslint-disable-line
    const imageUrls = message
      .match(regex.image)
      .map(tag => tag.replace(regex.image, '$1'));
    const textMessages = message.split(regex.imageForSplit);
    let text = null;
    const image = imageUrls[0];
    finalMessages.push({
      type: 'image',
      image,
    });
    for (let j = 0; j < textMessages.length; j++) {
      if (textMessages[j] && regex.nonwhitespaceChars.test(textMessages[j])) {
        text = textMessages[j];
        finalMessages.push({
          type: 'text',
          message: text,
        });
        break;
      }
    }
  }

  prepareTemplateMessage(finalMessages, message, regex) {
    // eslint-disable-line
    const defaultErrorMessage = {
      type: 'text',
      message: 'There was an error on our side. Type START and try again.',
    };
    let templateArgs = message
      .replace(regex.template, '$1')
      .match(regex.templateStrings);
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
        buttons: templateArgs.slice(1),
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
        buttons,
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
        buttons,
      };
    } else {
      messageToPush = defaultErrorMessage;
    }
    finalMessages.push(messageToPush);
  }

  async resetVariables(userPlatformId) {
    await this.rivebot.setUservar(userPlatformId, 'timeOfDay', null);
    await this.rivebot.setUservar(userPlatformId, 'days', null);
    await this.rivebot.setUservar(userPlatformId, 'hours', null);
    await this.rivebot.setUservar(userPlatformId, TOPICS.NEXT_TOPIC, null);
    await this.rivebot.setUservar(userPlatformId, 'nextMessage', null);
    await this.rivebot.setUservar(userPlatformId, 'contentViewed', null);
    await this.rivebot.setUservar(userPlatformId, 'taskComplete', null);
    await this.rivebot.setUservar(userPlatformId, 'resetHelp', null);
    await this.rivebot.setUservar(userPlatformId, 'helpMessage', null);
    await this.rivebot.setUservar(userPlatformId, 'sendHelpMessage', null);
    await this.rivebot.setUservar(userPlatformId, 'coachHelpResponse', null);
    await this.rivebot.setUservar(userPlatformId, 'userAskedToStop', null);
    await this.rivebot.setUservar(userPlatformId, 'requestResolved', null);
    await this.rivebot.setUservar(userPlatformId, 'isFinalTask', null);
    await this.rivebot.setUservar(userPlatformId, 'helpRequestId', null);
  }
};

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}

function formatReferralLinkForNewFBSignups(userPlatformId) {
  // returns just the phone number without the +1, FB referral postback doesn't properly handle '+' signs as a param
  if (userPlatformId) {
    if (
      userPlatformId.length === 12 &&
      userPlatformId[0] === '+' &&
      userPlatformId[1] === '1'
    ) {
      // is a phone number with +1
      // cannot rely on process.env.NODE_ENV because both staging and prod run
      // as 'production' when deployed. Set env var to true for staging deployment.
      // false for production.
      const refLink = !helpers.isStagingEnvironment()
        ? process.env.FB_REFERRAL_LINK
        : process.env.FB_REFERRAL_LINK_STAGING;
      const referralId = userPlatformId.slice(2);
      const referralLink = `${refLink}?ref=${referralId}`;
      return referralLink;
    } else if (userPlatformId.length === 10) {
      const referralLink = `${process.env.FB_REFERRAL_LINK}?ref=${userPlatformId}`;
      return referralLink;
    }
  }
  return null;
}
