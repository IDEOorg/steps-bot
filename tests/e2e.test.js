// ALL THE USER SCENARIOS
// user pressed GET STARTED on FB but doesn't have a registered phone number
// user presses GET STARTED on FB and has a registered phone number
// user texts START via SMS but doesn't have a registered phone number
// user texts START via SMS, has a registered phone number, and is on SMS platform
// user texts START via SMS, has a registered phone number, and is on FB platform
// user fast forwards to next checkin message
// user fast forwards but there's no check in message
// user asks for help
// user sends help message to coach
// user writes help message but tells bot he/she wants to edit message
// user decides not to send help message
// user says they've completed a task
// user completes all tasks (they've completed their workplan)
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
// user receives proper response from coach
// user says coach's response solved problem
// user after coach's response still needs help
// user after coach's response sends gibberish response
// user sends gibberish message that's covered under global topic
// user sends gibberish message that's covered under the current topic
// user asks for their workplan (PLAN)
// user asks for HELP via global keyword

import Chatbot from '../src/Chatbot';
import Rivebot from '../src/Rivebot';
import constants from '../src/constants';
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
    userPressedGetStartedOnFBPayload: '1111111111' // non-existant phone number
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
    userPressedGetStartedOnFBPayload: '1111111112' // non-existant phone number
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(true);
});

test('user texts START via SMS but doesn\'t have a registered phone number', async () => {
  const chatbot = new Chatbot({
    rivebot,
    platform: constants.SMS,
    userPlatformId: '1111111111', // fake user platform id
    userMessage: 'start'
  });
  await chatbot.getResponse();
  expect(chatbot.shouldMessageClient).toEqual(true);
  expect(chatbot.shouldUpdateClient).toEqual(false);
  expect(chatbot.messagesToSendToClient[0].message).toContain('Sorry, we didn\'t recognize the phone number you sent this from');
});
