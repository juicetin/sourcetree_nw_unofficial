// Check for the various File API support.
// if (window.File && window.FileReader && window.FileList && window.Blob) {
// 	console.log('All browser file APIs supported!');
// 	
// } else {
// 	console.log('Not all browser file APIs supported...');
// }

// var gui; 
// // In NWjs
// if (global && global.window && global.window.nwDispatcher) {
// 	gui = global.window.nwDispatcher.requireNwGui();
// 	fs = require('fs');
// } 
// 
// // In Chrome
// else {
// 	var BrowserFS = require('browserfs/dist/node/main');
// 	BrowserFS.initialize(new BrowserFS.FileSystem.LocalStorage());
// 	console.log('In browser');
// 	
// 	fs = require('browserfs/dist/node/core/node_fs.js');
// 	fs.readFile('./index.js', function(err, contents) {
// 	  console.log(contents.toString());
// 	});
// 
// }
// 

var winston = require('winston');
var rp = require('request-promise');
var gui = global.window.nwDispatcher.requireNwGui();
var fsp;

/*
 *	Determine Chrome or NWjs to decide whether to use
 *		fs-server or actual fsp
 */
try {
	// In NWjs
	if (typeof global !== undefined && global.window && global.window.nwDispatcher) {
		fsp = require('fs-promise');
	}
} catch (e) {
	// In Chrome
	
	// TODO move into config later as appropriate
	var baseUri = 'http://127.0.0.1:3312/';
	var options = {
		uri: '',
		qs: {
		},
		method: 'GET'
	};

	var fsp = {};

	// Returns empty promise on write
	fsp.writeFile = function(path, repos) {
		options.uri = baseUri + 'writeFile';
		options.qs = {
			path: path,
			repos: repos
		};
		return rp(options);
	};

	// Returns list of files/dirs
	fsp.readdir = function(path) {
		options.uri = baseUri + 'readdir';
		options.qs = {
			path: path
		};
		return rp(options);
	};
	
	// Return raw file content (don't convert to string)
	fsp.readFile = function(path) {
		options.uri = baseUri + 'readFile';
		options.qs = {
			path: path
		};
		return rp(options);
	};
}

var LinuxGit = require('./js/main.js')({
	$: $,
	gui: gui,
	document: document,
	fsp: fsp
});;

LinuxGit.start()
.then(function () {
	winston.info('Linux git client started...');
});

