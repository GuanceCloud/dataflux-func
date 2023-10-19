'use strict';

/* 3rd-party Modules */
var async      = require('async');
var svgCaptcha = require('svg-captcha');

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

/* Init */
svgCaptcha.options.width      = 120;
svgCaptcha.options.height     = 30;
svgCaptcha.options.noise      = 2;
svgCaptcha.options.fontSize   = 42;
svgCaptcha.options.charPreset = '0123456789';

var createCaptchaCacheKey = function(category, token) {
  return toolkit.getCacheKey('captcha', category, ['captchaToken', token]);
};

exports.createGetCaptchaHandler = function createGetCaptchaHandler(category) {
  return function(req, res, next) {
    var captchaCategory = category || req.query.captchaCategory;
    var captchaToken = req.query.captchaToken;

    if (toolkit.isNullOrWhiteSpace(captchaToken)) {
      return next(new E('EClientBadRequest', 'Invalid captcha token', {
        captchaCategory: captchaCategory,
        captchaToken   : captchaToken,
      }));
    }

    var cacheKey = createCaptchaCacheKey(captchaCategory, captchaToken);

    var captchaValue  = null;
    var captchaBuffer = null;

    async.series([
      // Check duplicated captcha token
      function(asyncCallback) {
        res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (cacheRes) {
            return asyncCallback(new E('EUserCaptcha', 'This captcha token is already used', {
              captchaCategory: captchaCategory,
              captchaToken   : captchaToken,
            }));
          }

          return asyncCallback();
        });
      },

      // Generate new captcha
      function(asyncCallback) {
        if (CONFIG.MODE === 'prod') {
          var captcha = svgCaptcha.create();
          captchaValue  = captcha.text;
          captchaBuffer = captcha.data;

        } else {
          captchaValue = captchaToken.slice(-4);
          captchaBuffer = svgCaptcha(captchaValue);
        }

        res.locals.logger.debug('Captcha=`{0}`, Key=`{1}`', captchaValue, cacheKey);
        res.locals.cacheDB.setex(cacheKey, CONFIG._WEB_CAPTCHA_EXPIRES, captchaValue, asyncCallback);
      },
    ], function(err) {
      if (err) return next(err);
      res.end(captchaBuffer);
    });
  };
};

exports.createVerifyCaptchaHandler = function createVerifyCaptchaHandler(captchaCategory) {
  return function(req, res, next) {
    if (CONFIG.MODE === 'dev') return next();

    var captchaToken        = req.body.captchaToken;
    var inputedCaptchaValue = req.body.captcha;
    var cachedCaptchaValue  = null;

    if (toolkit.isNullOrWhiteSpace(captchaToken)) {
      return next(new E('EUserCaptcha', 'Invalid captcha token', {
        captchaCategory: captchaCategory,
        captchaToken   : captchaToken,
      }));
    }

    var cacheKey = createCaptchaCacheKey(captchaCategory, captchaToken);

    async.series([
      // Get captcha from cache
      function(asyncCallback) {
        res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (!cacheRes) {
            return asyncCallback(new E('EUserCaptcha', 'Can not found captcha token', {
              captchaCategory: captchaCategory,
              captchaToken   : captchaToken,
            }));
          }

          cachedCaptchaValue = cacheRes;

          return asyncCallback();
        });
      },

      // Verify and delete capthca
      function(asyncCallback) {
        res.locals.cacheDB.del(cacheKey, function(err) {
          if (err) return asyncCallback(err);

          res.locals.logger.debug('Input=`{0}`, Cached=`{1}`', inputedCaptchaValue, cachedCaptchaValue);

          if (toolkit.isNullOrWhiteSpace(inputedCaptchaValue)) {
            return asyncCallback(new E('EUserCaptcha', 'Please input captcha', {
              captchaCategory    : captchaCategory,
              captchaToken       : captchaToken,
            }));
          }

          if (inputedCaptchaValue.toLowerCase() !== cachedCaptchaValue.toLowerCase()) {
            return asyncCallback(new E('EUserCaptcha', 'Invalid captcha', {
              captchaCategory: captchaCategory,
              captchaToken   : captchaToken,
            }));
          }

          return asyncCallback();
        });
      },

    ], function(err) {
      return next(err);
    });
  };
};
