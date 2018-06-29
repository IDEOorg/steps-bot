const api = require('../apihelper');

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

test('getCoachName returns the coach\'s first name', async () => {
  const data = await api.getCoachName(21);
  expect(data).toEqual('Matthew');
});

test('getClientTasks returns the client\'s tasks', async () => {
  const data = await api.getClientTasks(8);
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
