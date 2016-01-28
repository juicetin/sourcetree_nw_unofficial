var express = require('express');
var fsp = require('fs-promise');

var app = express();

var relativePath = '../../';
function getRelativePath (path) {
	return relativePath + path;
}

app.get('/', function (req, res, next) {
	console.log('Yay!');
	res.json({});
});

app.get('/writeFile', function (req, res, next) {
	var path = getRelativePath(req.query.path);
	var repos = req.query.repos;
	return fsp.writeFile(path, repos);
});

app.get('/readdir', function (req, res, next) {
	var path = getRelativePath(req.query.path);
	return fsp.readdir(path);
});

app.get('/readFile', function (req, res, next) {
	var path = getRelativePath(req.query.path);
	return fsp.readFile(path);
});

app.listen(3312, function () {
	console.log('FS-server started...');
});
