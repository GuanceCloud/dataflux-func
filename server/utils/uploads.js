'use strict';

/* Builtin Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-party Modules */
var Busboy = require('busboy');

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

/* Configure */
module.exports = function(options) {
  var limitSize = options.$limitSize || '5M';
  var limitByteSize = parseFloat(limitSize);

  if (!limitByteSize) {
    throw Error(toolkit.strf('uploads.js: Bad $limitSize `{0}`', limitSize));
  }

  var m = limitSize.match(/(k|kb|m|mb|g|gb)$/gi);
  if (m) {
    var unit = m[0].toLowerCase();
    switch(unit) {
      case 'k':
      case 'kb':
        limitByteSize *= 1024;
        break;

      case 'm':
      case 'mb':
        limitByteSize *= 1024 * 1024;
        break;

      case 'g':
      case 'gb':
        limitByteSize *= 1024 * 1024 * 1024;
        break;
    }
  }

  var re = /^multipart\/form-data.\s?boundary=['"]?(.*?)['"]?$/i;

  return function(req, res, next) {
    req.body  = {};
    req.files = [];

    // HACK - react-native generates FormData with an invalid boundary that might contain '/'
    // we need to wrap the boundary value with quotes to fix it
    // TODO - remove this when react-native releases the fix
    //
    // 针对iOS生成带`/`的boundary，但是没有使用引号导致无法正确接受上传文件的问题
    // `https://github.com/facebook/react-native/issues/7564`
    // `https://github.com/expressjs/multer/issues/462`

    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN uploads');
    }

    var contentType = req.get('Content-Type');
    var match = re.exec(contentType);
    if (match && match.length === 2) {
        req.headers['content-type'] = 'multipart/form-data; boundary="' + match[1] + '"';
    }

    // Parse by busboy
    var busboy = null;
    try {
      busboy = new Busboy({headers: req.headers});
    } catch(err) {
      return next(new E('EClientBadRequest', 'Content-Type not supported', {
        detail: err.toString(),
      }));
    }

    var reqUploadError = null;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      file.resume();

      // Check file-field name
      if (fieldname !== 'files') return;
      if (reqUploadError) return;

      // Check mimetype
      var isAcceptable = !options.$allowedTypes
                        || options.$allowedTypes === '*/*'
                        || options.$allowedTypes.indexOf('*/*') >= 0
                        || options.$allowedTypes.indexOf(mimetype) >= 0;
      if (!isAcceptable) {
        reqUploadError = new E('EClientBadRequest', 'File type not allowed', {
          filename      : filename,
          mimetype      : mimetype,
          acceptableType: options.$allowedTypes,
        });
        return;
      }

      var tmpFileName = toolkit.strf('{0}-{1}-{2}', Date.now(), toolkit.genRandString(6), filename);
      var fileInfo = {
        fieldname   : fieldname,
        originalname: filename,
        filename    : tmpFileName,
        encoding    : encoding,
        mimetype    : mimetype,
        size        : 0,
        data        : null,
      }

      file.on('error', function(err) {
        reqUploadError = err;
      });

      file.on('data', function(chunk) {
        fileInfo.size += chunk.length;
        fileInfo.data = fileInfo.data
                      ? fileInfo.data.concat(chunk)
                      : chunk;
      });

      file.on('end', function() {
        if (fileInfo.size > limitByteSize) {
          reqUploadError = new E('EClientBadRequest', 'File is too large', {
            filename : filename,
            size     : fileInfo.size,
            limitSize: limitByteSize,
          });
        }
      });

      // Collect files info
      req.files.push(fileInfo);
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      req.body[fieldname] = val;
    });

    busboy.on('finish', function() {
      if (reqUploadError) {
        res.locals.reqUploadError = reqUploadError;
      }

      // Skip request error here, throw later
      return next();
    });

    busboy.end(req.rawData);
  }
};
