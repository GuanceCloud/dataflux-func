$(function() {
  /* Configure */
  var CLIENT_CONFIG = toolkit.getClientConfig();

  var _WEB_CLIENT_LOCALE_COOKIE   = CLIENT_CONFIG._WEB_CLIENT_LOCALE_COOKIE;
  var _WEB_CLIENT_LANGUAGE_COOKIE = CLIENT_CONFIG._WEB_CLIENT_LANGUAGE_COOKIE;
  var _WEB_PAGE_SIZE_COOKIE       = CLIENT_CONFIG._WEB_PAGE_SIZE_COOKIE;

  var _WEB_AUTH_HEADER        = CLIENT_CONFIG._WEB_AUTH_HEADER;
  var _WEB_AUTH_QUERY         = CLIENT_CONFIG._WEB_AUTH_QUERY;
  var _WEB_AUTH_LOCAL_STORAGE = CLIENT_CONFIG._WEB_AUTH_LOCAL_STORAGE;
  var _WEB_AUTH_COOKIE        = CLIENT_CONFIG._WEB_AUTH_COOKIE;

  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var dateRangeYearStart = currentYear - 2;

  /* Const */
  var MIMETYPE_TO_EXT = {
    'text/plain'                                                               : 'txt',
    'text/x-markdown'                                                          : 'md',
    'text/csv'                                                                 : 'csv',
    'image/jpeg'                                                               : 'jpg',
    'image/png'                                                                : 'png',
    'video/mp4'                                                                : 'mp4',
    'application/zip'                                                          : 'zip',
    'application/x-7z-compressed'                                              : '7z',
    'application/x-rar-compressed'                                             : 'rar',
    'application/x-tar'                                                        : 'tar',
    'application/pdf'                                                          : 'pdf',
    'application/json'                                                         : 'json',
    'application/msword'                                                       : 'doc',
    'application/vnd.ms-excel'                                                 : 'xls',
    'application/vnd.ms-powerpoint'                                            : 'ppt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  : 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'        : 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  };

  // Read locale from cookie
  var clientLocale = $.cookie(_WEB_CLIENT_LOCALE_COOKIE);

  var localeParts = clientLocale.split('_');
  var language    = localeParts[0];
  var territory   = localeParts[1].toUpperCase();

  // Set object-checker rules
  var bodyChecker = objectChecker.createObjectChecker({
    // Do not treat these as validators
    customDirectives: {
      '$desc'   : null,
      '$name'   : null,
      '$example': null,
    },
    messageTemplate: null,
  });

  // Set Moment.js locale
  if (moment) {
    moment.locale(toolkit.strf('{0}-{1}', language, territory));
  }

  // Core entry
  window.core = {};

  // Page functions
  window.pageFn = {};

  /**
   * Go back by history.
   */
  var goBack = core.goBack = function goBack() {
    history.back();
  };

  /**
   * Go to URL.
   *
   * @param {String} url - URL direct to.
   */
  var goToURL = core.goToURL = function goToURL(url) {
    if (url.slice(-1) === '#') {
      url = url.slice(0, -1);
    }

    location.href = url;
  };

  /**
   * Go to index page.
   */
  var goToIndex = core.goToIndex = function goToIndex() {
    goToURL('/');
  };

  /**
   * Go to dashboard page.
   */
  var goToDashboard = core.goToDashboard = function goToDashboard() {
    goToURL('/dashboard');
  };

  /**
   * Reload current page.
   */
  var reload = core.reload = function reload() {
    location.reload();
  };

  /**
   * Get auth header for API calling.
   *
   * @return {Object} - Headers object
   */
  var getAuthHeader = core.getAuthHeader = function getAuthHeader() {
    var headers = {};
    headers[_WEB_AUTH_HEADER] = localStorage.getItem(_WEB_AUTH_LOCAL_STORAGE) || undefined;
    return headers;
  };

  /**
   * Get x-auth-token from `localStorage` for API Calling.
   *
   * @retrun {String} xAuthToken
   */
  var getAPIXAuthToken = core.getAPIXAuthToken = function getAPIXAuthToken(xAuthToken) {
    return localStorage.getItem(_WEB_AUTH_LOCAL_STORAGE);
  };

  /**
   * Save x-auth-token to `localStorage` for future API Calling.
   *
   * @param {String} xAuthToken
   */
  var saveAPIXAuthToken = core.saveAPIXAuthToken = function saveAPIXAuthToken(xAuthToken) {
    localStorage.setItem(_WEB_AUTH_LOCAL_STORAGE, xAuthToken);
  };

  /**
   * Remove all x-auth-token (`localStorage` and `cookie`).
   *
   * @param {String} nextURL
   */
  var removeXAuthToken = core.removeXAuthToken = function removeXAuthToken(nextURL) {
    localStorage.removeItem(_WEB_AUTH_LOCAL_STORAGE);
    $.removeCookie(_WEB_AUTH_COOKIE);

    if (nextURL) {
      goToURL(nextURL);
    }
  };

  /**
   * Add a new Bootstrap help block under `$input`.
   *
   * @param {Object}          $input   - jQuery DOM instance
   * @param {String|String[]} messages - Help block messages
   */
  var addHelpBlock = core.addHelpBlock = function addHelpBlock($input, messages) {
    messages = toolkit.asArray(messages);

    var errorBlockHTML = toolkit.strf('<span dynamic-help-block class="help-block">{0}</span>',
        messages.join('<br />'));

    $fromGroup = $input.parents('.form-group').addClass('has-error');
    $inputGroup = $input.parents('.input-group');

    if ($inputGroup.length > 0) {
      $inputGroup.after(errorBlockHTML);
    } else {
      $input.after(errorBlockHTML);
    }
  };

  /**
   * Reset all help blocks.
   */
  var resetHelpBlocks = core.resetHelpBlocks = function resetHelpBlocks() {
    $('.has-error').removeClass('has-error');
    $('[dynamic-help-block]').remove();
    $('.help-block[api-reason]').addClass('hide');
  };

  /**
   * Show an existed Bootstrap help block.
   *
   * @param {String} reason - <Error response>.reason
   */
  var showHelpBlock = core.showHelpBlock = function showHelpBlock(reason, detail) {
    var $errorBlock = $(toolkit.strf('[api-reason="{0}"]', reason));

    $errorBlock.removeClass('hide');
    $errorBlock.parents('.form-group').addClass('has-error');

    var detailMessageTemplate = $errorBlock.attr('detail-message-template');
    if (detail && detailMessageTemplate) {
      var html = detail.reduce(function(acc, d) {
        acc.push(toolkit.strf.apply(null, [detailMessageTemplate].concat(d)));
        return acc;
      }, []).join('<br />');
      toolkit.log(html);

      $errorBlock.find('p').html(html);
    }
  };

  /**
   * Show and information dialog
   *
   * @param {Object} ev      - Event
   * @param {String} title   - Title text
   * @param {String} content - Content text
   */
  var showInfoModal = core.showInfoModal = function showInfoModal(title, content, onClose) {
    var $watInfoModal = $('#watInfoModal');

    if (title) {
      $watInfoModal.find('.modal-title').html(title);
    }

    if (content) {
      $watInfoModal.find('.modal-body').html(content);
    }

    $watInfoModal.one('hidden.bs.modal', function() {
      if (onClose && 'function' === typeof core[onClose]) {
        core[onClose]();
      } else if ('function' === typeof onClose) {
        onClose();
      }
    });

    $watInfoModal.modal('show');
  };

  /**
   * Handler for confirm modal.
   *
   * @param {Object} ev            - Event
   * @param {String} confirmStatus - Confirm status ('confirmed|waiting')
   */
  var confirmHandler = core.confirmHandler = function confirmHandler(ev, confirmStatus) {
    if (confirmStatus === 'confirmed') return;

    var $this = $(this);
    var buttons = $this.attr('wat-confirm').split(',');
    var title   = $this.attr('wat-confirm-title');
    var content = $this.attr('wat-confirm-content');

    var $watConfirmModal = $('#watConfirmModal');
    $watConfirmModal.find('.modal-title').html(title);
    $watConfirmModal.find('.modal-body').html(content);

    $watConfirmModal.find('[wat-confirm-button]').addClass('hidden');
    $watConfirmModal.find('[wat-confirm-submit]')
    .off('click')
    .one('click', function() {
      $watConfirmModal
      .off('hidden.bs.modal')
      .one('hidden.bs.modal', function() {
        $this.trigger('click', 'confirmed');
      });
      $watConfirmModal.modal('hide');
    });

    for (var i = 0; i < buttons.length; i++) {
      var buttonSelector = toolkit.strf('[wat-confirm-button={0}]', buttons[i].trim());
      $watConfirmModal.find(buttonSelector).removeClass('hidden');
    }
    $watConfirmModal.modal('show');

    return 'wait';
  };

  /**
   * Extra client errors
   */
  var EXTRA_CLINET_ERRORS = core.EXTRA_CLINET_ERRORS = [];

  /**
   * Clear Client Error
   */
  var clearClientError = core.clearClientError = function clearClientError() {
    EXTRA_CLINET_ERRORS = [];
  };

  /**
   * Add extra client error.
   *
   * @param {String} reason
   */
  var addClientError = core.addClientError = function addClientError(reason) {
    EXTRA_CLINET_ERRORS.push(reason);
  };

  /**
   * Get POST body config.
   *
   * @param {Object} $submitter - The element with API configs.
   */
  var getBodyConfig = core.getBodyConfig = function getBodyConfig($submitter) {
    var bodyConfig = null;
    if ($submitter.attr('wat-api-body-config')) {
      bodyConfig = JSON.parse($submitter.attr('wat-api-body-config'));
      toolkit.log('>>> API Config: ', bodyConfig);
    }

    return bodyConfig;
  };

  /**
   * Get value from wat-* elements.
   *
   * @param  {String} $elem               - jQuery element.
   * @param  {String} [type=string]       - Value type (e.g. "str"|string"|"int"|"integer"|"float"|"number"|"bool"|"boolean"|"json"|"obj"|"object"|"datetime").
   * @param  {String} defaultValue        - Default value.
   * @param  {String} [blankConvert=null] - Behavior when blank value (e.g. "stay"|"skip"|"null")
   * @return {*}                          - Value from wat-*
   */
  var getFormValue = core.getFormValue = function getFormValue($target, type, defaultValue, blankConvert) {
    var value = null;
    if ($target.is('input:checkbox')) {
      if (type === 'boolean') {
        // Use check status if the element is a checkbox with a boolean type.
        value = $target.prop('checked') ? 1 : 0;
      } else {
        // Non-boolean value checkbox should have a value attribute.
        if ('undefined' === typeof $target.attr('value')) {
          throw new Error('WAT: Non-boolean value checkbox should have a value attribute.');
        }

        if ($target.prop('checked')) {
          // Use `value` attribute for non-boolean value when checked.
          value = ($target.attr('value') || '').trim();
        } else {
          return undefined;
        }
      }
    } else {
      // Use value attribute if the element is not a checkbox or a checkbox without a boolean type.

      // Auto trim() value.
      value = $target.val();
      if ($target.is('select[multiple]')) {
        value = toolkit.asArray(value);
      }

      if ('string' === typeof value) {
        value = (value || '').toString().trim();

      } else if (Array.isArray(value)) {
        value = value.reduce(function(acc, x) {
          acc.push((x || '').toString().trim());
          return acc;
        }, []);
      }

      // Set default when blank and the default value is provided.
      if (defaultValue && !value) {
        value = defaultValue;
      }

      // Convert blank.
      if (value === '') {
        switch (blankConvert || 'null') {
          case 'skip':
            return undefined;

          case 'null':
            return null;

          default:
            break;
        }
      }
    }

    // Parse value
    switch (type) {
      case 'int':
      case 'integer':
        value = parseInt(value);
        break;

      case 'number':
      case 'float':
        value = parseFloat(value);
        break;

      case 'bool':
      case 'boolean':
        value = toolkit.toBoolean(value);
        break;

      case 'obj':
      case 'object':
      case 'json':
        try {
          value = JSON.parse(value);
        } catch(ex) {
          // Nope
        }

        break;

      case 'commaArray':
        value = value.split(/[,]/g).filter(function(x) { return !!x; });
        break;

      case 'spaceArray':
        value = value.split(/[ ]/g).filter(function(x) { return !!x; });
        break;

      case 'commaSpaceArray':
        value = value.split(/[, ]/g).filter(function(x) { return !!x; });
        break;

      case 'unixTimestamp':
        value = parseInt(new Date(value).getTime() / 1000);
        break;

      case 'unixTimestamp_endOfDay':
        value = parseInt(new Date(value).getTime() / 1000) + 3600 * 24;
        break;

      case 'iso8601':
        value = new Date(value).toISOString();
        break;

      case 'str':
      case 'string':
      default:
        value = value;
        break;

    }

    return value;
  };

  /**
   * Build API options from $submitter.
   *
   * @param {Object} $submitter - The element with API configs.
   */
  var buildAPIOptions = core.buildAPIOptions = function buildAPIOptions($submitter) {
    var url         = $submitter.attr('wat-api-url');
    var method      = $submitter.attr('wat-api-method');
    var apiFor      = $submitter.attr('wat-api-for');
    var apiSkipAuth = $submitter.attr('wat-api-skip-auth');

    var bodyConfig = getBodyConfig($submitter);

    var apiOptions = {};

    ['params', 'query', 'body'].forEach(function(k) {
      var value = $submitter.attr('wat-api-' + k);
      if (value) {
        apiOptions[k] = JSON.parse(value);
      }
    });

    apiOptions.method         = (method ? method : apiOptions.body ? 'post' : 'get');
    apiOptions.url            = url;
    apiOptions.skipAuth       = (apiSkipAuth ? true : false);
    apiOptions.errors         = [];
    apiOptions.apiOK          = $submitter.attr('wat-api-ok');
    apiOptions.apiOKURL       = $submitter.attr('wat-api-ok-url');
    apiOptions.apiOKURLParams = $submitter.attr('wat-api-ok-url-params');
    apiOptions.apiOKURLQuery  = $submitter.attr('wat-api-ok-url-query');
    apiOptions.apiNG          = $submitter.attr('wat-api-ng');
    apiOptions.apiNGURL       = $submitter.attr('wat-api-ng-url');
    apiOptions.apiNGURLParams = $submitter.attr('wat-api-ng-url-params');
    apiOptions.apiNGURLQuery  = $submitter.attr('wat-api-ng-url-query');

    // Collect submit data from wat-data-* and check input error
    $(toolkit.strf('[wat-data-for={0}]', apiFor)).each(function() {
      $elem = $(this);

      // Skip disabled fields
      if ($elem.prop('disabled')) return;

      // Collect data
      var key          = ($elem.attr('wat-data-key')  || '').replace(/\[/g, '.['); // For convenient split
      var type         = ($elem.attr('wat-data-type') || 'string');
      var defaultValue = ($elem.attr('wat-data-default') || '').trim() || undefined;
      var blankConvert =  $elem.attr('wat-data-blank-convert') || null;

      // Get & validate value
      var value = getFormValue($elem, type, defaultValue, blankConvert);
      if ('undefined' === typeof value) {
        // Skip undefined values
        return;
      }

      var keyParts = key.split('.'); // <Category>.path2.path2...
      if (keyParts[0] === 'body' && bodyConfig) {
        var checkOption = bodyConfig;

        if (checkOption.$skip) return;

        toolkit.log('>>> Key: ', key);
        toolkit.log('>>> Value: ', typeof value, value);

        var isJSONType   = false;
        var hasSubConfig = false;
        for (var i = 1; i < keyParts.length; i++) {
          var step = keyParts[i];
          if (step === '[]' || step === '[#]') {
            checkOption = checkOption['$'];
          } else {
            checkOption = checkOption[step];
          }

          isJSONType = checkOption.$type === 'json'
                      || checkOption.$type === 'object'
                      || checkOption.$type === 'obj';

          for (var k in checkOption) if (checkOption.hasOwnProperty(k)) {
            if (k[0] !== '$') {
              hasSubConfig = true;
              break;
            }
          }
        }

        if (!isJSONType || hasSubConfig) {
          var result = bodyChecker.check(value, checkOption);
          toolkit.log('>>> Check Result: ', result);
          if (!result.isValid) {
            apiOptions.errors.push({
              $elem      : $elem,
              key        : key,
              value      : value,
              checkOption: checkOption,
              message    : result.message,
            });
          }
        }
      }

      // Fill value to API calling settings.
      var obj = apiOptions;
      for (var i = 0; i < keyParts.length; i++) {
        var step = keyParts[i];
        var prevStep = keyParts[i - 1];
        var nextStep = keyParts[i + 1];

        if (nextStep === '[#]' || nextStep === '[]') {
          obj[step] = obj[step] || [];
        } else {
          obj[step] = obj[step] || {};
        }

        if (!nextStep) {
          if (step === '[]') {
            obj.push(value);
          } else {
            obj[step] = value;
          }
        } else {
          if (step === '[#]') {
            obj.push({});
            obj = obj[obj.length - 1];
          } else if (step === '[]') {
            obj = obj[obj.length - 1];
          } else {
            obj = obj[step];
          }
        }
      }
    });

    return apiOptions;
  };

  /**
   * Show errors as Bootstrap Helpblock.
   *
   * @param  {Object[]} errors            - Errors found by route loader config
   * @param  {String[]} extraClientErrors - Extra error reason (e.g. "EAuthUser")
   */
  var showErrors = core.showErrors = function showErrors(errors, extraClientErrors) {
    resetHelpBlocks();

    // Show extra client errors
    for (var i = 0; i < extraClientErrors.length; i++) {
      showHelpBlock(extraClientErrors[i]);
    }

    // Show common client errors
    for (var i = 0; i < errors.length; i++) {
      var e = errors[i];
      toolkit.log('>>> Error', i, toolkit.strf('{0}=`{1}`', e.key, e.value));
      toolkit.log('>>> Error Config', e.checkOption);
      toolkit.log('>>> Error Message', e.message);

      var errorBlockMessages = [];
      if (e.checkOption && (!e.checkOption.$isOptional || !e.checkOption.$optional || e.checkOption.$isRequired || e.checkOption.$required) && (toolkit.isNullOrEmpty(e.value) || e.value.length === 0)) {
        errorBlockMessages.push(coreTranslates('inputedValueCannotBeBlank'));
      } else {
        errorBlockMessages.push(coreTranslates('inputedValueInvalid'));
        for (var k in e.checkOption) if (e.checkOption.hasOwnProperty(k)) {
          var v = e.checkOption[k];

          switch (k) {
            case '$limitSize':
              errorBlockMessages.push(coreTranslates('limitSize', v));
              break;

            case '$allowedTypes':
              var allowedExts = [];
              v.forEach(function(mimetype) {
                var ext = MIMETYPE_TO_EXT[mimetype];
                if (ext) {
                  allowedExts.push(ext)
                }
              })
              errorBlockMessages.push(coreTranslates('allowedTypes', allowedExts.join(', ')));
              break;

            case '$type':
              var assertType = v.toLowerCase();
              if (assertType === 'int' || assertType === 'integer') {
                errorBlockMessages.push(coreTranslates('shouldBeIntType'));
              } else if (assertType === 'number' || assertType === 'float') {
                errorBlockMessages.push(coreTranslates('shouldBe_type', assertType));
              }
              break;

            case '$notEmptyString':
              errorBlockMessages.push(coreTranslates('shouldNotBeEmptyString'));
              break;

            case '$isInteger':
              errorBlockMessages.push(coreTranslates('shouldBeInteger'));
              break;

            case '$isPositiveZeroInteger':
            case '$isPositiveIntegerOrZero':
              errorBlockMessages.push(coreTranslates('shouldBePositiveIntegerOrZero'));
              break;

            case '$isPositiveInteger':
              errorBlockMessages.push(coreTranslates('shouldBePositiveInteger'));
              break;

            case '$isNegativeZeroInteger':
            case '$isNegativeIntegerOrZero':
              errorBlockMessages.push(coreTranslates('shouldBeNegativeIntegerOrZero'));
              break;

            case '$isNegativeInteger':
              errorBlockMessages.push(coreTranslates('shouldBeNegativeInteger'));
              break;

            case '$minValue':
              errorBlockMessages.push(coreTranslates('shouldGreaterEqualThan_', v));
              break;

            case '$maxValue':
              errorBlockMessages.push(coreTranslates('shouldLessEqualThan_', v));
              break;

            case '$isValue':
              errorBlockMessages.push(coreTranslates('shouldBe_', v));
              break;

            case '$in':
              errorBlockMessages.push(coreTranslates('shouldBeAnyOf_', v.join(', ')));
              break;

            case '$notIn':
              errorBlockMessages.push(coreTranslates('shouldNotBeAnyOf_', v.join(', ')));
              break;

            case '$minLength':
              errorBlockMessages.push(coreTranslates('lengthShouldGreaterEqualThan_', v));
              break;

            case '$maxLength':
              errorBlockMessages.push(coreTranslates('lengthShouldLessEqualThan_', v));
              break;

            case '$isLength':
              errorBlockMessages.push(coreTranslates('lengthShouldBe_', v));
              break;

            case '$isEmail':
              errorBlockMessages.push(coreTranslates('shouldBeEmail'));
              break;
          }
        }
      }

      addHelpBlock(e.$elem, errorBlockMessages);
    }
  };

  /**
   * Disable the $submitter and show a loading icon.
   *
   * @param {Object} $submitter - The element with API configs.
   * @param {Object} options
   * @param {Object} options.useSpinIcon - Switch ths submitter icon to a spin
   */
  var disableSubmitter = core.disableSubmitter = function disableSubmitter($submitter, options) {
    options = options || {};
    if ('undefined' === typeof options.useSpinIcon) {
      options.useSpinIcon = true;
    }

    $submitter.prop('disabled', true);

    var $submitterIcon = $submitter.children('i.fa');

    var prevClass = $submitterIcon.attr('class');
    if (prevClass) {
      if (prevClass.indexOf('fa-spin') < 0) {
        $submitterIcon.attr('prev-class', prevClass);
      }
      if (options.useSpinIcon) {
        $submitterIcon.attr('class', 'fa fa-fw fa-circle-o-notch fa-spin');
      }
    }
  };

  /**
   * Enable the $submitter.
   *
   * @param {Object} $submitter - The element with API configs.
   */
  var enableSubmitter = core.enableSubmitter = function enableSubmitter($submitter) {
    $submitter.prop('disabled', false);

    var $submitterIcon = $submitter.children('i.fa');

    var prevClass = $submitterIcon.attr('prev-class');
    if (prevClass) {
      $submitterIcon.attr('class', prevClass);
    }
  };

  /**
   * API callback warpper
   *
   * @param {String||Object} opt
   */
  function apiCallbackWrapper($submitter, opt) {
    return function(d, s, jqXHR) {
      // Refresh Chapter only if error
      if (s >= 400 && $submitter.attr('wat-use-captcha') === 'true') refreshCaptcha();

      if ('string' === typeof opt) {
        var fn = pageFn[opt] || apiHooks[opt] || null;
        if ('function' === typeof fn) {
          fn(d, s, jqXHR, $submitter);
        } else {
          eval(opt);

          // Enable the clicked button.
          enableSubmitter($submitter);
        }
      } else {
        if (opt.params && 'string' === typeof opt.params) {
          opt.params = JSON.parse(opt.params);
        }

        for (var k in opt.params) if (opt.params.hasOwnProperty(k)) {
          var v = opt.params[k];
          if ('string' === typeof v && v[0] === '@') {
            opt.params[k] = toolkit.jsonFind(d, v.slice(1), true);
          }
        }

        if (opt.query && 'string' === typeof opt.query) {
          opt.query = JSON.parse(opt.query);
        }

        for (var k in opt.query) if (opt.query.hasOwnProperty(k)) {
          var v = opt.query[k];
          if ('string' === typeof v && v[0] === '@') {
            opt.query[k] = toolkit.jsonFind(d, v.slice(1), true);
          }
        }

        var nextURL = toolkit.createFullURL(opt.url, opt.params, opt.query);
        goToURL(nextURL);
      }
    };
  };

  /**
   * API calling handler for button[wat-api-url].
   *
   * @param {Object} ev - Event
   */
  var callAPIHandler = core.callAPIHandler = function callAPIHandler(ev) {
    if (ev.result === 'wait') return;

    var $this = $(this);

    // Build API Options.
    var apiOptions = buildAPIOptions($this);

    // Show errors.
    if (apiOptions.errors.length > 0 || EXTRA_CLINET_ERRORS.length > 0) {
      toolkit.log('>>> API Query', apiOptions.query);
      toolkit.log('>>> API Body', apiOptions.body);

      showErrors(apiOptions.errors, EXTRA_CLINET_ERRORS);
      clearClientError();

      // Stop if there is any error
      return;
    }

    // Disable the clicked button.
    disableSubmitter($this);

    // Call API
    toolkit.callAPI(apiOptions, {
      ok: apiCallbackWrapper($this, apiOptions.apiOK || {
        url   : apiOptions.apiOKURL,
        params: apiOptions.apiOKURLParams,
        query : apiOptions.apiOKURLQuery,
      }),
      ng: apiCallbackWrapper($this, apiOptions.apiNG || {
        url   : apiOptions.apiNGURL,
        params: apiOptions.apiNGURLParams,
        query : apiOptions.apiNGURLQuery,
      }),
    });
  };

  /**
   * Switch lcoale.
   *
   * @param {String} locale - Locale that switch to (e.g. 'en_US|zh_CN')
   */
  var switchLocale = core.switchLocale = function switchLocale(locale) {
    // Set new locale
    locale = locale.replace('-', '_');

    var parts = locale.split('_');
    var language = parts[0];
    var territory = parts[1].toUpperCase();

    $.cookie(_WEB_CLIENT_LANGUAGE_COOKIE, language, {path: '/'});
    $.cookie(_WEB_CLIENT_LOCALE_COOKIE, toolkit.strf('{0}_{1}', language, territory), {path: '/'});

    core.reload();
  };

  /**
   * Refresh CAPTCHA.
   */
  var refreshCaptcha = core.refreshCaptcha = function refreshCaptcha(ev) {
    var $this = $('#watCaptchaImage');

    var newCaptchaToken = toolkit.genRandString();

    var newQuery = {
      captchaToken: newCaptchaToken,
    }

    var xAuthToken = getAPIXAuthToken();
    if (xAuthToken) {
      newQuery[_WEB_AUTH_QUERY] = xAuthToken;
    }

    var captchaURL = toolkit.updateQuery($this.attr('src'), newQuery);

    $this.attr('src', captchaURL);
    $('#watCaptchaToken').val(newCaptchaToken);

    $.get(captchaURL, function(d) {
      $this.html(d);
    });
  };

  /**
   * Set page size.
   *
   * @param {Object} ev - Event
   */
  var setPageSize = core.setPageSize = function setPageSize(ev) {
    var nextPageSize = $('#watPageSize').val();

    $.cookie(_WEB_PAGE_SIZE_COOKIE, nextPageSize, {path: '/'});

    var q = toolkit.getQuery(location.href);
    if (q.pageNumber) q.pageNumber = 1;
    q.pageSize = nextPageSize;

    var nextURL = toolkit.replaceQuery(location.href, q);
    core.goToURL(nextURL);
  };

  /**
   * Replace the query.fuzzySearch to run common search function.
   *
   * @param {Object} ev - Event
   */
  var runFuzzySearch = core.runFuzzySearch = function runFuzzySearch(ev) {
    var queries = {
      pageNumber  : undefined,
      _fuzzySearch: $('#watFuzzySearchInput').val() || null,
    };

    var nextURL = toolkit.updateQuery(location.href, queries, true);
    core.goToURL(nextURL);
  };

  /**
   * Add the query.<filter> to run list filter.
   *
   * @param {Object} ev - Event
   */
  var runFilter = core.runFilter = function runFilter(ev) {
    var queries = {};
    $('[wat-filter]').each(function() {
      var $this = $(this);
      var v = $this.val();

      queries[$this.attr('wat-filter')] = $this.val();
    });

    queries.pageNumber = null;
    queries.pageMarker = null;

    var nextURL = toolkit.updateQuery(location.href, queries, true);

    core.goToURL(nextURL);
  };

  /**
   * Load filter from query.
   */
  var loadFilter = core.loadFilter = function loadFilter() {
    var queries = toolkit.getQuery(location.href);
    $('[wat-filter]').each(function() {
      var $this = $(this);
      var key = $this.attr('wat-filter');
      $this.val(decodeURIComponent(queries[key] || ''));
    });
  }

  /* Event Binding */
  $(document).on('keydown', function(ev) {
    if (ev.keyCode === 13) {
      $('[wat-trigger-by-enter]').click();
    }
  });

  $(document).on('keydown', '[wat-trigger-click]', function(ev) {
    if (ev.keyCode === 13) {
      $($(this).attr('wat-trigger-click')).click();
    }
  });

  // Confirm modal
  $(document).on('click', '[wat-confirm]', confirmHandler);

  // All action links/buttons
  // NOTICE: Must been bound after `confirmHandler`
  $(document).on('click', '[wat-api-for]', callAPIHandler);

  // Captcha
  if ($('#watCaptchaImage').length > 0) refreshCaptcha();
  $(document).on('click', '#watCaptchaImage', refreshCaptcha);
  $(document).on('keyup', '#watCaptcha', function(ev) {
    var $this = $(this);
    var maxLength         = parseInt($this.attr('maxlength'));
    var userInputedLength = $this.val().length;

    if (maxLength === userInputedLength) {
      $('[wat-use-captcha="true"]').click();
    }
  });

  // Paging
  $(document).on('change', '#watPageSize', setPageSize);

  // Fuzzy search
  $(document).on('click', '#watFuzzySearchButton', runFuzzySearch);
  $(document).on('click', '#watFuzzySearchClear', function(ev) {
    $('#watFuzzySearchInput').val(null);
    core.runFuzzySearch();
  });
  $(document).on('keydown', '#watFuzzySearchInput', function(ev) {
    if (ev.keyCode === 13) {
      core.runFuzzySearch();
    }
  });

  // Filter in list
  $(document).on('click', '#watFilterButton', runFilter);
  $(document).on('click', '#watFilterClear', function(ev) {
    $('[wat-filter]').val(null);
    core.runFilter();
  });
  $(document).on('keydown', '[wat-filter]', function(ev) {
    if (ev.keyCode === 13) {
      core.runFilter();
    }
  });

  // Select all
  $(document).on('change', '[wat-select-all]', function(ev) {
    var $this = $(this);

    $this.parents('table:first').find(':checkbox').prop('checked', $this.prop('checked'));
  });

  // JSON Textarea
  $(document).on('change', '[wat-data-type="json"]', function() {
    var $this = $(this);
    try {
      var formattedJSON = null;
      if ($this.is('textarea')) {
        formattedJSON = JSON.stringify(JSON.parse($this.val()), null, 2);
      } else {
        formattedJSON = JSON.stringify(JSON.parse($this.val()));
      }
      $this.val(formattedJSON);
      $this.css('color', '');
      $this.tooltip('destroy');

    } catch(ex) {
      $this.css('color', 'red');
      $this.tooltip({
        title  : 'Invalid JSON',
        trigger: 'manual',
      }).tooltip('show');
    }
  });

  /* Page initializing */
  // Text overflow
  $('.wat-text-overflow').each(function() {
    var $this = $(this);
    var title = $this.text().trim();

    if (!title) return;

    $this.attr({
      'data-toggle'   : 'tooltip',
      'data-placement': 'top',
      'title'         : title,
    });
  });

  // Bootstrap
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();

  // highlight-js
  var hljsLangURL = function(hljs) {
    return {
      c: [
        {
          cN: 'type',
          b: /GET|POST|PUT|DELETE/,
        },
        {
          cN: 'keyword',
          b: /\/api\/v[0-9]+/, e: /[_\-0-9a-zA-Z]+/,
          eB: true,
        },
        {
          cN: 'variable',
          b: /\:[_\-0-9a-zA-Z]+/
        },
        {
          cN: 'symbol',
          b: /\/do/, e: /[_\-0-9a-zA-Z]+/,
        },
        {
          cN: 'attribute',
          b: /[&?]/, e: /[_\-0-9a-zA-Z]+/,
          eB: true,
        },
        {
          cN: 'string',
          b: /[=]/, e: /[.,_\-0-9a-zA-Z]+/,
          eB: true,
        }
      ]
    }
  };
  hljs.registerLanguage('apiurl', hljsLangURL);
  hljs.initHighlighting();

  // Clipboard
  var clipboard = new ClipboardJS('[data-clipboard-text]');
  clipboard.on('success', function(e) {
    var $copyButton = $(e.trigger);
    $copyButton.tooltip({
      title    : $copyButton.attr('copied-title'),
      placement: 'right',
    });

    e.clearSelection();
  });
  $(document).on('mouseleave', '[data-clipboard-text]', function() {
    $(this).tooltip('destroy');
  });

  // Show request cost
  $('#watReqCostLabel').text($('#watReqCost').val());
});
