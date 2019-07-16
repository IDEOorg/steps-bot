import Chatbot from '../src/Chatbot';
import api from '../src/api';
import constants from '../src/constants';

const Rivebot = require('../src/Rivebot');
const mockdata = require('./mockdata');

const {
  mockTasks,
  orgs,
  mockCoach,
  media,
  viewedMediaIDs,
  viewedAllMediaIDs,
  taskList
} = mockdata;

// Mock functions
api.getAllClients = jest.fn(() => Promise.resolve(mockdata.clients));
api.createMessage = jest.fn(() => Promise.resolve());
api.getOrg = jest.fn(orgID => Promise.resolve(orgs[0][orgID]));
api.getCoach = jest.fn(coachID => Promise.resolve(mockCoach));
api.getViewedMediaIds = jest.fn(clientID => Promise.resolve(viewedMediaIDs));
api.getAllMedia = jest.fn(() => Promise.resolve(media));
api.getClientTasks = jest.fn(clientID =>
  Promise.resolve(mockTasks[0][clientID])
);

const rivebot = new Rivebot();
const clientData = mockdata.clients[0];
const userPlatformId = clientData.phone;
const platform = constants.SMS;
const userMessage = 'b';
const userPressedGetStartedOnFBPayload = null;
const topic = null;
const recurringTaskId = null;
const coachHelpResponse = null;
const coachDirectMessage = null;

test('setPlatform loads platform into chatbot', () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });

  expect(bot.platform).toEqual('sms');
});

test('loadClientData loads client data on valid user', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  await bot.loadClientData();
  expect(bot.client.id).toEqual(717);
  expect(bot.platform).toEqual('sms');
});

test('loadClientData sets client to null on invalid', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId: '1010101010',
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  await bot.loadClientData();
  expect(bot.client).toEqual(null);
  expect(bot.platform).toEqual('sms');
});

test('bot sets invalid message response on unidentified user', async () => {
  await rivebot.loadChatScripts();
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId: '2233445566',
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  await bot.getResponse();
  expect(bot.messagesToSendToClient[0].message).toContain(
    "Sorry, we didn't recognize the"
  );
  expect(bot.shouldUpdateClient).toEqual(false);
});

test("when user asks to stop, user no longer receives checkins and bot doesn't message but does update client", async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
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
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
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
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.userMessage = 'ff';
  let outcome = bot.userAskedToFastForward();
  expect(outcome).toEqual(true);
  bot.userMessage = 'ffs';
  outcome = bot.userAskedToFastForward();
  expect(outcome).toEqual(false);
});

test('fast forward functionality returns desired payload when there are checkin times', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
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
  bot.fastForwardUser();
  expect(bot.client.topic).toEqual('content');
  expect(bot.userMessage).toEqual('startprompt');
  expect(bot.recurringTaskId).toEqual(null);
  expect(bot.client.checkin_times.length).toEqual(1);
});

test('fast forward returns message saying there are no more checkins to fast forward when there are no checkins', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = {
    checkin_times: null
  };
  expect(bot.fastForwardUser()).toEqual(false);
});

// /* TODO ff functionality for recurring tasks, make sure they're not removed until they're supposed to be */

test('assignTopicForNewUser should assign the proper topic for new users', () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = {
    platform: 'FBOOK',
    topic: 'setupfb'
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

test('getCurrentTaskData gets correct task data', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = {
    tasks: []
  };
  const noTaskDataOutput = bot.getAndSetCurrentTaskData();
  expect(bot.currentTask).toEqual(null);
  expect(noTaskDataOutput.currentTaskSteps).toEqual(null);
  expect(noTaskDataOutput.currentTaskDescription).toEqual(null);
  bot.client = { tasks: taskList };
  const taskDataOutput = bot.getAndSetCurrentTaskData();
  expect(bot.currentTask.title).toEqual('Ask for a raise at work');
  expect(taskDataOutput.currentTaskDescription).toContain('Why it matters');
  expect(taskDataOutput.currentTaskDescription).toContain(
    'If you want or need more'
  );
  expect(taskDataOutput.currentTaskSteps).toContain('Step 1');
  expect(taskDataOutput.currentTaskSteps).toContain(
    'Read the employee handbook'
  );
});

test('getTaskNum gets correct task num', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = { tasks: taskList };
  expect(bot.getTaskNum()).toEqual(3);
  bot.client = {
    tasks: []
  };
  expect(bot.getTaskNum()).toEqual(0);
});

test('setUserIfWorkplanComplete works', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = {
    topic: null,
    checkin_times: [{ test: 1 }],
    tasks: [{ id: 1, status: 'COMPLETED' }]
  };
  bot.setUserIfWorkplanComplete();
  expect(bot.client.topic).toEqual('ultimatedone');
  expect(bot.client.checkin_times).toEqual([]);
});

test("loadStoryContent doesn't send anything if all content has been viewed", async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  await bot.loadClientData();

  bot.client.topic = 'content';
  bot.client.viewed_media = viewedAllMediaIDs;
  api.getViewedMediaIds = jest.fn(clientID =>
    Promise.resolve(viewedAllMediaIDs)
  );

  const payload = await bot.loadStoryContent('startprompt');
  expect(bot.shouldMessageClient).toEqual(false);
  expect(payload.contentIdChosen).toEqual(null);
  expect(payload.contentText).toEqual(null);
});

test('loadStoryContent loads proper content', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  bot.client = {
    topic: 'content'
  };

  api.getViewedMediaIds = jest.fn(clientID => Promise.resolve(viewedMediaIDs));
  const payload = await bot.loadStoryContent('startprompt');
  expect(bot.shouldMessageClient).toEqual(true);
  expect(payload.contentIdChosen).toEqual(22);
  expect(payload.contentText).toEqual('5 steps for making financial decisions');
  expect(payload.contentDescription).toContain(
    'A short article with tips for smart money choices.'
  );
  expect(payload.contentUrl).toContain('bit');
  expect(payload.contentImgUrl).toContain('aws');
});

test('getRemainingVarsRivebotNeeds gets all the necessary variables', async () => {
  const bot = new Chatbot({
    rivebot,
    platform,
    userPlatformId,
    userMessage,
    userPressedGetStartedOnFBPayload,
    topic,
    recurringTaskId,
    coachHelpResponse,
    coachDirectMessage,
  });
  await bot.loadClientData();
  bot.client.topic = 'content';
  bot.client.tasks = await api.getClientTasks(bot.client.id);
  bot.userMessage = 'startprompt';
  const payload = await bot.getRemainingVarsRivebotNeeds();

  expect(payload.org.name).toEqual('Test.org');
  expect(payload.org.phone).toEqual(1234567890);
  expect(payload.coach.first_name).toEqual('Michael');
  expect(payload.currentTaskTitle).toContain('Create a debt repayment plan');
  expect(payload.currentTaskSteps).toContain('List all of your debts.');
  expect(payload.currentTaskDescription).toContain(
    'If you have the means to put some of your income toward your debt'
  );
  expect(payload.taskNum).toEqual(1);
  expect(payload.contentIdChosen).toEqual(22);
  expect(payload.contentText).toEqual('5 steps for making financial decisions');
  expect(payload.contentDescription).toContain(
    'A short article with tips for smart money choices.'
  );
  expect(payload.contentUrl).toContain('bit');
  expect(payload.contentImgUrl).toContain('aws');
});
