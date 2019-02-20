// ALL THE USER SCENARIOS
// ------------USER SENDS BOT MESSAGE------------------
// user pressed GET STARTED on FB but doesn't have a registered phone number
// user presses GET STARTED on FB and has a registered phone number
// user texts START via SMS but doesn't have a registered phone number
// user texts START via SMS, has a registered phone number, and is on SMS platform
// user texts START via SMS, has a registered phone number, and is on FB platform
// user fast forwards to next checkin message
// user fast forwards but there's no check in message
// user asks for help on SMS by texting A
// user asks for help on FB by texting "have some questions"
// user writes help message but hasn't confirmed submission yet
// user writes help message but tells bot he/she wants to edit message
// user decides not to send help message
// user sends help message to coach
// user says they've completed a task
// user texts STOP on FB
// user texts STOP on SMS
// user asks for their workplan (PLAN)
// user asks for HELP via global keyword
// ------------BOT SENDS USER MESSAGE------------------
// user is scheduled to receive a message, but doesn't have any tasks in their workplan
// user is scheduled to receive a message, but has completed their workplan
// user is scheduled to receive content
// user is scheduled to receive content, but has viewed all content
// user is scheduled to receive a check in message
// user is scheduled to receive their very first task (introtask topic)
// user is scheduled to receive a task besides the first task (nexttask topic)
// user is scheduled to receive recurring task
// user is scheduled to receive follow up appointment
// ------------COACH RESPONDS TO USER INTERACTIONS------------------
// user receives proper response from coach
// user says coach's response solved problem
// user after coach's response still needs help
// ------------GIBBERISH------------------
// user after coach's response sends gibberish response
// user sends gibberish message that's covered under global topic
// user sends gibberish message that's covered under the current topic

import api from '../src/api';
import Chatbot from '../src/Chatbot';
import Rivebot from '../src/Rivebot';
import Updater from '../src/Updater';
import constants from '../src/constants';

const mockdata = require('./mockdata');

const { TOPICS, STATUS } = constants;

const {
  mockTasks,
  orgs,
  mockCoach,
  media,
  viewedMediaIDs,
  viewedAllMediaIDs,
} = mockdata;

// Mock functions
api.getAllClients = jest.fn(() => mockdata.clients);
api.createMessage = jest.fn(() => Promise.resolve());
api.createMessage = jest.fn(() => Promise.resolve());
api.getClientTasks = jest.fn(clientID =>
  Promise.resolve(mockTasks[0][clientID]));
api.getOrgName = jest.fn(orgID => Promise.resolve(orgs[0][orgID].name));
api.getCoach = jest.fn(coachID => Promise.resolve(mockCoach));
api.getAllMedia = jest.fn(() => Promise.resolve(media));
api.getTask = jest.fn(taskId =>
  Promise.resolve(mockTasks[0].recurring[taskId]));

let rivebot = null;
beforeEach(async () => {
  rivebot = new Rivebot();
  await rivebot.loadChatScripts();
});

test("user pressed GET STARTED on FB but doesn't have a registered phone number", async () => {
  const clientData = mockdata.clients[0];
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId: clientData.fb_id, // fake user platform id
    userMessage: 'get started',
    userPressedGetStartedOnFBPayload: '3457654321', // non-existant phone number
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(false);
  expect(chatbot.messagesToSendToClient[0].message).toContain("Sorry, we didn't recognize the Facebook account you sent this from");
});

test('user presses GET STARTED on FB and has a registered phone number', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId, // fake user platform id
    userMessage: 'start',
    userPressedGetStartedOnFBPayload: clientData.phone, // non-existant phone number
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.messagesToSendToClient[1].message).toContain("I'll be back in touch soon to help you get started.");
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual(TOPICS.WELCOME_WAIT);
  expect(u.client.checkin_times.length).toEqual(1);
  expect(u.client.checkin_times[0].topic).toEqual(TOPICS.WELCOME_NEXT);
  expect(u.client.fb_id).toEqual(5534);
});

test("user texts START via SMS but doesn't have a registered phone number", async () => {
  jest.setTimeout(10000);
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId: '3457654321', // fake user platform id
    userMessage: 'start',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(false);
  expect(chatbot.messagesToSendToClient[0].message).toContain("Sorry, we didn't recognize the phone number you sent this from");
});

test('user texts START via SMS, has a registered phone number, and is on SMS platform', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'start',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.messagesToSendToClient[1].message).toContain('Hi ' +
      clientData.first_name +
      " I'm Roo, your financial coaching assistant.");
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual(TOPICS.WELCOME_WAIT);
  expect(u.client.checkin_times.length).toEqual(1);
  expect(u.client.checkin_times[0].topic).toEqual(TOPICS.WELCOME_NEXT);
});

test('user texts START via SMS, has a registered phone number, and is on FB platform', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[3];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId, // fake user platform id
    userMessage: 'START',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`To get started, click on this link ${variables.referralLink}`);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual(TOPICS.SETUP_FB);
  expect(u.client.checkin_times.length).toEqual(0);
});

