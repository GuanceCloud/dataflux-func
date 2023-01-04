<i18n locale="en" lang="yaml">
taskRemain: '(remain {n} task to process) | (remain {n} tasks to process)'
</i18n>

<i18n locale="zh-CN" lang="yaml">
About: 关于

'You are using {0} browser'      : 您正在使用 {0} 浏览器
'In this system:'                : '在本系统中：'
'Monospaced font is from {0}'    : '等宽字体来自 {0}'
'Icons used are from {0}'        : '图标来自 {0}'
'Illustrations used are from {0}': '插图来自 {0}'


Version Information: 版本信息
System Report      : 系统报告
Version            : 版本
Architecture       : 架构
Vue Version        : Vue 版本
Node Version       : Node 版本
Python Version     : Python 版本
Release Date       : 发布日期
'Loading...'       : '加载中...'
Get System Report  : 获取系统报告

Clear Worker Queue : 清空工作队列
Clear Log and Cache: 清空日志与缓存表

Worker Queue cleared : 工作队列已清空
Log and Cache cleared: 日志与缓存表已清空
Please note that there may be a delay in the system reporting: 请注意系统报告数据可能存在延迟

'Full Node name is celery@{Number}'                                 : 完整节点名称为 celery@{编号}
'Full Worker Queue name is DataFluxFunc-worker#workerQueue@{Number}': 完整工作队列名称为 DataFluxFunc-worker#workerQueue@{序号}

taskRemain: （存在 {n} 个待处理任务）

Are you sure you want to clear the Worker Queue?: 是否确认清空此工作队列？
Are you sure you want to clear the Log and Cache?: 是否确认清空日志与缓存表？

