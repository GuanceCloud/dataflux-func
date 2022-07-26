<i18n locale="en" lang="yaml">
lastSucceeded : 'Succeeded {t}'
lastFailed    : 'Failed {t}'
lastRan       : 'Ran {t}'
successCount  : 'Success {n}'
failureCount  : 'Failure {n}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Config: 配置
Auth  : 认证
Recent: 近期调用

Batch disabled: 批处理已禁用
Batch enabled : 批处理已启用
Batch deleted : 批处理已删除

Check to show the contents created by outside systems: 勾选后展示由其他系统自动创建的内容
No Batch has ever been added: 从未添加过任何批处理
Batch only supports asynchronous calling: 批处理只支持异步调用

Are you sure you want to disable the Batch?: 是否确认禁用此批处理？
Are you sure you want to delete the Batch?: 是否确认删除此批处理？

lastSucceeded : '{t}调用成功'
lastFailed    : '{t}调用失败'
lastRan       : '{t}调用'
successCount  : '成功 {n}'
failureCount  : '失败 {n}'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Batch') }}</span>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-tooltip :content="$t('Check to show the contents created by outside systems')" placement="bottom" :enterable="false">
              <el-checkbox
                :border="true"
                size="small"
                v-model="dataFilter.origin"
                true-label="API,UI"
                false-label=""
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
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Batch has ever been added') }}</h1>

          <p class="no-data-tip">
            使用批处理，可以执行长耗时的函数
            <br>可运用于数据清洗、数据提取等应用场景
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Func')" min-width="420">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :name="scope.row.func_name"
                :kwargsJSON="scope.row.funcCallKwargsJSON"></FuncInfo>

              <div>
                <span class="text-info">&#12288;ID</span>
                <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>

                <template v-if="!T.isNothing(scope.row.tagsJSON) || !T.isNothing(scope.row.func_tagsJSON)">
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

          <el-table-column :label="$t('Config')" width="220">
            <template slot-scope="scope">
              <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
              <el-tooltip :content="scope.row.apia_name" :disabled="!!!scope.row.apia_name" placement="right">
                <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
              <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>

              <template v-if="scope.row.lastStartTime">
                <br>
                <span v-if="scope.row.lastStatus === 'success'" class="text-good">
                  <i class="fa fa-fw fa-check"></i> {{ $t('lastSucceeded', { t: T.fromNow(scope.row.lastStartTime) }) }}
                </span>
                <span v-else-if="scope.row.lastStatus === 'failure'" class="text-bad">
                  <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(scope.row.lastStartTime) }) }}
                </span>
                <span v-else class="text-main">
                  <i class="fa fa-fw fa-clock-o"></i> {{ $t('lastRan', { t: T.fromNow(scope.row.lastStartTime) }) }}
                </span>

                <br>
                <i class="fa fa-fw fa-pie-chart text-info"></i>
                <span :class="{ 'text-good': !!scope.row.recentSuccessCount }">{{ $t('successCount', { n: T.numberLimit(scope.row.recentSuccessCount) }) }}</span>
                / <span :class="{ 'text-bad': !!scope.row.recentFailureCount }">{{ $t('failureCount', { n: T.numberLimit(scope.row.recentFailureCount) }) }}</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column align="right" width="350">
            <template slot-scope="scope">
              <el-link @click="openTaskInfo(scope.row)" :disabled="!scope.row.taskInfoCount">
                {{ $t('Recent') }} <code v-if="scope.row.taskInfoCount">({{ T.numberLimit(scope.row.taskInfoCount) }})</code>
              </el-link>
              <el-link :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row)">
                {{ $t('Example') }}
              </el-link>

              <el-link :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" v-prevent-re-click @click="quickSubmitData(scope.row, 'enable')">{{ $t('Enable') }}</el-link>
              <el-link :disabled="T.isNothing(scope.row.func_id)" v-if="!scope.row.isDisabled" @click="quickSubmitData(scope.row, 'disable')">{{ $t('Disable') }}</el-link>

              <el-link :disabled="T.isNothing(scope.row.func_id)" @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>

              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo"></Pager>

      <APIExampleDialog ref="apiExampleDialog"
        :description="$t('Batch only supports asynchronous calling')"
        :showExecModeOption="false"
        :showPostExample="true"
        :showPostExampleSimplified="true"
        :showGetExample="true"
        :showGetExampleSimplified="true"></APIExampleDialog>
    </el-container>
  </transition>
</template>

<script>
import APIExampleDialog from '@/components/APIExampleDialog'

export default {
  name: 'BatchList',
  components: {
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
    async loadData() {
      // 默认过滤条件
      let _listQuery = this.dataFilter = this.T.createListQuery({
        _withTaskInfo: true,
      });
      if (this.T.isNothing(this.dataFilter.origin)) {
        _listQuery.origin = 'UI';
      }

      let apiRes = await this.T.callAPI_get('/api/v1/batches/do/list', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
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

      await this.loadData();
    },
    openSetup(d, target) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateTableList_scrollY');
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'batch-add',
            query: nextRouteQuery,
          });
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'batch-setup',
            params: {id: d.id},
            query : nextRouteQuery,
          });
          break;
      }
    },
    openTaskInfo(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      this.$router.push({
        name  : 'task-info-list',
        params: {id: d.id},
        query : nextRouteQuery,
      });
    },
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.funcId);
      if (!apiRes.ok) return;

      let funcKwargs = apiRes.data.kwargsJSON;

      // 生成API请求示例
      let apiURLExample = this.T.formatURL('/api/v1/bat/:id', {
        baseURL: true,
        params : {id: d.id},
      });

      let funcCallKwargsJSON = {};
      for (let k in d.funcCallKwargsJSON) if (d.funcCallKwargsJSON.hasOwnProperty(k)) {
        if (this.common.isFuncArgumentPlaceholder(d.funcCallKwargsJSON[k])) {
          funcCallKwargsJSON[k] = d.funcCallKwargsJSON[k];
        }
      }
      let apiBodyExample = { kwargs: funcCallKwargsJSON };

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample, funcKwargs);
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
        origin      : _dataFilter.origin,
      },
    }
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
