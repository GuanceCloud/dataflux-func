'use strict';

/* Built-in Modules */
var util = require('util');

/* 3rd-party Modules */
var mysql     = require('mysql2');
var sqlstring = require('sqlstring');
var moment    = require('moment-timezone');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

var jsonExtractCompatible = function(field) {
  if (field.indexOf('->') < 0) return field;

  var arrowExpr = '->';
  if (field.indexOf('->>') >= 0) {
    arrowExpr = '->>';
  }

  var _fieldAs = field.split(' AS ');
  var _fieldJSONPath = _fieldAs[0].split(arrowExpr);
  var _field = _fieldJSONPath[0];
  var _path  = _fieldJSONPath[1];

  var jsonExtractField = '';
  if (arrowExpr === '->') {
    jsonExtractField = toolkit.strf('JSON_EXTRACT({0}, {1})', _field, sqlstring.escape(_path));

  } else if (arrowExpr === '->>') {
    jsonExtractField = toolkit.strf('JSON_UNQUOTE(JSON_EXTRACT({0}, {1}))', _field, sqlstring.escape(_path));
  }

  _fieldAs[0] = jsonExtractField
  return _fieldAs.join(' AS ');
};

function getConfig(c) {
  return {
    host           : c.host,
    port           : c.port,
    user           : c.user,
    password       : c.password,
    database       : c.database,
    charset        : c.charset,
    timezone       : c.timezone,
    connectionLimit: CONFIG._MYSQL_CONNECTION_LIMIT_SERVER,
    connectTimeout : CONFIG._MYSQL_CONNECT_TIMEOUT * 1000,

    multipleStatements: true,
    enableKeepAlive   : true,
  };
};

/* Singleton Client */
var CLIENT_CONFIG = null;
var CLIENT        = null;

/**
 * @constructor
 * @param  {Object}  [logger=null]
 * @param  {Object}  [config=null]
 * @param  {Boolean} [debug=false]
 * @return {Object} - MySQL Helper
 */
