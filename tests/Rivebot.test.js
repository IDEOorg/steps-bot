import Rivebot from '../src/Rivebot';
import constants from '../src/constants';

test('RiveBot load chat scripts loads the chat scripts', async () => {
  const rivebot = new Rivebot();
  await rivebot.loadChatScripts();
  const response = await rivebot.rivebot.reply('test', 'test');
  expect(response).toContain('I can\'t quite understand your message');
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

test('RiveBot getCurrentTaskData gets correct task data', async () => {
  const rivebot = new Rivebot();
  const noTaskDataOutput = rivebot.getCurrentTaskData([]);
  expect(noTaskDataOutput.currentTask).toEqual(null);
  expect(noTaskDataOutput.currentTaskSteps).toEqual(null);
  expect(noTaskDataOutput.currentTaskDescription).toEqual(null);
  const taskDataOutput = rivebot.getCurrentTaskData(tasks);
  expect(taskDataOutput.currentTask).toEqual('Ask for a raise at work');
  expect(taskDataOutput.currentTaskDescription).toContain('Why it matters');
  expect(taskDataOutput.currentTaskDescription).toContain('If you want or need more');
  expect(taskDataOutput.currentTaskSteps).toContain('Step 1');
  expect(taskDataOutput.currentTaskSteps).toContain('Read the employee handbook');
});

test('RiveBot getTaskNum gets correct task num', async () => {
  const rivebot = new Rivebot();
  expect(rivebot.getTaskNum(tasks)).toEqual(3);
  expect(rivebot.getTaskNum([])).toEqual(0);
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