test('user fast forwards to next checkin message', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  clientData.checkin_times = [
    {
      topic: TOPICS.CHECK_IN,
      message: 'startprompt',
      time: 1534946400166,
    },
  ];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId, // fake user platform id
    userMessage: 'ff',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient.length).not.toEqual(0);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual(TOPICS.CHECK_IN);
  expect(u.client.checkin_times.length).toEqual(1); // client is only expected to have 1 check in at a time for now
  clientData.checkin_times = [];
});

test("user fast forwards but there's no check in message", async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];

  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId, // fake user platform id
    userMessage: 'ff',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(false);
  expect(chatbot.shouldUpdateClient).toEqual(false);
});

test('user asks for help on SMS by texting A', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'A',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain('what you need assistance with');
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.HELP_USER_RESPONSE);
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.HELP);
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test('user asks for help on FB by choosing "have some questions" button', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'have some questions',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain('what you need assistance with');
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.HELP_USER_RESPONSE);
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.HELP);
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test("user writes help message but hasn't confirmed submission yet", async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.phone;
  const helpMessage = 'I need help with this.';
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: helpMessage,
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`Gotcha. Just to confirm, you'd like to send the following message to ${variables.coachName}:\n\n"${helpMessage}"`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.HELP_USER_CONFIRM);
  expect(chatbot.client.temp_help_response).toEqual(helpMessage);
  expect(chatbot.client.checkin_times.length).toEqual(1);
});

test('user writes help message but tells bot he/she wants to edit message', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'I have a few edits',
    topic: TOPICS.HELP_USER_CONFIRM,
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`No problem. Tell me again (with as many details as possible) what you need assistance with so I can contact Coach ${variables.coachName} and get some answers.`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.HELP_USER_RESPONSE);
  expect(chatbot.client.temp_help_response).toEqual(null);
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test('user decides not to send help message', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'never mind',
    topic: TOPICS.HELP_USER_CONFIRM,
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain("Okay, I've cancelled your assistance request. I'll be in touch soon!");
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
  expect(chatbot.client.temp_help_response).toEqual(null);
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
  expect(chatbot.client.checkin_times[0].message).toEqual('startprompt');
});

test('user sends help message to coach', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'yes send that',
    topic: TOPICS.HELP_USER_CONFIRM,
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`Great, I'll send this message to ${variables.coachName} right away and get back to you as soon as I hear back.`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
  // temp_help_response will be set to null AFTER the api calls have been made (in the function updateClientToDB, which I'm not testing here since it would send an email to the coach every test)
  // expect(chatbot.client.temp_help_response).toEqual("I need help with this.");
  expect(chatbot.client.status).toEqual('AWAITING_HELP');
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
  expect(chatbot.client.checkin_times[0].message).toEqual('startprompt');
});

test("user says they've completed a task", async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'B',
    topic: 'checkin',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.tasks[0].status).toEqual('COMPLETED');
  expect(chatbot.client.topic).toEqual('done');
  expect(chatbot.client.checkin_times[0].topic).toEqual('nexttask');
});

test('user texts STOP on FB', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  clientData.checkin_times = [
    { topic: 'checkin', message: 'startprompt', time: 432942342343325052 },
  ];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'sToP',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.client.checkin_times.length).toEqual(0);
});

test('user texts STOP on SMS', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  clientData.checkin_times = [
    { topic: 'checkin', message: 'startprompt', time: 432942342343325052 },
  ];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'stop',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(false);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.client.checkin_times.length).toEqual(0);
});

test('user asks for their workplan (PLAN)', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'plan',
    topic: 'checkin',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toEqual(`Here's a link to your full work plan.\n${variables.workplanLink}`);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
});

test('user asks for HELP via global keyword', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: TOPICS.HELP,
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain("Great, I'm here to help. Please tell me");
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.HELP_USER_RESPONSE);
  expect(chatbot.client.checkin_times.length).toEqual(1);
});

// ------------TESTS WHERE THE BOT SENDS USER A MESSAGE------------------
test("user is scheduled to receive a message, but doesn't have any tasks in their workplan", async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[3];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'startprompt',
    topic: TOPICS.INTRO_TASK,
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(false);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.INTRO_TASK);
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.INTRO_TASK);
  expect(chatbot.client.checkin_times[0].time).toBeGreaterThan(10);
});

test('user is scheduled to receive a message, but has completed their workplan', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[4];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'startprompt',
    topic: 'nexttask',
  });
  await chatbot.getResponse();
  expect(chatbot.messagesToSendToClient[1].message).toContain(`WOW! This. Is. Major. You've finished every task in your work plan, ${clientData.first_name}`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.ULTIMATE_DONE);
  expect(chatbot.client.checkin_times.length).toEqual(0);
});

