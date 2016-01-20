/*
 * 	TODO list
 *		+ deal with when a repo has no commits yet
 */

"use strict"

var gui = require('nw.gui')
var winston = require('winston');

var LinuxGit = require('./js/main.js')({
	$: $,
	gui: gui,
	document: document
});;

LinuxGit.start()
.then(function () {
	winston.info('Linux git client started...');
});
