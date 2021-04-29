<i18n locale="zh-CN" lang="yaml">
Loading                                          : 加载中
PIP Tool                                         : PIP工具
Install Package                                  : 安装包
Please input package name to install             : 请输入要安装的包
'Current PyPi repository:'                       : 当前 PyPi 仓库
Installed Packages                               : 已安装的包
Package                                          : 包
Version                                          : 版本
Built-in                                         : 已内置
Installed                                        : 已安装
Exactly match                                    : 完全匹配
Install                                          : 安装
Installing                                       : 正在安装
Cannot reinstall a packages built-in             : 无法重复安装已内置的包
Previous installing may still running            : 之前的安装似乎仍然在运行
Are you sure you want to install the package now?: 是否确定现在就安装？
</i18n>

<template>
  <transition name="fade">
    <h1 class="loading" v-if="installedPackages.length <= 0">
      <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
      {{ $t('Loading') }}
    </h1>

    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('PIP Tool') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-divider content-position="left"><h1>{{ $t('Install Package') }}</h1></el-divider>

        <el-autocomplete :placeholder="$t('Please input package name to install')"
          style="width: 500px"
          v-model.trim="packageToInstall"
          :fetch-suggestions="queryPackages">
          <template slot-scope="{ item }">
            <span class="package-option-name">{{ item.value }}</span>
            <span class="package-option-info">
              <span v-if="item.isBuiltin">{{ $t('Built-in') }} {{ item.version }}</span>
              <span v-else-if="item.isInstalled">{{ $t('Installed') }} {{ item.version }}</span>
              <span v-else-if="item.value === packageToInstall">{{ $t('Exactly match') }}</span>
            </span>
          </template>
        </el-autocomplete>
        <el-button type="primary" @click="installPackage" :disabled="!isInstallable || isInstalling">
          <span v-if="isInstalling">
            <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
            {{ $t('Installing') }}
          </span>
          <span v-else>{{ $t('Install') }}</span>
        </el-button>

        <span class="text-bad" v-if="installedPackageMap[packageToInstall] && installedPackageMap[packageToInstall].isBuiltin">
          &#12288;
          {{ $t('Cannot reinstall a packages built-in') }}
        </span>

        <p class="text-info text-small">{{ `${$t('Current PyPi repository:')} ${$store.getters.CONFIG('PYPI_MIRROR') || $t('Official')}` }}</p>

        <el-divider content-position="left"><h1>{{ $t('Installed Packages') }}</h1></el-divider>

        <el-table class="common-table" :data="installedPackages">
          <el-table-column :label="$t('Package')" sortable sort-by="name">
            <template slot-scope="scope">
              <code>{{ scope.row.name }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Version')">
            <template slot-scope="scope">
              <code>{{ scope.row.version }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Built-in')" align="center" sortable sort-by="isBuiltin" width="100">
            <template slot-scope="scope">
              <span class="text-good" v-if="scope.row.isBuiltin">{{ $t('Yes') }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'PIPTool',
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
      let apiRes = await this.T.callAPI('/api/v1/python-packages/installed', {
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.installedPackages = apiRes.data;
      this.installedPackageMap = this.installedPackages.reduce((acc, x) => {
        acc[x.name] = x;
        return acc;
      }, {});

      this.$store.commit('updateLoadStatus', true);
    },
    async queryPackages(query, callback) {
      let result = [];
      if (!this.T.isNothing(query)) {
        query = query.toLowerCase().split('=')[0];

        let apiRes = await this.T.callAPI('/api/v1/python-packages/query', {
          query: { query: query },
          alert: { showError: true },
        });
        if (!apiRes.ok) return;

        apiRes.data.forEach(x => {
          let pkg = {
            value: x,
          }

          let installedPkg = this.installedPackageMap[x];
          if (installedPkg) {
            pkg.isInstalled = true;
            pkg.version     = installedPkg.version;
            pkg.isBuiltin   = installedPkg.isBuiltin;
          }

          result.push(pkg);
        })
      }

      this.queriedPackageMap = result.reduce((acc, x) => {
        acc[x.value] = true;
        return acc;
      }, {});

      callback(result);
    },
    async installPackage(pkg) {
      // 检查当前安装状态
      let apiRes = await this.T.callAPI('/api/v1/python-packages/install-status', {
        alert: {showError: true}
      });
      if (!apiRes.ok) return;

      if (apiRes.data && apiRes.data.status === 'RUNNING') {
        // 尚处于安装中
        try {
          await this.$confirm(`${this.$t('Previous installing may still running')}
            <br>${this.$t('Are you sure you want to install the package now?')}`, this.$t('Install Package'),  {
            dangerouslyUseHTMLString: true,
            confirmButtonText: this.$t('Install Package'),
            cancelButtonText: this.$t('Cancel'),
            type: 'warning',
          });

        } catch(err) {
          return; // 取消操作
        }
      }

      // 执行安装
      this.isInstalling = true;

      apiRes = await this.T.callAPI('post', '/api/v1/python-packages/install', {
        body : { pkg: this.packageToInstall },
        alert: { title: this.$t('Install Package'), showError: true, showSuccess: true }
      });

      this.isInstalling = false;

      if (!apiRes.ok) return;

      this.packageToInstall = '';
      this.loadData();
    },
  },
  computed: {
    isInstallable() {
      if (this.T.isNothing(this.packageToInstall)) {
        return false;
      }
      if (!this.packageToInstall.split('').pop().match(/\w/)) {
        return false;
      }

      let parts = this.packageToInstall.split('==');
      if (parts.length > 2) {
        return false;
      }
      if (parts[0].indexOf('=') >= 0 || (parts.length > 1 && parts[1].indexOf('=') >= 0)) {
        return false;
      }

      let pkg = parts[0];
      let installedPackage = this.installedPackageMap[pkg];
      if (installedPackage && installedPackage.isBuiltin) {
        return false;
      }
      if (!this.queriedPackageMap[this.packageToInstall]) {
        return false;
      }
      return true;
    },
  },
  props: {
  },
  data() {
    return {
      packageToInstall: '',

      queriedPackageMap  : {},
      installedPackages  : [],
      installedPackageMap: {},

      isInstalling: false,
    }
  },
}
</script>

<style scoped>
.loading {
  font-size: 40px;
  text-align: center;
  width: 100%;
  margin-top: 50px;
}
.package-option-name {
  float: left;
}
.package-option-info {
  float: right;
}
</style>

<style>
</style>
