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

                  <el-dropdown trigger="click" @command="clearWorkerQueue" v-if="workerQueues.length > 0">
                    <el-button>清空工作队列</el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item v-for="q in workerQueues" :key="q.name" :command="q.name">队列 #{{ q.name }} ({{ q.value }}个待处理任务)</el-dropdown-item>
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
    async _getWebVersion() {
      // 获取HTTP 服务器镜像信息
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
    async _getWorkerVersion() {
      // 获取Worker工作单元镜像信息
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
    async _getDBVersion() {
      this.dbVersionInfoTEXT = '';

      // 获取数据库版本
      let apiRes = await this.T.callAPI('/api/v1/upgrade-info', {
        query: {seq: 'latest'},
        alert: {entity: 'Worker镜像信息'},
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
    async _getSysStats() {
      this.serverCPUPercentInfoTEXT  = '';
      this.serverMemoryRSSInfoTEXT   = '';
      this.cacheDBKeyUsedInfoTEXT    = '';
      this.cacheDBMemoryUsedInfoTEXT = '';
      this.workerQueueLengthInfoTEXT = '';

      // 获取系统信息
      let apiRes = await this.T.callAPI('/api/v1/monitor/sys-stats/do/get', {
        alert: {entity: '系统信息'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
        let _getInfo = (seriesList, options) => {
          options = options || {};
          options.scale   = options.scale   || 1;
          options.unit    = options.unit    || '';
          options.toFixed = options.toFixed || 0;
          options.json    = options.json    || false;

          let infoLines = [];

          let maxNameLength = 0;
          seriesList.forEach(s => {
            if (s.name.length > maxNameLength) maxNameLength = s.name.length;
          });

          seriesList.forEach(s => {
            let dps = s.data;

            // 忽略无数据条目
            if (this.T.isNothing(dps)) return;

            dps.sort((a, b) => b[0] - a[0]);

            // 忽略超过15分钟无数据的条目
            let latestTimestamp = dps[0][0];
            if (Date.now() - latestTimestamp > 15 * 60 * 1000) return;

            let latestValue = dps[0][1];
            if (options.scale) {
              latestValue = (latestValue / options.scale).toFixed(options.toFixed);
            }

            if (options.json) {
              infoLines.push({ name: s.name, value: latestValue, unit: options.unit });

            } else {
              let padding = ' '.repeat(maxNameLength - s.name.length);
              infoLines.push(`${s.name}${padding} = ${latestValue}${options.unit}`);
            }
          });

          if (options.json) {
            return infoLines;
          } else {
            return infoLines.join('\n');
          }
        }

        let sysStats = apiRes.data.sysStats;
        this.serverCPUPercentInfoTEXT = _getInfo(sysStats.serverCPUPercent, {
          scale  : 0.01,
          unit   : '%',
          toFixed: 2,
        });
        this.serverMemoryRSSInfoTEXT = _getInfo(sysStats.serverMemoryRSS, {
          scale  : 1024 * 1024,
          unit   : ' MiB',
          toFixed: 2,
        });
        this.cacheDBKeyUsedInfoTEXT = _getInfo(sysStats.cacheDBKeyUsed, {
          unit: ' Keys',
        });
        this.cacheDBMemoryUsedInfoTEXT = _getInfo(sysStats.cacheDBMemoryUsed, {
          scale  : 1024 * 1024,
          unit   : ' MiB',
          toFixed: 2,
        });
        this.workerQueueLengthInfoTEXT = _getInfo(sysStats.workerQueueLength, {
          unit: ' Tasks',
        });

        this.workerQueues = _getInfo(sysStats.workerQueueLength, {
          unit: ' Tasks',
          json: true,
        });

      } else {
        this.serverCPUPercentInfoTEXT  = this.NO_INFO_TEXT;
        this.serverMemoryRSSInfoTEXT   = this.NO_INFO_TEXT;
        this.cacheDBKeyUsedInfoTEXT    = this.NO_INFO_TEXT;
        this.cacheDBMemoryUsedInfoTEXT = this.NO_INFO_TEXT;
        this.workerQueueLengthInfoTEXT = this.NO_INFO_TEXT;
      }
    },
    async _getNodesStats() {
      this.nodesStatsInfoTEXT = '';

      // 获取Worker工作单元状态
      let apiRes = await this.T.callAPI('/api/v1/monitor/nodes/do/get-stats', {
        alert: {entity: 'Worker工作单元状态'},
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
    async _getNodesActiveQueues() {
      this.nodesActiveQueuesInfoTEXT = '';

      // 获取Worker工作单元监视队列
      let apiRes = await this.T.callAPI('/api/v1/monitor/nodes/do/get-active-queues', {
        alert: {entity: 'Worker工作单元监视队列'},
      });
      if (apiRes.ok && !this.T.isNothing(apiRes.data)) {
        let infoLines = [];
        apiRes.data.forEach(d => {
          let nodeShortName = d.node.split('@')[1];
          infoLines.push(`\nNODE = ${nodeShortName}`);

          d.activeQueues.forEach(q => {
            infoLines.push(`  - ${q.shortName}`);
          });
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

      this._getDBVersion();
      this._getSysStats();
      this._getNodesStats();
      this._getNodesActiveQueues();
    },
    async clearWorkerQueue(queueName) {
      let apiRes = await this.T.callAPI('post', '/api/v1/monitor/worker-queues/do/clear', {
        body : {workerQueues: [queueName]},
        alert: {entity: '工作队列', action: '清空', showError: true},
      });
      if (apiRes.ok) {
        this.$alert(`工作队列 "${queueName}" 已被清空
            <br><small>请注意系统报告内数据可能存在延迟<small>`, '清空工作队列', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '非常好',
          type: 'success',
        });
      }
    },
  },
  computed: {
    NO_INFO_TEXT() {
      return '无法获取';
    },
    systemReportTEXT() {
      return [
          '[数据库版本]',        this.dbVersionInfoTEXT,
        '\n[缓存数据库]',        this.cacheDBNumberInfoTEXT,
        '\n[缓存键数量]',        this.cacheDBKeyUsedInfoTEXT,
        '\n[缓存使用量]',        this.cacheDBMemoryUsedInfoTEXT,
        '\n[Web服务CPU使用率]',  this.serverCPUPercentInfoTEXT,
        '\n[Web服务内存使用量]', this.serverMemoryRSSInfoTEXT,
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
