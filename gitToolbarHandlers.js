var winston = require('winston');

function commit() {
	winston.info('commit git toolbar button called');
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

module.exports = {
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
