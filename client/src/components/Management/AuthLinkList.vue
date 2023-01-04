<i18n locale="en" lang="yaml">
lastSucceeded : 'Succeeded {t}'
lastFailed    : 'Failed {t}'
lastRan       : 'Ran {t}'
successCount  : 'Success {n}'
failureCount  : 'Failure {n}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Info           : 信息
Recent Response: 响应
Config         : 配置
Auth           : 认证
Expires        : 过期
Throttling     : 限流
Shown in doc   : 在文档中显示
Hidden in doc  : 在文档中隐藏
Recent         : 近期调用
Today          : 今天
'-1 Day'       : 昨天
'-2 Day'       : 前天
Times          : 次
Response       : 响应速度
No info        : 暂无信息
ms             : 毫秒
Percentage     : 比例
Result         : 执行结果
Success        : 成功执行
Cached         : 命中缓存
Func Error     : 函数报错
Func Timeout   : 函数超时
API Timeout    : 接口超时
Bad return     : 非法结果
Unknow Error   : 未知错误

Auth Link disabled: 授权链接已禁用
Auth Link enabled : 授权链接已启用
Auth Link deleted : 授权链接已删除

Show all contents: 展示全部内容
No Auth Link has ever been added: 从未添加过任何授权链接
Auth Link only supports synchronous calling: 授权链接只支持同步调用

Are you sure you want to disable the Auth Link?: 是否确认禁用此授权链接？
Are you sure you want to delete the Auth Link?: 是否确认删除此授权链接？

lastSucceeded : '{t}调用成功'
lastFailed    : '{t}调用失败'
lastRan       : '{t}调用'
successCount  : '成功 {n}'
failureCount  : '失败 {n}'

