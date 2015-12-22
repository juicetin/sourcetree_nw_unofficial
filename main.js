"use strict"

class Commit {
	constructor(commitProperties) {
		this.sha = commitProperties.sha;
		this.author = commitProperties.author;
		this.date = commitProperties.date;
		this.msg = commitProperties.msg;
		this.merge = commitProperties.merge;
	}
}

var gui = require('nw.gui')
// top.windows.commit= gui.Window.open('commit.html', {
// 	"show": false
// });
top.windows.w = window.screen.availWidth;
top.windows.h = window.screen.availHeight;

var winston = require('winston');
var hl = require('highlight').Highlight;

var fs = require('fs');
var exec = require('child-process-promise').exec;
var Promise = require('bluebird');

var gitToolbarHandlers = require('./gitToolbarHandlers.js')({
	gui: gui
});

// var top.globals = {};

$( document ).ready(function() {
	loadGitToolbarHandlers();
});

function loadGitToolbarHandlers() {
	var gitToolbarButtons = document.getElementsByClassName("git-toolbar-btn");
	for (var i = 0; i < gitToolbarButtons.length; ++i) {
		if (gitToolbarButtons[i] != undefined) {
			var objId = gitToolbarButtons[i].id;
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
	var commitHash = $(this).attr('id');
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
		$( "#commit-details" ).html(HTMLcommitOutput);
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

	if (!top.globals.repoPath) {
		document.getElementById("no-repo").showModal();
		return Promise.resolve();
	}

	return populateCommitTable()
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
		var modifiedList = modified.split("\n");

		var modListLen = modifiedList.length;
		if (modListLen > 1) {
			var modifiedHTML = "";
			for (var i = 0; i < modifiedList.length-1; ++i) {
				modifiedHTML += "<li>" + modifiedList[i] + "</li>";
			}
			document.getElementById("changed-files").innerHTML = modifiedHTML;
		} else {
			var noChanges = "No modified, new, or unstaged files.";
			document.getElementById("changed-files").innerHTML = noChanges;
		}

		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR ', error, {});
		return Promise.reject('failed');
	});
}

function generateCommitRow(options) {
	var commitInfo = options.commitInfo;
	var sha = "<td>" + commitInfo.sha + "</td>";
	var msg = "<td>" + commitInfo.msg + "</td>";
	var author = "<td>" + commitInfo.author + "</td>";
	var date = "<td>" + commitInfo.date + "</td>";

	var listClass = " class=\'commit\' ";
	var listId = " id=" + "\'" + commitInfo.sha + "\' ";
	var listOpen = "<tr " + listId + listClass + ">";
	var listLine = listOpen + sha + msg + author + date + "</tr>";
	return listLine;
}

/*
 * Generate commit list from stored global repository directory
 */
function populateCommitTable() {

	/* Execute git log */
	// var command = 'git --git-dir=' + top.globals.repoGitPath + ' --work-tree=' + top.globals.repoPath + ' log';
	var command = top.globals.gitBaseCommand + 'log';
	return exec(command)
	.then(function (result) {

		/* Capture console output */
		var stdout = result.stdout;
		var stderr = result.stderr;
		
		var stdoutParts = stdout.split("\n");
		var full = "<tr>"+
			"<th>Commit</th>"+
			"<th>Message</th>"+
			"<th>Author</th>"+
			"<th>Date</th>";
		// Commit
		// Merage
		// Author
		// Date
		var curCommit = {};
		for (var line of stdoutParts) {
			line = line.trim();
			var i = line.indexOf(" ");
			var lineParts = [line.slice(0,i), line.slice(i+1)];
			switch(lineParts[0]) {
				case "commit":
					// When we hit a commit line and commit object is 
					// populated (non-empty), add to row
					if (Object.keys(curCommit).length > 0) {
						full += generateCommitRow({
							commitInfo: curCommit,
							lineParts: lineParts
						});
					}
					curCommit.sha= lineParts[1].substring(0,6);
					break;
				case "Author:":
					curCommit.author = lineParts[1];
					break;
				case "Date:":
					curCommit.date = lineParts[1];
					break;
				case "Merge:":
					curCommit.merge = lineParts[1];
					break;
				default:
					if (line.trim().length > 0) {
						curCommit.msg = line;
					}
					break;
			}
		}

		/* Set the appropriate section to hold commits */
		//document.getElementById("commits").innerHTML = full;
		$( '#commits' ).html(full);
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}
