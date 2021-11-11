<i18n locale="zh-CN" lang="yaml">
Time       : 时间
User       : 用户
User ID    : 用户ID
Request    : 请求
Status Code: 状态码
Cost       : 耗时
ms         : 毫秒
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Abnormal Reqs') }}
          <div class="header-control">
            <el-radio-group v-model="type" size="mini">
              <el-radio-button v-for="type, i in C.ABNORMAL_REQUEST_TYPE" :key="type.key" :label="type.key">{{ type.name }}</el-radio-button>
            </el-radio-group>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title">尚无任何近期异常请求</h1>

          <p class="no-data-tip">
            所有异常的请求会被系统搜集，并展示在此
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data">

          <el-table-column :label="$t('Time')" width="240">
            <template slot-scope="scope">
              <span>{{ scope.row.reqTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.reqTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('User')" width="300">
            <template slot-scope="scope">
              <strong>{{ scope.row.u_name || $t('Anonymity') }}</strong>

              <template v-if="scope.row.userId">
                <br>
                <span class="text-info">{{ $t('User ID') }}{{ $t(':') }}</span>
                <code class="text-code text-small">{{ scope.row.userId }}</code><CopyButton :content="scope.row.userId"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Request')">
            <template slot-scope="scope">
              <strong v-if="scope.row.reqRouteName">{{ scope.row.reqRouteName }}<br></strong>
              <code class="text-code request">{{ scope.row.reqMethod }} {{ scope.row.reqURL }}</code><CopyButton :content="`${scope.row.reqMethod} ${ scope.row.reqURL }`"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status Code')" width="100">
            <template slot-scope="scope">
              <strong v-if="scope.row.respStatusCode >= 500" class="text-bad status-code">{{ scope.row.respStatusCode }}</strong>
              <strong v-else-if="scope.row.respStatusCode >= 400" class="text-watch status-code">{{ scope.row.respStatusCode }}</strong>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Cost')" align="right" width="100">
            <template slot-scope="scope">
              {{ scope.row.reqCost }} <span class="text-info">{{ $t('ms') }}</span>
            </template>
          </el-table-column>

          <el-table-column width="50">
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo"></Pager>

    </el-container>
  </transition>
</template>

<script>

export default {
  name: 'AbnormalRequestList',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    async type(val) {
      this.T.goToPageNumber(null);
      await this.loadData();
    },
  },
  methods: {
    async loadData() {
      let _listQuery = this.T.createListQuery();

      let apiRes = await this.T.callAPI('/api/v1/monitor/abnormal-requests/:type/do/list', {
        params: { type: this.type },
        query : _listQuery,
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    let _pageInfo = this.T.createPageInfo();

    return {
      data    : [],
      pageInfo: _pageInfo,


      type: 'statusCode5xx',
    }
  },
}
</script>

<style scoped>
.request {
  font-size: 16px;
}
.status-code {
  font-size: 18px;
}
</style>

<style>

</style>
