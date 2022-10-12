'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

/**
 * Trans Scope
 * @param {Object} db
 */
var TransScope = function(db) {
  var self = this;

  self.db = db;
};

/**
 * Start the transaction scope (auto start)
 * @param  {Function} callback
 * @return {undefined}
 */
TransScope.prototype.start = function(callback) {
  var self = this;

  self.db.startTrans(callback);
};

/**
 * End the transaction scope (auto commit or rollback)
 * @param  {Object}   bizErr
 * @param  {Function} callback
 * @return {undefined}
 */
TransScope.prototype.end = function(err, callback) {
  var self = this;

  if (!self.db.transConn) return callback(err);

  if (err) {
    self.db.rollback(function(dbErr) {
      if (dbErr) return callback(dbErr);

      return callback(err);
    });

  } else {
    self.db.commit(function(dbErr) {
      if (dbErr) return callback(dbErr);

      return callback();
    });
  }
};

var TransScope = exports.TransScope = TransScope;
var createTransScope = exports.createTransScope = function(db) {
  return new TransScope(db);
};

/**
 * Create a Express.js middleware for generating paging setting.
 *
 * @param  {Object}   routeConfig - Route config
 * @return {Function}             - Express.js middleware
 */
exports.createRequestPagingCondition = function(routeConfig) {
  /**
   * @param  {Object} req                          - `Express.js` request object
   * @param  {Object} res                          - `Express.js` response object
   * @param  {Object} next                         - `Express.js` next callback
   * @return {Object} [res.locals.paging=null]     - Paging infomation
   * @return {Number} res.locals.paging.pageNumber
   * @return {Number} res.locals.paging.pageSize
   * @return {Number} res.locals.paging.pageIndex
   */
  return function createRequestPagingCondition(req, res, next) {
    if ((routeConfig.paging === false)
    || (routeConfig.paging !== false && toolkit.toBoolean(req.query.noPage))) {
      return next();
    }

    var paging = {
      pageIndex  : 0,
      pageNumber : 1,
      pageSize   : 10,
      pageMarker : 0,
      pagingStyle: routeConfig.paging === true ? 'normal' : routeConfig.paging,
    };

    if (routeConfig.orderFields) {
      paging.availablePageMarkerFields = toolkit.jsonValues(routeConfig.orderFields);
    }

    var pageSize = parseInt(req.query.pageSize || req.cookies[CONFIG._WEB_PAGE_SIZE_COOKIE]);
    if (pageSize && pageSize >= 1 && pageSize <= 100) {
      paging.pageSize = pageSize;
    }
    if (res.locals.requestType === 'page') {
      res.cookie(CONFIG._WEB_PAGE_SIZE_COOKIE, paging.pageSize);
    }

    if (routeConfig.paging === true || routeConfig.paging === 'normal' || routeConfig.paging === 'simple') {
      var pageNumber = parseInt(req.query.pageNumber);
      if (pageNumber && pageNumber >= 1 && pageNumber <= 99999) {
        paging.pageNumber = pageNumber;
      }

      paging.pageIndex = (paging.pageNumber - 1) * paging.pageSize;

    } else if (routeConfig.paging === 'marker') {
      var pageMarker = parseInt(req.query.pageMarker);
      if (pageMarker && pageMarker >= 0) {
        paging.pageMarker = pageMarker;
      }
    }

    res.locals.paging = paging;

    return next();
  };
};

/**
 * Create a Express.js middleware for generating SQL where condition.
 *
 * @param  {Object}   routeConfig - Route config.
 * @return {Function}             - Express.js middleware.
 */
exports.createRequestWhereCondition = function(routeConfig) {
  /**
   * @param  {Object} req                - `Express.js` request object
   * @param  {Object} res                - `Express.js` response object
   * @param  {Object} next               - `Express.js` next callback
   * @return {Object} res.locals.filters - Conditions from query
   */
  return function(req, res, next) {
    if (!routeConfig.query) {
      return next();
    }

    var reqQuery = toolkit.jsonCopy(req.query);
    var filters = res.locals.filters || {};

    if (toolkit.isNothing(reqQuery['_fulltextSearchField']) || toolkit.isNothing(reqQuery['_fulltextSearchWord'])) {
      delete reqQuery['_fulltextSearchField'];
      delete reqQuery['_fulltextSearchWord'];
    }

    if (routeConfig.fulltextSearchAsLIKE) {
      var fulltextSearchField = reqQuery['_fulltextSearchField'];
      var asLikeFields = toolkit.asArray(routeConfig.fulltextSearchAsLIKE[fulltextSearchField]);
      if (asLikeFields && !toolkit.isNothing(reqQuery['_fulltextSearchWord'])) {
        asLikeFields.forEach(function(f) {
          filters[f] = {like: reqQuery['_fulltextSearchWord']}
        });
      }

      delete reqQuery['_fulltextSearchField'];
      delete reqQuery['_fulltextSearchWord'];
    }

    for (var k in routeConfig.query) if (routeConfig.query.hasOwnProperty(k)) {
      var v = routeConfig.query[k];

      // Special extra options for filter
      if (k in reqQuery && k[0] === '_') {
        switch(k) {
          // Fuzzy Search
          case '_fuzzySearch':
            filters._fuzzySearch = {
              keys : toolkit.asArray(v.$searchKey),
              value: reqQuery[k],
            };
            break;

          // Full Text Search
          case '_fulltextSearchField':
            filters._fulltextSearch = filters._fulltextSearch || {};
            filters._fulltextSearch.key = toolkit.asArray(v.$searchKeyMap[reqQuery[k]] || null);
            break;
          case '_fulltextSearchWord':
            filters._fulltextSearch = filters._fulltextSearch || {};
            filters._fulltextSearch.value = reqQuery[k];

            break;
        }
      }

      // Not for SQL
      if (v.$skipSQL) continue;

      // Not for search
      if (!v.$searchType) continue;

      if (k in reqQuery && reqQuery.hasOwnProperty(k)) {
        var conditionKey   = v.$searchKey || k;
        var conditionValue = reqQuery[k];

        filters[conditionKey] = filters[conditionKey] || {};
        filters[conditionKey][v.$searchType] = toolkit.isNothing(reqQuery[k])
                                             ? undefined
                                             : reqQuery[k];
      }
    }

    res.locals.filters = filters;

    return next();
  };
};