var MySQLHelper = function(logger, config, debug) {
  this.logger = logger || logHelper.createHelper();

  this.isDryRun = false;
  this.skipLog  = false;

  this.uniqueKeyErrorCode   = 'ER_DUP_ENTRY';
  this.uniqueKeyErrorRegExp = /for key \'(.+)\'/;

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
    this.client = mysql.createPool(getConfig(this.config));

  } else {
    if (!CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.MYSQL_HOST,
        port    : CONFIG.MYSQL_PORT,
        user    : CONFIG.MYSQL_USER,
        password: CONFIG.MYSQL_PASSWORD,
        database: CONFIG.MYSQL_DATABASE,
        charset : CONFIG._MYSQL_CHARSET,
        timezone: CONFIG._MYSQL_TIMEZONE,
      });
      CLIENT = mysql.createPool(getConfig(CLIENT_CONFIG));
    }

    this.config = CLIENT_CONFIG;
    this.client = CLIENT;
  }

  var self = this;
  self.whereSqlGenerator = {
    raw: function(f, v) {
      var sql = v;
      return sql;
    },
    isnull: function(f, v) {
      if (toolkit.toBoolean(v)) {
        return toolkit.strf('{0} IS NULL', f);
      } else {
        return toolkit.strf('{0} IS NOT NULL', f);
      }
    },
    isnotnull: function(f, v) {
      if (toolkit.toBoolean(v)) {
        return toolkit.strf('{0} IS NOT NULL', f);
      } else {
        return toolkit.strf('{0} IS NULL', f);
      }
    },
    isempty: function(f, v) {
      if (toolkit.toBoolean(v)) {
        return toolkit.strf("{0} IS NULL OR TRIM({0}) = ''", f);
      } else {
        return toolkit.strf("{0} IS NOT NULL AND TRIM({0}) != ''", f);
      }
    },
    isnotempty: function(f, v) {
      if (toolkit.toBoolean(v)) {
        return toolkit.strf("{0} IS NOT NULL AND TRIM({0}) != ''", f);
      } else {
        return toolkit.strf("{0} IS NULL OR TRIM({0}) = ''", f);
      }
    },
    boolean: function(f, v) {
      return toolkit.strf('{0} = {1}', f, toolkit.toBoolean(v));
    },
    eq: function(f, v) {
      return toolkit.strf('{0} = {1}', f, self.escape(v));
    },
    eqwithnull: function(f, v) {
      if (v === '_NULL') {
        return toolkit.strf('{0} IS NULL', f);
      } else {
        return toolkit.strf('{0} = {1}', f, self.escape(v));
      }
    },
    eqornull: function(f, v) {
      return toolkit.strf('{0} = {1} OR {0} IS NULL', f, self.escape(v));
    },
    ne: function(f, v) {
      return toolkit.strf('{0} != {1}', f, self.escape(v));
    },
    neornull: function(f, v) {
      return toolkit.strf('{0} != {1} OR {0} IS NULL', f, self.escape(v));
    },
    gt: function(f, v) {
      return toolkit.strf('{0} > {1}', f, self.escape(v));
    },
    lt: function(f, v) {
      return toolkit.strf('{0} < {1}', f, self.escape(v));
    },
    ge: function(f, v) {
      return toolkit.strf('{0} >= {1}', f, self.escape(v));
    },
    le: function(f, v) {
      return toolkit.strf('{0} <= {1}', f, self.escape(v));
    },
    like: function(f, v) {
      return toolkit.strf("{0} LIKE {1}", f, self.escape('%' + v + '%'));
    },
    like_ci: function(f, v) {
      return toolkit.strf("LOWER({0}) LIKE LOWER({1})", f, self.escape('%' + v + '%'));
    },
    notlike: function(f, v) {
      return toolkit.strf("{0} NOT LIKE {1}", f, self.escape('%' + v + '%'));
    },
    notlike_ci: function(f, v) {
      return toolkit.strf("LOWER({0}) NOT LIKE LOWER({1})", f, self.escape('%' + v + '%'));
    },
    prelike: function(f, v) {
      return toolkit.strf("{0} LIKE {1}", f, self.escape(v + '%'));
    },
    prelike_ci: function(f, v) {
      return toolkit.strf("LOWER({0}) LIKE LOWER({1})", f, self.escape(v + '%'));
    },
    suflike: function(f, v) {
      return toolkit.strf("{0} LIKE {1}", f, self.escape('%' + v));
    },
    suflike_ci: function(f, v) {
      return toolkit.strf("LOWER({0}) LIKE LOWER({1})", f, self.escape('%' + v));
    },
    pattern: function(f, v) {
      if (v.indexOf('*') > -1) {
        return toolkit.strf("{0} REGEXP {1}", f, self.escape(toolkit.genRegExpByWildcard(v)));
      } else {
        return toolkit.strf('{0} = {1}', f, self.escape(v));
      }
    },
    notpattern: function(f, v) {
      if (v.indexOf('*') > -1) {
        return toolkit.strf("{0} NOT REGEXP {1}", f, self.escape(toolkit.genRegExpByWildcard(v)));
      } else {
        return toolkit.strf('{0} != {1}', f, self.escape(v));
      }
    },
    in: function(f, v) {
      v = toolkit.asArray(v);

      var values = [];
      for (var i = 0; i < v.length; i++) {
        values.push(self.escape(v[i]));
      }

      return toolkit.strf('{0} IN ({1})', f, values.join(', '));
    },
    notin: function(f, v) {
      v = toolkit.asArray(v);

      var values = [];
      for (var i = 0; i < v.length; i++) {
        values.push(self.escape(v[i]));
      }

      return toolkit.strf('{0} NOT IN ({1})', f, values.join(', '));
    },
    fulltext: function(f, v) {
      var searchWords = [];
      v.split(' ').forEach(function(w) {
        w = w.trim();
        if (w) {
          searchWords.push('"' + self.escape(w) + '"');
        }
      });
      var searchWord = searchWords.join(' ');
      return toolkit.strf('MATCH({0}) AGAINST({1} IN BOOLEAN MODE)', f, searchWord);
    },
    jsonArrayHas: function(f, v) {
      // return toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape('"' + v + '"'));
      return toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape(JSON.stringify(v)));
    },
    jsonArrayHasAny: function(f, v) {
      v = toolkit.asArray(v);

      var sqlParts = [];
      for (var i = 0; i < v.length; i++) {
        // sqlParts.push(toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape('"' + v[i] + '"')));
        sqlParts.push(toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape(JSON.stringify(v[i]))));
      }

      return sqlParts.join(' OR ');
    },
    jsonArrayHasAll: function(f, v) {
      v = toolkit.asArray(v);

      var sqlParts = [];
      for (var i = 0; i < v.length; i++) {
        // sqlParts.push(toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape('"' + v[i] + '"')));
        sqlParts.push(toolkit.strf('JSON_CONTAINS({0}, {1})', f, self.escape(JSON.stringify(v[i]))));
      }

      return sqlParts.join(' AND ');
    },
    jsonSearchOne: function(f, v) {
      var _fieldJSONPath = f.split('->');
      var _field = _fieldJSONPath[0];
      var _path  = _fieldJSONPath[1];

      return toolkit.strf("JSON_SEARCH({0}, 'one', {1}, NULL, {2}) IS NOT NULL", _field, self.escape(v), self.escape(_path));
    },
    jsonSearchNone: function(f, v) {
      var _fieldJSONPath = f.split('->');
      var _field = _fieldJSONPath[0];
      var _path  = _fieldJSONPath[1];

      return toolkit.strf("JSON_SEARCH({0}, 'one', {1}, NULL, {2}) IS NULL", _field, self.escape(v), self.escape(_path));
    },
    jsonSearchAny: function(f, v) {
      v = toolkit.asArray(v);

      var _fieldJSONPath = f.split('->');
      var _field = _fieldJSONPath[0];
      var _path  = _fieldJSONPath[1];

      var sqlParts = [];
      for (var i = 0; i < v.length; i++) {
        sqlParts.push(toolkit.strf("JSON_SEARCH({0}, 'one', {1}, NULL, {2}) IS NOT NULL", _field, self.escape(v[i]), self.escape(_path)));
      }

      return sqlParts.join(' OR ');
    },
    jsonSearchAll: function(f, v) {
      v = toolkit.asArray(v);

      var _fieldJSONPath = f.split('->');
      var _field = _fieldJSONPath[0];
      var _path  = _fieldJSONPath[1];

      var sqlParts = [];
      for (var i = 0; i < v.length; i++) {
        sqlParts.push(toolkit.strf("JSON_SEARCH({0}, 'one', {1}, NULL, {2}) IS NOT NULL", _field, self.escape(v[i]), self.escape(_path)));
      }

      return sqlParts.join(' AND ');
    },
  };
  self.whereSqlGenerator['=']              = self.whereSqlGenerator.eq;
  self.whereSqlGenerator['==']             = self.whereSqlGenerator.eq;
  self.whereSqlGenerator['!=']             = self.whereSqlGenerator.ne;
  self.whereSqlGenerator['<>']             = self.whereSqlGenerator.ne;
  self.whereSqlGenerator['<']              = self.whereSqlGenerator.lt;
  self.whereSqlGenerator['>']              = self.whereSqlGenerator.gt;
  self.whereSqlGenerator['<=']             = self.whereSqlGenerator.le;
  self.whereSqlGenerator['>=']             = self.whereSqlGenerator.ge;
  self.whereSqlGenerator['contains']       = self.whereSqlGenerator.like;
  self.whereSqlGenerator['contains_ci']    = self.whereSqlGenerator.like_ci;
  self.whereSqlGenerator['notcontains']    = self.whereSqlGenerator.notlike;
  self.whereSqlGenerator['notcontains_ci'] = self.whereSqlGenerator.notlike_ci;

  self.transConn = null;
  self.transConnRing = 0;
};

