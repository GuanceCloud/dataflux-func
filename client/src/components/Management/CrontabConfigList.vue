<i18n locale="en" lang="yaml">
lastSucceeded : 'Succeeded {t}'
lastFailed    : 'Failed {t}'
lastRan       : 'Ran {t}'
successCount  : 'Success {n}'
failureCount  : 'Failure {n}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Fixed      : 固定
Not Set    : 未配置
Config     : 配置
Created    : 创建
Expires    : 过期
Task Record: 任务记录
Run        : 执行

Crontab Config disabled : 自动触发配置已禁用
Crontab Config enabled  : 自动触发配置已启用
Crontab Config deleted  : 自动触发配置已删除
Crontab Config Task sent: 自动触发配置任务已发送

Show all contents: 展示全部内容
No Crontab Config has ever been added: 从未添加过任何自动触发配置

Are you sure you want to disable the Crontab Config?: 是否确认禁用此自动触发配置？
Are you sure you want to delete the Crontab Config?: 是否确认删除此自动触发配置？
Are you sure you want to run the Crontab Config manually?: 是否确认手动执行此自动触发配置？

lastSucceeded : '{t}执行成功'
lastFailed    : '{t}执行失败'
lastRan       : '{t}执行'
successCount  : '成功 {n}'
failureCount  : '失败 {n}'

Using Crontab Config, you can have functions executed at regular intervals: 使用自动触发配置，可以让函数定时执行
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Crontab Config') }}</h1>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip :content="$t('Show all contents')" placement="bottom" :enterable="false">
              <el-checkbox
                :border="true"
                size="small"
                v-model="dataFilter.origin"
                true-label="_ALL"
                false-label="user"
                @change="T.changePageFilter(dataFilter)">{{ $t('Show all') }}</el-checkbox>
            </el-tooltip>
            <el-button @click="openSetup(null, 'add')" type="primary" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: '_ALL' } })"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Crontab Config has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('Using Crontab Config, you can have functions executed at regular intervals') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Func')" min-width="420">
            <template slot-scope="scope">
              <FuncInfo
                :config-func-id="scope.row.funcId"
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :kwargsJSON="scope.row.funcCallKwargsJSON" />

              <div>
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id" />

                <template v-if="T.notNothing(scope.row.tagsJSON) || T.notNothing(scope.row.func_tagsJSON)">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Tags') }}</span>
                  <el-tag size="mini" type="info" v-for="t in scope.row.func_tagsJSON" :key="t">{{ t }}</el-tag>
                  <el-tag size="mini" type="warning" v-for="t in scope.row.tagsJSON" :key="t">{{ t }}</el-tag>
                </template>

                <template v-if="scope.row.note">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                  <span>{{ scope.row.note }}</span>
                </template>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Config')" width="240">
            <template slot-scope="scope">
              <span class="text-info">Crontab{{ $t(':') }}</span>
              <template v-if="scope.row.func_extraConfigJSON && scope.row.func_extraConfigJSON.fixedCrontab">
                <code class="text-main">{{ scope.row.func_extraConfigJSON.fixedCrontab }}</code>
                <el-tag size="mini">{{ $t('Fixed') }}</el-tag>
              </template>
              <code v-else-if="scope.row.crontab" class="text-main">{{ scope.row.crontab }}</code>
              <span v-else class="text-bad">{{ $t('Not Set') }}</span>

              <br>
              <span class="text-info">{{ $t('Created') }}{{ $t(':') }}</span>
              <RelativeDateTime :datetime="scope.row.createTime" />

              <br>
              <span class="text-info">{{ $t('Expires') }}{{ $t(':') }}</span>
              <span v-if="!scope.row.expireTime">-</span>
              <template v-else>
                <RelativeDateTime :datetime="scope.row.expireTime"
                  :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'" />
              </template>
            </template>
          </el-table-column>

          <el-table-column v-if="isLocalFuncTaskRecordEnabled" :label="$t('Task Record')" width="240">
            <template slot-scope="scope">
              <template v-if="!isStatisticLoaded">
                <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
                {{ $t('Loading') }}
              </template>
              <template v-else-if="statisticMap[scope.row.id]">
                <span v-if="statisticMap[scope.row.id].lastStatus === 'success'" class="text-good">
                  <i class="fa fa-fw fa-check"></i> {{ $t('lastSucceeded', { t: T.fromNow(statisticMap[scope.row.id].lastStartTime) }) }}
                </span>
                <span v-else-if="statisticMap[scope.row.id].lastStatus === 'failure'" class="text-bad">
                  <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(statisticMap[scope.row.id].lastStartTime) }) }}
                </span>
                <span v-else class="text-main">
                  <i class="fa fa-fw fa-clock-o"></i> {{ $t('lastRan', { t: T.fromNow(statisticMap[scope.row.id].lastStartTime) }) }}
                </span>

                <br>
                <i class="fa fa-fw fa-pie-chart text-info"></i>
                <span :class="{ 'text-good': !!statisticMap[scope.row.id].recentSuccessCount }">{{ $t('successCount', { n: T.numberLimit(statisticMap[scope.row.id].recentSuccessCount) }) }}</span>
                / <span :class="{ 'text-bad': !!statisticMap[scope.row.id].recentFailureCount }">{{ $t('failureCount', { n: T.numberLimit(statisticMap[scope.row.id].recentFailureCount) }) }}</span>
              </template>
              <template v-else>
                {{ $t('No recent record') }}
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
              <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="350">
            <template slot-scope="scope">
              <template v-if="statisticMap[scope.row.id]">
                <el-link @click="common.goToTaskRecord({ origin: 'crontab', originId: scope.row.id }, { hlDataId: scope.row.id })" :disabled="!statisticMap[scope.row.id].taskRecordCount">
                  {{ $t('Task Record') }} <code v-if="statisticMap[scope.row.id].taskRecordCount">({{ T.numberLimit(statisticMap[scope.row.id].taskRecordCount) }})</code>
                </el-link>
              </template>
              <el-link @click="runTask(scope.row)" :disabled="!scope.row.func_id">
                {{ $t('Run') }}
              </el-link>

              <el-link :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" v-prevent-re-click @click="quickSubmitData(scope.row, 'enable')">{{ $t('Enable') }}</el-link>
              <el-link :disabled="T.isNothing(scope.row.func_id)" v-if="!scope.row.isDisabled" @click="quickSubmitData(scope.row, 'disable')">{{ $t('Disable') }}</el-link>
              <el-link @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>
              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />
      <CrontabConfigSetup ref="setup" />
    </el-container>
  </transition>
