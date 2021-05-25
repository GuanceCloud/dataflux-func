<i18n locale="zh-CN" lang="yaml">

Search Operation Record, User(ID, username), Client ID, Trace ID: 搜索操作记录，用户（ID、用户名），客户端ID，跟踪ID
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          近期操作记录
          <div class="header-control">
            <FuzzySearchInput
              :dataFilter="dataFilter"
              :searchTip="$t('Search Operation Record, User(ID, username), Client ID, Trace ID')">
            </FuzzySearchInput>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>尚无任何近期操作记录</h1>

          <p class="no-data-tip">
            所有重要的操作会被系统搜集，并展示在此
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.createTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column label="客户端">
            <template slot-scope="scope">
              <span class="text-info">客户端ID：</span>
              <code class="text-code text-small">{{ scope.row.clientId }}</code><CopyButton :content="scope.row.clientId"></CopyButton>
              <br>

              <span class="text-info">IP地址：</span>
              <code class="text-code text-small">{{ scope.row.clientIPsJSON.join(', ') }}</code><CopyButton :content="scope.row.clientIPsJSON.join(', ')"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column label="用户">
            <template slot-scope="scope">
              <strong>{{ scope.row.username }}</strong>
              <br>

              <template v-if="scope.row.userId">
                <span class="text-info">用户ID：</span>
                <code class="text-code text-small">{{ scope.row.userId }}</code><CopyButton :content="scope.row.userId"></CopyButton>
                <br>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="操作">
            <template slot-scope="scope">
              <span class="text-good" v-if="scope.row.respStatusCode >= 200 && scope.row.respStatusCode < 400">
                <i class="fa fa-fw fa-check-circle"></i>
              </span>
              <span class="text-bad" v-else>
                <i class="fa fa-fw fa-times-circle"></i>
              </span>
              <span>{{ scope.row._operationDescribe }}</span>
              <br>

              <template v-if="scope.row._operationEntityId">
                <span class="text-info">ID：</span>
                <code class="text-code text-small">{{ scope.row._operationEntityId }}</code><CopyButton :content="scope.row._operationEntityId"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column width="120">
            <template slot-scope="scope">
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/modify')" class="text-watch">
                <i class="fa fa-fw fa-exclamation-triangle"></i>
                修改操作
              </strong>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/delete')" class="text-bad">
                <i class="fa fa-fw fa-exclamation-circle"></i>
                删除操作
              </strong>
            </template>
          </el-table-column>

          <el-table-column label="耗时" align="right" width="100">
            <template slot-scope="scope">
              {{ scope.row.reqCost }} <span class="text-info">毫秒</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="150">
            <template slot-scope="scope">
              <el-button @click="showDetail(scope.row)" type="text">显示HTTP请求详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo"></Pager>

      <LongTextDialog title="完整内容如下" :showDownload="true" ref="longTextDialog"></LongTextDialog>
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'OperationRecordList',
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
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      let apiRes = await this.T.callAPI_get('/api/v1/operation-records/do/list', {
        query: this.T.createListQuery(),
      });
      if (!apiRes.ok) return;


      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;
      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let httpInfoLines = [];

      httpInfoLines.push('===== 请求 =====')

      httpInfoLines.push(`${d.reqMethod.toUpperCase()} ${this.T.formatURL(d.reqRoute, {params: d.reqParamsJSON, query: d.reqQueryJSON})}`)

      if (d.reqBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.reqBodyJSON, null, 2));
      }

      httpInfoLines.push('\n===== 响应 =====')

      httpInfoLines.push(`Status Code: ${d.respStatusCode}`);

      if (d.respBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.respBodyJSON, null, 2));
      }

      let httpInfoTEXT = httpInfoLines.join('\n');

      let createTimeStr = this.moment(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `http-dump.${createTimeStr}`;
      this.$refs.longTextDialog.update(httpInfoTEXT, fileName);
    },
  },
  computed: {
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
      },
    }
  },
}
</script>

<style scoped>
</style>

<style>

</style>