/**
 * Create a Express.js middleware for extra condition.
 *
 * @param  {Object}   routeConfig - Route config.
 * @return {Function}             - Express.js middleware.
 */
exports.createRequestExtraCondition = function(routeConfig) {
  return function(req, res, next) {
    if (!routeConfig.query) {
      return next();
    }

    var extra = {};

    for (var k in routeConfig.query) if (routeConfig.query.hasOwnProperty(k)) {
      var v = routeConfig.query[k];

      // Normal filter
      if (k[0] !== '_') continue;

      // Not inputed filter
      if ('undefined' === typeof req.query[k]) continue;

      // Add to extra options
      var extraKey = k.slice(1);
      extra[extraKey] = req.query[k];
    }

    res.locals.extra = extra;

    return next();
  }
};

/**
 * Create a Express.js middleware for generating SQL order condition.
 *
 * @param  {Object}   routeConfig - Route config.
 * @return {Function}             - Express.js middleware
 */
exports.createRequestOrderCondition = function(routeConfig) {
  /**
   * @param  {Object} req               - `Express.js` request object
   * @param  {Object} res               - `Express.js` response object
   * @param  {Object} next              - `Express.js` next callback
   * @return {Object} res.locals.orders - Orders from query
   */
  return function(req, res, next) {
    if (routeConfig.method.toLowerCase() !== 'get' || !routeConfig.orderFields) {
      return next();
    }

    // Add order condition
    var orders = [];
    if (req.query.sort) {
      // New version
      req.query.sort.forEach(function(field) {
        var orderMethod = 'ASC';
        if (toolkit.startsWith(field, '-')) {
          orderMethod = 'DESC';
          field = field.slice(1).trim();
        }

        orders.push({
          field : routeConfig.orderFields[field],
          method: orderMethod,
        });
      });

    } else if (req.query.orderBy) {
      // Old version
      var orderMethod = req.query.orderMethod || 'ASC';
      orderMethod = orderMethod.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      orders.push({
        field : routeConfig.orderFields[req.query.orderBy],
        method: orderMethod,
      });
    }

    res.locals.orders = toolkit.isNothing(orders) ? null : orders;

    return next();
  };
};

/**
 * Add WHERE condition to search option
 * @param {[type]} options        [description]
 * @param {[type]} conditionKey   [description]
 * @param {[type]} searchType     [description]
 * @param {[type]} conditionValue [description]
 */
exports.addWhereCondition = function(options, conditionKey, searchType, conditionValue) {
  if (!options)         options         = {};
  if (!options.filters) options.filters = {};

  options.filters[conditionKey] = {};
  options.filters[conditionKey][searchType] = conditionValue;

  return options;
};

/**
 * @constructor
 * @param {Object} locals  - `Express.js` req.locals/app.locals
 * @param {Object} options - CRUD options
 * @param {String} options.tableName
 * @param {String} [options.alias=null]
 * @param {String} [options.userIdField=null]
 */
var Model = function(locals, options) {
  var self = this;

  options = options || {};

  // Basic
  self.locals = locals;

  self.logger = locals.logger;

  // Table/Data description
  self.displayName  = options.displayName  || 'data';
  self.entityName   = options.entityName   || 'data';
  self.tableName    = options.tableName    || null;
  self.viewName     = options.viewName     || null;
  self.alias        = options.alias        || self.tableName;
  self.idName       = options.idName       || self.entityName + 'Id';

  // Auto field filling
  // Field value to fill
  self.userId = toolkit.jsonFind(self, (options.userIdPath || 'locals.user.id'), true) || null;

  // Field name for ADD data
  self.userIdField = options.userIdField || null;

  self.allowExplicitUserId = options.allowExplicitUserId || false;

  // Field name for LIST/GET, VIEW/DELETE/MODIFY WHERE condition
  self.userIdLimitField = options.userIdLimitField || null;

  if (self.userIdLimitField) {
    self.userIdLimitField_select    = self.userIdLimitField;
    self.userIdLimitField_nonSelect = self.userIdLimitField.split('.').pop();
  }

  self.ignoreUserLimit = toolkit.toBoolean(options.ignoreUserLimit) || false;

  // Default orders
  self.defaultOrders = options.defaultOrders || [{field: toolkit.strf('{0}.seq', self.alias), method: 'DESC'}];

  // Data converting
  self.objectFields = toolkit.jsonCopy(options.objectFields || {});

  // DB
  self.db           = locals.db;
  self.uniqueKeyMap = options.uniqueKeyMap || {};

  // Cache DB
  self.cacheDB = locals.cacheDB;

  // File Storage
  self.fileStorage = locals.fileStorage;

  // Extra
  self.extra = toolkit.jsonCopy(options.extra || {});

  if ('function' === typeof options.afterCreated) {
    options.afterCreated(self);
  }
};

