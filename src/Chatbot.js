import api from './api';
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
    const {
      platform,
      userPlatformId,
      userMessage,
      topic,
      userPressedGetStartedOnFBPayload,
      coachHelpResponse,
      recurringTaskId
    } = opts;

    await this.loadClientData(userPlatformId, userPressedGetStartedOnFBPayload);
    if (!this.client) { // client does not exist
      this.setUnrecognizedClientResponse();
      return;
    }
    this.addMessageToUserLog(userMessage);
    if (this.userAskedToStop(userMessage)) {
      return;
    }
    
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
}
