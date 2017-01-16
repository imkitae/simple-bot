const Bot = require('./lib/Bot');
const deploy = require('./tasks/deploy');

const bot = new Bot('<YOUR-SLACK-BOT-TOKEN>');

bot.defineTask('deploy', deploy);

bot.definePattern('배포')
  .say('인트라넷 배포할까요?')
  ._if(Bot.pattern.YES)
    .say('어떤 stage에 배포할까요? [intranet|studiod]')
    .remember(/intranet|studiod/, 'stage')
    .say('배포를 시작합니다.')
    .task('deploy')
    .say('{stage} 배포가 완료되었습니다!')
  ._elseif(Bot.pattern.NO)
    .say('네, 그럼 배포하지 않을게요.')
  ._endif()
.endPattern();

bot.start({logLevel: 'error'});
