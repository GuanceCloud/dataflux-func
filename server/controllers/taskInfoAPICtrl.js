'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');
var JSZip = require('jszip');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var funcMod = require('../models/funcMod');

/* Configure */

/* Handlers */
exports.list = function(req, res, next) {
  var originId = req.params.originId;

  var queryOpt = res.locals.getQueryOptions();

  var filters = queryOpt.filters;
  var paging  = res.locals.paging;

  var cacheKey = toolkit.getWorkerCacheKey('syncCache', 'taskInfo', [ 'originId', originId ]);

  var start = paging.pageIndex;
  var stop  = start + paging.pageSize;

  var rawTaskInfo      = [];
  var allTaskInfo      = [];
  var matchedTaskInfo  = [];
  var retTaskInfo      = [];
  var taskInfoPageInfo = [];

  async.series([
    // 获取所有数据
    function(asyncCallback) {
      res.locals.cacheDB.lrange(cacheKey, 0, -1, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        rawTaskInfo = cacheRes;

        return asyncCallback()
      });
    },
    // 解压所有数据
    function(asyncCallback) {
      async.eachSeries(rawTaskInfo, function(zipB64, eachCallback) {
        var zipBuf = toolkit.fromBase64(zipB64, true);

        JSZip.loadAsync(zipBuf)
        .then(function(z) {
          return z.file('task-info.log').async('string');
        })
        .then(function(zipData) {
          allTaskInfo.push(JSON.parse(zipData));
          return eachCallback();
        })
        .catch(function(err) {
          // 解析失败不返回
          res.locals.logger.logError(err);
          return eachCallback();
        });
      }, asyncCallback);
    },
    // 过滤/分页并补充函数信息
    function(asyncCallback) {
      // 过滤
      matchedTaskInfo = allTaskInfo.filter(function(d) {
        for (var f in filters) {
          if (f === '_fuzzySearch') {
            // 模糊搜索
            var searchKeys  = filters[f].keys;
            var searchValue = filters[f].value;

            var isMatched = false;
            for (var i = 0; i < searchKeys.length; i++) {
              var _key = searchKeys[i];
              if ((d[_key] || '').indexOf(searchValue) >= 0) {
                isMatched = true;
                break
              }
            }
            if (!isMatched) return false;

          } else {
            // 普通过滤器
            for (var op in filters[f]) {
              if (f === 'rootTaskId') {
                // 特殊业务处理
                if (d[f] === filters[f][op]) {
                  // 直接符合
                } else if (d[f] === 'ROOT' && d.id === filters[f][op]) {
                  // 查询子任务时包含主任务
                } else {
                  return false;
                }

              } else {
                // 通用处理
                var isMatched = toolkit.runCompare(d[f], op, filters[f][op]);
                if (!isMatched) return false;
              }
            }
          }
        }
        return true;
      });

      // 处理翻页
      var _start = paging.pageSize * (paging.pageNumber - 1);
      var _stop  = _start + paging.pageSize;
      retTaskInfo = matchedTaskInfo.slice(_start, _stop);

      taskInfoPageInfo = {
        count      : retTaskInfo.length,
        totalCount : matchedTaskInfo.length,
        pageCount  : Math.ceil(matchedTaskInfo.length / paging.pageSize),
        pagingStyle: paging.pagingStyle,
        pageSize   : paging.pageSize,
        pageNumber : paging.pageNumber,
        isFirstPage: paging.pageNumber <= 1,
      }

      // 搜集函数ID
      var funcIds = retTaskInfo.reduce(function(acc, x) {
        acc.push(x.funcId);
        return acc;
      }, []);

      if (toolkit.isNothing(funcIds)) return asyncCallback();

      // 补充子任务数量
      var _subTaskCountMap = allTaskInfo.reduce(function(acc, x) {
        if (x.rootTaskId === 'ROOT') return acc;
        acc[x.rootTaskId] = (acc[x.rootTaskId] || 0) + 1;
        return acc;
      }, {});

      // 补充函数信息
      var funcModel = funcMod.createModel(res.locals);

      var opt = {
        fields : [ 'id', 'title', 'name' ],
        filters: { id: { in: funcIds } },
        orders : [ { field: 'seq', method: 'ASC' } ],
      }
      funcModel._list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _funcMap = dbRes.reduce(function(acc, x) {
          acc[x.id] = x;
          return acc;
        }, {});

        // 填入子任务数量/函数信息
        retTaskInfo.forEach(function(d) {
          var func = _funcMap[d.funcId];
          if (func) {
            d.func_title = func.title;
            d.func_name  = func.name;
          }

          d.subTaskCount = _subTaskCountMap[d.id] || 0;
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(retTaskInfo, taskInfoPageInfo);
    return res.locals.sendJSON(ret);
  })
};

exports.clear = function(req, res, next) {
  var originId = req.params.originId;

  var cacheKey = toolkit.getWorkerCacheKey('syncCache', 'taskInfo', [ 'originId', originId ]);
  res.locals.cacheDB.delete(cacheKey, function(err, cacheRes) {
    if (err) return next(err);

    res.locals.sendJSON();
  });
};
