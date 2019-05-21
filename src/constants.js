const TOPICS = {
  NO_TOPIC: 'NO_TOPIC',
  ULTIMATE_DONE: 'ultimatedone',
  SETUP_FB: 'setupfb',
  HELP_USER_RESPONSE: 'helpuserresponse',
  HELP_USER_CONFIRM: 'helpuserconfirm',
  WELCOME: 'welcome',
  INTRO_TASK: 'introtask',
  CONTENT: 'content',
  RECURRING: 'recurring',
  WELCOME_WAIT: 'welcomewait',
  WELCOME_NEXT: 'welcomenext',
  NEXT_TOPIC: 'nextTopic',
  HELP: 'help',
  RANDOM: 'random',
  FOLLOW_UP: 'followup',
  CHECK_IN: 'checkin',
};

const STATUS = {
  NEEDS_ASSISTANCE: 'NEEDS_ASSISTANCE',
  ACTIVE: 'ACTIVE',
  WORKING: 'WORKING',
  AWAITING_HELP: 'AWAITING_HELP',
  COMPLETED: 'COMPLETED',
};

module.exports = {
  FB: 'fb',
  SMS: 'sms',
  WORKPLAN_URL: 'https://www.helloroo.org/my-tasks',
  INTRO_VIDEO_URL: 'https://youtu.be/dpUTlrxhKQw',
  DEFAULT_ERR_MESSAGE:
    'This message should not be showing up and is an error on our part.',
  UNAUTHORIZED:
    'Unauthorized oauth token. Perhaps refresh the bot oauth token?',
  TOPICS,
  STATUS,
  MORNING_CHECKIN: {
    time: 'MORNING',
    hour: 14,
    minute: 0,
    second: 0
  },
  AFTERNOON_CHECKIN: {
    time: 'AFTERNOON',
    hour: 18,
    minute: 30,
    second: 0
  },
};
