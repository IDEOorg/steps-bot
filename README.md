# Roo — The Chatbot
This repository contains code for the chatbot side of Roo (for the admin, helloroo.org, code go to https://github.com/ideoorg/steps).
## Getting Started - Local Development
NOTE: Both Facebook and Twilio, the SMS service we use, requires a non-localhost url for its webhook. Therefore any part of the code that uses `src/Messenger.js` (the code that sends the actual messages) will not work in local development. See `e2e.tests.js` for examples of how to play around with the code.

Instructions on how to set up the staging environment (which will allow you to send messages) can be found later in this README.
### Local Development
`1) git clone https://github.com/IDEOorg/steps-bot
2) npm install
3) npm start`
### Adding a staging / production environment
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
BOT_URL=https://stepsroobotstaging.herokuapp.com/
BOT_ID=116
SENDGRID_API_KEY=`
Twilio


### Dependencies
- Node 9.5.0
- npm 4.6.1
