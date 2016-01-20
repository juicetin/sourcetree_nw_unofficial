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
	for (var stagedFile in Git.getStagedFiles()) {
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
		return Git.commit(commitMessage)
		.then(function (stdOutput) {
			$('#herpy').html(stdOutput);
		})
	});
}
