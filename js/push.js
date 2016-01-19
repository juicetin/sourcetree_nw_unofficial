"use strict"

var Git = global.Git;

$(document).ready(function() {
	registerPushBtn();
});

/*
 * 	Register event to clicking the push button
 */
function registerPushBtn() {
	$('#push-btn').click(function() {
		return Git.push()
		.then(function (message) {
			$('#message').html(message);
			return Promise.resolve();
		});
	});

}
