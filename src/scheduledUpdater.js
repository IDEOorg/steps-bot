const log4js = require('log4js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const requestPromise = require('request-promise');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const log = log4js.getLogger('scheduledUpdater.js');

const decoded = jwt.decode(process.env.OAUTH_ACCESS_TOKEN);
const { exp } = decoded;
const currentDate = new Date().getTime() / 1000;
const difference = exp - currentDate;
const daysRemaining = Math.round(difference / (24 * 60 * 60));

module.exports = {
  /**
   * @description Gets the auth0 token and sends an update request to heroku
   *
   * @param {number} days take number of days remaining for the current token
   * @returns {void}
   */
  async getToken(days) {
    let accessToken = null;
    const daysBeforeExpiration = process.env.DAYS_TO_TOKEN_EXPIRATION;
    if (days < daysBeforeExpiration) {
      try {
        const body = {
          client_id: `${process.env.AUTH0_CLIENT_ID}`,
          client_secret: `${process.env.AUTH0_CLIENT_SECRET}`,
          audience: 'http://steps-admin.herokuapp.com',
          grant_type: 'client_credentials'
        };
        const options = {
          method: 'POST',
          url: 'https://steps.auth0.com/oauth/token',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        };
        const token = await requestPromise(options);
        accessToken = JSON.parse(token).access_token;
        await this.updateConfigOnHeroku(accessToken);
        const emails = [process.env.PM_EMAIL, process.env.TTL_EMAIL];
        this.sendTokenNotificationEmail(emails, accessToken);
      } catch (e) {
        log.error(e);
      }
    }
  },

  /**
   * @description Updates config variables on heroku
   *
   * @param {number} token takes the token to be updated on heroku
   * @returns {void}
   */
  async updateConfigOnHeroku(token) {
    try {
      const options = {
        method: 'PATCH',
        url: `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/config-vars`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.heroku+json; version=3',
          Authorization: `Bearer ${process.env.HEROKU_ACCESS_TOKEN}`
        },
        body: {
          OAUTH_ACCESS_TOKEN: `${token}`
        },
        json: true
      };
      await requestPromise(options);
    } catch (e) {
      log.error(e);
    }
  },

  /**
   * @description sends email to notify new token status
   *
   * @param {array} emails takes the token to be updated on heroku
   * @param {number} token takes the new token
   * @returns {void}
   */
  sendTokenNotificationEmail(emails, token) {
    emails.forEach((email) => {
      sgMail.send({
        to: `${email}`,
        from: 'no-reply@helloroo.org',
        subject: 'Token Renewal Notification',
        text: `The auth0 token has been renewed. Please update the token in 1password and the env file
      Here is the new token which expires after 100 days.
       \n ${token} \n
      `
      });
    });
  },
};

module.exports.getToken(daysRemaining).catch((e) => {
  log.error(e);
});