/**
 * Check DB Duplication Error and create a Server Error
 * @param  {Object}   [err] - DB Error
 * @return {undefined}
 */
Model.prototype.checkDuplicationError = function(err) {
  var self = this;

  if (!err) return null;

  if (err.code === self.db.uniqueKeyErrorCode) {
    var m = (err.sqlMessage || '').match(self.db.uniqueKeyErrorRegExp);
    if (m) {
      var key = m[1];
      return new E('EClientDuplicated', 'Duplicated data Key', { key: self.uniqueKeyMap[key] || key });
    }
  }

  return null;
};

/**
 * Generate a new data ID for this options.
 *
 * @return {String}
 */
Model.prototype.genDataId = function() {
  return toolkit.genDataId(this.alias);
};

/**
 * List records from DB.
 *
 * @param  {Object}   [options] - List options
 * @param  {Object[]} [options.fields=null]
 * @param  {Object}   [options.filters=null]
 * @param  {Object[]} [options.orders=null]
 * @param  {Object[]} [options.groups=null]
 * @param  {Object}   [options.paging=null]
 * @param  {Number}   [options.limit=null]
 * @param  {String}   [options.baseSQL=null]
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._list = Model.prototype.list = function(options, callback) {
  var self = this;

  options         = options         || {};
  options.filters = options.filters || {};
  options.extra   = options.extra   || {};

  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for a Model without a table name'));
  }
  if (!self.viewName && options.useView === true) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for a Model without a view name'));
  }

  if (!self.ignoreUserLimit && self.userIdLimitField_select) {
    options.filters[self.userIdLimitField_select] = {
      eq: self.userId,
    };
  }

  if (toolkit.isNothing(options.orders)
      && toolkit.isNothing(options.groups)
      && toolkit.isNothing(options.extra.fulltextSearchWord)) {
    options.orders = self.defaultOrders;
  }

  // Add paging or marker paging filter
  if (options.limit) {
    options.paging = {
      pagingStyle: 'simple',
      pageSize   : parseInt(options.limit),
      pageIndex  : 0,
    };

  } else if (options.paging && options.paging.pagingStyle === 'marker') {
    var pageMarkerField = null;
    var pageMarkerOrder = null;

    if (toolkit.isNothing(options.paging.availablePageMarkerFields)) {
      options.paging.availablePageMarkerFields = [toolkit.strf('{0}.seq', self.alias)];
    }

    if (!toolkit.isNothing(options.orders)) {
      for (var i = 0; i < options.orders.length; i++) {
        var o = options.orders[i];
        if (options.paging.availablePageMarkerFields.indexOf(o.field) > -1) {
          pageMarkerField = o.field;
          pageMarkerOrder = o.method ? o.method.toUpperCase() : 'ASC';

          options.paging.pageMarkerField = pageMarkerField;
          break;
        }
      }
    }

    if (pageMarkerField && options.paging.pageMarker > 0) {
      if (pageMarkerOrder === 'DESC') {
        options.filters[pageMarkerField] = {lt: options.paging.pageMarker};
      } else if (pageMarkerOrder === 'ASC') {
        options.filters[pageMarkerField] = {gt: options.paging.pageMarker};
      }
    }
  }

  // Generate SQL
  var selectStatement = options.baseSQL;
  if (!selectStatement) {
    selectStatement = toolkit.strf('SELECT * FROM {0}', options.useView ? self.viewName : self.tableName);
    if (self.alias) {
      selectStatement += toolkit.strf(' AS {0}', self.alias);
    }

    if (options.useIndex) {
      selectStatement += toolkit.strf(' USE INDEX ({0})', options.useIndex);
    }

  } else {
    if (options.useView) {
      selectStatement = selectStatement.replace(self.tableName, self.viewName);
    }
  }

  // Generate `WHERE` statement
  var whereStatement = '';
  if (!toolkit.isNothing(options.filters) || !toolkit.isNothing(options.paging)) {
    whereStatement = self.genWhereStatement(options.filters, {whereToken: true});
  }

  // Generate `GROUP BY` statement
  var groupStatement = '';
  if (!toolkit.isNothing(options.groups)) {
    groupStatement = self.genGroupByStatement(options.groups, {groupToken: true});
  }

  // Generate `ORDER BY` statement
  if (options.distinct && !toolkit.isNothing(options.orders) && !toolkit.isNothing(options.fields)) {
    var washedOrders = [];
    options.orders.forEach(function(order) {
      if (options.fields.indexOf(order.field) >= 0) {
        washedOrders.push(order);
      }
    });

    options.orders = washedOrders;
  }
  var orderStatement = self.genOrderStatement(options.orders, {orderToken: true});

  var sql = [
    selectStatement,
    whereStatement,
    groupStatement,
    orderStatement,
  ].join(' ');
  var sqlParams = [];

  // Specify fields
  options.fields = toolkit.asArray(options.fields);
  if (options.fields && options.fields.length > 0) {
    sql = sql.replace(/SELECT .+? FROM/g, 'SELECT ?? FROM');
    sqlParams.push(options.fields);
  }

  // Distinct
  if (options.distinct) {
    sql = sql.replace('SELECT', 'SELECT DISTINCT');
  }

  if (options.paging) {
    sql = self.db.pagedSQL(sql, options.paging);
  }

  var pageInfo = null;
  var dbData   = null;
  async.series([
    // Access DB
    function(asyncCallback) {
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        pageInfo = self.db.getPageInfo(options.paging, dbRes);
        dbData   = self.db.getData(options.paging, dbRes);

        // Convert complex data
        dbData = self.convertObject(dbData);

        return asyncCallback()
      });
    },
  ], function(err) {
    return callback && callback(err, dbData, pageInfo);
  });
};

/**
 * Count records from DB
 * @param  {Object}   options  - See `Model.prototype.list`.
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._count = Model.prototype.count = function(options, callback) {
  var self = this;

  var defaultSQL = toolkit.strf('SELECT * FROM {0}', self.tableName);
  if (self.alias) {
    defaultSQL += toolkit.strf(' AS {0}', self.alias);
  }

  options = options || {};
  options.baseSQL = options.baseSQL || defaultSQL;
  options.baseSQL = options.baseSQL.replace(
    /SELECT .+ FROM/g,
    'SELECT COUNT(*) AS count FROM'
  );

  options.orders = false;

  self._list(options, function(err, dbRes) {
    if (err) return callback && callback(err);
    return callback && callback(null, dbRes[0].count);
  });
};

/**
 * Count records by group from DB
 * @param  {Object}   options  - See `Model.prototype.list`.
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._countByGroup = Model.prototype.countByGroup = function(options, callback) {
  var self = this;

  options = options || {};
  options.extra = options.extra || {};

  var groupTimezone = '+08:00';
  if (options.extra.groupTimezone) {
    groupTimezone = options.extra.groupTimezone;
  }

  var groupBy = null;
  if (!toolkit.isNothing(options.extra.groupBy)) {
    groupBy = options.extra.groupBy;
  }

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  // sql.append('   MAX({0}.seq) AS maxSeq,', self.alias);
  // sql.append('   MIN({0}.seq) AS minSeq,', self.alias);
  sql.append('   COUNT(*) AS count');
  if (groupBy) {
    toolkit.asArray(groupBy).forEach(function(groupField) {
      if (groupField === 'YEAR_DAY' || groupField === 'DATE') {
        sql.append('  ,DATE_FORMAT(');
        sql.append("     CONVERT_TZ({0}.createTime, '+00:00', {1}),", self.alias, self.db.escape(groupTimezone));
        sql.append("     '%Y-%m-%d'");
        sql.append('   ) AS {0}', groupField);
      } else {
        sql.append('  ,{0}.{1}', self.alias, groupField);
      }
    });
  }

  sql.append('FROM {0} AS {1}', self.tableName, self.alias);

  options.baseSQL = sql.toString();

  if (groupBy) {
    options.groups = groupBy;
  }

  options.orders = false;

  return self._list(options, callback);
};

/**
 * Get latest record by group from DB
 * @param  {Object}   options  - See `Model.prototype.list`.
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._getLatest = Model.prototype.getLatest = function(options, callback) {
  var self = this;

  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   *');
  sql.append('FROM {0} AS {1}', self.tableName, self.alias);

  options.baseSQL = sql.toString();

  options.limit = 1;
  options.orders = [
    {
      field : toolkit.strf('{0}.seq', self.alias),
      method: 'DESC',
    },
  ];

  return self._list(options, function(err, dbRes) {
    if (err) return callback(err);

    dbRes = dbRes[0];

    return callback(null, dbRes);
  });
};

/**
 * Sum records from DB
 * @param  {Object}   options          - See `Model.prototype.list`.
 * @param  {String}   options.sumField - Field to sum.
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._sum = Model.prototype.sum = function(options, callback) {
  var self = this;

  var defaultSQL = toolkit.strf('SELECT * FROM {0}', self.tableName);
  if (self.alias) {
    defaultSQL += toolkit.strf(' AS {0}', self.alias);
  }

  options = options || {};
  options.baseSQL = options.baseSQL || defaultSQL;
  options.baseSQL = options.baseSQL.replace(
    /SELECT .+ FROM/g,
    toolkit.strf('SELECT SUM({0}) AS count FROM', options.sumField)
  );

  self._list(options, function(err, dbRes) {
    if (err) return callback && callback(err);
    return callback && callback(null, dbRes[0].count);
  });
};

/**
 * Get record from DB by Field and Value.
 *
 * @param  {String}        field
 * @param  {String|Number} value
 * @param  {String[]}      fields
 * @param  {Function}      callback
 * @return {undefined}
 */
