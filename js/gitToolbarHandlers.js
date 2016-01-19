var winston = require('winston');

/*
 * Use top.global.herps.<etc> to access the global.herp variables
 */

/*
 * commands
 * git reset HEAD <filename> - unstages a file for the upcoming commit
 * git diff --staged --name-only - lists (new since last commit) staged files, name only
 * git diff --staged - lists staged files with all changes
 */

function factory(options) {

	var Git = global.Git;

	// Default options for each secondary window
	var windowOptions = {
		width: 800,
		height: 600,
		toolbar: false,
		resizable: false
	};

	// NW GUI object to create new windows
	var gui = options.gui;

	/*
	 *	Create commit window
	 */
	function commit() {
		// winston.info(global.herp.stagedFiles);
		winston.info('commit git toolbar button called');

		// Close window if it is already open
		if (global.windows.commit) {
			global.windows.commit.close();
		}

		// Show window
		global.windows.commit = gui.Window.open('html/commit.html', windowOptions);
	}
	
	/*
	 *	Create checkout window
	 */
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
	
	/*
	 *	Create pull window
	 */
	function pull() {
		winston.info('pull git toolbar button called');
	
	}
	
	/*
	 *	Create push window
	 */
	function push() {
		winston.info('push git toolbar button called');

		if (global.windows.push) {
			global.windows.push.close();
		}

		global.windows.push = gui.Window.open('./src/screens/push.html', windowOptions);
	}
	
	/*
	 *	Create branch window
	 */
	function branch() {
		winston.info('branch git toolbar button called');
	
	}
	
	/*
	 *	Create merge window
	 */
	function merge() {
		winston.info('merge git toolbar button called');
		
	}
	
	function tag() {
		winston.info('tag git toolbar button called');
	
	}

	function checkLiveRepo(func) {
		return func;
		// winston.info('Checking for a repo path...', Git.getRepoPath(), {});
		// if (Git.getRepoPath()) {
		// 	return func;
		// }
	}

	return {
		commit: checkLiveRepo(commit),
		checkout: checkLiveRepo(checkout),
		reset: checkLiveRepo(reset),
		stash: checkLiveRepo(stash),
		add: checkLiveRepo(add),
		remove: checkLiveRepo(remove),
		addRemove: checkLiveRepo(addRemove),
		fetch: checkLiveRepo(fetch),
		pull: checkLiveRepo(pull),
		push: checkLiveRepo(push),
		branch: checkLiveRepo(branch),
		merge: checkLiveRepo(merge),
		tag: checkLiveRepo(tag)
	};
}

module.exports = factory;
