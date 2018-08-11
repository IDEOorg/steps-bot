import Rivebot from '../src/Rivebot';
import constants from '../src/constants';

test('RiveBot load chat scripts loads the chat scripts', async () => {
  const rivebot = new Rivebot();
  await rivebot.loadChatScripts();
  const response = await rivebot.rivebot.reply('test', 'test');
  expect(response).toContain('I can\'t quite understand your message');
});

test('loadGifUrlsToRivebot gets correct output', async () => {
  const rivebot = new Rivebot();
  await rivebot.loadGifUrlsToRivebot('test', 12);
  let taskNumUrl = await rivebot.rivebot.getUservar('test', 'taskNumImgUrl');
  expect(taskNumUrl).toEqual(null);
  await rivebot.loadGifUrlsToRivebot('test', 8);
  taskNumUrl = await rivebot.rivebot.getUservar('test', 'taskNumImgUrl');
  expect(taskNumUrl).toContain('aws');
  expect(taskNumUrl).toContain('8');
  const recurringImgUrl = await rivebot.rivebot.getUservar('test', 'recurringImgUrl');
  expect(recurringImgUrl).toContain('aws');
  const storiesImgUrl = await rivebot.rivebot.getUservar('test', 'storiesImgUrl');
  expect(storiesImgUrl).toContain('aws');
  const celebrationImgUrl = await rivebot.rivebot.getUservar('test', 'celebrationImgUrl');
  expect(celebrationImgUrl).toContain('aws');
  const welcomeImgUrl = await rivebot.rivebot.getUservar('test', 'welcomeImgUrl');
  expect(welcomeImgUrl).toContain('aws');
  const workplanImgUrl = await rivebot.rivebot.getUservar('test', 'workplanImgUrl');
  expect(workplanImgUrl).toContain('aws');
  const introCelebrateImgUrl = await rivebot.rivebot.getUservar('test', 'introCelebrateImgUrl');
  expect(introCelebrateImgUrl).toContain('aws');
  const coachSaysImgUrl = await rivebot.rivebot.getUservar('test', 'coachSaysImgUrl');
  expect(coachSaysImgUrl).toContain('aws');
  const checkinImgUrl = await rivebot.rivebot.getUservar('test', 'checkinImgUrl');
  expect(checkinImgUrl).toContain('aws');
});