Model.prototype._getByField = Model.prototype.getByField = function(targetField, targetValue, fields, callback) {
  var self = this;

  var opt = {
    limit  : 1,
    fields : fields,
    filters: {},
    orders : false,
  };
  opt.filters[targetField] = {eq: targetValue};

  self._list(opt, function(err, dbRes) {
    if (err) return callback && callback(err);

    return callback && callback(err, dbRes[0] || null);
  });
};

/**
 * Get record from DB by ID.
 *
 * @param  {String}    id
 * @param  {String[]}  fields
 * @param  {Function}  callback
 * @return {undefined}
 */
Model.prototype._get = Model.prototype.get = function(id, options, callback) {
  var self = this;

  var fields = options;
  if (!Array.isArray(options) && 'object' === typeof options && options) {
    fields = options.fields;
  }

  return self._getByField('id', id, fields, callback);
};

/**
 * Get record from DB by ID.
 * If nothing found, return an Error with `EClientNotFound`.
 *
 * @param  {String}    id
 * @param  {String[]}  fields
 * @param  {Function}  callback
 * @return {undefined}
 */
Model.prototype.__getWithCheck = function(method, id, options, callback) {
  var self = this;

  self[method](id, options, function(err, dbRes) {
    if (err) return callback(err);

    if (!dbRes) {
      return callback(new E('EClientNotFound', 'No such data', {
        entity: self.displayName,
        id    : id,
      }));
    }

    return callback(null, dbRes);
  });
};
Model.prototype._getWithCheck = function(id, options, callback) {return this.__getWithCheck('_get', id, options, callback); };
Model.prototype.getWithCheck  = function(id, options, callback) {return this.__getWithCheck('get',  id, options, callback); };

