$(function() {
  var CLIENT_CONFIG = toolkit.getClientConfig();

  var _WEB_DRY_RUN_MODE_HEADER = CLIENT_CONFIG._WEB_DRY_RUN_MODE_HEADER;

  /**
   * Fire when params/query changed.
   */
  var changeTryParams = function() {
    var apiId = $(this).attr('target-api');

    var params = {};
    $(toolkit.strf('[target-api={0}][handler=options][category=params]', apiId)).each(function() {
      var v = ($(this).val() || '').toString().trim() || null;

      if (!toolkit.isNothing(v)) {
        params[$(this).attr('name')] = $(this).val().trim() || null;
      }
    });

    var query = {};
    $(toolkit.strf('[target-api={0}][handler=options][category=query]', apiId)).each(function() {
      var v = ($(this).val() || '').toString().trim() || null;

      if (!toolkit.isNothing(v)) {
        query[$(this).attr('name')] = v;
      }
    });

    var $api = $(toolkit.strf('[target-api={0}].apiurl', apiId));

    var baseURL = $api.attr('base-url');
    var targetURL = toolkit.createFullURL(baseURL, params, query);

    targetURL = decodeURIComponent(targetURL);
    var showTargetURL = '';
    targetURL.split(/[?&]/).forEach(function(param, index) {
      if (index === 0) {
        showTargetURL += param;
      } else if (index === 1) {
        showTargetURL += '?' + param;
      } else if (index > 1) {
        showTargetURL += '&' + param;
      }
      showTargetURL += '\n';
    });

    $api.text(showTargetURL);
    hljs.highlightBlock($api[0]);
  };

  /**
   * Fire when `Body` textarea changed.
   */
  var autoFormatBody = function() {
    var $this = $(this);
    try {
      var formattedJSON = JSON.stringify(JSON.parse($this.val()), null, 2);
      $this.val(formattedJSON);
    } catch(ex) {
      // Do nothing...
    }
  };

  /**
   * Fire when `Reset` button is clicked.
   */
  var resetTryParams = function() {
    var $this    = $(this);
    var apiId    = $this.attr('target-api');
    var category = $this.attr('category');
    var name     = $this.attr('name');

    var $target = $(toolkit.strf(
      '[target-api="{0}"][handler="options"][category="{1}"][name="{2}"]',
      apiId, category, name));

    $target.val($target.attr('default-value')).change();
  };

  /**
   * Call API with params/query/body.
   */
  var callAPI = function() {
    $this = $(this);
    var apiId = $this.attr('target-api');
    var $api = $(toolkit.strf('[target-api={0}][base-url]', apiId));

    var targetURL       = $api.text();
    var targetAPIMethod = $this.attr('target-api-method');

    var $bodyTextArea = $(toolkit.strf('[target-api={0}][handler=options][category=body]', apiId));
    var postData = $bodyTextArea.val() || undefined;

    // Check JSON
    if (postData) {
      try {
        JSON.parse(postData);

      } catch(ex) {
        $bodyTextArea.parents('.form-group:first').addClass('has-error');
        $('#badJSONBody').text(postData);
        $('#badJSONBodyModal').modal();

        return;
      }
    }

    var headers = {};
    $(toolkit.strf('[target-api={0}][handler=options][category=headers]', apiId)).each(function() {
      var v = $(this).val().trim() || null;

      if (!toolkit.isNothing(v)) {
        headers[$(this).attr('name')] = $(this).val().trim() || null;
      }
    });

    if ($('#dryRunMode').prop('checked')) {
      headers[_WEB_DRY_RUN_MODE_HEADER] = 'true';
    }

    var xAuthHeader = $('#xAuthHeader').val();
    var xAuthToken = localStorage.getItem(xAuthHeader);

    if (xAuthHeader && xAuthToken) {
      headers[xAuthHeader] = xAuthToken;
    }

    var showAPIResult = function(data, status) {
      $apiResultRequestInfo  = $('#apiResultRequestInfo code');
      $apiResultRequestBody  = $('#apiResultRequestBody code');
      $apiResultResponseInfo = $('#apiResultResponseInfo code');
      $apiResultResponseBody = $('#apiResultResponseBody code');

      var requestInfoDump = targetAPIMethod.toUpperCase() + ' ' + targetURL + '\n';
      for (var k in headers) if (headers.hasOwnProperty(k)) {
        requestInfoDump += k + ': ' + headers[k] + '\n';
      }
      var requestBodyDump = postData ? JSON.stringify(JSON.parse(postData), null, 2).toString() : '';

      $apiResultRequestInfo.text(requestInfoDump || '<NONE>');
      $apiResultRequestBody.text(requestBodyDump || '<NONE>');

      var responseInfoDump = 'STATUS CODE: ' + status + '\n';
      var responseBodyDump = JSON.stringify(data, null, 2);
      $apiResultResponseInfo.text(responseInfoDump || '<NONE>');
      $apiResultResponseBody.text(responseBodyDump || '<NONE>');

      hljs.highlightBlock($apiResultRequestInfo[0]);
      hljs.highlightBlock($apiResultRequestBody[0]);
      hljs.highlightBlock($apiResultResponseInfo[0]);

      if (responseBodyDump.length < 5000) {
        hljs.highlightBlock($apiResultResponseBody[0]);
      }

      $('#apiResultModal').modal();
    };

    toolkit.callAPI({
      method          : targetAPIMethod.toLowerCase(),
      url             : encodeURI(targetURL.split('\n').join('')),
      headers         : headers,
      body            : postData,
      autoRedirectAuth: false,
    }, {
      ok: showAPIResult,
      ng: showAPIResult,
    });

    return false;
  };

  /**
   * Back to API document page TOP.
   */
  var backToTop = function() {
    $(document).scrollTop(0);
  };

  /**
   * Collapse All API documents.
   */
  var collapseAll = function() {
    $('.collapse').collapse('hide');
  };

  /**
   * Expand All API documents.
   */
  var expandAll = function() {
    $('.collapse').collapse('show');
  };

  /**
   * Filter route doc
   */
  var routeDocFilter = function() {
    var keyword = $('#routeDocFilter').val().trim().toLowerCase();
    $.cookie('routeDocFilter', keyword);

    var $docSection = $('[doc-section]');
    if (!keyword) {
      $docSection.show();

    } else {
      $docSection.each(function() {
        var $this = $(this);

        var searchTarget = $this.find('div.panel-heading').text().toLowerCase();
        if (searchTarget.indexOf(keyword) >= 0) {
          $this.show();
        } else {
          $this.hide();
        }
      });
    }
  };

  /**
   * Reset route doc filter
   */
  var resetRouteDocFilter = function() {
    $('#routeDocFilter').val('');
    routeDocFilter();
  };

  /* Event Binding */
  $(document).on('keyup change', '[handler=options]', changeTryParams);
  $(document).on('change', '[handler=options][category=body]', autoFormatBody);
  $(document).on('click', '[handler=reset]', resetTryParams);

  $(document).on('click', '[handler=run]', callAPI);

  $(document).on('click', '#backToTop', backToTop);
  $(document).on('click', '#collapseAll', collapseAll);
  $(document).on('click', '#expandAll', expandAll);

  $(document).on('keyup', '#routeDocFilter', routeDocFilter);
  $(document).on('click', '#resetRouteDocFilter', resetRouteDocFilter);

  // Fill route Doc filter
  var routeDocFilterKeyword = $.cookie('routeDocFilter');
  $('#routeDocFilter').val(routeDocFilterKeyword);
  routeDocFilter();

  // Show Route Doc Filter Tip
  if (!$.cookie('routeDocFilter')) {
    var $routeDocFilter = $('#routeDocFilter');

    $routeDocFilter.tooltip({
      trigger  : 'manual',
      placement: 'top',
      title    : $routeDocFilter.attr('tip'),
      html     : true,
    }).tooltip('show');

    $routeDocFilter.next().find('.tooltip-inner').css('font-size', '20px');
    $routeDocFilter.next().css('top', '-75px');

    var $tipElem = $routeDocFilter.next();
    for (var i = 0; i < 3; i++) {
      $tipElem.effect( "bounce", {
        times : 1,
        easing: 'easeInOutQuad'
      }, 500);
    }

    setTimeout(function() {
      $routeDocFilter.tooltip('destroy');
    }, 10000);
  }

  // Jump to route Doc
  var $apiToGo = $('#' + toolkit.getQuery(location.href).apiId);
  if ($apiToGo.length > 0) {
    $apiToGo.find('.panel-heading').click();
    $(document).scrollTop($apiToGo.offset().top - 80);
  }
});
