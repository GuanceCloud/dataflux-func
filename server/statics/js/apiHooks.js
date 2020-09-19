$(function() {
  var apiHooks = window.apiHooks = {};

  // nope
  apiHooks.nope = function() {
    console.log('OK');
  };

  // Save API XAuthToken
  apiHooks.saveAPIXAuthToken = function(d, s, jqXHR, $submitter) {
    core.saveAPIXAuthToken(d.data.xAuthToken);

    var nextURL = toolkit.getQuery(location.href).nextURL;
    if (nextURL) {
      core.goToURL(toolkit.fromBase64(nextURL));
    } else {
      core.goToDashboard();
    }
  };

  // Clear API XAuthToken
  apiHooks.removeXAuthToken = function(d, s, jqXHR, $submitter) {
    core.removeXAuthToken();
  };

  // Alert
  apiHooks.alert = function(d, s, jqXHR, $submitter) {
    var title = '';
    var content = '<pre class="wat-plain-text">' + JSON.stringify(d, null, 2) + '</pre>';
    core.showInfoModal(title, content);

    // Enable the clicked button.
    core.enableSubmitter($submitter);
  };

  // Reload the page
  apiHooks.reload = function(d, s, jqXHR, $submitter) {
    core.reload();
  };

  // Go Back
  apiHooks.goBack = function(d, s, jqXHR, $submitter) {
    core.goBack();
  };

  // Go Index
  apiHooks.goToIndex = function(d, s, jqXHR, $submitter) {
    core.goToIndex();
  };

  // Show help block
  apiHooks.showHelpBlock = function(d, s, jqXHR, $submitter) {
    core.showHelpBlock(d.reason, d.detail);

    // Enable the clicked button.
    core.enableSubmitter($submitter);
  };
});
