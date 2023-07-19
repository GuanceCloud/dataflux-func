<i18n locale="zh-CN" lang="yaml">
Schema Browser: 结构浏览器

Guance DataWay: 观测云DataWay

SQL Debugger      : SQL 调试
URI Query Debugger: URI Query 调试
Command Debugger  : 命令调试

Databases         : 数据库
Tables            : 表
Fields            : 字段
Data              : 数据
Measurements      : 指标
Tags              : 标签
Indices           : 索引
Collections       : 集合
Retention Policies: 保留策略
Initials          : 首字母
'Keys (a part of)': 键（部分）
Other             : 其他

'Moving...': '调整位置...'

Cannot connect to this Connector, check the configs and try again.: 无法使用此连接器，请检查配置后重试。
Error Message: 错误信息如下
Query is running. It waits up to 5 seconds, You can refresh the page when it not response for a long time.: 查询执行中，最多等待 5 秒，长时间无响应后再尝试刷新页面
'Results will be shown here...': '执行结果将显示在此...'
Query Failed: 查询失败

Database: 数据库
Run     : 执行
Query   : 查询语句
Code    : 代码
Result  : 结果
</i18n>

<template>
  <div id="simpleDebugWindow"
    class="simple-debug-window"
    v-if="show && connector"
    :style="{top: showPosition.top + 'px', left: showPosition.left + 'px'}">
    <div @mousedown="startDrag" class="simple-debug-header">
      <span class="simple-debug-title">
        <el-tag :type="CONNECTOR_DEBUGGER_META_MAP[connector.type].tagType" size="mini"><span>{{ CONNECTOR_DEBUGGER_META_MAP[connector.type].name }}</span></el-tag>
        <span :class="{ builtin: connector.isBuiltin }">{{ connector.title || connector.id }}</span>
      </span>
      <el-link class="simple-debug-close" @mousedown.native.stop @click.stop="hideWindow()"><i class="fa fa-times"></i> {{ $t('Close') }}</el-link>
    </div>

    <div v-show="isDragging" class="simple-debug-dragging-cover">
      <span class="simple-debug-dragging-cover-tip">{{ $t('Moving...') }}</span>
    </div>

    <el-tabs
      :class="{'simple-debug-window-fade': isDragging}"
      tab-position="bottom"
      type="border-card"
      v-model="selectedTab">
      <el-tab-pane
        v-if="CONNECTOR_DEBUGGER_META_MAP[connector.type].supportBrowser"
        :label="$t('Schema Browser')"
        name="browser">
        <div class="simple-debug-browser">
          <el-link type="danger" v-if="browserCascaderErrorMessage">
            {{ $t('Cannot connect to this Connector, check the configs and try again.') }}
            <br>{{ $t('Error Message') }}{{ $t(':') }}
            <pre class="simple-debug-browser-error">{{ browserCascaderErrorMessage }}</pre>
          </el-link>
          <el-form v-else>
            <el-form-item>
              <el-cascader-panel class="simple-debug-browser-cascader" ref="browserCascader"
                placeholder="--"
                size="mini"
                :props="browserCascaderProps">
                <div slot-scope="{ node, data }" @click="updateCodeExample(node)" class="simple-debug-browser-cascader-item">
                  <el-tag v-if="data.showDefaultTag"
                    plain
                    size="mini">{{ $t('Default') }}</el-tag>
                  <el-tag v-if="data.dbTag"
                    plain
                    :type="data.dbTag.type"
                    size="mini">{{ data.dbTag.title }}</el-tag>
                  <span :class="{'text-bad': data.isError}">{{ data.label || data.value }}</span>
                  <span v-if="data.itemCount"> ({{ data.itemCount }}) </span>
                </div>
              </el-cascader-panel>
            </el-form-item>
            <el-form-item>
              <pre class="simple-debug-browser-example-code"
                rows="2">{{ browserCascaderExampleCode }}</pre>
              <div class="simple-debug-browser-example-code-edit">
                <i class="fa fa-fw fa-terminal text-main"></i>
              </div>
              <CopyButton class="simple-debug-browser-example-code-copy"
                v-show="browserCascaderExampleCode"
                :content="browserCascaderExampleCode" />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane
        v-if="CONNECTOR_DEBUGGER_META_MAP[connector.type].supportDebugger"
        :label="CONNECTOR_DEBUGGER_META_MAP[connector.type].debuggerName"
        name="debugger">
        <div class="simple-debug-sql"
          v-loading.lock="isQuerying"
          element-loading-spinner="el-icon-loading"
          :element-loading-text="$t('Query is running. It waits up to 5 seconds, You can refresh the page when it not response for a long time.')">
          <el-form>
            <el-form-item>
              <el-input
                type="textarea"
                resize="none"
                rows="3"
                v-model="latestQueryOptionsMap[connector.id].queryStatement"></el-input>
            </el-form-item>
            <el-form-item>
              <template v-if="CONNECTOR_DEBUGGER_META_MAP[connector.type].supportDatabase">
                <span>{{ $t('Database') }}</span>
                <el-input class="simple-debug-database" size="mini" v-if="!connector.configJSON.database" v-model="latestQueryOptionsMap[connector.id].database"></el-input>
                <el-input class="simple-debug-database" size="mini" v-else :disabled="true" :value="connector.configJSON.database"></el-input>
              </template>

              <el-button
                size="mini"
                @click.stop="queryConnector(latestQueryOptionsMap[connector.id])">
                <i class="fa fa-fw fa-play"></i> {{ $t('Run') }}
              </el-button>
              <div class="simple-debug-copy-content" v-if="latestQueryResultMap[connector.id] && latestQueryResultMap[connector.id].ok">
                <CopyButton tipPlacement="bottom" :title="$t('Query')" :content="latestQueryOptionsMap[connector.id].queryStatement" />
                &nbsp;
                <CopyButton tipPlacement="bottom" :title="$t('Code')" :content="latestQueryOptionsMap[connector.id].queryCode" />
                &nbsp;
                <CopyButton tipPlacement="bottom" :title="$t('Result')" :content="latestQueryResultMap[connector.id].data" />
              </div>
            </el-form-item>
            <el-form-item>
              <pre
                class="simple-debug-result"
                :class="{'simple-debug-query-failed': latestQueryResultMap[connector.id] && !latestQueryResultMap[connector.id].ok}"
                rows="5">{{ latestQueryResultMap[connector.id] && latestQueryResultMap[connector.id].data || $t('Results will be shown here...')}}</pre>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import splitargs from 'splitargs';

