<i18n locale="zh-CN" lang="yaml">
s : 秒
ms: 毫秒

Task       : 任务
Func ID    : 函数ID
Func Name  : 函数名
Func Title : 函数标题
Main Task  : 主任务
Sub Task   : 子任务
Wait Time  : 排队时间
Run Time   : 执行时间
Task Type  : 任务类型
Task Status: 任务状态

Log         : 日志
Exception   : 异常
No log      : 无日志
No exception: 无异常

success: 成功
failure: 失败

Task Info cleared: 任务信息已清空

Are you sure you want to clear the Task Info?: 是否确认清空任务信息？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ isMainTaskInfoList ? '近期任务信息' : '相关任务信息' }}
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip content="在本页面只展示主任务" placement="bottom" :enterable="false">
              <el-checkbox v-if="isMainTaskInfoList"
                :border="true"
                size="small"
                v-model="dataFilter.rootTaskId"
                true-label="ROOT"
                false-label=""
                @change="T.changePageFilter(dataFilter)">仅主任务</el-checkbox>
            </el-tooltip>

            &#12288;
            <el-tooltip :content="$t('Clear')" placement="bottom" :enterable="false">
              <el-button @click="clear" size="small" v-if="isMainTaskInfoList">
                <i class="fa fa-fw fa-trash-o"></i>
              </el-button>
            </el-tooltip>
          </div>
        </h1>
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

          <el-table-column label="状态" width="150">
            <template slot-scope="scope">
              <el-tag
                v-if="C.TASK_STATUS_MAP.get(scope.row.status)"
                :type="C.TASK_STATUS_MAP.get(scope.row.status).tagType"><i :class="C.TASK_STATUS_MAP.get(scope.row.status).icon"></i>
                {{ C.TASK_STATUS_MAP.get(scope.row.status).name }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="计划时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.triggerTimeMs | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.triggerTimeMs | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.subTaskCount > 0" size="medium" type="primary">主任务</el-tag>
              <el-tag v-else-if="scope.row.rootTaskId !== 'ROOT'" size="small" type="info">子任务</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="函数" min-width="300">
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

          <el-table-column label="排队耗时" align="right" width="100">
            <template slot-scope="scope">
              <template v-if="scope.row.waitCostMs && scope.row.waitCostMs > 2000">
                <span :class="scope.row.waitCostClass">{{ scope.row.waitCostMs < 10000 ? scope.row.waitCostMs : (scope.row.waitCostMs / 1000).toFixed(1) }}</span>
                <span class="text-info">{{ scope.row.waitCostMs < 10000 ? $t('ms') : $t('s') }}</span>
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>
          <el-table-column label="执行耗时" align="right" width="100">
            <template slot-scope="scope">
              <template v-if="scope.row.runCostMs">
                <span :class="scope.row.runCostClass">{{ scope.row.runCostMs < 10000 ? scope.row.runCostMs : (scope.row.runCostMs / 1000).toFixed(1) }}</span>
                <span class="text-info">{{ scope.row.runCostMs < 10000 ? $t('ms') : $t('s') }}</span>
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>

          <el-table-column width="240" align="right">
            <template slot-scope="scope">
              <template v-if="isMainTaskInfoList">
                <el-button v-if="scope.row.subTaskCount > 0 || scope.row.rootTaskId !== 'ROOT'"
                  type="text"
                  @click="openSubTaskInfo(scope.row)"
                  >相关任务</el-button>
              </template>

              <el-button @click="showDetail(scope.row)" type="text">显示详情</el-button>
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

      let apiRes = await this.T.callAPI_get('/api/v1/task-info/:originId/do/list', {
        params: { originId: this.$route.params.id },
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
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

      let nextRouteName = null;
      switch(this.$route.params.id.split('-')[0]) {
        case 'cron':
          nextRouteName = 'crontab-config-list';
          break;

        case 'bat':
          nextRouteName = 'batch-list';
          break;

        default:
          nextRouteName = 'overview';
          break;
      }

      this.$router.push({ name: nextRouteName });
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
        contentLines.push(`${this.$t('Wait Time')}: ${d.waitCostMs} ${this.$t('ms')}`);
      } else {
        contentLines.push(`${this.$t('Wait Time')}: -`);
      }
      contentLines.push(`${this.$t('Run Time')}: ${d.runCostMs} ${this.$t('ms')}`);
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
