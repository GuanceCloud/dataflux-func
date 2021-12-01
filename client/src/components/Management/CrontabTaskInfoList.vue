<i18n locale="zh-CN" lang="yaml">
s: 秒

wait: 等待
cost: 消耗
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ isMainList ? '近期自动触发任务信息' : '子任务信息' }}
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

          <el-table-column label="时间" width="350">
            <template slot-scope="scope">
              入队：
              <template v-if="scope.row.queueTime">
                <span>{{ scope.row.queueTime | datetime }}</span>
                <span class="text-info">{{ scope.row.queueTime | fromNow }}</span>
              </template>

              <br>
              开始：
              <template v-if="scope.row.startTime">
                <span>{{ scope.row.startTime | datetime }}</span>
                <span class="text-info" v-if="scope.row.queueTime && scope.row.startTime">
                  {{ $t('wait')}} {{T.getTimeDiff(scope.row.queueTime, scope.row.startTime).asSeconds()}} {{ $t('s') }}
                </span>
              </template>

              <br>
              结束：
              <template v-if="scope.row.endTime">
                <span>{{ scope.row.endTime | datetime }}</span>
                <span class="text-info" v-if="scope.row.queueTime && scope.row.endTime">
                  {{ $t('cost')}} {{T.getTimeDiff(scope.row.queueTime, scope.row.endTime).asSeconds()}} {{ $t('s') }}
                </span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="函数">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :name="scope.row.func_name"></FuncInfo>
            </template>
          </el-table-column>

          <el-table-column label="日志内容">
            <template slot-scope="scope">
              <template v-if="scope.row.logMessageSample">
                <pre class="text-data">{{ scope.row.logMessageSample }}</pre>
                <el-button @click="showDetail(scope.row, 'logMessageTEXT')" type="text">显示日志详情</el-button>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="故障内容">
            <template slot-scope="scope">
              <template v-if="scope.row.einfoSample">
                <pre class="text-data">{{ scope.row.einfoSample }}</pre>
                <el-button @click="showDetail(scope.row, 'einfoTEXT')" type="text">显示故障详情</el-button>
              </template>
            </template>
          </el-table-column>

          <el-table-column width="100" align="right" v-if="isMainList">
            <template slot-scope="scope">
              <el-button @click="openSubTaskInfo(scope.row)"
                v-if="scope.row.subTaskCount > 0"
                type="text"
                >子任务 <code>({{ T.numberLimit(scope.row.subTaskCount) }})</code></el-button>
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
        _withSubTaskCount: this.isMainList,
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

      // 缩减行数
      apiRes.data.forEach(d => {
        d.logMessageSample = this.T.limitLines(d.logMessageTEXT, -3, 100);
        d.einfoSample      = this.T.limitLines(d.einfoTEXT, -3, 100);
      });

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(d, field) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `${d.funcId}.${field}.${createTimeStr}`;
      this.$refs.longTextDialog.update(d[field], fileName);
    },
    openSubTaskInfo(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      this.$router.push({
        name  : 'crontab-task-info-sub-list',
        params: {id: d.id},
        query : nextRouteQuery,
      });
    },
  },
  computed: {
    isMainList() {
      return !this.T.endsWith(this.$route.name, 'sub-list');
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
