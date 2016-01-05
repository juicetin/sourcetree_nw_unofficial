var winston = require('winston');
var exec = require('child-process-promise').exec;
var Git = module.exports;
var Promise = require('bluebird');

/*
 *	Sets the repo path, git path folder inside the repo,
 *	and the base git command stating git directory and work tree
 *	(because otherwise weird shit happens)
 *
 *	@param {String} path to the repo directory
 */
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

/*
 *	Gets the console output of git 'showing' a particular commit
 *
 *	@param {String} commitHash - SHA hash
 */
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

/*
 *	Updates the global untracked file list - includes both files that haven't
 *	been added before, and files that have been modified since last commit, etc.
 */
Git.updateUntrackedFileList = function() {
	// var command = global.gitBaseCommand + ' ls-files -m';
	//var command = global.gitBaseCommand + ' ls-files --others --exclude-standard ';
	var command = global.gitBaseCommand + ' diff --name-only ';

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
		modifiedList.pop();
		winston.info(modifiedList);
		// global.modified = modifiedList;
		modifiedList.forEach(function (file) {
			global.modified[file] = 1;
		});

		return Promise.resolve();
	});
}

/*
 *	Gets the global list of untracked files
 *
 *	@return the nested 'object list' of all untracked files
 */
Git.getUntrackedFileList = function() {
	return global.modified;
}

/*
 *	Gets the output of the 'git log' command
 */
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

/*
 *	Gets the repo path
 *
 *	@return the global repo path
 */
Git.getRepoPath = function() {
	return global.repoPath;
}

/*
 *	Removes/resets the status of an otherwise staged file
 *
 *	@param {String} elementId - also simply the 'directory/name' of the file being unstaged
 */
Git.removeStagedFile = function(elementId) {
	var command = global.gitBaseCommand + ' reset HEAD ' + global.repoPath + '/' + elementId;
	return exec(command)
	.then(function() {
		delete global.stagedFiles[elementId];
	});
}

/*
 *	Stages an otherwise non-staged file
 *
 *	@param {String} elementId - simply the 'directory/name' of the file being unstaged
 */
Git.addStagedFile = function(elementId) {
	var command = global.gitBaseCommand + ' add ' + global.repoPath + '/' + elementId;
	winston.info(command);
	return exec(command)
	.then(function () {
		global.stagedFiles[elementId] = 1;
		return Promise.resolve();
	});
}

/*
 *	Get the list of files to be committed
 */
Git.updateFilesToBeCommitted = function() {
	var command = global.gitBaseCommand + ' diff --cached --name-only ';
	return exec(command)
	.then(function (result) {
		var stdout = result.stdout;
		var stderr = result.stderr;

		var files = stdout.split("\n");
		files.pop();

		for (var file of files) {

			// If file is already modified, ignore the fact that there is
			// a semi-staged file so the file doesn't double up in both lists
			if (!global.modified[file]) {
				global.stagedFiles[file] = 1;
			}
		}

		return Promise.resolve();
	});
}

/*
 *	Commits all currently tracked files
 *
 *	@param {String} Commit message
 */
Git.commit = function(message) {
	var command = global.gitBaseCommand + ' commit -m \"' + message + "\"";
	winston.info('About to execute command:\n', command, {});
	return exec(command)
	.then(function (result) {
		var stdout = result.stdout;
		var stderr = result.stderr;

		winston.info(stdout);
		//Stuff?
		
		return Promise.resolve();
	});
}

Git.test = function() {
	winston.info('aw;elfkas;dlcmjsad;f');
}
