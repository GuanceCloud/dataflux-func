'use strict';

/* Build-in Modules */
var os   = require('os');
var path = require('path');

/* 3rd-part Modules */
var fs     = require('fs-extra');
var multer = require('multer');
var moment = require('moment-timezone');

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

/* Init */
var UPLOAD_TEMP_FOLDER    = path.join(CONFIG.RESOURCE_ROOT_PATH, CONFIG.UPLOAD_TEMP_ROOT_FOLDER);
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
      var now = Date.now() + CONFIG._UPLOAD_FILE_EXPIRES * 1000;

      // 文件保存路径为：<上传临时目录>/<日期时间>_<随机数>_<原文件名>
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      var tmpFilename = toolkit.strf('{0}_{1}_{2}', moment(now).format('YYYYMMDDHHmmss'), toolkit.genRandString(16), file.originalname);

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
