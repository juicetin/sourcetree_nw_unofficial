// "use strict"

// class Commit {
// 	constructor(sha, author, date, msg) {
// 		this.sha = sha;
// 		this.author = author;
// 		this.date = date;
// 		this.msg = msg;
// 	}
// }

var winston = require('winston');

var fs = require('fs');
var exec = require('child-process-promise').exec;
var Promise = require('bluebird');

var globals = {};

function loadRepo() {
	return loadFolder()
	.then(function () {
		return checkIfRepo();
	})
	.then(function (isRepo) {
		if (isRepo) {
			console.log('is repo');
		} else {
			console.log('isnt repo');
		}
		return Promise.resolve();
	});
}

function loadFolder() {
	var chooser = document.createElement('input');
	var unprocessedFolderSelectionString;
	chooser.setAttribute('type', 'file');
	chooser.setAttribute('nwdirectory', 'true');
	chooser.addEventListener('change', function (evt) {
		globals.repoPath= this.value;
		globals.repoGitPath = globals.repoPath + '/.git/';
		globals.folderSelecting = false;
	}, false);

	chooser.click();
	return Promise.resolve();
}

function checkIfRepo () {
	var stuff = fs.readdir(globals.repoPath, function(err, files) {
		if (err) {
			console.log(err);
			return Promise.resolve(false);
		} 

		for (var file of files) {
			if (file === '.git') {
				console.log(globals.repoPath, ' does contain a repo');
				return Promise.resolve(true);
			}
		}
	});
	return Promise.resolve(stuff);
}

function getGitContent() {
	var stuff = fs.readdir(globals.repoGitPath, function(err, files) {
		if (err) {
			console.log('error reading path');
			return Promise.resolve(false);
		}

		var fileString = '';

		console.log('found files');
		for (var file of files) {
			console.log(file);
			fileString += '<p>' + file;
		}
		document.getElementById("filecontents").innerHTML = fileString;
	});
	return Promise.resolve(stuff);
}

function commitEventListeners() {
	winston.info('Attempting to commit all listeners');
	var li = document.getElementsByTagName("li");
	
	winston.info('There are ', li.length, ' commits in the repository.');
	for (var i = 0; i < li.length; ++i) {
		li[i].addEventListener("click", showCommit);
	}

	return Promise.resolve();
}

function showCommit(e) {
	var commitHash = e.target.attributes.id.value;
	var command = 'git --git-dir=' + globals.repoGitPath + ' show ' + commitHash;
	return exec(command, {maxBuffer: 1024 * 1024 * 1024})
	.then(function (result) {
		var stdout = result.stdout;
		var stderr = result.stderr;

		//return Promise.resolve(alert(stdout));
		
		document.getElementById("commit-details").innerHTML = stdout;
		return Promise.resolve();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error);
		return Promise.reject('failed');
	});
	// alert(e.target.attributes.id.value);
	// return Promise.resolve();
}

function getGitGraph() {

	/* Execute git log */
	var command = 'git --git-dir=' + globals.repoGitPath + ' log';
	return exec(command)
	.then(function (result) {

		/* Capture console output */
		var stdout = result.stdout;
		var stderr = result.stderr;
		
		var stdoutParts = stdout.split("\n");
		var full = "";

		/* Retain only lines stating commit hash */
		for (var line of stdoutParts) {
			if (line.indexOf("commit") === 0) {
				var commitHash = line.split(" ")[1].substring(0,6);

				// TODO add clickable for each commit (to do various actions)
				var listId = "id=" + "\"" + commitHash + "\" ";
				var listOpen = "<li " + listId +  ">";
				listLine = listOpen + line + "</li>";
				full += listLine;
			}
		}

		/* Set the appropriate section to hold commits */
		document.getElementById("commits").innerHTML = full;
		// $("commits").innerHTML = full;
		return commitEventListeners();
	})
	.fail(function (error) {
		winston.error('ERROR: ', error);
		return Promise.reject('failed');
	});
}
