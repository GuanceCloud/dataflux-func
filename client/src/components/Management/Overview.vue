<i18n locale="en" lang="yaml">
overviewCountUnit   : ''
workerCount         : 'NO Worker | {n} Worker | {n} Workers'
processCount        : 'NO Process | {n} Process | {n} Processes'
taskCount           : 'NO Task | {n} Task | {n} Tasks'
recentOperationCount: '(Latest {n} Operation) | (Latest {n} Operations)'
</i18n>

<i18n locale="zh-CN" lang="yaml">
overviewCountUnit   : 个
workerCount         : '工作单元 {n} 个'
processCount        : '工作进程 {n} 个'
taskCount           : '任务 {n} 个'
recentOperationCount: 最近 {n} 条

Overview         : 总览
Biz Entity       : 业务实体
Worker Queue Info: 队列信息
Recent operations: 最近操作记录
Client           : 客户端
Client ID        : 客户端 ID
IP Address       : IP地址
Operation        : 操作
Data ID          : 数据 ID
MODIFY           : 修改操作
DELETE           : 删除操作
Cost             : 耗时
Show detail      : 显示请求详情
Request          : 请求
Response         : 响应
Load             : 负载
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Overview') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-divider content-position="left"><h1>{{ $t('Worker Queue Info') }}</h1></el-divider>
        <el-card
          class="worker-queue-card"
          :class="{ 'worker-queue-highlight': workerQueue.taskCount > 0 }"
          shadow="hover"
          v-for="workerQueue, i in workerQueueInfo"
          :key="i">
          <div class="worker-queue-info">
            <span class="worker-queue-number">#{{ i }}</span>
            <br><span :class="{ 'text-bad' : (workerQueue.workerCount ) <= 0 }">{{ $tc('workerCount',  workerQueue.workerCount ) }}</span>
            <br><span :class="{ 'text-bad' : (workerQueue.processCount) <= 0 }">{{ $tc('processCount', workerQueue.processCount) }}</span>
            <br><span :class="{ 'text-main': (workerQueue.taskCount)    >  0 }">{{ $tc('taskCount',    workerQueue.taskCount)    }}</span>
          </div>

          <el-progress type="circle" width="110"
            :percentage="workerQueueLoadPercentage(workerQueue.taskCount, workerQueue.processCount)"
            :format="workerQueueLoadFormat"
            :color="WORKER_QUEUE_TASK_COUNT_COLORS"></el-progress>
        </el-card>

        <el-divider content-position="left"><h1>{{ $t('Biz Entity') }}</h1></el-divider>
        <el-card class="overview-card" shadow="hover" v-for="d in bizEntityCount" :key="d.name">
          <i v-if="C.OVERVIEW_ENTITY_MAP.get(d.name).icon" class="fa fa-fw overview-icon" :class="C.OVERVIEW_ENTITY_MAP.get(d.name).icon"></i>
          <i v-else-if="C.OVERVIEW_ENTITY_MAP.get(d.name).tagText" type="info" class="overview-icon overview-icon-text"><code>{{ C.OVERVIEW_ENTITY_MAP.get(d.name).tagText }}</code></i>

          <span class="overview-name">{{ C.OVERVIEW_ENTITY_MAP.get(d.name).name }}</span>
          <span class="overview-count" :style="{'font-size': overviewCountFontSize(d.count) + 'px'}">
            {{ d.count }}
            <span class="overview-count-unit">{{ $t('overviewCountUnit') }}</span>
          </span>
        </el-card>

        <el-divider class="overview-divider" content-position="left"><h1>{{ $t('Recent operations') }} {{ $tc('recentOperationCount', latestOperations.length) }}</h1></el-divider>
        <el-table :data="latestOperations">
          <el-table-column :label="$t('Time')" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.createTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('User')" width="350">
            <template slot-scope="scope">
              <strong>{{ scope.row.u_name || $t('Anonymity') }}</strong>

              <template v-if="scope.row.userId">
                <br>
                <span class="text-info">{{ $t('User ID') }}</span>
                &nbsp;<code class="text-main">{{ scope.row.userId }}</code>
                <CopyButton :content="scope.row.userId" />
              </template>

              <template v-if="T.notNothing(scope.row.clientIPsJSON)">
                <br>
                <span class="text-info">{{ $t('IP Address') }}</span>
                &nbsp;<code class="text-main">{{ scope.row.clientIPsJSON.join(', ') }}</code>
                <CopyButton :content="scope.row.clientIPsJSON.join(', ')" />
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Operation')">
            <template slot-scope="scope">
              <span class="text-good" v-if="scope.row.respStatusCode >= 200 && scope.row.respStatusCode < 400">
                <i class="fa fa-fw fa-check"></i>
              </span>
              <span class="text-bad" v-else>
                <i class="fa fa-fw fa-times"></i>
              </span>
              <span>{{ $t(scope.row.reqRouteName) }}</span>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/modify')" class="text-watch">
                （{{ $t('MODIFY') }}）
              </strong>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/delete')" class="text-bad">
                （{{ $t('DELETE') }}）
              </strong>

              <template v-if="scope.row._operationEntityId">
                <br>
                <i class="fa fa-fw"></i>
                <span class="text-info">{{ $t('Data ID') }}</span>
                &nbsp;<code class="text-main">{{ scope.row._operationEntityId }}</code>
                <CopyButton :content="scope.row._operationEntityId" />
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Cost')" align="right" width="100">
            <template slot-scope="scope">
              {{ scope.row.reqCost }} <span class="text-info">{{ $t('ms') }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="150">
            <template slot-scope="scope">
              <el-button @click="showDetail(scope.row)" type="text">{{ $t('Show detail') }}</el-button>
            </template>
          </el-table-column>

        </el-table>
      </el-main>

      <LongTextDialog :showDownload="true" ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'Overview',
  components: {
    LongTextDialog,
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
    async loadData(sections, options) {
      options = options || {};

      let _query = null;
      if (this.T.notNothing(sections)) {
        _query = { sections: sections.join(',') };
      }
      let apiRes = await this.T.callAPI_get('/api/v1/func/overview', {
        query: _query,
        alert: { muteError: options.mute },
      });
      if (!apiRes || !apiRes.ok) return;

      (sections || this.OVERVIEW_SECTIONS).forEach(s => {
        this[s] = apiRes.data[s];
      });

      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let httpInfoLines = [];

      httpInfoLines.push(`===== ${this.$t('Request')} =====`)

      httpInfoLines.push(`${d.reqMethod.toUpperCase()} ${this.T.formatURL(d.reqRoute, {params: d.reqParamsJSON, query: d.reqQueryJSON})}`)

      if (d.reqBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.reqBodyJSON, null, 2));
      }
      if (d.reqFileInfoJSON) {
        httpInfoLines.push(`\n===== ${this.$t('Upload')} =====`)
        d.reqFileInfoJSON.forEach(fileInfo => {
          httpInfoLines.push(`${fileInfo.name} <${this.T.byteSizeHuman(fileInfo.size)}>`);
        })
      }

      httpInfoLines.push(`\n===== ${this.$t('Response')} =====`)

      httpInfoLines.push(`Status Code: ${d.respStatusCode}`);

      if (d.respBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.respBodyJSON, null, 2));
      }

      let httpInfoTEXT = httpInfoLines.join('\n');

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `http-dump.${createTimeStr}`;
      this.$refs.longTextDialog.update(httpInfoTEXT, fileName);
    },
    overviewCountFontSize(count) {
      let numberLength = ('' + count).length;
      let fontSize = parseInt(280 / numberLength * 1.2);
      return Math.min(80, fontSize);
    },
    workerQueueLoadPercentage(taskCount, processCount) {
      let taskQuota = processCount * 100;

      if (taskQuota <= 0 && taskCount > 0) return 100;
      if (taskCount === 0) return 0;

      let percentage = 100 * taskCount / taskQuota;
      if (percentage < 0) {
        percentage = 0;
      } else if (percentage > 100) {
        percentage = 100;
      }

      return percentage;
    },
    workerQueueLoadFormat(percentage) {
      return `${this.$t('Load')}${this.$t(':')}${parseInt(percentage)}`;
    },
  },
  computed: {
    OVERVIEW_SECTIONS() {
      return [
        'workerQueueInfo',
        'bizEntityCount',
        'latestOperations',
      ];
    },
    WORKER_QUEUE_TASK_COUNT_COLORS() {
      return [
        { color: '#00aa00', percentage: 50 },
        { color: '#ff6600', percentage: 80 },
        { color: '#ff0000', percentage: 100 }
      ];
    },
  },
  props: {
  },
  data() {
    return {
      workerQueueInfo : [],
      bizEntityCount  : [],
      latestOperations: [],

      autoRefreshTimer: null,
    }
  },
  mounted() {
    this.autoRefreshTimer = setInterval(() => {
      this.loadData(['workerQueueInfo'], { mute: true });
    }, 5 * 1000);
  },
  beforeDestroy() {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
  },
}
</script>

