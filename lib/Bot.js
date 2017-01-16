"use strict";
const RtmClient = require('@slack/client').RtmClient;
const CLIENT_RTM_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

const Conversation = require('./Conversation');
const PatternBuilder = require('./PatternBuilder');

class Bot {
  constructor(bot_token, option) {
    this.rtm = new RtmClient(bot_token, option);

    this.rtm.on(CLIENT_RTM_EVENTS.AUTHENTICATED, function (rtmStartData) {
      console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
    });

    this.rtm.on(CLIENT_RTM_EVENTS.RTM_CONNECTION_OPENED, function () {
      console.log('connection opened');
    });

    this.rtm.on(RTM_EVENTS.MESSAGE, msg => {
      // msg: { type: 'message',
      //   channel: 'D3Q...',
      //   user: 'U36...',
      //   text: 'some text',
      //   ts: '<timestamp>',
      //   team: 'T02...' }
      this.onMessage(msg);
    });

    this.patternInfo = [];
    this.conversations = [];
    this.tasks = {};
    this.progresses = {};

    this.defineTask('say', (param, context) => {
      let text = param;
      Object.keys(context.remember).forEach(key => {
        text = text.replace(new RegExp(`{${key}}`, 'g'), context.remember[key]);
      });
      return this.say(context.channel, text);
    });

    this.defineTask('createProgressBar', (param, context) => {
      return this.createProgressBar(context.channel, param.id, param.text);
    });
  }

  addPattern(startExp, pattern) {
    this.patternInfo.push({startExp, pattern});
  }

  onMessage(msg) {
    if (!msg.text) {
      return;
    }

    this.conversations.forEach(conv => {
      conv.listen(msg.text, msg.user, msg.channel);
    });

    this.patternInfo.forEach((info) => {
      if (msg.text.match(info.startExp)) {
        this.startConversation(info.pattern, msg.user, msg.channel);
      }
    });
  }

  start() {
    this.rtm.start();
  }

  startConversation(pattern, user, channel) {
    const onEnd = () => {
      this.endConversation(conv);
    };

    const onTask = (name) => {
      return this.tasks[name];
    };

    const conv = new Conversation({bot:this, pattern, onEnd, onTask}, user, channel);
    this.conversations.push(conv);
    conv.process();
  }

  endConversation(conv) {
    const index = this.conversations.indexOf(conv);
    if (index !== -1) {
      this.conversations.splice(index, 1);
    }
  }

  defineTask(name, task) {
    this.tasks[name] = task;
  }

  definePattern(startExp) {
    return new PatternBuilder(this, startExp);
  }

  makeProgressBarText(text, percent) {
    let barText = '';
    for (let i=0; i<Math.floor(percent/10); ++i) {
      barText += '██';
    }
    return `${text} ${barText}${percent}%`;
  }

  createProgressBar(channel, id, text) {
    return new Promise((resolve) => {
      const progressText = this.makeProgressBarText(text, 0);
      this.say(channel, progressText)
      .then((res) => {
        this.progresses[id] = {msg: res};
        resolve();
      });
    });
  }

  setProgressBar(id, text, percent) {
    const progress = this.progresses[id];
    if (!progress) {
      console.log(`progressBar(${id}) not found`);
      return;
    }

    progress.msg.text = this.makeProgressBarText(text, percent);
    this.rtm.updateMessage(progress.msg);
  }

  say(channel, text) {
    return new Promise((resolve) => {
      this.rtm.sendMessage(text, channel, (err, res) => {
        resolve(res);
      });
    });
  }
}

Bot.pattern = {
  YES: /응|네|그래|어|ㅇㅇ|해주|해줘/,
  NO: /아니|아뇨|ㄴㄴ|하지마/,
};

module.exports = Bot;
