<i18n locale="zh-CN" lang="yaml">
s: 秒

Log      : 日志
Exception: 异常
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ isMainList ? '近期自动触发任务信息' : '相关自动触发任务信息' }}
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip content="只展示主任务" placement="bottom" :enterable="false">
              <el-checkbox v-if="isMainList"
                :border="true"
                size="small"
                v-model="dataFilter.rootTaskId"
                true-label="ROOT"
                false-label=""
                @change="T.changePageFilter(dataFilter)">仅主任务</el-checkbox>
            </el-tooltip>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>尚无任何近期自动触发任务信息</h1>

          <p class="no-data-tip">
            执行的自动触发任务信息会被系统搜集，并展示在此
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

          <el-table-column label="时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.queueTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.queueTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.subTaskCount > 0" size="medium" type="primary">主任务</el-tag>
              <el-tag v-else-if="scope.row.rootTaskId !== 'ROOT'" size="small" type="info">子任务</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="函数" min-width="200">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :name="scope.row.func_name"></FuncInfo>
            </template>
          </el-table-column>

          <el-table-column label="排队 / 总耗时" align="right" width="120">
            <template slot-scope="scope">
              <template v-if="scope.row.startTime">
                {{ T.getTimeDiff(scope.row.queueTime, scope.row.startTime).asSeconds() }}
              </template>
              <template v-else>-</template>

              <span class="text-info">/</span>

              <template v-if="scope.row.endTime">
                {{ T.getTimeDiff(scope.row.queueTime, scope.row.endTime).asSeconds() }} <span class="text-info">{{ $t('s') }}</span>
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>

          <el-table-column width="240" align="right">
            <template slot-scope="scope">
              <template v-if="isMainList">
                <el-button v-if="scope.row.subTaskCount > 0 || scope.row.rootTaskId !== 'ROOT'"
                  type="text"
                  @click="openSubTaskInfo(scope.row)"
                  >相关任务</el-button>
              </template>

              <el-button
                :disabled="!scope.row.logMessageTEXT && !scope.row.einfoTEXT"
                @click="showLog(scope.row)" type="text">显示日志详情</el-button>
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
  name: 'CrontabTaskInfoList',
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
      let _listQuery = this.dataFilter = this.T.createListQuery({
        _withSubTaskCount: true,
      });
      if (this.isMainList) {
        _listQuery.crontabConfigId = this.$route.params.id;
        if (this.T.isNothing(this.dataFilter.rootTaskId)) {
          _listQuery.rootTaskId = null;
        }
      } else {
        _listQuery.rootTaskId = this.$route.params.id;
      }

      let apiRes = await this.T.callAPI_get('/api/v1/crontab-task-info/do/list', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    showLog(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let contentLines = [];
      contentLines.push(`===== ${this.$t('Log')} =====`)
      contentLines.push(d.logMessageTEXT)

      if (d.einfoTEXT) {
        contentLines.push(`\n===== ${this.$t('Exception')} =====`)
        contentLines.push(d.einfoTEXT)
      }

      let contentTEXT = contentLines.join('\n');

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `${d.funcId}.log.${createTimeStr}`;
      this.$refs.longTextDialog.update(contentTEXT, fileName);
    },
    openSubTaskInfo(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      let rootTaskId = d.rootTaskId === 'ROOT' ? d.id : d.rootTaskId;
      this.$router.push({
        name  : 'crontab-task-info-related-list',
        params: { id: rootTaskId },
        query : nextRouteQuery,
      });
    },
  },
  computed: {
    isMainList() {
      return this.$route.name === 'crontab-task-info-list';
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
  mounted() {
    window.vmc = this;
  }
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
