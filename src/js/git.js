var winston = require('winston');
var exec = require('child-process-promise').exec;
var Git = module.exports;
var Promise = require('bluebird');

Git.setRepoPath = function(path) {
	global.repoPath = path;
	winston.info('global repo path now: ', global.repoPath, {});

	global.repoGitPath = global.repoPath + '/.git/';
	winston.info('global repo git path now: ', global.repoGitPath, {});

	global.gitBaseCommand = 'git --git-dir=' + global.repoGitPath +
								 ' --work-tree=' + global.repoPath + ' ';
	winston.info('global base repo git command now: ', global.gitBaseCommand, {});
	global.folderSelected = true;
}

Git.commitCodeOutput = function(commitHash) {
	var showColor = ' show --color-words ';
	var convertToHTML = ' | src/ansi2html.sh';

	var command = global.gitBaseCommand +
				  showColor +
				  commitHash +
				  convertToHTML;
	winston.info('The following bash command is being run and output captured: ', command);
	return exec(command, {maxBuffer: 1024 * 1024 * 1024});
}

Git.updateUntrackedFileList = function() {
	// var command = global.gitBaseCommand + ' ls-files -m';
	var command = global.gitBaseCommand + ' ls-files --others --exclude-standard ';

	return exec(command, {maxBuffer: 1024 * 1024 * 1024})
	.then(function (result) {

		// Log error if needed
		var stderr = result.stderr;
		if (stderr) {
			winston.error(stderr);
		}

		// Store list of modified files globally
		var modified = result.stdout;
		var modifiedList = modified.split("\n");
		global.modified = modifiedList;

		return Promise.resolve();
	});
}

Git.getUntrackedFileList = function() {
	return global.modified;
}

Git.getLog = function() {
	var command = global.gitBaseCommand + ' log';
	return exec(command)
	.then(function (result) {
		/* Capture console output */
		var stdout = result.stdout;
		var stderr = result.stderr;
		
		var stdoutParts = stdout.split("\n");
		return stdoutParts
	});
}

Git.getRepoPath = function() {
	return global.repoPath;
}

Git.removeStagedFile = function(elementId) {
	//TODO actually git reset HEAD <file>
	var command = global.gitBaseCommand + ' reset HEAD ' + global.repoPath + '/' + elementId;
	exec(command);
	delete global.stagedFiles[elementId];
}

Git.addStagedFile = function(elementId) {
	//TODO actually git add <file>
	var command = global.gitBaseCommand + ' add ' + global.repoPath + '/' + elementId;
	winston.info(command);
	exec(command);
	global.stagedFiles[elementId] = 1;
}

/*
 *	Get the list of files to be committed
 */
Git.getFilesToBeCommitted = function() {
	var command = global.gitBaseCommand + ' diff HEAD --name-only ';
	return exec(command)
	.then(function (result) {
		var stdout = result.stdout;
		var stderr = result.stderr;

		var files = stdout.split("\n");
		files.pop();
		return Promise.resolve(files);
	});
}
