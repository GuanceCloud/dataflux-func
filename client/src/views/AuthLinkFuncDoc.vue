<i18n locale="zh-CN" lang="yaml">
Config    : 配置
Auth      : 认证
Expires   : 过期
Throttling: 限流

Python functions that can be called externally: 可被外部调用的 Python 函数
Press {0} to search: 按 {0} 开始搜索

Auth Link only supports synchronous calling: 授权链接只支持同步调用
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          <Logo type="auto" width="200px" height="40px" class="doc-logo"></Logo>
          {{ $t('Auth Link Documents') }}
          &nbsp;
          <small>{{ $t('Python functions that can be called externally') }}</small>
          <span class="text-info title-tip">
            <i18n path="Press {0} to search">
              <span><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>F</kbd></span>
            </i18n>
          </span>
        </h1>
      </el-header>

      <!-- 展示区 -->
      <el-main class="common-table-container">
        <el-table class="common-table" height="100%"
          :data="data">

          <el-table-column :label="$t('Func')">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.funcId"
                :title="scope.row.funcTitle"
                :name="scope.row.funcName"
                :kwargsJSON="scope.row.funcCallKwargsJSON" />

              <div>
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id" />
                <br>

                <template v-if="T.notNothing(scope.row.funcCategory)">
                  <span class="text-info">{{ $t('Category') }}</span>
                  &nbsp;<code>{{ scope.row.funcCategory }}</code>
                  <br>
                </template>

                <template v-if="T.notNothing(scope.row.funcIntegration)">
                  <span class="text-info">{{ $t('Integration') }}</span>
                  &nbsp;
                  <code v-if="C.FUNC_INTEGRATION_MAP.get(scope.row.funcIntegration)">{{ C.FUNC_INTEGRATION_MAP.get(scope.row.funcIntegration).name }}</code>
                  <code v-else>{{ scope.row.funcIntegration }}</code>
                  <br>
                </template>

                <template v-if="T.notNothing(scope.row.tagsJSON)">
                  <span class="text-info">{{ $t('Tags') }}</span>
                  &nbsp;<el-tag size="mini" type="warning" v-for="t in scope.row.tagsJSON" :key="t">{{ t }}</el-tag>
                  <br>
                </template>

                <template v-if="T.notNothing(scope.row.funcTagsJSON)">
                  <span class="text-info">{{ $t('Func Tags') }}</span>
                  &nbsp;<el-tag size="mini" type="info" v-for="t in scope.row.funcTagsJSON" :key="t">{{ t }}</el-tag>
                  <br>
                </template>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Document')">
            <template slot-scope="scope">
              <pre class="func-doc">{{ scope.row.funcDescription }}</pre>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Config')" width="220">
            <template slot-scope="scope">
              <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
              <el-tooltip :content="scope.row.apiAuthName" :disabled="!!!scope.row.apiAuthName" placement="right">
                <span :class="{ 'text-main': !!scope.row.apiAuthId }">{{ C.API_AUTH_MAP.get(scope.row.apiAuthType).name }}</span>
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
            </template>
          </el-table-column>

          <el-table-column align="right" width="100">
            <template slot-scope="scope">
              <el-link :disabled="!!!scope.row.funcId" @click="showAPI(scope.row)">{{ $t('Example') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

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
  name: 'AuthLinkFuncDoc',
  components: {
    APIExampleDialog,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      },
    },
  },
  methods: {
    async loadData() {
      let apiRes = await this.T.callAPI_get('/api/v1/auth-link-func-list');
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
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

      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample, funcKwargs);
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      data: [],
    }
  },
}
</script>

<style scoped>
.doc-logo {
  display: inline-block;
  position: relative;
  top: 10px;
}
.func-list {
  /* scroll-behavior: smooth; */
  padding: 0 30px;
}
.title-tip {
  font-size: 14px;
  float: right;
}
</style>

<style>
</style>
