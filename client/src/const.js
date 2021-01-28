const createMap = function(arrayConst) {
  let map = {};
  arrayConst.forEach(d => {
    map[d.key] = d;
  });
  return map;
}

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
export const DATE_SOURCE = [
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
    fullName      : 'InfluxDB (HTTP)（及兼容数据库）',
    logo          : logo_influxdb,
    tips          : '查询DataFlux 的数据请使用「DataFlux InfluxDB」\n外部InfluxDB 才需要在此额外添加',
    tagType       : null,
    debugSupported: true,
    sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM "some_measurement" LIMIT 10')`,
    compatibleDBs: [
      '阿里云时序数据库InfluxDB 版',
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
    fullName      : 'MySQL（及兼容数据库）',
    logo          : logo_mysql,
    tagType       : 'success',
    debugSupported: true,
    sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM \`some_table\` LIMIT 10')`,
    compatibleDBs: [
      'MariaDB',
      'Percona Server for MySQL',
      '阿里云PolarDB MySQL',
      '阿里云OceanBase',
      '阿里云分析型数据库(ADB) MySQL 版',
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
    fullName      : 'Oracle数据库',
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
    fullName      : 'PostgreSQL（及兼容数据库）',
    logo          : logo_postgresql,
    tagType       : 'info',
    debugSupported: true,
    sampleCode    : `helper = DFF.SRC('{0}')\ndb_res = helper.query('SELECT * FROM some_table LIMIT 10')`,
    compatibleDBs: [
      'Greenplum Database',
      '阿里云PolarDB MySQL',
      '阿里云分析型数据库(ADB) PostgreSQL 版',
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
    tips          : '请使用支持MQTT v5.0 协议的Broker，并使用共享订阅 $share 防止接收到重复消息',
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
export const DATE_SOURCE_MAP = createMap(DATE_SOURCE);

// 侧边栏项目类型
export const ASIDE_ITEM_TYPE =[
  {
    'key' : 'scriptSet',
    'name': 'Script Set',
  },
  {
    'key' : 'script',
    'name': 'Script',
  },
  {
    'key' : 'func',
    'name': 'Func',
  },
  {
    'key' : 'dataSource',
    'name': 'Data Source',
  },
  {
    'key' : 'envVariable',
    'name': 'ENV',
  },
];
export const ASIDE_ITEM_TYPE_MAP = createMap(ASIDE_ITEM_TYPE);

// 环境变量
export const ENV_VARIABLE = [
  {
    key : 'string',
    name: '字符串',
  },
  {
    key : 'integer',
    name: '整数',
    tips: '将自动使用 int() 进行转换',
  },
  {
    key : 'float',
    name: '浮点数',
    tips: '将自动使用 float() 进行转换',
  },
  {
    key : 'boolean',
    name: '布尔值',
    tips: '可用"true"/"false", "yes"/"no", "on"/"off"表示对应的布尔值',
  },
  {
    key : 'json',
    name: 'JSON',
    tips: '将自动使用 simplejson.loads() 进行转换',
  },
  {
    key : 'commaArray',
    name: '逗号分隔数组',
    tips: '英文逗号分隔的字符串数组，如 "apple,pie"，将转换为 ["apple", "pie"]',
  },
];
export const ENV_VARIABLE_MAP = createMap(ENV_VARIABLE);

// 授权链接限流
export const AUTH_LINK_THROTTLING = [
  {
    key : 'bySecond',
    name: '次/秒',
  },
  {
    key : 'byMinute',
    name: '次/分钟',
  },
  {
    key : 'byHour',
    name: '次/小时',
  },
  {
    key : 'byDay',
    name: '次/天',
  },
  {
    key : 'byMonth',
    name: '次/月',
  },
  {
    key : 'byYear',
    name: '次/年',
  },
];
export const AUTH_LINK_THROTTLING_MAP = createMap(AUTH_LINK_THROTTLING);

// 任务状态
export const TASK_STATUS = [
  {
    key    : 'queued',
    name   : '已入队',
    tagType: 'info',
    icon   : 'el-icon-timer',
  },
  {
    key    : 'pending',
    name   : '运行中',
    tagType: '',
    icon   : 'el-icon-loading',
  },
  {
    key    : 'success',
    name   : '已成功',
    tagType: 'success',
    icon   : 'el-icon-success',
  },
  {
    key    : 'failure',
    name   : '已失败',
    tagType: 'danger',
    icon   : 'el-icon-error',
  },
];
export const TASK_STATUS_MAP = createMap(TASK_STATUS);

// 总揽业务实体
export const OVERVIEW_ENTITY = [
  {
    key : 'scriptSet',
    name: '脚本集',
    icon: 'fa-folder-open-o',
  },
  {
    key : 'script',
    name: '脚本',
    icon: 'fa-file-code-o',
  },
  {
    key : 'func',
    name   : '函数',
    tagText: 'def',
  },
  {
    key : 'dataSource',
    name: '数据源',
    icon: 'fa-database',
  },
  {
    key : 'envVariable',
    name: '数据源',
    icon: 'fa-cogs',
  },
  {
    key : 'authLink',
    name: '授权链接',
    icon: 'fa-link',
  },
  {
    key : 'crontabConfig',
    name: '自动触发配置',
    icon: 'fa-clock-o',
  },
  {
    key : 'batch',
    name: '批处理',
    icon: 'fa-tasks',
  },
];
export const OVERVIEW_ENTITY_MAP = createMap(OVERVIEW_ENTITY);

// 脚本还原点
export const SCRIPT_RECOVER_POINT = [
  {
    key      : 'import',
    name     : '脚本包导入前',
    textClass: 'text-main',
  },
  {
    key      : 'install',
    name     : '脚本包安装前',
    textClass: 'text-primary',
  },
  {
    key      : 'recover',
    name     : '脚本库还原前',
    textClass: 'text-info',
  },
  {
    key      : 'manual',
    name     : '用户手动创建',
    textClass: 'text-good',
  },
];
export const SCRIPT_RECOVER_POINT_MAP = createMap(SCRIPT_RECOVER_POINT);


// 函数执行模式
export const FUNC_EXEC_MODE = [
  {
    key      : 'sync',
    name     : '同步调用',
    textClass: 'text-main',
  },
  {
    key      : 'async',
    name     : '异步调用',
    textClass: 'text-watch',
  },
  {
    key      : 'crontab',
    name     : '定时运行',
    textClass: 'text-info',
  },
  {
    key      : 'autoRun',
    name     : '自动运行',
    textClass: 'text-info',
  },
];
export const FUNC_EXEC_MODE_MAP = createMap(FUNC_EXEC_MODE);

// 函数集成
export const FUNC_INTEGRATION = [
  {
    key : 'signIn',
    name: '登录',
  },
];
export const FUNC_INTEGRATION_MAP = createMap(FUNC_INTEGRATION);

// 编辑器主题
export const CODE_MIRROR_THEME = [
  {
    key  : 'eclipse-monokai',
    name : '自动切换：默认',
  },
  {
    key  : 'base16',
    name : '自动切换：base16',
  },
  {
    key  : 'duotone',
    name : '自动切换：duotone',
  },
  {
    key  : 'neat-material-darker',
    name : '自动切换：neat/material-darker',
  },
  {
    key  : 'idea-darcula',
    name : '自动切换：idea/darcula',
  },
  {
    key : 'eclipse',
    name: '明亮：eclipse',
  },
  {
    key : 'base16-light',
    name: '明亮：base16-light',
  },
  {
    key : 'duotone-light',
    name: '明亮：duotone-light',
  },
  {
    key : 'neat',
    name: '明亮：neat',
  },
  {
    key : 'idea',
    name: '明亮：idea',
  },
  {
    key : 'monokai',
    name: '黑暗：monokai',
  },
  {
    key : 'base16-dark',
    name: '黑暗：base16-dark',
  },
  {
    key : 'duotone-dark',
    name: '黑暗：duotone-dark',
  },
  {
    key : 'material-darker',
    name: '黑暗：material-darker',
  },
  {
    key : 'darcula',
    name: '黑暗：darcula',
  },
];
export const CODE_MIRROR_THEME_MAP = createMap(CODE_MIRROR_THEME);
export const CODE_MIRROR_DEFAULT_THEME = 'eclipse-monokai';
