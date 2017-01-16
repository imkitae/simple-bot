const path = require('path');
const spawn = require('child_process').spawn;

module.exports = (param, context, bot) => {
  return new Promise((resolve, reject) => {
    bot.createProgressBar(context.channel, 'deploy_progress', '배포 준비중..')
    .then(() => {
      let stage = context.remember.stage;
      console.log(`deploy to ${stage}`);

      const dep = spawn('dep', ['deploy', stage], {cwd: path.resolve(__dirname, '../deployer')});

      dep.stderr.on('data', (data) => {
        console.log('dep err:', data.toString());
      });

      dep.stdout.on('data', (data) => {
        const matched = data.toString().match(/Executing task ([:\w]+)/);
        if (!matched) {
          return;
        }

        const task = matched[1];
        let progress = 0;

        if (task == 'deploy:prepare') {
          progress = 10;
        } else if (task == 'deploy:update_code') {
          progress = 40;
        } else if (task == 'deploy:vendor') {
          progress = 70;
        } else if (task == 'deploy:bower') {
          progress = 90;
        } else {
          return;
        }

        bot.setProgressBar('deploy_progress', task, progress);
      });

      dep.on('close', (code) => {
        if (code == 0) {
          bot.setProgressBar('deploy_progress', '배포 완료', 100);
          resolve();
        } else {
          bot.setProgressBar('deploy_progress', '에러 발생', 100);
          reject();
        }
      });
    });
  });
}