/**
 * Close the DB connection
 */
MySQLHelper.prototype.close = function() {
  // Can not close the default DB connection/pool
  if (CLIENT === this.client) return;

  this.client.end();
};

/**
 * Run SQL statement.
 *
 * @param  {String}   sql       - SQL statement
 * @param  {*[]}      sqlParams - SQL parameters
 * @param  {Function} callback
 * @return {undefined}
 */
MySQLHelper.prototype.query = function(sql, sqlParams, callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  // if (sqlParams) {
  //   for (var i = 0; i < sqlParams.length; i++) {
  //     if (Array.isArray(sqlParams[i]) && sqlParams[i].length <= 0) {
  //       return callback();
  //     }
  //   }
  // }

  sql = self.format(sql.toString(), sqlParams).trim();

  if (!self.transConn) {
    if (!self.skipLog) {
      self.logger.debug('[MYSQL] Query `{0}`', sql.replace(/\s+/g, ' '));
    }

    // Single Query
    if (!self.isDryRun || sql.trim().indexOf('SELECT') === 0) {
      return self.client.query(sql, null, callback);
    } else {
      return callback();
    }

  } else {
    // Transaction Query
    if (!self.skipLog) {
      self.logger.debug('[MYSQL] Trans Query `{0}`', sql.replace(/\s+/g, ' '));
    }

    return self.transConn.query(sql, null, callback);
  }
};

