import Scheduler from '../src/scheduledUpdater';

jest.mock('request-promise', () => () => Promise.resolve(JSON.stringify({
  access_token: 'token',
  exp: 8400,
})));

describe('Scheduled updater', () => {
  beforeAll(() => {
    Scheduler.sendTokenNotificationEmail = jest.fn();
    Scheduler.updateConfigOnHeroku = jest.fn();
  });
  
  it('should update Heroku with the new token', async () => {
    await Scheduler.getToken(10);
    expect(Scheduler.updateConfigOnHeroku).toHaveBeenCalled();
    expect(Scheduler.updateConfigOnHeroku).toBeCalledWith('token');
  });

  it('should send email to TTL and PM', async () => {
    await Scheduler.getToken(10);
    expect(Scheduler.sendTokenNotificationEmail).toHaveBeenCalledTimes(3);
  });
});
