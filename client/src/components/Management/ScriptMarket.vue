<i18n locale="zh-CN" lang="yaml">
Script Market: 脚本市场

Install: 安装

Script Package Detail: 脚本包详情
Description          : 描述
Requirements         : 依赖

Are you sure you want to install the Script?         : 是否确认安装此脚本？
Script installed, new Script is in effect immediately: 脚本已安装，新脚本立即生效

The following Script Set IDs already exists, do you want to overwrite?: 下列脚本集ID已经存在，是否覆盖？
Installed Script Set requires 3rd party packages, do you want to open PIP tool now?: 安装的脚本集需要第三方包，是否现在前往PIP工具
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Script Market') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <a class="package-card-wrap" @click="openDetail(p)" v-for="p in packageList" :key="p.package">
          <el-card class="package-card" shadow="hover">
            <i class="fa fa-fw fa-file-code-o package-icon"></i>
            <span class="package-name">{{ p.name }}</span>
            <code class="package-id">ID: {{ p.package }}</code>

            <div class="package-release-time">
              <span>{{ p.releaseTime | datetime }}</span>
              <br>
              <span class="text-info">{{ p.releaseTime | fromNow }}</span>
            </div>
          </el-card>
        </a>
      </el-main>

      <el-dialog :title="$t('Script Package Detail')" class="package-detail" :visible.sync="showDetail">
        <el-form label-width="100px">
          <el-form-item :label="$t('Name')">
            <el-input readonly :value="detail.name"></el-input>
          </el-form-item>
          <el-form-item label="ID">
            <el-input readonly :value="detail.package"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Description')" v-if="!T.isNothing(detail.description)">
            <el-input readonly
              type="textarea"
              resize="none"
              :autosize="true"
              :value="detail.description"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Requirements')" v-if="!T.isNothing(detail.requirements)">
            <el-input readonly
              type="textarea"
              resize="none"
              :autosize="true"
              :value="detail.requirements"></el-input>
          </el-form-item>
        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="showDetail = false">{{ $t('Cancel') }}</el-button>
          <el-button size="small" type="primary" @click="installPackage(detail)" :loading="isInstalling">{{ $t('Install') }}</el-button>
        </div>
      </el-dialog>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptMarket',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
  },
  methods: {
    async loadData() {
      let _query = null;
      if (!this.T.isNothing(null)) {
        // TODO: 支持更换脚本包索引目录
      }
      let apiRes = await this.T.callAPI_get('/api/v1/script-packages/index', {
        query: _query,
      });
      if (!apiRes.ok) return;

      this.packageList = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    openDetail(p) {
      this.detail     = p;
      this.showDetail = true;
    },
    async installPackage(detail) {
      // 检查重名脚本集
      let scriptIds = detail.scriptSets.reduce((acc, x) => {
        acc.push(x.id);
        return acc;
      }, []);

      let apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', {
        query: { id: scriptIds.join(','), fields: ['id'] },
      });
      if (!apiRes.ok) return;

      let duplicatedScriptSetIds = [];
      if (!this.T.isNothing(apiRes.data)) {
        duplicatedScriptSetIds = apiRes.data.reduce((acc, x) => {
          acc.push(x.id);
          return acc;
        }, []);

      };

      // 确认框
      if (duplicatedScriptSetIds.length > 0) {
        if (!await this.T.confirm(`${this.$t('The following Script Set IDs already exists, do you want to overwrite?')}<br>${duplicatedScriptSetIds.join('<br>')}`)) return;
      } else {
        if (!await this.T.confirm(this.$t('Are you sure you want to install the Script?'))) return;
      }

      // 执行安装
      this.isInstalling = true;
      apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/import', {
        body : { packageURL: detail.downloadURL },
        alert: { okMessage: this.$t('Script installed, new Script is in effect immediately') },
      });
      this.isInstalling = false;
      if (!apiRes.ok) {
        return this.alertOnError(apiRes);
      }

      this.showDetail = false;

      if (this.T.isNothing(apiRes.data.pkgs)) {
        // nope
      } else {
        if (await this.T.confirm(this.$t('Installed Script Set requires 3rd party packages, do you want to open PIP tool now?'))) {
          let pkgs = apiRes.data.pkgs.join(' ');
          this.$router.push({
            name: 'pip-tool',
            query: { pkgs: this.T.getBase64(pkgs) },
          });
        }
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      detail: {},

      packageList: [],

      showDetail  : false,
      isInstalling: false,
    }
  },
}
</script>

<style scoped>
.package-card-wrap {
  cursor: pointer;
}
.package-card {
  width: 360px;
  height: 150px;
  display: inline-block;
  margin: 10px 20px;
  position: relative;
}
.package-icon {
  position: absolute;
  font-size: 150px;
  right: -50px;
  top: 20px;
  color: #f5f5f5;
  line-height: 150px;
  z-index: 0;
}
.package-name {
  font-size: 28px;
  display: block;
  z-index: 1;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
}
.package-id {
  font-size: 16px;
  display: block;
  z-index: 1;
}
.package-release-time {
  position: absolute;
  right: 20px;
  bottom: 10px;
  text-align: right;
}
</style>

<style>
.package-detail > .el-dialog {
  width: 620px;
}
</style>
