window.onload = function() {
  var vuexData = JSON.parse(localStorage.getItem('vuex')) || {};
  var apiDocPath = `/api?lang=${vuexData.uiLocale || 'zh-CN'}`;

  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    url: location.host === 'localhost:8081' ? 'http://localhost:8089' + apiDocPath : apiDocPath,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    docExpansion: "none",
    displayRequestDuration: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      if (vuexData.xAuthToken) {
        req.headers['X-Dff-Auth-Token'] = vuexData.xAuthToken;
      }

      return req;
    },
    responseInterceptor: (resp) => {
      if (resp.status === 401) {
        console.warn('User not signed in, redirect to /');
        location.href = '/';
        return;
      }

      return resp;
    },
  });

  //</editor-fold>
};
