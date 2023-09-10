'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */

/* Project Modules */

var DEFAULT_FAVICON_PATH = path.join(__dirname, '../statics/favicon.ico');

module.exports = function(req, res, next) {
  var keys = [ 'CUSTOM_FAVICON_ENABLED', 'CUSTOM_FAVICON_IMAGE_SRC' ];
  res.locals.getSystemSettings(keys, function(err, systemSettings) {
    if (err) return next(err);

    if (!systemSettings.CUSTOM_FAVICON_ENABLED
      || !systemSettings.CUSTOM_FAVICON_IMAGE_SRC) {
      // 未配置网站图标时，使用默认
      return res.sendFile(DEFAULT_FAVICON_PATH);

    } else {
      // 指定网站图标后，返回数据
      return res.send(systemSettings.CUSTOM_FAVICON_IMAGE_SRC);
    }
  });
};
