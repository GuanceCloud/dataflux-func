'use strict';

/* Builtin Modules */
var fs   = require('fs-extra');
var path = require('path');

/* Project Modules */
var toolkit       = require('./toolkit');
var yamlResources = require('./yamlResources');

/* Load all translate files */
var translateFolderPath = path.join(__dirname, '../translates');
var files = fs.readdirSync(translateFolderPath);

for (var i = 0; i < files.length; i++) {
  if (!files[i].match(/\.translate\.yaml$/g)) continue;

  var fileName = files[i];
  var filePath = path.join(translateFolderPath, fileName);
  var locale = fileName.split('.')[0];

  yamlResources.loadFile(toolkit.strf('TRANSLATE-{0}', locale), filePath);
}

module.exports = function(originText, locale) {
  if (toolkit.isNothing(originText)) return '';
  originText = originText.toString();

  var translate = yamlResources.get(toolkit.strf('TRANSLATE-{0}', locale));

  // No translate, return origin text
  var translatedText = null;
  if (!translate || toolkit.isNullOrWhiteSpace(translate[originText])) {
    translatedText = originText;
  } else {
    translatedText = translate[originText];
  }

  return translatedText.split('__')[0].replace(/\\(.)/g, '$1');
};
