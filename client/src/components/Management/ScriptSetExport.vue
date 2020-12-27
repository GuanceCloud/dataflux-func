<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}脚本包
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="export-form">
              <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
                <el-form-item label="选择脚本集" prop="scriptSetIds">
                  <el-transfer
                    :titles="['全选', '全选']"
                    :props="{key: 'id'}"
                    v-model="form.scriptSetIds"
                    :data="scriptSets">
                    <span slot-scope="{ option }">{{ option.title || option.id }}</span>
                  </el-transfer>
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
                    <el-button type="primary" @click="submitData">{{ modeName }}</el-button>
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
          <el-button @click="goBackToList">
            <i class="fa fa-fw fa-arrow-left"></i>
            返回至脚本包导出历史列表
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

        switch(this.mode) {
          case 'export':
            break;
        }
      },
    },
  },
  methods: {
    async loadData() {
      let opt = {
        query: {fieldPicking: ['id', 'title']},
        alert: {entity: '脚本集', showError: true},
      };

      // 获取关联数据
      let apiRes = await this.T.callAPI_allPage('/api/v1/script-sets/do/list', opt);
      if (!apiRes.ok) return;

      this.scriptSets = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.mode) {
        case 'export':
          return await this.exportData();
      }
    },
    async exportData() {
      let opt = {
        respType: 'blob',
        packResp: true,
        body    : this.T.jsonCopy(this.form),
        alert   : {entity: '脚本包', action: '导出', showError: true},
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
    goBackToList() {
      this.$router.push({
        name : 'script-set-export-history-list',
      });
    },
  },
  computed: {
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const nameMap = {
        export: '导出',
      };
      return nameMap[this.mode];
    },
  },
  props: {
  },
  data() {
    return {
      scriptSets: [],

      showPassword: false,

      password         : null,
      isPasswordEnabled: false,

      form: {
        scriptSetIds: [],
        note        : '',
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
  width: 600px;
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
</style>
