<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          授权链接
          <div class="header-control">
            <el-switch v-model="showCountCost" inactive-text="常规信息" active-text="统计信息"></el-switch>
            &#12288;
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
            <el-tooltip content="勾选后展示由其他系统自动创建的内容" placement="bottom" :enterable="false">
              <el-checkbox
                :border="true"
                size="mini"
                v-model="dataFilter.origin"
                true-label="API,UI"
                false-label=""
                @change="T.changePageFilter(dataFilter)">显示隐藏项</el-checkbox>
            </el-tooltip>
            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              新建授权链接
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ k: 'origin', v: 'API,UI'})">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未创建过任何授权链接</h1>

          <p class="no-data-tip">
            出于安全性考虑，函数默认只能从内部网络访问
            <br>如需从外部访问，必须先为函数创建授权链接，通过授权链接访问函数
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="函数">
            <template slot-scope="scope">
              <template v-if="scope.row.func_id">
                <strong class="func-title">{{ scope.row.func_title || scope.row.func_name }}</strong>

                <br>
                <el-tag type="info" size="mini"><code>def</code></el-tag>
                <code class="text-main text-small">{{ `${scope.row.func_id}(${T.isNothing(scope.row.func_kwargsJSON) ? '' : '...'})` }}</code><GotoFuncButton :funcId="scope.row.func_id"></GotoFuncButton>

                <br>
                <span class="text-info">&#12288;调用参数:</span>
                <div class="func-kwargs-area">
                  <span v-if="T.isNothing(scope.row.funcCallKwargsJSON)" class="text-info">无参数</span>
                  <template v-else>
                    <div class="func-kwargs-block" v-for="(value, name, index) in scope.row.funcCallKwargsJSON">
                      <code class="func-kwargs-name">{{ name }}</code>
                      <code class="func-kwargs-equal">=</code>
                      <code class="func-kwargs-value" v-if="value === 'FROM_PARAMETER'">调用方指定</code>
                      <el-tooltip placement="top" v-else>
                        <pre class="func-kwargs-value" slot="content">{{ JSON.stringify(value, null, 2) }}</pre>
                        <code class="func-kwargs-value">固定值</code>
                      </el-tooltip>
                      <span v-if="index < T.jsonLength(scope.row.funcCallKwargsJSON) - 1">,&nbsp;</span>
                    </div>
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="text-bad">函数已不存在</div>
              </template>

              <span class="text-info">&#12288;授权链接ID:</span>
              <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
            </template>
          </el-table-column>

          <template v-if="!showCountCost">
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

            <el-table-column label="限流策略" width="150">
              <template slot-scope="scope">
                <span v-if="T.isNothing(scope.row.throttlingJSON)" class="text-good">无限制</span>
                <template v-else>
                  <template v-for="opt in C.AUTH_LINK_THROTTLING">
                    <span v-if="scope.row.throttlingJSON[opt.key]">{{ scope.row.throttlingJSON[opt.key] }} {{ opt.name }}<br></span>
                  </template>
                </template>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="120">
              <template slot-scope="scope">
                <span v-if="scope.row.isDisabled" class="text-bad">已禁用</span>
                <span v-else class="text-good">已启用</span>
                <br>
                <span v-if="scope.row.showInDoc" class="text-good">在文档中显示</span>
                <span v-else class="text-bad">在文档中隐藏</span>
              </template>
            </el-table-column>
          </template>

          <template v-else>
            <el-table-column label="近日调用" width="240">
              <template slot-scope="scope">
                <template v-for="d, index in scope.row.recentRunningCount.slice(0, 3)">
                  <code>{{ d.date }}:</code> <code class="count-cost-value">{{ d.count }}</code> 次<br>
                </template>
              </template>
            </el-table-column>

            <el-table-column label="近期响应速度" width="200">
              <template slot-scope="scope">
                <span v-if="scope.row.recentRunningCost.samples <= 0" class="text-info">暂无信息</span>
                <template v-else>
                  <code>MIN:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.min }}</code> 毫秒<br>
                  <code>MAX:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.max }}</code> 毫秒<br>
                  <code>AVG:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.avg }}</code> 毫秒<br>
                  <code>MID:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.mid }}</code> 毫秒<br>
                </template>
              </template>
            </el-table-column>

            <el-table-column label="近期响应速度分布" width="200">
              <template slot-scope="scope">
                <span v-if="scope.row.recentRunningCost.samples <= 0" class="text-info">暂无信息</span>
                <template v-else>
                  <code>P75:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.p75 }}</code> 毫秒<br>
                  <code>P95:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.p95 }}</code> 毫秒<br>
                  <code>P99:</code> <code class="count-cost-value">{{ scope.row.recentRunningCost.p99 }}</code> 毫秒<br>
                </template>
              </template>
            </el-table-column>
          </template>

          <el-table-column label="备注" width="150">
            <template slot-scope="scope">
              <span v-if="scope.row.note" class="text-info text-small">{{ scope.row.note }}</span>
              <span v-else class="text-info">{{ '<无备注>' }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <el-button :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row)" type="text" size="small">API调用示例</el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text" size="small">启用</el-button>
              <el-button :disabled="T.isNothing(scope.row.func_id)" v-else @click="quickSubmitData(scope.row, 'disable')" type="text" size="small">禁用</el-button>

              <el-button :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.showInDoc" @click="quickSubmitData(scope.row, 'hide')" type="text" size="small">隐藏</el-button>
              <el-button :disabled="T.isNothing(scope.row.func_id)" v-else @click="quickSubmitData(scope.row, 'show')" type="text" size="small">显示</el-button>

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

      <APIExampleDialog ref="apiExampleDialog"
        description="授权链接同时支持POST方式和GET方式进行调用，可根据需要任意选择"
        :showPostExample="true"
        :showGetExample="true"
        :showGetExampleFlattened="true"
        :showGetExampleSimplified="true"></APIExampleDialog>
    </el-container>
  </transition>
