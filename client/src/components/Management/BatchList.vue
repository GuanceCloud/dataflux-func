<i18n locale="zh-CN" lang="yaml">
API Auth: API认证
Tasks   : 任务

Batch disabled: 批处理已禁用
Batch enabled : 批处理已启用
Batch deleted : 批处理已删除

Search Batch(ID, tags, note), Func(ID, kwargs, title, description, tags): 搜索批处理（ID、标签、备注），函数（ID、参数、标题、描述、标签）
Check to show the contents created by outside systems: 勾选后展示由其他系统自动创建的内容
No Batch has ever been added: 从未添加过任何批处理
Batch only supports asynchronous calling: 批处理只支持异步调用

Are you sure you want to disable the Batch?: 是否确认禁用此批处理？
Are you sure you want to delete the Batch?: 是否确认删除此批处理？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Batch') }}
          <div class="header-control">
            <FuzzySearchInput
              :dataFilter="dataFilter"
              :searchTip="$t('Search Batch(ID, tags, note), Func(ID, kwargs, title, description, tags)')">
            </FuzzySearchInput>

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
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>{{ $t('No Batch has ever been added') }}</h1>

          <p class="no-data-tip">
            使用批处理，可以执行长耗时的函数
            <br>可运用于数据清洗、数据提取等应用场景
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

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
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('API Auth')" width="160">
            <template slot-scope="scope">
              <el-tooltip effect="dark" :content="scope.row.apia_name" :disabled="!!!scope.row.apia_name" placement="top">
                <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="160">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">{{ $t('Disabled') }}</span>
              <span v-else class="text-good">{{ $t('Enabled') }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Note')" width="160">
            <template slot-scope="scope">
              <span v-if="scope.row.note" class="text-info text-small">{{ scope.row.note }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="350">
            <template slot-scope="scope">
              <el-button :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row)" type="text">{{ $t('API Example') }}</el-button>

              <el-button @click="openTaskInfo(scope.row)"
                type="text"
                :disabled="!scope.row.taskInfoCount"
                >{{ $t('Tasks') }} <code v-if="scope.row.taskInfoCount">({{ scope.row.taskInfoCount > 99 ? '99+' : scope.row.taskInfoCount }})</code>
              </el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text">{{ $t('Enable') }}</el-button>
              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="!scope.row.isDisabled" @click="quickSubmitData(scope.row, 'disable')" type="text">{{ $t('Disable') }}</el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" @click="openSetup(scope.row, 'setup')" type="text">{{ $t('Setup') }}</el-button>

              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text">{{ $t('Delete') }}</el-button>
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

      setImmediate(() => {
        this.T.autoScrollTable(this.$store.state.BatchList_scrollY);
      });
    },
  },
  methods: {
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      // 默认过滤条件
      let _listQuery = this.T.createListQuery({ _withTaskInfoCount: true });
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
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateBatchList_scrollY', this.T.getTableScrollY());
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'batch-add',
            query: prevRouteQuery,
          });
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'batch-setup',
            params: {id: d.id},
            query : prevRouteQuery,
          });
          break;
      }
    },
    openTaskInfo(d) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateBatchList_scrollY', this.T.getTableScrollY());

      this.$router.push({
        name  : 'batch-task-info-list',
        params: {id: d.id},
        query : prevRouteQuery,
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
