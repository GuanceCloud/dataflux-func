<i18n locale="zh-CN" lang="yaml">
Related Contents: 关联内容
Exporting with related contents: 导出并附带关联内容
Exported Connectors will not include sensitive data (such as password), please re-entered them after import: 导出的连接器不包含敏感数据（如密码等），请在导入后重新输入
Meaningful notes can provide a reliable reference for the future: 有意义的备注可以为将来提供可靠的参考
Please select at least one Script Set: 请选择导出脚本集
Please input note: 请填写备注
Data exported: 数据已导出
'Exported content has been downloaded as a zip file:': '导出内容已作为 zip 文件下载：'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Set Exporting') }}</span>
          <div class="header-control">
            <el-button @click="goToHistory" size="small">
              <i class="fa fa-fw fa-history"></i>
              {{ $t('Script Set Exporting History') }}
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
                <el-form-item :label="$t('Script Set')" prop="scriptSetIds">
                  <el-select
                    v-model="form.scriptSetIds"
                    multiple
                    filterable
                    :filter-method="T.debounce(doScriptSetFilter)"
                    :placeholder="$t('Please select')">
                    <el-option
                      v-for="item in selectScriptSetOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id code-font">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Related Contents')">
                  <el-checkbox size="medium" border v-model="form.includeAuthLinks"      :label="$t('Auth Link')"></el-checkbox>
                  <el-checkbox size="medium" border v-model="form.includeCrontabConfigs" :label="$t('Crontab Config')"></el-checkbox>
                  <el-checkbox size="medium" border v-model="form.includeBatches"        :label="$t('Batch')"></el-checkbox>
                  <InfoBlock :title="$t('Exporting with related contents')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Connector')" prop="connectorIds">
                  <el-select
                    v-model="form.connectorIds"
                    multiple
                    filterable
                    :filter-method="T.debounce(doConnectorFilter)"
                    :placeholder="$t('Please select')">
                    <el-option
                      v-for="item in selectConnectorOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id code-font">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                  <InfoBlock v-if="T.notNothing(form.connectorIds)" type="warning" :title="$t('Exported Connectors will not include sensitive data (such as password), please re-entered them after import')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('ENV')" prop="envVariableIds">
                  <el-select
                    v-model="form.envVariableIds"
                    multiple
                    filterable
                    :filter-method="T.debounce(doEnvVariableFilter)"
                    :placeholder="$t('Please select')">
                    <el-option
                      v-for="item in selectEnvVariableOptions"
                      :key="item.id"
                      :label="item.title || item.id"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id code-font">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Note')" prop="note">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    v-model="form.note"></el-input>
                  <InfoBlock :title="$t('Meaningful notes can provide a reliable reference for the future')"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <div class="setup-right">
                    <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Export') }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>

      <el-dialog
        :title="$t('Data exported')"
        :visible.sync="showDownloadFilename"
        width="750px">
        <span class="download-filename-dialog-content">
          <span class="text-good">{{ $t('Data exported') }}</span>
          <br><span>{{ $t('Exported content has been downloaded as a zip file:') }}</span>
          <br><code class="download-filename">{{ downloadFilename }}</code>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="goToHistory">
            {{ $t('Very good') }}
          </el-button>
        </span>
      </el-dialog>
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
      if (!apiRes || !apiRes.ok) return;

      let scriptSets = apiRes.data;
      scriptSets.forEach(x => {
        this.T.appendSearchFields(x, ['id', 'title'])
      });

      this.scriptSets             = scriptSets;
      this.selectScriptSetOptions = scriptSets;

      // 连接器
      apiRes = await this.T.callAPI_getAll('/api/v1/connectors/do/list', opt);
      if (!apiRes || !apiRes.ok) return;

      let connectors = apiRes.data;
      connectors.forEach(x => {
        this.T.appendSearchFields(x, ['id', 'title'])
      });

      this.connectors             = connectors;
      this.selectConnectorOptions = connectors;

      // 环境变量
      apiRes = await this.T.callAPI_getAll('/api/v1/env-variables/do/list', opt);
      if (!apiRes || !apiRes.ok) return;

      let envVariables = apiRes.data;
      envVariables.forEach(x => {
        this.T.appendSearchFields(x, ['id', 'title'])
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
      if (!apiRes || !apiRes.ok) return;

      let blob = new Blob([apiRes.data], {type: apiRes.extra.contentType});

      // 文件名为固定开头+时间
      let fileNameParts = [
        this.$store.getters.CONFIG('_FUNC_EXPORT_FILENAME'),
        this.M().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
      ];
      let fileName = fileNameParts.join('-') + '.zip';
      FileSaver.saveAs(blob, fileName);

      this.downloadFilename     = fileName;
      this.showDownloadFilename = true;
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
  props: {
  },
  data() {
    return {
      showDownloadFilename: false,
      downloadFilename    : null,

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
            message : this.$t('Please select at least one Script Set'),
            required: true,
            type    : 'array',
            min     : 1,
          },
        ],
        note: [
          {
            trigger : 'change',
            message : this.$t('Please input note'),
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
.download-filename-dialog-content {
  text-align: center;
  display: block;
  font-size: 18px;
  line-height: 50px;
}
.download-filename {
  font-size: 20px;
  display: inline-block;
  padding: 5px 20px;
  margin-top: 15px;
  letter-spacing: 3px;
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
