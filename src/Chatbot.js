require('dotenv').config();
const api = require('./api');
const constants = require('./constants');
const { buildContentUrl, trackStopRequest } = require('./tracker');

module.exports = class Chatbot {
  constructor(opts) {
    this.platform = opts.platform;
    this.userMessage = opts.userMessage;
    this.userPlatformId = opts.userPlatformId;
    this.userPressedGetStartedOnFBPayload = opts.userPressedGetStartedOnFBPayload;
    this.topic = opts.topic;
    this.recurringTaskId = opts.recurringTaskId;
    this.coachHelpResponse = opts.coachHelpResponse;
    this.rb = opts.rivebot;
    this.currentTask = null;
    this.client = null;
    this.messagesToSendToClient = null;
    this.shouldMessageClient = true;
    this.shouldUpdateClient = true;
  }

  async getResponse() {
    await this.loadClientData(); // gets and stores the client's info from the api
    if (this.client === constants.UNAUTHORIZED) {
      return; // unauthorized oauth token . Consider refreshing the token.
    }
    if (!this.client) { // client does not exist, break the system and just send an 'unrecognized user text'
      this.setUnrecognizedClientResponse();
      return;
    }
    this.formatUserMessage();
    if (this.topic) { // manually set the client's topic if a checkin time has hit
      this.client.topic = this.topic;
    }
    if (this.client.platform === null) { // due to a third party form library in the Admin interface, when a client is SMS, the platform will be null instead of 'SMS'
      this.client.platform = 'SMS';
    }
    this.addMessageToUserLog(); // adds the user's message to the Client Message API
    if (this.userAskedToStop()) {
      this.handleIfUserAskedToStop();
    }
    if (this.userAskedToFastForward()) {
      const ableToFastForward = this.fastForwardUser();
      if (!ableToFastForward) { // if there's no checkin to fast forward to, don't send a message
        this.shouldMessageClient = false;
        this.shouldUpdateClient = false;
        return;
      }
    }
    if (this.client.topic === null || this.client.topic === 'setupfb') { // handles new users
      this.assignTopicForNewUser();
    }
    this.client.tasks = await api.getClientTasks(this.client.id); // loads client's tasks
    this.addRecurringTasksToCheckInList(); // on introtask topic loads any recurring tasks the user has
    const remainingRivebotVars = await this.getRemainingVarsRivebotNeeds(); // pull all the remaining data rivebot needs to send a reply
    this.setUserIfWorkplanComplete();
    const rivebotVars = Object.assign({
      client: this.client,
      platform: this.platform,
      userMessage: this.userMessage,
      userPlatformId: this.userPlatformId, // this is NOT the same as client.id (userPlatformId is either the fb id or the client's phone number)
    }, remainingRivebotVars);
    await this.rb.loadVarsToRiveBot(rivebotVars);
    const response = await this.rb.rivebot.reply(this.userPlatformId, this.userMessage);
    const messages = this.rb.parseResponse(response, this.platform);
    this.messagesToSendToClient = messages;
    await this.dontSendMessageIfNoWorkplan();
  }

  /* ***** HELPER FUNCTIONS FOR getResponse FUNCTION ****** */
  formatUserMessage() {
    if (this.userMessage && this.client.topic === 'helpuserresponse') {
      return; // don't modify the capitalization of the user's response
    }
    if (this.userMessage) {
      this.userMessage = this.userMessage.toLowerCase().trim();
      return;
    }
    this.userMessage = 'startprompt'; // should never reach this unless something unexpected happens
  }

  // gets and stores the client's info from the api
  async loadClientData() {
    let userInfo = null;
    if (this.userPressedGetStartedOnFBPayload) {
      userInfo = await api.getUserDataFromDB(this.platform, this.userPressedGetStartedOnFBPayload);
      if (userInfo) {
        userInfo.topic = 'welcome';
        userInfo.fb_id = this.userPlatformId; // if the user pressed on the 'Get Started' button, record the user's fb id
      }
    } else {
      userInfo = await api.getUserDataFromDB(this.platform, this.userPlatformId);
    }
    this.client = userInfo;
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
    trackStopRequest({
      id: this.client.id,
      topic: this.client.topic
    });
    this.client.follow_up_date = null;
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

  // gets all of the client's checkin times, finds the next checkin time,
  // modifies the client data to take that checkin's data, and then removes
  // that checkin time from the client's list of checkins
  fastForwardUser() {
    const checkInTimes = this.client.checkin_times;
    let userMessage = null;
    let topic = null;
    let recurringTaskId = null;
    let soonestTime = Number.MAX_VALUE;
    let soonestCheckInIndex = null;
    if (!checkInTimes) {
      return false;
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
      console.log('**topic=', topic);
      recurringTaskId = checkInTimes[soonestCheckInIndex].task_id;
      if (!recurringTaskId) {
        recurringTaskId = null;
      }
      this.client.checkin_times.splice(soonestCheckInIndex, 1);
      this.client.topic = topic;
    } else {
      return false;
    }
    this.userMessage = userMessage;
    this.recurringTaskId = recurringTaskId;
    return true;
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

  async dontSendMessageIfNoWorkplan() {
    if ((!this.client.tasks || this.client.tasks.length === 0) && this.client.topic !== 'setupfb' && this.client.topic !== 'welcome' && this.client.topic !== 'welcomenext' && this.client.topic !== 'welcomewait') {
      this.shouldMessageClient = false;
      await this.rb.overrideVarsInRivebot({
        days: 2,
        nextTopic: this.client.topic,
        nextMessage: 'startprompt',
        timeOfDay: 'morning'
      }, this.userPlatformId);
    }
  }

  addRecurringTasksToCheckInList() {
    if (this.client.topic === 'introtask') {
      const clientTasks = this.client.tasks;
      const existingRecurringCheckins = this.client.checkin_times.map(checkin => checkin.task_id);
      for (let i = 0; i < clientTasks.length; i++) {
        const task = clientTasks[i];
        if (task.recurring) {
          if (!existingRecurringCheckins.includes(task.id)) {
            this.client.checkin_times.push({
              topic: 'recurring',
              message: 'startprompt',
              time: Date.now(),
              createdDate: new Date(),
              recurringTaskId: task.id
            });
          }
        }
      }
    }
  }

  async getRemainingVarsRivebotNeeds() {
    const orgName = await api.getOrgName(this.client.org_id);
    const coach = await api.getCoach(this.client.coach_id);
    const helpMessage = await this.getHelpMessage();
    let recurringTaskContent = null;
    if (this.recurringTaskId) { // this will only be true if the bot is sending the daily reminder right now
      const recurringTask = await api.getTask(this.recurringTaskId);
      recurringTaskContent = recurringTask.title;
    }
    const {
      currentTaskTitle,
      currentTaskSteps,
      currentTaskDescription
    } = this.getAndSetCurrentTaskData(this.client.tasks); // also sets this.currentTask
    const taskNum = this.getTaskNum();
    const isFinalTask = this.isFinalTask();
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
      currentTaskTitle,
      currentTaskSteps,
      currentTaskDescription,
      recurringTaskContent,
      taskNum,
      contentIdChosen,
      contentText,
      contentUrl,
      contentImgUrl,
      contentDescription,
      coachHelpResponse: this.coachHelpResponse,
      helpMessage,
      isFinalTask
    };
  }

  getHelpMessage() {
    if (this.client.topic === 'helpuserresponse') {
      return this.userMessage;
    }
    return null;
  }

  // gets the current task, current task title, current task description, and currenttask steps. If there's no workplan or if the user has completed their workplan, the fields will be null
  getAndSetCurrentTaskData() {
    let currentTask = null;
    let currentTaskTitle = null;
    let currentTaskDescription = null;
    let currentTaskSteps = null;
    const tasks = this.client.tasks;
    if (tasks) {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].status === 'ACTIVE' && !tasks[i].recurring) {
          let steps = tasks[i].steps; // eslint-disable-line
          if (steps === null) {
            steps = [];
          }
          currentTask = tasks[i];
          currentTaskTitle = tasks[i].title;
          currentTaskSteps = steps;
          currentTaskDescription = tasks[i].description;
          break;
        }
      }
    }
    if (currentTaskDescription && currentTaskDescription.length !== 0) {
      currentTaskDescription = '▪️ Why it matters:\n' + currentTaskDescription;
    }
    if (currentTaskSteps) {
      currentTaskSteps = currentTaskSteps.map((step, i) => {
        return `▪️ Step ${i + 1}: ${step.text}`;
      });
      currentTaskSteps = currentTaskSteps.join('\n\n');
    }
    this.currentTask = currentTask;
    return {
      currentTaskTitle,
      currentTaskDescription,
      currentTaskSteps
    };
  }

  // gets task number of current task
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

  // checks if the current task the user is on is the final task (used to detect ultimatedone potential)
  isFinalTask() {
    const tasks = this.client.tasks;
    if (tasks) {
      const activeTasks = tasks.filter((task) => {
        return task.status === 'ACTIVE' && !task.recurring;
      });
      if (activeTasks.length === 1) {
        return true;
      }
    }
    return false;
  }

  // fetches content data if user is supposed to receive content
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
    if (contentIdChosen === null && ((this.client.topic === 'content' && userMessage === 'startprompt') || userMessage === 'contenttopic')) {
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

  checkAllTasksCompleted(tasks) {
    tasks.forEach((task) => {
      if (!task.completed) {
        console.log('there is task that is not complete', task);
        return false;
      }
    });
    console.log('all tasks have been completed');
    return true;
  }

  setUserIfWorkplanComplete() {
    if (!this.currentTask && this.client.tasks.length > 0 && this.checkAllTasksCompleted(this.client.tasks)) {
      console.log('setting topic to `ultimatedone`');
      this.client.topic = 'ultimatedone';
      this.client.checkin_times = [];
    }
  }
};
