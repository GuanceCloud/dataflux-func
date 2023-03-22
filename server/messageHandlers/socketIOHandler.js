'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var socketIOServerHelper = require('../utils/extraHelpers/socketIOServerHelper');
var mainAPICtrl = require('../controllers/mainAPICtrl');

var AUTHED_SOCKET_IO_CLIENT_MAP = {};

module.exports = function(app, server) {
  // 初始化
  var socketIO = socketIOServerHelper.createHelper(server, app.locals.logger);

  socketIO.server.on('connection', function(socket) {
    app.locals.logger.debug('[SOCKET IO] Client connected. id=`{0}`', socket.id);

    // 欢迎消息
    socket.emit('hello', 'Welcome, please send X-Auth-Token string by event `auth` for authentication.')

    // 接受认证中间件
    socket.use(function(packet, next) {
      var event        = packet[0];
      var xAuthToken   = packet[1];
      var respCallback = packet[2];

      if (event !== 'auth') return next();

      // Socket.io 客户端发送`auth`事件时，进行认证
      if (!xAuthToken) {
        return next(new E('EClientBadRequest', 'X-Auth-Token not sent').forSocketIO());
      }

      var xAuthTokenObj = null;
      async.series([
        // 验证JWT
        function(asyncCallback) {
          auth.verifyXAuthToken(xAuthToken, function(err, obj) {
            // 检查JWT 签名
            if (err || !obj) {
              return asyncCallback(new E('EAuthToken', 'Invalid Auth Token').forSocketIO());
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
              return asyncCallback(new E('ESysCache', 'Read cache error').forSocketIO());
            }

            if (!cacheRes) {
              // 本Auth Token 已经失效
              return asyncCallback(new E('EAuthToken', 'Auth Token expired').forSocketIO());
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
        var respData = JSON.stringify(ret);

        if ('function' === typeof respCallback) {
          try {
            respCallback(respData); // Socket.io 2.0 ACK 返回
          } catch(err) {
            app.locals.logger.error(ex);
          }
        }
        socket.emit(event + '.resp', respData); // 普通消息返回
      });
    });

    // 检查认证中间件
    socket.use(function(packet, next) {
      // Socket.io 客户端发送任意事件前，验证是否已登录
      var xAuthTokenObj = AUTHED_SOCKET_IO_CLIENT_MAP[socket.id];
      if (!xAuthTokenObj) {
        // 未登录则抛错
        return next(new E('ESocketIOAuth', 'Client not send X-Auth-Token yet').forSocketIO());
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
              return asyncCallback(new E('EAuthToken', 'Unknow auth type', { authType: xAuthTokenObj.authType }).forSocketIO());
          }

          app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
            if (err) {
              return asyncCallback(new E('ESysCache', 'Read cache error').forSocketIO());
            }

            if (!cacheRes) {
              // 本Auth Token 已经失效
              return asyncCallback(new E('EAuthToken', 'Auth Token expired').forSocketIO());
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
        return next(new E('ESocketIOAuth', 'Socket.io connection gone').forSocketIO());
      }

      var event       = packet[0];
      var data        = packet[1];
      var respCallback = packet[2];

      // REQ标志ID
      var reqId = null;

      // 为避免混淆，Socket.io的事件必须以`socketio`开头
      var eventParts = event.split('.');
      if (eventParts[0] !== 'socketio') {
        return next(new E('ESocketIOEvent', 'Event of Socket.io must match pattern "socketio.*"').forSocketIO(reqId));
      }

      // 为统一处理，Socket.io的数据必须为JSON字符串
      try {
        data  = JSON.parse(data);
        reqId = data.reqId || undefined;

      } catch(err) {
        return next(new E('ESocketIOData', 'Data of Socket.io must be a JSON string').forSocketIO(reqId));
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
              switch(data.routeName) {
                case 'code-editor':
                case 'connector-setup':
                case 'env-variable-setup':
                  conflictSource = [
                    'routeName',      data.routeName,
                    'routeParams.id', data.routeParams.id,
                  ]
                  break;

                case 'script-set-import-history-list':
                case 'script-set-import':
                case 'script-recover-point-list':
                case 'script-recover-point-add':
                  conflictSource = [
                    'routeName', data.routeName,
                  ]
                  break;
              }
              break;

            default:
              return asyncCallback(new E('ESocketIOEvent', 'Unknow event of Socket.io').forSocketIO(reqId));
          }

          return asyncCallback();
        },
        // 判断冲突
        function(asyncCallback) {
          if (!conflictSource) return asyncCallback();

          var cacheKey = toolkit.getCacheKey('cache', 'clientConflict', conflictSource);
          async.series([
            function(innerCallback) {
              if (data.checkOnly) return innerCallback();

              app.locals.cacheDB.setexnx(cacheKey, CONFIG._CLIENT_CONFLICT_EXPIRES, data.conflictId, innerCallback);
            },
            function(innerCallback) {
              app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
                if (err) return innerCallback(err);

                retData = {
                  conflictId: cacheRes,
                  isConflict: cacheRes && data.conflictId !== cacheRes,
                }

                if (data.conflictId === cacheRes && !data.checkOnly) {
                  app.locals.cacheDB.expire(cacheKey, CONFIG._CLIENT_CONFLICT_EXPIRES);
                }

                return innerCallback();
              });
            },
          ], asyncCallback);
        },
      ], function(err) {
        if (err) return next(err);

        var ret   = toolkit.initRet(retData);
        ret.reqId = reqId;

        var respData = JSON.stringify(ret);

        if ('function' === typeof respCallback) {
          try {
            respCallback(respData); // Socket.io 2.0 ACK 返回
          } catch(err) {
            app.locals.logger.error(ex);
          }
        }
        socket.emit(event + '.resp', respData); // 普通消息返回
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

    // 错误处理
    socket.on("error", function(err) {
      var reason = null;
      try {
        reason = JSON.parse(err.message);
      } catch(err) {
        // Nope
      }

      socket.emit('error', err.message);
      if (reason === 'ESocketIOAuth') {
        socket.disconnect();
      }
    });
  });

  app.locals.socketIO = socketIO;
};
