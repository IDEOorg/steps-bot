import constants from './constants';
const RiveScript = require('rivescript');

export default class {
  constructor() {
    this.rivebot = new RiveScript();
  }
  async loadChatScripts() {
    await this.rivebot.loadDirectory('scriptsv2');
    this.rivebot.sortReplies();
  }
}
