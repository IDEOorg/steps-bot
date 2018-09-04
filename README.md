# Roo — The Chatbot
This repository contains code for the chatbot side of Roo (for the admin, helloroo.org, code go to https://github.com/ideoorg/steps).

# Documentation
Documentation of how the chatbot works can be found [here](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing). (WORK IN PROGRESS)
# Getting Started - Local Development
NOTE: Both Facebook and Twilio, the SMS service we use, requires a non-localhost url for its webhook. Therefore any part of the code that uses `src/Messenger.js` (the code that sends the actual messages) will not work in local development. See `e2e.tests.js` for examples of how to play around with the code.

Instructions on how to set up the staging environment (which will allow you to send messages) can be found later in this README.
## .env file
Create a .env file with the following values:
`TWILIO_ACCOUNT_SID=
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
SENDGRID_API_KEY=`
You'll need a Twilio account and provide those credentials for SMS, a Facebook developer account / credentials for Facebook. You can go to twilio.com and developers.facebook.com for those. More info on getting set up in the documentation above.
*Also required:*
- BOT_URL, this is the url to the bot's server (you'll create this in the "Staging / Production Environment" section. For now, leave this blank.)
- API_URL, these connect with our own Admin API staging environment (from [this repo](https://github.com/ideoorg/steps)). If you'd like to set up your own API staging environment, you'll need to supply the Admin API url
- OAUTH_ACCESS_TOKEN for communicating with the Admin API. If you're using the default Admin API URL above, reach out to mepler [at] ideo [dot] org for the OAuth Access Token info.
- BOT_ID, if you're using out own Admin API staging environment, then the default BOT_ID above will suffice. Otherwise, create a new coach, admin, or superadmin in the Admin API and set the bot id to that. This value is only used when creating API requests adding to the user's message log.
*Optional:*
- BITLY_TOKEN, this wraps any content we send into a nice bit.ly url.
- SENDGRID_API_KEY, any emails that are sent to the client or for error handling require this API key.
## Local Development
`1) git clone https://github.com/IDEOorg/steps-bot
2) npm install
3) npm start`
## Adding a Staging / Production Environment
1. Deploy this code to Heroku.
1a. `npm install -g heroku`
1b. `heroku login` (enter login info)
1c. `heroku create` (do this in this directory. You should now have a server url)
1d. Copy and paste the server url into the BOT_URL environment variable
1e. `git push heroku master`
1f. ``

### Dependencies Used
- Node 9.5.0
- npm 4.6.1