/**
 * Add record into DB.
 *
 * @param  {Object}   data
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._add = Model.prototype.add = function(data, callback) {
  var self = this;

  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for non-SQL database'));
  }

  if (!data.id) {
    data.id = self.genDataId();
  }

  if (self.userIdField && self.userId) {
    if (!self.allowExplicitUserId || !data[self.userIdField]) {
      data[self.userIdField] = self.userId;
    }
  }

  // Preapare data
  var fields = [];
  var values = [];
  for (var k in data) if (data.hasOwnProperty(k)) {
    fields.push(k);
    values.push(data[k]);
  }

  var sql = toolkit.strf('INSERT INTO {0} (??) VALUES (?)', self.tableName);
  var sqlParams = [fields, values];

  var transScope = createTransScope(self.db);
  async.series([
    // Start transaction
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // Access DB
    function(asyncCallback) {
      self.db.query(sql, sqlParams, function(err) {
        if (err) {
          err = self.checkDuplicationError(err) || err;
          return asyncCallback(err);
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    err = self.checkDuplicationError(err) || err;

    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback && callback(scopeErr);

      return callback && callback(null, data.id, data);
    });
  });
};

/**
 * Modify record in DB by ID.
 *
 * @param  {String}   id
 * @param  {Object}   data
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._modify = Model.prototype.modify = function(id, data, callback) {
  var self = this;

  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for non-SQL database'));
  }

  var updateDate = data;

  var sql = toolkit.strf('UPDATE {0} SET ? WHERE id = ?', self.tableName);
  var sqlParams = [updateDate, id];

  if (!self.ignoreUserLimit && self.userIdLimitField_nonSelect) {
    sql += ' AND ?? = ?';
    sqlParams.push(self.userIdLimitField_nonSelect, self.userId);
  }

  sql += ' LIMIT 1';

  var transScope = createTransScope(self.db);
  async.series([
    // Start transaction
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // Access DB
    function(asyncCallback) {
      if (toolkit.isNothing(updateDate)) return asyncCallback();

      self.db.query(sql, sqlParams, function(err) {
        if (err) {
          err = self.checkDuplicationError(err) || err;
          return asyncCallback(err);
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    err = self.checkDuplicationError(err) || err;

    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback && callback(scopeErr);

      return callback && callback(null, id, data);
    });
  });
};

/**
 * Set partial fields in DB by ID.
 *
 * @param  {String}   id
 * @param  {Object}   data
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._partialSet = Model.prototype.partialSet = function(id, data, callback) {
  var self = this;

  if (toolkit.isNothing(data)) {
    return callback && callback(null, id, data);
  }


  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for non-SQL database'));
  }

  var isIdExisted = false;

  var transScope = createTransScope(self.db);
  async.series([
    // Start transaction
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // Check if ID is existed
    function(asyncCallback) {
      var sql = toolkit.strf('SELECT seq FROM {0} WHERE id = ? LIMIT 1', self.tableName);
      var sqlParams = [id];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) isIdExisted = true;

        return asyncCallback();
      });
    },
    // Insert or Update
    function(asyncCallback) {
      var sql       = null;
      var sqlParams = null;
      if (isIdExisted) {
        sql = toolkit.strf('UPDATE {0} SET ? WHERE id = ? LIMIT 1', self.tableName);
        sqlParams = [data, id];

      } else {
        data.id = id;

        sql = toolkit.strf('INSERT INTO {0} SET ?', self.tableName);
        sqlParams = [data];
      }

      self.db.query(sql, sqlParams, asyncCallback);
    },
  ], function(err) {
    err = self.checkDuplicationError(err) || err;

    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback && callback(scopeErr);

      return callback && callback(null, id, data);
    });
  });
};

/**
 * Delete record in DB by ID.
 *
 * @param  {String}   id
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._delete = Model.prototype.delete = function(id, callback) {
  var self = this;

  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for non-SQL database'));
  }

  var sql = toolkit.strf('DELETE FROM {0} WHERE id = ?', self.tableName);
  var sqlParams = [id];

  if (!self.ignoreUserLimit && self.userIdLimitField) {
    sql += ' AND ?? = ?';
    sqlParams.push(self.userIdLimitField, self.userId);
  }

  sql += ' LIMIT 1';

  var transScope = createTransScope(self.db);
  async.series([
    // Start transaction
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // Access DB
    function(asyncCallback) {
      self.db.query(sql, sqlParams, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback && callback(scopeErr);

      return callback && callback(null, id);
    });
  });
};

/**
 * Delete records in DB by ID list.
 *
 * @param  {Array}   ids
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._deleteMany = Model.prototype.deleteMany = function(idList, callback) {
  if (toolkit.isNothing(idList)) return callback();

  var self = this;

  if (!self.tableName) {
    return callback && callback(new E('ESys', 'Cannot generate SQL for non-SQL database'));
  }

  var sql = toolkit.strf('DELETE FROM {0} WHERE id IN (?)', self.tableName);
  var sqlParams = [idList];

  if (!self.ignoreUserLimit && self.userIdLimitField) {
    sql += ' AND ?? = ?';
    sqlParams.push(self.userIdLimitField, self.userId);
  }

  sql += ' LIMIT ' + idList.length.toString();

  var transScope = createTransScope(self.db);
  async.series([
    // Start transaction
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // Access DB
    function(asyncCallback) {
      self.db.query(sql, sqlParams, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback && callback(scopeErr);

      return callback && callback(null, idList);
    });
  });
};

/**
 * Detect value exists on field.
 *
 * @param  {String}   field
 * @param  {*|*[]}    values
 * @param  {Function} callback
 * @return {undefined}
 */