If you need to access the Python function from an external system,                                              : 如需要从外部系统访问 Python 函数，
you must first create an Auth Link for the Python function and access the Python function through the Auth Link.: 必须先为 Python 函数创建授权链接，通过授权链接访问 Python 函数
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Auth Link') }}</span>
          <div class="header-control">
            <el-switch
              v-model="showCountCost"
              :inactive-text="$t('Info')"
              :active-text="$t('Recent Response')">
            </el-switch>
            &#12288;

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
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Auth Link has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('If you need to access the Python function from an external system,') }}
            <br>{{ $t('you must first create an Auth Link for the Python function and access the Python function through the Auth Link.') }}
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

          <template v-if="!showCountCost">
            <el-table-column :label="$t('Config')" width="220">
              <template slot-scope="scope">
                <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
                <el-tooltip :content="scope.row.apia_name" :disabled="!!!scope.row.apia_name" placement="right">
                  <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
                </el-tooltip>

                <br>
                <span class="text-info">{{ $t('Expires') }}{{ $t(':') }}</span>
                <span v-if="!scope.row.expireTime">-</span>
                <template v-else>
                  <RelativeDateTime :datetime="scope.row.expireTime"
                    :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'" />
                </template>

                <br>
                <span class="text-info">{{ $t('Throttling') }}{{ $t(':') }}</span>
                <span v-if="T.isNothing(scope.row.throttlingJSON)">-</span>
                <el-tooltip v-else placement="right">
                  <div slot="content">
                    <template v-for="opt in C.AUTH_LINK_THROTTLING">
                      <span v-if="scope.row.throttlingJSON[opt.key]">{{ $tc(opt.name, scope.row.throttlingJSON[opt.key]) }}<br></span>
                    </template>
                  </div>
                  <span class="text-bad">{{ $t('ON') }}</span>
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

            <el-table-column align="right" width="380">
              <template slot-scope="scope">
                <el-link @click="openTaskInfo(scope.row)" :disabled="!scope.row.taskInfoCount">
                  {{ $t('Recent') }} <code v-if="scope.row.taskInfoCount">({{ T.numberLimit(scope.row.taskInfoCount) }})</code>
                </el-link>
                <el-link :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row)">{{ $t('Example') }}</el-link>

                <el-link :disabled="T.isNothing(scope.row.func_id)" v-if="scope.row.isDisabled" v-prevent-re-click @click="quickSubmitData(scope.row, 'enable')">{{ $t('Enable') }}</el-link>
                <el-link :disabled="T.isNothing(scope.row.func_id)" v-else @click="quickSubmitData(scope.row, 'disable')">{{ $t('Disable') }}</el-link>

                <el-link :disabled="T.isNothing(scope.row.func_id)" @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>

                <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
              </template>
            </el-table-column>
          </template>

          <template v-else>
            <el-table-column :label="$t('Recent')" align="right" width="200">
              <template slot-scope="scope">
                <template v-for="d, index in scope.row.recentRunningCount.slice(0, 3)">
                  <code>{{ [$t('Today'), $t('-1 Day'), $t('-2 Day')][index] }}:</code> <code class="count-cost-value">{{ d.count }}</code> {{ $t('Times') }}<br>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Response')" align="right" width="200">
              <template slot-scope="scope">
                <span v-if="scope.row.recentRunningCost.samples <= 0" class="text-info">{{ $t('No info') }}</span>
                <template v-else>
                  <code>MIN:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.min)">{{ scope.row.recentRunningCost.min }}</code> {{ $t('ms') }}<br>
                  <code>MAX:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.max)">{{ scope.row.recentRunningCost.max }}</code> {{ $t('ms') }}<br>
                  <code>AVG:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.avg)">{{ scope.row.recentRunningCost.avg }}</code> {{ $t('ms') }}<br>
                  <code>MID:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.mid)">{{ scope.row.recentRunningCost.mid }}</code> {{ $t('ms') }}<br>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Percentage')" align="right" width="200">
              <template slot-scope="scope">
                <span v-if="scope.row.recentRunningCost.samples <= 0" class="text-info">{{ $t('No info') }}</span>
                <template v-else>
                  <code>P75:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.p75)">{{ scope.row.recentRunningCost.p75 }}</code> {{ $t('ms') }}<br>
                  <code>P95:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.p95)">{{ scope.row.recentRunningCost.p95 }}</code> {{ $t('ms') }}<br>
                  <code>P99:</code> <code class="count-cost-value" :class="getCostClass(scope.row.recentRunningCost.p99)">{{ scope.row.recentRunningCost.p99 }}</code> {{ $t('ms') }}<br>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Result')" align="right" width="200">
              <template slot-scope="scope">
                <span v-if="scope.row.recentRunningStatus.total <= 0" class="text-info">{{ $t('No info') }}</span>
                <template v-else>
                  <template v-for="opt, k in RUNNING_STATUS_MAP">
                    <template v-if="scope.row.recentRunningStatus[k]">
                      <code>{{ opt.title }}:</code>
                      <code class="count-cost-value" :class="opt.class">{{ (scope.row.recentRunningStatus[k] / scope.row.recentRunningStatus.total * 100).toFixed(1) }}</code> %<br>
                    </template>
                  </template>
                </template>
              </template>
            </el-table-column>
          </template>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />

      <APIExampleDialog ref="apiExampleDialog"
        :description="$t('Auth Link only supports synchronous calling')"
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
  name: 'AuthLinkList',
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
      if (this.T.isNothing(this.$route.query)) {
        _listQuery.origin = 'user';
      }

      let apiRes = await this.T.callAPI_get('/api/v1/auth-links/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'disable':
          if (!await this.T.confirm(this.$t('Are you sure you want to disable the Auth Link?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Auth Link?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: true } },
            alert : { okMessage: this.$t('Auth Link disabled') },
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: false } },
            alert : { okMessage: this.$t('Auth Link enabled') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/auth-links/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Auth Link deleted') },
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
            name : 'auth-link-add',
            query: nextRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'auth-link-setup',
            params: { id: d.id },
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
        name  : 'task-info-list',
        params: { id: d.id },
        query : nextRouteQuery,
      });
    },
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.funcId);
      if (!apiRes || !apiRes.ok) return;

      let funcKwargs = apiRes.data.kwargsJSON;

      // 生成API请求示例
      let apiURLExample = this.T.formatURL('/api/v1/al/:id', {
        baseURL: true,
        params : { id: d.id },
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
    getCostClass(cost) {
      if (cost < 3000) {
        return 'text-good';
      } else if (cost < 10000) {
        return 'text-watch';
      } else {
        return 'text-bad';
      }
    },
  },
  computed: {
    RUNNING_STATUS_MAP() {
      return {
        OK: {
          title: this.$t('Success'),
          class: 'text-good',
        },
        cached: {
          title: this.$t('Cached'),
          class: 'text-good',
        },
        EFuncFailed: {
          title: this.$t('Func Error'),
          class: 'text-bad',
        },
        EFuncTimeout: {
          title: this.$t('Func Timeout'),
          class: 'text-bad',
        },
        EAPITimeout: {
          title: this.$t('API Timeout'),
          class: 'text-bad',
        },
        EFuncResultParsingFailed: {
          title: this.$t('Bad return'),
          class: 'text-bad',
        },
        UnknowError: {
          title: this.$t('Unknow Error'),
          class: 'text-bad',
        },
      }
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
code.count-cost-value {
  display: inline-block;
  width: 40px;
  text-align: right;
  border-bottom: 1px solid grey;
  line-height: 14px;
  font-size: 12px;
}
</style>

<style>
</style>
