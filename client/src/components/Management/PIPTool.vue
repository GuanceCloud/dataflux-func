<i18n locale="zh-CN" lang="yaml">
Loading           : 加载中
PIP Tool          : PIP工具
Mirror            : 镜像源
Install Package   : 安装包
Installed Packages: 已安装的包
Package           : 包
Version           : 版本
Built-in          : 内置
Installed         : 已安装
Exactly match     : 完全匹配
Install           : 安装
Installing        : 正在安装

'Package installed: {pkg}': 包已安装：{pkg}
{Any container ID}: 任意一个容器ID

Cannot reinstall a packages built-in                    : 无法重复安装已内置的包
'You can also install the package by following command:': 您也可以使用也以下命令来安装：
Previous installing may still running                   : 之前的安装似乎仍然在运行
Are you sure you want to install the package now?       : 是否确定现在就安装？

Douban mirror             : 豆瓣镜像
Tsinghua University mirror: 清华大学镜像
USTC mirror               : 中国科学技术大学镜像
Alibaba Cloud mirror      : 阿里云镜像
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

        <el-select
          style="width: 235px"
          v-model="pypiMirror">
          <el-option :label="$t('Alibaba Cloud mirror')"       value="https://mirrors.aliyun.com/pypi/simple/"></el-option>
          <el-option :label="$t('Douban mirror')"              value="https://pypi.douban.com/simple/"></el-option>
          <el-option :label="$t('Tsinghua University mirror')" value="https://pypi.tuna.tsinghua.edu.cn/simple/"></el-option>
          <el-option :label="$t('USTC mirror')"                value="https://pypi.mirrors.ustc.edu.cn/simple/"></el-option>
          <el-option :label="$t('Official')" value=""></el-option>
        </el-select>
        <el-input placeholder="package or package==1.0.0"
          style="width: 500px"
          v-model="packageToInstall">
        </el-input>
        <el-button type="primary" @click="installPackage" :disabled="!isInstallable || isInstalling">
          <span v-if="isInstalling">
            <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
            {{ $t('Installing') }}
          </span>
          <span v-else>{{ $t('Install') }}</span>
        </el-button>

        <p class="pip-install-tips">
          <template v-if="installedPackageMap[packageToInstall] && installedPackageMap[packageToInstall].isBuiltin">
            <span class="text-bad">{{ $t('Cannot reinstall a packages built-in') }}</span>
          </template>
          <template v-if="pipShell">
            {{ $t('You can also install the package by following command:') }}
            <br>
            &#12288;
            <code class="text-main">{{ pipShell }}</code>
            <CopyButton :content="pipShell"></CopyButton>
          </template>
        </p>

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
      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/installed');
      if (!apiRes.ok) return;

      this.installedPackages = apiRes.data;
      this.installedPackageMap = this.installedPackages.reduce((acc, x) => {
        acc[x.name] = x;
        return acc;
      }, {});

      this.$store.commit('updateLoadStatus', true);
    },
    async installPackage() {
      // 检查当前安装状态
      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/install-status');
      if (!apiRes.ok) return;

      if (apiRes.data && apiRes.data.status === 'RUNNING') {
        // 尚处于安装中
        if (!await this.T.confirm(`${this.$t('Previous installing may still running')}
              <hr class="br">${this.$t('Are you sure you want to install the package now?')}`)) return;
      }

      // 执行安装
      this.isInstalling = true;
      let pkgs = this.packageToInstall.split(/\s+/);
      let restPkgs = this.T.jsonCopy(pkgs);
      for (let pkg of pkgs) {
        apiRes = await this.T.callAPI('post', '/api/v1/python-packages/install', {
          body : {
            mirror: this.pypiMirror,
            pkg   : pkg,
          },
          alert: { okMessage: this.$t('Package installed: {pkg}', { pkg: pkg }) },
        });

        if (apiRes.ok) {
          restPkgs.splice(restPkgs.indexOf(pkg), 1);
        }
        this.packageToInstall = restPkgs.join(' ');
      }
      this.isInstalling = false;

      this.loadData();
    },
  },
  computed: {
    pipShell() {
      if (!this.isInstallable) return null;

      let containerId = this.$store.getters.CONFIG('_HOSTNAME') || this.$t('{Any container ID}');
      let targetOpt   = `-t ${this.$store.getters.CONFIG('_PIP_INSTALL_DIR')}`;
      let indexOpt    = this.pypiMirror ? `-i ${this.pypiMirror}` : '';

      let cmd = `sudo docker exec ${containerId} pip install ${targetOpt} ${indexOpt} ${this.packageToInstall}`;
      return cmd;
    },
    isInstallable() {
      // 检查空内容
      if (this.T.isNothing(this.packageToInstall)) {
        return false;
      }

      // 指定版本时，检查格式
      let parts = this.packageToInstall.split('==');
      if (parts.length > 2) {
        return false;
      }
      if (parts[0].indexOf('=') >= 0 || (parts.length > 1 && parts[1].indexOf('=') >= 0)) {
        return false;
      }

      // 检查重复安装已内置的包
      let pkg = parts[0];
      let installedPackage = this.installedPackageMap[pkg];
      if (installedPackage && installedPackage.isBuiltin) {
        return false;
      }

      return true;
    },
  },
  props: {
  },
  data() {
    return {
      pypiMirror      : '',
      packageToInstall: '',

      queriedPackageMap  : {},
      installedPackages  : [],
      installedPackageMap: {},

      isInstalling: false,
    }
  },
  mounted() {
    let pkgs = this.$route.query.pkgs;
    if (pkgs) {
      this.packageToInstall = this.T.fromBase64(pkgs);
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
.pip-install-tips {
  margin-left: 10px;
}
.pip-install-tips code {
  font-size: 14px;
}
</style>

<style>
</style>
