<i18n locale="zh-CN" lang="yaml">
Type        : 类型
Expires     : 有效期
Never       : 永不过期
Data Size   : 数据大小
Show content: 显示内容

Func Store data deleted: 函数缓存数据已删除

No Func Store data has ever been added: 从未添加过任何函数存储数据

Are you sure you want to delete the Func Store data?: 是否确认删除此函数存储数据？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Func Store Manage') }}</span>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Func Store data has ever been added') }}</h1>

          <p class="no-data-tip">
            可以使用<code>DFF.STORE.set('key', 'value', scope='scope', expire=3600)</code>和<code>DFF.STORE('key', scope='scope')</code>来存取函数存储数据
            <br><code>scope</code>参数为可选。未指定时则默认为代码所在的脚本ID
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data">

          <el-table-column :label="$t('Type')" width="120">
            <template slot-scope="scope">
              <code>{{ scope.row.type.toLowerCase() }}</code>
            </template>
          </el-table-column>

          <el-table-column label="Key">
            <template slot-scope="scope">
              <code class="text-main">{{ scope.row.key }}</code>
              <CopyButton :content="scope.row.key" />
            </template>
          </el-table-column>

          <el-table-column label="Scope">
            <template slot-scope="scope">
              <code class="text-main">{{ scope.row.scope }}</code>
              <CopyButton :content="scope.row.scope" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('Expires')" width="120">
            <template slot-scope="scope">
              <span v-if="!scope.row.expireAtMs" class="text-bad">{{ $t('Never') }}</span>
              <template v-else>
                <span :class="T.isExpired(scope.row.expireAtMs) ? 'text-info' : 'text-good'">{{ scope.row.expireAtMs | datetime }}</span>
                <br>
                <span class="text-info">{{ scope.row.expireAtMs | fromNow }}</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Data Size')" sortable sort-by="dataSize" align="right" width="150">
            <template slot-scope="scope">
              <code :class="{ 'text-bad': scope.row.isOverSized }">{{ scope.row.dataSizeHuman }}</code>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <el-link v-if="!scope.row.isOverSized" @click="showDetail(scope.row)">{{ $t('Show content') }}</el-link>
              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />

      <LongTextDialog title="内容如下" :showDownload="true" ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'FuncStoreManage',
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

      let apiRes = await this.T.callAPI_get('/api/v1/func-stores/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.data.forEach(d => {
        if (d.expireAt) {
          d.expireAtMs = d.expireAt * 1000;
        }
        if (d.dataSize) {
          d.dataSizeHuman = this.T.byteSizeHuman(d.dataSize);
          d.isOverSized   = d.dataSize > (100 * 1024);
        }
      });

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let extraInfo = `<small>
          <br>Key: <code class="text-main">${d.key}</code>
          <br>Scope: <code class="text-main">${d.scope}</code>
        <small>`;

      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Func Store data?') + extraInfo)) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/func-stores/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Func Store data deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
    },
    async showDetail(d) {
      let apiRes = await this.T.callAPI_get('/api/v1/func-stores/:id/do/get', {
        params: { id: d.id }
      });
      if (!apiRes.ok) return

      let content = apiRes.data.valueJSON;
      if ('string' !== typeof content) {
        content = JSON.stringify(content, null, 2);
      }

      let createTimeStr = this.M(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `${d.scope}.${d.key}.${createTimeStr}`;
      this.$refs.longTextDialog.update(content, fileName);
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
