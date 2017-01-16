
class PatternBuilder {
  constructor(bot, exp) {
    this.bot = bot;
    this.startExp = exp;

    this.pattern = null;
    this.fp = null;
    this.sp = [];

    this.ifEnds = [];
    this.nextIf = false;

    this.pattern = null;
    this.fp = null;
  }

  addNode(node, fp) {
    if (this.fp) {
      this.fp.next = node;
    } else {
      this.pattern = node;
    }

    this.fp = fp? fp : node;

    if (this.nextIf) {
      this.nextIf = false;
      this.ifEnds.forEach(ifEnd => {
        ifEnd.next = node;
      });
      this.ifEnds = [];
    }
  }

  _if(exp) {
    const newNode = {listen:exp};
    const condNode = {if: [newNode]};

    this.addNode(condNode, newNode);
    this.sp.push(condNode);
    return this;
  }

  _elseif(exp) {
    this.ifEnds.push(this.fp);

    const newNode = {listen:exp};
    const condNode = this.sp[this.sp.length-1];

    condNode.if.push(newNode);
    this.fp = newNode;
    return this;
  }

  _endif() {
    this.ifEnds.push(this.fp);
    this.nextIf = true;

    this.fp = this.sp.pop();
    return this;
  }

  endPattern() {
    this.bot.addPattern(this.startExp, this.pattern);
  }

  task(tag, param) {
    this.addNode({action:tag, param:param});
    return this;
  }

  say(text) {
    this.task('say', text);
    return this;
  }

  createProgressBar(id, text) {
    this.task('createProgressBar', {id, text});
    return this;
  }

  remember(exp, key) {
    this._if(exp);
    this.fp.remember = key;
    this._endif();
    return this;
  }
}

module.exports = PatternBuilder;
