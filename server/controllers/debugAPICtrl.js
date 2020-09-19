'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */

/* Handlers */
exports.putTask = function(req, res, next) {
  var celery = celeryHelper.createHelper(res.locals.logger);

  var waitResult = toolkit.toBoolean(req.body.waitResult);
  var times      = req.body.times || 1;

  var name   = req.body.task.name;
  var args   = req.body.task.args   || [];
  var kwargs = req.body.task.kwargs || {};

  var taskOptions = req.body.task.options || {};

  if (!toolkit.isNothing(taskOptions.eta)) {
    taskOptions.eta = toolkit.getISO8601(taskOptions.eta);
  }
  if (!toolkit.isNothing(taskOptions.expires)) {
    taskOptions.expires = toolkit.getISO8601(taskOptions.expires);
  }

  if (times <= 1) {
    var callback         = null;
    var onResultCallback = null;

    if (waitResult) {
      onResultCallback = function(err, celeryRes, extraInfo) {
        if (err) return next(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        if (celeryRes.status === 'FAILURE') {
          return next(new E('ESysAsyncTaskFailed', 'Async task failed.', {
            id   : celeryRes.id,
            etype: celeryRes.result && celeryRes.result.exc_type,
            stack: celeryRes.einfoTEXT,
          }));

        } else if (extraInfo.status === 'TIMEOUT') {
          return next(new E('ESysAsyncTaskTimeout', 'Wait async task result timeout, but task is still running. Use task ID to fetch result later.', {
            id   : extraInfo.id,
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));
        }

        var ret = toolkit.initRet({
          id    : celeryRes.id,
          result: celeryRes.retval,
        });
        res.locals.sendJSON(ret);
      }

    } else {
      callback = function(err, taskId) {
        if (err) return next(err);

        var ret = toolkit.initRet({id: taskId});
        res.locals.sendJSON(ret);
      }
    }
    celery.putTask(name, args, kwargs, taskOptions, callback, onResultCallback);

  } else {
    async.times(times, function(i, nextCallback) {
      var _taskOptions = toolkit.jsonCopy(taskOptions);
      _taskOptions.id = toolkit.strf('{0}-{1}', res.locals.traceId, i);
      celery.putTask(name, args, kwargs, _taskOptions, nextCallback);

    }, function(err) {
      if (err) return next(err);

      var ret = toolkit.initRet();
      res.locals.sendJSON(ret);
    });
  }
};
