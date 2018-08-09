import constants from './constants';
import assetUrls from './assets-manifest.json';
import api from './api';

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
      userMessage,
      userPlatformId,
      recurringTaskId
    } = opts;
    const orgName = await api.getOrgName(this.client.org_id);
    const coach = await api.getCoach(this.client.coach_id);
    const {
      currentTask,
      currentTaskSteps,
      currentTaskDescription
    } = this.getCurrentTaskData(this.client.tasks);
    const taskNum = this.getTaskNum();
    this.rivebot.setUservar(userPlatformId, 'topic', this.client.topic);
    this.rivebot.setUservar(userPlatformId, 'username', this.client.first_name);
    this.rivebot.setUservar(userPlatformId, 'coachName', coach.first_name);
    this.rivebot.setUservar(userPlatformId, 'coachEmail', coach.email);
    this.rivebot.setUservar(userPlatformId, 'orgName', orgName);
    this.rivebot.setUservar(userPlatformId, 'taskNum', taskNum);
    this.rivebot.setUservar(userPlatformId, 'contentId', contentIdChosen);
    this.rivebot.setUservar(userPlatformId, 'content', contentText);
    this.rivebot.setUservar(userPlatformId, 'contentDescription', contentDescription);
    this.rivebot.setUservar(userPlatformId, 'contentImgUrl', contentImgUrl);
    this.rivebot.setUservar(userPlatformId, 'contentUrl', contentUrl);
    this.rivebot.setUservar(userPlatformId, 'currentTask', currentTask);
    this.rivebot.setUservar(userPlatformId, 'currentTaskSteps', currentTaskSteps);
    this.rivebot.setUservar(userPlatformId, 'currentTaskDescription', currentTaskDescription);
    this.rivebot.setUservar(userPlatformId, 'workplanLink', constants.WORKPLAN_URL);
    this.rivebot.setUservar(userPlatformId, 'introVideoLink', constants.INTRO_VIDEO_URL);
    this.rivebot.setUservar(userPlatformId, 'platform', platform);
    this.rivebot.setUservar(userPlatformId, 'referralId', referralId);
    this.loadGifUrlsToRivebot(userPlatformId);
  }

  getCurrentTaskData(tasks) { //eslint-disable-line
    let currentTask = null;
    let currentTaskDescription = null;
    let currentTaskSteps = null;
    for (let i = 0; i < tasks.length; i++) {
      // if (!tasks[i].recurring) {
      //   taskNum = i + 1;
      // }
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
    // if (currentTask === null && tasks.length > 0) {
    //   topic = 'ultimatedone';
    // }

    if (currentTaskDescription && currentTaskDescription.length !== 0) {
      currentTaskDescription = '▪️ Why it matters:\n' + currentTaskDescription;
    }

    if (currentTaskSteps !== null) {
      currentTaskSteps = currentTaskSteps.map((step, i) => {
        return `▪️ Step ${i + 1}: ${step.text}`;
      });
      currentTaskSteps = currentTaskSteps.join('\n\n');
    }
    return {
      currentTask,
      currentTaskDescription,
      currentTaskSteps
    };
  }

  getTaskNum(tasks) { // eslint-disable-line
    let taskNum = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].recurring) {
        taskNum = i + 1;
      }
      if (tasks[i].status === 'ACTIVE' && !tasks[i].recurring) {
        break;
      }
    }
    return taskNum;
  }

  loadGifUrlsToRivebot(userPlatformId, taskNum) {
    const welcomeImgUrl = assetUrls.gifPath + assetUrls.welcome.introImgUrl;
    const workplanImgUrl = assetUrls.gifPath + assetUrls.welcome.workplanImgUrl;
    const introCelebrateImgUrl = assetUrls.gifPath + assetUrls.welcome.introCelebrateImgUrl;
    const taskNumUrl = taskNum !== null && taskNum > 0 && taskNum < 10 ? assetUrls.gifPath + '04_Number' + taskNum + '.gif' : null;
    const storiesImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.stories);
    const celebrationImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.done);
    const recurringImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.recurring);
    const checkinImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.checkin);
    const coachSaysImgUrl = assetUrls.gifPath + getRandomItemFromArray(assetUrls.help);
    this.rivebot.setUservar(userPlatformId, 'recurringImgUrl', recurringImgUrl);
    this.rivebot.setUservar(userPlatformId, 'storiesImgUrl', storiesImgUrl);
    this.rivebot.setUservar(userPlatformId, 'celebrationImgUrl', celebrationImgUrl);
    this.rivebot.setUservar(userPlatformId, 'welcomeImgUrl', welcomeImgUrl);
    this.rivebot.setUservar(userPlatformId, 'workplanImgUrl', workplanImgUrl);
    this.rivebot.setUservar(userPlatformId, 'introCelebrateImgUrl', introCelebrateImgUrl);
    this.rivebot.setUservar(userPlatformId, 'coachSaysImgUrl', coachSaysImgUrl);
    this.rivebot.setUservar(userPlatformId, 'taskNumImgUrl', taskNumUrl);
    this.rivebot.setUservar(userPlatformId, 'checkinImgUrl', checkinImgUrl);
  }
}

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}