Model.prototype._exists = Model.prototype.exists = function(field, values, callback) {
  if (toolkit.isNothing(values)) return callback();

  var valueMap = {};

  var values = toolkit.asArray(values);
  values.forEach(function(v) {
    valueMap[v] = true;
  });


  var opt = {
    fields : [field],
    filters: {},
  };

  if (values.length <= 1) {
    opt.filters[field] = {eq: values}
  } else {
    opt.filters[field] = {in: values}
  }

  this._list(opt, function(err, dbRes) {
    if (err) return callback(err);

    dbRes.forEach(function(d) {
      var v = d[field];

      if (valueMap[v]) {
        valueMap[v] = false;
      }
    });

    var existedValues    = [];
    var notExistedValues = [];
    for (var v in valueMap) if (valueMap.hasOwnProperty(v)) {
      if (valueMap[v]) {
        notExistedValues.push(v);
      } else {
        existedValues.push(v);
      }
    }

    return callback(null, existedValues, notExistedValues);
  });
};

/**
 * Convert response fields to object
 * @param  {Array[JSON]} dbRes
 * @return {undefined}
 */
Model.prototype.convertObject = function(dbRes) {
  if (!this.objectFields) {
    return dbRes;
  } else {
    return toolkit.convertObject(dbRes, this.objectFields);
  }
};

/**
 * Convert the Filter to SQL WHERE statement.
 *
 * @param  {Object}  filters                     - Filters to convert to SQL statement
 * @param  {Object}  options
 * @param  {Boolean} [options.whereToken=true]   - If the SQL statement contains `WHERE` token
 * @param  {String}  [options.conditionType=AND] - Method to connect the conditions (AND|OR)
 * @param  {String}  [options.extraSQL]          - Extra SQL condition
 * @param  {String}  [options.paging]            - Paging to convert to SQL statement
 * @param  {String}  [options.orders]            - Orders to convert to SQL statement
 * @return {String}                              - SQL `WHERE` statement
 */
