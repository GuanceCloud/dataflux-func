<i18n locale="en" lang="yaml">
overviewCountUnit   : ''
workerCount         : 'NO worker | {n} worker | {n} workers'
taskCount           : 'NO task | {n} task | {n} tasks'
scriptOverviewCount : '(NO script) | ({n} script) | ({n} scripts)'
recentOperationCount: '(latest {n} operation) | (latest {n} operations)'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Overview                      : 总览
Biz Entity                    : 业务实体
Worker Queue Info             : 队列信息
Queue                         : 队列
overviewCountUnit             : 个
workerCount                   : '工作单元 {n} 个'
taskCount                     : '请求排队 {n} 个'
Script overview               : 脚本总览
scriptOverviewCount           : '{n} 个'
Code size                     : 代码大小
Publish ver.                  : 发布版本
Publish time                  : 发布时间
Never published               : 从未发布
System builtin                : 系统内置
Recent operations             : 最近操作记录
recentOperationCount          : 最近{n}条
Time                          : 时间
Client                        : 客户端
Client ID                     : 客户端ID
IP Address                    : IP地址
User                          : 用户
User ID                       : 用户ID
Operation                     : 操作
Data ID                       : 数据ID
MODIFY                        : 修改操作
DELETE                        : 删除操作
Cost                          : 耗时
ms                            : 毫秒
Show detail                   : 显示HTTP请求详情
The full content is as follows: 完整内容如下
Request                       : 请求
Response                      : 响应
Pressure                      : 压力
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Overview') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
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

        <el-divider content-position="left"><h1>{{ $t('Worker Queue Info') }}</h1></el-divider>
        <el-card
          class="worker-queue-card"
          :class="{ 'worker-queue-highlight': workerQueue.taskCount > 0 }"
          shadow="hover"
          v-for="workerQueue, i in workerQueueInfo"
          :key="i">
          <el-progress type="dashboard" width="100"
            :percentage="workerQueuePressurePercentage(workerQueue.pressure, workerQueue.maxPressure)"
            :format="workerQueuePressureFormat"
            :color="WORKER_QUEUE_PRESSURE_COLORS"></el-progress>

          <span class="worker-queue-info">
            <span class="worker-queue-number">#{{ i }}</span> {{ $t('Queue') }}
            <br>{{ $tc('workerCount', workerQueue.workerCount || 0) }}
            <br>{{ $tc('taskCount', T.numberLimit(workerQueue.taskCount)) }}
          </span>
        </el-card>

        <el-divider class="overview-divider" content-position="left"><h1>{{ $t('Script overview') }} {{ $tc('scriptOverviewCount', scriptOverview.length) }}</h1></el-divider>

        <el-table :data="scriptOverview" stripe>
          <el-table-column :label="$t('Script Set')" sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.scriptSetTitle || scope.row.scriptSetId }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Script')" sortable :sort-by="['title', 'id']">
            <template slot-scope="scope">
              <span>{{ scope.row.title || scope.row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Func')" sortable sort-by="funcCount" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="!scope.row.funcCount">-</code>
              <code v-else>{{ scope.row.funcCount }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Code size')" sortable sort-by="codeSize" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="scope.row.codeSize">{{ scope.row.codeSizeHuman }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Publish ver.')" sortable sort-by="publishVersion" align="right" width="150">
            <template slot-scope="scope">
              <code v-if="!scope.row.publishVersion">-</code>
              <code v-else>v{{ `${scope.row.publishVersion}` }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Publish time')" sortable sort-by="latestPublishTimestamp" align="right" width="200">
            <template slot-scope="scope">
              <template v-if="!scope.row.latestPublishTime">
                <span v-if="scope.row.publishVersion === 0" class="text-info">{{ $t('Never published') }}</span>
                <span v-else class="text-info">{{ $t('System builtin') }}</span>
              </template>
              <template v-else>
                <span>{{ scope.row.latestPublishTime | datetime }}</span>
                <br>
                <span class="text-info">{{ scope.row.latestPublishTime | fromNow }}</span>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <el-divider class="overview-divider" content-position="left"><h1>{{ $t('Recent operations') }} {{ $tc('recentOperationCount', latestOperations.length) }}</h1></el-divider>

        <el-table :data="latestOperations" stripe>
          <el-table-column :label="$t('Time')" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.createTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('User')">
            <template slot-scope="scope">
              <strong>{{ scope.row.username }}</strong>

              <br>
              <span class="text-info">{{ $t('User ID') }}{{ $t(':') }}</span>
              <code class="text-code text-small">{{ scope.row.userId }}</code><CopyButton :content="scope.row.userId"></CopyButton>

              <br>
              <span class="text-info">{{ $t('Client ID') }}{{ $t(':') }}</span>
              <code class="text-code text-small">{{ scope.row.clientId }}</code><CopyButton :content="scope.row.clientId"></CopyButton>

              <template v-if="!T.isNothing(scope.row.clientIPsJSON)">
                <br>
                <span class="text-info">{{ $t('IP Address') }}{{ $t(':') }}</span>
                <code class="text-code text-small">{{ scope.row.clientIPsJSON.join(', ') }}</code><CopyButton :content="scope.row.clientIPsJSON.join(', ')"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Operation')">
            <template slot-scope="scope">
              <span class="text-good" v-if="scope.row.respStatusCode >= 200 && scope.row.respStatusCode < 400">
                <i class="fa fa-fw fa-check-circle"></i>
              </span>
              <span class="text-bad" v-else>
                <i class="fa fa-fw fa-times-circle"></i>
              </span>

              <span>{{ scope.row._operationDescribe }}</span>

              <template v-if="scope.row._operationEntityId">
                <br>
                <span class="text-info">{{ $t('Data ID') }}{{ $t(':') }}</span>
                <code class="text-code text-small">{{ scope.row._operationEntityId }}</code><CopyButton :content="scope.row._operationEntityId"></CopyButton>
              </template>

              <br>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/modify')" class="text-watch">
                <i class="fa fa-fw fa-exclamation-triangle"></i>
                {{ $t('MODIFY') }}
              </strong>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/delete')" class="text-bad">
                <i class="fa fa-fw fa-exclamation-circle"></i>
                {{ $t('DELETE') }}
              </strong>
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

      <LongTextDialog :title="$t('The full content is as follows')" :showDownload="true" ref="longTextDialog"></LongTextDialog>
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
      if (!this.T.isNothing(sections)) {
        _query = { sections: sections.join(',') };
      }
      let apiRes = await this.T.callAPI_get('/api/v1/func/overview', {
        query: _query,
        alert: { muteError: options.mute },
      });
      if (!apiRes.ok) return;

      if (apiRes.data.scriptOverview) {
        apiRes.data.scriptOverview.forEach(d => {
          d.latestPublishTimestamp = 0;
          if (d.latestPublishTime) {
            d.latestPublishTimestamp = new Date(d.latestPublishTime).getTime();
          }
        });
      }

      (sections || this.OVERVIEW_SECTIONS).forEach(s => {
        this[s] = apiRes.data[s];
      });

      this.scriptOverview.forEach(d => {
        if (d.codeSize) {
          d.codeSizeHuman = this.T.byteSizeHuman(d.codeSize);
        }
      })

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
      // 最大80px，每多一位减少15px
      let numberLength = ('' + count).length;
      return Math.min(80 - 15 * (numberLength - 4), 80);
    },
    workerQueuePressurePercentage(pressure, maxPressure) {
      var percentage = 100 * pressure / (maxPressure * 2);
      if (percentage < 0) {
        percentage = 0;
      } else if (percentage > 100) {
        percentage = 100;
      }

      return percentage;
    },
    workerQueuePressureFormat(percentage) {
      return `${this.$t('Pressure')}${this.$t(':')} ${parseInt(percentage * 2)}`;
    },
  },
  computed: {
    OVERVIEW_SECTIONS() {
      return [
        'bizEntityCount',
        'workerQueueInfo',
        'scriptOverview',
        'latestOperations',
      ];
    },
    WORKER_QUEUE_PRESSURE_COLORS() {
      return [
        {color: '#00aa00', percentage: 50},
        {color: '#ff6600', percentage: 80},
        {color: '#ff0000', percentage: 100}
      ];
    },
  },
  props: {
  },
  data() {
    return {
      bizEntityCount  : [],
      workerQueueInfo : [],
      scriptOverview  : [],
      latestOperations: [],
      overviewInterval: null,
    }
  },
  mounted() {
    if (!this.overviewInterval) {
      this.overviewInterval = setInterval(() => {
        if (this.$route.name !== 'overview') {
          clearInterval(this.overviewInterval);
          this.overviewInterval = null;
        }

        this.loadData(['workerQueueInfo'], { mute: true });
      }, 30 * 1000);
    }
  },
}
</script>

<style scoped>
.overview-divider {
  margin-top: 100px;
}
.overview-card {
  width: 300px;
  height: 200px;
  display: inline-block;
  margin: 10px 20px;
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
  font-size: 36px;
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
.worker-queue-card {
  width: 260px;
  height: 130px;
  display: inline-block;
  margin: 10px 20px;
  position: relative;
}
.worker-queue-highlight {
  color: #FF6600;
  border-color: #FF6600;
}
.worker-queue-card .progressbar {
  display: inline-block;
}
.worker-queue-info {
  font-size: 12px;
  position: absolute;
  top: 25px;
  right: 20px;
  text-align: right;
}
.worker-queue-info .worker-queue-number {
  font-size: 30px;
}
</style>

<style>

</style>
