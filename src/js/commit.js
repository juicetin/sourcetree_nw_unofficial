"use strict"

var Git = global.Git;

$(document).ready(function() {
	showFiles();
	registerCommitBtn();
});

/*
 *	Show files in their status categories
 */
function showFiles() {
	var full = "";
	for (var stagedFile in global.stagedFiles) {
		full += stagedFile + "<br>";
	}
	
	$('#staged-files').html(full);
}

/*
 *	Register event to clicking the commit button
 */
function registerCommitBtn() {
	$('#commit-btn').click(function() {
		var commitMessage = $('#commit-message').val();
		Git.commit(commitMessage);
	});
}

function test() {
	var commitMessage = $('#commit-message').val();
	$('#herpy').html(txt);
	Git.commit();
}
