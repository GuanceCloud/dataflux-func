<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          关于
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="about-form">
              <!-- DataFlux Func Server -->
              <el-divider content-position="left">
                <Logo type="auto" style="margin-bottom: -9px;"></Logo>
                <el-tag type="warning" class="about-dataflux-func-part">Server</el-tag>
              </el-divider>

              <el-form label-width="120px">
                <el-form-item label="版本号">
                  <el-input placeholder="获取中..." :readonly="true" :value="aboutWeb.version"></el-input>
                </el-form-item>

                <el-form-item label="发布日期">
                  <el-input placeholder="获取中..." :readonly="true" :value="aboutWeb.releaseDate"></el-input>
                </el-form-item>
              </el-form>

              <!-- DataFlux Func Worker -->
              <br>
              <el-divider content-position="left">
                <Logo type="auto" style="margin-bottom: -9px;"></Logo>
                <el-tag type="success" class="about-dataflux-func-part">Worker</el-tag>
              </el-divider>

              <el-form label-width="120px">
                <el-form-item label="版本号">
                  <el-input placeholder="获取中..." :readonly="true" :value="aboutWorker.version"></el-input>
                </el-form-item>

                <el-form-item label="发布日期">
                  <el-input placeholder="获取中..." :readonly="true" :value="aboutWorker.releaseDate"></el-input>
                </el-form-item>
              </el-form>

              <!-- 系统报告 -->
              <br>
              <el-divider content-position="left"><h1>系统报告</h1></el-divider>

              <el-form label-width="120px">
                <template v-if="showSystemReport">
                  <el-form-item>
                    <el-input placeholder="获取中..."
                      type="textarea"
                      autosize
                      :readonly="true"
                      :value="systemReportTEXT"></el-input>
                  </el-form-item>

                  <el-form-item>
                    <InfoBlock type="info" :title="`节点完整名称为：\n&quot;celery@{编号}&quot;`"></InfoBlock>
                    <InfoBlock type="info" :title="`工作队列完整 Key 格式为：\n&quot;FTDataProcessor#workerQueue@{名称}&quot;`"></InfoBlock>
                  </el-form-item>
                </template>

                <el-form-item>
                  <el-button @click="getSystemReport">{{ showSystemReport ? '重新' : '' }}获取系统报告</el-button>

                  <el-button @click="clearLogCacheTables" v-if="dbDiskUsedInfoTEXT">清空日志/缓存表</el-button>

                  <el-dropdown trigger="click" @command="clearWorkerQueue" v-if="workerQueues.length > 0">
                    <el-button>清空工作队列</el-button>
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
    // Web镜像信息
    async _getWebVersion() {
      let apiRes = await this.T.callAPI('/api/v1/image-info/do/get', {
        alert: {entity: 'Web镜像信息'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
        this.aboutWeb = {
          version    : apiRes.data.CI_COMMIT_REF_NAME,
          releaseDate: this.M.utc(apiRes.data.CREATE_TIMESTAMP * 1000).locale('zh_CN').utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
        };

      } else {
        this.aboutWorker = {
          version    : this.NO_INFO_TEXT,
          releaseDate: this.NO_INFO_TEXT,
        }
      }
    },
    // Worker镜像信息
    async _getWorkerVersion() {
      let apiRes = await this.T.callAPI('/api/v1/worker-image-info/do/get', {
        alert: {entity: 'Worker镜像信息'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
        this.aboutWorker = {
          version    : apiRes.data.CI_COMMIT_REF_NAME,
          releaseDate: this.M.utc(apiRes.data.CREATE_TIMESTAMP * 1000).locale('zh_CN').utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
        };

      } else {
        this.aboutWorker = {
          version    : this.NO_INFO_TEXT,
          releaseDate: this.NO_INFO_TEXT,
        }
      }
    },
    // 数据库结构版本
    async _getDBSchemaVersion() {
      this.dbVersionInfoTEXT = '';

      let apiRes = await this.T.callAPI('/api/v1/upgrade-info', {
        query: {seq: 'latest'},
        alert: {entity: '数据库结构版本'},
      });
      if (apiRes.ok) {
        if (this.T.isNothing(apiRes.data)) {
          this.dbVersionInfoTEXT = `seq = 0`;
        } else {
          this.dbVersionInfoTEXT = `seq = ${apiRes.data[0].seq}`;
        }

      } else {
        this.dbVersionInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // 系统信息
    async _getSysStats() {
      this.serverCPUPercentInfoTEXT  = '';
      this.serverMemoryRSSInfoTEXT   = '';
      this.dbDiskUsedInfoTEXT        = '';
      this.cacheDBMemoryUsedInfoTEXT = '';
      this.cacheDBKeyUsedInfoTEXT    = '';
      this.workerQueueLengthInfoTEXT = '';

      let apiRes = await this.T.callAPI('/api/v1/monitor/sys-stats/do/get', {
        alert: {entity: '系统信息'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
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
            if (Date.now() - latestTimestamp > 15 * 60 * 1000) return;

            let latestValue = latestPoint[1];
            let padding = ' '.repeat(maxNameLength - name.length);

            infoLines.push(`${prefix}${name}${padding} = ${latestValue}${unit}`);
          }

          return infoLines.join('\n');
        }

        let sysStats = apiRes.data.sysStats;

        this.serverCPUPercentInfoTEXT  = _getInfo(sysStats.serverCPUPercent,  '%');
        this.serverMemoryRSSInfoTEXT   = _getInfo(sysStats.serverMemoryRSS,   ' MiB');
        this.dbDiskUsedInfoTEXT        = _getInfo(sysStats.dbDiskUsed,        ' MiB');
        this.cacheDBKeyUsedInfoTEXT    = _getInfo(sysStats.cacheDBKeyUsed,    ' Keys');
        this.cacheDBMemoryUsedInfoTEXT = _getInfo(sysStats.cacheDBMemoryUsed, ' MiB');
        this.workerQueueLengthInfoTEXT = _getInfo(sysStats.workerQueueLength, ' Tasks', '#');

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
        this.dbDiskUsedInfoTEXT        = this.NO_INFO_TEXT;
        this.cacheDBKeyUsedInfoTEXT    = this.NO_INFO_TEXT;
        this.cacheDBMemoryUsedInfoTEXT = this.NO_INFO_TEXT;
        this.workerQueueLengthInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // Worker工作单元信息
    async _getNodesStats() {
      this.nodesStatsInfoTEXT = '';

      let apiRes = await this.T.callAPI('/api/v1/monitor/nodes/do/get-stats', {
        alert: {entity: 'Worker工作单元信息'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
        let infoLines = [];
        apiRes.data.forEach(d => {
          let nodeShortName = d.node.split('@')[1];
          infoLines.push(`\nNODE = ${nodeShortName}`);

          infoLines.push(`  Pool   = ${d.pool.processes.length} / ${d.pool['max-concurrency']}`);
          infoLines.push(`  Proc   = ${d.pool.processes.join(', ')}`);
          infoLines.push(`  Dist#  = ${d.pool.writes.raw} Tasks`);
          infoLines.push(`  Dist%  = ${d.pool.writes.all}`);
          infoLines.push(`  maxrss = ${(d.rusage.maxrss / 1024).toFixed(2)} MiB`); // 最大常驻
          infoLines.push(`  ixrss  = ${(d.rusage.ixrss  / 1024).toFixed(2)} MiB`);  // 代码段
          infoLines.push(`  idrss  = ${(d.rusage.idrss  / 1024).toFixed(2)} MiB`);  // 数据段
          infoLines.push(`  isrss  = ${(d.rusage.isrss  / 1024).toFixed(2)} MiB`);  // 栈

          this.cacheDBNumberInfoTEXT = `DB = ${d.broker.virtual_host}`;
        });

        this.nodesStatsInfoTEXT = infoLines.join('\n').trim();

      } else {
        this.nodesStatsInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    // Worker工作单元监听队列
    async _getNodesActiveQueues() {
      this.nodesActiveQueuesInfoTEXT = '';

      let apiRes = await this.T.callAPI('/api/v1/monitor/nodes/do/get-active-queues', {
        alert: {entity: 'Worker工作单元监听队列'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
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

      this._getWebVersion();
      this._getWorkerVersion();
    },
    async getSystemReport() {
      this.showSystemReport = true;

      this._getDBSchemaVersion();
      this._getSysStats();
      this._getNodesStats();
      this._getNodesActiveQueues();
    },
    async clearWorkerQueue(queueName) {
      try {
        await this.$confirm(`清空队列后，所有未执行的任务都将丢失
            <hr class="br">是否确认清空队列 "#${queueName}" ？`, '清空队列', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认清空',
          cancelButtonText: '放弃',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/monitor/worker-queues/do/clear', {
        body : {workerQueues: [queueName]},
        alert: {entity: '工作队列', action: '清空', showError: true},
      });
      if (apiRes.ok) {
        this.$alert(`工作队列 "#${queueName}" 已被清空
            <br><small>请注意系统报告内数据可能存在延迟<small>`, '清空工作队列', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '非常好',
          type: 'success',
        });
      }
    },
    async clearLogCacheTables() {
      try {
        await this.$confirm(`清空日志/缓存表后，以往的日志等信息将无法查询
            <hr class="br">是否确认清空日志/缓存表？`, '清空日志/缓存表', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认清空',
          cancelButtonText: '放弃',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/log-cache-tables/do/clear', {
        alert: {entity: '日志/缓存表', action: '清空', showError: true},
      });
      if (apiRes.ok) {
        this.$alert(`日志/缓存表已被清空
            <br><small>请注意系统报告内数据可能存在延迟<small>`, '清空日志/缓存表', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '非常好',
          type: 'success',
        });
      }
    },
  },
  computed: {
    NO_INFO_TEXT() {
      return '暂无数据';
    },
    systemReportTEXT() {
      return [
          '[数据库结构版本]',    this.dbVersionInfoTEXT,
        '\n[Web服务CPU使用率]',  this.serverCPUPercentInfoTEXT,
        '\n[Web服务内存使用量]', this.serverMemoryRSSInfoTEXT,
        '\n[数据库磁盘使用量]',  this.dbDiskUsedInfoTEXT,
        '\n[缓存数据库序号]',    this.cacheDBNumberInfoTEXT,
        '\n[缓存键数量]',        this.cacheDBKeyUsedInfoTEXT,
        '\n[缓存内存使用量]',    this.cacheDBMemoryUsedInfoTEXT,
        '\n[Worker节点状态]',    this.nodesStatsInfoTEXT,
        '\n[Worker队列分布]',    this.nodesActiveQueuesInfoTEXT,
        '\n[Worker队列长度]',    this.workerQueueLengthInfoTEXT,
      ].join('\n');
    },
  },
  props: {
  },
  data() {
    return {
      aboutWeb   : {},
      aboutWorker: {},

      showSystemReport: false,

      dbVersionInfoTEXT        : '',
      dbDiskUsedInfoTEXT       : '',
      cacheDBNumberInfoTEXT    : '',
      cacheDBKeyUsedInfoTEXT   : '',
      cacheDBMemoryUsedInfoTEXT: '',
      serverCPUPercentInfoTEXT : '',
      serverMemoryRSSInfoTEXT  : '',
      nodesStatsInfoTEXT       : '',
      nodesActiveQueuesInfoTEXT: '',
      workerQueueLengthInfoTEXT: '',

      workerQueues: [],
    }
  },
}
</script>

<style scoped>
.about-form {
  width: 600px;
}
.about-dataflux-func-part {
  font-size: 16px;
  font-style: italic;
  font-family: monospace;
  margin-left: 10px;
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