Model.prototype.genWhereStatement = function(filters, options) {
  var self = this;

  options = options || {};
  if ('undefined' === typeof options.whereToken) {
    options.whereToken = true;
  }

  if (toolkit.isNothing(options.conditionType)) {
    options.conditionType = 'AND';
  }

  options.conditionType = options.conditionType.toUpperCase();
  if (options.conditionType !== 'AND' && options.conditionType !== 'OR') {
    options.conditionType = 'AND';
  }

  var sqlStatement  = '';
  var sqlConditions = [];

  for (var field in filters) if (filters.hasOwnProperty(field)) {
    var condition = filters[field];

    if (toolkit.isNothing(condition)) continue;

    switch(field) {
      // Special SQL for _fuzzySearch
      case '_fuzzySearch':
        var searchConditions = [];
        for (var i = 0; i < condition.keys.length; i++) {
          var key = condition.keys[i];
          searchConditions.push(this.db.whereSqlGenerators.like(key, condition.value));
        }
        sqlConditions.push('(' + searchConditions.join(' OR ') + ')');

        break;

      // Special SQL for _fulltextSearch
      case '_fulltextSearch':
        if (toolkit.isNothing(condition.key) || toolkit.isNothing(condition.value)) break;

        var key   = toolkit.asArray(condition.key).join(', ');
        var value = toolkit.asArray(condition.value).join(' ');
        sqlConditions.push('(' + this.db.whereSqlGenerators.fulltext(key, value) + ')')

        break;

      // Normal SQL
      default:
        for (var operation in condition) if (condition.hasOwnProperty(operation)) {
          var value = condition[operation];
          if ('function' !== typeof this.db.whereSqlGenerators[operation]) {
            throw Error('Unknow SQL operation: {0}', operation);
          } else {
            sqlConditions.push('(' + this.db.whereSqlGenerators[operation](field, value) + ')');
          }
        }
        break;
    }
  }

  if (options.extraSQL) {
    sqlConditions.push(options.extraSQL);
  }

  if (sqlConditions.length > 0) {
    sqlStatement = sqlConditions.join(' ' + options.conditionType + ' ');

    sqlStatement = options.whereToken ? toolkit.strf('WHERE ({0})', sqlStatement)
                                      : toolkit.strf('({0})', sqlStatement);
  }

  return sqlStatement;
};

/**
 * Convert the orders to SQL ORDER BY statement.
 *
 * @param  {Object[]} orders                    - Orders to convert to SQL statement
 * @param  {Object}   options
 * @param  {Boolean}  [options.orderToken=true] - If the SQL statement contain `ORDER BY` token
 * @return {String}                             - SQL `ORDER BY` statement
 */
Model.prototype.genOrderStatement = function(orders, options) {
  options = options || {};

  if ('undefined' === typeof options.orderToken) {
    options.orderToken = true;
  }

  if (toolkit.isNothing(orders) || !orders) {
    return '';
  }

  var sqlOrders = [];
  for (var i = 0;  i < orders.length; i++) {
    var o = orders[i];
    sqlOrders.push(o.field + ' ' + o.method.toUpperCase());
  }
  var sqlStatement = sqlOrders.join(', ');

  if (options.orderToken) sqlStatement = 'ORDER BY ' + sqlStatement;

  return sqlStatement;
};

/**
 * Convert the groups to SQL GROUP BY statement.
 *
 * @param  {String[]} groups                    - Groups to convert to SQL statement
 * @param  {Object}   options
 * @param  {Boolean}  [options.groupToken=true] - If the SQL statement contain `GROUP BY` token
 * @return {String}                             - SQL `GROUP BY` statement
 */
Model.prototype.genGroupByStatement = function(groups, options) {
  options = options || {};

  if ('undefined' === typeof options.groupToken) {
    options.groupToken = true;
  }

  if (toolkit.isNothing(groups)) {
    return '';
  }

  var sqlStatement = groups.join(', ');

  if (options.groupToken) sqlStatement = 'GROUP BY ' + sqlStatement;

  return sqlStatement;
};

/**
 * @constructor
 * @param {Object} modelOptions - CRUD Handler options
 * @param {String} modelOptions.tableName
 * @param {String} [modelOptions.alias=null]
 * @param {String} [modelOptions.userIdField=null]
 */
var CRUDHandler = function(modelProto) {
  this.modelProto = modelProto;
};

/**
 * Create a `/data/do/list` handler
 *
 * @param  {String[]}      fields
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createListHandler = function(fields, hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var model = new self.modelProto(res.locals);

    var opt = res.locals.getQueryOptions();

    if (fields) {
      opt.fields = fields;
    }

    model.list(opt, function(err, dbRes, pageInfo, extraDBRes) {
      if (err) return next(err);

      var ret = toolkit.initRet(dbRes, pageInfo, extraDBRes);
      var hookExtra = {
        query    : req.query,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendData(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/data/do/count-by-group` handler
 *
 * @return {Function}
 */
CRUDHandler.prototype.createCountByGroupHandler = function() {
  var self = this;
  return function(req, res, next) {
    var model = new self.modelProto(res.locals);

    var opt = res.locals.getQueryOptions();

    model.countByGroup(opt, function(err, dbRes) {
      if (err) return next(err);

      var ret = toolkit.initRet(dbRes);

      return res.locals.sendJSON(ret);
    });
  };
};

/**
 * Create a `/data/do/get-stats` handler
 *
 * @return {Function}
 */
