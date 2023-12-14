<i18n locale="zh-CN" lang="yaml">
direct     : Directly Call
integration: Integration Call
authLink   : Auth Link
crontab    : Crontab
batch      : Batch
connector  : Connector
</i18n>
<i18n locale="zh-CN" lang="yaml">
Exec Mode      : 执行模式
Trigger Time   : 触发时间
Start Time     : 启动时间
End Time       : 结束时间
Task           : 任务
Func Title     : 函数标题
Func ID        : 函数 ID
Blueprint Title: 蓝图标题
Blueprint ID   : 蓝图 ID
Main Task      : 主任务
Sub Task       : 子任务
Delay          : 延迟执行
Queue          : 所属队列
Wait Cost      : 排队耗时
Run Cost       : 执行耗时
Log Lines      : 日志行数
Task Type      : 任务类型
Task Status    : 任务状态

Print Log   : Print 日志
Traceback   : 调用堆栈
No Print Log: 无 Print 日志
No Traceback: 无调用堆栈信息

Recent Task Record        : 近期任务记录
Related Task Record       : 相关任务记录
Only main tasks are listed: 在本页面只展示主任务

success: 成功
failure: 失败
timeout: 执行超时
skip   : 跳过执行

Main Task Only: 仅主任务
Show Detail   : 显示详情
Related Tasks : 相关任务

Task Record cleared: 任务记录已清空

Are you sure you want to clear the Task Record?: 是否确认清空任务记录？

Uploading Guance data failed: 观测云数据上报失败
No Recent Task Record: 尚无任何近期任务记录
All recent Task Record will be collected and shown here: 所有近期任务会被记录，并展示在此

Origin   : 来源
Origin ID: 来源 ID

