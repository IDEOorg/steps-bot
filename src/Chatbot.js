require('dotenv').config();
const api = require('./api');
const Rivebot = require('./Rivebot');
const constants = require('./constants');
const { buildContentUrl } = require('./tracker');

module.exports = class Chatbot {
  constructor() {
    this.platform = null;
    this.client = null;
    this.messagesToSendToClient = null;
    this.shouldMessageClient = true;
    this.shouldUpdateClient = true;
    this.rivebot = new Rivebot();
    this.userMessage = null;
    this.coachHelpResponse = null;
    this.recurringTaskId = null;
  }

  async getResponse(opts) {
    const {
      platform,
      userPlatformId,
      userMessage,
      topic,
      userPressedGetStartedOnFBPayload,
      recurringTaskId
    } = opts;
    this.userMessage = formatUserMessage(userMessage);
    this.userPlatformId = userPlatformId;
    this.setPlatform(platform); // stores the platform the bot received the message from
    await this.loadClientData(userPlatformId, userPressedGetStartedOnFBPayload); // gets and stores the client's info from the api
    if (!this.client) { // client does not exist, break the system and just send an 'unrecognized user text'
      this.setUnrecognizedClientResponse();
      return;
    }
    if (userPressedGetStartedOnFBPayload) { // if the user pressed on the 'Get Started' button, record the user's fb id
      this.client.fb_id = userPlatformId;
    }
    if (topic) { // manually set the client's topic if a checkin time has hit or the user fast forwarded
      this.client.topic = topic;
    }
    this.addMessageToUserLog(); // adds the user's message to the Client Message API
    if (this.userAskedToStop()) {
      this.handleIfUserAskedToStop();
      return;
    }
    if (this.userAskedToFastForward()) {
      const ffPayload = this.fastForwardUser();
      if (ffPayload === null) { // if there's no checkin to fast forward to, don't send a message
        this.shouldMessageClient = false;
        this.shouldUpdateClient = false;
        return;
      }
      this.recurringTaskId = ffPayload.recurringTaskId;
    }
    if (this.client.topic === null || this.client.topic === 'setupfb') { // handles new users
      this.assignTopicForNewUser();
    }
    this.client.tasks = await api.getClientTasks(this.client.id); // loads client's tasks
    const remainingRivebotVars = await this.getRemainingVarsRivebotNeeds(); // pull all the remaining data rivebot needs to send a reply
    let recurringTaskContent = null;
    if (recurringTaskId) {
      const recurringTask = await api.getTask(recurringTaskId);
      recurringTaskContent = recurringTask.title;
    }
    this.setUserIfWorkplanComplete(remainingRivebotVars.currentTask);
    const rivebotVars = Object.assign({
      client: this.client,
      platform: this.platform,
      userMessage: this.userMessage,
      userPlatformId, // this is NOT the same as client.id (userPlatformId is either the fb id or the client's phone number)
      recurringTaskContent
    }, remainingRivebotVars);
    await this.rivebot.loadVarsToRiveBot(rivebotVars);
    const response = await this.rivebot.reply(userPlatformId, this.userMessage);
    const messages = this.rivebot.parseResponse(response, this.platform);
    this.messagesToSendToClient = messages;
  }

  async updateClientToDB() {
    const variables = await this.rivebot.getUservars(this.userPlatformId);
    console.log(variables);
  }

  /* ***** HELPER FUNCTIONS FOR getResponse FUNCTION ****** */
  async loadClientData(userPlatformId, userPressedGetStartedOnFBPayload) {
    let userInfo = null;
    if (userPressedGetStartedOnFBPayload) {
      userInfo = await api.getUserDataFromDB(this.platform, userPressedGetStartedOnFBPayload);
      if (userInfo) {
        userInfo.topic = 'welcome';
        userInfo.fb_id = userPlatformId;
      }
    } else {
      userInfo = await api.getUserDataFromDB(this.platform, userPlatformId);
    }
    this.client = userInfo;
  }

  setPlatform(platform) {
    this.platform = platform;
  }

  setUnrecognizedClientResponse() {
    let errMessage = null;
    // platform is FB
    if (this.platform === constants.FB) {
      errMessage = 'Sorry, we didn\'t recognize the Facebook account you sent this from. If you believe this is a mistake, contact your coach.';
    } else { // platform is SMS
      errMessage = 'Sorry, we didn\'t recognize the phone number you sent this from. If you believe this is a mistake, contact your coach.';
    }
    this.shouldUpdateClient = false;
    this.messagesToSendToClient = [{
      type: 'text',
      message: errMessage
    }];
  }

  userAskedToStop() { // eslint-disable-line
    if (this.userMessage === 'stop') {
      return true;
    }
    return false;
  }

  handleIfUserAskedToStop() {
    this.client.checkin_times = [];
    if (this.platform !== constants.FB) {
      this.shouldMessageClient = false;
    }
  }

  async addMessageToUserLog() {
    if (this.userMessage !== 'startprompt' && this.userMessage !== 'pinguser') {
      await api.createMessage(null, this.client.id, process.env.BOT_ID, this.userMessage, this.client.topic);
    }
  }

  userAskedToFastForward() { // eslint-disable-line
    if (this.userMessage === 'ff') {
      return true;
    }
    return false;
  }

  fastForwardUser() {
    const checkInTimes = this.client.checkin_times;
    let userMessage = null;
    let topic = null;
    let recurringTaskId = null;
    let soonestTime = Number.MAX_VALUE;
    let soonestCheckInIndex = null;
    if (!checkInTimes) {
      return null;
    }
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
      if (!recurringTaskId) {
        recurringTaskId = null;
      }
      this.client.checkin_times.splice(soonestCheckInIndex, 1);
      this.client.topic = topic;
    } else {
      return null;
    }
    this.userMessage = userMessage;
    return {
      recurringTaskId
    };
  }

  assignTopicForNewUser() {
    // this.platform is the platform the bot received the message from, this.client.platform is the platform the client should be using
    if (this.client.platform === 'FBOOK' && this.platform === constants.SMS) {
      this.client.topic = 'setupfb';
    } else if (this.client.platform === 'FBOOK' && this.platform === constants.FB) {
      this.client.topic = 'welcome';
    } else if ((this.client.platform === 'SMS' || this.client.platform === null) && this.platform === constants.SMS) {
      this.client.topic = 'welcome';
    } else { // client is supposed to use SMS but somehow got access to Facebook
      this.client.topic = 'welcome';
      this.shouldMessageClient = false;
    }
  }

  async getRemainingVarsRivebotNeeds() {
    const orgName = await api.getOrgName(this.client.org_id);
    const coach = await api.getCoach(this.client.coach_id);
    const {
      currentTask,
      currentTaskSteps,
      currentTaskDescription
    } = this.getCurrentTaskData(this.client.tasks);
    const taskNum = this.getTaskNum();
    console.log(this.userMessage);
    const {
      contentIdChosen,
      contentText,
      contentUrl,
      contentImgUrl,
      contentDescription
    } = await this.loadStoryContent(this.userMessage);
    return {
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
      contentDescription,
      coachHelpResponse: this.coachHelpResponse
    };
  }

  getCurrentTaskData() { //eslint-disable-line
    let currentTask = null;
    let currentTaskDescription = null;
    let currentTaskSteps = null;
    const tasks = this.client.tasks;
    for (let i = 0; i < tasks.length; i++) {
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

  getTaskNum() { // eslint-disable-line
    const tasks = this.client.tasks;
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

  async loadStoryContent(userMessage) { //eslint-disable-line
    let contentIdChosen = null;
    let contentText = null;
    let contentUrl = null;
    let contentImgUrl = null;
    let contentDescription = null;
    let viewedMedia = null;
    if ((this.client.topic === 'content' && userMessage === 'startprompt') || userMessage === 'contenttopic' || userMessage === 'ff') {
      viewedMedia = await api.getViewedMediaIds(this.client.id);
      const allContent = await api.getAllMedia();
      for (let i = 0; i < allContent.length; i++) {
        const content = allContent[i];
        if (!viewedMedia || !viewedMedia.includes(content.id)) {
          contentIdChosen = content.id;
          contentText = content.title;
          contentUrl = await buildContentUrl(content, this.client); // eslint-disable-line
          contentImgUrl = content.image;
          contentDescription = content.description;
          break;
        }
      }
    }
    if (contentIdChosen === null) {
      this.shouldMessageClient = false;
    }
    return {
      contentIdChosen,
      contentText,
      contentUrl,
      contentImgUrl,
      contentDescription
    };
  }

  setUserIfWorkplanComplete(currentTask) {
    if (currentTask === null && this.client.tasks.length > 0) {
      this.client.topic = 'ultimatedone';
      this.client.checkin_times = [];
    }
  }
};

function formatUserMessage(userMessage) {
  if (userMessage) {
    return userMessage.toLowerCase().trim();
  }
  return 'startprompt'; // should never reach this unless something unexpected happens
}