export default {
  name: 'SimpleDebugWindow',
  components: {
  },
  watch: {
    connector(val) {
      if (this.$refs.browserCascader) {
        this.$refs.browserCascader.clearCheckedNodes();
        this.$refs.browserCascader.initStore();
        this.browserCascaderExampleCode = '';
      }
    },
  },
  methods: {
    async showWindow(connector) {
      this.browserCascaderErrorMessage = '';

      let meta = this.CONNECTOR_DEBUGGER_META_MAP[connector.type];
      if (meta.supportDebugger) {
        let command     = meta.command;
        let commandArgs = meta.exampleCommandArgs;

        if (!this.latestQueryOptionsMap[connector.id]) {
          let getHelperCode = `helper = DFF.CONN('${connector.id}')`;
          let doQueryCode   = `helper.${command}('${commandArgs.join("', '")}')`;

          this.$set(this.latestQueryOptionsMap, connector.id, {
            database      : connector.database,
            queryStatement: commandArgs.join(' '),
            queryCode     : `${getHelperCode}\n${doQueryCode}`,
          });
        }
      }

      this.connector = connector;
      this.show = true;

      // 自动切换到第一个tab
      if (meta.supportBrowser) {
        this.selectedTab = 'browser';
      } else if (meta.supportDebugger) {
        this.selectedTab = 'debugger';
      }

      setImmediate(() => {
        this.fixShowPosition();
      });
    },
    hideWindow() {
      this.show = false;
    },
    startDrag(event) {
      let $this = document.getElementById('simpleDebugWindow');

      let offsetX = event.screenX - $this.offsetLeft;
      let offsetY = event.screenY - $this.offsetTop;

      this.isDragging = true;

      document.onmousemove = docEvent => {
        let nextLeft = (docEvent || event).screenX - offsetX;
        let nextTop  = (docEvent || event).screenY - offsetY;

        let maxLeft = window.innerWidth  - $this.offsetWidth - 10;
        let maxTop  = window.innerHeight - $this.offsetHeight - 10;

        // 限位器
        if (nextLeft < 0) nextLeft = 0;
        if (nextTop  < 0) nextTop = 0;
        if (nextLeft > maxLeft) nextLeft = maxLeft;
        if (nextTop  > maxTop)  nextTop  = maxTop;

        let nextDragPosition = {
          left: nextLeft,
          top : nextTop,
        };

        this.dragPosition = nextDragPosition;
        this.$store.commit('updateAsideConnector_simpleDebugWindowPosition', this.dragPosition);

        this.fixShowPosition();
      };
      document.onmouseup = docEvent => {
        document.onmousemove = null;
        document.onmouseup   = null;

        this.isDragging = false;
      };
    },
    fixShowPosition() {
      var nextShowPosition = {
        top : this.dragPosition.top,
        left: this.dragPosition.left,
      };

      let $this = document.getElementById('simpleDebugWindow');
      if (!$this) return;

      let maxLeft = window.innerWidth  - $this.offsetWidth - 10;
      let maxTop  = window.innerHeight - $this.offsetHeight - 10;

      // 限位器
      if (nextShowPosition.left < 0) nextShowPosition.left = 0;
      if (nextShowPosition.top  < 0) nextShowPosition.top = 0;
      if (nextShowPosition.left > maxLeft) nextShowPosition.left = maxLeft;
      if (nextShowPosition.top  > maxTop)  nextShowPosition.top  = maxTop;

      this.showPosition = nextShowPosition;
    },
    async queryConnector(queryOptions) {
      this.isQuerying = true;

      let apiRes = await this.T.callAPI('post', '/api/v1/connectors/:id/do/query', {
        params: { id: this.connector.id },
        body: {
          database      : queryOptions.database,
          queryStatement: queryOptions.queryStatement,
          returnType    : 'repr',
        },
        alert : { muteError: true },
        extraOptions: { noCountProcessing: true },
      });

      let result = {
        ok: apiRes.ok
      };

      if (apiRes.ok) {
        result.data = '# pprint.pprint(db_res)\n' + apiRes.data;

        // 生成示例 Python 代码
        let command     = this.CONNECTOR_DEBUGGER_META_MAP[this.connector.type].command;
        let commandArgs = null;

        let resStr    = '';
        let resPicker = '';
        switch(this.connector.type) {
          case 'influxdb':
            commandArgs = [queryOptions.queryStatement];
            resPicker = `if len(db_res.get('series', [])) > 0:\n    for d in db_res['series'][0]['values']:\n        # Your code here...\n        pass`;
            break;

          case 'mysql':
          case 'clickhouse':
          case 'oracle':
          case 'sqlserver':
          case 'postgresql':
            commandArgs = [queryOptions.queryStatement];
            resPicker = `for d in db_res:\n    # Your code here...\n    pass`;
            break;

          case 'redis':
          case 'memcached':
            commandArgs = splitargs(queryOptions.queryStatement);

            resStr = apiRes.data + '';
            if (this.validator.isInt(resStr)) {
              resPicker = `db_res = int(db_res)\n`;
            } else if (this.validator.isFloat(resStr)) {
              resPicker = `db_res = float(db_res)\n`;
            }
            resPicker += `\n# Your code...`;
            break;

          case 'elasticsearch':
            commandArgs = [queryOptions.queryStatement];
            resPicker += `\n# Your code...`;
            break;
        }

        let getHelperCode = `helper = DFF.CONN('${this.connector.id}')`;
        let doQueryCode   = `db_res = helper.${command}('${(commandArgs || []).join("', '")}')`;

        this.$set(this.latestQueryOptionsMap, this.connector.id, {
          database      : queryOptions.database,
          queryStatement: queryOptions.queryStatement,
          queryCode     : `${getHelperCode}\n${doQueryCode}\n${resPicker}`,
        });

      } else {
        result.data = this.$t('Query Failed');

        // 补充错误信息
        if (apiRes.message) {
          result.data += '\n\n' + apiRes.message;
        }
        if (apiRes.detail && apiRes.detail.error) {
          result.data += '\n\n' + apiRes.detail.error;
        }
        if (apiRes.detail && apiRes.detail.message) {
          result.data += '\n\n' + apiRes.detail.message;
        }
      }

      this.$set(this.latestQueryResultMap, this.connector.id, result);

      this.isQuerying = false;
    },
    async browserDataLoader(node, resolve) {
      if (node.isLeaf) return resolve();

      let meta = this.CONNECTOR_DEBUGGER_META_MAP[this.connector.type];
      if (!meta.browsers) return resolve();

      /* 父层数据 */
      let parentData = [];
      if (!node.root) {
        let currentNode = node;
        for (let i = 0; i < 10; i++) {
          if (!currentNode || currentNode.root || !currentNode.data) break;

          parentData.push(currentNode.data);
          currentNode = currentNode.parent;
        }
        parentData.reverse();
      }

      /* 导航到当前节点配置 */
      let browserConfig = meta.browsers;

      for (let level = 0; level < node.level; level++) {
        switch(browserConfig.type) {
          case 'static':
            for (let i = 0; i < browserConfig.data.length; i++) {
              if (browserConfig.data[i].value === parentData[level].value) {
                browserConfig = browserConfig.data[i].sub;
                break;
              }
            }
            break;

          case 'query':
          case 'api':
            browserConfig = browserConfig.sub;
            break;
        }
      }

      /* 获取下层数据 */
      const formatQueryStatement = (statement, thisRef, thisValue) => {
        if (!statement) return null;

        parentData.forEach(d => {
          if (d.ref && d.value) {
            statement = statement.replace(`{${d.ref}}`, d.value);
          }
        });

        if (thisRef && thisValue) {
          statement = statement.replace(`{${thisRef}}`, thisValue);
        }
        return statement;
      }

      let apiRes = null;
      let subNodeData = [];
      switch(browserConfig.type) {
        // static
        case 'static':
          browserConfig.data.forEach(d => {
            subNodeData.push({
              label: d.label,
              value: d.value,
              ref  : d.ref,
              leaf : !!!d.sub,

              example       : formatQueryStatement(d.example,        d.ref, d.value),
              defaultExample: formatQueryStatement(d.defaultExample, d.ref, d.value),
            });
          });
          break;

        // query
        case 'query':
          let queryStatement = formatQueryStatement(browserConfig.query);

          // 查询数据
          apiRes = await this.T.callAPI('post', '/api/v1/connectors/:id/do/query', {
            params: { id: this.connector.id },
            body: {
              database      : this.connector.configJSON.database,
              queryStatement: queryStatement,
              returnType    : 'json',
            },
            alert       : { muteError: true },
            extraOptions: { noCountProcessing: true },
          });
          if (!apiRes.ok) {
            if (node.root) {
              this.browserCascaderErrorMessage = apiRes.message;
            } else {
              resolve([{
                label   : this.$t('Query Failed'),
                value   : null,
                leaf    : true,
                disabled: true,
                isError : true,
              }]);
            }

            return;
          }

          // 提取数据
          switch(this.connector.type) {
            // query/influxdb
            case 'influxdb':
              if (apiRes.data.series && apiRes.data.series.length > 0) {
                apiRes.data.series[0].values.forEach(d => {
                  subNodeData.push({ value: d[0] });
                });
              }
              break;

            // query/mysql
            case 'mysql':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/mysql/table
                  case 'table':
                    subNodeData.push({ value: Object.values(d)[0] });
                    break;

                  // query/mysql/field
                  case 'field':
                    subNodeData.push({ value: d['Field'] });
                    break;

                  // query/mysql/*
                  default:
                    break;
                }
              });
              break;

            // query/redis
            case 'redis':
              apiRes.data[1].forEach(d => {
                subNodeData.push({ value: d });
              })
              break;

            // query/clickhouse
            case 'clickhouse':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/clickhouse/database + table
                  case 'database':
                  case 'table':
                    subNodeData.push({ value: d['name'] });
                    break;

                  // query/clickhouse/field
                  case 'field':
                    subNodeData.push({ value: d['name'] });
                    break;

                  // query/clickhouse/*
                  default:
                    break;
                }
              });
              break;

            // query/oracle
            case 'oracle':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/oracle/table
                  case 'table':
                    subNodeData.push({ value: d['TABLE_NAME'] });
                    break;

                  // query/oracle/field
                  case 'field':
                    subNodeData.push({ value: d['COLUMN_NAME'] });
                    break;

                  // query/oracle/*
                  default:
                    break;
                }
              });
              break;

            // query/sqlserver
            case 'sqlserver':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/sqlserver/table + field
                  case 'table':
                  case 'field':
                    subNodeData.push({ value: d['NAME'] });
                    break;

                  // query/sqlserver/*
                  default:
                    break;
                }
              });
              break;

            // query/postgresql
            case 'postgresql':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/postgresql/schema
                  case 'schema':
                    subNodeData.push({ value: d['schemaname'] });
                    break;

                  // query/postgresql/table
                  case 'table':
                    subNodeData.push({ value: d['tablename'] });
                    break;

                  // query/postgresql/field
                  case 'field':
                    subNodeData.push({ value: d['attname'] });
                    break;

                  // query/postgresql/*
                  default:
                    break;
                }
              });
              break;

            // query/mongodb
            case 'mongodb':
              apiRes.data.forEach(d => {
                switch(browserConfig.ref) {
                  // query/mongodb/database,collection
                  case 'database':
                  case 'collection':
                    subNodeData.push({ value: d });
                    break;
                }
              });
              break;

            // query/elasticsearch
            case 'elasticsearch':
              switch(browserConfig.ref) {
                // query/elasticsearch/index
                case 'index':
                  apiRes.data.forEach(d => {
                    subNodeData.push({ value: d['index'] });
                  })
                  break;

                // query/elasticsearch/field
                case 'field':
                  let _fields = [];
                  try {
                    _fields = Object.keys(Object.values(apiRes.data)[0]['mappings']['properties'])
                  } catch(err) {
                    // Nope
                  };

                  _fields.forEach(d => {
                    subNodeData.push({ value: d });
                  });
                  break;

                // query/elasticsearch/*
                default:
                  break;
              }
              break;

            // query/*
            default:
              break;
          }
          break;

        // api
        case 'api':
          // 查询数据
          apiRes = await this.T.callAPI_get(browserConfig.api, {
            extraOptions: { noCountProcessing: true },
          });
          if (!apiRes.ok) {
            if (node.root) {
              this.browserCascaderErrorMessage = apiRes.message;
            } else {
              resolve([{
                label   : this.$t('Query Failed'),
                value   : null,
                leaf    : true,
                disabled: true,
                isError : true,
              }]);
            }

            return;
          }

          // 提取数据
          switch(this.connector.type) {
            // api/*
            default:
              break;
          }
          break;
      }

      /* 补全其他字段 */
      switch(browserConfig.type) {
        case 'api':
        case 'query':
          subNodeData.forEach(d => {
            d.ref  = browserConfig.ref;
            d.leaf = !!!browserConfig.sub;

            d.example        = formatQueryStatement(browserConfig.example,        d.ref, d.value);
            d.defaultExample = formatQueryStatement(browserConfig.defaultExample, d.ref, d.value);
          });
          break;

        case 'static': // 静态数据不用补全，直接给出
        default:
          break;
      }

      /* 补全是否为默认数据库 */
      subNodeData.forEach(d => {
        d.isDefaultDatabase = (d.ref === 'database' && d.value === this.connector.configJSON.database);
        if (!d.isDefaultDatabase) {
          parentData.forEach(p => {
            if (p.ref === 'database' && p.value ===  this.connector.configJSON.database) {
              d.isDefaultDatabase = true;
            }
          });
        }
        if (d.isDefaultDatabase && d.ref === 'database') {
          d.showDefaultTag = true;
        }
      });

      /* 使用一个禁用选项作为标题 */
      let itemCount = subNodeData.length;
      let title = browserConfig.title || '';
      if (title && itemCount > 0) title = `${title} (${itemCount})`;
      subNodeData.unshift({
        label   : title,
        value   : null,
        leaf    : true,
        disabled: true,
        isTitle : true,
      });
      if (!node.root) {
        this.$set(node.data, 'itemCount', itemCount);
      }

      return resolve(subNodeData);
    },
    updateCodeExample(node) {
      // 展示示例代码
      this.browserCascaderExampleCode = node.data.isDefaultDatabase
                                      ? node.data.defaultExample || node.data.example
                                      : node.data.example;
    },
  },
  computed: {
    CONNECTOR_DEBUGGER_META_MAP() {
      // Redis第一层为Key首字母列表
      let REDIS_BROWSER_KEY = {
        title  : this.$t('Keys (a part of)'),
        type   : 'query',
        query  : 'SCAN 0 MATCH "{pattern}" COUNT 100',
        example: 'TYPE "{key}"',
        ref    : 'key',
      }
      let REDIS_BROWSERS = {
        title: this.$t('Initials'),
        type : 'static',
        data : [],
      };
      let allChars = [];
      for (let charCode = 'a'.charCodeAt(); charCode <= 'z'.charCodeAt(); charCode++) {
        let char = String.fromCharCode(charCode);
        REDIS_BROWSERS.data.push({
          label  : `${char}${char.toUpperCase()}`,
          value  : `[${char.toUpperCase()}${char}]*`,
          example: 'SCAN 0 MATCH "{pattern}" COUNT 100',
          ref    : 'pattern',
          sub    : REDIS_BROWSER_KEY,
        });
        allChars.push(`${char.toUpperCase()}${char}`);
      }
      REDIS_BROWSERS.data.push({
        label  : this.$t('Other'),
        value  : `[^${allChars.join()}]*`,
        example: 'SCAN 0 MATCH "{pattern}" COUNT 100',
        ref    : 'pattern',
        sub    : REDIS_BROWSER_KEY,
      });

      return {
        df_dataway: {
          name           : this.$t('Guance DataWay'),
          supportDebugger: false,
          supportBrowser : false,
          supportDatabase: false,
          tagType        : 'info',
        },
        influxdb: {
          name              : 'InfluxDB',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : null,
          command           : 'query',
          exampleCommandArgs: ['SELECT * FROM some_measurement LIMIT 10'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title         : this.$t('Databases'),
            type          : 'query',
            query         : 'SHOW DATABASES',
            example       : 'SHOW MEASUREMENTS ON "{database}"',
            defaultExample: 'SHOW MEASUREMENTS',
            ref           : 'database',
            sub: {
              title: this.$t('Data'),
              type : 'static',
              data: [
                {
                  value         : this.$t('Measurements'),
                  example       : 'SHOW MEASUREMENTS ON "{database}"',
                  defaultExample: 'SHOW MEASUREMENTS',
                  sub: {
                    title         : this.$t('Measurements'),
                    type          : 'query',
                    query         : 'SHOW MEASUREMENTS ON "{database}"',
                    example       : 'SELECT * FROM "{database}".."{measurement}"',
                    defaultExample: 'SELECT * FROM "{measurement}"',
                    ref           : 'measurement',
                    sub: {
                      type: 'static',
                      data: [
                        {
                          value         : this.$t('Tags'),
                          example       : 'SHOW TAG KEYS ON "{database}" FROM "{measurement}"',
                          defaultExample: 'SHOW TAG KEYS FROM "{measurement}"',
                          sub: {
                            title         : this.$t('Tags'),
                            type          : 'query',
                            query         : 'SHOW TAG KEYS ON "{database}" FROM "{measurement}"',
                            example       : 'SELECT * FROM "{database}".."{measurement}" WHERE "{tagKey}" = \'tagValue\'',
                            defaultExample: 'SELECT * FROM "{measurement}" WHERE "{tagKey}" = \'tagValue\'',
                            ref           : 'tagKey',
                          }
                        },
                        {
                          value         : this.$t('Fields'),
                          example       : 'SHOW FIELD KEYS ON "{database}" FROM "{measurement}"',
                          defaultExample: 'SHOW FIELD KEYS FROM "{measurement}"',
                          sub: {
                            title         : this.$t('Fields'),
                            type          : 'query',
                            query         : 'SHOW FIELD KEYS ON "{database}" FROM "{measurement}"',
                            example       : 'SELECT "{fieldKey}" FROM "{database}".."{measurement}"',
                            defaultExample: 'SELECT "{fieldKey}" FROM "{measurement}"',
                            ref           : 'fieldKey',
                          }
                        },
                      ]
                    }
                  }
                },
                {
                  value         : this.$t('Retention Policies'),
                  example       : 'SHOW RETENTION POLICIES ON "{database}"',
                  defaultExample: 'SHOW RETENTION POLICIES',
                  sub: {
                    title  : this.$t('Retention Policies'),
                    type   : 'query',
                    query  : 'SHOW RETENTION POLICIES ON "{database}"',
                    example: 'SELECT * FROM "{database}"."{retentionPolicy}"."measurement"',
                    ref    : 'retentionPolicy',
                  }
                },
              ],
            },
          },
        },
        mysql: {
          name              : 'MySQL',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'success',
          command           : 'query',
          exampleCommandArgs: ['SELECT * FROM `some_table` LIMIT 10'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title  : this.$t('Tables'),
            type   : 'query',
            query  : 'SHOW TABLES',
            example: 'SELECT * FROM `{table}`',
            ref    : 'table',
            sub: {
              title  : this.$t('Fields'),
              type   : 'query',
              query  : 'SHOW FULL COLUMNS FROM `{table}`',
              example: 'SELECT `{field}` FROM `{table}`',
              ref    : 'field',
            },
          },
        },
        redis: {
          name              : 'Redis',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'danger',
          command           : 'query',
          exampleCommandArgs: ['SCAN', '0', 'COUNT', '10'],
          debuggerName      : this.$t('Command Debugger'),
          browsers          : REDIS_BROWSERS,
        },
        memcached: {
          name              : 'Memcached',
          supportDebugger   : true,
          supportBrowser    : false,
          supportDatabase   : false,
          tagType           : 'success',
          command           : 'query',
          exampleCommandArgs: ['GET', 'key'],
          debuggerName      : this.$t('Command Debugger'),
        },
        clickhouse: {
          name              : 'ClickHouse',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'warning',
          command           : 'query',
          exampleCommandArgs: ['SELECT * FROM some_table LIMIT 10'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title         : this.$t('Databases'),
            type          : 'query',
            query         : 'SHOW DATABASES',
            example       : 'SHOW TABLES FROM `{database}`',
            defaultExample: 'SHOW TABLES',
            ref           : 'database',
            sub: {
              title         : this.$t('Tables'),
              type          : 'query',
              query         : 'SHOW TABLES FROM `{database}`',
              example       : 'SELECT * FROM `{database}`.`{table}`',
              defaultExample: 'SELECT * FROM `{table}`',
              ref           : 'table',
              sub: {
                title         : this.$t('Fields'),
                type          : 'query',
                query         : 'DESCRIBE TABLE `{database}`.`{table}`',
                example       : 'SELECT `{field}` FROM `{database}`.`{table}`',
                defaultExample: 'SELECT `{field}` FROM `{table}`',
                ref           : 'field',
              },
            },
          },
        },
        oracle: {
          name              : 'Oracle',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'danger',
          command           : 'query',
          exampleCommandArgs: ['SELECT * FROM SOME_TABLE WHERE ROWNUM <= 10'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title  : this.$t('Tables'),
            type   : 'query',
            query  : "SELECT TABLE_NAME FROM USER_TABLES",
            example: 'SELECT * FROM {table}',
            ref    : 'table',
            sub: {
              title  : this.$t('Fields'),
              type   : 'query',
              query  : "SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME='{table}'",
              example: 'SELECT {field} FROM {table}',
              ref    : 'field',
            },
          },
        },
        sqlserver: {
          name              : 'SQLServer',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'info',
          command           : 'query',
          exampleCommandArgs: ['SELECT TOP 10 * FROM some_table'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title  : this.$t('Tables'),
            type   : 'query',
            query  : `SELECT [NAME] FROM [sys].[TABLES]`,
            example: 'SELECT * FROM [{table}]',
            ref    : 'table',
            sub: {
              title  : this.$t('Fields'),
              type   : 'query',
              query  : `SELECT NAME FROM SYSCOLUMNS WHERE ID = object_id('{table}')`,
              example: 'SELECT [{field}] FROM [{table}]',
              ref    : 'field',
            },
          },
        },
        postgresql: {
          name              : 'PostgreSQL',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : true,
          tagType           : 'info',
          command           : 'query',
          exampleCommandArgs: ['SELECT * FROM some_table LIMIT 10'],
          debuggerName      : this.$t('SQL Debugger'),
          browsers: {
            title         : 'Schema',
            type          : 'query',
            query         : `SELECT DISTINCT "schemaname" FROM "pg_tables" GROUP BY "schemaname" ORDER BY "schemaname"`,
            example       : `SELECT "tablename" FROM "pg_tables" WHERE "schemaname" = 'public'`,
            defaultExample: `SELECT "tablename" FROM "pg_tables" WHERE "schemaname" = 'public'`,
            ref           : 'schema',
            sub: {
              title         : this.$t('Tables'),
              type          : 'query',
              query         : `SELECT "tablename" FROM "pg_tables" WHERE "schemaname" = '{schema}'`,
              example       : 'SELECT * FROM "{schema}"."{table}"',
              defaultExample: 'SELECT * FROM "{table}"',
              ref           : 'table',
              sub: {
                title         : this.$t('Fields'),
                type          : 'query',
                query         : `SELECT "A"."attname" FROM "pg_class" AS "C", "pg_attribute" AS "A" WHERE "A"."attrelid" = "C"."oid" AND "A"."attnum" > 0 AND "C"."relname" = '{table}'`,
                example       : 'SELECT "{field}" FROM "{schema}"."{table}"',
                defaultExample: 'SELECT "{field}" FROM {table}"',
                ref           : 'field',
              },
            },
          },
        },
        mongodb: {
          name              : 'mongoDB',
          supportDebugger   : false,
          supportBrowser    : true,
          supportDatabase   : false,
          tagType           : 'success',
          command           : 'query',
          exampleCommandArgs: ['GET /_search?q=field:value'],
          debuggerName      : this.$t('URI Query Debugger'),
          browsers          : {
            title         : this.$t('Databases'),
            type          : 'query',
            query         : `{"method": "list_database_names"}`,
            example       : `# Python\ndata = helper.db('{database}')`,
            defaultExample: `# Python\ndata = helper.db()`,
            ref           : 'database',
            sub: {
              title         : this.$t('Collections'),
              type          : 'query',
              query         : `{"method": "list_collection_names", "db_name": "{database}"}`,
              example       : `# Python\ndata = helper.db('{database}')['{collection}'].find_one()`,
              defaultExample: `# Python\ndata = helper.db()['{collection}'].find_one()`,
              ref           : 'collection',
            }
          },
        },
        elasticsearch: {
          name              : 'ES',
          supportDebugger   : true,
          supportBrowser    : true,
          supportDatabase   : false,
          tagType           : 'success',
          command           : 'query',
          exampleCommandArgs: ['GET /_search?q=field:value'],
          debuggerName      : this.$t('URI Query Debugger'),
          browsers          : {
            title         : this.$t('Indices'),
            type          : 'query',
            query         : `GET /_cat/indices`,
            example       : `GET /{index}/_search`,
            defaultExample: `GET /{index}/_search`,
            ref           : 'index',
            sub: {
              title         : this.$t('Fields'),
              type          : 'query',
              query         : `GET /{index}/_mapping`,
              example       : `GET /{index}/_search?q={field}:something`,
              defaultExample: `GET /{index}/_search?q={field}:something`,
              ref           : 'field',
            },
          },
        },
      }
    },
  },
  props: {
  },
  data() {
    let dragPosition = this.$store.state.asideConnector_simpleDebugWindowPosition || { left: 10, bottom: 10 };

    return {
      show: false,
      isQuerying: false,
      selectedTab: 'browser',

      showPosition: this.T.jsonCopy(dragPosition),
      dragPosition: this.T.jsonCopy(dragPosition),
      isDragging  : false,

      connector: {},

      latestQueryOptionsMap: {},
      latestQueryResultMap : {},

      browserCascaderProps: {
        lazy    : true,
        lazyLoad: this.browserDataLoader,
      },
      browserCascaderExampleCode : '',
      browserCascaderErrorMessage: '',
    }
  },
  mounted() {
    window.addEventListener('resize', this.fixShowPosition, false);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.fixShowPosition, false);
  },
}
</script>

