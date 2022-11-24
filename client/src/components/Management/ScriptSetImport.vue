<i18n locale="zh-CN" lang="yaml">
Data imported: 数据已导入

Imported Script Set requires 3rd party packages, do you want to open PIP tool now?: 导入的脚本集需要第三方包，是否现在前往PIP工具？
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
              脚本包导入历史
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px">
                <el-form-item label="导入脚本包" prop="upload">
                  <el-upload drag ref="upload" :class="uploadAreaBorderClass"
                    :limit="2"
                    :multiple="false"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".zip"
                    :http-request="handleUpload"
                    :on-change="onUploadFileChange">
                    <i class="fa" :class="uploadAreaIconClass"></i>
                    <div class="el-upload__text">{{ uploadAreaIconText }}</div>
                  </el-upload>
                  <InfoBlock type="warning" title="如脚本包附带导入连接器，密码等敏感信息需要重新输入"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <div class="setup-right">
                    <el-button type="primary" :disabled="disableUpload" @click="submitData">{{ modeName }}</el-button>
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
        title="即将导入"
        :visible.sync="showConfirm"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true"
        width="750px">
        <span class="import-info-dialog-content">
          <template v-if="importInfo && importInfo.diff">
            <template v-for="t in C.IMPORT_DATA_TYPE">
              <template v-if="!T.isNothing(importInfo.diff[t.key])">
                <el-divider content-position="left"><h3>{{ t.name }}</h3></el-divider>
                <el-table :data="importInfo.diff[t.key]"
                  :show-header="false">
                  <el-table-column width="180" align="center">
                    <template slot-scope="scope">
                      <strong :class="DIFF_TYPE_MAP[scope.row.diffType].class">
                        <i class="fa" :class="DIFF_TYPE_MAP[scope.row.diffType].icon"></i>
                        {{ $t(scope.row.diffType) }}
                      </strong>
                    </template>
                  </el-table-column>
                  <el-table-column>
                    <template slot-scope="scope">
                      <span>{{ scope.row[t.showField] || scope.row.id }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column>
                    <template slot-scope="scope">
                      <small>ID <code class="text-code">{{ scope.row.id }}</code></small>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </template>
          </template>

          <template v-if="importInfo && importInfo.note">
            <el-divider content-position="left"><h3>{{ $t('Note') }}</h3></el-divider>
            <pre class="import-note">{{ importInfo.note }}</pre>
          </template>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="showConfirm = false">取消</el-button>
          <el-button type="primary" v-prevent-re-click @click="confirmImport" :loading="isImporting">
            确认导入
          </el-button>
        </span>
      </el-dialog>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptSetImport',
  components: {
  },
  watch: {
    showConfirm(val) {
      if (val === false) {
        this.initFilePreview();
      }
    },
  },
  methods: {
    async submitData() {
      switch(this.T.setupPageMode()) {
        case 'import':
          return await this.$refs.upload.submit();
      }
    },
    async handleUpload(req) {
      let bodyData = new FormData();
      bodyData.append('checkOnly', true);
      bodyData.append('files', req.file);

      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/import', {
        body: bodyData,
      });
      if (!apiRes.ok) {
        return this.alertOnError(apiRes);
      }

      this.importInfo = apiRes.data;

      // 打开确认对话框
      this.showConfirm = true;
    },
    async confirmImport() {
      this.isImporting = true;
      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/confirm-import', {
        body : { confirmId: this.importInfo.confirmId },
        alert: { okMessage: this.$t('Data imported') },
      });
      this.isImporting = false;
      if (!apiRes.ok) {
        return this.alertOnError(apiRes);
      }

      if (this.T.isNothing(apiRes.data.requirements)) {
        this.goToHistory();

      } else {
        this.showConfirm = false;

        if (!await this.T.confirm(this.$t('Imported Script Set requires 3rd party packages, do you want to open PIP tool now?'))) {
          this.goToHistory();

        } else {
          let requirementsParts = [];
          for (let pkg in apiRes.data.requirements) {
            let ver = apiRes.data.requirements[pkg];
            requirementsParts.push(ver ? `${pkg}==${ver}` : pkg);
          };

          let requirementsLine = requirementsParts.join(' ');
          this.$router.push({
            name: 'pip-tool',
            query: { requirements: this.T.getBase64(requirementsLine) },
          });
        }
      }
    },
    alertOnError(apiRes) {
      if (apiRes.ok) return;

      this.initFilePreview();
    },
    initFilePreview() {
      this.$refs.upload.clearFiles();

      this.uploadAreaBorderClass = [];
      this.uploadAreaIconClass   = ['fa-cloud-upload'];
      this.uploadAreaIconText    = '将文件拖到此处，或点击此处上传';
    },
    showFilePreview(filename) {
      this.uploadAreaBorderClass = ['upload-area-active'];
      this.uploadAreaIconClass   = ['fa-cloud-upload', 'text-main'];
      this.uploadAreaIconText    = filename;
    },
    onUploadFileChange(file, fileList) {
      if (fileList.length > 1) fileList.splice(0, 1);

      this.disableUpload = (fileList.length <= 0);
      if (this.disableUpload) {
        this.initFilePreview();
      } else {
        this.showFilePreview(fileList[0].name);
      }
    },
    goToHistory() {
      this.$router.push({
        name: 'script-set-import-history-list',
      });
    },
  },
  computed: {
    DIFF_TYPE_MAP() {
      return {
        add: {
          icon : 'fa-plus',
          class: 'text-good',
        },
        replace: {
          icon : 'fa-refresh',
          class: 'text-bad',
        }
      }
    },
    modeName() {
      const nameMap = {
        import: '导入',
      };
      return nameMap[this.T.setupPageMode()];
    },
  },
  props: {
  },
  data() {
    return {
      scriptSetMap: {},

      uploadAreaBorderClass: [],
      uploadAreaIconClass  : ['fa-cloud-upload'],
      uploadAreaIconText   : '将文件拖到此处，或点击此处上传',

      disableUpload: true,
      showConfirm  : false,
      isImporting  : false,

      importInfo: {},
    }
  },
  created() {
    this.$store.commit('updateLoadStatus', true);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.el-upload-dragger.upload-area-active {
  border-color: #FF6600 !important;
}
</style>
<style scoped>
.import-note {
  margin: 0;
  padding: 0;
  line-height: 1.5;
  font-size: 16px;
  padding-left: 20px;
}
</style>
