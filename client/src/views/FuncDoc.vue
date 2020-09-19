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
              <strong class="func-title">{{ scope.row.title || scope.row.name }}</strong>

              <br>
              <el-tag type="info" size="mini"><code>def</code></el-tag>
              <code class="text-main text-small">{{ `${scope.row.id}(${T.isNothing(scope.row.kwargsJSON) ? '' : '...'})` }}</code>

              <br>
              <span class="text-info">&#12288;调用参数:</span>
              <div class="func-kwargs-area">
                <span v-if="T.isNothing(scope.row.kwargsJSON)" class="text-info">无参数</span>
                <template v-else>
                  <div class="func-kwargs-block" v-for="(value, name, index) in scope.row.kwargsJSON">
                    <code class="func-kwargs-name">{{ name }}</code>
                    <code class="func-kwargs-equal">:</code>
                    <code class="func-kwargs-value" v-if="!value || !value.default">必选</code>
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
                    <code v-if="C.FUNC_CATEGORY_MAP[scope.row.category]">{{ C.FUNC_CATEGORY_MAP[scope.row.category].name }}</code>
                    <code v-else>{{ scope.row.category }}</code>
                  </el-tag>
                </template>

                <template v-if="!T.isNothing(scope.row.integration)">
                  <span class="text-info">&#12288;集成:</span>
                  <el-tag size="mini" type="success">
                    <code v-if="C.FUNC_INTEGRATION_MAP[scope.row.integration]">{{ C.FUNC_INTEGRATION_MAP[scope.row.integration].name }}</code>
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
              <pre class="func-doc">{{ scope.row.description }}</pre>
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
        description="通过内部接口直接调用函数仅支持POST方式"
        :showModeOption="true"
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
      let apiRes = await this.T.callAPI('/api/v1/func-list', {
        alert: {entity: '函数列表', showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    showAPI(d) {
      let apiURLExample = this.T.formatURL('/api/v1/func/:funcId', {
        baseURL: this.$store.getters.CONFIG('WEB_BASE_URL'),
        params : {funcId: d.id},
      });

      let kwargsJSON = {};
      for (let k in d.kwargsJSON) if (d.kwargsJSON.hasOwnProperty(k)) {
        kwargsJSON[k] = `<${k.toUpperCase()}>`;
      }
      let apiBodyExample = {kwargs: kwargsJSON};

      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample);
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
