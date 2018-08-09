import constants from './constants';
import assetUrls from './assets-manifest.json';

const path = require('path');
const RiveScript = require('rivescript');

export default class {
  constructor() {
    this.rivebot = new RiveScript();
  }

  async loadChatScripts() {
    await this.rivebot.loadDirectory(path.resolve(__dirname, '../scriptsv2'));
    this.rivebot.sortReplies();
  }

  async loadVarsToRiveBot(opts) {
    const {
      client,
      platform,
      userPlatformId,
      recurringTaskId,
      orgName,
      coach,
      currentTask,
      currentTaskSteps,
      currentTaskDescription,
      taskNum,
      contentIdChosen,
      contentText,
      contentUrl,
      contentImgUrl,
      contentDescription
    } = opts;
    await this.rivebot.setUservar(userPlatformId, 'topic', client.topic);
    await this.rivebot.setUservar(userPlatformId, 'username', client.first_name);
    await this.rivebot.setUservar(userPlatformId, 'coachName', coach.first_name);
    await this.rivebot.setUservar(userPlatformId, 'coachEmail', coach.email);
    await this.rivebot.setUservar(userPlatformId, 'orgName', orgName);
    await this.rivebot.setUservar(userPlatformId, 'taskNum', taskNum);
    await this.rivebot.setUservar(userPlatformId, 'currentTask', currentTask);
    await this.rivebot.setUservar(userPlatformId, 'currentTaskSteps', currentTaskSteps);
    await this.rivebot.setUservar(userPlatformId, 'currentTaskDescription', currentTaskDescription);
    await this.rivebot.setUservar(userPlatformId, 'contentId', contentIdChosen);
    await this.rivebot.setUservar(userPlatformId, 'content', contentText);
    await this.rivebot.setUservar(userPlatformId, 'contentDescription', contentDescription);
    await this.rivebot.setUservar(userPlatformId, 'contentImgUrl', contentImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'contentUrl', contentUrl);
    await this.rivebot.setUservar(userPlatformId, 'workplanLink', constants.WORKPLAN_URL);
    await this.rivebot.setUservar(userPlatformId, 'introVideoLink', constants.INTRO_VIDEO_URL);
    await this.rivebot.setUservar(userPlatformId, 'platform', platform);

    const referralId = formatReferralIdForNewFBSignups();
    await this.rivebot.setUservar(userPlatformId, 'referralId', referralId);
    await this.loadGifUrlsToRivebot(userPlatformId);
  }

  async loadGifUrlsToRivebot(userPlatformId, taskNum) {
    const welcomeImgUrl = assetUrls.gifPath + assetUrls.welcome.introImgUrl;
    const workplanImgUrl = assetUrls.gifPath + assetUrls.welcome.workplanImgUrl;
    const introCelebrateImgUrl = assetUrls.gifPath + assetUrls.welcome.introCelebrateImgUrl;
    const taskNumImgUrl = taskNum !== null && taskNum > 0 && taskNum < 10 ? assetUrls.gifPath + '04_Number' + taskNum + '.gif' : null;
    const storiesImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.stories);
    const celebrationImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.done);
    const recurringImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.recurring);
    const checkinImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.checkin);
    const coachSaysImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.help);
    await this.rivebot.setUservar(userPlatformId, 'recurringImgUrl', recurringImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'storiesImgUrl', storiesImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'celebrationImgUrl', celebrationImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'welcomeImgUrl', welcomeImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'workplanImgUrl', workplanImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'introCelebrateImgUrl', introCelebrateImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'coachSaysImgUrl', coachSaysImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'taskNumImgUrl', taskNumImgUrl);
    await this.rivebot.setUservar(userPlatformId, 'checkinImgUrl', checkinImgUrl);
  }
}

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}

function formatReferralIdForNewFBSignups(userPlatformId) { // returns just the phone number without the +1, FB referral postback doesn't properly handle '+' signs as a param
  if (userPlatformId.length > 2 && userPlatformId[0] === '+' && userPlatformId[1] === '1') {
    return userPlatformId.slice(2);
  }
  return userPlatformId;
}
