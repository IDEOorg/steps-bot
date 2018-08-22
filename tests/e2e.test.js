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
// user completes all tasks (they've completed their workplan)
// ------------BOT SENDS USER MESSAGE------------------
// user is scheduled to receive a message, but doesn't have any tasks in their workplan
// user is scheduled to receive content
// user is scheduled to receive content, but has viewed all content
// user is scheduled to receive a follow up appointment message
// user is scheduled to receive a check in message
// user is scheduled to receive a message that's a recurring task
// user is scheduled to receive their very first task
// user is scheduled to receive a task besides the first task
// user is scheduled to receive recurring task
// user is scheduled to receive follow up appointment
// ------------COACH RESPONDS TO USER INTERACTIONS------------------
// user receives proper response from coach
// user says coach's response solved problem
// user after coach's response still needs help
// user after coach's response sends gibberish response
// user sends gibberish message that's covered under global topic
// user sends gibberish message that's covered under the current topic
// user asks for their workplan (PLAN)
// user asks for HELP via global keyword

import api from '../src/api';
import Chatbot from '../src/Chatbot';
import Rivebot from '../src/Rivebot';
import Updater from '../src/Updater';
import constants from '../src/constants';
import testdata from './testdata.json';
import { addUser, updateUser } from '../src/clientutilities';
// import api from '../src/api';
let rivebot = null;
beforeEach(async () => {
  rivebot = new Rivebot();
  await rivebot.loadChatScripts();
});

test('user pressed GET STARTED on FB but doesn\'t have a registered phone number', async () => {
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId: '5534', // fake user platform id
    userMessage: 'get started',
    userPressedGetStartedOnFBPayload: '3457654321' // non-existant phone number
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(false);
  expect(chatbot.messagesToSendToClient[0].message).toContain('Sorry, we didn\'t recognize the Facebook account you sent this from');
});

test('user presses GET STARTED on FB and has a registered phone number', async () => {
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId: '5534', // fake user platform id
    userMessage: 'get started',
    userPressedGetStartedOnFBPayload: testdata['1'].client.phone // non-existant phone number
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.messagesToSendToClient[1].message).toContain('Great to see you here on Facebook Messenger ' + testdata['1'].client.first_name);
  const variables = await rivebot.getVariables('5534');
  const u = new Updater({
    userPlatformId: '5534',
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual('welcomewait');
  expect(u.client.checkin_times.length).toEqual(1);
  expect(u.client.checkin_times[0].topic).toEqual('welcomenext');
  expect(u.client.fb_id).toEqual('5534');
});

test('user texts START via SMS but doesn\'t have a registered phone number', async () => {
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId: '3457654321', // fake user platform id
    userMessage: 'start'
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(false);
  expect(chatbot.messagesToSendToClient[0].message).toContain('Sorry, we didn\'t recognize the phone number you sent this from');
});

test('user texts START via SMS, has a registered phone number, and is on SMS platform', async () => {
  const clientData = testdata['2'].client;
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'start'
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  expect(chatbot.messagesToSendToClient[1].message).toContain('Hi ' + clientData.first_name + '! I\'m Roo, your financial coaching assistant.');
  const variables = await rivebot.getVariables(userPlatformId);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual('welcomewait');
  expect(u.client.checkin_times.length).toEqual(1);
  expect(u.client.checkin_times[0].topic).toEqual('welcomenext');
});

test('user texts START via SMS, has a registered phone number, and is on FB platform', async () => {
  const clientData = testdata['3'].client;
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId, // fake user platform id
    userMessage: 'START'
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[1].message).toContain(`To get started, click on this link ${variables.referralLink}`);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual('setupfb');
  expect(u.client.checkin_times.length).toEqual(0);
});

