<i18n locale="en" lang="yaml">
ScriptSetCount: 'No Script Set included | Includes {n} Script Set | Includes {n} Script Sets'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Homepage: 前往主页
Branch: 分支
Access Timeout: 访问超时

Locked by other user ({user}): 被其他用户（{user}）锁定
Locked by you                : 被您锁定

Add Official Script Market: 添加官方脚本市场

Script Market deleted : 脚本市场已删除
Script Market pinned  : 脚本市场已置顶
Script Market unpinned: 脚本市场已取消置顶
Script Market locked  : 脚本市场已上锁
Script Market unlocked: 脚本市场已解锁

No Script Market has ever been added: 从未添加过任何脚本市场
Are you sure you want to delete the Script Market?: 是否确认删除此脚本市场？
Official Script Market added: 官方脚本市场已添加

ScriptSetCount: '不包含任何脚本集 | 包含 {n} 个脚本集 | 包含 {n} 个脚本集'

'Checking Update...': '正在检查更新...'
'Deleting...'       : '正在删除...'
</i18n>

<template>
  <transition name="fade">
    <PageLoading v-if="!$store.state.isLoaded"></PageLoading>
    <el-container direction="vertical" v-show="$store.state.isLoaded"
      v-loading.fullscreen.lock="isProcessing"
      element-loading-spinner="el-icon-loading"
      :element-loading-text="processingText">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Market') }}</span>

          <div class="header-control">
            <template v-if="$root.variableConfig['OFFICIAL_SCRIPT_MARKET_ENABLED']">
              <el-link v-if="!hasOfficialScriptMarket" @click="createOfficialScriptMarket">
                <i class="fa fa-fw fa-star"></i>
                {{ $t('Add Official Script Market') }}
              </el-link>
              &#12288;
            </template>

            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-button @click="openSetup(null, 'add')" type="primary" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('Add') }}
            </el-button>

            <el-button
              @click="checkUpdate"
              type="primary"
              plain
              size="small"
              :disabled="isProcessing">
              <i v-if="isProcessing" class="fa fa-fw fa-circle-o-notch fa-spin"></i>
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
              <i v-if="scope.row.isOfficial" class="fa fa-fw fa-3x fa-star text-watch"></i>
              <el-image v-else class="script-market-logo" :class="common.getScriptMarketClass(scope.row)" :src="common.getScriptMarketLogo(scope.row)"></el-image>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Script Market')">
            <template slot-scope="scope">
              <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false" v-if="scope.row.isPinned">
                <i class="fa fa-fw fa-thumb-tack text-bad"></i>
              </el-tooltip>

              <strong class="script-market-name" :class="scope.row.isPinned ? 'text-bad': ''">
                <span v-if="scope.row.isOfficial">{{ $t('Official Script Market') }}</span>
                <span v-else>{{ common.getScriptMarketName(scope.row) }}</span>
              </strong>

              <div>
                <template v-if="!scope.row.isOfficial">
                  <template v-if="scope.row.type === 'git'">
                    <span class="text-info">URL</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.url }}</code>
                    <CopyButton :content="scope.row.configJSON.url" />
                    <br>
                    <span class="text-info">{{ $t('Branch') }}</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.branch || $t('Default') }}</code>
                  </template>
                  <template v-if="scope.row.type === 'aliyunOSS'">
                    <span class="text-info">{{ $t('Endpoint') }}</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.endpoint }}</code>
                    <CopyButton :content="scope.row.configJSON.endpoint" />
                    <br>
                    <span class="text-info">Bucket</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.bucket }}</code>
                    <CopyButton :content="scope.row.configJSON.bucket" />
                    <br>
                    <span class="text-info">{{ $t('Folder') }}</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.folder }}</code>
                    <CopyButton :content="scope.row.configJSON.folder" />
                  </template>
                  <template v-if="scope.row.type === 'httpService'">
                    <span class="text-info">URL</span>
                    &nbsp;<code class="text-main code-font">{{ scope.row.configJSON.url }}</code>
                    <CopyButton :content="scope.row.configJSON.url" />
                  </template>
                  <br>
                </template>

                <div class="script-market-extra-info">
                  <span>{{ $tc('ScriptSetCount', (scope.row.scriptSets || []).length ) }}</span>
                </div>
              </div>

              <InfoBlock v-if="scope.row.error" :title="scope.row.error" type="error"  />
            </template>
          </el-table-column>

          <el-table-column align="right" width="140">
            <template slot-scope="scope">
              <el-link v-if="scope.row.extra.homepageURL || scope.row.type === 'git'"
                :href="scope.row.extra.homepageURL || scope.row.configJSON.url" target="_blank">
                <i class="fa fa-fw fa-external-link"></i>
                {{ $t('Homepage') }}
              </el-link>
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

          <el-table-column width="50">
            <template slot-scope="scope">
              <el-tooltip effect="dark" :content="scope.row.isLockedByOther ? $t('Locked by other user ({user})', { user: scope.row.lockedByUser }) : $t('Locked by you')" placement="top" :enterable="false">
                <i class="fa fa-fw fa-2x" :class="[ scope.row.isLocked ? 'fa-lock' : '', scope.row.isLockedByOther ? 'text-bad':'text-good' ]"></i>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <el-link
                :disabled="!scope.row.isAccessible"
                v-prevent-re-click @click="quickSubmitData(scope.row, scope.row.isPinned ? 'unpin' : 'pin')">
                {{ scope.row.isPinned ? $t('Unpin') : $t('Pin') }}
              </el-link>

              <el-link
                :disabled="!scope.row.isAccessible"
                v-prevent-re-click @click="lockData(scope.row.id, !scope.row.isLocked)">
                {{ scope.row.isLocked ? $t('Unlock') : $t('Lock') }}
              </el-link>

              <el-link
                :disabled="scope.row.isOfficial || !scope.row.isAccessible"
                @click="openSetup(scope.row, 'setup')">
                {{ $t('Setup') }}
              </el-link>

              <el-link
                :disabled="!scope.row.isAccessible"
                @click="quickSubmitData(scope.row, 'delete')">
                {{ $t('Delete') }}
              </el-link>
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
    async loadData(opt) {
      opt = opt || {};
      if (opt.runCheckUpdate) {
        await this.T.callAPI_get('/api/v1/script-markets/do/check-update');
      }

      let _listQuery = this.dataFilter = this.T.createListQuery();
      let apiRes = await this.T.callAPI_get('/api/v1/script-markets/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      // 隐藏官方脚本市场
      if (!this.$root.variableConfig['OFFICIAL_SCRIPT_MARKET_ENABLED']) {
        apiRes.data = apiRes.data.filter(x => !x.isOfficial);
      }

      // 锁定状态
      apiRes.data.forEach(d => {
        d.lockedByUser    = `${d.lockedByUserName || d.lockedByUsername || this.$t('UNKNOW') }`;
        d.isLockedByMe    = d.lockedByUserId === this.$store.getters.userId;
        d.isLockedByOther = d.lockedByUserId && !d.isLockedByMe;
        d.isAccessible    = this.$store.getters.isAdmin || !d.isLockedByOther;
        d.isLocked        = d.isLockedByMe || d.isLockedByOther;
      });

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI_getOne('/api/v1/script-markets/do/list', d.id);
          if (!apiRes || !apiRes.ok) return;

          if (apiRes.data.type === 'git'
            && apiRes.data.isAdmin
            && !this.$root.checkUserProfileForGit()) return;

          break;
      }

      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Market?'))) return;
          break;
      }

      let runCheckUpdate = null;
      switch(operation) {
        case 'pin':
          runCheckUpdate = false;

          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isPinned: true } },
            alert : { okMessage: this.$t('Script Market pinned') },
          });
          break;

        case 'unpin':
          runCheckUpdate = false;

          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isPinned: false } },
            alert : { okMessage: this.$t('Script Market unpinned') },
          });
          break;

        case 'delete':
          runCheckUpdate = true;

          this.processingText = this.$t('Deleting...');
          this.isProcessing = true;
          apiRes = await this.T.callAPI('/api/v1/script-markets/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Script Market deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData({ runCheckUpdate: runCheckUpdate });

      this.isProcessing = false;
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
      this.processingText = this.$t('Checking Update...');
      this.isProcessing = true;

      let minLoadingTime = 1000;
      let startTime = Date.now();

      await this.common.checkScriptMarketUpdate();
      await this.loadData();

      let endTime = Date.now();
      let processedTime = endTime - startTime;
      if (processedTime > minLoadingTime) {
        this.isProcessing = false;
      } else {
        setTimeout(() => {
          this.isProcessing = false;
        }, minLoadingTime - processedTime);
      }
    },
    async createOfficialScriptMarket() {
      let apiRes = await this.T.callAPI('post', '/api/v1/script-markets/do/add-official', {
        alert: { okMessage: this.$t('Official Script Market added') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      await this.loadData();
    },

    async lockData(dataId, isLocked) {
      let okMessage = isLocked
                    ? this.$t('Script Market locked')
                    : this.$t('Script Market unlocked');
      let apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
        params: { id: dataId },
        body  : { data: { isLocked: isLocked } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
    },
  },
  computed: {
    hasOfficialScriptMarket() {
      for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].isOfficial) return true;
      }
      return false;
    }
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

      isProcessing: false,
      processingText: null,
    }
  },
}
</script>

<style scoped>
.script-market-name {
  font-size: 16px;
}
.script-market-extra-info {
  padding-left: 20px;
}
</style>
<style>
.script-market-logo img {
  width: auto;
}
.script-market-logo.logo-git {
  height: 70px !important;
}
.script-market-logo.logo-github-com {
  height: 70px !important;
}
.script-market-logo.logo-gitlab-com,
.script-market-logo.logo-jihulab-com {
  height: 80px !important;
}
.script-market-logo.logo-gitee-com {
  height: 60px !important;
}
.script-market-logo.logo-bitbucket-org {
  height: 50px !important;
}
.script-market-logo.logo-aliyunOSS {
  height: 80px !important;
}
.script-market-logo.logo-httpService {
  height: 70px !important;
}
</style>
