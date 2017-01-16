<?php
namespace Deployer;

require 'recipe/common.php';

// Configuration
set('use_relative_symlink', false);
set('default_stage', 'local');



// Servers

foreach (glob(__DIR__ . '/stage/*.yml') as $filename) {
	serverList($filename);
}


// Tasks
desc('Installing bower components');
task('deploy:bower', function () {
    run('cd {{release_path}}/assets && bower update');
});

desc('Deploy your project');
task('deploy', [
	'deploy:prepare',
	'deploy:lock',
	'deploy:release',
	'deploy:update_code',
	'deploy:shared',
	'deploy:writable',
	'deploy:vendors',
    'deploy:bower',
	'deploy:clear_paths',
	'deploy:symlink',
	'deploy:unlock',
	'cleanup'
]);
after('deploy', 'success');
