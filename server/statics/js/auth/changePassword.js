$(function() {
  $('[wat-api-for=submit]').on('click', function() {
    // Client extra check
    if ($('#newPassword').val() !== $('#confirmNewPassword').val()) {
      core.addClientError('EUserPassword.notMatch');
    }
  });
});
