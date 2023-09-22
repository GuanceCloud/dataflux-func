<i18n locale="en" lang="yaml">
lastSucceeded : 'Succeeded {t}'
lastFailed    : 'Failed {t}'
successCount  : 'Success {n}'
failureCount  : 'Failure {n}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Config     : 配置
Auth       : 认证
Task Record: 任务记录

Batch disabled: 批处理已禁用
Batch enabled : 批处理已启用
Batch deleted : 批处理已删除

Show all contents: 展示全部内容
No Batch has ever been added: 从未添加过任何批处理

Are you sure you want to disable the Batch?: 是否确认禁用此批处理？
Are you sure you want to delete the Batch?: 是否确认删除此批处理？

lastSucceeded : '{t}调用成功'
lastFailed    : '{t}调用失败'
successCount  : '成功 {n}'
failureCount  : '失败 {n}'

Using Batches, you can execute long and time-consuming Python functions: 使用批处理，可以执行长耗时的 Python 函数
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Batch') }}</h1>
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
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Batch has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('Using Batches, you can execute long and time-consuming Python functions') }}
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
              <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
              <el-tooltip :content="scope.row.apia_title" :disabled="!!!scope.row.apia_title" placement="right">
                <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
              </el-tooltip>
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
                <span v-else class="text-bad">
                  <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(statisticMap[scope.row.id].lastStartTime) }) }}
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
                <el-link @click="common.goToTaskRecord({ origin: 'batch', originId: scope.row.id }, { hlDataId: scope.row.id })" :disabled="!statisticMap[scope.row.id].taskRecordCount">
                  {{ $t('Task Record') }} <code v-if="statisticMap[scope.row.id].taskRecordCount">({{ T.numberLimit(statisticMap[scope.row.id].taskRecordCount) }})</code>
                </el-link>
              </template>
              <el-link :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row)">{{ $t('Example') }}</el-link>
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
      <BatchSetup ref="setup" />

      <APIExampleDialog ref="apiExampleDialog"
        :showExecModeOption="false"
        :showPostExample="true"
        :showPostExampleSimplified="true"
        :showGetExample="true"
        :showGetExampleSimplified="true"></APIExampleDialog>
    </el-container>
  </transition>
</template>

<script>
import BatchSetup from '@/components/Management/BatchSetup'
import APIExampleDialog from '@/components/APIExampleDialog'

export default {
  name: 'BatchList',
  components: {
    BatchSetup,
    APIExampleDialog,
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

      let apiRes = await this.T.callAPI_get('/api/v1/batches/do/list', {
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
          if (!await this.T.confirm(this.$t('Are you sure you want to disable the Batch?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Batch?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/batches/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: true } },
            alert : { okMessage: this.$t('Batch disabled') },
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/batches/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: false } },
            alert : { okMessage: this.$t('Batch enabled') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/batches/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Batch deleted') },
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
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.funcId);
      if (!apiRes || !apiRes.ok) return;

      // 生成API请求示例
      let apiURL = this.T.formatURL('/api/v1/bat/:id', {
        baseURL: true,
        params : { id: d.id },
      });

      let funcCallKwargsJSON = {};
      for (let k in d.funcCallKwargsJSON) if (d.funcCallKwargsJSON.hasOwnProperty(k)) {
        if (this.common.isFuncArgumentPlaceholder(d.funcCallKwargsJSON[k])) {
          funcCallKwargsJSON[k] = d.funcCallKwargsJSON[k];
        }
      }
      let apiBody = { kwargs: funcCallKwargsJSON };
      let funcKwargs = apiRes.data.kwargsJSON;

      this.$refs.apiExampleDialog.update(apiURL, apiBody, funcKwargs);

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
    this.$root.$on('reload.batchList', () => this.loadData({ skipStatistic: true }));
  },
  destroyed() {
    this.$root.$off('reload.batchList');
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
