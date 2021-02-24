// 国际化
import app from '@/main';

const createMap = function(arrayConst) {
  let map = {};
  arrayConst.forEach(d => {
    map[d.key] = d;
  });
  return map;
}

const MAP_CONST = function(arrayConst) {
  this._map = createMap(arrayConst)
};
MAP_CONST.prototype.get = function(key) {
  if (key in this._map) {
    return this._map[key];
  } else {
    return {
      name     : '-',
      fullName : '-',
      tagType  : 'info',
      icon     : 'fa-ban',
      textClass: 'text-bad',
    };
  }
};

// 数据源
import logo_df_dataway    from '@/assets/img/logo-dataflux-dataway.png'
import logo_influxdb      from '@/assets/img/logo-influxdb.png'
import logo_mysql         from '@/assets/img/logo-mysql.png'
import logo_memcached     from '@/assets/img/logo-memcached.png'
import logo_redis         from '@/assets/img/logo-redis.png'
import logo_clickhouse    from '@/assets/img/logo-clickhouse.png'
import logo_oracle        from '@/assets/img/logo-oracle.png'
import logo_sqlserver     from '@/assets/img/logo-sqlserver.png'
import logo_postgresql    from '@/assets/img/logo-postgresql.png'
import logo_mongodb       from '@/assets/img/logo-mongodb.png'
import logo_elasticsearch from '@/assets/img/logo-elasticsearch.png'
import logo_nsq           from '@/assets/img/logo-nsq.png'
import logo_mqtt          from '@/assets/img/logo-mqtt.png'

