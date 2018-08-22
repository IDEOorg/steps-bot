import Chatbot from '../src/Chatbot';
import constants from '../src/constants';
import api from '../src/api';

test('setPlatform loads platform into chatbot', () => {
  const bot = new Chatbot();
  bot.setPlatform(constants.FB);
  expect(bot.platform).toEqual('fb');
});

test('loadClientData loads client data on valid user', async () => {
  const bot = new Chatbot();
  bot.setPlatform(constants.SMS);
  await bot.loadClientData('3333333333', null);
  expect(bot.client.id).toEqual(979);
  expect(bot.platform).toEqual('sms');
});

test('loadClientData sets client to null on invalid', async () => {
  const bot = new Chatbot();
  bot.setPlatform(constants.SMS);
  await bot.loadClientData('33433343333', null);
  expect(bot.client).toEqual(null);
  expect(bot.platform).toEqual('sms');
});

test('bot sets invalid message response on unidentified user', async () => {
  const bot = new Chatbot();
  await bot.getResponse({
    platform: constants.SMS,
    userPlatform: '3333333'
  });
  expect(bot.messagesToSendToClient[0].message).toContain('Sorry, we didn\'t recognize the');
  expect(bot.shouldUpdateClient).toEqual(false);
});

test('when user asks to stop, user no longer receives checkins and bot doesn\'t message but does update client', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: [{ something: 'something' }]
  };
  bot.userMessage = 'stop';
  if (bot.userAskedToStop()) {
    bot.handleIfUserAskedToStop();
  }
  expect(bot.client.checkin_times).toEqual([]);
  expect(bot.shouldMessageClient).toEqual(false);
  expect(bot.shouldUpdateClient).toEqual(true);
});

test('when user asks to stop, bot still sends message to user if user is on fb platform', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: [{ something: 'something' }]
  };
  bot.userMessage = 'stop';
  bot.platform = 'fb';
  if (bot.userAskedToStop()) {
    bot.handleIfUserAskedToStop();
  }
  expect(bot.client.checkin_times).toEqual([]);
  expect(bot.shouldMessageClient).toEqual(true);
  expect(bot.shouldUpdateClient).toEqual(true);
});

test('userAskedToFastForward returns true when user types ff', async () => {
  const bot = new Chatbot();
  bot.userMessage = 'ff';
  let outcome = bot.userAskedToFastForward();
  expect(outcome).toEqual(true);
  bot.userMessage = 'ffs';
  outcome = bot.userAskedToFastForward();
  expect(outcome).toEqual(false);
});

test('fast forward functionality returns desired payload when there are checkin times', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: [
      {
        topic: 'content',
        message: 'startprompt',
        time: 1533321000526
      },
      {
        topic: 'checkin',
        message: 'startprompt',
        time: 23480192835092385
      }
    ]
  };
  const payload = bot.fastForwardUser();
  expect(bot.client.topic).toEqual('content');
  expect(bot.userMessage).toEqual('startprompt');
  expect(payload.recurringTaskId).toEqual(null);
  expect(bot.client.checkin_times.length).toEqual(1);
});

test('fast forward returns message saying there are no more checkins to fast forward when there are no checkins', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: null
  };
  expect(bot.fastForwardUser()).toEqual(null);
});

/* TODO ff functionality for recurring tasks, make sure they're not removed until they're supposed to be */

test('assignTopicForNewUser should assign the proper topic for new users', () => {
  const bot = new Chatbot();
  bot.client = {
    platform: 'FBOOK',
    topic: 'setupfb',
  };
  bot.platform = 'fb';
  bot.assignTopicForNewUser();
  expect(bot.client.topic).toEqual('welcome');

  bot.client = {
    platform: 'FBOOK',
    topic: null
  };
  bot.assignTopicForNewUser();
  expect(bot.client.topic).toEqual('welcome');

  bot.platform = 'sms';
  bot.client = {
    platform: 'FBOOK',
    topic: null
  };
  bot.assignTopicForNewUser();
  expect(bot.client.topic).toEqual('setupfb');

  bot.client = {
    platform: 'SMS',
    topic: null
  };
  bot.assignTopicForNewUser();
  expect(bot.client.topic).toEqual('welcome');

  bot.client = {
    platform: null,
    topic: null
  };
  bot.assignTopicForNewUser();
  expect(bot.client.topic).toEqual('welcome');
});

