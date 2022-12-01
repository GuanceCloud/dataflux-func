<i18n locale="zh-CN" lang="yaml">
About             : 关于
System Information: 系统信息
System Report     : 系统报告
Infomation        : 信息
Version           : 版本号
Architecture      : 架构
Node Version      : Node 版本
Python Version    : Python 版本
Release date      : 发布日期
'Loading...'      : '加载中...'
Get System Report : 获取系统报告

Clear Worker Queue : 清空工作队列
Clear Log and Cache: 清空日志与缓存表

Worker Queue cleared : 工作队列已清空
Log and Cache cleared: 日志与缓存表已清空

'You are using {browser} (engine: {engine}) browser': 您正在使用 {browser}（{engine}）浏览器
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
              <p class="text-main browser-detect">{{ $t('You are using {browser} (engine: {engine}) browser', { browser: T.getBrowser(), engine: T.getEngine() }) }}</p>
              <br>

              <!-- DataFlux Func Server -->
              <el-divider content-position="left"><h1>{{ $t('System Information') }}</h1></el-divider>

              <el-form label-width="120px">
                <el-form-item :label="$t('Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.version"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Architecture')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.architecture"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Node Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.nodeVersion"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Python Version')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="about.pythonVersion"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Release date')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="releaseDateTEXT"></el-input>
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
                    <InfoBlock type="info" :title="`节点完整名称为：\n&quot;celery@{编号}&quot;`"></InfoBlock>
                    <InfoBlock type="info" :title="`工作队列完整 Key 格式为：\n&quot;DataFluxFunc-worker#workerQueue@{序号}&quot;`"></InfoBlock>
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
                      <el-dropdown-item v-for="q in workerQueues" :key="q.name" :command="q.name">队列 #{{ q.name }} (存在 {{ q.value }} 个待处理任务)</el-dropdown-item>
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
          nodeVersion     : apiRes.data.NODE_VERSION,
          pythonVersion   : apiRes.data.PYTHON_VERSION,
          releaseTimestamp: apiRes.data.CREATE_TIMESTAMP,
        };

      } else {
        this.about = {
          version      : this.NO_INFO_TEXT,
          architecture : this.NO_INFO_TEXT,
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
      if (!await this.T.confirm(`是否确认清空队列 "#${queue}" ？`)) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/monitor/worker-queues/do/clear', {
        body : { workerQueues: [queue] },
        alert: { okMessage: `工作队列 "#${queue}" 已被清空
            <br><small>请注意系统报告内数据可能存在延迟<small>` },
      });
    },
    async clearLogCacheTables() {
      if (!await this.T.confirm(`是否确认清空日志/缓存表？`)) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/log-cache-tables/do/clear', {
        alert: { okMessage: `日志/缓存表已被清空
            <br><small>请注意系统报告内数据可能存在延迟<small>` },
      });
    },
  },
  computed: {
    NO_INFO_TEXT() {
      return '暂无数据';
    },
    systemReportTEXT() {
      return [
          '[数据库结构版本]',     this.dbSchemaVersionInfoTEXT,
        '\n[Web服务CPU使用率]',   this.serverCPUPercentInfoTEXT,
        '\n[Web服务内存使用量]',  this.serverMemoryRSSInfoTEXT,
        '\n[Worker CPU使用率]',   this.workerCPUPercentInfoTEXT,
        '\n[Worker内存使用量]',   this.workerMemoryPSSInfoTEXT,
        '\n[数据库磁盘使用量]',   this.dbDiskUsedInfoTEXT,
        '\n[缓存数据库序号]',     this.cacheDBNumberInfoTEXT,
        '\n[缓存键数量]',         this.cacheDBKeyUsedInfoTEXT,
        '\n[缓存内存使用量]',     this.cacheDBMemoryUsedInfoTEXT,
        '\n[Worker节点状态]',     this.nodesStatsInfoTEXT,
        '\n[Worker队列分布]',     this.nodesActiveQueuesInfoTEXT,
        '\n[Worker队列长度]',     this.workerQueueLengthInfoTEXT,
      ].join('\n');
    },
    releaseDateTEXT() {
      let releaseDate    = '';
      let releaseFromNow = '';
      if (this.about.releaseTimestamp > 0) {
        let _t = this.about.releaseTimestamp * 1000;
        releaseDate    = this.M.utc(_t).locale(this.$store.getters.uiLocale).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
        releaseFromNow = this.M.utc(_t).locale(this.$store.getters.uiLocale).fromNow();
      }

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
.browser-detect {
  position: relative;
  left: 45px;
  top: -20px;
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