</template>

<script>
import CrontabConfigSetup from '@/components/Management/CrontabConfigSetup'

export default {
  name: 'CrontabConfigList',
  components: {
    CrontabConfigSetup,
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
    async loadData(options) {
      options = options || {};

      // 默认过滤条件
      let _listQuery = this.dataFilter = this.T.createListQuery();
      if (this.T.isNothing(this.$route.query)) {
        _listQuery.origin = 'user';
      }

      let apiRes = await this.T.callAPI_get('/api/v1/crontab-configs/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);

      // 获取统计信息
      if (this.isLocalFuncTaskRecordEnabled && !options.skipStatistic) {
        this.isStatisticLoaded = false;
        setTimeout(async () => {
          this.statisticMap = await this.common.loadStatistic('originId', this.data.map(d => d.id));
          this.isStatisticLoaded = true;
        }, 1000);
      }
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'disable':
          if (!await this.T.confirm(this.$t('Are you sure you want to disable the Crontab Config?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Crontab Config?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: true } },
            alert : { okMessage: this.$t('Crontab Config disabled') },
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: false } },
            alert : { okMessage: this.$t('Crontab Config enabled') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/crontab-configs/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Crontab Config deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData({ skipStatistic: true });
    },
    openSetup(d, target) {
      switch(target) {
        case 'add':
          this.$refs.setup.loadData();
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);
          this.$refs.setup.loadData(d.id);
          break;
      }
    },
    async runTask(d) {
      if (!await this.T.confirm(this.$t('Are you sure you want to run the Crontab Config manually?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/cron/:id', {
        params: { id: d.id },
        alert : { okMessage: this.$t('Crontab Config Task sent') },
      });

      this.$store.commit('updateHighlightedTableDataId', d.id);
    },
  },
  computed: {
    isLocalFuncTaskRecordEnabled() {
      return !!this.$store.getters.SYSTEM_SETTINGS('LOCAL_FUNC_TASK_RECORD_ENABLED');
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

      statisticMap     : {},
      isStatisticLoaded: false,

      dataFilter: {
        _fuzzySearch: _dataFilter._fuzzySearch,
        origin      : _dataFilter.origin,
      },
    }
  },
  created() {
    this.$root.$on('reload.crontabConfigList', () => this.loadData({ skipStatistic: true }));
  },
  destroyed() {
    this.$root.$off('reload.crontabConfigList');
  },
}
</script>

<style scoped>
</style>

<style>
.api-url-with-query .el-link--inner {
  padding: 0 5px;
}
</style>
