/*
 * 	TODO list
 *		+ deal with when a repo has no commits yet
 */

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

var winston = require('winston');
var hl = require('highlight').Highlight;
var Set = require('collections/set');

var fs = require('fs');
var fsp = require('fs-promise');
var Promise = require('bluebird');

var Git = require('./src/js/git.js');

var gitToolbarHandlers = require('./src/js/gitToolbarHandlers.js')({gui: gui});

$( document ).ready(function() {

	// Initialise global objects
	global.modified = {};
	global.stagedFiles = {};
	global.windows = {};
	global.repoPaths = {};

	global.Git = Git; // Hacky - but nwjs require is broken, can't include from other directories

	global.windows.w = window.screen.availWidth;
	global.windows.h = window.screen.availHeight;

	loadAllPrevRepos();
	loadGitToolbarHandlers();

	// // To make testing easier
	// Git.setRepoPath('/home/justinting/programming/sourcetree_nw_unofficial');
	// updateEnvironment();
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
 *	Toggle whether the repo tab row is visible or not
 */
function toggleRepoTabs() {
	// Toggle whether repo tabs are visible
	$('#repo-tabs').toggle();
}

/*
 *	Check if the repo path provided is an actual git repo
 */
function isRepo(path, callback) {
	var files = fs.readdir(path, function (err, files) {
		if (files.indexOf(".git") > -1) {
			callback(true);
		} else {
			callback(false);
		}
	});
}

/*
 *	Reads text file containing all previously open repos - 
 *	and will open every one of them in separate tabs
 */
function loadAllPrevRepos() {

	return fsp.readFile('openRepoList.txt')
	.then(function (data) {
		var repos = data.toString().split("\n");
		return Promise.each(repos, function(repo) {
			if (repo.length === 0) return Promise.resolve();
			return createTab(repo);
		});
	})
	.catch(function (error) {
		winston.error('Error reading prev repo file list, or it doesn\'t yet exist: ', error, {});
	});
}

/*
 *	Given a path, create tab if appropriate
 */
function createTab(repoPath) {
	isRepo(repoPath, function(repoBool) {
		if (repoBool === true) {
			Git.setRepoPath(repoPath);

			// Add repo path to global list of paths
			var newPath = Git.addRepoPath(repoPath);

			// Add new tab with repo if it didn't exit already
			if (newPath) {
				var pathParts = repoPath.split("/");
				var repoName = 	pathParts[pathParts.length-1];
				var repoTabId = repoName + "-tab";
				var tabHTML = 	"<li id=" + repoTabId +
					"><a data-toggle=\"tab\" href=\"#\">" + 
					repoName + "</a></li>";

				// Add 'tab' (but really...) to tab list
				$('#repo-tabs').append(tabHTML);

				// Assign click functionality
				$('#' + repoTabId).click(function () {
					console.log(repoPath);
					Git.setRepoPath(repoPath);
					updateEnvironment();
				});
				$('#' + repoTabId).click();
			}
		} else {
			// TODO popup saying directory was not a valid git repository
		}
	});
}

/*
 * 	Load a git repo folder path into the global vars
 */
function loadRepo() {

	// Generate folder choosing popup
	var chooser = document.createElement('input');
	chooser.setAttribute('type', 'file');
	chooser.setAttribute('nwdirectory', 'true');
	// chooser.setAttribute('directory', 'true');
	// chooser.setAttribute('multiple', 'true');
	chooser.addEventListener('change', function (evt) {
		var repoPath = this.value;
		createTab(repoPath);
	}, false);

	chooser.click();
	return Promise.resolve();
}

/*
 * 	Attach all event listeners to commit entries
 */
function commitEventListeners() {
	winston.info('Attempting to commit all listeners');
	// var li = document.getElementsByClassName("commit-table-entries");
	var li = $('.commit-table-entries')
	.each(function() {
		$('#' + this.id).click(showCommit);
		$('#' + this.id).dblclick(commitCheckout);

		//TODO disable click for ~1 second after first click http://stackoverflow.com/questions/10593062/how-do-i-temporarily-disable-a-submit-button-for-3-seconds-onsubmit-then-re-e
		// OR - simply don't load anything if commit is already loaded (see below);
	});
	return Promise.resolve();
}

/*
 *	Checks out to a particular commit hash, detaches head
 */
function commitCheckout(e) {
	// TODO do a commit checkout here
	winston.info('Placeholder - should be checkout out to a commit here');
}

/*
 * 	Show all changes/etc. for a particular commit
 */
function showCommit(e) {
	
	// Capture output from command
	var commitHash = $(this).attr('id');

	var curCommitDetail = $('#detail-section span').attr('id');
	if (curCommitDetail === commitHash + "-code" ) {
		return Promise.resolve();
	}

	$( '#commit-details' ).html('Loading...');
	return Git.commitCodeOutput(commitHash)
	.then(function (HTMLcommitOutput) {

		var commitOutput = "<span id=" + commitHash + "-code >" + HTMLcommitOutput + "</span>";

		$( "#commit-details" ).hide().html(commitOutput).fadeIn('medium');
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
	Git.clearEnv();
	winston.info('Updating environment...');

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
		winston.info(untrackedFileList);

		var modifiedHTML = "";
		for (var file in untrackedFileList) {
			modifiedHTML += buildGitStatusFileHTML(file);
		}

		// Repopulate unstaged file list
		$('#unstaged-files-list').html(modifiedHTML);

		return Promise.resolve();
	})

	// Staged file list
	.then(function() {
		return Git.updateFilesToBeCommitted();
	})
	.then(function() {

		var filesToBeCommitted = Git.getStagedFiles();

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
	var graph = "<td>" + /*commitInfo.graph +*/ "</td>";
	var sha = "<td>" + commitInfo.sha + "</td>";
	if (commitInfo.msg.length > 100) commitInfo.msg = commitInfo.msg.substring(0,100) + '...';
	var msg = "<td>" + commitInfo.msg + "</td>";
	var author = "<td>" + commitInfo.author + "</td>";
	var date = "<td>" + commitInfo.date + "</td>";
	var listClass = " class=\'commit-table-entries\' ";
	var listId = " id=" + "\'" + commitInfo.sha + "\' ";
	var listOpen = "<tr " + listId + listClass + ">";
	var listLine = listOpen + graph + msg + date + author + sha + "</tr>";
	return listLine;
}

/*
 * 	Generate commit list from stored global repository directory
 */
function populateCommitTable() {

	//TODO do first row that is uncommitted changes (if it exists);

	/* Execute git log */
	return Git.getLog()
	.then(function (commits) {

		var full = "<tr>"+ "<th>Graph</th>" + "<th>Description</th>"+"<th>Date</th>"+"<th>Author</th>"+"<th>Commit</th>";
		var curCommit = {};

		for (var commit of commits) {
			full += generateCommitRow(commit);
		}

		/* Set the appropriate section to hold commits */
		$( '#commits' ).html(full);
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error, {});
		return Promise.reject('failed');
	});
}