<style scoped>
.overview-divider {
  margin-top: 100px;
}

.worker-queue-card {
  width: 260px;
  height: 150px;
  display: inline-block;
  margin: 10px 10px;
  position: relative;
}
.worker-queue-highlight {
  color: #FF6600;
  border-color: #FF6600;
}
.worker-queue-info {
  font-size: 12px;
  text-align: left;
}
.worker-queue-info .worker-queue-number {
  font-size: 40px;
  letter-spacing: 5px;
}

.overview-card {
  width: 320px;
  height: 200px;
  display: inline-block;
  margin: 10px 10px;
  position: relative;
}
.overview-icon {
  position: absolute;
  font-size: 200px;
  left: 130px;
  top: 40px;
  color: #f5f5f5;
  line-height: 200px;
  z-index: 0;
}
.overview-icon-text {
  font-size: 120px;
}
.overview-name {
  font-size: 32px;
  display: block;
  z-index: 1;
  position: relative;
}
.overview-count {
  font-weight: 100;
  line-height: 120px;
  font-family: sans-serif;
  display: block;
  padding-left: 20px;
  z-index: 1;
  position: relative;
}
.overview-count-unit {
  font-size: 40px;
  font-weight: 200;
}
.text-data {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: grey;
}
</style>

<style>
.worker-queue-card .el-card__body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
