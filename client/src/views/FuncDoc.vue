<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          <Logo type="auto" style="margin: auto 10px -8px 5px;"></Logo>
          函数文档
          <small>仅限内部调用的函数</small>
          <span class="text-info title-tip">本文档没有翻页，按 <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>F</kbd> 开始搜索</span>
        </h1>
      </el-header>

      <!-- 展示区 -->
      <el-main class="common-table-container">
        <el-table class="common-table" height="100%"
          :data="data">

          <el-table-column label="函数">
            <template slot-scope="scope">
              <FuncInfo
                :id="scope.row.id"
                :title="scope.row.title"
                :name="scope.row.name"
                :kwargsJSON="scope.row.kwargsJSON"></FuncInfo>

              <strong class="func-title">{{ scope.row.title || scope.row.name }}</strong>

              <br>
              <el-tag type="info" size="mini"><code>def</code></el-tag>
              <code class="text-main text-small">{{ `${scope.row.id}(${T.isNothing(scope.row.kwargsJSON) ? '' : '...'})` }}</code>
              <GotoFuncButton :funcId="scope.row.id"></GotoFuncButton>

              <br>
              <span class="text-info">&#12288;参数列表:</span>
              <div class="func-kwargs-area">
                <span v-if="T.isNothing(scope.row.kwargsJSON)" class="text-info">无参数</span>
                <template v-else>
                  <div class="func-kwargs-block" v-for="(value, name, index) in scope.row.kwargsJSON">
                    <code class="func-kwargs-name">{{ name }}</code>
                    <code class="func-kwargs-equal">:</code>
                    <code class="func-kwargs-value" v-if="name.indexOf('**') === 0">自定义</code>
                    <code class="func-kwargs-value" v-else-if="!value || !value.default">必选</code>
                    <el-tooltip placement="top" v-else>
                      <pre class="func-kwargs-value" slot="content">默认值为：{{ JSON.stringify(value.default, null, 2) }}</pre>
                      <code class="func-kwargs-value">可选</code>
                    </el-tooltip>
                    <span v-if="index < T.jsonLength(scope.row.kwargsJSON) - 1">,&nbsp;</span>
                  </div>
                </template>
              </div>

              <template v-if="!T.isNothing(scope.row.category) || !T.isNothing(scope.row.integration) || !T.isNothing(scope.row.tagsJSON)">
                <template v-if="!T.isNothing(scope.row.category)">
                  <span class="text-info">&#12288;分类:</span>
                  <el-tag size="mini">
                    <code>{{ scope.row.category }}</code>
                  </el-tag>
                </template>

                <template v-if="!T.isNothing(scope.row.integration)">
                  <span class="text-info">&#12288;集成:</span>
                  <el-tag size="mini" type="success">
                    <code v-if="C.FUNC_INTEGRATION_MAP.get(scope.row.integration)">{{ C.FUNC_INTEGRATION_MAP.get(scope.row.integration).name }}</code>
                    <code v-else>{{ scope.row.integration }}</code>
                  </el-tag>
                </template>

                <template v-if="!T.isNothing(scope.row.tagsJSON)">
                  <span class="text-info">&#12288;标签:</span>
                  <el-tag size="mini" type="info" v-for="t in scope.row.tagsJSON" :key="t"><code>{{ t }}</code></el-tag>
                </template>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="函数文档">
            <template slot-scope="scope">
              <pre class="func-doc">{{ T.limitLines(scope.row.description, 10) }}</pre>
            </template>
          </el-table-column>

          <el-table-column align="right" width="100">
            <template slot-scope="scope">
              <el-button @click="showAPI(scope.row)" type="text">API调用示例</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <APIExampleDialog ref="apiExampleDialog"
        description="直接调用函数仅支持使用POST方式通过内部接口调用，不允许公开调用"
        :descriptionClass="{'text-bad': true}"
        :showExecModeOption="true"
        :showSaveResultOption="true"
        :showAPITimeoutOption="true"
        :showPostExample="true"
        :showGetExample="false"></APIExampleDialog>
    </el-container>
  </transition>
</template>

<script>
import APIExampleDialog from '@/components/APIExampleDialog'

export default {
  name: 'FuncDoc',
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
      let apiRes = await this.T.callAPI_get('/api/v1/func-list');
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.id);
      if (!apiRes.ok) return;

      let funcKwargs = apiRes.data.kwargsJSON;

      // 生成API请求示例
      let apiURLExample = this.T.formatURL('/api/v1/func/:funcId', {
        baseURL: this.$store.getters.CONFIG('WEB_INNER_BASE_URL'),
        params : {funcId: d.id},
      });

      let kwargsJSON = {};
      for (let k in d.kwargsJSON) if (d.kwargsJSON.hasOwnProperty(k)) {
        kwargsJSON[k] = `<${k.toUpperCase()}>`;
      }
      let apiBodyExample = {kwargs: kwargsJSON};

      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample, funcKwargs);
    },
  },
  computed: {},
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
.func-doc {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: grey;
}
</style>

<style>
</style>
