import api from './api';
import Rivebot from './Rivebot';
import constants from './constants';

export default class {
  constructor() {
    this.platform = null;
    this.client = null;
    this.response = null;
    this.shouldMessageClient = true;
    this.shouldUpdateClient = true;
  }

  async getResponse(opts) {
    let {
      platform,
      userPlatformId,
      userMessage,
      topic,
      userPressedGetStartedOnFBPayload,
      coachHelpResponse,
      recurringTaskId
    } = opts;
    this.setPlatform(platform);
    await this.loadClientData(userPlatformId, userPressedGetStartedOnFBPayload);
    if (userPressedGetStartedOnFBPayload) {
      this.client.fb_id = userPlatformId;
    }
    if (!this.client) { // client does not exist
      this.setUnrecognizedClientResponse();
      return;
    }
    this.addMessageToUserLog(userMessage);
    if (this.userAskedToStop(userMessage)) {
      return;
    }
    if (this.userAskedToFastForward(userMessage)) {
      const ffPayload = this.fastForwardUser();
      if (ffPayload === null) {
        this.shouldMessageClient = false;
        return;
      }
      userMessage = ffPayload.userMessage;
      topic = ffPayload.topic;
      recurringTaskId = ffPayload.recurringTaskId;
    }
    if (topic) {
      this.client.topic = topic;
    }
    if (this.client.topic === null || this.client.topic === 'setupfb') {
      this.assignTopicForNewUser();
    }
    this.client.tasks = await api.getClientTasks(this.client.id);
    // const rivebot = new Rivebot();
    // await rivebot.loadVarsToRiveBot({
    //   client: this.client,
    //   platform: this.platform,
    //   userMessage,
    //   userPlatformId, // this is NOT the same as client.id (userPlatformId is either the fb id or the client's phone number)
    //   recurringTaskId
    // });
  }

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
      this.response = {
        messages: [{
          type: 'text',
          message: errMessage
        }]
      };
    }
    // platform is SMS
    errMessage = 'Sorry, we didn\'t recognize the phone number you sent this from. If you believe this is a mistake, contact your coach.';
    this.response = {
      messages: [{
        type: 'text',
        message: errMessage
      }]
    };
  }

  userAskedToStop(userMessage) {
    if (userMessage.toLowerCase().trim() === 'stop') {
      this.client.checkin_times = [];
      this.shouldMessageClient = false;
      return true;
    }
    return false;
  }

  async addMessageToUserLog(userMessage) {
    if (userMessage !== 'startprompt' && userMessage !== 'pinguser') {
      await api.createMessage(null, this.client.id, constants.BOT_ID, userMessage, this.client.topic);
    }
  }

  userAskedToFastForward(userMessage) { // eslint-disable-line
    if (userMessage.toLowerCase().trim() === 'ff') {
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
    return {
      userMessage,
      topic,
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
}