direct     : 直接调用
integration: 集成调用
authLink   : 授权链接
crontab    : 自动触发
batch      : 批处理
connector  : 连接器
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <div>
            <h1>{{ isRoot ? $t('Recent Task Record') : $t('Related Task Record') }}</h1>
            <small class="text-info">
              &#12288;
              <span class="task-record-query" v-if="dataFilter.origin">
                {{ $t('Origin')}}
                <code class="text-main">{{ $t(dataFilter.origin) }}</code>
              </span>
              <span class="task-record-query" v-if="dataFilter.originId">
                {{ $t('Origin ID')}}
                <code class="text-main">{{ dataFilter.originId }}</code>
                <CopyButton :content="dataFilter.originId" />
              </span>
              <span class="task-record-query" v-if="dataFilter.funcId">
                {{ $t('Func ID')}}
                <code class="text-main">{{ dataFilter.funcId }}</code>
                <CopyButton :content="dataFilter.funcId" />
              </span>
            </small>
          </div>

          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip :content="$t('Only main tasks are listed')" placement="bottom" :enterable="false" v-if="hasTaskType">
              <el-checkbox v-if="isRoot"
                :border="true"
                size="small"
                v-model="dataFilter.rootTaskId"
                true-label="ROOT"
                false-label=""
                @change="T.changePageFilter(dataFilter)">{{ $t('Main Task Only') }}</el-checkbox>
            </el-tooltip>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Recent Task Record') }}</h1>

          <p class="no-data-tip">
            {{ $t('All recent Task Record will be collected and shown here') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Status')" width="150">
            <template slot-scope="scope">
              <el-tag
                v-if="C.TASK_STATUS_MAP.get(scope.row.status)"
                :type="C.TASK_STATUS_MAP.get(scope.row.status).tagType"><i :class="C.TASK_STATUS_MAP.get(scope.row.status).icon"></i>
                {{ C.TASK_STATUS_MAP.get(scope.row.status).name }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Trigger Time')" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.triggerTimeMs | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.triggerTimeMs | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column width="100" align="center" v-if="hasTaskType">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.subTaskCount > 0" size="medium" type="primary">{{ $t('Main Task') }}</el-tag>
              <el-tag v-else-if="scope.row.rootTaskId !== 'ROOT'" size="small" type="info">{{ $t('Sub Task') }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Func')" min-width="300">
            <template slot-scope="scope">
              <FuncInfo
                :config-func-id="scope.row.funcId"
                :id="scope.row.func_id"
                :title="scope.row.func_title" />
              <InfoBlock v-if="scope.row.exceptionType" type="error" :title="`${scope.row.exceptionType}: ${scope.row.exceptionTEXTReduced}`" />
              <InfoBlock v-if="scope.row.printLogsTEXT && scope.row.printLogsTEXT.indexOf('[Guance Data Upload Error]') >= 0" type="warning" :title="$t('Uploading Guance data failed')" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('Wait Cost')" align="right" width="100">
            <template slot-scope="scope">
              <template v-if="scope.row.waitCostMs && scope.row.waitCostMs > 2000">
                <strong :class="scope.row.waitCostClass">{{ scope.row.waitCostMs < 10000 ? scope.row.waitCostMs : (scope.row.waitCostMs / 1000).toFixed(1) }}</strong>
                <span class="text-info">{{ scope.row.waitCostMs < 10000 ? $t('ms') : $t('s') }}</span>
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('Run Cost')" align="right" width="100">
            <template slot-scope="scope">
              <template v-if="scope.row.runCostMs">
                <strong :class="scope.row.runCostClass">{{ scope.row.runCostMs < 10000 ? scope.row.runCostMs : (scope.row.runCostMs / 1000).toFixed(1) }}</strong>
                <span class="text-info">{{ scope.row.runCostMs < 10000 ? $t('ms') : $t('s') }}</span>
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('Log Lines')" align="right" width="100">
            <template slot-scope="scope">
              <strong v-if="scope.row.logLines < 10" class="text-info">{{ scope.row.logLines }}</strong>
              <strong v-else-if="scope.row.logLines < 100" class="text-good">{{ scope.row.logLines }}</strong>
              <strong v-else-if="scope.row.logLines < 1000" class="text-watch">{{ scope.row.logLines }}</strong>
              <strong v-else="scope.row.logLines" class="text-bad">{{ scope.row.logLines }}</strong>
            </template>
          </el-table-column>

          <el-table-column width="240" align="right">
            <template slot-scope="scope">
              <template v-if="isRoot">
                <el-button v-if="scope.row.subTaskCount > 0 || scope.row.rootTaskId !== 'ROOT'"
                  type="text"
                  @click="openSubTaskRecord(scope.row)"
                  >{{ $t('Related Tasks') }}</el-button>
              </template>

              <el-button @click="showDetail(scope.row)" type="text">{{ $t('Show Detail') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />

      <LongTextDialog ref="longTextDialog" :showDownload="true" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'TaskRecordFuncList',
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
    '$store.state.isLoaded': function(val) {
      if (!val) return;

      setImmediate(() => this.T.autoScrollTable());
    },
  },
  methods: {
    async loadData() {
      let _listQuery = this.dataFilter = this.T.createListQuery();
      let apiRes = await this.T.callAPI_get('/api/v1/task-records/func/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      // 按照触发时间倒序排列（此处仅为前端观赏性排序，DB 侧不适宜基于触发时间排序）
      apiRes.data.sort(function(a, b) {
        if (a.triggerTimeMs < b.triggerTimeMs) return 1;
        else if (a.triggerTimeMs > b.triggerTimeMs) return -1;
        else return 0;
      });

      apiRes.data.forEach(d => {
        // 判断是否存在主、子任务
        if (d.subTaskCount > 0 || d.rootTaskId !== 'ROOT') {
          this.hasTaskType = true;
        }

        // 日志长度
        d.logLines = 0
        if (d.printLogsTEXT) {
          d.logLines = d.printLogsTEXT.split('\n').length;
        }

        // 排队等待时间
        if (d.triggerTimeMs && d.startTimeMs) {
          d.waitCostMs = d.startTimeMs - d.triggerTimeMs;

          if (d.waitCostMs > 3 * 60 * 1000) {
            d.waitCostClass = 'text-bad';
          } else if (d.waitCostMs > 10 * 1000) {
            d.waitCostClass = 'text-watch';
          } else {
            d.waitCostClass = 'text-good';
          }
        }

        // 执行时间
        if (d.startTimeMs && d.endTimeMs) {
          d.runCostMs = d.endTimeMs - d.startTimeMs;

          if (d.runCostMs > 5 * 60 * 1000) {
            d.runCostClass = 'text-bad';
          } else if (d.runCostMs > 10 * 1000) {
            d.runCostClass = 'text-watch';
          } else {
            d.runCostClass = 'text-good';
          }
        }

        // 错误信息
        if (d.exceptionTEXT) {
          d.exceptionTEXTReduced = this.T.limitText(d.exceptionTEXT, 300, { showLength: 'newLine' });
        }
      });

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    openSubTaskRecord(d) {
      let nextRouteQuery = this.T.packRouteQuery();
      nextRouteQuery.filter = this.T.createPageFilter({
        rootTaskId: d.rootTaskId === 'ROOT' ? d.id : d.rootTaskId,
      })

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      this.$router.push({
        name  : 'sub-task-record-func-list',
        params: { id: this.$route.params.id },
        query : nextRouteQuery,
      });
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let origin = 'scriptLib';
      let id     = d.funcId;
      if (this.T.startsWith(d.funcId, '_bp_')) {
        origin = 'blueprint';
        id     = d.funcId.replace(/^_bp_/g, '').split('__')[0];
      }

      let lines = [];
      lines.push(`===== ${this.$t('Task')} =====`);
      if (origin === 'scriptLib') {
        // 脚本
        lines.push(`${this.$t('Func ID')} : ${this.$t(id)}`);
        lines.push(`${this.$t('Func Title')}: ${this.$t(d.func_title)}`);
      } else {
        // 蓝图
        lines.push(`${this.$t('Blueprint ID')} : ${this.$t(id)}`);
        lines.push(`${this.$t('Blueprint Title')}: ${this.$t(d.func_title)}`);
      }

      // 队列
      lines.push(`${this.$t('Queue')}: #${d.queue}`);

      // 时间
      lines.push('');
      lines.push(`${this.$t('Trigger Time')}: ${this.T.getDateTimeString(d.triggerTimeMs)} ${this.$t('(')}${this.T.fromNow(d.triggerTimeMs)}${this.$t(')')}`);
      lines.push(`${this.$t('Start Time')}: ${this.T.getDateTimeString(d.startTimeMs)} ${this.$t('(')}${this.T.fromNow(d.startTimeMs)}${this.$t(')')}`);
      lines.push(`${this.$t('End Time')}: ${this.T.getDateTimeString(d.endTimeMs)} ${this.$t('(')}${this.T.fromNow(d.endTimeMs)}${this.$t(')')}`);

      // 延迟
      if (d.delay > 0) {
        lines.push(`${this.$t('Delay')}: ${d.delay} ${this.$t('s')}`);
      } else {
        lines.push(`${this.$t('Delay')}: -`);
      }

      // 耗时
      if (d.waitCostMs > 1000) {
        lines.push(`${this.$t('Wait Cost')}: ${d.waitCostMs} ${this.$t('ms')}`);
      } else {
        lines.push(`${this.$t('Wait Cost')}: -`);
      }
      lines.push(`${this.$t('Run Cost')}: ${d.runCostMs} ${this.$t('ms')}`);

      // 任务类型
      lines.push(`${this.$t('Task Type')}: ${d.rootTaskId === 'ROOT' ? this.$t('Main Task') : this.$t('Sub Task')}`);

      // 任务状态
      lines.push(`${this.$t('Task Status')}: ${this.$t(d.status)}`);

      // 日志
      lines.push('');
      lines.push(`===== ${this.$t('Print Log')} =====`);
      if (d.printLogsTEXT) {
        lines.push(d.printLogsTEXT);
      } else {
        lines.push(this.$t('No Print Log'));
      }

      // 堆栈
      lines.push('');
      lines.push(`===== ${this.$t('Traceback')} =====`);
      if (d.tracebackTEXT) {
        lines.push(d.tracebackTEXT);
      } else {
        lines.push(this.$t('No Traceback'))
      }

      let docTEXT = lines.join('\n');

      let createTimeStr = this.M(d.createTime).format('YYYYMMDD_HHmmss');
      let fileName = `task-record.${origin}-${id}.log.${createTimeStr}`;
      this.$refs.longTextDialog.update(docTEXT, fileName);
    },
  },
  computed: {
    isRoot() {
      return this.$route.name === 'task-record-func-list';
    },
  },
  props: {
  },
  data() {
    let _pageInfo   = this.T.createPageInfo();
    let _dataFilter = this.T.createListQuery();

    return {
      data    : [],
      pageInfo: _pageInfo,

      dataFilter: {
        _fuzzySearch: _dataFilter._fuzzySearch,
        rootTaskId  : _dataFilter.rootTaskId,
      },

      hasTaskType: false,
    }
  },
}
</script>

<style scoped>
.task-record-query + .task-record-query:before {
  content: "|";
  position: relative;
  left: -6px;
}
.task-record-query + .task-record-query {
  margin-left: 10px;
}
.func-title {
  font-size: 16px;
}
.text-data {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: grey;
}
</style>

<style>
</style>
