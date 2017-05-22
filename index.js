// slack
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;

const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

const token = process.env.SLACK_API_TOKEN || '';
const bot_token = process.env.SLACK_BOT_TOKEN || '';

const  web = new WebClient(token);
const rtm = new RtmClient(bot_token);

const channels = {};
const users = {};

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  rtmStartData.channels.forEach(channel => {
    console.log(`${channel.id} ${channel.name} ${channel.is_member}`);
    if (channel.is_member) {
      channels[channel.name] = channel.id;
    }
  });
  rtmStartData.users.forEach(user => {
    console.log(`${user.id} ${user.name}`);
    users[user.name] = user.id;
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
const bodyParser = require('body-parser');
const express = require('express');
require('express-namespace');

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.namespace('/webhook', () => {
  app.namespace('/github', () => {
    app.post('/', (req, res) => {
      const CHANNEL = 'bot-test';
      const event = req.body;
      console.log(event.action);
      switch (event.action) {
        case 'opened': {
          const issue = event.issue;
          const message = `
:github: Create ${issue.title} ${issue.url}
by @${issue.user.login} to asignee: @${issue.assignee.login}
          `;
          console.log('github post', message);
          console.log(event);
          rtm.sendMessage(message, channels[CHANNEL]);
          break;
        }
        case 'assigned': {
          const issue = event.issue;
          const message = `
:github: Asign ${issue.title} ${issue.url}
by @${issue.user.login}
          `;
          web.chat.postMessage(users[issue.assignee.login], message, () => {});
          break;
        }
        default: {
          break;
        }
      }
      res.sendStatus(200);
    });
  });
  app.namespace('/kibela', () => {
    app.post('/', (req, res) => {
      console.log('kibela post');
      console.log(req.body);
      rtm.sendMessage(JSON.stringify(req.body), channels['bot-test']);
      res.sendStatus(200);
    });
  });
});

app.listen(port, '0.0.0.0');
