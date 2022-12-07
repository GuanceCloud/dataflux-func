'use strict';

/* 3rd-party Modules */
var createObjectChecker = require('object-checker').createObjectChecker;

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

function convertQueryValues(req, queryConfig) {
  if (!req || !req.query) return;
  if (!queryConfig)       return;


  for (var k in queryConfig) if (queryConfig.hasOwnProperty(k)) {
    var c = queryConfig[k];
    var v = req.query[k];

    // Convert _ALL, _NULL
    switch(v) {
      case '_ALL':
        delete req.query[k]
        continue;

      case '_NULL':
        req.query[k] = null;
        break;
    }

    // Convert array
    if (c.$type && c.$type === 'array' && !c.$ && Array.isArray(v)) {
      req.query[k] = [ v ];
    }

  };
};

/**
 * Create a Express.js middleware for request validation.
 *
 * @param  {Object} routeConfig - Route config.
 * @return {Function} Express.js middleware.
 */
exports.createRequestValidator = function(routeConfig) {
  return function(req, res, next) {
    var ret = null;

    // Verify Files (Just get error from res.locals)
    if (routeConfig.files) {
      if (res.locals.reqUploadError) {
        return next(res.locals.reqUploadError);
      }
    }

    // Verify Query
    if (routeConfig.query) {
      var checkQueryConfig = toolkit.jsonCopy(routeConfig.query);
      checkQueryConfig[CONFIG._WEB_AUTH_QUERY] = {
        $desc      : 'XAuthToken',
        $isRequired: false,
        $type      : 'string',
      };

      convertQueryValues(req, checkQueryConfig);

      var checker = createObjectChecker({
        defaultRequired: false,
        customDirectives: {
          '$desc'      : null,
          '$name'      : null,
          '$type'      : null,
          '$example'   : null,
          '$searchType': null,
          '$searchKey' : null,
          '$orderKey'  : null,
        },
      });

      ret = checker.check(req.query, checkQueryConfig);
      if (!ret.isValid) {
        return next(new E('EClientBadRequest', 'Invalid request query', {
          message: ret.message,
        }));
      }

      // Convert query options
      var convertOptions = {};
      for (var k in req.query) if (req.query.hasOwnProperty(k)) {
        if (!checkQueryConfig[k].$type) continue;

        convertOptions[k] = checkQueryConfig[k].$type;
      }

      req.query = toolkit.convertObject(req.query, convertOptions);
    }

    // Verify Body
    if (routeConfig.body) {
      var checker = createObjectChecker({
        defaultRequired: false,
        customDirectives: {
          '$desc'   : null,
          '$name'   : null,
          '$example': null,
        },
      });

      ret = checker.check(req.body, routeConfig.body);
      if (!ret.isValid) {
        return next(new E('EClientBadRequest', 'Invalid request body', {
          message: ret.message,
        }));
      }
    }

    return next();
  };
};
