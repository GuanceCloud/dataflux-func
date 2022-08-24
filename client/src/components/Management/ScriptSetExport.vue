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
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item label="脚本集" prop="scriptSetIds">
                  <el-select v-model="form.scriptSetIds" multiple filterable placeholder="请选择">
                    <el-option
                      v-for="item in scriptSets"
                      :key="item.id"
                      :label="T.getSearchText(item, ['id', 'title'])"
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
                  <el-select v-model="form.connectorIds" multiple filterable placeholder="请选择">
                    <el-option
                      v-for="item in connectors"
                      :key="item.id"
                      :label="T.getSearchText(item, ['id', 'title'])"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                  <InfoBlock v-if="!T.isNothing(form.connectorIds)" type="warning" title="导出的连接器不包含密码等敏感信息，导入后需要重新输入这些内容"></InfoBlock>
                </el-form-item>

                <el-form-item label="环境变量" prop="envVariableIds">
                  <el-select v-model="form.envVariableIds" multiple filterable placeholder="请选择">
                    <el-option
                      v-for="item in envVariables"
                      :key="item.id"
                      :label="T.getSearchText(item, ['id', 'title'])"
                      :value="item.id">
                      <span class="select-item-name">{{ item.title || item.id }}</span>
                      <code class="select-item-id">ID: {{ item.id }}</code>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="启用密码">
                  <el-switch
                    :active-value="true"
                    :inactive-value="false"
                    v-model="isPasswordEnabled">
                  </el-switch>
                  <span v-if="isPasswordEnabled" class="text-main">&#12288;密码由系统自动生成，请注意做好记录</span>
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

      <el-dialog
        title="脚本包已下载"
        :visible.sync="showPassword"
        :close-on-press-escape="false"
        :close-on-click-modal="false"
        width="750px">
        <span class="import-token-dialog-content">
          <template v-if="password">
            <span class="text-bad">请牢记以下密码</span>
            <br><span class="text-bad">导入脚本包时需要使用此密码才能正常导入</span>
            <br><code class="import-token">{{ password }}</code>
            <br><CopyButton title="复制导入令牌" :content="password"></CopyButton>
          </template>
          <template v-else>
            <span class="text-good">导出的脚本包无需密码</span>
            <br><span class="text-good">在后续导入本脚本包时，密码栏留空即可</span>
          </template>
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
      if (!apiRes.ok) return;

      this.scriptSets = apiRes.data;

      // 连接器
      apiRes = await this.T.callAPI_getAll('/api/v1/connectors/do/list', opt);
      if (!apiRes.ok) return;

      this.connectors = apiRes.data;

      // 环境变量
      apiRes = await this.T.callAPI_getAll('/api/v1/env-variables/do/list', opt);
      if (!apiRes.ok) return;

      this.envVariables = apiRes.data;

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

      // 自动生成密码
      let password = null
      if (this.isPasswordEnabled === true) {
        let _range = this.$store.getters.CONFIG('_FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST');
        let _minLength = parseInt(_range[0]);
        let _maxLength = parseInt(_range[1]);
        [_minLength, _maxLength] = [_minLength, _maxLength].sort();

        let _length = _minLength + parseInt(Math.random() * (_maxLength - _minLength));
        password = this.T.genRandString(_length);
      }

      opt.body.password = password;

      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/export', opt);
      if (!apiRes.ok) return;

      let blob = new Blob([apiRes.data], {type: apiRes.extra.contentType});

      // 文件名为固定开头+时间
      let fileNameParts = [
        this.$store.getters.CONFIG('_FUNC_PKG_EXPORT_FILENAME'),
        this.M().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
      ];
      let fileName = fileNameParts.join('-') + this.$store.getters.CONFIG('_FUNC_PKG_EXPORT_EXT');
      FileSaver.saveAs(blob, fileName);

      this.password     = password;
      this.showPassword = true;
    },
    goToHistory() {
      this.$router.push({
        name: 'script-set-export-history-list',
      });
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

      showPassword: false,

      password         : null,
      isPasswordEnabled: false,

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
  padding-left: 30px;
  font-size: 12px;
}
</style>
