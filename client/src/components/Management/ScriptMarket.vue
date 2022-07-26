<i18n locale="en" lang="yaml">
FoundPackagesCount: 'Package not Found | Found {n} package | Found {n} packages'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Script Market: 脚本市场

Install: 安装

Script Package Detail: 脚本包详情
Description          : 描述
Requirements         : 依赖

Are you sure you want to install the Script?         : 是否确认安装此脚本？
Script installed, new Script is in effect immediately: 脚本已安装，新脚本立即生效

The following Script Set IDs already exists, do you want to overwrite?             : 下列脚本集ID已经存在，是否覆盖？
Installed Script Set requires 3rd party packages, do you want to open PIP tool now?: 安装的脚本集需要第三方包，是否现在前往PIP工具
Unable to access the Script Market                                                 : 无法访问脚本市场
Please check if the system can access the Internet properly                        : 请确认系统是否可以正常访问公网

No Script Package has ever been published: 尚未发布任何脚本包
FoundPackagesCount: '找不到脚本包 | 共找到 {n} 个脚本包 | 共找到 {n} 个脚本包'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Market') }}</span>

          <div class="header-control" v-if="!T.isNothing(packageList)">
            <span class="text-main">{{ $tc('FoundPackagesCount', filteredPackageList.length) }}</span>
            &#12288;
            <el-input :placeholder="$t('Filter')"
              size="small"
              class="filter-input"
              v-model="filterTEXT">
              <i slot="prefix"
                class="el-input__icon el-icon-close text-main"
                v-if="filterTEXT"
                @click="filterTEXT = ''"></i>
            </el-input>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="!indexLoaded">
          <h1 class="no-data-title">
            <i class="fa fa-fw fa-chain-broken"></i>
            {{ $t('Unable to access the Script Market') }}
          </h1>
          <p class="no-data-tip">
            {{ $t('Please check if the system can access the Internet properly') }}
          </p>
        </div>

        <div class="no-data-area" v-else-if="T.isNothing(packageList)">
          <h1 class="no-data-title"><i class="fa fa-fw fa-inbox"></i>{{ $t('No Script Package has ever been published') }}</h1>
        </div>
        <a class="package-card-wrap" v-else
          v-for="p in filteredPackageList" :key="p.package"
          @click="openDetail(p)">
          <el-card class="package-card" shadow="hover">
            <i class="fa fa-fw fa-folder-open package-icon"></i>
            <div class="package-info">
              <span class="package-name">{{ p.name }}</span>
              <code class="package-id">ID: {{ p.package }}</code>
            </div>
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
      if (apiRes.ok) {
        this.packageList = apiRes.data;
        this.indexLoaded = true;
      }

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
        body : {
          packageInstallURL: detail.downloadURL,
          packageInstallId : detail.package,
        },
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
    filteredPackageList() {
      if (this.T.isNothing(this.filterTEXT)) return this.packageList;

      return this.packageList.filter(p => {
        return p.name.indexOf(this.filterTEXT) >= 0 || p.package.indexOf(this.filterTEXT) >= 0
      });
    },
  },
  props: {
  },
  data() {
    return {
      detail: {},

      filterTEXT : '',
      packageList: [],

      showDetail  : false,
      isInstalling: false,

      indexLoaded: false,
    }
  },
}
</script>

<style scoped>
.filter-input {
  width: 260px;
  display: inline-block;
}
.filter-input input {
  font-size: 14px;
}
.filter-input .el-icon-close {
  cursor: pointer;
  font-weight: bold;
}

.package-card-wrap {
  cursor: pointer;
}
.package-card {
  width: 100%;
  height: 100px;
  display: inline-block;
  margin-top: 15px;
  position: relative;
}
.package-icon {
  position: absolute;
  font-size: 150px;
  left: 5px;
  top: 0px;
  color: #f5f5f5;
  line-height: 150px;
}
.package-name {
  font-size: 20px;
  font-weight: bold;
  display: block;
  z-index: 1;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
}
.package-id {
  font-size: 16px;
  line-height: 2;
  display: block;
  z-index: 1;
}
.package-info {
  position: absolute;
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