/**
 * Get a connection from connection pool and start a transaction.
 *
 * @param  {Function} callback
 * @return {undefined}
 */
MySQLHelper.prototype.startTrans = function(callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  if (self.transConn) {
    self.transConnRing++;

    if (!self.skipLog) {
      self.logger.debug('[MYSQL] Enter ring {0} -> {1} (by START)',
        self.transConnRing - 1,
        self.transConnRing
      );
    }

    return callback();
  }

  self.client.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function(err) {
      if (err) {
        conn.release()

        return callback(err);

      } else {
        self.transConn = conn;
        self.transConnRing++;

        if (!self.skipLog) {
          self.logger.debug('[MYSQL] Trans START');
        }

        return callback();
      }
    });
  });
};

/**
 * Commit the transaction.
 *
 * @param  {Function} callback
 * @return {undefined}
 */
MySQLHelper.prototype.commit = function(callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  if (self.isDryRun) return self.rollback(callback);

  if (!self.transConn) {
    if (!self.skipLog) {
      self.logger.warning('[MYSQL] Trans COMMIT (Transaction not started, skip)');
    }
    return callback();

  } else {
    self.transConnRing--;

    if (self.transConnRing <= 0) {
      self.transConn.commit(function(err) {
        self.transConn.release();
        self.transConn = null;

        if (!self.skipLog) {
          self.logger.debug('[MYSQL] Trans COMMIT');
        }

        return callback(err);
      });

    } else {
      if (!self.skipLog) {
        self.logger.debug('[MYSQL] Leave ring {0} <- {1} (by COMMIT)',
          self.transConnRing,
          self.transConnRing + 1
        );
      }

      return callback();
    }
  }
};

/**
 * Rollback the transaction.
 *
 * @param  {Function} callback
 * @return {undefined}
 */
MySQLHelper.prototype.rollback = function(callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  if (!self.transConn) {
    if (!self.skipLog) {
      self.logger.warning('[MYSQL] Trans ROLLBACK (Transaction not started, skip)');
    }
    return callback();

  } else {
    self.transConnRing--;

    if (self.transConnRing <= 0) {
      self.transConn.rollback(function() {
        self.transConn.release();
        self.transConn = null;

        if (!self.skipLog) {
          self.logger.debug('[MYSQL] Trans ROLLBACK');
        }

        return callback();
      });

    } else {
      if (!self.skipLog) {
        self.logger.debug('[MYSQL] Leave ring {0} <- {1} (by ROLLBACK)',
          self.transConnRing,
          self.transConnRing + 1
        );
      }

      return callback();
    }
  }
};

/**
 * @param  {String} sql - Original SQL statement
 * @param  {Object} options - Paging options
 * @param  {Number} [options.pageNumber] - Page number
 * @param  {Number} [options.pageSize]   - Page Size
 * @return {String} SQL statement with `LIMIT` and `FOUND_ROWS()` statements.
 */
MySQLHelper.prototype.pagedSQL = function(sql, options) {
  var self = this;

  if (!options) return sql;

  var pageSize  = options.pageSize;
  var pageIndex = options.pageIndex;

  sql = sql.trim();

  if (options.pagingStyle === true || options.pagingStyle === 'normal') {
    sql = sql.replace('SELECT', 'SELECT SQL_CALC_FOUND_ROWS');
    sql += toolkit.strf(' LIMIT {0}, {1}; SELECT FOUND_ROWS() AS totalCount;',
                        self.escape(pageIndex),
                        self.escape(pageSize));

  } else if (options.pagingStyle === 'simple') {
    sql += toolkit.strf(' LIMIT {0}, {1};',
                        self.escape(pageIndex),
                        self.escape(pageSize));

  } else if (options.pagingStyle === 'marker') {
    sql += toolkit.strf(' LIMIT {0};',
                        self.escape(pageSize));
  }

  return sql;
};

