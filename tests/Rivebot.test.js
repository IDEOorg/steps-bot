import Rivebot from '../src/Rivebot';
import constants from '../src/constants';

test('RiveBot load chat scripts loads the chat scripts', async () => {
  const rivebot = new Rivebot();
  await rivebot.loadChatScripts();
  const response = await rivebot.rivebot.reply('test', 'test');
  expect(response).toContain('I can\'t quite understand your message');
});
