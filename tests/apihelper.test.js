const api = require('../src/api');
const mockdata = require('./mockdata');

const { mockTasks, orgs, mockCoach, media, viewedMediaIDs } = mockdata;

// Mock funtions
api.getAllClients = jest.fn(() => mockdata.clients);
api.createMessage = jest.fn(() => Promise.resolve());
api.getOrgName = jest.fn(orgID => Promise.resolve(orgs[0][orgID].name));
api.getCoach = jest.fn(coachID => Promise.resolve(mockCoach));
api.getViewedMediaIds = jest.fn(clientID => Promise.resolve(viewedMediaIDs));
api.getAllMedia = jest.fn(() => Promise.resolve(media));
api.getClientTasks = jest.fn(clientID =>
  Promise.resolve(mockTasks[0][clientID])
);

// Test suites
test('getAllClients works', async () => {
  const data = await api.getAllClients();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
  expect(data[0]).toHaveProperty('id');
  expect(data[0]).toHaveProperty('first_name');
  expect(data[0]).toHaveProperty('last_name');
  expect(data[0]).toHaveProperty('email');
  expect(data[0]).toHaveProperty('phone');
  expect(data[0]).toHaveProperty('coach_id');
  expect(data[0]).toHaveProperty('org_id');
  expect(data[0]).toHaveProperty('platform');
});

test('getOrgName works', async () => {
  const data = await api.getOrgName(3);
  expect(data).toEqual('IDEO.org');
});

test("getClientTasks returns the client's tasks", async () => {
  const data = await api.getClientTasks(717);
  expect(data.length).toBeGreaterThan(0);
  expect(data[0]).toHaveProperty('id');
  expect(data[0]).toHaveProperty('title');
  expect(data[0]).toHaveProperty('category');
  expect(data[0]).toHaveProperty('description');
  expect(data[0]).toHaveProperty('status');
});

test('getAllMedia returns all templated tasks', async () => {
  const data = await api.getAllMedia();
  expect(data.length).toBeGreaterThan(0);
  expect(data[0].task_id).toEqual(null);
});
