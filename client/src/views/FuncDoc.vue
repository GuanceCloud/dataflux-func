<i18n locale="zh-CN" lang="yaml">
Func Documents: 函数文档

Press {0} to search: 按 {0} 开始搜索
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          <Logo type="auto" width="200px" height="40px" class="doc-logo"></Logo>
          {{ $t('Func Documents') }}
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
                :id="scope.row.id"
                :title="scope.row.title"
                :definition="scope.row.definition" />

              <div>
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id" />
                <br>

                <template v-if="T.notNothing(scope.row.category)">
                  <span class="text-info">{{ $t('Category') }}</span>
                  &nbsp;<code class="text-main">{{ scope.row.category }}</code>
                  <br>
                </template>

                <template v-if="T.notNothing(scope.row.integration)">
                  <span class="text-info">{{ $t('Integration') }}</span>
                  &nbsp;
                  <code v-if="C.FUNC_INTEGRATION_MAP.get(scope.row.integration)">{{ C.FUNC_INTEGRATION_MAP.get(scope.row.integration).name }}</code>
                  <code v-else>{{ scope.row.integration }}</code>
                  <br>
                </template>

                <template v-if="T.notNothing(scope.row.tagsJSON)">
                  <span class="text-info">{{ $t('Tags') }}</span>
                  &nbsp;<el-tag size="mini" type="info" v-for="t in scope.row.tagsJSON" :key="t"><code>{{ t }}</code></el-tag>
                  <br>
                </template>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Document')">
            <template slot-scope="scope">
              <pre class="func-doc">{{ scope.row.description }}</pre>
            </template>
          </el-table-column>

          <el-table-column align="right" width="100">
            <template slot-scope="scope">
              <el-link @click="showAPI(scope.row)">{{ $t('Example') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <APIExampleDialog ref="apiExampleDialog"
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
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async showAPI(d) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.id);
      if (!apiRes || !apiRes.ok) return;

      // 生成API请求示例
      let apiURL = this.T.formatURL('/api/v1/func/:funcId', {
        baseURL: this.$store.getters.SYSTEM_INFO('WEB_INNER_BASE_URL'),
        params : {funcId: d.id},
      });

      let kwargsJSON = {};
      for (let k in d.kwargsJSON) if (d.kwargsJSON.hasOwnProperty(k)) {
        kwargsJSON[k] = this.$store.getters.SYSTEM_INFO('_FUNC_ARGUMENT_PLACEHOLDER_LIST')[0];
      }
      let apiBody = { kwargs: kwargsJSON };
      let funcKwargs = apiRes.data.kwargsJSON;

      this.$refs.apiExampleDialog.update(apiURL, apiBody, funcKwargs);
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
.doc-logo {
  display: inline-block;
  position: relative;
  top: 10px;
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
.func-doc {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: grey;
}
</style>

<style>
</style>
