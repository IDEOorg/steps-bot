import Chatbot from '../src/Chatbot';
import constants from '../src/constants';

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
  expect(bot.response.messages[0].message).toContain('Sorry, we didn\'t recognize the');
});

test('when user asks to stop, user no longer receives checkins and bot doesn\'t message but does update client', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: [{ something: 'something' }]
  };
  bot.userAskedToStop('stop');
  expect(bot.client.checkin_times).toEqual([]);
  expect(bot.shouldMessageClient).toEqual(false);
  expect(bot.shouldUpdateClient).toEqual(true);
});

test('when user asks to stop, bot still sends message to user if user is on fb platform', async () => {
  const bot = new Chatbot();
  bot.client = {
    checkin_times: [{ something: 'something' }]
  };
  bot.platform = 'fb';
  bot.userAskedToStop('stop');
  expect(bot.client.checkin_times).toEqual([]);
  expect(bot.shouldMessageClient).toEqual(true);
  expect(bot.shouldUpdateClient).toEqual(true);
});

test('userAskedToFastForward returns true when user types ff', async () => {
  const bot = new Chatbot();
  let outcome = bot.userAskedToFastForward('ff');
  expect(outcome).toEqual(true);
  outcome = bot.userAskedToFastForward('ffs');
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
  expect(payload.topic).toEqual('content');
  expect(payload.userMessage).toEqual('startprompt');
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