</template>

<script>
import FuzzySearchInput from '@/components/FuzzySearchInput'
import APIExampleDialog from '@/components/APIExampleDialog'

export default {
  name: 'AuthLinkList',
  components: {
    FuzzySearchInput,
    APIExampleDialog,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    isLoaded(val) {
      if (!val) return;

      setImmediate(() => {
        this.T.autoScrollTable(this.$store.state.AuthLinkList_scrollY);
      });
    },
  },
  methods: {
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      // 默认过滤条件
      let _listQuery = this.T.createListQuery();
      if (this.T.isNothing(this.dataFilter.origin)) {
        _listQuery.origin = 'UI';
      }

      let apiRes = await this.T.callAPI('/api/v1/auth-links/do/list', {
        query: _listQuery,
        alert: {entity: '授权链接', action: '获取', showError: true},
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
            await this.$confirm(`${operationName}授权链接可能导致依赖此链接的系统无法正常工作<hr class="br">是否确认${operationName}？`, `${operationName}授权链接`,  {
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
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: true}},
            alert : {entity: '授权链接', action: '禁用', showError: true},
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: false}},
            alert : {entity: '授权链接', action: '启用', showError: true},
          });
          break;

        case 'show':
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {showInDoc: true}},
            alert : {entity: '授权链接', action: '于文档展示', showError: true},
          });
          break;

        case 'hide':
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {showInDoc: false}},
            alert : {entity: '授权链接', action: '从文档隐藏', showError: true},
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/auth-links/:id/do/delete', {
            params: {id: d.id},
            alert : {entity: '授权链接', action: '删除', showError: true},
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateAuthLinkList_scrollY', this.T.getTableScrollY());
      switch(target) {
        case 'add':
          this.$router.push({
            name : 'auth-link-add',
            query: prevRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'auth-link-setup',
            params: {id: d.id},
            query : prevRouteQuery,
          })
          break;
      }
    },
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.funcId, {
        alert: {entity: '函数', showError: true},
      });
      if (!apiRes.ok) return;

      let funcKwargs = apiRes.data.kwargsJSON;

      // 生成API请求示例
      let apiURLExample = this.T.formatURL('/api/v1/al/:id', {
        baseURL: this.$store.getters.CONFIG('WEB_BASE_URL'),
        params : {id: d.id},
      });

      let funcCallKwargsJSON = {};
      for (let k in d.funcCallKwargsJSON) if (d.funcCallKwargsJSON.hasOwnProperty(k)) {
        if (d.funcCallKwargsJSON[k] === 'FROM_PARAMETER') {
          funcCallKwargsJSON[k] = d.funcCallKwargsJSON[k];
        }
      }
      let apiBodyExample = {kwargs: funcCallKwargsJSON};

      this.$store.commit('updateHighlightedTableDataId', d.id);
      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample, funcKwargs);
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
    isLoaded() {
      return this.$store.state.isLoaded;
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

      showCountCost: false,
    }
  },
}
</script>

<style scoped>
.func-title {
  font-size: 16px;
}
.func-kwargs-area {
  padding-left: 25px;
}
.func-kwargs-block {
  display: inline-block;
}
.func-kwargs-name {
  font-style: italic;
  color: #ff6600;
  font-weight: bold;
}
.func-kwargs-equal {
  color: red;
}
pre.func-kwargs-value {
  padding: 0;
  margin: 0;
}
code.count-cost-value {
  display: inline-block;
  width: 60px;
  text-align: right;
}
</style>

<style>
</style>
