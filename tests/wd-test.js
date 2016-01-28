var wd = require('wd');
var nw = require('nw');

var nwCmd = nw.findpath();
var browser = wd.remote();
browser.init({
	browserName: 'chrome',
	chromeOptions: {
		binary: nwCmd
	}
});
