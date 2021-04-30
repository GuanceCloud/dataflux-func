<i18n locale="zh-CN" lang="yaml">
Crontab Config        : 自动触发配置
New Crontab Config    : 新建自动触发配置
Show hidden           : 显示隐藏项
Disable Crontab Config: 禁用自动触发配置
Enable Crontab Config : 启用自动触发配置
Delete Crontab Config : 删除自动触发配置

Search Crontab Config(ID, tags, note), Func(ID, kwargs, title, description, tags): 搜索自动触发配置（ID、标签、备注），函数（ID、参数、标题、描述、标签）
Check to show the contents created by outside systems                            : 勾选后展示由其他系统自动创建的内容
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Crontab Config') }}
          <div class="header-control">
            <FuzzySearchInput
              :dataFilter="dataFilter"
              :searchTip="$t('Search Crontab Config(ID, tags, note), Func(ID, kwargs, title, description, tags)')">
            </FuzzySearchInput>

            <el-tooltip :content="$t('Check to show the contents created by outside systems')" placement="bottom" :enterable="false">
              <el-checkbox
                :border="true"
                size="mini"
                v-model="dataFilter.origin"
                true-label="API,UI"
                false-label=""
                @change="T.changePageFilter(dataFilter)">{{ $t('Show hidden') }}</el-checkbox>
            </el-tooltip>
            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New Crontab Config') }}
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未创建过任何自动触发配置</h1>

          <p class="no-data-tip">
            使用自动触发配置，可以让函数定时执行
            <br>可灵活运用于数据检测、数据搜集、定时播报等应用场景
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="执行函数">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :name="scope.row.func_name"
                :kwargsJSON="scope.row.funcCallKwargsJSON"></FuncInfo>

              <div v-if="!T.isNothing(scope.row.tagsJSON) || !T.isNothing(scope.row.func_tagsJSON)">
                <span class="text-info">&#12288;标签:</span>
                <el-tag size="mini" type="info" v-for="t in scope.row.func_tagsJSON" :key="t">{{ t }}</el-tag>
                <el-tag size="mini" type="warning" v-for="t in scope.row.tagsJSON" :key="t">{{ t }}</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Crontab" width="160">
            <template slot-scope="scope">
              <template v-if="scope.row.func_extraConfigJSON && scope.row.func_extraConfigJSON.fixedCrontab">
                <code>{{ scope.row.func_extraConfigJSON.fixedCrontab }}</code>
                <el-tag size="mini">固定</el-tag>
              </template>
              <code v-else-if="scope.row.crontab">{{ scope.row.crontab }}</code>
              <span v-else class="text-bad">未配置<br><small>（函数不会启动）</small></span>
            </template>
          </el-table-column>

          <el-table-column label="有效期至" width="160">
            <template slot-scope="scope">
              <span v-if="!scope.row.expireTime" class="text-good">永久有效</span>
              <template v-else>
                <span :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'"
                >{{ scope.row.expireTime | datetime }}</span>
                <br>
                <span class="text-info">（{{ scope.row.expireTime | fromNow }}）</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">已禁用</span>
              <span v-else class="text-good">已启用</span>
            </template>
          </el-table-column>

          <el-table-column label="备注" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.note" class="text-info text-small">{{ scope.row.note }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <el-button @click="openTaskInfo(scope.row)"
                type="text"
                size="small"
                :disabled="!scope.row.taskInfoCount"
                >任务信息<code v-if="scope.row.taskInfoCount">({{ scope.row.taskInfoCount > 99 ? '99+' : scope.row.taskInfoCount }})</code>
              </el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text" size="small">启用</el-button>
              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="!scope.row.isDisabled" @click="quickSubmitData(scope.row, 'disable')" type="text" size="small">禁用</el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" @click="openSetup(scope.row, 'setup')" type="text" size="small">编辑</el-button>

              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <el-footer v-if="!T.isNothing(data)"
        class="paging-area" height="45px">
        <el-pagination
          background
          @size-change="T.changePageSize"
          @current-change="T.goToPageNumber"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :current-page="dataPageInfo.pageNumber"
          :page-size="dataPageInfo.pageSize"
          :page-count="dataPageInfo.pageCount"
          :total="dataPageInfo.totalCount">
        </el-pagination>
      </el-footer>
    </el-container>
  </transition>
</template>

<script>
import FuzzySearchInput from '@/components/FuzzySearchInput'
import FuncInfo from '@/components/FuncInfo'

export default {
  name: 'CrontabConfigList',
  components: {
    FuzzySearchInput,
    FuncInfo,
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
        this.T.autoScrollTable(this.$store.state.CrontabConfigList_scrollY);
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

      let apiRes = await this.T.callAPI('/api/v1/crontab-configs/do/list', {
        query: _listQuery,
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.dataPageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let operationName = this.OP_NAME_MAP[operation];

      try {
        switch(operation) {
          case 'delete':
          case 'disable':
            await this.$confirm(`${operationName}自动触发配置可能导致依赖此自动触发函数的系统无法正常工作<hr class="br">是否确认${operationName}？`, `${operationName}自动触发配置`,  {
              dangerouslyUseHTMLString: true,
              confirmButtonText: `确认${operationName}`,
              cancelButtonText: '取消',
              type: 'warning',
            });
            break;
        }

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = null;
      switch(operation) {
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: true}},
            alert : {title: this.$t('Disable Crontab Config'), showError: true},
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: false}},
            alert : {title: this.$t('Enable Crontab Config'), showError: true},
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/crontab-configs/:id/do/delete', {
            params: {id: d.id},
            alert : {title: this.$t('Delete Crontab Config'), showError: true},
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateCrontabConfigList_scrollY', this.T.getTableScrollY());
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'crontab-config-add',
            query: prevRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'crontab-config-setup',
            params: {id: d.id},
            query : prevRouteQuery,
          })
          break;
      }
    },
    openTaskInfo(d) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$store.commit('updateCrontabConfigList_scrollY', this.T.getTableScrollY());

      this.$router.push({
        name  : 'crontab-task-info-list',
        params: {id: d.id},
        query : prevRouteQuery,
      });
    },

  },
  computed: {
    OP_NAME_MAP() {
      return {
        disable: '禁用',
        enable : '启用',
        delete : '删除',
      };
    },
  },
  props: {
  },
  data() {
    let _dataFilter = this.T.createListQuery();

    return {
      data: [],
      dataPageInfo: {
        totalCount: 0,
        pageCount : 0,
        pageSize  : 20,
        pageNumber: 1,
      },

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
