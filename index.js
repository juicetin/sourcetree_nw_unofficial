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
global.windows.w = window.screen.availWidth;
global.windows.h = window.screen.availHeight;

var winston = require('winston');
var hl = require('highlight').Highlight;
var Set = require('collections/set');

var fs = require('fs');
var Promise = require('bluebird');

var Git = require('./src/js/git.js');
global.Git = Git; // Hacky - but nwjs require is broken, can't include from other directories

var gitToolbarHandlers = require('./src/js/gitToolbarHandlers.js')({gui: gui});

$( document ).ready(function() {
	loadGitToolbarHandlers();

	// To make testing easier
	global.repoPath = '/home/justinting/programming/sourcetree_nw_unofficial';
	Git.setRepoPath(global.repoPath);
	updateEnvironment();
});

/*
 *	Attach click events to each toolbar button i.e.
 *		commit, checkout, branch, etc., where each
 *		will open a new window for the user to 
 *		perform the necessary operations
 */
function loadGitToolbarHandlers() {

	// Cycle through all buttons with the git toolbar button class
	var gitToolbarButtons = document.getElementsByClassName("git-toolbar-btn");
	for (var i = 0; i < gitToolbarButtons.length; ++i) {

		// If the button exists
		if (gitToolbarButtons[i] != undefined) {

			// Assign the handler function of the same name
			var objId = gitToolbarButtons[i].id;
			gitToolbarButtons[i].addEventListener("click", gitToolbarHandlers[objId]);
		}
	}

	return Promise.resolve();
}

/*
 *	Check if the repo path provided is an actual git repo
 */
function checkIfRepo() {
	var repoPath = Git.getRepoPath();
	while (repoPath === undefined) {}
	var files = fs.readdirSync(repoPath).forEach(function (file) {
		winston.info(file);
	});
}

/* 
 * 	Load a git repo locally (broken)
 */
function loadRepo() {
	return loadFolder()
	.then(function () {
		return checkIfRepo();
	})
	.then(function (isRepo) {
		if (isRepo) {
			winston.info('is repo');
		} else {
			winston.info('isnt repo');
		}
		return Promise.resolve();
	});
}

/*
 * 	Load a git repo folder path into the global vars
 */
function loadFolder() {

	// Generate folder choosing popup
	var chooser = document.createElement('input');
	chooser.setAttribute('type', 'file');
	chooser.setAttribute('nwdirectory', 'true');
	chooser.addEventListener('change', function (evt) {
		Git.setRepoPath(this.value);
	}, false);

	chooser.click();
	return Promise.resolve();
}

/*
 * 	Attach all event listeners to commit entries
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
 * 	Show all changes/etc. for a particular commit
 */
