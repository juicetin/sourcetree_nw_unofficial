"use strict"

class Commit {
	constructor(sha, author, date, msg) {
		this.sha = sha;
		this.author = author;
		this.date = date;
		this.msg = msg;
	}
}

var winston = require('winston');
var hl = require('highlight').Highlight;

var fs = require('fs');
var exec = require('child-process-promise').exec;
var Promise = require('bluebird');

var gitToolbarHandlers = require('./gitToolbarHandlers.js');

// var top.globals = {};

$( document ).ready(function() {
	loadGitToolbarHandlers();
});

function loadGitToolbarHandlers() {
	var gitToolbarButtons = document.getElementsByClassName("git-toolbar-btn");
	for (var i = 0; i < gitToolbarButtons.length; ++i) {
		if (gitToolbarButtons[i] != undefined) {
			var objId = gitToolbarButtons[i].id;
			winston.info(gitToolbarButtons[i].id);
			gitToolbarButtons[i].addEventListener("click", gitToolbarHandlers[objId]);
		}
	}
	return Promise.resolve();
}

/* 
 * Load a git repo locally (broken)
 */
// function loadRepo() {
// 	return loadFolder()
// 	.then(function () {
// 		return checkIfRepo();
// 	})
// 	.then(function (isRepo) {
// 		if (isRepo) {
// 			console.log('is repo');
// 		} else {
// 			console.log('isnt repo');
// 		}
// 		return Promise.resolve();
// 	});
// }

/*
 * Load a git repo folder path into the global vars
 */
function loadFolder() {
	var chooser = document.createElement('input');
	var unprocessedFolderSelectionString;
	chooser.setAttribute('type', 'file');
	chooser.setAttribute('nwdirectory', 'true');
	chooser.addEventListener('change', function (evt) {
		top.globals.repoPath= this.value;
		winston.info('global repo path now: ', top.globals.repoPath, {});

		top.globals.repoGitPath = top.globals.repoPath + '/.git/';
		winston.info('global repo git path now: ', top.globals.repoGitPath, {});

		top.globals.gitBaseCommand = 'git --git-dir=' + top.globals.repoGitPath +
									 ' --work-tree=' + top.globals.repoPath + ' ';
		winston.info('global base repo git command now: ', top.globals.gitBaseCommand, {});
	}, false);

	chooser.click();
	return Promise.resolve();
}

/*
 * Attach all event listeners to commit entries
 */
function commitEventListeners() {
	winston.info('Attempting to commit all listeners');
	var li = document.getElementsByClassName("commit");
	
	winston.info('There are ', li.length, ' commits in the repository.');
	for (var i = 0; i < li.length; ++i) {
		li[i].addEventListener("click", showCommit);
	}

	return Promise.resolve();
}

/*
 * Show all changes/etc. for a particular commit
 */
function showCommit(e) {

	// Build command to show a commit
	var showColor = ' show --color-words ';
	var commitHash = e.target.attributes.id.value;
	var convertToHTML = ' | ./ansi2html.sh';

	var command = top.globals.gitBaseCommand + 
				  showColor + 
				  commitHash + 
				  convertToHTML;
	winston.info('The following bash command is being run and output captured: ', command);
	
	// Capture output from command
	return exec(command, {maxBuffer: 1024 * 1024 * 1024})
	.then(function (result) {
		var stderr = result.stderr;
		if (stderr) {
			winston.error(stderr);
		}
		
		var HTMLcommitOutput = result.stdout;
		document.getElementById("detail-section").innerHTML = HTMLcommitOutput;
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}

/*
 * Update environment with everything:
 * 	commit list (to-be-graph)
 * 	commit event listeners
 * 	git statuses (all modified/unstaged/delete/etc.)
 */
function updateEnvironment() {
	return getGitGraph()
	.then(function() {
		return commitEventListeners();
	})
	.then(function() {
		return getGitStatus();
	});
}

/*
 * Get status of the repository
 * 	unstaged files
 * 	modified files
 * 	deleted files
 * 	???
 */
function getGitStatus() {
	// var statusColorToHTML = ' -c color.status=always status | ./ansi2html.sh';

	// var command = gitWithDir + workTree + ' status';
	var command = top.globals.gitBaseCommand + ' ls-files -m';

	return exec(command, {maxBuffer: 1024 * 1024 * 1024})
	.then(function (result) {
		var stderr = result.stderr;
		if (stderr) {
			winston.error(stderr);
		}

		var modified = result.stdout;
		var modifiedArr = modified.split("\n");
		winston.info(modifiedArr);
		document.getElementById("git-status").innerHTML = modifiedArr;
		// $("div.git-status").html("werafasdfasfd");
		$("div.git-status").text("herpa derpa");
		return Promise.resolve();

		// var HTMLstatusOutput = result.stdout;

		// var parts = HTMLstatusOutput.split("\n");
		// var modified = [];
		// for (var line of parts) {
		// 	line = line.trim();

		// 	// Get each type of modified file
		// 	switch(line.split(" ")[0]) {
		// 		case "modified:":
		// 			modified.push(line.split(" ")[3]);
		// 		default:
		// 			break;
		// 	}
		// }
		// winston.info('modified files: ', modified, {});

		// document.getElementById("git-status").innerHTML = modified;
		// return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR ', error, {});
		return Promise.reject('failed');
	});
}

// function getGitStatus() {
// 	var command = 'git --git-dir=' + top.globals.repoGitPath + ' --work-tree=' + top.globals.repoPath + ' status';
// 	winston.info('Running git command ', command, {});
// 	return exec(command, {maxBuffer: 1024*1024*1024})
// 	.then(function (result) {
// 		var stderr = result.stderr;
// 		if (stderr) {
// 			winston.error(stderr);
// 		}
// 
// 		var statusOutput = result.stdout;
// 		var statusOutputLines = statusOutput.split("\n");
// 		for (var line of statusOutputLines) {
// 			winston.info(line);
// 		}
// 
// 		document.getElementById("git-status").innerHTML()
// 	})
// 	.fail(function (error) {
// 		winston.error('ERROR ', error, {});
// 		return Promise.reject('failed');
// 	});
// }

/*
 * Generate commit list from stored global repository directory
 */
function getGitGraph() {

	/* Execute git log */
	// var command = 'git --git-dir=' + top.globals.repoGitPath + ' --work-tree=' + top.globals.repoPath + ' log';
	var command = top.globals.gitBaseCommand + 'log';
	return exec(command)
	.then(function (result) {

		/* Capture console output */
		var stdout = result.stdout;
		var stderr = result.stderr;
		
		var stdoutParts = stdout.split("\n");
		var full = "";

		/* Retain only lines stating commit hash */
		// TODO include other info such as author, date, etc.
		for (var line of stdoutParts) {
			if (line.indexOf("commit") === 0) {
				var commitHash = line.split(" ")[1].substring(0,6);
				var listClass = " class=\"commit\" ";
				var listId = "id=" + "\"" + commitHash + "\" ";
				var listOpen = "<li " + listClass + listId +  ">";
				var listLine = listOpen + commitHash + "</li>";
				full += listLine;
			}
		}

		/* Set the appropriate section to hold commits */
		document.getElementById("commits").innerHTML = full;
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}
