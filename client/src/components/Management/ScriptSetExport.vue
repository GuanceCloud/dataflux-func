<i18n locale="zh-CN" lang="yaml">
Data exported: 数据已导出
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ modeName }}脚本包</span>
          <div class="header-control">
            <el-button @click="goToHistory" size="small">
              <i class="fa fa-fw fa-history"></i>
              脚本包导出历史
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="export-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item label="脚本集" prop="scriptSetIds">
                  <el-select v-model="form.scriptSetIds" multiple filterable :filter-method="doScriptSetFilter" placeholder="请选择">
                    <el-option
                      v-for="item in selectScriptSetOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="脚本集关联数据">
                  <el-checkbox size="medium" border v-model="form.includeAuthLinks" label="授权链接"></el-checkbox>
                  <el-checkbox size="medium" border v-model="form.includeCrontabConfigs" label="自动触发配置"></el-checkbox>
                  <el-checkbox size="medium" border v-model="form.includeBatches" label="批处理"></el-checkbox>
                  <InfoBlock title="系统会自动查找导出脚本集相关的数据，并在导入时替换脚本集关联的所有数据"></InfoBlock>
                </el-form-item>

                <el-form-item label="连接器" prop="connectorIds">
                  <el-select v-model="form.connectorIds" multiple filterable :filter-method="doConnectorFilter" placeholder="请选择">
                    <el-option
                      v-for="item in selectConnectorOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                  <InfoBlock v-if="!T.isNothing(form.connectorIds)" type="warning" title="导出的连接器不包含密码等敏感信息，导入后需要重新输入这些内容"></InfoBlock>
                </el-form-item>

                <el-form-item label="环境变量" prop="envVariableIds">
                  <el-select v-model="form.envVariableIds" multiple filterable :filter-method="doEnvVariableFilter" placeholder="请选择">
                    <el-option
                      v-for="item in selectEnvVariableOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="备注" prop="note">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                  <InfoBlock title="有意义的备注可以为将来提供可靠的参考"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <div class="setup-right">
                    <el-button type="primary" v-prevent-re-click @click="submitData">{{ modeName }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import FileSaver from 'file-saver';

export default {
  name: 'ScriptSetExport',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.T.setupPageMode()) {
          case 'export':
            break;
        }
      },
    },
  },
  methods: {
    async loadData() {
      let opt = {
        query: { fields: ['id', 'title'] },
      };

      // 获取关联数据
      // 脚本集
      let apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', opt);
      if (!apiRes.ok) return;

      let scriptSets = apiRes.data;
      scriptSets.forEach(x => {
        this.T.appendSearchKeywords(x, ['id', 'title'])
      });

      this.scriptSets             = scriptSets;
      this.selectScriptSetOptions = scriptSets;

      // 连接器
      apiRes = await this.T.callAPI_getAll('/api/v1/connectors/do/list', opt);
      if (!apiRes.ok) return;

      let connectors = apiRes.data;
      connectors.forEach(x => {
        this.T.appendSearchKeywords(x, ['id', 'title'])
      });

      this.connectors             = connectors;
      this.selectConnectorOptions = connectors;

      // 环境变量
      apiRes = await this.T.callAPI_getAll('/api/v1/env-variables/do/list', opt);
      if (!apiRes.ok) return;

      let envVariables = apiRes.data;
      envVariables.forEach(x => {
        this.T.appendSearchKeywords(x, ['id', 'title'])
      });

      this.envVariables             = envVariables;
      this.selectEnvVariableOptions = envVariables;

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.setupPageMode()) {
        case 'export':
          return await this.exportData();
      }
    },
    async exportData() {
      let opt = {
        respType: 'blob',
        packResp: true,
        body    : this.T.jsonCopy(this.form),
        alert   : { okMessage: this.$t('Data exported') },
      };

      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/export', opt);
      if (!apiRes.ok) return;

      let blob = new Blob([apiRes.data], {type: apiRes.extra.contentType});

      // 文件名为固定开头+时间
      let fileNameParts = [
        this.$store.getters.CONFIG('_FUNC_EXPORT_FILENAME'),
        this.M().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
      ];
      let fileName = fileNameParts.join('-') + '.zip';
      FileSaver.saveAs(blob, fileName);
    },
    goToHistory() {
      this.$router.push({
        name: 'script-set-export-history-list',
      });
    },

    doScriptSetFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectScriptSetOptions = this.scriptSets;
      } else {
        this.selectScriptSetOptions = this.T.searchKeywords(q, this.scriptSets);
      }
    },
    doConnectorFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectConnectorOptions = this.connectors;
      } else {
        this.selectConnectorOptions = this.T.searchKeywords(q, this.connectors);
      }
    },
    doEnvVariableFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectEnvVariableOptions = this.envVariables;
      } else {
        this.selectEnvVariableOptions = this.T.searchKeywords(q, this.envVariables);
      }
    },
  },
  computed: {
    modeName() {
      const nameMap = {
        export: '导出',
      };
      return nameMap[this.T.setupPageMode()];
    },
  },
  props: {
  },
  data() {
    return {
      scriptSets  : [],
      connectors  : [],
      envVariables: [],

      selectScriptSetOptions  : [],
      selectConnectorOptions  : [],
      selectEnvVariableOptions: [],

      form: {
        note                 : '',
        scriptSetIds         : [],
        includeAuthLinks     : false,
        includeCrontabConfigs: false,
        includeBatches       : false,
        connectorIds         : [],
        envVariableIds       : [],
      },
      formRules: {
        scriptSetIds: [
          {
            trigger : 'change',
            message : '请选择导出脚本包',
            required: true,
            type    : 'array',
            min     : 1,
          },
        ],
        note: [
          {
            trigger : 'change',
            message : '请填写备注',
            required: true,
            min     : 1,
          },
        ],
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.export-form {
  width: 620px;
}
.import-token-dialog-content {
  text-align: center;
  display: block;
  font-size: 18px;
  line-height: 50px;
}
.import-token {
  font-size: 24px;
  display: inline-block;
  padding: 5px 20px;
  margin-top: 15px;
  letter-spacing: 5px;
  border: 5px dashed lightgrey;
}

.el-checkbox.is-bordered {
  margin-right : 5px !important;
  margin-left: 0 !important;
}

.select-item-name {
  float: left;
}
.select-item-id {
  float: right;
  margin-right: 15px;
  padding-left: 30px;
  font-size: 12px;
}
</style>
