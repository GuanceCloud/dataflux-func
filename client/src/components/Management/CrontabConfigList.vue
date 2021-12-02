<i18n locale="zh-CN" lang="yaml">
Fixed  : 固定
Not Set: 未配置
Config : 配置
Created: 创建时间
Expires: 有效期限
Never  : 长期有效
Tasks  : 任务
Run Now: 立即执行

Crontab Config disabled : 自动触发配置已禁用
Crontab Config enabled  : 自动触发配置已启用
Crontab Config deleted  : 自动触发配置已删除
Crontab Config Task sent: 自动触发配置任务已发送

Check to show the contents created by outside systems: 勾选后展示由其他系统自动创建的内容
No Crontab Config has ever been added: 从未添加过任何自动触发配置

Are you sure you want to disable the Crontab Config?: 是否确认禁用此自动触发配置？
Are you sure you want to delete the Crontab Config?: 是否确认删除此自动触发配置？
Are you sure you want to send a task of the Crontab Config?: 是否确认立刻发送此自动触发配置的任务？

Integration Func Tasks: 集成函数任务
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Crontab Config') }}
          <div class="header-control">
            <el-button type="text" @click="openTaskInfo({ id: 'cron-AUTORUN' })">{{ $t('Integration Func Tasks') }}</el-button>
            &#12288;

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
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>{{ $t('No Crontab Config has ever been added') }}</h1>

          <p class="no-data-tip">
            使用自动触发配置，可以让函数定时执行
            <br>可灵活运用于数据检测、数据搜集、定时播报等应用场景
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
                <code class="text-code">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>

                <template v-if="!T.isNothing(scope.row.tagsJSON) || !T.isNothing(scope.row.func_tagsJSON)">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Tags') }}</span>
                  <el-tag size="mini" type="info" v-for="t in scope.row.func_tagsJSON" :key="t">{{ t }}</el-tag>
                  <el-tag size="mini" type="warning" v-for="t in scope.row.tagsJSON" :key="t">{{ t }}</el-tag>
                </template>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Config')" width="240">
            <template slot-scope="scope">
              <span class="text-info">Crontab{{ $t(':') }}</span>
              <template v-if="scope.row.func_extraConfigJSON && scope.row.func_extraConfigJSON.fixedCrontab">
                <code class="text-code">{{ scope.row.func_extraConfigJSON.fixedCrontab }}</code>
                <el-tag size="mini">{{ $t('Fixed') }}</el-tag>
              </template>
              <code v-else-if="scope.row.crontab" class="text-code">{{ scope.row.crontab }}</code>
              <span v-else class="text-bad">{{ $t('Not Set') }}</span>

              <br>
              <span class="text-info">{{ $t('Created') }}{{ $t(':') }}</span>
              <RelativeDateTime :datetime="scope.row.createTime"></RelativeDateTime>

              <br>
              <span class="text-info">{{ $t('Expires') }}{{ $t(':') }}</span>
              <span v-if="!scope.row.expireTime" class="text-good">{{ $t('Never') }}</span>
              <template v-else>
                <RelativeDateTime :datetime="scope.row.expireTime"
                  :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'"></RelativeDateTime>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="120">
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

          <el-table-column align="right" width="320">
            <template slot-scope="scope">
              <el-button @click="openTaskInfo(scope.row)"
                type="text"
                :disabled="!scope.row.taskInfoCount"
                >{{ $t('Tasks') }} <code v-if="scope.row.taskInfoCount">({{ T.numberLimit(scope.row.taskInfoCount) }})</code>
              </el-button>
              <el-button @click="runTask(scope.row)"
                type="text"
                :disabled="!scope.row.func_id">
                {{ $t('Run Now') }}
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
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'CrontabConfigList',
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
      // 默认过滤条件
      let _listQuery = this.T.createListQuery({
        _withTaskInfoCount: true,
      });
      if (this.T.isNothing(this.dataFilter.origin)) {
        _listQuery.origin = 'UI';
      }

      let apiRes = await this.T.callAPI_get('/api/v1/crontab-configs/do/list', {
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

      await this.loadData();
    },
    openSetup(d, target) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateTableList_scrollY');
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'crontab-config-add',
            query: nextRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'crontab-config-setup',
            params: {id: d.id},
            query : nextRouteQuery,
          })
          break;
      }
    },
    openTaskInfo(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateTableList_scrollY');

      this.$router.push({
        name  : 'crontab-task-info-list',
        params: {id: d.id},
        query : nextRouteQuery,
      });
    },
    async runTask(d) {
      if (!await this.T.confirm(this.$t('Are you sure you want to send a task of the Crontab Config?'))) return;

      let apiRes = await this.T.callAPI_get('/api/v1/cron/:id', {
        params: { id: d.id },
        alert : { okMessage: this.$t('Crontab Config Task sent') },
      });

      this.$store.commit('updateHighlightedTableDataId', d.id);
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
