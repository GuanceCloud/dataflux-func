'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */
var fs = require('fs-extra');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

/**
 * @constructor
 *
 * @param  {Object} [logger=null]
 * @param  {Object} [config=CONFIG.fileSystem]
 * @return {Object} - File System Storage Helper
 */
var FileSystemHelper = function(logger, config) {
  var self = this;
  self.isDryRun = false;

  self.logger = logger || logHelper.createHelper();

  if (config) {
    self.config = toolkit.noNullOrWhiteSpace(config);
  } else {
    self.config = toolkit.noNullOrWhiteSpace({
      rootFolder: CONFIG._FILE_STORE_ROOT_DIR,
    });
  }

  self.rootFolder = path.join(__dirname, '../../..', self.config.rootFolder);
};

/**
 * Upload file
 *
 * @param  {String}   uploadPath
 * @param  {Object}   buffer
 * @param  {Function} callback
 * @return {undefined}
 */
FileSystemHelper.prototype.upload = function(uploadPath, buffer, callback) {
  var self = this;

  if (self.isDryRun) return callback();

  if (buffer.length === 0) {
    return callback(null);
  }

  uploadPath = path.join(this.rootFolder, uploadPath);
  fs.outputFile(uploadPath, buffer, function(err) {
    self.logger.debug('[FS] Upload `{0}`, Length: {1}', uploadPath, (buffer ? buffer.length : 0));
    return callback(err);
  });
};

/**
 * Download file
 *
 * @param  {String}   uploadPath
 * @param  {Function} callback
 * @return {undefined}
 */
FileSystemHelper.prototype.download = function(uploadPath, callback) {
  var self = this;

  uploadPath = path.join(this.rootFolder, uploadPath);
  fs.readFile(uploadPath, function(err, buffer) {
    self.logger.debug('[FS] Download `{0}`, Length: {1}', uploadPath, (buffer ? buffer.length : 0));
    return callback(err, buffer);
  });
};

/**
 * Get external download URL
 *
 * @param  {String} uploadPath
 * @param  {Number} expire
 * @return {String} url
 */
FileSystemHelper.prototype.getExternalDownloadURL = function() {
  return null;
};

/**
 * Delete file
 *
 * @param  {String}   uploadPath
 * @param  {Function} callback
 * @return {undefined}
 */
FileSystemHelper.prototype.delete = function(uploadPath, callback) {
  var self = this;

  uploadPath = path.join(this.rootFolder, uploadPath);

  self.logger.debug('[FS] Delete `{0}`', uploadPath);

  if (self.isDryRun) return callback();

  fs.remove(uploadPath, function(err) {
    self.logger.debug('[FS] Deleted `{0}`', uploadPath);
    return callback(err);
  });
};

/**
 * Delete folder
 *
 * @param  {String}   folderPath
 * @param  {Function} callback
 * @return {undefined}
 */
FileSystemHelper.prototype.deleteFolder = function(folderPath, callback) {
  var self = this;

  folderPath = path.join(this.rootFolder, folderPath, './');

  self.logger.debug('[FS] Delete folder `{0}`', folderPath);

  return callback();
  if (self.isDryRun) return callback();

  fs.remove(folderPath, function(err) {
    self.logger.debug('[FS] Deleted folder `{0}`', folderPath);
    return callback(err);
  });
};

exports.FileSystemHelper = FileSystemHelper;
exports.createHelper = function(logger, config) {
  return new FileSystemHelper(logger, config);
};