test('user fast forwards to next checkin message', async () => {
  const user = await api.getUserFromId(1231); // the id of the test user I created for this e2e test
  user.checkin_times = [
    {
      topic: 'checkin',
      message: 'startprompt',
      time: 1534946400166
    },
    {
      topic: 'content',
      message: 'startprompt',
      time: 2034946400166
    },
    {
      topic: 'help',
      message: 'pinguser',
      time: 2434946400166
    }
  ];
  await updateUser(user);
  const clientData = testdata['4'].client;
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId, // fake user platform id
    userMessage: 'ff'
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
    variables
  });
  await u.loadNewInfoToClient();
  expect(u.client.topic).toEqual('checkin');
  expect(u.client.checkin_times.length).toEqual(1); // client is only expected to have 1 check in at a time for now
  user.checkin_times = [];
  await updateUser(user);
});

test('user fast forwards but there\'s no check in message', async () => {
  const clientData = testdata['5'].client;
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId, // fake user platform id
    userMessage: 'ff'
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(false);
  expect(chatbot.shouldUpdateClient).toEqual(false);
});

test('user asks for help on SMS by texting A', async () => {
  const clientData = testdata['6'].client;
  const userPlatformId = clientData.phone;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: 'A'
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
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('helpuserresponse');
  expect(chatbot.client.checkin_times[0].topic).toEqual('help');
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test('user asks for help on FB by choosing "have some questions" button', async () => {
  const clientData = testdata['7'].client;
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'have some questions'
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
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('helpuserresponse');
  expect(chatbot.client.checkin_times[0].topic).toEqual('help');
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test('user writes help message but hasn\'t confirmed submission yet', async () => {
  const clientData = testdata['8'].client;
  const userPlatformId = clientData.phone;
  const helpMessage = 'I need help with this.';
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId,
    userMessage: helpMessage
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`Gotcha. Just to confirm, you'd like to send the following message to ${variables.coachName}: "${helpMessage}"`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('helpuserconfirm');
  expect(chatbot.client.temp_help_response).toEqual(helpMessage);
  expect(chatbot.client.checkin_times.length).toEqual(1);
});

test('user writes help message but tells bot he/she wants to edit message', async () => {
  const clientData = testdata['9'].client;
  await addUser(clientData);
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'I have a few edits'
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain('No problem at all. Just send me your full revised message');
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('helpuserresponse');
  expect(chatbot.client.temp_help_response).toEqual(null);
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].message).toEqual('pinguser');
});

test('user decides not to send help message', async () => {
  const clientData = testdata['9'].client;
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'never mind'
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain('Okay, I\'ve cancelled your assistance request. I\'ll be in touch soon!');
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
  expect(chatbot.client.temp_help_response).toEqual(null);
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
  expect(chatbot.client.checkin_times[0].message).toEqual('startprompt');
});

test('user sends help message to coach', async () => {
  const clientData = testdata['9'].client;
  const userPlatformId = clientData.fb_id;
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.FB,
    userPlatformId,
    userMessage: 'yes send that'
  });
  await chatbot.getResponse();
  const variables = await rivebot.getVariables(userPlatformId);
  expect(chatbot.messagesToSendToClient[0].message).toContain(`Great, I'll send this message to ${variables.coachName} right away and get back to you once I've heard from them.`);
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
  const u = new Updater({
    userPlatformId,
    client: chatbot.client,
    currentTask: chatbot.currentTask,
    variables
  });
  await u.loadNewInfoToClient();
  expect(chatbot.client.topic).toEqual('checkin');
  // temp_help_response will be set to null AFTER the api calls have been made (in the function updateClientToDB, which I'm not testing here since it would send an email to the coach every test)
  expect(chatbot.client.temp_help_response).toEqual('Bagels bagels bagels');
  expect(chatbot.client.status).toEqual('AWAITING_HELP');
  expect(chatbot.client.checkin_times.length).toEqual(1);
  expect(chatbot.client.checkin_times[0].topic).toEqual('checkin');
  expect(chatbot.client.checkin_times[0].message).toEqual('startprompt');
});
