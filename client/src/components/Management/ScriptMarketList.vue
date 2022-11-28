<i18n locale="en" lang="yaml">
scriptSetCount: 'No Script Set | Total {n} Script Set | Total {n} Script Set'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Branch: 分支

Script Market deleted: 脚本市场已删除
Script Market pinned: 脚本市场已置顶
Script Market unpinned: 脚本市场已取消置顶

No Script Market has ever been added: 从添加过任何脚本市场
Are you sure you want to delete the Script Market?: 是否确认删除此脚本市场？

scriptSetCount: '暂无脚本集 | 共 {n} 个脚本集 | 共 {n} 个脚本集'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Market') }}</span>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-button @click="openSetup(null, 'add')" type="primary" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('Add') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Script Market has ever been added') }}</h1>

          <p class="no-data-tip">
            添加脚本市场后，可以从脚本市场安装现成脚本集，或将本地脚本集推送到市场
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Type')" width="100">
            <template slot-scope="scope">
              <i class="fa fa-2x" :class="getScriptMarketIcon(scope.row)"></i>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Script Market')">
            <template slot-scope="scope">
              <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false" v-if="scope.row.isPinned">
                <i class="fa fa-fw fa-thumb-tack text-bad"></i>
              </el-tooltip>

              <strong class="script-market-name" :class="scope.row.isPinned ? 'text-bad': ''">
                {{ getScriptMarketName(scope.row) }}
              </strong>

              <div>
                <span v-if="scope.row.type === 'git'">
                  <code class="text-main">{{ scope.row.configJSON.url }}</code>
                  {{ $t('(') }}
                    <i class="fa fa-code-fork"></i>
                    {{ $t('Branch') }}{{ $t(':') }}
                    <code class="text-main">{{ scope.row.gitBranch || $t('Default') }}</code>
                  {{ $t(')') }}
                </span>
                <span v-if="scope.row.type === 'aliyun_oss'">
                  <code class="text-main">{{ scope.row.configJSON.bucket }}.oss-{{ scope.row.configJSON.region }}.aliyuncs.com</code>
                </span>

                <br>
                &#12288;{{ $tc('scriptSetCount', scope.row.scriptSets.length ) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.isOwner" type="success" size="small">
                <i class="fa fa-fw fa-key"></i>
                {{ $t('Owner') }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column align="right" width="100">
            <template slot-scope="scope">
              <el-button
                type="primary"
                size="small"
                plain
                @click="openDetail(scope.row)">
                <i class="fa fa-fw fa-th-large"></i>
                {{ $t('Detail') }}
              </el-button>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <el-link v-if="scope.row.isPinned" v-prevent-re-click @click="quickSubmitData(scope.row, 'unpin')">{{ $t('Unpin') }}</el-link>
              <el-link v-else v-prevent-re-click @click="quickSubmitData(scope.row, 'pin')">{{ $t('Pin') }}</el-link>

              <el-link @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>

              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
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
  name: 'ScriptMarketList',
  components: {
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

      let apiRes = await this.T.callAPI_get('/api/v1/script-markets/do/list', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Market?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'pin':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isPinned: true } },
            alert : { okMessage: this.$t('Script Market pinned') },
          });
          break;

        case 'unpin':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isPinned: false } },
            alert : { okMessage: this.$t('Script Market unpinned') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/script-markets/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Script Market deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateTableList_scrollY');
      switch(target) {
        case 'add':
          this.$router.push({
            name : 'script-market-add',
            query: nextRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'script-market-setup',
            params: { id: d.id },
            query : nextRouteQuery,
          })
          break;
      }
    },
    openDetail(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);

      this.$router.push({
        name  : 'script-market-detail',
        params: { id: d.id },
        query : nextRouteQuery,
      })
    },
    getScriptMarketIcon(scriptMarket) {
      if (scriptMarket.type === 'git') {
        let url = new URL(scriptMarket.configJSON.url);
        switch(url.host) {
          case 'github.com':
            return 'fa-github';

          case 'gitlab.com':
          case 'jihulab.com':
            return 'fa-gitlab';

          case 'bitbucket.org':
            return 'fa-bitbucket';
          }
      }

      return this.C.SCRIPT_MARKET_MAP.get(scriptMarket.type).icon;
    },
    getScriptMarketName(scriptMarket) {
      if (scriptMarket.name) {
        return scriptMarket.name
      } else {
        switch(scriptMarket.type) {
          case 'git':
            return new URL(scriptMarket.configJSON.url).pathname.replace(/^\//g, '').replace(/\.git/g, '');

          case 'aliyun_oss':
            return `${scriptMarket.configJSON.bucket}.cn-${scriptMarket.configJSON.region}`;
        }
      }
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
.script-market-name {
  font-size: 18px;
  line-height: 25px;
}
</style>

<style>
</style>
