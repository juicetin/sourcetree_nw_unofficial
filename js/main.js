"use strict"
function factory (options) {

	class Commit {
		constructor(commitProperties) {
			this.sha = commitProperties.sha;
			this.author = commitProperties.author;
			this.date = commitProperties.date;
			this.msg = commitProperties.msg;
			this.merge = commitProperties.merge;
		}
	}

	/*
	 *	Options passed from index
	 *	Elements that must be determined/only
	 *	accessible from the top level/included
	 *	in html file level
	 */
	var $ = options.$;
	var gui = options.gui;
	var document = options.document;
	var fsp = options.fsp;

	var win = gui.Window.get();
	
	var winston = require('winston');
	var hl = require('highlight').Highlight;
	var Set = require('collections/set');
	
	var Promise = require('bluebird');
	
	var Git = require('./git.js');
	
	var gitToolbarHandlersFactory = require('./gitToolbarHandlers.js'); //({gui: gui});
	var gitToolbarHandlers;

	var functions = {};

	var WindowProps = {};

	/*
	 *	All functions needed to start the app
	 */
	functions.start = function() {
		$( document ).ready(function() {
		
			// Initialise global objects
			//global.windows = {};
			WindowProps.windows = {};
		
			global.Git = Git; // Hacky - but nwjs require is broken, can't include from other directories
		
			WindowProps.mainWidth = window.screen.availWidth;
			WindowProps.mainHeight = window.screen.availHeight;

			gitToolbarHandlers = gitToolbarHandlersFactory({
				gui: gui,
				WindowProps: WindowProps
			});
			// global.windows.w = window.screen.availWidth;
			// global.windows.h = window.screen.availHeight;
		
			loadRepoButtonHandler();
			loadAllPrevRepos();
			loadGitToolbarHandlers();

			catchWindowClose();
		});
		return Promise.resolve();
	}

	functions.test = function () {
		var gitToolbarButtons = $('.git-toolbar-btn').toArray();
		gitToolbarButtons.forEach(function (btn) {
			winston.info('id of button is', btn.id);
		});
	}

	/*
	 *	Load repo loader button
	 */
	function loadRepoButtonHandler() {
		$('#load-repo').click(function() {
			loadRepo();
		});
	}

	/*
	 *	Catch window close event
	 */
	function catchWindowClose() {
		// NWJS' window close event handler
		win.on('close', function () {

			// Hide window to give illusion of ended process
			win.hide();
			winston.info('CLOSING WINDOW NOW');

			return saveOpenTabs()
			.then(function () {
				win.close(true);
			});
		});
	};

	/*
	 *	Write session's open repo tabs to session file
	 */
	function saveOpenTabs() {
		// Iterate through session's open repo tabs
		var tabs = $('#repo-tabs li').toArray();
		var repos = "";
		tabs.forEach(function (tab) {
			repos += tab.id + "\n";
		});

		// Write contents to file
		var path = "config/openRepoList.txt";
		return fsp.writeFile(path, repos)
		.catch(function (error) {
			winston.error('Couldn\'t write open tabs to session file: ', error, {});
		});
	}


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
	function isRepo(path) {
		// var files = fs.readdir(path, function (err, files) {
		// 	if (files.indexOf(".git") > -1) {
		// 		callback(true);
		// 	} else {
		// 		callback(false);
		// 	}
		// });

		return fsp.readdir(path)
		.then(function (files) {
			if (files.indexOf(".git") > -1) {
				return true;
			} else {
				return false;
			}
		})
		.catch(function (error) {
			winston.info('isRepo check error: ', error, {});
		});
	}

	/*
	 *	Reads text file containing all previously open repos - 
	 *	and will open every one of them in separate tabs
	 */
	function loadAllPrevRepos() {

		return fsp.readFile('config/openRepoList.txt')
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

		return isRepo(repoPath)
		.then(function (repoBool) {
			if (repoBool === true) {
				Git.setRepoPath(repoPath);

				// Add repo path to global list of paths
				var newPath = Git.addRepoPath(repoPath);

				// Add new tab with repo if it didn't exit already
				if (newPath) {
					var pathParts = repoPath.split('/');
					var repoName = 	pathParts[pathParts.length-1];
					var tabHTML = 	"<li id=" + repoPath +
						"><a data-toggle=\"tab\" href=\"#\">" + 
						repoName + "</a></li>";

					// Add 'tab' (but really...) to tab list
					$('#repo-tabs').append(tabHTML);

					// Assign click functionality
					$(jqID(repoPath)).click(function () {
						Git.setRepoPath(repoPath);
						updateEnvironment();
					});
					$(jqID(repoPath)).click();
				}
			} else {
				// TODO popup saying directory was not a valid git repository
			}
		});

		// isRepo(repoPath, function(repoBool) {
		// 	if (repoBool === true) {
		// 		Git.setRepoPath(repoPath);

		// 		// Add repo path to global list of paths
		// 		var newPath = Git.addRepoPath(repoPath);

		// 		// Add new tab with repo if it didn't exit already
		// 		if (newPath) {
		// 			var pathParts = repoPath.split('/');
		// 			var repoName = 	pathParts[pathParts.length-1];
		// 			var tabHTML = 	"<li id=" + repoPath +
		// 				"><a data-toggle=\"tab\" href=\"#\">" + 
		// 				repoName + "</a></li>";

		// 			// Add 'tab' (but really...) to tab list
		// 			$('#repo-tabs').append(tabHTML);

		// 			// Assign click functionality
		// 			$(jqID(repoPath)).click(function () {
		// 				Git.setRepoPath(repoPath);
		// 				updateEnvironment();
		// 			});
		// 			$(jqID(repoPath)).click();
		// 		}
		// 	} else {
		// 		// TODO popup saying directory was not a valid git repository
		// 	}
		// });
	}

	function jqID(otherwiseIllegalString) {
		return '[id="' + otherwiseIllegalString + '"]';
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
		$('#commit-details').html('');
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

	/*
	 *	Replace path slashes with ;;
	 */
	
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
			"\" type=\"checkbox\" ";

		if (setupStagedFiles) {
			html += " class=\"staged-files\" ";
		} else {
			html += " class=\"unstaged-files\" ";
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
				$('#' + element.id).change(function() {
					toggleFileCheckbox(element);
				});
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
				$('#' + escapePeriods(element.id)).change(function() {
					return toggleFileCheckbox(element);
				});
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
			$('#unstaged-files-list input').toArray().forEach(function (item) {
				$(jqID(item.id)).change(function () {
					toggleFileCheckbox(item);
				});
			});
	
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
			$('#staged-files-list input').toArray().forEach(function (item) {
				$(jqID(item)).change(function () {
					toggleFileCheckbox(item);
				});
			});
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
		console.log(listLine);
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

	return functions;
}

module.exports = factory;
