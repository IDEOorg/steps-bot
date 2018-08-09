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
