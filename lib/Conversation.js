"use strict";
class Conversation {
  constructor(option, user, channel) {
    this.bot = option.bot;
    this.pattern = option.pattern;
    this.onTask = option.onTask;
    this.onEnd = option.onEnd;
    this.sp = [this.pattern];
    this.fp = this.pattern;


    this.context = {
      remember:{},
      user,
      channel,
    };
  }

  process() {
    if (!this.fp) {
      this.onEnd();
      return;
    }

    if (this.fp.if) {
      return;
    }

    const task = this.onTask(this.fp.action);
    if (task) {
      task(this.fp.param, this.context, this.bot)
      .then(() => {
        this.fp = this.fp.next;
        this.process();
      });

    } else {
      this.fp = this.fp.next;
      this.process();
    }
  }

  listen(text, user, channel) {
    if (!this.fp.if) {
      return;
    }

    let matched = null;
    this.fp.if.some(cond => {
      if (text.match(cond.listen)) {
        matched = cond;
        return true;
      }
      return false;
    });

    if (!matched) {
      return;
    }

    if (matched.remember) {
      Object.assign(this.context.remember, {[matched.remember]: text});
    }

    this.fp = matched.next;
    this.process();
  }
}

module.exports = Conversation;
