<i18n locale="zh-CN" lang="yaml">
Loading                                    : 加载中
PIP Tool                                   : PIP工具
Install Package                            : 安装包
Please input package name to install       : 请输入要安装的包
Installed Packages                         : 已安装的包
Package                                    : 包
Version                                    : 版本
Built-in                                   : 已内置
Installed                                  : 已安装
Exactly match                              : 完全匹配
Install                                    : 安装
Installing                                 : 正在安装
Cannot reinstall a package that is built-in: 无法重复安装已内置的包
</i18n>

<template>
  <transition name="fade">
    <h1 class="loading" v-if="allPackages.length <= 0 || installedPackages.length <= 0">
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
              <span v-else-if="item.similar === 1">{{ $t('Exactly match') }}</span>
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
        <br>
        <el-row>
          <el-col>
            <span class="text-bad" v-if="installedPackageMap[packageToInstall] && installedPackageMap[packageToInstall].isBuiltin">
              {{ $t('Cannot reinstall a package that is built-in') }}
            </span>
          </el-col>
        </el-row>

        <el-divider content-position="left"><h1>{{ $t('Installed Packages') }}</h1></el-divider>

        <el-table :data="installedPackages" stripe style="width: 95%">
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
      let apiRes = null;

      // 缓存所有python包名
      apiRes = await this.T.callAPI('post', '/api/v1/do/proxy', {
        body : { method: 'get', url: 'https://mirrors.aliyun.com/pypi/web/simple/' },
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.allPackages = this.abstractPackageList(apiRes.data.body);
      this.allPackageMap = this.allPackages.reduce((acc, x) => {
        acc[x] = true;
        return acc;
      }, {});

      // 获取已安装的包
      apiRes = await this.T.callAPI('/api/v1/python-packages/installed', {
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
    abstractPackageList(pypiHTML) {
      const PREFIX_S = '<a href="';
      const START_S  = '/">';
      const END_S    = '</a>';

      let allPackages = [];
      pypiHTML.split('\n').forEach(line => {
        if (line.trim().indexOf(PREFIX_S) !== 0) return;

        let start = line.indexOf(START_S) + START_S.length;
        let end   = line.indexOf(END_S);
        let pkg   = line.slice(start, end);

        allPackages.push(pkg);
      });

      return allPackages;
    },
    queryPackages(query, callback) {
      let result = [];
      if (!this.T.isNothing(query)) {
        query = query.toLowerCase().split('=')[0];

        let matched = this.allPackages.reduce((acc, x) => {
          let pkg = {
            value  : x,
            similar: this.T.stringSimilar(query, x.toLowerCase()),
          }

          let installed = this.installedPackageMap[x];
          if (installed) {
            pkg.isInstalled = true;
            pkg.version     = installed.version;
            pkg.isBuiltin   = installed.isBuiltin;
          }

          acc.push(pkg);
          return acc;

        }, []).sort((a, b) => {
          return b.similar - a.similar;
        });

        result = matched.slice(0, 20);
      }

      callback(result);
    },
    async installPackage(pkg) {
      this.isInstalling = true;

      let apiRes = await this.T.callAPI('post', '/api/v1/python-packages/install', {
        body : { pkg: this.packageToInstall },
        alert: {title: this.$t('Install Package'), showError: true, showSuccess: true}
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
      if (!this.allPackageMap[pkg]) {
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

      allPackages  : [],
      allPackageMap: {},

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