/**
 * Get page infomation from DB result by paging setting.
 *
 * @param  {Object}   options - Paging options
 * @param  {Object[]} dbRes
 * @return {Object}
 */
MySQLHelper.prototype.getPageInfo = function(options, dbRes) {
  if (!options) return null;

  var pageInfo = {
    pagingStyle: options.pagingStyle,
    pageSize   : options.pageSize,
  }

  if (options.pagingStyle === true || options.pagingStyle === 'normal') {
    pageInfo.count       = dbRes[0].length;
    pageInfo.totalCount  = dbRes[1][0].totalCount;
    pageInfo.pageNumber  = options.pageNumber;
    pageInfo.pageCount   = Math.ceil(pageInfo.totalCount / pageInfo.pageSize);
    pageInfo.isFirstPage = pageInfo.pageNumber <= 1;

  } else if (options.pagingStyle === 'simple') {
    pageInfo.count       = dbRes.length;
    pageInfo.pageNumber  = options.pageNumber;
    pageInfo.isFirstPage = pageInfo.pageNumber <= 1;

  } else if (options.pagingStyle === 'marker') {
    pageInfo.count           = dbRes.length;
    pageInfo.pageMarkerField = null;
    pageInfo.pageMarker      = null;
    pageInfo.isFirstPage     = null;

    if (dbRes.length > 0 && options.pageMarkerField) {
      pageInfo.pageMarkerField = options.pageMarkerField.split('.').pop();
      pageInfo.pageMarker      = dbRes[dbRes.length - 1][pageInfo.pageMarkerField];
    }

    pageInfo.isFirstPage = options.pageMarker <= 0;
  }

  return pageInfo;
};

/**
 * Get data from DB result when paging is setted.
 *
 * @param  {Object}   options - Paging options
 * @param  {Object[]} dbRes
 * @return {Object}
 */
MySQLHelper.prototype.getData = function(options, dbRes) {
  if (!options) return dbRes;

  if (options.pagingStyle === true || options.pagingStyle === 'normal') {
    return dbRes[0];
  } else {
    return dbRes;
  }
};

/**
 * Convert Date object to string for SQL parameters.
 *
 * @param  {*[]} sqlParams
 * @return {*[]}
 */
MySQLHelper.prototype.convertDate = function(sqlParams) {
  if (!Array.isArray(sqlParams) || !this.config.timezone) return sqlParams;

  for (var i = 0; i < sqlParams.length; i++) {
    var p = sqlParams[i];

    if (util.types.isDate(p)) {
      // Parameter
      sqlParams[i] = moment(p).utcOffset(this.config.timezone).format('YYYY-MM-DD HH:mm:ss');

    } else if (toolkit.isJSON(p)) {
      // Parameter in JSON
      for (var k in p) {
        var v = p[k];

        if (util.types.isDate(v)) {
          p[k] = moment(v).utcOffset(this.config.timezone).format('YYYY-MM-DD HH:mm:ss');
        }
      }
    }
  }

  return sqlParams;
};

/**
 * Format the SQL statement with parameters.
 *
 * @param  {String} sql
 * @param  {*[]}    sqlParams
 * @return {String}
 */
MySQLHelper.prototype.format = function(sql, sqlParams) {
  try {
    sqlParams = this.convertDate(sqlParams);
  } catch(err) {
    // nope
  }

  return sqlstring.format(sql, sqlParams);
};

/**
 * Escape the SQL parameter.
 *
 * @param  {*}      value
 * @return {String}
 */
MySQLHelper.prototype.escape = function(value) {
  return sqlstring.escape(value);
};

exports.MySQLHelper = MySQLHelper;
exports.createHelper = function(logger, config, debug) {
  return new MySQLHelper(logger, config, debug);
};
