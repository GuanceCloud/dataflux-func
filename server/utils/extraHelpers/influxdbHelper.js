'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var redis     = require('redis');
var influx    = require('influx');
var sqlstring = require('sqlstring');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

/* compatibility */
var getConfig = function(c) {
  return {
    host    : c.host,
    port    : c.port,
    user    : c.user     || undefined,
    password: c.password || undefined,
    database: c.database || c.db || undefined,
    protocol: c.protocol || 'http',
  };
};

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - InfluxDB Helper
 */
var InfluxDBHelper = function(logger, config) {
  this.logger = logger || logHelper.createHelper();

  this.config = toolkit.noNullOrWhiteSpace(config);
  this.client = new influx.InfluxDB(getConfig(this.config));
};

/**
 * Write one point to DB
 *
 * @param  {String}   measurement
 * @param  {Object}   tags
 * @param  {Object}   fields
 * @param  {Function} callback
 * @return {undefined}
 */
InfluxDBHelper.prototype.writePoint = function(measurement, tags, fields, callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  self.logger.debug(toolkit.strf('[INFLUXDB] Write: measurement=`{0}`', measurement));

  var points = [{
    measurement: measurement,
    tags       : tags,
    fields     : fields,
  }];
  self.client.writePoints(points)
  .then(function() {
    return callback();
  })
  .catch(function(err) {
    return callback(err);
  });
};

/**
 * Write points to DB
 *
 * @param  {String}   measurement
 * @param  {Object}   tags
 * @param  {Object}   fields
 * @param  {Function} callback
 * @return {undefined}
 */
InfluxDBHelper.prototype.writePoints = function(points, callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  points = toolkit.asArray(points);

  self.logger.debug(toolkit.strf('[INFLUXDB] Write: {0} points', points.length));

  self.client.writePoints(points)
  .then(function() {
    return callback();
  })
  .catch(function(err) {
    return callback(err);
  });
};

/**
 * Run SQL statement.
 *
 * @param  {String}   sql       - SQL statement
 * @param  {*[]}      sqlParams - SQL parameters
 * @param  {Function} callback
 * @return {undefined}
 */
InfluxDBHelper.prototype.query = function(sql, sqlParams, callback) {
  var self = this;
  callback = toolkit.ensureFn(callback);

  if (sqlParams) {
    for (var i = 0; i < sqlParams.length; i++) {
      if (Array.isArray(sqlParams[i]) && sqlParams[i].length <= 0) {
        return callback();
      }
    }
  }

  sql = self.format(sql.toString(), sqlParams).trim();

  self.logger.debug('{0} {1}',
    '[INFLUXDB]',
    sql.replace(/\s+/g, ' ')
  );

  self.client.query(sql)
  .then(function(dbRes) {
    return callback(null, dbRes);
  })
  .catch(callback);
};

/**
 * Format the SQL statement with parameters.
 *
 * @param  {String} sql
 * @param  {*[]}    sqlParams
 * @return {String}
 */
InfluxDBHelper.prototype.format = function(sql, sqlParams) {
  return sqlstring.format(sql, sqlParams).replace(/\`/g, '');
};

/**
 * Escape the SQL parameter.
 *
 * @param  {*}      value
 * @return {String}
 */
InfluxDBHelper.prototype.escape = function(value) {
  return sqlstring.escape(value);
};

exports.InfluxDBHelper = InfluxDBHelper;
exports.createHelper = function(logger, config) {
  return new InfluxDBHelper(logger, config);
};
