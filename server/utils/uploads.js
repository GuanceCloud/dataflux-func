'use strict';

/* Build-in Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-part Modules */
var multer = require('multer');

/* Project Modules */
var E       = require('./serverError');
var toolkit = require('./toolkit');

/* Configure */
var UPLOAD_TEMP_FOLDER    = '/tmp/uploads';
var MULTIPART_BOUNDARY_RE = /^multipart\/form-data.\s?boundary=['"]?(.*?)['"]?$/i;

module.exports = function(options) {
  // 准备文件上传参数
  var limitByteSize = null;

  if (options.$limitSize) {
    limitByteSize = toolkit.toBytes(options.$limitSize);
  }

  // 初始化上传文件中间件参数
  var storage = multer.diskStorage({
    destination: UPLOAD_TEMP_FOLDER,
    filename: function (req, file, callback) {
      var tmpFilename = toolkit.strf('{0}-{1}-{2}', Date.now(), toolkit.genRandString(6), file.originalname)
      return callback(null, tmpFilename);
    }
  })
  var opt = {
    storage: storage,
    limits: {
      fileSize : limitByteSize,
      fieldSize: limitByteSize,
    },
  };

  // 返回中间件
  return function(req, res, next) {
    // HACK - react-native generates FormData with an invalid boundary that might contain '/'
    // we need to wrap the boundary value with quotes to fix it
    // TODO - remove this when react-native releases the fix
    //
    // 针对iOS生成带`/`的boundary，但是没有使用引号导致无法正确接受上传文件的问题
    // `https://github.com/facebook/react-native/issues/7564`
    // `https://github.com/expressjs/multer/issues/462`
    var contentType = req.headers['content-type'];
    var match = MULTIPART_BOUNDARY_RE.exec(contentType);
    if (match && match.length === 2) {
        req.headers['content-type'] = 'multipart/form-data; boundary="' + match[1] + '"';
    }

    multer(opt).any()(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        // Multer错误转换为通用错误
        err = new E('EClientBadRequest', 'Uploading file failed', {
          message: err.message,
        });
      }

      return next(err);
    });
  }
};