DB Schema Version        : 数据库结构版本
Web Server CPU Usage     : Web 服务 CPU 使用率
Web Server Memory Usage  : Web 服务内存使用量
Worker CPU Usage         : Worker CPU 使用率
Worker Memory Usage      : Worker 内存使用量
DB Disk Usage            : 数据库磁盘使用量
Cache DB Number          : 缓存数据库序号
Cache Key Count          : 缓存键数量
Cache Memory Usage       : 缓存内存使用量
Worker Node Status       : Worker 节点状态
Wroker Queue Distribution: Worker 队列分布
Wroker Queue Length      : Worker 队列长度
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('About') }}</h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="about-form">
              <div class="announce">
                <p>
                  <i18n path="You are using {0} browser">
                    <span class="text-main">{{ T.getBrowser() }} ({{ T.getEngine() }})</span>
                  </i18n>
                </p>
                <p>
                  {{ $t('In this system:') }}
                  <ul>
                    <li>
                      <i18n path="Monospaced font is from {0}">
                        <el-link href="https://typeof.net/Iosevka/"  target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Iosevka
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Icons used are from {0}">
                        <el-link href="https://fontawesome.com/v4/"  target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Font Awesome (v4)
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Illustrations used are from {0}">
                        <el-link href="https://flexiple.com/illustrations/"  target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Scale by flexiple
                        </el-link>
                      </i18n>
                    </li>
                  </ul>
                </p>
              </div>

              <!-- DataFlux Func Server -->
              <el-divider content-position="left"><h1>{{ $t('Version Information') }}</h1></el-divider>

              <el-form label-width="120px">
                <el-form-item :label="$t('Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.version"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Architecture')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.architecture"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Release Date')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="releaseDateTEXT"></el-input>
                </el-form-item>

                <br>

                <el-form-item :label="$t('Vue Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.vueVersion"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Node Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.nodeVersion"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Python Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.pythonVersion"></el-input>
                </el-form-item>
              </el-form>

              <!-- 系统报告 -->
              <br>
              <el-divider content-position="left"><h1>{{ $t('System Report') }}</h1></el-divider>

              <el-form label-width="120px">
                <template v-if="showSystemReport">
                  <el-form-item>
                    <el-input :placeholder="$t('Loading...')"
                      type="textarea"
                      autosize
                      resize="none"
                      :readonly="true"
                      :value="systemReportTEXT"></el-input>
                  </el-form-item>

                  <el-form-item>
                    <InfoBlock type="info" :title="$t('Full Node name is celery@{Number}')" />
                    <InfoBlock type="info" :title="$t('Full Worker Queue name is DataFluxFunc-worker#workerQueue@{Number}')" />
                  </el-form-item>
                </template>

                <el-form-item>
                  <el-button @click="getSystemReport">{{ $t('Get System Report') }}</el-button>
                </el-form-item>

                <el-form-item>
                  <el-button @click="clearLogCacheTables" v-if="dbDiskUsedInfoTEXT">{{ $t('Clear Log and Cache') }}</el-button>

                  <el-dropdown trigger="click" @command="clearWorkerQueue" v-if="workerQueues.length > 0">
                    <el-button>{{ $t('Clear Worker Queue') }}</el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item disabled>
                        {{ $t('Clear Worker Queue') }}
                      </el-dropdown-item>
                      <el-dropdown-item v-for="q, i in workerQueues" :key="q.name" :command="q.name" :divided="i === 0">
                        &emsp;<span class="code-font">#{{ q.name }}</span>
                        <small class="text-info">{{ $tc('taskRemain', q.value ) }}</small>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'About',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
  },
  methods: {
    // 镜像信息
    async _getVersion() {
      let apiRes = await this.T.callAPI_get('/api/v1/image-info/do/get');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        this.about = {
          version         : apiRes.data.CI_COMMIT_REF_NAME,
          architecture    : apiRes.data.ARCHITECTURE,
          vueVersion      : Vue.version,
          nodeVersion     : apiRes.data.NODE_VERSION,
          pythonVersion   : apiRes.data.PYTHON_VERSION,
          releaseTimestamp: apiRes.data.CREATE_TIMESTAMP,
        };

      } else {
        this.about = {
          version      : this.NO_INFO_TEXT,
          architecture : this.NO_INFO_TEXT,
          vueVersion   : this.NO_INFO_TEXT,
          nodeVersion  : this.NO_INFO_TEXT,
          pythonVersion: this.NO_INFO_TEXT,
          releaseDate  : this.NO_INFO_TEXT,
        }
      }
    },
    // 数据库结构版本
    async _getDBSchemaVersion() {
      this.dbSchemaVersionInfoTEXT = '';

      let apiRes = await this.T.callAPI_get('/api/v1/upgrade-info', {
        query: { seq: 'latest' },
      });
      if (apiRes.ok) {
        if (this.T.isNothing(apiRes.data)) {
          this.dbSchemaVersionInfoTEXT = `seq = 0`;
        } else {
          this.dbSchemaVersionInfoTEXT = `seq = ${apiRes.data[0].seq}`;
        }

      } else {
        this.dbSchemaVersionInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // 系统信息
    async _getSysStats() {
      this.serverCPUPercentInfoTEXT  = '';
      this.serverMemoryRSSInfoTEXT   = '';
      this.workerCPUPercentInfoTEXT  = '';
      this.workerMemoryPSSInfoTEXT   = '';
      this.dbDiskUsedInfoTEXT        = '';
      this.cacheDBMemoryUsedInfoTEXT = '';
      this.cacheDBKeyUsedInfoTEXT    = '';
      this.workerQueueLengthInfoTEXT = '';

      let apiRes = await this.T.callAPI_get('/api/v1/monitor/sys-stats/do/get');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        let _getInfo = (tsDataMap, unit, prefix) => {
          unit   = unit   || '';
          prefix = prefix || '';

          if (Array.isArray(tsDataMap)) {
            tsDataMap = { '': tsDataMap };
          }

          let infoLines = [];

          let maxNameLength = 0;
          for (let name in tsDataMap) {
            if (name.length > maxNameLength) maxNameLength = name.length;
          }

          for (let name in tsDataMap) {
            let tsData = tsDataMap[name];

            // 忽略无数据条目
            if (this.T.isNothing(tsData)) continue;

            let latestPoint = tsData.slice(-1)[0];

            // 忽略超过15分钟无数据的条目
            let latestTimestamp = latestPoint[0];
            if (Date.now() - latestTimestamp > 15 * 60 * 1000) continue;

            let latestValue = latestPoint[1];
            let padding = ' '.repeat(maxNameLength - name.length);

            if (Array.isArray(unit)) {
              unit = latestValue > 1 ? unit[0] : unit[1];
            }
            infoLines.push(`${prefix}${name}${padding} = ${latestValue}${unit}`);
          }

          return infoLines.join('\n');
        }

        let sysStats = apiRes.data;

        this.serverCPUPercentInfoTEXT  = _getInfo(sysStats.serverCPUPercent,  '%');
        this.serverMemoryRSSInfoTEXT   = _getInfo(sysStats.serverMemoryRSS,   ' MB');
        this.workerCPUPercentInfoTEXT  = _getInfo(sysStats.workerCPUPercent,  '%');
        this.workerMemoryPSSInfoTEXT   = _getInfo(sysStats.workerMemoryPSS,   ' MB');
        this.dbDiskUsedInfoTEXT        = _getInfo(sysStats.dbDiskUsed,        ' MB');
        this.cacheDBKeyUsedInfoTEXT    = _getInfo(sysStats.cacheDBKeyUsed,    [' Keys', ' Key']);
        this.cacheDBMemoryUsedInfoTEXT = _getInfo(sysStats.cacheDBMemoryUsed, ' MB');
        this.workerQueueLengthInfoTEXT = _getInfo(sysStats.workerQueueLength, [' Tasks', ' Task'], '#');

        // 提取工作队列
        let workerQueues = [];
        for (let name in sysStats.workerQueueLength) {
          let tsData = sysStats.workerQueueLength[name];
          workerQueues.push({ name: name, value: tsData.slice(-1)[0][1] });
        }
        this.workerQueues = workerQueues;

      } else {
        this.serverCPUPercentInfoTEXT  = this.NO_INFO_TEXT;
        this.serverMemoryRSSInfoTEXT   = this.NO_INFO_TEXT;
        this.workerCPUPercentInfoTEXT  = this.NO_INFO_TEXT;
        this.workerMemoryPSSInfoTEXT   = this.NO_INFO_TEXT;
        this.dbDiskUsedInfoTEXT        = this.NO_INFO_TEXT;
        this.cacheDBKeyUsedInfoTEXT    = this.NO_INFO_TEXT;
        this.cacheDBMemoryUsedInfoTEXT = this.NO_INFO_TEXT;
        this.workerQueueLengthInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // Worker工作单元信息
    async _getNodesStats() {
      this.nodesStatsInfoTEXT = '';

      let apiRes = await this.T.callAPI_get('/api/v1/monitor/nodes/do/get-stats');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        let infoLines = [];
        apiRes.data.forEach(d => {
          let nodeShortName = d.node.split('@')[1];
          infoLines.push(`\nNODE = ${nodeShortName}`);

          infoLines.push(`  Pool   = ${d.pool.processes.length} / ${d.pool['max-concurrency']}`);
          infoLines.push(`  Proc   = ${d.pool.processes.join(', ')}`);
          infoLines.push(`  Dist#  = ${d.pool.writes.raw} Tasks`);
          infoLines.push(`  Dist%  = ${d.pool.writes.all}`);
          infoLines.push(`  maxrss = ${(d.rusage.maxrss / 1024).toFixed(2)} MB`);  // 最大常驻
          infoLines.push(`  ixrss  = ${(d.rusage.ixrss  / 1024).toFixed(2)} MB`);  // 代码段
          infoLines.push(`  idrss  = ${(d.rusage.idrss  / 1024).toFixed(2)} MB`);  // 数据段
          infoLines.push(`  isrss  = ${(d.rusage.isrss  / 1024).toFixed(2)} MB`);  // 栈

          this.cacheDBNumberInfoTEXT = ` = ${d.broker.virtual_host}`;
        });

        this.nodesStatsInfoTEXT = infoLines.join('\n').trim();

      } else {
        this.nodesStatsInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // Worker工作单元监听队列
    async _getNodesActiveQueues() {
      this.nodesActiveQueuesInfoTEXT = '';

      let apiRes = await this.T.callAPI_get('/api/v1/monitor/nodes/do/get-active-queues');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        let infoLines = [];
        apiRes.data.forEach(d => {
          let nodeShortName = d.node.split('@')[1];
          infoLines.push(`\nNODE = ${nodeShortName}`);

          let activeQueues = d.activeQueues.map(q => '#' + q.shortName);
          infoLines.push(`  ${activeQueues.join(', ')}`);
          infoLines.push(`  --- ${d.activeQueues.length} Active Queues ---`)
        });

        this.nodesActiveQueuesInfoTEXT = infoLines.join('\n').trim();

      } else {
        this.nodesActiveQueuesInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    async loadData() {
      this.$store.commit('updateLoadStatus', true);

      this._getVersion();
    },
    async getSystemReport() {
      this.showSystemReport = true;

      this._getDBSchemaVersion();
      this._getSysStats();
      this._getNodesStats();
      this._getNodesActiveQueues();
    },
    async clearWorkerQueue(queue) {
      if (!await this.T.confirm(this.$t('Are you sure you want to clear the Worker Queue?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/monitor/worker-queues/do/clear', {
        body : { workerQueues: [queue] },
        alert: { okMessage: `${this.$t('Worker Queue cleared')}
            <br><small>${this.$t('Please note that there may be a delay in the system reporting')}<small>` },
      });
    },
    async clearLogCacheTables() {
      if (!await this.T.confirm(this.$t('Are you sure you want to clear the Log and Cache?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/log-cache-tables/do/clear', {
        alert: { okMessage: `${this.$t('Log and Cache cleared')}
            <br><small>${this.$t('Please note that there may be a delay in the system reporting')}<small>` },
      });
    },
  },
  computed: {
    NO_INFO_TEXT() {
      return this.$t('No Data');
    },
    systemReportTEXT() {
      return [
          `[${this.$t('DB Schema Version')}]`,         this.dbSchemaVersionInfoTEXT,
        `\n[${this.$t('Web Server CPU Usage')}]`,      this.serverCPUPercentInfoTEXT,
        `\n[${this.$t('Web Server Memory Usage')}]`,   this.serverMemoryRSSInfoTEXT,
        `\n[${this.$t('Worker CPU Usage')}]`,          this.workerCPUPercentInfoTEXT,
        `\n[${this.$t('Worker Memory Usage')}]`,       this.workerMemoryPSSInfoTEXT,
        `\n[${this.$t('DB Disk Usage')}]`,             this.dbDiskUsedInfoTEXT,
        `\n[${this.$t('Cache DB Number')}]`,           this.cacheDBNumberInfoTEXT,
        `\n[${this.$t('Cache Key Count')}]`,           this.cacheDBKeyUsedInfoTEXT,
        `\n[${this.$t('Cache Memory Usage')}]`,        this.cacheDBMemoryUsedInfoTEXT,
        `\n[${this.$t('Worker Node Status')}]`,        this.nodesStatsInfoTEXT,
        `\n[${this.$t('Wroker Queue Distribution')}]`, this.nodesActiveQueuesInfoTEXT,
        `\n[${this.$t('Wroker Queue Length')}]`,       this.workerQueueLengthInfoTEXT,
      ].join('\n');
    },
    releaseDateTEXT() {
      let releaseDate    = '';
      let releaseFromNow = '';
      let releaseTimestamp = Date.now();
      if (this.about.releaseTimestamp > 0) {
        let releaseTimestamp = this.about.releaseTimestamp * 1000;
      }

      releaseDate    = this.M.utc(releaseTimestamp).locale(this.T.getUILocale()).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
      releaseFromNow = this.M.utc(releaseTimestamp).locale(this.T.getUILocale()).fromNow();

      if (releaseDate && releaseFromNow) {
        return `${releaseDate} ${this.$t('(')}${releaseFromNow}${this.$t(')')}`
      } else {
        return '-';
      }
    },
  },
  props: {
  },
  data() {
    return {
      about: {},

      showSystemReport: false,

      dbSchemaVersionInfoTEXT  : '',
      dbDiskUsedInfoTEXT       : '',
      cacheDBNumberInfoTEXT    : '',
      cacheDBKeyUsedInfoTEXT   : '',
      cacheDBMemoryUsedInfoTEXT: '',
      serverCPUPercentInfoTEXT : '',
      serverMemoryRSSInfoTEXT  : '',
      workerCPUPercentInfoTEXT : '',
      workerMemoryPSSInfoTEXT  : '',
      nodesStatsInfoTEXT       : '',
      nodesActiveQueuesInfoTEXT: '',
      workerQueueLengthInfoTEXT: '',

      workerQueues: [],
    }
  },
}
</script>

<style scoped>
.announce {
  position: relative;
  left: 45px;
  top: -20px;
}
.announce li {
  margin-top: 10px;
}
.about-form {
  width: 600px;
}
</style>
<style>
.about-no-info input {
  color: red !important;
}
.about-form textarea {
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
}
</style>
