<i18n locale="zh-CN" lang="yaml">
Request    : 请求
Response   : 响应
Status Code: 状态码
Cost       : 耗时
Show detail: 显示请求详情
omitted.   : 略

No Recent Abnormal Request: 尚无任何近期异常请求
All recent abnormal requests will be collected and shown here: 所有异常的请求会被搜集，并展示在此
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Abnormal Requests') }}</h1>
          <div class="header-control">
            <el-button @click="refresh" size="small">
              <i class="fa fa-fw fa-refresh"></i>
              {{ $t('Refresh') }}
            </el-button>

            <el-radio-group
              @change="switchType(type)"
              v-model="type"
              size="small">
              <el-radio-button v-for="type, i in C.ABNORMAL_REQUEST_TYPE" :key="type.key" :label="type.key">{{ type.name }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title">{{ $t('No Recent Abnormal Request') }}</h1>

          <p class="no-data-tip">
            {{ $t('All recent abnormal requests will be collected and shown here') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Time')" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.reqTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.reqTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('User')" width="200">
            <template slot-scope="scope">
              <strong>{{ scope.row.u_name || $t('Anonymity') }}</strong>

              <template v-if="scope.row.userId">
                <br>
                <span class="text-info">{{ $t('User ID') }}</span>
                &nbsp;<code class="text-main text-small">{{ scope.row.userId }}</code>
                <CopyButton :content="scope.row.userId" />
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Request')">
            <template slot-scope="scope">
              <strong v-if="scope.row.reqRouteName">{{ scope.row.reqRouteName }}<br></strong>
              <code class="text-main">{{ scope.row.reqMethod }} {{ decodeURI(scope.row.reqURL) }}</code>
              <CopyButton :content="`${scope.row.reqMethod} ${ scope.row.reqURL }`" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('Response')" align="right" width="240">
            <template slot-scope="scope">
              <span class="text-info">{{ $t('Status Code') }}{{ $t(':') }}</span>
              <strong v-if="scope.row.respStatusCode >= 500" class="text-bad status-code">{{ scope.row.respStatusCode }}</strong>
              <strong v-else-if="scope.row.respStatusCode >= 400" class="text-watch status-code">{{ scope.row.respStatusCode }}</strong>
              <strong v-else class="text-good status-code">{{ scope.row.respStatusCode }}</strong>

              <span v-if="getRespError(scope.row)">{{ $t('(') }}{{ getRespError(scope.row) }}{{ $t(')') }}</span>

              <span class="text-info" v-if="getRespMessage(scope.row)"><br>{{ $t(getRespMessage(scope.row)) }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Cost')" align="right" width="120">
            <template slot-scope="scope">
              {{ scope.row.reqCost }} <span class="text-info">{{ $t('ms') }}</span>
            </template>
          </el-table-column>

          <el-table-column width="150" align="right">
            <template slot-scope="scope">
              <el-button @click="showDetail(scope.row)" type="text">{{ $t('Show detail') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />

      <LongTextDialog :showDownload="true" ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'AbnormalRequestList',
  components: {
    LongTextDialog,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        this.type = this.$route.query.type || 'statusCode5xx';

        await this.loadData();
      }
    },
  },
  methods: {
    async loadData(options) {
      let _listQuery = this.dataFilter = this.T.createListQuery();

      let apiRes = await this.T.callAPI('/api/v1/monitor/abnormal-requests/:type/do/list', {
        params: { type: this.type },
        query : _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    switchType(type) {
      this.$router.push({
        name: 'abnormal-request-list',
        query: { type: type },
      });
    },
    getRespError(d) {
      return (d.respBody && d.respBody.error) || d.respError;
    },
    getRespMessage(d) {
      return (d.respBody && d.respBody.message) || d.respMessage;
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let httpInfoLines = [];

      httpInfoLines.push(`===== ${this.$t('Request')} =====`)

      httpInfoLines.push(`${d.reqMethod.toUpperCase()} ${d.reqURL}`)

      if (d.reqBodyDump) {
        httpInfoLines.push(d.reqBodyDump);
      }

      httpInfoLines.push(`\n===== ${this.$t('Response')} =====`)

      httpInfoLines.push(`Status Code: ${d.respStatusCode}`);

      if (d.respBody) {
        httpInfoLines.push(JSON.stringify(d.respBody, null, 2));
      } else if (d.respBodyDump) {
        httpInfoLines.push(d.respBodyDump);
      } else {
        httpInfoLines.push(`<${this.$t('omitted.')}>`);
      }

      let httpInfoTEXT = httpInfoLines.join('\n');

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `http-dump.${createTimeStr}`;
      this.$refs.longTextDialog.update(httpInfoTEXT, fileName);
    },
    async refresh() {
      await this.loadData();
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

      },

      type: null,
    }
  },
}
</script>

<style scoped>
.status-code {
  font-size: 18px;
}
</style>

<style>
</style>