<style scoped>
.simple-debug-window {
  position: fixed;
  z-index: 2047;
  height: 360px;
  width: 610px;
  border: 1px;
  border-radius: 5px;
  background-color: white;
  border: 5px solid lightgrey;
  box-shadow: grey 5px 5px 5px;
}
.simple-debug-dragging-cover {
  background-color: lightgrey;
  height: 324px;
  width: 100%;
  position: absolute;
  z-index: 5;
  opacity: .7;
  text-align: center;
}
.simple-debug-dragging-cover-tip {
  position: relative;
  font-size: 30px;
  top: 30%;
  background: black;
  padding: 5px 10px;
  border-radius: 5px;
  color: white;
}
.simple-debug-header {
  cursor: move;
  width: 100%;
  height: 35px;
  border-bottom: 1px solid lightgrey;
}
.simple-debug-title {
  font-size: 16px;
  line-height: 35px;
  margin-left: 10px;
}
.simple-debug-close {
  cursor: pointer !important;
  float: right;
  margin-right: 10px;
  line-height: 36px;
}
.simple-debug-sql {
  padding: 5px;
  padding-bottom: 0;
}
.simple-debug-sql .el-form-item {
  margin-bottom: 5px !important;
}
.simple-debug-sql .simple-debug-database {
  width: 120px;
}
.simple-debug-sql .simple-debug-copy-content {
  float: right;
}
.simple-debug-sql pre.simple-debug-result {
  padding: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  height: 145px;
  overflow: auto;
  white-space: pre;
}
.simple-debug-sql pre.simple-debug-query-failed {
  color: red;
}
.simple-debug-browser {
  padding: 5px;
  padding-bottom: 0;
}
.simple-debug-browser .el-form-item {
  margin-bottom: 5px !important;
}
.simple-debug-browser-cascader-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.simple-debug-browser-cascader-item span {
  font-family: monospace;
}
.simple-debug-browser pre.simple-debug-browser-example-code {
  padding: 5px;
  padding-right: 25px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  margin: 0;
  height: 40px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 14px;
}
.simple-debug-browser .simple-debug-browser-example-code-copy {
  position: absolute;
  right: 10px;
  top: 8px;
}
.simple-debug-browser .simple-debug-browser-example-code-copy {
  position: absolute;
  right: 6px;
  top: 8px;
}
.simple-debug-browser .simple-debug-browser-error {
  margin: 10px;
}
.builtin {
  color: orangered;
}
</style>

<style>
.simple-debug-window > .el-tabs {
  border: none;
}
.simple-debug-window > .el-tabs > .el-tabs__content {
  height: 295px;
  padding: 0;
}
.simple-debug-window > .el-tabs > .el-tabs__header {
  margin-top: 0;
}
.simple-debug-window > .el-tabs > .el-tabs__header .el-tabs__item {
  height: 30px;
  line-height: 30px;
}
.simple-debug-browser-cascader .el-cascader-node {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  padding-left: 0;
  padding-right: 15px;
}
.simple-debug-browser-cascader .el-cascader-menu {
  min-width: 120px;
}
.simple-debug-browser-cascader .el-cascader-menu__wrap {
  height: 224px;
}
.simple-debug-browser-cascader .el-cascader-node__prefix {
  display: none;
}
</style>
