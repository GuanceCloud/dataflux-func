$(function() {
  /* Configure */
  var CLIENT_CONFIG = toolkit.getClientConfig();

  var _WEB_CLIENT_LOCALE_COOKIE = CLIENT_CONFIG._WEB_CLIENT_LOCALE_COOKIE;

  /* Const */
  var DEFAULT_LOCALE = 'en_US';
  var TRANSLATES = {
    'en_US': {
      'limitSize'                    : 'File size is limited to {0}.',
      'allowedTypes'                 : 'Only {0} type files are allowed.',
      'inputedValueCannotBeBlank'    : 'Can not be blank.',
      'inputedValueInvalid'          : 'The inputed value is invalid.',
      'shouldBe_type'                : 'Should be a {0} type value.',
      'shouldBeIntType'              : 'Should be an integer.',
      'shouldBeNumberType'           : 'Should be an number.',
      'shouldNotBeEmptyString'       : 'Should not be an empty string.',
      'shouldBeInteger'              : 'Should be an integer.',
      'shouldBePositiveIntegerOrZero': 'Should be an positive integer or 0.',
      'shouldBePositiveInteger'      : 'Should be an positive integer.',
      'shouldBeNegativeIntegerOrZero': 'Should be an negative integer or 0.',
      'shouldBeNegativeInteger'      : 'Should be an negative integer.',
      'shouldGreaterEqualThan_'      : 'Should be greater than or equal to {0}.',
      'shouldLessEqualThan_'         : 'Should be less than or equal to {0}.',
      'shouldBe_'                    : 'Should be {0}.',
      'shouldBeAnyOf_'               : 'Should be any of {0}.',
      'shouldNotBeAnyOf_'            : 'Should not be any of {0}.',
      'lengthShouldGreaterEqualThan_': 'Length should be greater than or equal to {0}.',
      'lengthShouldLessEqualThan_'   : 'Length should be less than or equal to {0}.',
      'lengthShouldBe_'              : 'Length should be {0}.',
      'shouldBeEmail'                : 'Should be an email.',
    },

    'zh_CN': {
      'limitSize'                    : '文件大小限制为 {0}。',
      'allowedTypes'                 : '只支持 {0} 类型的文件。',
      'inputedValueCannotBeBlank'    : '不能为空。',
      'inputedValueInvalid'          : '输入值不正确。',
      'shouldBe_type'                : '必须为{0}类型。',
      'shouldBeIntType'              : '必须为整数。',
      'shouldBeNumberType'           : '必须为整数。',
      'shouldNotBeEmptyString'       : '不能未空。',
      'shouldBeInteger'              : '必须为整数。',
      'shouldBePositiveIntegerOrZero': '必须为大于或等于零的整数。',
      'shouldBePositiveInteger'      : '必须为大于零的整数。',
      'shouldBeNegativeIntegerOrZero': '必须为小于于或等于零的整数。',
      'shouldBeNegativeInteger'      : '必须为小于于零的整数。',
      'shouldGreaterEqualThan_'      : '必须大于或等于{0}。',
      'shouldLessEqualThan_'         : '必须小于或等于{0}。',
      'shouldBe_'                    : '必须为{0}。',
      'shouldBeAnyOf_'               : '必须为{0}中之一。',
      'shouldNotBeAnyOf_'            : '不能为{0}中之一。',
      'lengthShouldGreaterEqualThan_': '长度必须大于或等于{0}。',
      'lengthShouldLessEqualThan_'   : '长度必须小于或等于{0}。',
      'lengthShouldBe_'              : '长度必须为{0}。',
      'shouldBeEmail'                : '必须为邮箱地址。',
    },
  };

  window.coreTranslates = function() {
    var args = Array.prototype.slice.call(arguments);
    var locale = $.cookie(_WEB_CLIENT_LOCALE_COOKIE) || DEFAULT_LOCALE;
    var key    = args.shift();

    if (!(locale in TRANSLATES)) {
      locale = DEFAULT_LOCALE;
    }

    if (!(key in TRANSLATES[locale])) {
      return key;
    }

    args.unshift(TRANSLATES[locale][key]);

    return toolkit.strf.apply(null, args);
  };
});
