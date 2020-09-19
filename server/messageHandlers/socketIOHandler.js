'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');
var LRU   = require('lru-cache');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var socketIOServerHelper = require('../utils/extraHelpers/socketIOServerHelper');
var datafluxFuncAPICtrl = require('../controllers/datafluxFuncAPICtrl');

var AUTHED_SOCKET_IO_CLIENT_MAP = {};

var CLIENT_CONFLICT_DB_DATA_SCRIPT_LRU = new LRU({
  max   : 100,
  maxAge: 3600 * 1000,
});
var CLIENT_CONFLICT_DB_DATA_DATA_SOURCE_LRU = new LRU({
  max   : 100,
  maxAge: 3600 * 1000,
});

module.exports = function(app, server) {
  // 初始化
  app.locals.socketIO = socketIOServerHelper.createHelper(server, app.locals.logger);

  app.locals.socketIO.server.on('connection', function(socket) {
    app.locals.logger.debug('[SOCKET IO] Client connected. id=`{0}`', socket.id);

    // 欢迎消息
    socket.emit('hello', 'Welcome, please send X-Core-Stone-Auth-Token string by event `auth` for authentication.')

    // 接受认证中间件
    socket.use(function(packet, next) {
      var event       = packet[0];
      var xAuthToken  = packet[1];
      var ackCallback = packet[2];

      if (event !== 'auth') return next();

      // Socket.io 客户端发送`auth`事件时，进行认证
      if (!xAuthToken) {
        return next(new E('EClientBadRequest', 'X-Auth-Token not sent.').forSocketIO());
      }

      var xAuthTokenObj = null;
      async.series([
        // 验证JWT
        function(asyncCallback) {
          auth.verifyXAuthToken(xAuthToken, function(err, obj) {
            // 检查JWT 签名
            if (err || !obj) {
              return asyncCallback(new E('EAuthToken', 'Invalid Auth Token.').forSocketIO());
            };

            xAuthTokenObj = obj;

            return asyncCallback();
          });
        },
        // 检查认证令牌是否失效
        function(asyncCallback) {
          if (!xAuthTokenObj) return asyncCallback();

          var cacheKey = auth.getCacheKey(xAuthTokenObj);
          app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
            if (err) {
              return asyncCallback(new E('ESysCache', 'Read cache error.').forSocketIO());
            }

            if (!cacheRes) {
              // 本Auth Token 已经失效
              return asyncCallback(new E('EAuthToken', 'Auth Token expired.').forSocketIO());
            }

            // 使用 Socket.IO 认证令牌不会触发刷新
            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        AUTHED_SOCKET_IO_CLIENT_MAP[socket.id] = xAuthTokenObj;
        AUTHED_SOCKET_IO_CLIENT_MAP[socket.id].authType = 'builtin.byXAuthToken';

        var joinedRooms = [];

        function _joinRoom(room) {
          socket.join(room);
          joinedRooms.push(room);
        }

        // 加入客户端频道
        _joinRoom(socket.id);

        // 加入个人频道
        if (xAuthTokenObj.uid) {
          _joinRoom(xAuthTokenObj.uid);
        }

        // 发送应答
        var ret = toolkit.initRet({
          clientId   : socket.id,
          joinedRooms: joinedRooms,
        });
        var ackData = JSON.stringify(ret);

        if ('function' === typeof ackCallback) {
          try {
            ackCallback(ackData); // Socket.io 2.0 ACK 返回
          } catch(ex) {
            app.locals.logger.error(ex);
          }
        }
        socket.emit(event + '.ack', ackData); // 普通消息返回
      });
    });

    // 检查认证中间件
    socket.use(function(packet, next) {
      // Socket.io 客户端发送任意事件前，验证是否已登录
      var xAuthTokenObj = AUTHED_SOCKET_IO_CLIENT_MAP[socket.id];
      if (!xAuthTokenObj) {
        // 未登录则抛错
        return next(new E('ESocketIOAuth', 'Client not send X-Auth-Token yet.').forSocketIO());
      }

      async.series([
        // 检查CoreStone 认证令牌是否失效
        function(asyncCallback) {
          if (!xAuthTokenObj) return asyncCallback();

          var cacheKey = null;
          switch(xAuthTokenObj.authType) {
            case 'builtin.byXAuthToken':
              cacheKey = auth.getCacheKey(xAuthTokenObj);
              break;

            default:
              return asyncCallback(new E('EAuthToken', toolkit.strf('Unknow auth type `{0}`.', xAuthTokenObj.authType)).forSocketIO());
          }

          app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
            if (err) {
              return asyncCallback(new E('ESysCache', 'Read cache error.').forSocketIO());
            }

            if (!cacheRes) {
              // 本Auth Token 已经失效
              return asyncCallback(new E('EAuthToken', 'Auth Token expired.').forSocketIO());
            }

            // 使用 Socket.IO 认证令牌不会触发刷新
            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        return next();
      });
    });

    // 消息处理
    socket.use(function(packet, next) {
      // Socket.io 处理之前，验证Token
      var xAuthTokenObj = AUTHED_SOCKET_IO_CLIENT_MAP[socket.id];
      if (!xAuthTokenObj) {
        return next(new E('ESocketIOAuth', 'Socket.io connection gone.').forSocketIO());
      }

      var event       = packet[0];
      var data        = packet[1];
      var ackCallback = packet[2];

      // ACK标志ID
      var ackId = null;

      // 为避免混淆，Socket.io的事件必须以`socketio`开头
      var eventParts = event.split('.');
      if (eventParts[0] !== 'socketio') {
        return next(new E('ESocketIOEvent', 'Event of Socket.io must match pattern `socketio.*`').forSocketIO(ackId));
      }

      // 为统一处理，Socket.io的数据必须为JSON字符串
      try {
        data  = JSON.parse(data);
        ackId = data.ackId || undefined;

      } catch(ex) {
        return next(new E('ESocketIOData', 'Data of Socket.io must be a JSON string').forSocketIO(ackId));
      }

      var retData        = null;
      var conflictSource = null;
      async.series([
        // 消息处理
        function(asyncCallback) {
          switch(eventParts[1]) {
            case 'ping':
              retData = 'pong';
              break;

            case 'reportAndCheckClientConflict':
              switch(data.name) {
                case 'code-editor':
                  var isEditing = CLIENT_CONFLICT_DB_DATA_SCRIPT_LRU.get(data.params.id);
                  if (!isEditing) {
                    CLIENT_CONFLICT_DB_DATA_SCRIPT_LRU.set(data.params.id, true);
                  }

                  conflictSource = {name: data.name, params: 'id'};

                  break;

                case 'data-source-setup':
                  var isEditing = CLIENT_CONFLICT_DB_DATA_DATA_SOURCE_LRU.get(data.params.id);
                  if (!isEditing) {
                    CLIENT_CONFLICT_DB_DATA_DATA_SOURCE_LRU.set(data.params.id, true);
                  }

                  conflictSource = {name: data.name, params: 'id'};

                  break;

                case 'env-variable-setup':
                  conflictSource = {name: data.name, params: 'id'};
                  break;

                case 'script-set-import-history-list':
                case 'script-set-import':
                case 'script-recover-point-list':
                case 'script-recover-point-add':
                  conflictSource = {name: data.name};
                  break;
              }
              break;

            default:
              return asyncCallback(new E('ESocketIOEvent', 'Unknow event of Socket.io').forSocketIO(ackId));
          }

          return asyncCallback();
        },
        // 判断冲突
        function(asyncCallback) {
          if (!conflictSource) return asyncCallback();

          var routeTags = [];

          if (conflictSource.name) {
            routeTags.push('routeName', conflictSource.name);
          }

          if (conflictSource.params) {
            toolkit.asArray(conflictSource.params).forEach(function(p) {
              routeTags.push('routeParams.' + p, '' + data.params[p]);
            });
          }

          var routeCheckTags = toolkit.jsonCopy(routeTags);
          routeCheckTags.push('userType', '*', 'userId', '*');

          var routeCacheTags = toolkit.jsonCopy(routeTags);
          var routeUserInfo = null;
          if (xAuthTokenObj.authType === 'builtin.byXAuthToken') {
            routeUserInfo = { userType: 'builtinUser', userId: xAuthTokenObj.uid };
          } else if (xAuthTokenObj.authType === 'FT.byAdmin') {
            routeUserInfo = { userType: 'ftUser', userId: xAuthTokenObj.un };
          } else {
            routeUserInfo = { userType: 'unknowUser', userId: 'x' };
          }
          routeCacheTags.push('userType', routeUserInfo.userType, 'userId', routeUserInfo.userId);

          var routeCacheKey     = toolkit.getCacheKey('cache', 'clientConflict', routeCacheTags);
          var routeUserCacheKey = toolkit.getCacheKey('cache', 'clientConflict', routeTags);
          async.series([
            // 记录当前用户停留页面
            function(innerCallback) {
              if (data.checkOnly) return innerCallback();

              app.locals.cacheDB.setex(routeCacheKey, CONFIG._CLIENT_CONFLICT_EXPIRES, 'x', innerCallback);
            },
            // 查询所有用户停留页面，检查冲突
            function(innerCallback) {
              var routeCheckPattern = toolkit.getCacheKey('cache', 'clientConflict', routeCheckTags);
              app.locals.cacheDB.keys(routeCheckPattern, function(err, cacheRes) {
                if (err) return innerCallback(err);

                var conflictInfo = {
                  builtinUser: 0,
                  ftUser     : 0,
                  unknowUser : 0,
                  total      : 0,
                };
                var ftUsers = [];

                cacheRes.forEach(function(key) {
                  var parsedKey = toolkit.parseCacheKey(key);
                  if (!parsedKey.tags || !parsedKey.tags.userType) return;

                  // `conflictInfo`中计数不包括当前用户本身
                  if (parsedKey.tags.userType === routeUserInfo.userType && parsedKey.tags.userId === routeUserInfo.userId) return;

                  conflictInfo[parsedKey.tags.userType] += 1;
                  conflictInfo.total += 1;

                  if (parsedKey.tags.userType === 'ftUser') {
                    ftUsers.push(parsedKey.tags.userId);
                  }
                });

                retData = {
                  isCurrentUser: null,
                  isFree       : (conflictInfo.total <= 0),
                  conflictInfo : conflictInfo,
                  ftUsers      : ftUsers,
                }

                return innerCallback();
              });
            },
            // 仅判断是否为当前用户
            function(innerCallback) {
              if (!data.checkOnly) return innerCallback();

              // 获取当前占用页面的用户信息
              app.locals.cacheDB.get(routeUserCacheKey, function(err, cacheRes) {
                if (err) return innerCallback(err);

                if (!cacheRes) {
                  // 无法获取占用页面的用户信息
                  retData.isCurrentUser = false;
                  return innerCallback();
                }

                var lastRouteUserInfo = JSON.parse(cacheRes);
                if (lastRouteUserInfo.userType === routeUserInfo.userType && lastRouteUserInfo.userId === routeUserInfo.userId) {
                  // 占用此页面用户为当前用户
                  retData.isCurrentUser = true;
                } else {
                  // 页面被其他用户占用
                  retData.isCurrentUser = false;
                }

                return innerCallback();
              });
            },
            // 标记并判断是否为当前用户
            function(innerCallback) {
              if (data.checkOnly) return innerCallback();

              // 尝试设置页面占用
              app.locals.cacheDB.setexnx(routeUserCacheKey, CONFIG._CLIENT_CONFLICT_EXPIRES, JSON.stringify(routeUserInfo), function(err, cacheRes) {
                if (err) return innerCallback(err);

                if (cacheRes) {
                  // 当前用户为唯一一个占用此页面的用户
                  retData.isCurrentUser = true;
                  return innerCallback();
                }

                // 非此页面唯一用户
                app.locals.cacheDB.get(routeUserCacheKey, function(err, cacheRes) {
                  if (err) return innerCallback(err);

                  if (!cacheRes) {
                    // 无法获取占用页面的用户信息
                    retData.isCurrentUser = false;
                    return innerCallback();
                  }

                  var lastRouteUserInfo = JSON.parse(cacheRes);
                  if (lastRouteUserInfo.userType === routeUserInfo.userType && lastRouteUserInfo.userId === routeUserInfo.userId) {
                    // 占用此页面用户为当前用户
                    retData.isCurrentUser = true;
                  } else {
                    // 页面被其他用户占用
                    retData.isCurrentUser = false;
                  }

                  if (retData.isCurrentUser) {
                    // 刷新占用页面时间
                    app.locals.cacheDB.setex(routeUserCacheKey, CONFIG._CLIENT_CONFLICT_EXPIRES, JSON.stringify(routeUserInfo), innerCallback);
                  } else {
                    return innerCallback();
                  }
                });
              });
            },
          ], asyncCallback);
        },
      ], function(err) {
        if (err) return next(err);

        var ret   = toolkit.initRet(retData);
        ret.ackId = ackId;

        var ackData = JSON.stringify(ret);

        if ('function' === typeof ackCallback) {
          try {
            ackCallback(ackData); // Socket.io 2.0 ACK 返回
          } catch(ex) {
            app.locals.logger.error(ex);
          }
        }
        socket.emit(event + '.ack', ackData); // 普通消息返回
      });
    });

    // 断开连接
    socket.on('disconnect', function(reason) {
      var xAuthTokenObj = AUTHED_SOCKET_IO_CLIENT_MAP[socket.id];

      var userId = null;
      if (xAuthTokenObj) {
        userId = xAuthTokenObj.uid;
      }

      app.locals.logger.debug('[SOCKET IO] Client disconnected. id=`{0}`, userId=`{1}`, reason=`{2}`', socket.id, userId, reason);

      delete AUTHED_SOCKET_IO_CLIENT_MAP[socket.id];
    });
  });
};
