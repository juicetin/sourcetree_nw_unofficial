/*
 * 	TODO list
 *		+ deal with when a repo has no commits yet
 */

"use strict"

var gui = require('nw.gui')

var LinuxGit = require('./js/main.js')({
	$: $,
	gui: gui,
	document: document
});;

LinuxGit.start()
.then(function () {
	console.log('Linux git client started...');
});
