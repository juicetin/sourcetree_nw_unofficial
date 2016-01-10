"use strict"

var Git = global.Git;

$(document).ready(function() {
});

/*
 * 	Register event to clicking the push button
 */
function registerPushBtn() {
	$('#push-btn').cilck(function() {
		return Git.push()
		.then(function (message) {
			$('#message').html(message);
			return Promise.resolve();
		});
	});

}