const tasks = [
  {
    id: 779,
    title: 'Buy cake',
    category: 'custom',
    description: 'Cake good. ',
    status: 'COMPLETED',
    recurring: null,
    steps: [
      {
        text: 'Earn dollar. '
      },
      {
        text: 'Eat cake. '
      }
    ],
    order: 0,
    original_task_id: null
  },
  {
    id: 422,
    title: 'Recurring Task',
    description: 'If you want or need more income, you might be able to get it from current employment.',
    status: 'ACTIVE',
    recurring: {
      frequency: 1,
      duration: 30
    },
    steps: [
      {
        text: 'Read the employee handbook to learn about the process of getting a raise at your company.',
        note: null
      }
    ],
    order: 1
  },
  {
    id: 777,
    title: 'Ask for a raise at work',
    description: 'If you want or need more income, you might be able to get it from current employment.',
    status: 'ACTIVE',
    recurring: null,
    steps: [
      {
        text: 'Read the employee handbook to learn about the process of getting a raise at your company.',
        note: null
      },
      {
        text: 'Schedule a time to speak with your manager, or once you see that they are available ask if they can speak privately.',
        note: null
      }
    ],
    order: 2
  }
];

test('getCurrentTaskData gets correct task data', async () => {
  const bot = new Chatbot();
  bot.client = {
    tasks: []
  };
  const noTaskDataOutput = bot.getCurrentTaskData();
  expect(noTaskDataOutput.currentTask).toEqual(null);
  expect(noTaskDataOutput.currentTaskSteps).toEqual(null);
  expect(noTaskDataOutput.currentTaskDescription).toEqual(null);
  bot.client = {
    tasks
  };
  const taskDataOutput = bot.getCurrentTaskData();
  expect(taskDataOutput.currentTask).toEqual('Ask for a raise at work');
  expect(taskDataOutput.currentTaskDescription).toContain('Why it matters');
  expect(taskDataOutput.currentTaskDescription).toContain('If you want or need more');
  expect(taskDataOutput.currentTaskSteps).toContain('Step 1');
  expect(taskDataOutput.currentTaskSteps).toContain('Read the employee handbook');
});

test('getTaskNum gets correct task num', async () => {
  const bot = new Chatbot();
  bot.client = {
    tasks
  };
  expect(bot.getTaskNum()).toEqual(3);
  bot.client = {
    tasks: []
  };
  expect(bot.getTaskNum()).toEqual(0);
});

test('setUserIfWorkplanComplete works', async () => {
  const bot = new Chatbot();
  bot.client = {
    topic: null,
    checkin_times: [{ test: 1 }],
    tasks: [
      { something: 1 }
    ]
  };
  bot.setUserIfWorkplanComplete(null);
  expect(bot.client.topic).toEqual('ultimatedone');
  expect(bot.client.checkin_times).toEqual([]);
});

test('loadStoryContent doesn\'t send anything if all content has been viewed', async () => {
  const bot = new Chatbot();
  bot.client = {
    id: 1033,
    topic: 'content'
  };
  const payload = await bot.loadStoryContent('startprompt');
  expect(bot.shouldMessageClient).toEqual(false);
  expect(payload.contentIdChosen).toEqual(null);
  expect(payload.contentText).toEqual(null);
});

test('loadStoryContent loads proper content', async () => {
  const bot = new Chatbot();
  bot.client = {
    id: 1035,
    topic: 'content'
  };
  const payload = await bot.loadStoryContent('startprompt');
  expect(bot.shouldMessageClient).toEqual(true);
  expect(payload.contentIdChosen).toEqual(44);
  expect(payload.contentText).toEqual('Gail\'s Story');
  expect(payload.contentDescription).toContain('Gail');
  expect(payload.contentUrl).toContain('bit');
  expect(payload.contentImgUrl).toContain('aws');
});

test('getRemainingVarsRivebotNeeds gets all the necessary variables', async () => {
  const client = await api.getUserDataFromDB('fb', '1035'); // the 1035 here is the fake fb_id.
  const bot = new Chatbot();
  bot.client = client;
  bot.client.tasks = await api.getClientTasks(bot.client.id);
  bot.userMessage = 'startprompt';
  const payload = await bot.getRemainingVarsRivebotNeeds();
  expect(payload.orgName).toEqual('IDEO.org');
  expect(payload.coach.first_name).toEqual('Michael');
  expect(payload.currentTask).toContain('Consider enrolling in');
  expect(payload.currentTaskSteps).toContain('DMP');
  expect(payload.currentTaskDescription).toContain('DMP');
  expect(payload.taskNum).toEqual(1);
  expect(payload.contentIdChosen).toEqual(44);
  expect(payload.contentText).toEqual('Gail\'s Story');
  expect(payload.contentDescription).toContain('Gail');
  expect(payload.contentUrl).toContain('bit');
  expect(payload.contentImgUrl).toContain('aws');
});
