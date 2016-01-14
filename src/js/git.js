var winston = require('winston');
var exec = require('child-process-promise').exec;
var Git = module.exports;
var Promise = require('bluebird');
var ansi_up = require('ansi_up');
var AnsiToHTML = require('ansi-to-html');
var ansiToHTML = new AnsiToHTML();
// var ANSI = require('ansi-graphics');
// var a = new ANSI();
var _ = require('underscore');


Git.addRepoPath = function (path) {
	if (!global.repoPaths[path]) {
		global.repoPaths[path] = 1;

		// Path didn't already exist
		return true;
	}

	// Path already existed
	return false;
}

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
	var show = ' show --color ';
	var convertToHTML = ' | src/ansi2html.sh';

	// This one breaks the conversion somewhat
	var command = global.gitBaseCommand +
				  show +
				  commitHash +
				  convertToHTML;

	winston.info('The following bash command is being run and output captured: ', command);
	return exec(command, {maxBuffer: 1024 * 1024 * 1024})
	.then(function(result) {

		var stderr = result.stderr;
		if (stderr) {
			winston.error(stderr);
		}

		var ansiOutput = result.stdout;
		var html = ansiOutput;
		// var html = ansiToHTML.toHtml(ansiOutput);
		// var html = ansi_up.escape_for_html(ansiOutput);
		return html;
	});
}

/*
 *	Updates the global untracked file list - includes both files that haven't
 *	been added before, and files that have been modified since last commit, etc.
 */
Git.updateUntrackedFileList = function() {
	// var command = global.gitBaseCommand + ' ls-files -m';
	var command1 = global.gitBaseCommand + ' ls-files --others --exclude-standard ';
	var command2 = global.gitBaseCommand + ' diff --name-only ';

	return exec(command1, {maxBuffer: 1024 * 1024 * 1024})
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

		return exec(command2, {maxBuffer: 1024 * 1024 * 1024});
	})
	.then(function (result) {
		var stderr = result.stderr;
		if (stderr) {
			winston.error(stderr);
		}

		var modified = result.stdout;
		modifiedList = modified.split("\n")
		modifiedList.pop();
		winston.info(modifiedList);
		modifiedList.forEach(function (file) {
			global.modified[file] = 1;
		});
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

	// TODO Break this up/explain it so it's cleaner
	// var command2 = global.gitBaseCommand + ' log --graph --abbrev-commit --decorate --date=relative --format=format:\' \;\; %C(bold blue)%h%C(reset) ;; %C(bold cyan)%aD%C(reset) ;; %C(white)%s%C(reset) ;; %C(dim white) %an%C(reset) ;; %C(bold yellow)%d%C(reset)\' --all';
	var command2 = global.gitBaseCommand + ' log --graph --abbrev-commit --decorate --date=relative --format=format:\' \;\; %h ;; %aD ;; %d - %s ;; %an ;; \' --all';
	winston.info(command2);

	return exec(command2)
	.then(function (result) {

		var stdout = result.stdout;

		var parts = stdout.split(';;');
		var parts2 = parts.map(function (part) {
			var html = ansiToHTML.toHtml(part);
			var html = ansi_up.escape_for_html(part);

			return part.trim();
		}).filter(function(part) {
			return part.length > 0;
		});

		// Break commit data down into individual commit objects
		var commits = [];
		for (var i = 0; i < parts2.length; i+=5) {
			var commit = {
				graph: parts2[i],
				sha: parts2[i+1],
				date: parts2[i+2],
				msg: parts2[i+3],
				author: parts2[i+4]
			};

			commits.push(commit);
		}

		return Promise.resolve(commits);
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
 *	Get a list of staged files
 */
Git.getStagedFiles = function() {
	return global.stagedFiles;
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
		
		return Promise.resolve(stdout);
	});
}

/*
 *	
 */
Git.checkout = function() {

}

/*
 *	Pushes the current branch to its remote upstream location
 */
Git.push = function() {

	var curBranchCommand = global.gitBaseCommand + ' rev-parse --abbrev-ref HEAD';
	winston.info('About to execute command:\n', curBranchCommand, {});
	return exec(curBranchCommand)
	.then(function (result) {
		var stderr = result.stderr;
		var branch = result.stdout;

		return Promise.resolve(branch);
	})
	.then(function (branch) {
		var command = global.gitBaseCommand + ' push -u origin ' + branch;
		// var command = global.gitBaseCommand + ' push ';
		winston.info('About to execute command:\n', command, {});
		return exec(command, {maxBuffer: 1024*1024*1024});
	})
	.then(function (result) {
		var stderr = result.stderr;
		var stdout = result.stdout;

		console.log(result);
		// Stuff?
		
		return Promise.resolve(stdout);
	});
}
