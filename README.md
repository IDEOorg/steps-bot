# Roo — The Chatbot
This repository contains code for the chatbot side of Roo (for the admin interface code, helloroo.org, go to https://github.com/ideoorg/steps).

# Documentation
Documentation of how the chatbot works can be found [here](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing).
# Getting Started - Staging
NOTE: Both Facebook and Twilio (the SMS service we use) require a non-localhost url for its webhook. Therefore any part of the code that uses `src/Messenger.js` (the code that sends the actual messages) will not work in local development. See `e2e.tests.js` for examples of how to play around with that limitation.

### Step 1 - Decide what you want to support
**Facebook Support**
Configuring the bot with Facebook is a time-intensive effort because Facebook needs to approve your bot which take 1-3 months for Facebook to do so. Until Facebook approves the bot, you can't use it for the general public. If you decide you want to go that route, follow these setup instructions [at the Facebook config section of the documentation](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit#slide=id.g41371ee69c_0_143).

**Hello Roo API Configuration**
This bot collaborates closely with the Admin API from [this repo](https://github.com/IDEOorg/steps). The bot requires an API url from that. Make note if you want to use ours (https://steps-staging.herokuapp.com/api) for sandboxing purposes, or if you want to use your own (recommended).

**Bitly Support**
If you want your media content to be wrapped using a bit.ly link, you'll need to get a [Bitly token](https://dev.bitly.com/authentication.html).

**Email Support**
If you want to be able to send emails to coaches / the client and get error logs emailed, you'll need to sign up for [Sendgrid](https://sendgrid.com/docs/API_Reference/index.html) and get their API key

### Step 2 - create the .env file
Create a .env file with the following values:
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_NUMBER=
FB_PAGE_ACCESS_TOKEN=
FB_VERIFY_TOKEN=
FB_REFERRAL_LINK=
BITLY_TOKEN=
OAUTH_ACCESS_TOKEN=
API_URL=https://steps-staging.herokuapp.com/api
BOT_URL=
BOT_ID=116
SENDGRID_API_KEY=
```

You'll need a Twilio account to provide the `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_NUMBER` credentials for SMS. Instructions on getting set up for Twilio can be found in the docs [here](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing).

If you elected not to support Facebook bots, you can leave the `FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`, and `FB_REFERRAL_LINK` environmental variables empty. **The Facebook config variables are only required if you want to support the Facebook platform.** Otherwise follow [the docs regarding Facebook config](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing).

If you elected to use Bitly, fill in the `BITLY_TOKEN` variable with the appropriate token. Otherwise it can be left blank.

If you decided to use our staging platform for the Admin API, you can leave the `API_URL` as https://steps-staging.herokuapp.com/api. Otherwise deploy the Hello Roo Admin API to staging, get the oauth token there, and fill in `OAUTH_ACCESS_TOKEN` with your generated oauth token, and the `API_URL` as `https://YOUR-ADMIN-URL.herokuapp.com/api`. Note: the Admin API url is NOT the url for this bot's server. The bot server and API server are two separate entities. More info on getting the oauth token and Admin API set up [here](https://github.com/IDEOorg/steps).

If you elected to get sendgrid email support, fill in the `SENDGRID_API_KEY` variable with the sendgrid api key.

**Also required:**
- BOT_URL, this is the url to the bot's server (you'll create this in the "Staging / Production Environment" section. For now, leave this blank.)
- API_URL, the default example environment variable above connects to our own Admin API staging environment (from [this repo](https://github.com/ideoorg/steps)). If you'd like to set up your own API staging environment, you'll need to supply the Admin API url. If you want to use ours, you can keep that environment variable as is.
- OAUTH_ACCESS_TOKEN for communicating with the Admin API. If you're using the default Admin API URL above, reach out to mepler [at] ideo [dot] org for the OAuth Access Token info.
- BOT_ID, if you're using out own Admin API staging environment, then the default BOT_ID above will suffice. Otherwise, create a new coach, admin, or superadmin in the Admin API and set the bot id to that. This value is only used when creating API requests adding to the user's message log.

**Optional:**
- BITLY_TOKEN, this wraps any content url we send into a nice bit.ly url. Without this, an uglier redirect url (still operational though) is sent.
- SENDGRID_API_KEY, any emails that are sent to the client or for error handling require this API key. Without this key no emails get sent.
## Local Development
```
1) git clone https://github.com/IDEOorg/steps-bot
2) npm install
3) npm start
```
## Adding a Staging / Production Environment
1. Deploy this code to Heroku.
- `npm install -g heroku`
- `heroku login` (enter login info)
- `heroku create` (do this in this directory. You should now have a server url)
- Copy and paste the server url into the `BOT_URL` environment variable (if you haven't already)
- `git push heroku master`
- Now your bot server should be operational.
2. You need to set the environment variables in Heroku (Heroku doesn't read .env files). You can do that with the following url, substituting `YOUR_APP_NAME` with your app's name. https://dashboard.heroku.com/apps/YOUR_APP_NAME/settings. You should see a Config Vars section. Set the environment variables.
3. To test if it's working, text the Twilio phone number `START`. You should receive this message `Sorry, we didn't recognize the phone number you sent this from. If you believe this is a mistake, contact your coach.` If you didn't receive that message, check your environment variable credentials in Heroku (specifically for Twilio and BOT_URL).
4. Create a new user in either https://steps-staging.herokuapp.com or your own Admin staging server (whichever you chose earlier in the *.env file* section).
5. Text the Twilio phone number `START`. You should receive the following message `Hi <get username>! I'm Roo, your financial coaching assistant. I’m here to help you complete the work plan...` If you didn't check the API_URL, OAUTH_ACCESS_TOKEN environment variables.
6. You're all setup now!

# Testing
The tests in the /tests folder are designed only to work with the IDEO.org database (it runs API calls looking for specific users). You can use `tests/e2e.test.js` and `testdata.json` as a sample for how to structure your own tests with your own database.

# Dependencies Used
- Node 9.5.0
- npm 4.6.1
