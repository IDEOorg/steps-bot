# Roo — The Chatbot

This repository contains code for the chatbot side of Roo (for the admin interface code, helloroo.org, go to https://github.com/ideoorg/steps).

# Documentation

Documentation of how the chatbot works and a walkthough of this code can be found [here](https://docs.google.com/presentation/d/175cGeQ8chW0W-L6gRtG6fIsVYQe0HCIh6NsXkHd66Tk/edit?usp=sharing).

Documentation of the chatbot API endpoints can be found [here](https://stepsroobotstaging.herokuapp.com/api-docs)

# Getting Started - Staging

NOTE: Both Facebook and Twilio (the SMS service we use) require a non-localhost url for its webhook. Therefore any part of the code that uses `src/Messenger.js` (the code that sends the actual messages) will not work in local development. See `e2e.tests.js` for examples of how to play around with that limitation.

### Step 1 - Decide what you want to support

**Facebook Support**
Configuring the bot with Facebook is a time-intensive effort because Facebook needs to approve your bot which take 1-3 months for Facebook to do so. Until Facebook approves the bot, you can't use it for the general public. If you decide you want to go that route, follow these setup instructions [at the Facebook config section of the documentation](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing).

**Hello Roo API Configuration**
This bot collaborates closely with the Admin API from [this repo](https://github.com/IDEOorg/steps). The bot requires the url from that API. You can use our staging server API as a sandbox if you know someone at IDEO.org who can give you the associated oauth token (https://steps-staging.herokuapp.com/api), or you can use your own API server by following setup instructions in [this repo](https://github.com/ideoorg/steps) (recommended).

**Bitly Support**
If you want your media content to be wrapped using a bit.ly link, you'll need to get a [Bitly token](https://dev.bitly.com/authentication.html).

**Email Support**
If you want to be able to send emails to coaches / the client and get error logs emailed, you'll need to sign up for [Sendgrid](https://sendgrid.com/docs/API_Reference/index.html) and get their API key

Depending on what you want to support you'll need:

1. A [Twilio](https://www.twilio.com/) account (required) and a phone number bought from there.
2. Some platform to deploy the API (if you're not using our staging environment) and some platform to deploy the bot. We use Heroku.
3. A [Facebook Developers](developers.facebook.com) account if you want to support Facebook.
4. A [Sendgrid](https://www.sendgrid.com) account for sending emails.
5. A [Bitly](dev.bitly.com) account for creating bit.ly links.

### The .env file

Get a copy of the `.env` file from 1Password.

Make sure to get an up-to-date token from Auth0 for the `OAUTH_ACCESS_TOKEN` value.

You'll need a Twilio account to provide the `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_NUMBER` credentials for SMS. [Follow these instructions in the slides to get set up with Twilio](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing) (see the Twilio Config section of the slides).

If you elected not to support Facebook bots, you can leave the `FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`, and `FB_REFERRAL_LINK` environmental variables empty. **The Facebook config variables are only required if you want to support the Facebook platform.** Otherwise follow [the docs regarding Facebook config](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing).

If you elected to use Bitly, fill in the `BITLY_TOKEN` variable with the appropriate token. Otherwise it can be left blank.

If you decided to use our staging platform for the Admin API, you can leave the `API_URL` as https://steps-staging.herokuapp.com/api. Otherwise deploy the Hello Roo Admin API to staging, get the oauth token there, and fill in `OAUTH_ACCESS_TOKEN` with your generated oauth token, and the `API_URL` as `https://YOUR-ADMIN-URL.herokuapp.com/api`. Note: the Admin API url is NOT the url for this bot's server. The bot server and API server are two separate entities. More info on getting the oauth token and Admin API set up [here](https://github.com/IDEOorg/steps).

If you elected to get sendgrid email support, fill in the `SENDGRID_API_KEY` variable with the sendgrid api key.

**Also required:**

- BOT_URL, this is the url to the bot's server (you'll create this in the "Staging / Production Environment" section. For now, leave this blank.)
- API_URL, the default example environment variable above connects to our own Admin API staging environment (from [this repo](https://github.com/ideoorg/steps)). If you'd like to set up your own API staging environment, you'll need to supply the Admin API url. If you want to use ours, you can keep that environment variable as is.
- OAUTH_ACCESS_TOKEN for communicating with the Admin API. If you're using the default Admin API URL above, reach out to mepler [at] ideo [dot] org for the OAuth Access Token info.
- BOT_ID, if you're using our own Admin API staging environment, then the default BOT_ID above will suffice. Otherwise, create a new coach, admin, or superadmin in the Admin API and set the bot id to that. This value is only used when creating API requests adding to the user's message log.

**Optional:**

- BITLY_TOKEN, this wraps any content url we send into a nice bit.ly url. Without this, an uglier redirect url (still operational though) is sent.
- SENDGRID_API_KEY, any emails that are sent to the client or for error handling require this API key. Without this key no emails get sent.


## Running the bot on localhost

[Here is a video](https://youtu.be/-OgDxm3J4a4) that shows how to get up and running with the bot on localhost. 

As mentioned above, both Facebook and Twilio (the SMS service we use) require a non-localhost url for its webhook, but there is a workaround to this.

Note: you will need access to the Twilio console or the Facebook account that is linked to the bot.
Follow the steps below to work with the bot on localhost:

- Ensure you've cloned the repo by running `git clone https://github.com/IDEOorg/steps-bot`, and run `npm install`
- Run `npm start` on the root directory to start the application
- Open up another terminal and run `npm run start:live:dev` on the root directory to start [ngrok](https://www.npmjs.com/package/ngrok) which will tunnel through the running localhost server and expose it to the web via a returned url.
- At this point, you should see two urls(http and https), copy the https url and paste it into the webhook space for either the Facebook app or the Twilio number linked to the bot. Then add `/sms/receive` at the end of the link so requests hit the right endpoint. 

NOTE: [ngrok](https://www.npmjs.com/package/ngrok) only exposes localhost to the web for just 8 hours, so you will need to restart the [ngrok](https://www.npmjs.com/package/ngrok) server every 8 hours.

## Adding a Staging / Production Environment

1. Deploy this code to Heroku.

- `npm install -g heroku`
- `heroku login` (enter login info)
- `heroku create` (do this in this directory. You should now have a server url)
- Copy and paste the server url into the `BOT_URL` environment variable (if you haven't already)
- `git push heroku master`
- Now your bot server should be operational.

2. You need to set the environment variables in Heroku (Heroku doesn't read .env files). You can do that with the following url, substituting `YOUR_APP_NAME` with your app's name. https://dashboard.heroku.com/apps/YOUR_APP_NAME/settings. You should see a Config Vars section. Set the environment variables.
3. If you haven't already, make sure Twilio and Facebook have webhooks that point to your server. [More info in the Twilio Config / Facebook Config section of the docs.](https://docs.google.com/presentation/d/1TDnPto_Cl4piWOrG6cf-_XmdVNg-Aqdwp1QLzIyLqos/edit?usp=sharing)
4. To test if it's working, text the Twilio phone number `START`. You should receive this message `Sorry, we didn't recognize the phone number you sent this from. If you believe this is a mistake, contact your coach.` If you didn't receive that message, check your environment variable credentials in Heroku (specifically for Twilio and BOT_URL).
5. Create a new user in either https://steps-staging.herokuapp.com or your own Admin staging server (whichever you chose earlier in the _.env file_ section).
6. Text the Twilio phone number `START`. You should receive the following message `Hi <get username>! I'm Roo, your financial coaching assistant. I’m here to help you complete the work plan...` If you didn't check the API_URL, OAUTH_ACCESS_TOKEN environment variables.
7. You're all setup now!

# Testing

The tests in the /tests folder are designed only to work with the IDEO.org database (it runs API calls looking for specific users). You can use `tests/e2e.test.js` and `testdata.json` as a sample for how to structure your own tests with your own database.

# Known Bugs

If you have an IDEO.org email address you can access the full list [here](https://docs.google.com/presentation/d/1Jtu08h3ch6HO02TKc0O8WRsBW92Yd9revwvWro4eVv4/edit?usp=sharing).

# Dependencies Used

- Node 9.5.0
- npm 4.6.1
