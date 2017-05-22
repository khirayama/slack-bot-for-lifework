// slack
const RtmClient = require('@slack/client').RtmClient;

const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

const bot_token = process.env.SLACK_BOT_TOKEN || '';

const rtm = new RtmClient(bot_token);
const channels = {};

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  rtmStartData.channels.forEach(channel => {
    console.log(`${channel.id} ${channel.name} ${channel.is_member}`);
    if (channel.is_member) {
      channels[channel.name] = channel.id;
    }
  });
});

rtm.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, () => {
  // rtm.sendMessage("I'm working!", channels['bot-test']);
  console.log('I\'m woking');
});

rtm.on(RTM_EVENTS.MESSAGE, message => {
  console.log('Message:', message);
});

rtm.start();

// webhook
const express = require('express');
require('express-namespace');

const app = express();

app.namespace('/webhook', () => {
  app.namespace('/github', () => {
    app.get('/', () => {
      console.log('github get');
    });
    app.post('/', () => {
      console.log('github post');
    });
  });
  app.namespace('/kibela', () => {
    app.get('/', () => {
      console.log('kibela get');
    });
    app.post('/', () => {
      console.log('kibela post');
    });
  });
});
