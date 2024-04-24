// 国际化
import i18n from '@/i18n';

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

// 连接器
import logo_guance        from '@/assets/img/logo-guance.png'
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
import logo_kafka         from '@/assets/img/logo-kafka.png'

// 脚本市场
import logo_git         from '@/assets/img/logo-git.png'
import logo_aliyunOSS   from '@/assets/img/logo-aliyun-oss.png'
import logo_httpService from '@/assets/img/logo-http.png'
import logo_github      from '@/assets/img/logo-github.png'
import logo_gitlab      from '@/assets/img/logo-gitlab.png'
import logo_gitee       from '@/assets/img/logo-gitee.png'
import logo_gitea       from '@/assets/img/logo-gitea.png'
import logo_gogs        from '@/assets/img/logo-gogs.png'
import logo_bitbucket   from '@/assets/img/logo-bitbucket.png'

export default {
  get RE_PATTERN() {
    return  {
      email  : /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/g,
      httpURL: /^(http:\/\/|https:\/\/)/g,
    }
  },

  get NOPE() {
    return '-';
  },
  get CONNECTOR() {
    return [
      {
        key           : 'guance',
        name          : i18n.t('Guance'),
        fullName      : i18n.t('Guance'),
        searchKeywords: ['观测云', 'guance', 'dataflux'],
        logo          : logo_guance,
        tagType       : 'primary',
        debugSupported: false,
        sampleCode    : `guance = DFF.CONN('{0}')
res = guance.openapi('GET', '/api/v1/workspace/get')`,
        configFields: {
          guanceNode        : { default: null, isRequired: true },
          guanceOpenAPIURL  : { default: null, isRequired: true },
          guanceWebSocketURL: { default: null, isRequired: true },
          guanceOpenWayURL  : { default: null, isRequired: true },
          guanceAPIKeyId    : { default: null, isRequired: true },
          guanceAPIKey      : { default: null, isRequired: true },
        },
        links: {
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'df_datakit',
        name          : 'DataKit',
        fullName      : i18n.t('Guance DataKit (HTTP)'),
        searchKeywords: ['观测云', 'guance', 'dataflux', 'datakit'],
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `datakit = DFF.CONN('{0}')
res = datakit.write_metric(measurement='some_measurement',
    tags={'name': 'Tom'}, fields={'value': 10})`,
        configFields: {
          host     : { default: null, isRequired: true },
          port     : { default: 9529, isRequired: true },
          protocol : { default: 'http' },
          source   : { default: 'dataflux_func' },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-datakit/',
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'df_dataway',
        name          : 'DataWay',
        fullName      : i18n.t('Guance DataWay (HTTP)'),
        searchKeywords: ['观测云', 'guance', 'dataflux', 'dataway'],
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `dataway = DFF.CONN('{0}', token='DATAWAY_TOKEN')
res = dataway.write_metric(measurement='some_measurement',
    tags={'name': 'Tom'}, fields={'value': 10})`,
        configFields: {
          host     : { default: null, isRequired: true },
          port     : { default: 9528, isRequired: true },
          protocol : { default: 'http' },
          token    : { default: null },
          accessKey: { default: null },
          secretKey: { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-dataway/',
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'dff_sidecar',
        name          : 'Sidecar',
        fullName      : 'DataFlux Func Sidecar (HTTP)',
        searchKeywords: ['观测云', 'guance', 'dataflux', 'sidecar', 'func'],
        logo          : null,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `sidecar = DFF.CONN('{0}')
res = sidecar.shell('ls -l', workdir='/home', wait=True)`,
        configFields: {
          host     : { default: '172.17.0.1', isRequired: true },
          port     : { default: 8099, isRequired: true },
          protocol : { default: 'http' },
          secretKey: { default: null, isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-sidecar/',
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'influxdb',
        name          : 'InfluxDB',
        fullName      : i18n.t('InfluxDB (HTTP) (And other compatible Databases)'),
        searchKeywords: ['influxdb', 'time-series', 'ts'],
        logo          : logo_influxdb,
        tagType       : null,
        debugSupported: true,
        sampleCode    : `influxdb = DFF.CONN('{0}')
res = influxdb.query('SELECT * FROM "some_measurement" LIMIT 10')`,
        compatibleDBs: [
          i18n.t('Aliyun Time Series Database for InfluxDB'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 8086 },
          protocol: { default: 'http' },
          database: { default: null },
          user    : { default: null },
          password: { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-influxdb/',
          pypi: 'https://pypi.org/project/influxdb/5.3.1/',
        },
      },
      {
        key           : 'mysql',
        name          : 'MySQL',
        fullName      : i18n.t('MySQL (And other compatible Databases)'),
        searchKeywords: ['mysql', 'mariadb', 'percona', 'polardb', 'oceanbase', 'sql', 'rdms'],
        logo          : logo_mysql,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `mysql = DFF.CONN('{0}')
res = mysql.query('SELECT * FROM \`some_table\` LIMIT 10')`,
        compatibleDBs: [
          'MariaDB',
          'Percona Server for MySQL',
          i18n.t('Aliyun PolarDB for MySQL'),
          i18n.t('Aliyun OceanBase'),
          i18n.t('ADB for MySQL'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 3306 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8mb4', isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-mysql/',
          pypi: 'https://pypi.org/project/PyMySQL/1.0.2/',
        },
      },
      {
        key           : 'redis',
        name          : 'Redis',
        fullName      : 'Redis',
        searchKeywords: ['redis', 'nosql', 'cache', 'key-value', 'kv', 'queue', 'mq'],
        logo          : logo_redis,
        tagType       : 'danger',
        debugSupported: true,
        sampleCode    : `redis = DFF.CONN('{0}')
res = redis.query('GET', 'some_key')`,
        configFields: {
          host         : { default: null, isRequired: true },
          port         : { default: 6379 },
          database     : { default: '0', isRequired: true },
          user         : { default: null },
          password     : { default: null },
          authType     : { default: null },
          topicHandlers: { default: [] },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-redis/',
          pypi: 'https://pypi.org/project/redis/4.6.0/',
          npm : 'https://www.npmjs.com/package/redis/v/3.1.2',
        },
      },
      {
        key           : 'memcached',
        name          : 'Memcached',
        fullName      : 'Memcached',
        searchKeywords: ['memcached', 'nosql', 'cache', 'key-value', 'kv'],
        logo          : logo_memcached,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `memcached = DFF.CONN('{0}')
res = memcached.query('GET', 'some_key')`,
        configFields: {
          servers: { default: null, isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-memcached/',
          pypi: 'https://pypi.org/project/python-memcached/1.62/',
        },
      },
      {
        key           : 'clickhouse',
        name          : 'ClickHouse',
        fullName      : 'ClickHouse (TCP)',
        searchKeywords: ['clickhouse', 'sql'],
        logo          : logo_clickhouse,
        tagType       : 'warning',
        debugSupported: true,
        sampleCode    : `clickhouse = DFF.CONN('{0}')
res = clickhouse.query('SELECT * FROM some_table LIMIT 10')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 9000 },
          database: { default: 'default', isRequired: true },
          user    : { default: 'default' },
          password: { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-clickhouse/',
          pypi: 'https://pypi.org/project/clickhouse-driver/0.1.5/',
        },
      },
      {
        key           : 'oracle',
        name          : 'Oracle',
        fullName      : i18n.t('Oracle Database'),
        searchKeywords: ['oracle', 'sql', 'rdms'],
        logo          : logo_oracle,
        tagType       : 'danger',
        debugSupported: true,
        sampleCode    : `oracle = DFF.CONN('{0}')
res = oracle.query('SELECT * FROM SOME_TABLE WHERE ROWNUM <= 10')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 1521 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-oracle/',
          pypi: 'https://pypi.org/project/cx-Oracle/7.3.0/',
        },
      },
      {
        key           : 'sqlserver',
        name          : 'SQLServer',
        fullName      : 'Microsoft SQL Server',
        searchKeywords: ['sqlserver', 'sql', 'rdms', 'microsoft', 'ms'],
        logo          : logo_sqlserver,
        tagType       : 'info',
        debugSupported: true,
        sampleCode    : `sqlserver = DFF.CONN('{0}')
res = sqlserver.query('SELECT TOP 10 * FROM some_table')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 1433 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-sqlserver/',
          pypi: 'https://pypi.org/project/pymssql/2.2.5/',
        },
      },
      {
        key           : 'postgresql',
        name          : 'PostgreSQL',
        fullName      : i18n.t('PostgreSQL (And other compatible Databases)'),
        searchKeywords: ['postgresql', 'sql', 'greenplum', 'polardb', 'rdms'],
        logo          : logo_postgresql,
        tagType       : 'info',
        debugSupported: true,
        sampleCode    : `postgresql = DFF.CONN('{0}')
res = postgresql.query('SELECT * FROM some_table LIMIT 10')`,
        compatibleDBs: [
          'Greenplum Database',
          i18n.t('Aliyun PolarDB for PostgreSQL'),
          i18n.t('ADB for PostgreSQL'),
        ],
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 5432 },
          database: { default: null, isRequired: true },
          user    : { default: null, isRequired: true },
          password: { default: null, isRequired: true },
          charset : { default: 'utf8', isRequired: true },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-postgresql/',
          pypi: 'https://pypi.org/project/psycopg2/2.9.3/',
        },
      },
      {
        key           : 'mongodb',
        name          : 'mongoDB',
        fullName      : 'mongoDB',
        searchKeywords: ['mongoDB', 'nosql', 'document'],
        logo          : logo_mongodb,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `mongodb = DFF.CONN('{0}')
res = mongodb.query()`,
        configFields: {
          host      : { default: null, isRequired: true },
          port      : { default: 27017 },
          user      : { default: null },
          password  : { default: null },
          database  : { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-mongodb/',
          pypi: 'https://pypi.org/project/pymongo/3.12.3/',
        },
      },
      {
        key           : 'elasticsearch',
        name          : 'ES',
        fullName      : 'elasticsearch (HTTP)',
        searchKeywords: ['elasticsearch', 'nosql', 'document', 'fulltext'],
        logo          : logo_elasticsearch,
        tagType       : 'success',
        debugSupported: true,
        sampleCode    : `elasticsearch = DFF.CONN('{0}')
res = elasticsearch.query('GET /_search?q=field:value')`,
        configFields: {
          host    : { default: null, isRequired: true },
          port    : { default: 9200 },
          protocol: { default: 'http' },
          user    : { default: null },
          password: { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-es/',
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'nsq',
        name          : 'NSQ',
        fullName      : 'NSQ (Lookupd, HTTP Publisher)',
        searchKeywords: ['nsq', 'queue', 'mq'],
        logo          : logo_nsq,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `nsq = DFF.CONN('{0}')
nsq.publish(topic='some_topic', message='some_message')`,
        configFields: {
          host    : { default: null },
          port    : { default: 4161 },
          protocol: { default: 'http' },
          servers : { default: null },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-nsq/',
          pypi: 'https://pypi.org/project/requests/2.28.1/',
        },
      },
      {
        key           : 'mqtt',
        name          : 'MQTT',
        fullName      : 'MQTT Broker (v5.0)',
        searchKeywords: ['mqtt', 'mosquitto', 'emqx', 'iot'],
        logo          : logo_mqtt,
        tips          : i18n.t('A Broker with MQTTv5 support and use share subscription is recommended'),
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `mqtt = DFF.CONN('{0}')
mqtt.publish(topic='some_topic',  message='some_message')`,
        compatibleDBs: [
          'Mosquitto 2.0+',
          'EMQX',
        ],
        configFields: {
          host          : { default: null, isRequired: true },
          port          : { default: 1883, isRequired: true },
          user          : { default: null },
          password      : { default: null },
          clientId      : { default: null },
          multiSubClient: { default: false },
          topicHandlers : { default: [] },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-mqtt/',
          pypi: 'https://pypi.org/project/paho-mqtt/1.6.1/',
          npm : 'https://www.npmjs.com/package/mqtt/v/4.3.7',
        },
      },
      {
        key           : 'kafka',
        name          : 'Kafka',
        fullName      : 'Kafka',
        searchKeywords: ['kafka', 'queue', 'mq'],
        logo          : logo_kafka,
        tagType       : 'info',
        debugSupported: false,
        sampleCode    : `kafka = DFF.CONN('{0}')
kafka.publish(topic='some_topic', message='some_message')`,
        configFields: {
          servers         : { default: null, isRequired: true },
          user            : { default: null },
          password        : { default: null },
          groupId         : { default: null },
          securityProtocol: { default: null },
          saslMechanisms  : { default: null },
          multiSubClient  : { default: true },
          kafkaSubOffset  : { default: 'end' },
          topicHandlers   : { default: [] },
        },
        links: {
          doc : 'https://func.guance.com/doc/development-guide-builtin-features-dff-conn-kafka/',
          pypi: 'https://pypi.org/project/kafka-python3/3.0.0/',
          npm : 'https://www.npmjs.com/package/node-rdkafka/v/2.13.0',
        },
      },
    ];
  },
  get CONNECTOR_MAP() {
    return new MAP_CONST(this.CONNECTOR);
  },

  // 代码注释
  get TODO_TYPE() {
    return [
      {
        key    : 'STAR',
        tagType: 'primary',
        icon   : 'fa-star',
      },
      {
        key    : 'NOTE',
        tagType: 'primary',
        icon   : 'fa-sticky-note',
      },
      {
        key    : 'XXX',
        tagType: 'info',
        icon   : 'fa-question-circle',
      },
      {
        key    : 'TEST',
        tagType: 'info',
        icon   : 'fa-flask',
      },
      {
        key    : 'TODO',
        tagType: 'warning',
        icon   : 'fa-check-square',
      },
      {
        key    : 'BUG',
        tagType: 'danger',
        icon   : 'fa-bug',
      },
      {
        key    : 'FIXME',
        tagType: 'danger',
        icon   : 'fa-wrench',
      },
      {
        key    : 'HACK',
        tagType: 'warning',
        icon   : 'fa-user-secret',
      },
    ]
  },
  get TODO_TYPE_MAP() {
    return new MAP_CONST(this.TODO_TYPE);
  },

  // 主题
  get UI_THEME() {
    return [
      {
        key : 'auto',
        name: i18n.t('Follow System'),
        icon: 'fa-adjust',
      },
      {
        key : 'light',
        name: i18n.t('Light Mode'),
        icon: 'fa-sun-o',
      },
      {
        key : 'dark',
        name: i18n.t('Dark Mode'),
        icon: 'fa-moon-o',
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
        key      : 'zh-CN',
        name     : '简体中文',
        shortName: '简',
      },
      {
        key      : 'zh-HK',
        name     : '繁體中文（香港）',
        shortName: '繁',
        tip      : 'By OpenCC',
      },
      {
        key      : 'zh-TW',
        name     : '繁體中文（臺灣）',
        shortName: '繁',
        tip      : 'By OpenCC',
      },
      {
        key      : 'en',
        name     : 'English',
        shortName: 'EN',
        tip      : 'Beta',
      }
    ]
  },
  get UI_LOCALE_MAP() {
    return new MAP_CONST(this.UI_LOCALE, 0);
  },

  // 侧边栏项目类型
  get ASIDE_ITEM_TYPE() {
    return [
      {
        key : 'scriptSet',
        name: i18n.t('Script Set'),
      },
      {
        key : 'script',
        name: i18n.t('Script'),
      },
      {
        key : 'func',
        name: i18n.t('Func'),
      },
      {
        key : 'connector',
        name: i18n.t('Connector'),
      },
      {
        key : 'envVariable',
        name: i18n.t('ENV'),
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
        key    : 'string',
        tagType: 'info',
        name   : i18n.t('String'),
      },
      {
        key    : 'password',
        tagType: 'danger',
        name   : i18n.t('Password'),
        tips   : i18n.t('Same as string, but masked in print logs'),
      },
      {
        key    : 'integer',
        tagType: 'success',
        name   : i18n.t('Integer'),
        tips   : i18n.t('Will be converted by int() automatically'),
      },
      {
        key    : 'float',
        tagType: 'success',
        name   : i18n.t('Float'),
        tips   : i18n.t('Will be converted by float() automatically'),
      },
      {
        key    : 'boolean',
        tagType: 'success',
        name   : i18n.t('Boolean'),
        tips   : i18n.t('Can be "true"/"false", "yes"/"no" or "on"/"off"'),
      },
      {
        key    : 'json',
        tagType: 'warning',
        name   : 'JSON',
        tips   : i18n.t('Will be converted by json.loads() automatically'),
      },
      {
        key    : 'commaArray',
        tagType: 'warning',
        name   : i18n.t('Comma separated string array'),
        tips   : i18n.t('Like CSV. "apple,pie" will be converted to ["apple", "pie"]'),
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
        name: i18n.t('Fixed Field'),
        configFields: {
          fields: { default: [], isRequired: true },
        },
      },
      {
        key : 'httpBasic',
        name: i18n.t('HTTP Basic'),
        configFields: {
          users: { default: [], isRequired: true },
        },
      },
      {
        key : 'httpDigest',
        name: i18n.t('HTTP Digest'),
        configFields: {
          users: { default: [], isRequired: true },
        },
      },
      {
        key : 'func',
        name: i18n.t('Func'),
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
        name: i18n.t('HTTP Header'),
      },
      {
        key : 'query',
        name: i18n.t('HTTP Query'),
      },
      {
        key : 'body',
        name: i18n.t('HTTP Body'),
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
        name   : i18n.t('Success'),
        tagType: 'success',
        icon   : 'el-icon-success',
      },
      {
        key    : 'failure',
        name   : i18n.t('Failure'),
        tagType: 'danger',
        icon   : 'el-icon-error',
      },
      {
        key    : 'timeout',
        name   : i18n.t('Timeout'),
        tagType: 'danger',
        icon   : 'el-icon-time',
      },
      {
        key    : 'expire',
        name   : i18n.t('Expire'),
        tagType: 'warning',
        icon   : 'el-icon-time',
      },
      {
        key    : 'skip',
        name   : i18n.t('Skip'),
        tagType: 'warning',
        icon   : 'el-icon-d-arrow-right',
      },
      {
        key    : 'pending',
        name   : i18n.t('Pending'),
        tagType: 'info',
        icon   : 'el-icon-loading',
      }
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
        name: i18n.t('Script Set'),
        icon: 'fa-folder-open-o',
      },
      {
        key : 'script',
        name: i18n.t('Script'),
        icon: 'fa-file-code-o',
      },
      {
        key    : 'func',
        name   : i18n.t('Func'),
        tagText: 'def',
      },
      {
        key : 'connector',
        name: i18n.t('Connector'),
        icon: 'fa-database',
      },
      {
        key : 'envVariable',
        name: i18n.t('ENV'),
        icon: 'fa-cogs',
      },
      {
        key : 'authLink',
        name: i18n.t('Auth Link'),
        icon: 'fa-link',
      },
      {
        key : 'crontabConfig',
        name: i18n.t('Crontab Config'),
        icon: 'fa-clock-o',
      },
      {
        key : 'batch',
        name: i18n.t('Batch'),
        icon: 'fa-tasks',
      },
      {
        key : 'fileService',
        name: i18n.t('File Service'),
        icon: 'fa-folder-open',
      },
      {
        key : 'user',
        name: i18n.t('User'),
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
        name     : i18n.t('Before package import'),
        textClass: 'text-main',
      },
      {
        key      : 'install',
        name     : i18n.t('Before package install'),
        textClass: 'text-watch',
      },
      {
        key      : 'recover',
        name     : i18n.t('Before Script Lib recover'),
        textClass: 'text-info',
      },
      {
        key      : 'manual',
        name     : i18n.t('Created by user manually'),
        textClass: 'text-good',
      },
    ];
  },
  get SCRIPT_RECOVER_POINT_MAP() {
    return new MAP_CONST(this.SCRIPT_RECOVER_POINT);
  },

  // 函数集成
  get FUNC_INTEGRATION() {
    return [
      {
        key : 'signIn',
        name: i18n.t('Sign in'),
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
        name: i18n.t( 'Auto: Default'),
      },
      {
        key : 'base16',
        name: i18n.t( 'Auto: base16'),
      },
      {
        key : 'duotone',
        name: i18n.t( 'Auto: duotone'),
      },
      {
        key : 'neat-material-darker',
        name: i18n.t( 'Auto: neat/material-darker'),
      },
      {
        key : 'idea-darcula',
        name: i18n.t( 'Auto: idea/darcula'),
      },
      {
        key : 'eclipse',
        name: i18n.t('Light: eclipse'),
      },
      {
        key : 'base16-light',
        name: i18n.t('Light: base16-light'),
      },
      {
        key : 'duotone-light',
        name: i18n.t('Light: duotone-light'),
      },
      {
        key : 'neat',
        name: i18n.t('Light: neat'),
      },
      {
        key : 'idea',
        name: i18n.t('Light: idea'),
      },
      {
        key : 'monokai',
        name: i18n.t('Dark: monokai'),
      },
      {
        key : 'base16-dark',
        name: i18n.t('Dark: base16-dark'),
      },
      {
        key : 'duotone-dark',
        name: i18n.t('Dark: duotone-dark'),
      },
      {
        key : 'material-darker',
        name: i18n.t('Dark: material-darker'),
      },
      {
        key : 'darcula',
        name: i18n.t('Dark: darcula'),
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
        key  : 'tsinghua',
        name : i18n.t('Tsinghua University mirror'),
        value: 'https://pypi.tuna.tsinghua.edu.cn/simple/',
      },
      {
        key  : 'alibaba',
        name : i18n.t('Alibaba Cloud mirror'),
        value: 'https://mirrors.aliyun.com/pypi/simple/',
      },
      {
        key  : 'douban',
        name : i18n.t('Douban mirror'),
        value: 'https://pypi.douban.com/simple/',
      },
      {
        key  : 'official',
        name : i18n.t('PyPI Official'),
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
        name: i18n.t('Edit'),
        icon: 'fa-edit',
      },
      {
        key : 'debug',
        name: i18n.t('Debug'),
        icon: 'fa-play',
      },
    ];
  },
  get CODE_VIEWR_USER_OPERATION_MAP() {
    return new MAP_CONST(this.CODE_VIEWR_USER_OPERATION);
  },
  // 代码查看器展示模式
  get CODE_VIEWER_SHOW_MODE() {
    return [
      {
        key      : 'draft',
        name     : i18n.t('Draft'),
        codeField: 'codeDraft',
      },
      {
        key      : 'published',
        name     : i18n.t('Published'),
        codeField: 'code',
      },
      {
        key      : 'diff',
        name     : i18n.t('DIFF'),
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
        name: i18n.t('Request Cost 1000ms+'),
      },
      {
        key : 'reqCost5000',
        name: i18n.t('Request Cost 5000ms+'),
      },
      {
        key : 'statusCode4xx',
        name: i18n.t('Status Code 4xx'),
      },
      {
        key : 'statusCode5xx',
        name: i18n.t('Status Code 5xx'),
      },
    ];
  },
  get ABNORMAL_REQUEST_TYPE_MAP() {
    return new MAP_CONST(this.ABNORMAL_REQUEST_TYPE);
  },

  // 导入数据类型
  get IMPORT_DATA_TYPE() {
    return [
      {
        key       : 'scriptSets',
        name      : i18n.t('Script Set'),
        showField : 'title',
      },
      {
        key       : 'connectors',
        name      : i18n.t('Connector'),
        showField : 'title',
      },
      {
        key       : 'envVariables',
        name      : i18n.t('ENV'),
        showField : 'title',
      },
      {
        key       : 'authLinks',
        name      : i18n.t('Auth Link'),
        showField : 'funcId',
        showClass : 'text-main code-font',
      },
      {
        key       : 'crontabConfigs',
        name      : i18n.t('Crontab Config'),
        showField : 'funcId',
        showClass : 'text-main code-font',
      },
      {
        key       : 'batches',
        name      : i18n.t('Batch'),
        showField : 'funcId',
        showClass : 'text-main code-font',
      },
    ];
  },
  get IMPORT_DATA_TYPE_MAP() {
    return new MAP_CONST(this.IMPORT_DATA_TYPE);
  },

  // 脚本市场类型
  get SCRIPT_MARKET_TYPE() {
    return [
      {
        key       : 'git',
        name      : i18n.t('git'),
        logo      : logo_git,
        tip       : i18n.t('HTTPS is recommended for Script Market based on git, and accessing the git service via HTTP on the public network should be avoided'),
        isReadonly: false,
        brandLogo: {
          'github'   : logo_github,
          'gitlab'   : logo_gitlab,
          'jihulab'  : logo_gitlab,
          'gitee'    : logo_gitee,
          'gitea'    : logo_gitea,
          'gogs'     : logo_gogs,
          'bitbucket': logo_bitbucket,
        },
        configFields: {
          url     : { default: null, isRequired: true },
          branch  : { default: null },
          user    : { default: null },
          password: { default: null },
        },
      },
      {
        key       : 'aliyunOSS',
        name      : i18n.t('Alibaba Cloud OSS'),
        logo      : logo_aliyunOSS,
        isReadonly: false,
        configFields: {
          endpoint       : { default: 'http://oss-cn-hangzhou.aliyuncs.com', isRequired: true },
          bucket         : { default: null, isRequired: true },
          folder         : { default: 'script-market', isRequired: true },
          accessKeyId    : { default: null, isRequired: true },
          accessKeySecret: { default: null, isRequired: true },
        },
      },
      {
        key       : 'httpService',
        name      : i18n.t('HTTP Service'),
        logo      : logo_httpService,
        tip       : i18n.t('Script Market based on HTTP Service is readonly'),
        isReadonly: true,
        configFields: {
          url: { default: null, isRequired: true },
        },
      },
    ];
  },
  get SCRIPT_MARKET_TYPE_MAP() {
    return new MAP_CONST(this.SCRIPT_MARKET_TYPE);
  },

  // 蓝图
  get BLUEPRINT_ELEMENT_TYPE() {
    return [
      {
        key  : 'SimpleLine',
        name : i18n.t('Simple Line'),
        props: { },
      },
      {
        key  : 'SwitchLine',
        name : i18n.t('Switch Line'),
        props: {
          switchOrder: { isRequired: true },
        },
      },

      {
        key  : 'EntryNode',
        name : i18n.t('Entry Node'),
        props: { },
      },
      {
        key  : 'CodeNode',
        name : i18n.t('Code Node'),
        props: {
          title: { isRequired: false },
          code : { isRequired: false },
        },
      },
      {
        key  : 'FuncNode',
        name : i18n.t('Func Node'),
        props: {
          title                 : { isRequired: false },
          funcId                : { isRequired: true },
          parameterPassingMethod: { isRequired: true },
          parameterAssigningMap : { isRequired: false },
          outputField           : { isRequired: false },
        },
      },
      {
        key  : 'SwitchNode',
        name : i18n.t('Switch Node'),
        props: {
          title      : { isRequired: false },
          switchItems: { isRequired: true },
        },
      },

      {
        key  : 'BuiltinHashNode',
        name : i18n.t('Hash'),
        props: {
          inputField   : { isRequired: true },
          outputField  : { isRequired: true },
          hashAlgorithm: { isRequired: true },
        },
      },
      {
        key  : 'BuiltinBase64Node',
        name : i18n.t('Base64'),
        props: {
          inputField    : { isRequired: true },
          outputField   : { isRequired: true },
          encodeOrDecode: { isRequired: true },
        },
      },
      {
        key  : 'BuiltinRandomNode',
        name : i18n.t('Random'),
        props: {
          outputField : { isRequired: true },
          randomType  : { isRequired: true },
          randomLength: { isRequired: false },
          minValue    : { isRequired: false },
          maxValue    : { isRequired: false },
        },
      },
      {
        key  : 'BuiltinJSONNode',
        name : i18n.t('JSON'),
        props: {
          inputField            : { isRequired: true },
          outputField           : { isRequired: true },
          serializeOrDeserialize: { isRequired: true },
        },
      },
      {
        key  : 'BuiltinYAMLNode',
        name : i18n.t('YAML'),
        props: {
          inputField            : { isRequired: true },
          outputField           : { isRequired: true },
          serializeOrDeserialize: { isRequired: true },
        },
      },
      {
        key  : 'BuiltinHTTPNode',
        name : i18n.t('HTTP Request'),
        props: {
          httpMethod     : { isRequired: true },
          url            : { isRequired: true },
          httpContentType: { isRequired: false },
          httpBody       : { isRequired: false },
        },
      },
      {
        key  : 'BuiltinDingTalkNode',
        name : i18n.t('DingTalk Robot'),
        props: {
          url                : { isRequired: true },
          dingTalkMessageType: { isRequired: true },
          secret             : { isRequired: false },
          content            : { isRequired: false },
          httpBody           : { isRequired: false },
        },
      },
    ]
  },
  get BLUEPRINT_ELEMENT_TYPE_MAP() {
    return new MAP_CONST(this.BLUEPRINT_ELEMENT_TYPE);
  },
}
