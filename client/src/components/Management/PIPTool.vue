<i18n locale="zh-CN" lang="yaml">
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

You can also install the package by following command: 您也可以使用以下命令来安装
Previous installing may still running                : 之前的安装似乎仍然在运行
Are you sure you want to install the package now?    : 是否确定现在就安装？
</i18n>

<template>
  <transition name="fade">
    <PageLoading v-if="!$store.state.isLoaded"></PageLoading>
    <el-container direction="vertical" v-show="$store.state.isLoaded">
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
          <el-option v-for="mirror in C.PIP_MIRROR" :label="mirror.name" :key="mirror.key" :value="mirror.value"></el-option>
        </el-select>
        <el-input placeholder="package or package==1.2.3"
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
          <template v-if="pipShell">
            {{ $t('You can also install the package by following command') }}{{ $t(':') }}
            <br>
            &#12288;
            <code class="text-main">{{ pipShell }}</code>
            <CopyButton :content="pipShell" />
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
    async loadData(options) {
      options = options || {};

      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/installed');
      if (!apiRes || !apiRes.ok) return;

      this.installedPackages = apiRes.data;
      if (!options.isReload) {
        this.pypiMirror = this.C.PIP_MIRROR_DEFAULT.value;
      }

      this.$store.commit('updateLoadStatus', true);
    },
    async installPackage() {
      // 检查当前安装状态
      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/install-status');
      if (!apiRes || !apiRes.ok) return;

      if (apiRes.data && apiRes.data.status === 'RUNNING') {
        // 尚处于安装中
        if (!await this.T.confirm(`${this.$t('Previous installing may still running')}
              <hr class="br">${this.$t('Are you sure you want to install the package now?')}`)) return;
      }

      // 执行安装
      this.isInstalling = true;
      let pkgs = this.packageToInstall.trim().split(/\s+/);
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

      this.loadData({ isReload: true });
    },
  },
  computed: {
    pipShell() {
      if (!this.isInstallable) return null;

      let containerId = this.$store.getters.CONFIG('_HOSTNAME') || this.$t('{Any container ID}');
      let targetOpt   = `-t ${this.$store.getters.CONFIG('_PIP_INSTALL_DIR')}`;
      let indexOpt    = this.pypiMirror ? `-i ${this.pypiMirror}` : '';

      let cmd = `sudo docker exec ${containerId} pip install ${targetOpt} ${indexOpt} ${this.packageToInstall.trim()}`;
      return cmd;
    },
    isInstallable() {
      // 检查空内容
      if (this.T.isNothing(this.packageToInstall)) {
        return false;
      }

      // 检查格式
      for (let pkg of this.packageToInstall.trim().split(/\s+/)) {
        // 指定版本时，检查格式
        let parts = pkg.split('==');
        if (parts.length > 2) {
          return false;
        }
        // 检查包名
        if (this.T.isNothing(parts[0])) {
          return false;
        }
        // 检查版本号
        if (parts.length > 1 && this.T.isNothing(parts[1])) {
          return false;
        }
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

      queriedPackageMap: {},
      installedPackages: [],

      isInstalling: false,
    }
  },
  mounted() {
    let requirements = this.$route.query.requirements;
    if (requirements) {
      this.packageToInstall = this.T.fromBase64(requirements);
    }
  },
}
</script>

<style scoped>
.pip-install-tips {
  margin-left: 10px;
}
.pip-install-tips code {
  font-size: 14px;
}
</style>

<style>
</style>
