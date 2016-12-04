var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

var fs = require('fs-extra');
var existsAsync = Promise.promisify(fs.stat);
var outputFileAsync = Promise.promisify(fs.outputFile);
var ensureDirAsync = Promise.promisify(fs.ensureDir);
var removeAsync = Promise.promisify(fs.remove);

var supportedOptions = [ 'directory', 'filenameFilter', 'textFilter' ];

function FSAdapter (options) {
	var self = this;

	self.loadedResources = [];  // Array of loaded Resources

	self.options = _.pick(options, supportedOptions);

	if (self.options.directory) {
		self.absoluteDirectoryPath = path.resolve(process.cwd(), self.options.directory);
	}
}

FSAdapter.prototype.validateDirectory = function validateDirectory () {
	var self = this;
	if (_.isEmpty(self.options.directory) || !_.isString(self.options.directory)) {
		return Promise.reject(new Error('Incorrect directory ' + self.options.directory));
	}

	return existsAsync(self.absoluteDirectoryPath).then(function handleDirectoryExist () {
		return Promise.reject(new Error('Directory ' + self.absoluteDirectoryPath + ' exists'));
	}, function handleDirectoryNotExist () {
		return Promise.resolve();
	});
};

FSAdapter.prototype.createDirectory = function createDirectory () {
	return ensureDirAsync(this.absoluteDirectoryPath);
};

FSAdapter.prototype.cleanDirectory = function cleanDirectory () {
	if (!_.isEmpty(this.loadedResources)) {
		return removeAsync(this.absoluteDirectoryPath);
	}
	return Promise.resolve();
};

FSAdapter.prototype.saveResource = function saveResource (resource) {
	var self = this;

	var filename = path.join(self.absoluteDirectoryPath, self.options.filenameFilter(resource.getFilename()));
	var text = self.options.textFilter(resource.getText());
	return outputFileAsync(filename, text, { encoding: 'binary' }).then(function resourceSaved () {
		self.loadedResources.push(resource);
	});
};

module.exports = FSAdapter;
