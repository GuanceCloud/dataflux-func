<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          <Logo type="auto" style="margin: auto 10px -8px 5px;"></Logo>
          授权链接函数文档
          <small>可被外部调用的函数</small>
          <span class="text-info title-tip">本文档没有翻页，按 <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>F</kbd> 开始搜索</span>
        </h1>
      </el-header>

      <!-- 展示区 -->
      <el-main class="common-table-container">
        <el-table class="common-table" height="100%"
          :data="data">

          <el-table-column label="函数">
            <template slot-scope="scope">
              <template v-if="scope.row.funcId">
                <strong class="func-title">{{ scope.row.funcTitle || scope.row.funcName }}</strong>

                <br>
                <el-tag type="info" size="mini"><code>def</code></el-tag>
                <code class="text-main text-small">{{ `${scope.row.funcId}(${T.isNothing(scope.row.funcKwargsJSON) ? '' : '...'})` }}</code>

                <br>
                <span class="text-info">&#12288;授权链接ID:</span>
                <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
              </template>
              <template v-else>
                <div class="text-bad">函数已不存在</div>
              </template>

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

              <template v-if="!T.isNothing(scope.row.funcCategory) || !T.isNothing(scope.row.funcIntegration) || !T.isNothing(scope.row.funcTagsJSON)">
                <template v-if="!T.isNothing(scope.row.funcCategory)">
                  <span class="text-info">&#12288;分类:</span>
                  <el-tag size="mini">
                    <code>{{ scope.row.funcCategory }}</code>
                  </el-tag>
                </template>

                <template v-if="!T.isNothing(scope.row.funcIntegration)">
                  <span class="text-info">&#12288;集成:</span>
                  <el-tag size="mini">
                    <code v-if="C.FUNC_INTEGRATION_MAP[scope.row.funcIntegration]">{{ C.FUNC_INTEGRATION_MAP[scope.row.funcIntegration].name }}</code>
                    <code v-else>{{ scope.row.funcIntegration }}</code>
                  </el-tag>
                </template>

                <template v-if="!T.isNothing(scope.row.funcTagsJSON)">
                  <span class="text-info">&#12288;标签:</span>
                  <el-tag size="mini" type="info" v-for="t in scope.row.funcTagsJSON" :key="t">{{ t }}</el-tag>
                </template>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="函数文档">
            <template slot-scope="scope">
              <pre class="func-doc">{{ scope.row.funcDescription }}</pre>
            </template>
          </el-table-column>

          <el-table-column label="有效期至" width="160">
            <template slot-scope="scope">
              <span v-if="!scope.row.expireTime" class="text-good">永久有效</span>
              <template v-else>
                <span>{{ scope.row.expireTime | datetime }}</span>
                <br>
                <span class="text-info">（{{ scope.row.expireTime | fromNow }}）</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="限流策略" width="150">
            <template slot-scope="scope">
              <span v-if="T.isNothing(scope.row.throttlingJSON)" class="text-good">无限制</span>
              <template v-else>
                <span v-if="scope.row.throttlingJSON.bySecond">{{ scope.row.throttlingJSON.bySecond }}次/秒<br></span>
                <span v-if="scope.row.throttlingJSON.byMinute">{{ scope.row.throttlingJSON.byMinute }}次/分钟<br></span>
                <span v-if="scope.row.throttlingJSON.byHour">{{ scope.row.throttlingJSON.byHour }}次/小时<br></span>
                <span v-if="scope.row.throttlingJSON.byDay">{{ scope.row.throttlingJSON.byDay }}次/天<br></span>
                <span v-if="scope.row.throttlingJSON.byMonth">{{ scope.row.throttlingJSON.byMonth }}次/月<br></span>
                <span v-if="scope.row.throttlingJSON.byYear">{{ scope.row.throttlingJSON.byYear }}次/年<br></span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">已禁用</span>
              <span v-else class="text-good">已启用</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="100">
            <template slot-scope="scope">
              <el-button @click="showAPI(scope.row)" type="text" size="small">API调用示例</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

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
      let apiRes = await this.T.callAPI('/api/v1/auth-link-func-list', {
        alert: {entity: '授权链接函数列表', showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
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
.func-list {
  scroll-behavior: smooth;
  padding: 0 30px;
}
.title-tip {
  font-size: 14px;
  float: right;
}
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
</style>

<style>
</style>