CRUDHandler.prototype.createGetStatsHandler = function() {
  var self = this;
  return function(req, res, next) {
    var latestData  = {};
    var totalCount  = 0;

    var model = new self.modelProto(res.locals);

    async.series([
      // Get lastest data
      function(asyncCallback) {
        var opt = {
          fields: ['seq', 'createTime'],
        };
        model.getLatest(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          latestData = dbRes || {};

          return asyncCallback();
        });
      },
      // Get total count
      function(asyncCallback) {
        model.countByGroup(null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          totalCount = dbRes[0].count;

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return next(err);

      var ret = toolkit.initRet({
        latestSeq       : latestData.seq,
        latestCreateTime: latestData.createTime,
        totalCount      : totalCount,
      });
      return res.locals.sendJSON(ret);
    });
  };
};

/**
 * Create a `/data/:id/do/get` handler
 *
 * @param  {String[]}      fields
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createGetHandler = function(fields, hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var model = new self.modelProto(res.locals);
    var id = req.params.id;

    var opt = res.locals.getQueryOptions();
    if (fields) {
      opt.fields = fields;
    }

    model.getWithCheck(id, opt, function(err, dbRes) {
      if (err) return next(err);

      var ret = toolkit.initRet(dbRes);
      var hookExtra = {
        query    : req.query,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `data/do/add` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createAddHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var model = new self.modelProto(res.locals);
    var data = req.body.data || {};

    model.add(data, function(err, _addedId, _addedData) {
      if (err) return next(err);

      var ret = toolkit.initRet({
        id: _addedId,
      });
      var hookExtra = {
        newData  : _addedData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/data/:id/do/modify` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createModifyHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var data = req.body.data || {};
    var id   = req.params.id;

    var oldData = null;
    var newData = null;

    async.series([
      // Check
      function(asyncCallback) {
        model._getWithCheck(id, null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          oldData = dbRes;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        model.modify(id, data, function(err, _modifiedId, _modifiedData) {
          if (err) return asyncCallback(err);

          newData = _modifiedData;
          ret = toolkit.initRet({
            id: _modifiedId,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        newData  : newData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/partial/data/:id/do/set` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createPartialSetHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var data = req.body.data || {};
    var id   = req.params.id;

    var oldData = null;
    var newData = null;

    async.series([
      // Get
      function(asyncCallback) {
        model._get(id, null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          oldData = dbRes;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        model.partialSet(id, data, function(err, _partialSetId, _partialSetData) {
          if (err) return asyncCallback(err);

          newData = _partialSetData;
          ret = toolkit.initRet({
            id: _partialSetId,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        newData  : newData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/data/:id/do/delete` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createDeleteHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var id = req.params.id;

    var oldData = null;

    async.series([
      // Check
      function(asyncCallback) {
        model._getWithCheck(id, null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          oldData = dbRes;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        model.delete(id, function(err, _deletedId) {
          if (err) return asyncCallback(err);

          ret = toolkit.initRet({
            id: _deletedId,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/data/:id/do/delete-many` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createDeleteManyHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var id = req.query.id;

    var oldData = null;

    async.series([
      function(asyncCallback) {
        model.deleteMany(id, function(err, _deletedIds) {
          if (err) return asyncCallback(err);

          ret = toolkit.initRet({
            id: _deletedIds,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/data/:id/do/delete` handler (soft)
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createSoftDeleteHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var data = {isDeleted: true};
    var id   = req.params.id;

    var oldData = null;
    var newData = null;

    async.series([
      // Check
      function(asyncCallback) {
        model._getWithCheck(id, null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          oldData = dbRes;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        model.modify(id, data, function(err, _softDeletedId, _softDeletedData) {
          if (err) return asyncCallback(err);

          newData = _softDeletedData;
          ret = toolkit.initRet({
            id: _softDeletedId,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        newData  : newData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

/**
 * Create a `/partial/data/:id/do/delete` handler
 *
 * @param  {Object=null}   hooks
 * @param  {Function=null} hooks.beforeResp
 * @param  {Function=null} hooks.afterResp
 * @return {Function}
 */
CRUDHandler.prototype.createPartialDeleteHandler = function(hooks) {
  hooks = hooks || {};

  var self = this;
  return function(req, res, next) {
    var ret = null;

    var model = new self.modelProto(res.locals);
    var id = req.params.id;

    var oldData = null;

    async.series([
      function(asyncCallback) {
        model.delete(id, function(err, _partialDeletedId) {
          if (err) return asyncCallback(err);

          ret = toolkit.initRet({
            id: _partialDeletedId,
          });

          return asyncCallback();
        });
      }
    ], function(err, dbRes) {
      if (err) return next(err);

      var hookExtra = {
        oldData  : oldData,
        mainModel: model,
      };

      async.series([
        function(asyncCallback) {
          if ('function' !== typeof hooks.beforeResp) return asyncCallback();

          hooks.beforeResp(req, res, ret, hookExtra, function(err, nextRet) {
            if (err) return asyncCallback(err);

            ret = nextRet;

            return asyncCallback();
          });
        },
      ], function(err) {
        if (err) return next(err);

        res.locals.sendJSON(ret);

        if ('function' === typeof hooks.afterResp) {
          hooks.afterResp(req, res, toolkit.jsonCopy(ret), hookExtra);
        }
      });
    });
  };
};

exports.Model       = Model;
exports.CRUDHandler = CRUDHandler;

exports.createCRUDHandler = function(modelProto) {
  return new CRUDHandler(modelProto);
};

exports.createSubModel = function(options) {
  var SubModel = function(locals) {
    Model.call(this, locals, options);
  };

  toolkit.extend(SubModel, Model);

  return SubModel;
};