test('user is scheduled to receive content', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[0];
  api.getViewedMediaIds = jest.fn(clientID =>
    Promise.resolve(viewedMediaIDs));
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'startprompt',
    topic: TOPICS.CONTENT,
  });
  await chatbot.getResponse();
  const messages = chatbot.messagesToSendToClient;
  const contentMessage = messages[messages.length - 1];
  expect(contentMessage.type).toEqual('genericurl');
  expect(contentMessage).toHaveProperty('imageUrl');
  expect(contentMessage).toHaveProperty(TOPICS.CONTENT);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.CONTENT);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
});

test('user is scheduled to receive content, but has viewed all content', async () => {
  jest.setTimeout(10000);
  api.getViewedMediaIds = jest.fn(clientID =>
    Promise.resolve(viewedAllMediaIDs));
  const clientData = mockdata.clients[0];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'startprompt',
    topic: TOPICS.CONTENT,
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(false);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.CONTENT);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
});

test('user is scheduled to receive a check in message', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    topic: 'checkin',
    userMessage: 'startprompt',
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const messages = chatbot.messagesToSendToClient;
  expect(messages[0].type).toEqual('image');
  expect(messages[messages.length - 1].message).toContain('the letter C.');
  expect(chatbot.client.topic).toEqual('checkin');
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.HELP);
});

test('user is scheduled to receive their very first task (introtask topic)', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    topic: TOPICS.INTRO_TASK,
    userMessage: 'startprompt',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.messagesToSendToClient[1].message).toContain("Every journey begins with a single step. Here's the first one from your work plan:");
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual(TOPICS.INTRO_TASK);
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.CONTENT);
});

test('user is scheduled to receive a task besides the first task (nexttask topic)', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[1];
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    topic: 'nexttask',
    userMessage: 'startprompt',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(variables.taskNum).toEqual(2);
  expect(variables.currentTaskTitle).toContain('Contact your utility company');
  expect(variables.currentTaskDescription).toContain('Enrolling in Budget Billing with your utility company will');
  expect(variables.currentTaskSteps).toContain(' Step 1: Call your utility company');
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('nexttask');
  expect(chatbot.client.checkin_times[0].topic).toEqual(TOPICS.CONTENT);
});

// test('user is scheduled to receive recurring task', async () => {
//   jest.setTimeout(10000);
//   // const clientData = await api.getUserFromId(1287);
//   const clientData = mockdata.clients[5];

//   clientData.checkin_times = [
//     {
//       topic: 'recurring',
//       message: 'startprompt',
//       time: Date.now(),
//       createdDate: new Date(),
//       recurringTaskId: 1116
//     },
//     {
//       topic: TOPICS.CONTENT,
//       message: 'startprompt',
//       time: 99999992159999292
//     }
//   ];
//   await updateUser(clientData);
//   const userPlatformId = clientData.phone;
//   const chatbot = new Chatbot({
//     rivebot,
//     platform: constants.SMS,
//     userPlatformId,
//     topic: TOPICS.INTRO_TASK,
//     userMessage: 'startprompt',
//     recurringTaskId: 1118
//   });
//   await chatbot.getResponse();
//   expect(chatbot.messagesToSendToClient[2].message).toEqual(
//     'Track income and spending for one month'
//   );
//   const variables = await rivebot.getVariables(userPlatformId);
//   expect(chatbot.shouldMessageClient).toEqual(true);
//   expect(chatbot.shouldUpdateClient).toEqual(true);
//   const u = new Updater({
//     userPlatformId,
//     client: chatbot.client,
//     currentTask: chatbot.currentTask,
//     variables
//   });
//   await u.loadNewInfoToClient();
//   expect(chatbot.client.topic).toEqual('checkin');
//   expect(chatbot.client.checkin_times.length).toEqual(2);
//   expect(chatbot.client.checkin_times[0].time).toBeGreaterThan(Date.now());
//   clientData.checkin_times = [];
//   // await updateUser(clientData);
// });

test('user is scheduled to receive follow up appointment', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[6];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    topic: TOPICS.FOLLOW_UP,
    userMessage: 'startprompt',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toEqual(`Hi ${variables.username}, it’s been a while since you saw Coach ${variables.coachName}. It’s time to schedule your next appointment. You can send them an email at ${variables.coachEmail}.`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
  expect(chatbot.client.follow_up_date).toEqual(null);
});

test('user receives proper response from coach', async () => {
  jest.setTimeout(10000);
  const clientData = mockdata.clients[7];
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    topic: 'helpcoachresponse',
    userMessage: 'startprompt',
    coachHelpResponse: 'This is the solution to your problem',
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[1].message).toContain('This is the solution to your problem');
  expect(chatbot.messagesToSendToClient[2].message).toContain("Does this resolve your problem? If not, text the letter A. If you're all set, text the letter G.");
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables,
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('helpcoachresponse');
  expect(chatbot.client.checkin_times.length).toEqual(1);
});
