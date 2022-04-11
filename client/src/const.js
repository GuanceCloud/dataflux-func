// 国际化
import app from '@/main';

const $t = function(s) {
  return app ? app.$t(s) : s;
}
const createMap = function(arrayConst) {
  let map = {};
  arrayConst.forEach(d => {
    map[d.key] = d;
  });
  return map;
}

const MAP_CONST = function(arrayConst, defaultIndex) {
  this._map = createMap(arrayConst)
  if ('number' === typeof defaultIndex) {
    this._default = arrayConst[defaultIndex];
  }
};
MAP_CONST.prototype.get = function(key) {
  if (key in this._map) {
    return this._map[key];
  } else {
    if (this._default) {
      return this._default;
    } else {
      return {
        name     : '-',
        fullName : '-',
        shortName: '-',
        tagType  : 'info',
        icon     : 'fa-ban',
        textClass: 'text-bad',
      };
    }
  }
};

// 数据源
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
  get DATA_SOURCE() {
    return [
      {
        key           : 'df_dataway',
        name          : 'DataWay',
        fullName      : '观测云DataWay (HTTP)',
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `dataway = DFF.SRC('{0}', token='DATAWAY_TOKEN')\nres = dataway.write_point(measurement='some_measurement', tags={'name': 'Tom'}, fields={'value': 10})`,
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
        key           : 'df_datakit',
        name          : 'DataKit',
        fullName      : '观测云DataKit (HTTP)',
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `datakit = DFF.SRC('{0}')\nres = datakit.write_metric(measurement='some_measurement', tags={'name': 'Tom'}, fields={'value': 10})`,
        configFields: {
          host     : { default: null, isRequired: true },
          port     : { default: 9529, isRequired: true },
          protocol : { default: 'http' },
          source   : { default: 'dataflux_func' },
        },
      },
      {
        key           : 'dff_sidecar',
        name          : 'Sidecar',
        fullName      : 'DataFlux Func Sidecar (HTTP)',
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `sidecar = DFF.SRC('{0}')\nres = sidecar.shell('ls -l', workdir='/home', wait=True)`,
        configFields: {
          host    : { default: '172.17.0.1', isRequired: true },
          port    : { default: 8099, isRequired: true },
          protocol: { default: 'http' },
          secretKey: { default: null, isRequired: true },
        },
      },
      {
        key           : 'influxdb',
        name          : 'InfluxDB',
        fullName      : $t('InfluxDB (HTTP) (And other compatible Databases)'),
        logo          : logo_influxdb,
        tagType       : null,
        debugSupported: true,
        sampleCode    : `influxdb = DFF.SRC('{0}')\nres = influxdb.query('SELECT * FROM "some_measurement" LIMIT 10')`,
        compatibleDBs: [
          $t('Aliyun Time Series Database for InfluxDB'),
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
        fullName      : $t('MySQL (And other compatible Databases)'),
        logo          : logo_mysql,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `mysql = DFF.SRC('{0}')\nres = mysql.query('SELECT * FROM \`some_table\` LIMIT 10')`,
        compatibleDBs: [
          'MariaDB',
          'Percona Server for MySQL',
          $t('Aliyun PolarDB for MySQL'),
          $t('Aliyun OceanBase'),
          $t('ADB for MySQL'),
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
        sampleCode    : `redis = DFF.SRC('{0}')\nres = redis.query('GET', 'some_key')`,
        configFields: {
          host         : { default: null, isRequired: true },
          port         : { default: 6379 },
          database     : { default: '0', isRequired: true },
          password     : { default: null },
          topicHandlers: { default: [] },
        },
      },
      {
        key           : 'memcached',
        name          : 'Memcached',
        fullName      : 'Memcached',
        logo          : logo_memcached,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `memcached = DFF.SRC('{0}')\nres = memcached.query('GET', 'some_key')`,
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
        sampleCode    : `clickhouse = DFF.SRC('{0}')\nres = clickhouse.query('SELECT * FROM some_table LIMIT 10')`,
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
        fullName      : $t('Oracle Database'),
        logo          : logo_oracle,
        tagType       : 'danger',
        debugSupported: true,
        sampleCode    : `oracle = DFF.SRC('{0}')\nres = oracle.query('SELECT * FROM SOME_TABLE WHERE ROWNUM <= 10')`,
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
        sampleCode    : `sqlserver = DFF.SRC('{0}')\nres = sqlserver.query('SELECT TOP 10 * FROM some_table')`,
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
        fullName      : $t('PostgreSQL (And other compatible Databases)'),
        logo          : logo_postgresql,
        tagType       : 'info',
        debugSupported: true,
        sampleCode    : `postgresql = DFF.SRC('{0}')\nres = postgresql.query('SELECT * FROM some_table LIMIT 10')`,
        compatibleDBs: [
          'Greenplum Database',
          $t('Aliyun PolarDB for PostgreSQL'),
          $t('ADB for PostgreSQL'),
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
        sampleCode    : `mongodb = DFF.SRC('{0}')\nres = mongodb.query()`,
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
        sampleCode    : `elasticsearch = DFF.SRC('{0}')\nres = elasticsearch.query('GET /_search?q=field:value')`,
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
        sampleCode    : `nsq = DFF.SRC('{0}')\nnsq.publish(topic='some_topic', message='some_message')`,
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
        tips          : $t('A Broker with MQTTv5 support and use share subscription is recommended'),
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `mqtt = DFF.SRC('{0}')\nmqtt.publish(topic='some_topic',  message='some_message')`,
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
          topicHandlers: { default: [{ topic: 'TOPIC', funcId: null }] },
        },
      },
    ];
  },
  get DATA_SOURCE_MAP() {
    return new MAP_CONST(this.DATA_SOURCE);
  },

  // 主题
  get UI_THEME() {
    return [
      {
        key : 'light',
        name: $t('Light Mode'),
        icon: 'fa-sun-o',
      },
      {
        key : 'dark',
        name: $t('Dark Mode'),
        icon: 'fa-moon-o',
      },
      {
        key : 'auto',
        name: $t('Auto'),
        icon: 'fa-adjust',
      },
    ]
  },
  get UI_THEME_MAP() {
    return new MAP_CONST(this.UI_THEME, 0);
  },
  // 语言
  get UI_LOCALE() {
    return [
      {
        key      : 'en',
        name     : 'English (WIP)',
        shortName: 'EN',
      },
      {
        key      : 'zh-CN',
        name     : '简体中文',
        shortName: '简',
      },
    ]
  },
  get UI_LOCALE_MAP() {
    return new MAP_CONST(this.UI_LOCALE, 1);
  },

  // 侧边栏项目类型
  get ASIDE_ITEM_TYPE() {
    return [
      {
        key : 'scriptSet',
        name: $t('Script Set'),
      },
      {
        key : 'script',
        name: $t('Script'),
      },
      {
        key : 'func',
        name: $t('Func'),
      },
      {
        key : 'dataSource',
        name: $t('Data Source'),
      },
      {
        key : 'envVariable',
        name: $t('ENV'),
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
        name: $t('String'),
      },
      {
        key : 'integer',
        name: $t('Integer'),
        tips: $t('Will be converted by int() automatically'),
      },
      {
        key : 'float',
        name: $t('Float'),
        tips: $t('Will be converted by float() automatically'),
      },
      {
        key : 'boolean',
        name: $t('Boolean'),
        tips: $t('Can be "true"/"false", "yes"/"no" or "on"/"off"'),
      },
      {
        key : 'json',
        name: 'JSON',
        tips: $t('Will be converted by json.loads() automatically'),
      },
      {
        key : 'commaArray',
        name: $t('String array with comma separators'),
        tips: $t('Like CSV. "apple,pie" will be converted to ["apple", "pie"]'),
      },
    ];
  },
  get ENV_VARIABLE_MAP() {
    return new MAP_CONST(this.ENV_VARIABLE, 0);
  },

  // API认证类型
  get API_AUTH() {
    return [
      {
        key : 'fixedField',
        name: $t('Fixed Field'),
        configFields: {
          fields: { default: [], isRequired: true },
        },
      },
      {
        key : 'httpBasic',
        name: $t('HTTP Basic'),
        configFields: {
          users: { default: [], isRequired: true },
        },
      },
      {
        key : 'httpDigest',
        name: $t('HTTP Digest'),
        configFields: {
          users: { default: [], isRequired: true },
        },
      },
      {
        key : 'func',
        name: $t('Func'),
        configFields: {
          funcId: { default: null, isRequired: true },
        },
      },
    ];
  },
  get API_AUTH_MAP() {
    return new MAP_CONST(this.API_AUTH);
  },

  // API认证类型 - 固定位置
  get API_AUTH_FIXED_FIELD_LOCATION() {
    return [
      {
        key : 'header',
        name: $t('HTTP Header'),
      },
      {
        key : 'query',
        name: $t('HTTP Query'),
      },
      {
        key : 'body',
        name: $t('HTTP Body'),
      },
    ];
  },
  get API_AUTH_FIXED_FIELD_LOCATION_MAP() {
    return new MAP_CONST(this.API_AUTH_FIXED_FIELD_LOCATION);
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
        key    : 'success',
        name   : $t('Succeeded'),
        tagType: 'success',
        icon   : 'el-icon-success',
      },
      {
        key    : 'failure',
        name   : $t('Failed'),
        tagType: 'danger',
        icon   : 'el-icon-error',
      },
    ];
  },
  get TASK_STATUS_MAP() {
    return new MAP_CONST(this.TASK_STATUS);
  },

  // 总览业务实体
  get OVERVIEW_ENTITY() {
    return [
      {
        key : 'scriptSet',
        name: $t('Script Set'),
        icon: 'fa-folder-open-o',
      },
      {
        key : 'script',
        name: $t('Script'),
        icon: 'fa-file-code-o',
      },
      {
        key    : 'func',
        name   : $t('Func'),
        tagText: 'def',
      },
      {
        key : 'dataSource',
        name: $t('Data Source'),
        icon: 'fa-database',
      },
      {
        key : 'envVariable',
        name: $t('ENV'),
        icon: 'fa-cogs',
      },
      {
        key : 'authLink',
        name: $t('Auth Link'),
        icon: 'fa-link',
      },
      {
        key : 'crontabConfig',
        name: $t('Crontab Config'),
        icon: 'fa-clock-o',
      },
      {
        key : 'batch',
        name: $t('Batch'),
        icon: 'fa-tasks',
      },
      {
        key : 'fileService',
        name: $t('File Service'),
        icon: 'fa-folder-open',
      },
      {
        key : 'user',
        name: $t('User'),
        icon: 'fa-users',
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
        name     : $t('Before package import'),
        textClass: 'text-main',
      },
      {
        key      : 'install',
        name     : $t('Before package install'),
        textClass: 'text-watch',
      },
      {
        key      : 'recover',
        name     : $t('Before Script Lib recover'),
        textClass: 'text-info',
      },
      {
        key      : 'manual',
        name     : $t('Created by user manually'),
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
        name     : $t('Sync call'),
        textClass: 'text-main',
      },
      {
        key      : 'async',
        name     : $t('Async call'),
        textClass: 'text-watch',
      },
      {
        key      : 'crontab',
        name     : $t('Crontab'),
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
        name: $t('Sign in'),
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
        name: $t( 'Auto: Default'),
      },
      {
        key : 'base16',
        name: $t( 'Auto: base16'),
      },
      {
        key : 'duotone',
        name: $t( 'Auto: duotone'),
      },
      {
        key : 'neat-material-darker',
        name: $t( 'Auto: neat/material-darker'),
      },
      {
        key : 'idea-darcula',
        name: $t( 'Auto: idea/darcula'),
      },
      {
        key : 'eclipse',
        name: $t('Light: eclipse'),
      },
      {
        key : 'base16-light',
        name: $t('Light: base16-light'),
      },
      {
        key : 'duotone-light',
        name: $t('Light: duotone-light'),
      },
      {
        key : 'neat',
        name: $t('Light: neat'),
      },
      {
        key : 'idea',
        name: $t('Light: idea'),
      },
      {
        key : 'monokai',
        name: $t('Dark: monokai'),
      },
      {
        key : 'base16-dark',
        name: $t('Dark: base16-dark'),
      },
      {
        key : 'duotone-dark',
        name: $t('Dark: duotone-dark'),
      },
      {
        key : 'material-darker',
        name: $t('Dark: material-darker'),
      },
      {
        key : 'darcula',
        name: $t('Dark: darcula'),
      },
    ];
  },
  get CODE_MIRROR_THEME_MAP() {
    return new MAP_CONST(this.CODE_MIRROR_THEME, 0);
  },
  get CODE_MIRROR_THEME_DEFAULT() {
    return this.CODE_MIRROR_THEME[0];
  },

  // PIP镜像
  get PIP_MIRROR() {
    return [
      {
        key  : 'ustc',
        name : $t('USTC mirror'),
        value: 'https://pypi.mirrors.ustc.edu.cn/simple/',
      },
      {
        key  : 'alibaba',
        name : $t('Alibaba Cloud mirror'),
        value: 'https://mirrors.aliyun.com/pypi/simple/',
      },
      {
        key  : 'douban',
        name : $t('Douban mirror'),
        value: 'https://pypi.douban.com/simple/',
      },
      {
        key  : 'tsinghua',
        name : $t('Tsinghua University mirror'),
        value: 'https://pypi.tuna.tsinghua.edu.cn/simple/',
      },
      {
        key  : 'official',
        name : $t('Pypi Official'),
        value: '',
      },
    ];
  },
  get PIP_MIRROR_MAP() {
    return new MAP_CONST(this.PIP_MIRROR, 0);
  },
  get PIP_MIRROR_DEFAULT() {
    return this.PIP_MIRROR[0];
  },

  // 代码查看器操作按钮
  get CODE_VIEWR_USER_OPERATION() {
    return [
      {
        key : 'edit',
        name: $t('Edit'),
        icon: 'fa-edit',
      },
      {
        key : 'debug',
        name: $t('Debug'),
        icon: 'fa-play',
      },
    ];
  },
  get CODE_VIEWR_USER_OPERATION_MAP() {
    return new MAP_CONST(this.CODE_VIEWR_USER_OPERATION, 0);
  },
  // 代码查看器展示模式
  get CODE_VIEWER_SHOW_MODE() {
    return [
      {
        key      : 'draft',
        name     : $t('Draft'),
        codeField: 'codeDraft',
      },
      {
        key      : 'published',
        name     : $t('Published'),
        codeField: 'code',
      },
      {
        key      : 'diff',
        name     : $t('DIFF'),
        codeField: null,
      },
    ];
  },
  get CODE_VIEWER_SHOW_MODE_MAP() {
    return new MAP_CONST(this.CODE_VIEWER_SHOW_MODE, 0);
  },

  // 异常请求
  get ABNORMAL_REQUEST_TYPE() {
    return [
      {
        key : 'reqCost1000',
        name: $t('Request Cost 1000ms+'),
      },
      {
        key : 'reqCost5000',
        name: $t('Request Cost 5000ms+'),
      },
      {
        key : 'statusCode4xx',
        name: $t('Status Code 4xx'),
      },
      {
        key : 'statusCode5xx',
        name: $t('Status Code 5xx'),
      },
    ];
  },
  get ABNORMAL_REQUEST_TYPE_MAP() {
    return new MAP_CONST(this.ABNORMAL_REQUEST_TYPE, 0);
  },
}
