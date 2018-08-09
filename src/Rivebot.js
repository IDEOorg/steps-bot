import constants from './constants';
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
}
