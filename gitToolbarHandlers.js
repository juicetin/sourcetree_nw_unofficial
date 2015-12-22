var winston = require('winston');

/*
 * Use top.globals.<etc> to access the global variables
 */

function factory(options) {

	var windowOptions = {
		width: 800,
		height: 600,
		frame: false,
		toolbar: false,
		resizable: false
	};

	var gui = options.gui;

	function commit() {
		winston.info('commit git toolbar button called');

		// Close window if it is already open
		if (window.top.windows.commit) {
			window.top.windows.commit.close();
		}

		// Show window
		window.top.windows.commit = gui.Window.open('commit.html', windowOptions);
	}
	
	function checkout() {
		winston.info('checkout git toolbar button called');
	
	}
	
	function reset() {
		winston.info('reset git toolbar button called');
	
	}
	
	function stash() {
		winston.info('stash git toolbar button called');
	
	}
	
	function add() {
		winston.info('add git toolbar button called');
	
	}
	
	function remove() {
		winston.info('remove git toolbar button called');
	
	}
	
	function addRemove() {
		winston.info('addRemove git toolbar button called');
	
	}
	
	function fetch() {
		winston.info('fetch git toolbar button called');
	
	}
	
	function pull() {
		winston.info('pull git toolbar button called');
	
	}
	
	function push() {
		winston.info('push git toolbar button called');
		
	}
	
	function branch() {
		winston.info('branch git toolbar button called');
	
	}
	
	function merge() {
		winston.info('merge git toolbar button called');
		
	}
	
	function tag() {
		winston.info('tag git toolbar button called');
	
	}

	return {
		commit: commit,
		checkout: checkout,
		reset: reset,
		stash: stash,
		add: add,
		remove: remove,
		addRemove: addRemove,
		fetch: fetch,
		pull: pull,
		push: push,
		branch: branch,
		merge: merge,
		tag: tag
	};
}

module.exports = factory;
