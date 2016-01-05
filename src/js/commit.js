"use strict"

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
		test();
	});
}

function test() {
	var txt = $('#commit-message').val();
	$('#herpy').html(txt);
}
