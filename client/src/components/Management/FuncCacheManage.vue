<i18n locale="zh-CN" lang="yaml">
Type         : 类型
Never expires: 永不过期
Memory usage : 内存使用
Show content : 显示内容

Func Cache data deleted: 函数缓存数据已删除

Search for more data: 搜索以查看更多内容
No Func Cache data has ever been added: 从未添加过任何函数缓存数据

Are you sure you want to delete the Func Cache data?: 是否确认删除此函数缓存数据？

Using {0} and {1} to setting and getting cache data in Script: 可以使用 {0} 和 {1} 在脚本中存取缓存数据
See {0} for more information: 查看 {0} 来获取更多信息
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="list-page-header">
          <span>{{ $t('Func Cache Manage') }}</span>
          <div class="header-control">
            <small class="text-info">{{ $t('Search for more data') }}</small>
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Func Cache data has ever been added') }}</h1>

          <p class="no-data-tip">
            <i18n path="Using {0} and {1} to setting and getting cache data in Script">
              <code class="code-font">DFF.CACHE.set('key', 'value')</code>
              <code class="code-font">DFF.CACHE('key')</code>
            </i18n>
            <br>
            <i18n path="See {0} for more information">
              <el-link href="https://func.guance.com/doc/development-guide-builtin-features-dff-cache/" target="_blank">
                <i class="fa fa-fw fa-book"></i>
                {{ $t('Document') }}
              </el-link>
            </i18n>
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

          <el-table-column label="TTL" sortable sort-by="ttl" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.ttl === -1" class="text-bad">{{ $t('Never expires') }}</span>
              <template v-else>
                <code class="text-good">{{ scope.row.ttl }}</code>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Memory usage')" sortable sort-by="memoryUsage" align="right" width="150">
            <template slot-scope="scope">
              <code :class="{ 'text-bad': scope.row.isOverSized }">{{ scope.row.memoryUsageHuman }}</code>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <el-link v-if="['string', 'list', 'hash'].indexOf(scope.row.type) >= 0 && !scope.row.isOverSized" @click="showDetail(scope.row)">
                {{ $t('Show content') }}
              </el-link>
              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <LongTextDialog  :showDownload="true" ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'FuncCacheManage',
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
      // 默认过滤条件
      let _listQuery = this.dataFilter = this.T.createListQuery();

      let apiRes = await this.T.callAPI_get('/api/v1/func-caches/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;

      this.data.forEach(d => {
        if (d.memoryUsage) {
          d.memoryUsageHuman = this.T.byteSizeHuman(d.memoryUsage);
          d.isOverSized      = d.memoryUsage > (100 * 1024);
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
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Func Cache data?') + extraInfo)) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/func-caches/:scope/:key/do/delete', {
            params: { scope: d.scope, key: d.key },
            alert : { okMessage: this.$t('Func Cache data deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
    },
    async showDetail(d) {
      let apiRes = await this.T.callAPI_get('/api/v1/func-caches/:scope/:key/do/get', {
        params: { scope: d.scope, key: d.key }
      });
      if (!apiRes.ok) return

      let content = apiRes.data;
      try {
        if ('string' === typeof content) content = JSON.parse(content);
        content = JSON.stringify(content, null, 2);
      } catch(_) {}

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
    let _dataFilter = this.T.createListQuery();

    return {
      data: [],

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