function showCommit(e) {
	
	// Capture output from command
	var commitHash = $(this).attr('id');
	return Git.commitCodeOutput(commitHash)
	.then(function (HTMLcommitOutput) {
		// var stderr = result.stderr;
		// if (stderr) {
		// 	winston.error(stderr);
		// }
		// 
		// var HTMLcommitOutput = result.stdout;
		$( "#commit-details" ).html(HTMLcommitOutput);
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}

/*
 * 	Update environment with everything:
 * 	  commit list (to-be-graph)
 * 	  commit event listeners
 * 	  git statuses (all modified/unstaged/delete/etc.)
 */
function updateEnvironment() {

	// No modifying action if no repo loaded yet
	if (!Git.getRepoPath()) {
		document.getElementById("no-repo").showModal();
		return Promise.resolve();
	}

	// Get lists of commits
	return populateCommitTable()

	// Bind each commit click action to commit code
	.then(function() {
		return commitEventListeners();
	})

	// Load repo status data (un/tracked files, etc.)
	.then(function() {
		return getGitStatus();
	});
}

/* 	Escape periods and forward slashes
 * 	when dealing with DOM manipulation 
 * 	for elements with id's containing them
 */
function escapePeriods (str) {
	str = str.replace('.', '\\.');
	str = str.replace(/\//g, '\\/');
	return str;
}

// {
// 	input: {
// 		id: element.id,
// 		type: 'checkbox',
// 		onchange: 'toggleFileCheckbox(this)',
// 		value: element.id,
// 		label: {
// 			for: element.id
// 		}
// 	}
// }

/*
 *	Removes a git status item
 *
 *	@param {String} elementId - the DOM element id, also the filename
 */
function removeGitStatusFile(elementId) {
	$('#' + elementId).next('label').remove();
	$('#' + elementId).next('br').remove();
	$('#' + elementId).remove();
}

/*
 *	Builds the HTML for the file status section given a particular element id
 *
 *	@param {String} elementId
 *	@param {Boolean} setupStagedFiles - whether function was called during setup
 *	@return {String} the resulting HTML string
 */
function buildGitStatusFileHTML(elementId, setupStagedFiles) {
	var html = "<input id=\""+ 
				elementId +
				"\" type=\"checkbox\" onchange=\"toggleFileCheckbox(this)\" ";

	if (setupStagedFiles) {
		html += "class=\"staged-files\" ";
	}

	html += "value=\"" + elementId + "\">" +
			"<label for=\"" + elementId + "\">" + 
			elementId + "</label><br>";
	return html;
}

/*
 *	Marks a file as staged and adds it to the global staged list,
 *	as well as moving the visual elemennt itself into the staged
 *	checkbock list, and has it 'marked' once moved
 *
 *	@param {Object} element - the element that was clicked (whether checked
 *		or unchecked)
 */
function toggleFileCheckbox(element) {
	// TODO re-sort files after each transfer

	// If the element is unchecked
	if (!element.checked) {
		
		// Remove the file from the global staged file dict
		winston.info('unselected ', element.id, {});
		return Git.removeStagedFile(element.id)
		.then(function() {
			// Remove item from staged list
			var elementId = escapePeriods(element.id);
			removeGitStatusFile(elementId);

			// Add file to the unstaged list, and leave unchecked (the box)
			var modifiedHTML = buildGitStatusFileHTML(element.id);
			$('#unstaged-files-list').append(modifiedHTML);
			return Promise.resolve();
		});
	} 
	
	// If the element is checked
	else if (element.checked) {

		// Add the file to the global staged file dict
		winston.info('selected ', element.id, {});
		return Git.addStagedFile(element.id)
		.then(function () {

			// Remove item from the unstaged list
			var elementId = escapePeriods(element.id);
			removeGitStatusFile(elementId);

			// Add file to the staged list, and check it (the box)
			var modifiedHTML = buildGitStatusFileHTML(element.id);
			$('#staged-files-list').append(modifiedHTML);

			// Mark checkboxes as ticked when moved into staged list
			$('#' + escapePeriods(element.id)).attr('checked', true);
			return Promise.resolve();
		});
	}
}

/*
 * 	Get status of the repository; populate the list of staged/unstaged files
 */
function getGitStatus() {

	// Unstaged list
	return Git.updateUntrackedFileList()
	.then(function () {
		var untrackedFileList = Git.getUntrackedFileList();
		var modListLen = untrackedFileList.length;
		winston.info(untrackedFileList);

		//winston.info('got here');

		var modifiedHTML = "";
		// for (var i = 0; i < untrackedFileList.length-1; ++i) {
		for (var file in untrackedFileList) {
			modifiedHTML += buildGitStatusFileHTML(file);
		}

		// Repopulate unstaged file list
		$('#unstaged-files-list').html(modifiedHTML);

		return Promise.resolve();
	})
	.then(function() {
		return Git.updateFilesToBeCommitted();
	})
	.then(function() {

		var filesToBeCommitted = global.stagedFiles;

		var toBeCommittedHTML = "";
		//filesToBeCommitted.forEach(function (file) {
		for (var file in filesToBeCommitted) {
			toBeCommittedHTML += buildGitStatusFileHTML(file, true);
		}

		$('#staged-files-list').html(toBeCommittedHTML);
		$('.staged-files').attr('checked', true);
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR ', error, {});
		return Promise.reject('failed');
	});
}

/*
 * 	Generates a commit row from a commit object
 */
function generateCommitRow(commitInfo) {
	var graph = "<td>" + commitInfo.graph + "</td>";
	var sha = "<td>" + commitInfo.sha + "</td>";
	var msg = "<td>" + commitInfo.msg + "</td>";
	var author = "<td>" + commitInfo.author + "</td>";
	var date = "<td>" + commitInfo.date + "</td>";
	var listClass = " class=\'commit\' ";
	var listId = " id=" + "\'" + commitInfo.sha + "\' ";
	var listOpen = "<tr " + listId + listClass + ">";
	var listLine = listOpen + graph + sha + msg + author + date + "</tr>";
	return listLine;
}

/*
 * 	Generate commit list from stored global repository directory
 */
function populateCommitTable() {

	/* Execute git log */
	return Git.getLog()
	.then(function (commits) {

		var full = "<tr>"+ "<th>Graph</th>" + "<th>Commit</th>"+"<th>Message</th>"+"<th>Author</th>"+"<th>Date</th>";
		var curCommit = {};

		for (var commit of commits) {
			full += generateCommitRow(commit);
		}

		// // Parse each line of git log output
		// for (var line of stdoutParts) {
		// 	line = line.trim();
		// 	var i = line.indexOf(" ");
		// 	var lineParts = [line.slice(0,i), line.slice(i+1)];

		// 	// Store information from output line depending on contents
		// 	switch(lineParts[0]) {
		// 		case "commit":
		// 			// Add another row to HTML to populate commit table
		// 			if (Object.keys(curCommit).length > 0) {
		// 				full += generateCommitRow(curCommit);
		// 			}
		// 			curCommit.sha= lineParts[1].substring(0,6);
		// 			break;
		// 		case "Author:":
		// 			curCommit.author = lineParts[1];
		// 			break;
		// 		case "Date:":
		// 			curCommit.date = lineParts[1];
		// 			break;
		// 		case "Merge:":
		// 			curCommit.merge = lineParts[1];
		// 			break;
		// 		default:
		// 			if (line.trim().length > 0) {
		// 				curCommit.msg = line;
		// 			}
		// 			break;
		// 	}
		// }

		/* Set the appropriate section to hold commits */
		$( '#commits' ).html(full);
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}
