'use strict';

/* Builtin Modules */

/* 3rd-party Modules */

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */
exports.send = function(req, res, payload, options, callback) {
  var celery = celeryHelper.createHelper(res.locals.logger);

  var akId = null;
  if (res.locals.authType === 'builtin.byAccessKey') {
    akId = res.locals.authId;
  }

  // Send Celery task
  var task       = 'webhook.onEvent';
  var taskArgs   = null;
  var taskKwargs = {
    akId   : akId          || null,
    event  : payload.event || null,
    data   : payload.data  || null,
    from   : payload.from  || null,
    options: options       || null,
  };
  celery.putTask(task, taskArgs, taskKwargs, null, function(err, taskId) {
    if (err) {
      res.locals.logger.logError(err);
    } else {
      res.locals.logger.debug('[WEBHOOK] {0}', payload.event);
    }

    // Will not stop even error occured.
    return callback && callback();
  });
};
