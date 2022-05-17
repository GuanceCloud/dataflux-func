'use strict';

var sqlstring = require('sqlstring');
sqlstring._escapeId = sqlstring.escapeId;
sqlstring.escapeId = function(value) {
  return sqlstring._escapeId(value, true).replace(/`/g, '');
};