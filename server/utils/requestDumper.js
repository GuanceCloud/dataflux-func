'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

exports.dumpRequest = function(req, res, next) {
  var dumpList = [
    toolkit.strf('{0}=`{1}`', 'host',        req.get('host')),
    toolkit.strf('{0}=`{1}`', 'method',      req.method.toUpperCase()),
    toolkit.strf('{0}=`{1}`', 'url',         toolkit.limitText(path.join(req.baseUrl, req.path), 1000, { showLength: true })),
    toolkit.strf('{0}=`{1}`', 'query',       toolkit.limitText(JSON.stringify(req.query),        1000, { showLength: true })),
    toolkit.strf('{0}=`{1}`', 'originalUrl', toolkit.limitText(req.originalUrl,                  1000, { showLength: true })),
  ];

  res.locals.logger._log('info', '{0} {1}', '[REQUEST]', dumpList.join(', '));

  return next();
};

exports.dumpRequestFrom = function(req, res, next) {
  var dumpList = [
    toolkit.strf('{0}=`{1}`', 'ip',                req.ip),
    toolkit.strf('{0}=`{1}`', 'ips',               req.ips.join(' -> ')),
    toolkit.strf('{0}=`{1}`', 'remoteip',          req.get('remoteip')          || ''),
    toolkit.strf('{0}=`{1}`', 'x-real-ip',         req.get('x-real-ip')         || ''),
    toolkit.strf('{0}=`{1}`', 'x-forwarded-for',   req.get('x-forwarded-for')   || ''),
    toolkit.strf('{0}=`{1}`', 'x-forwarded-proto', req.get('x-forwarded-proto') || ''),
    toolkit.strf('{0}=`{1}`', 'referer',           req.get('referer')           || ''),
    toolkit.strf('{0}=`{1}`', 'browser',           req.useragent.browser        || ''),
    toolkit.strf('{0}=`{1}`', 'version',           req.useragent.version        || ''),
    toolkit.strf('{0}=`{1}`', 'os',                req.useragent.os             || ''),
    toolkit.strf('{0}=`{1}`', 'platform',          req.useragent.platform       || ''),
  ];

  res.locals.logger._log('info', '{0} {1}', '[REQUEST FROM]', dumpList.join(', ') );

  return next();
};

exports.dumpRequestBody = function(req, res, next) {
  var bodyDump = toolkit.jsonDumps(req.body);
  bodyDump = toolkit.limitText(bodyDump, 1000, { showLength: true });
  var dumpList = [
    toolkit.strf('body=`{0}`', bodyDump),
  ];

  if (req.files) {
    req.files.forEach(function(f) {
      dumpList.push(toolkit.strf('file=`{0}`, size={1} Bytes', f.originalname, f.size));
    });
  }

  res.locals.logger.info('{0} {1}', '[REQUEST BODY]', dumpList.join('; '));

  return next();
};

exports.dumpUserInformation = function(req, res, next) {
  if (!res.locals.user || !res.locals.user.isSignedIn) {
    res.locals.logger.info('{0} {1}',
      '[REQUEST USER]',
      'ANONYMOUS'
    );

  } else {
    res.locals.logger.info('{0} {1}({2})',
      '[REQUEST USER]',
      res.locals.user.name,
      res.locals.user.id,
    );
  }

  return next();
};
