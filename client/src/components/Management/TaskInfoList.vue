<i18n locale="zh-CN" lang="yaml">
s : 秒
ms: 毫秒

Planned Time: 计划时间
Task        : 任务
Func ID     : 函数ID
Func Name   : 函数名
Func Title  : 函数标题
Main Task   : 主任务
Sub Task    : 子任务
Wait Cost   : 排队耗时
Run Cost    : 执行耗时
Log Lines   : 日志行数
Task Type   : 任务类型
Task Status : 任务状态

Log         : 日志
Exception   : 异常
No log      : 无日志
No exception: 无异常

Recent Task Info : 近期任务信息
Related Task Info: 相关任务信息
Only main tasks are listed: 在本页面只展示主任务

success: 成功
failure: 失败

Main Task Only: 仅主任务
Show Detail   : 显示详情
Related Tasks : 相关任务

Task Info cleared: 任务信息已清空

Are you sure you want to clear the Task Info?: 是否确认清空任务信息？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ isMainTaskInfoList ? $t('Recent Task Info') : $t('Related Task Info') }}</span>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip :content="$t('Only main tasks are listed')" placement="bottom" :enterable="false" v-if="hasTaskType">
              <el-checkbox v-if="isMainTaskInfoList"
                :border="true"
                size="small"
                v-model="dataFilter.rootTaskId"
                true-label="ROOT"
                false-label=""
                @change="T.changePageFilter(dataFilter)">{{ $t('Main Task Only') }}</el-checkbox>
            </el-tooltip>

            &#12288;
            <el-tooltip :content="$t('Clear')" placement="bottom" :enterable="false">
              <el-button @click="clear" size="small" v-if="isMainTaskInfoList">
                <i class="fa fa-fw fa-trash-o"></i>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>尚无任何近期任务信息</h1>

          <p class="no-data-tip">
            执行的任务信息会被系统搜集，并展示在此
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

          <el-table-column :label="$t('Planned Time')" width="200">
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
                :id="scope.row.funcId"
                :title="scope.row.func_title"
                :name="scope.row.func_name"></FuncInfo>
              <InfoBlock v-if="scope.row.edumpTEXT || scope.row.einfoTEXT"
                :title="scope.row.edumpTEXT || scope.row.einfoTEXT.split('\n').pop()"
                type="error" ></InfoBlock>
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
              <template v-if="isMainTaskInfoList">
                <el-button v-if="scope.row.subTaskCount > 0 || scope.row.rootTaskId !== 'ROOT'"
                  type="text"
                  @click="openSubTaskInfo(scope.row)"
                  >{{ $t('Related Tasks') }}</el-button>
              </template>

              <el-button @click="showDetail(scope.row)" type="text">{{ $t('Show Detail') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo"></Pager>

      <LongTextDialog title="完整内容如下" ref="longTextDialog"></LongTextDialog>
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'TaskInfoList',
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
      _listQuery.originId = this.$route.params.id;

      let apiRes = await this.T.callAPI_get('/api/v1/task-info/do/list', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        // 判断是否存在主、子任务
        if (d.subTaskCount > 0 || d.rootTaskId !== 'ROOT') {
          this.hasTaskType = true;
        }

        // 日志长度
        d.logLines = 0
        if (d.logMessageTEXT) {
          d.logLines = d.logMessageTEXT.split('\n').length;
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
      });

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async clear() {
      if (!await this.T.confirm(this.$t('Are you sure you want to clear the Task Info?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/task-info/:originId/do/clear', {
        params: { originId: this.$route.params.id },
        alert : { okMessage: this.$t('Task Info cleared') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.loadData();
    },
    openSubTaskInfo(d) {
      let nextRouteQuery = this.T.packRouteQuery();
      nextRouteQuery.filter = this.T.createPageFilter({
        rootTaskId: d.rootTaskId === 'ROOT' ? d.id : d.rootTaskId,
      })

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      this.$router.push({
        name  : 'task-info-related-list',
        params: { id: this.$route.params.id },
        query : nextRouteQuery,
      });
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let contentLines = [];
      contentLines.push(`===== ${this.$t('Task')} =====`);
      contentLines.push(`${this.$t('Func ID')}: ${this.$t(d.funcId)}`);
      contentLines.push(`${this.$t('Func Name')}: ${this.$t(d.func_name)}`);
      contentLines.push(`${this.$t('Func Title')}: ${this.$t(d.func_title)}`);
      if (d.waitCostMs > 2000) {
        contentLines.push(`${this.$t('Wait Cost')}: ${d.waitCostMs} ${this.$t('ms')}`);
      } else {
        contentLines.push(`${this.$t('Wait Cost')}: -`);
      }
      contentLines.push(`${this.$t('Run Cost')}: ${d.runCostMs} ${this.$t('ms')}`);
      contentLines.push(`${this.$t('Task Type')}: ${d.rootTaskId === 'ROOT' ? this.$t('Main Task') : this.$t('Sub Task')}`);
      contentLines.push(`${this.$t('Task Status')}: ${this.$t(d.status)}`);

      contentLines.push('');
      contentLines.push(`===== ${this.$t('Log')} =====`);
      if (d.logMessageTEXT) {
        contentLines.push(d.logMessageTEXT);
      } else {
        contentLines.push(this.$t('No log'));
      }

      contentLines.push('');
      contentLines.push(`===== ${this.$t('Exception')} =====`);
      if (d.einfoTEXT) {
        contentLines.push(d.einfoTEXT);
      } else {
        contentLines.push(this.$t('No exception'))
      }

      let contentTEXT = contentLines.join('\n');

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `${d.funcId}.log.${createTimeStr}`;
      this.$refs.longTextDialog.update(contentTEXT, fileName);
    },
  },
  computed: {
    isMainTaskInfoList() {
      return this.$route.name === 'task-info-list';
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
