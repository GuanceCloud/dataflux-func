<i18n locale="zh-CN" lang="yaml">
IP Address : IP地址
Operation  : 操作
Data ID    : 数据 ID
MODIFY     : 修改操作
DELETE     : 删除操作
Cost       : 耗时
Show detail: 显示请求详情
Request    : 请求
Response   : 响应

No Recent Operation Records: 无近期操作记录
All recent important operations will be collected by the system and shown here: 所有重要的操作会被系统搜集并展示在此
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="list-page-header">
          <span>{{ $t('Operation Records') }}</span>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Recent Operation Records') }}</h1>

          <p class="no-data-tip">
            {{ $t('All recent important operations will be collected by the system and shown here') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

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
              <el-link @click="showDetail(scope.row)">{{ $t('Show detail') }}</el-link>
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
    async loadData() {
      let _listQuery = this.dataFilter = this.T.createListQuery();

      let apiRes = await this.T.callAPI_get('/api/v1/operation-records/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;


      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;
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