export default {
  get NOPE() {
    return '-';
  },
  get DATE_SOURCE() {
    return [
      {
        key           : 'df_dataway',
        name          : 'DataWay',
        fullName      : 'DataFlux DataWay (HTTP)',
        logo          : logo_df_dataway,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `helper = DFF.SRC('{0}', token='DATAWAY_TOKEN')\ndw_res = helper.write_point(\n    measurement='some_measurement',\n    tags={'name': 'Tom'},\n    fields={'value': 10})`,
        configFields: {
          host     : { default: null, isRequired: true },
          port     : { default: 9528, isRequired: true },
          protocol : { default: 'http' },
          token    : { default: null },
          accessKey: { default: null },
          secretKey: { default: null },
        },
      },
      {
        key           : 'influxdb',
        name          : 'InfluxDB',
        fullName      : app.$t('InfluxDB (HTTP) (And other compatible Databases)'),
        logo          : logo_influxdb,
        tagType       : null,
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM "some_measurement" LIMIT 10')`,
        compatibleDBs: [
          app.$t('Aliyun Time Series Database for InfluxDB'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 8086 },
          protocol: { default: 'http' },
          database: { default: null },
          user    : { default: null },
          password: { default: null },
        },
      },
      {
        key           : 'mysql',
        name          : 'MySQL',
        fullName      : app.$t('MySQL (And other compatible Databases)'),
        logo          : logo_mysql,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM \`some_table\` LIMIT 10')`,
        compatibleDBs: [
          'MariaDB',
          'Percona Server for MySQL',
          app.$t('Aliyun PolarDB for MySQL'),
          app.$t('Aliyun OceanBase'),
          app.$t('ADB for MySQL'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 3306 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8mb4', isRequired: true },
        },
      },
      {
        key           : 'redis',
        name          : 'Redis',
        fullName      : 'Redis',
        logo          : logo_redis,
        tagType       : 'danger',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('GET', 'some_key')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 6379 },
          database: { default: '0', isRequired: true },
          password: { default: null },
        },
      },
      {
        key           : 'memcached',
        name          : 'Memcached',
        fullName      : 'Memcached',
        logo          : logo_memcached,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('GET', 'some_key')`,
        configFields: {
          servers: { default: null, isRequired: true },
        },
      },
      {
        key           : 'clickhouse',
        name          : 'ClickHouse',
        fullName      : 'ClickHouse (TCP)',
        logo          : logo_clickhouse,
        tagType       : 'warning',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM some_table LIMIT 10')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 9000 },
          database: { default: 'default', isRequired: true },
          user    : { default: 'default' },
          password: { default: null },
        },
      },
      {
        key           : 'oracle',
        name          : 'Oracle',
        fullName      : app.$t('Oracle Database'),
        logo          : logo_oracle,
        tagType       : 'danger',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM SOME_TABLE WHERE ROWNUM <= 10')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 1521 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
      },
      {
        key           : 'sqlserver',
        name          : 'SQLServer',
        fullName      : 'Microsoft SQL Server',
        logo          : logo_sqlserver,
        tagType       : 'info',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT TOP 10 * FROM some_table')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 1433 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
      },
      {
        key           : 'postgresql',
        name          : 'PostgreSQL',
        fullName      : app.$t('PostgreSQL (And other compatible Databases)'),
        logo          : logo_postgresql,
        tagType       : 'info',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM some_table LIMIT 10')`,
        compatibleDBs: [
          'Greenplum Database',
          app.$t('Aliyun PolarDB for PostgreSQL'),
          app.$t('ADB for PostgreSQL'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 5432 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
      },
      {
        key           : 'mongodb',
        name          : 'mongoDB',
        fullName      : 'mongoDB',
        logo          : logo_mongodb,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query()`,
        configFields: {
          host      : { default: null, isRequired: true },
          port      : { default: 27017 },
          user      : { default: null },
          password  : { default: null },
          database  : { default: null },
        },
      },
      {
        key           : 'elasticsearch',
        name          : 'ES',
        fullName      : 'elasticsearch (HTTP)',
        logo          : logo_elasticsearch,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('GET /_search?q=field:value')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 9200 },
          protocol: { default: 'http' },
          user    : { default: null },
          password: { default: null },
        },
      },
      {
        key           : 'nsq',
        name          : 'NSQ',
        fullName      : 'NSQ (Lookupd, HTTP Publisher)',
        logo          : logo_nsq,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `helper = DFF.SRC('{0}')\helper.publish(topic='some_topic', message='some_message')`,
        configFields: {
          host    : { default: null },
          port    : { default: 4161 },
          protocol: { default: 'http' },
          servers : { default: null },
        },
      },
      {
        key           : 'mqtt',
        name          : 'MQTT',
        fullName      : 'MQTT Broker (v5.0)',
        logo          : logo_mqtt,
        tips          : app.$t('A Broker with MQTTv5 support and use share subscription is recommended'),
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `helper = DFF.SRC('{0}')\nhelper.publish(topic='some_topic',  message='some_message')`,
        compatibleDBs: [
          'Mosquitto 2.0+',
          'EMQX',
        ],
        configFields: {
          host         : { default: null, isRequired: true },
          port         : { default: 1883, isRequired: true },
          user         : { default: null },
          password     : { default: null },
          clientId     : { default: null },
          topicHandlers: { default: [{ topic: '$share/dataflux_func/#', funcId: null }] },
        },
      },
    ];
  },
  get DATE_SOURCE_MAP() {
    return new MAP_CONST(this.DATE_SOURCE);
  },

  // 侧边栏项目类型
  get ASIDE_ITEM_TYPE() {
    return [
      {
        key : 'scriptSet',
        name: app.$t('Script Set'),
      },
      {
        key : 'script',
        name: app.$t('Script'),
      },
      {
        key : 'func',
        name: app.$t('Func'),
      },
      {
        key : 'dataSource',
        name: app.$t('Data Source'),
      },
      {
        key : 'envVariable',
        name: app.$t('ENV'),
      },
    ];
  },
  get ASIDE_ITEM_TYPE_MAP() {
    return new MAP_CONST(this.ASIDE_ITEM_TYPE);
  },

  // 环境变量
  get ENV_VARIABLE() {
    return [
      {
        key : 'string',
        name: app.$t('String'),
      },
      {
        key : 'integer',
        name: app.$t('Integer'),
        tips: app.$t('Will be converted by int() automatically'),
      },
      {
        key : 'float',
        name: app.$t('Float'),
        tips: app.$t('Will be converted by float() automatically'),
      },
      {
        key : 'boolean',
        name: app.$t('Boolean'),
        tips: app.$t('Can be "true"/"false", "yes"/"no" or "on"/"off"'),
      },
      {
        key : 'json',
        name: 'JSON',
        tips: app.$t('Will be converted by json.loads() automatically'),
      },
      {
        key : 'commaArray',
        name: app.$t('String array with comma separators'),
        tips: app.$t('Like CSV. "apple,pie" will be converted to ["apple", "pie"]'),
      },
    ];
  },
  get ENV_VARIABLE_MAP() {
    return new MAP_CONST(this.ENV_VARIABLE);
  },

  // 授权链接限流
  get AUTH_LINK_THROTTLING() {
    return [
      {
        key : 'bySecond',
        name: 'timePerSecond',
      },
      {
        key : 'byMinute',
        name: 'timePerMinute',
      },
      {
        key : 'byHour',
        name: 'timePerHour',
      },
      {
        key : 'byDay',
        name: 'timePerDay',
      },
      {
        key : 'byMonth',
        name: 'timePerMonth',
      },
      {
        key : 'byYear',
        name: 'timePerYear',
      },
    ];
  },
  get AUTH_LINK_THROTTLING_MAP() {
    return new MAP_CONST(this.AUTH_LINK_THROTTLING);
  },

  // 任务状态
  get TASK_STATUS() {
    return [
      {
        key    : 'queued',
        name   : app.$t('Queued'),
        tagType: 'info',
        icon   : 'el-icon-timer',
      },
      {
        key    : 'pending',
        name   : app.$t('Running'),
        tagType: '',
        icon   : 'el-icon-loading',
      },
      {
        key    : 'success',
        name   : app.$t('Succeeded'),
        tagType: 'success',
        icon   : 'el-icon-success',
      },
      {
        key    : 'failure',
        name   : app.$t('Failed'),
        tagType: 'danger',
        icon   : 'el-icon-error',
      },
    ];
  },
  get TASK_STATUS_MAP() {
    return new MAP_CONST(this.TASK_STATUS);
  },

  // 总揽业务实体
  get OVERVIEW_ENTITY() {
    return [
      {
        key : 'scriptSet',
        name: app.$t('Script Set'),
        icon: 'fa-folder-open-o',
      },
      {
        key : 'script',
        name: app.$t('Script'),
        icon: 'fa-file-code-o',
      },
      {
        key    : 'func',
        name   : app.$t('Func'),
        tagText: 'def',
      },
      {
        key : 'dataSource',
        name: app.$t('Data Source'),
        icon: 'fa-database',
      },
      {
        key : 'envVariable',
        name: app.$t('ENV'),
        icon: 'fa-cogs',
      },
      {
        key : 'authLink',
        name: app.$t('Auth Link'),
        icon: 'fa-link',
      },
      {
        key : 'crontabConfig',
        name: app.$t('Crontab Config'),
        icon: 'fa-clock-o',
      },
      {
        key : 'batch',
        name: app.$t('Batch'),
        icon: 'fa-tasks',
      },
    ];
  },
  get OVERVIEW_ENTITY_MAP() {
    return new MAP_CONST(this.OVERVIEW_ENTITY);
  },

  // 脚本还原点
  get SCRIPT_RECOVER_POINT() {
    return [
      {
        key      : 'import',
        name     : app.$t('Before package import'),
        textClass: 'text-main',
      },
      {
        key      : 'install',
        name     : app.$t('Before package install'),
        textClass: 'text-primary',
      },
      {
        key      : 'recover',
        name     : app.$t('Before Script Lib recover'),
        textClass: 'text-info',
      },
      {
        key      : 'manual',
        name     : app.$t('Created by user manually'),
        textClass: 'text-good',
      },
    ];
  },
  get SCRIPT_RECOVER_POINT_MAP() {
    return new MAP_CONST(this.SCRIPT_RECOVER_POINT);
  },

  // 函数执行模式
  get FUNC_EXEC_MODE() {
    return [
      {
        key      : 'sync',
        name     : app.$t('Sync call'),
        textClass: 'text-main',
      },
      {
        key      : 'async',
        name     : app.$t('Async call'),
        textClass: 'text-watch',
      },
      {
        key      : 'crontab',
        name     : app.$t('Crontab'),
        textClass: 'text-info',
      },
    ];
  },
  get FUNC_EXEC_MODE_MAP() {
    return new MAP_CONST(this.FUNC_EXEC_MODE);
  },

  // 函数集成
  get FUNC_INTEGRATION() {
    return [
      {
        key : 'signIn',
        name: app.$t('Sign in'),
      },
    ];
  },
  get FUNC_INTEGRATION_MAP() {
    return new MAP_CONST(this.FUNC_INTEGRATION);
  },

  // 编辑器主题
  get CODE_MIRROR_THEME() {
    return [
      {
        key : 'eclipse-monokai',
        name: app.$t( 'Auto: Default'),
      },
      {
        key : 'base16',
        name: app.$t( 'Auto: base16'),
      },
      {
        key : 'duotone',
        name: app.$t( 'Auto: duotone'),
      },
      {
        key : 'neat-material-darker',
        name: app.$t( 'Auto: neat/material-darker'),
      },
      {
        key : 'idea-darcula',
        name: app.$t( 'Auto: idea/darcula'),
      },
      {
        key : 'eclipse',
        name: app.$t('Light: eclipse'),
      },
      {
        key : 'base16-light',
        name: app.$t('Light: base16-light'),
      },
      {
        key : 'duotone-light',
        name: app.$t('Light: duotone-light'),
      },
      {
        key : 'neat',
        name: app.$t('Light: neat'),
      },
      {
        key : 'idea',
        name: app.$t('Light: idea'),
      },
      {
        key : 'monokai',
        name: app.$t('Dark: monokai'),
      },
      {
        key : 'base16-dark',
        name: app.$t('Dark: base16-dark'),
      },
      {
        key : 'duotone-dark',
        name: app.$t('Dark: duotone-dark'),
      },
      {
        key : 'material-darker',
        name: app.$t('Dark: material-darker'),
      },
      {
        key : 'darcula',
        name: app.$t('Dark: darcula'),
      },
    ];
  },
  get CODE_MIRROR_THEME_MAP() {
    return new MAP_CONST(this.CODE_MIRROR_THEME);
  },
  get CODE_MIRROR_DEFAULT_THEME() {
    return 'eclipse-monokai';
  },
}
