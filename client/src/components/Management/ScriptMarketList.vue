<i18n locale="en" lang="yaml">
ScriptSetCount: 'No Script Set included | Includes {n} Script Set | Includes {n} Script Sets'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Branch: 分支
Access Timeout: 访问超时

Script Market deleted: 脚本市场已删除
Script Market pinned: 脚本市场已置顶
Script Market unpinned: 脚本市场已取消置顶

No Script Market has ever been added: 从未添加过任何脚本市场
Are you sure you want to delete the Script Market?: 是否确认删除此脚本市场？

ScriptSetCount: '不包含任何脚本集 | 包含 {n} 个脚本集 | 包含 {n} 个脚本集'
</i18n>

<template>
  <transition name="fade">
    <PageLoading v-if="!$store.state.isLoaded"></PageLoading>
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

            <el-button @click="checkUpdate" type="primary" plain size="small" :disabled="isCheckingUpdate">
              <i v-if="isCheckingUpdate" class="fa fa-fw fa-circle-o-notch fa-spin"></i>
              <i v-else class="fa fa-fw fa-refresh"></i>
              {{ $t('Check Update') }}
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

          <el-table-column :label="$t('Type')" width="150" align="center">
            <template slot-scope="scope">
              <i v-if="common.getScriptMarketIcon(scope.row)" class="fa fa-fw fa-2x" :class="common.getScriptMarketIcon(scope.row)"></i>
              <strong v-else>{{ C.SCRIPT_MARKET_MAP.get(scope.row.type).name }}</strong>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Script Market')">
            <template slot-scope="scope">
              <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false" v-if="scope.row.isPinned">
                <i class="fa fa-fw fa-thumb-tack text-bad"></i>
              </el-tooltip>

              <strong class="script-market-name" :class="scope.row.isPinned ? 'text-bad': ''">
                {{ common.getScriptMarketName(scope.row) }}
              </strong>

              <div>
                <template v-if="scope.row.type === 'git'">
                  <span class="text-info">URL</span>
                  &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.url }}</code>
                  <br>
                  <span class="text-info">{{ $t('Branch') }}</span>
                  &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.branch || $t('Default') }}</code>
                </template>
                <template v-if="scope.row.type === 'aliyun_oss'">
                  <span class="text-info">{{ $t('Endpoint') }}</span>
                  &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.endpoint }}</code>
                  <br>
                  <span class="text-info">Bucket</span>
                  &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.bucket }}</code>
                  <br>
                  <span class="text-info">{{ $t('Folder') }}</span>
                  &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.folder }}</code>
                </template>

                <br>
                &#12288;{{ $tc('ScriptSetCount', (scope.row.scriptSets || []).length ) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column align="right" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.isTimeout"
                class="text-bad">
                {{ $t('Access Timeout') }}
              </span>

              <el-badge v-else :value="common.getScriptMarketUpdateBadge(scope.row.id)">
                <el-button
                  style="width: 87px"
                  type="primary"
                  size="small"
                  :plain="scope.row.isAdmin ? false : true"
                  @click="openDetail(scope.row)">
                  <i class="fa fa-fw" :class="scope.row.isAdmin ? 'fa-wrench' : 'fa-th-large'"></i>
                  {{ scope.row.isAdmin ? $t('Admin') : $t('Detail') }}
                </el-button>
              </el-badge>
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
    async checkUpdate() {
      this.isCheckingUpdate = true;
      await this.common.checkScriptMarketUpdate({ force: true });
      setTimeout(() => {
        this.isCheckingUpdate = false;
      }, 500);
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

      isCheckingUpdate: false,
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
