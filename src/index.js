// slack
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;

const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

const token = process.env.SLACK_API_TOKEN || '';
const bot_token = process.env.SLACK_BOT_TOKEN || '';

const web = new WebClient(token);
const rtm = new RtmClient(bot_token);

const { users, github2slack } = require('./users');

const _channels = {};
const _users = {};

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  rtmStartData.channels.forEach(channel => {
    console.log(`${channel.id} ${channel.name} ${channel.is_member}`);
    if (channel.is_member) {
      _channels[channel.name] = channel.id;
    }
  });
  console.log(_channels);
  rtmStartData.users.forEach(user => {
    console.log(`${user.id} ${user.name}`);
    _users[user.name] = user.id;
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

// handlers
function githubWebhookHandler(req, res) {
  const CHANNEL = 'git';

  const payload = req.body;
  const pull = (payload.issue) ? payload.issue : payload.pull_request;
  const pullType = (payload.issue) ? 'issue' : 'pull request';

  console.log(payload.action);
  switch (payload.action) {
    case 'opened': {
      const message = `${pull.html_url} ${pullType} been created`;
      rtm.sendMessage(message, _channels[CHANNEL]);
      break;
    }
    case 'assigned': {
      pull.assignees.forEach(assignee => {
        const slackName = github2slack(assignee.login);
        const message = `@${slackName} ${pull.html_url} you've been assigned`;
        if (slackName) {
          web.chat.postMessage(_users[slackName], message, () => {});
        }
      });
      break;
    }
    case 'created': {
      const comment = payload.comment.body;
      users.map(user => user.github).forEach(githubName => {
        if (comment.indexOf(githubName) !== -1) {
          const slackName = github2slack(githubName);
          const message = `@${slackName} ${payload.comment.html_url} you've been mentioned`;
          if (slackName) {
            web.chat.postMessage(_users[slackName], message, () => {});
          }
        }
      });
      break;
    }
    default: {
      break;
    }
  }
  res.sendStatus(200);
}

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
    app.post('/', githubWebhookHandler);
  });
  app.namespace('/kibela', () => {
    app.post('/', (req, res) => {
      console.log('kibela post');
      console.log(req.body);
      rtm.sendMessage(JSON.stringify(req.body), _channels['bot-test']);
      res.sendStatus(200);
    });
  });
});

app.listen(port, '0.0.0.0');
