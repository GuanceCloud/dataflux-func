<i18n locale="en" lang="yaml">
installCost: (Cost {n} s)
</i18n>
<i18n locale="zh-CN" lang="yaml">
PIP Tool                         : PIP工具
Mirror                           : 镜像源
Install Python Package           : 安装 Python 包
Installed Python Packages        : 已安装的 Python 包
Package                          : 包
Version                          : 版本
Built-in                         : 内置
Exactly match                    : 完全匹配
Load Installed Python Packages   : 加载已安装的 Python 包列表
Loading Installed Python Packages: 正在加载已安装的 Python 包列表
Show Error                       : 显示错误信息
Reset Install Status             : 复位安装状态

'Package installed: {pkg}': 包已安装：{pkg}
{Any container ID}: 任意一个容器 ID

You can also install the package by following command: 您也可以使用以下命令来安装
Previous installing may still running                : 之前的安装似乎仍然在运行
Are you sure you want to install the package now?    : 是否确定现在就安装？

installCost: （耗时 {n} 秒）
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('PIP Tool') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-divider content-position="left"><h1>{{ $t('Install Python Package') }}</h1></el-divider>

        <el-select
          style="width: 235px"
          v-model="pypiMirror">
          <el-option v-for="mirror in C.PIP_MIRROR" :label="mirror.name" :key="mirror.key" :value="mirror.value"></el-option>
        </el-select>
        <el-input placeholder="package or package==1.2.3"
          style="width: 500px"
          v-model="packageToInstall">
        </el-input>
        <el-button type="primary" @click="installPackages" :disabled="!isInstallable">
          <span v-if="isInstalling">
            <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
            {{ $t('Installing') }}
          </span>
          <span v-else>{{ $t('Install') }}</span>
        </el-button>

        <p class="pip-install-tips">
          <template v-if="isInstallable">
            {{ $t('You can also install the package by following command') }}{{ $t(':') }}
            <br>
            <CopyButton :content="getPIPCommand()" tip-placement="left" />
            <code class="text-main" v-html="getPIPCommand({ pretty: true })"></code>
          </template>
        </p>

        <el-divider content-position="left"><h1>{{ $t('Installed Python Packages') }}</h1></el-divider>

        <el-button @click="loadInstalledPackages" :disabled="isLoadingInstalldPackages">
          <span v-if="isLoadingInstalldPackages">
            <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
            {{ $t('Loading Installed Python Packages') }}
          </span>
          <span v-else>{{ $t('Load Installed Python Packages') }}</span>
        </el-button>

        <el-table class="common-table" :data="installedPackages" v-if="installedPackages.length > 0">
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

      <el-dialog
        :visible.sync="showInstallStatus"
        width="650px">
        <template slot="title">
          {{ $t('Install Python Package') }}
          <span class="text-info press-esc-to-close-tip">{{ $t('Press ESC to close') }}</span>
        </template>
        <div class="installing-dialog-content">
          <div v-for="info in installStatus" class="install-list-item">
            <div>
              <span v-if="info.status === 'success'" class="text-good">
                <i class="fa fa-fw fa-check-circle"></i>
                <code>{{ info.package }}</code>
              </span>
              <span v-else-if="info.status === 'failure'" class="text-bad">
                <i class="fa fa-fw fa-times-circle"></i>
                <code>{{ info.package }}</code>
              </span>
              <span v-else-if="info.status === 'installing'" class="text-main">
                <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
                <code>{{ info.package }}</code>
              </span>
              <span v-else>
                <i class="fa fa-fw"></i>
                <code>{{ info.package }}</code>
              </span>

              <small class="text-info">
                <template v-if="info.startTimeMs && info.endTimeMs">
                  {{ $tc('installCost', ((info.endTimeMs - info.startTimeMs) / 1000).toFixed(2)) }}
                </template>
                <template v-if="info.startTimeMs && !info.endTimeMs">
                  {{ $tc('installCost', ((nowMs - info.startTimeMs) / 1000).toFixed(2)) }}
                </template>
              </small>
            </div>
            <div>
              <el-button type="text" v-if="info.error" @click="showError(info.error)">{{ $t('Show Error') }}</el-button>
            </div>
          </div>
        </div>
        <span slot="footer">
          <el-dropdown split-button v-if="isInstalling" @click="showInstallStatus = false" @command="clearInstallStatus">
            {{ $t('Close') }}
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>{{ $t('Reset Install Status') }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-else type="primary" @click="clearInstallStatus">{{ $t('Finish') }}</el-button>
        </span>
      </el-dialog>

      <LongTextDialog ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'PIPTool',
  components: {
    LongTextDialog,
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
    getPIPCommand(opt) {
      if (!this.isInstallable) return null;

      opt = opt || {};
      let containerId = this.$store.getters.CONFIG('_HOSTNAME') || this.$t('{Any container ID}');
      let targetOpt   = `-t ${this.$store.getters.CONFIG('_PIP_INSTALL_DIR')}`;
      let indexOpt    = this.pypiMirror ? `-i ${this.pypiMirror}` : '';

      let cmd = `sudo docker exec ${containerId} pip install ${targetOpt} ${indexOpt} `;
      if (opt.pretty) {
        cmd = `${cmd} \\<br>&#12288;&#12288;&#12288;${this.packageToInstall.trim().split(/\s+/).join(' \\<br>&#12288;&#12288;&#12288;')}`;
      } else {
        cmd = `${cmd} ${this.packageToInstall}`.trim();
      }

      return cmd;
    },
    async loadData() {
      this.pypiMirror = this.C.PIP_MIRROR_DEFAULT.value;

      await this.updateInstallStatus();

      this.$store.commit('updateLoadStatus', true);

      // 弹出当前安装状态
      setTimeout(() => {
        if (this.installStatus.length > 0) {
          this.showInstallStatus = true;
        }
      }, 500);
    },
    async loadInstalledPackages() {
      this.isLoadingInstalldPackages = true;
      this.installedPackages = [];

      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/installed/do/list');
      this.isLoadingInstalldPackages = false;

      if (!apiRes || !apiRes.ok) return;

      this.installedPackages = apiRes.data;
    },
    async installPackages() {
      // 正在安装时，弹出状态框
      if (this.isInstalling) {
        this.showInstallStatus = true;
        return;
      }

      // 正常启动安装
      let apiRes = await this.T.callAPI('post', '/api/v1/python-packages/do/install', {
        body: {
          mirror  : this.pypiMirror,
          packages: this.packageToInstall,
        },
      });
      if (!apiRes || !apiRes.ok) return;

      await this.updateInstallStatus();

      this.showInstallStatus = true;
    },
    async updateInstallStatus() {
      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/install-status/do/get');
      if (!apiRes || !apiRes.ok) return;

      this.installStatus = apiRes.data;
    },
    async clearInstallStatus() {
      let apiRes = await this.T.callAPI_get('/api/v1/python-packages/install-status/do/clear');
      if (!apiRes || !apiRes.ok) return;

      this.showInstallStatus = false;
      this.installStatus = [];
    },
    showError(error) {
      this.$refs.longTextDialog.update(error);
    },
  },
  computed: {
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
    isInstalling() {
      let notFinishedCount = this.installStatus.filter(x => {
        return x.status !== 'success' && x.status !== 'failure';
      }).length;

      return notFinishedCount > 0;
    },
  },
  props: {
  },
  data() {
    return {
      pypiMirror      : '',
      packageToInstall: '',

      showInstallStatus: false,
      nowMs            : Date.now(),
      installStatus    : [],
      installedPackages: [],

      isLoadingInstalldPackages: false,

      autoUpdateInstallStatusTimer: null,
      autoUpdateNowMsTimer        : null,
    }
  },
  mounted() {
    // 加载跳转时附带信息
    let requirements = this.$route.query.requirements;
    if (requirements) {
      this.packageToInstall = this.T.fromBase64(requirements);
    }

    // 定时更新安装状态
    this.autoUpdateInstallStatusTimer = setInterval(() => {
      this.updateInstallStatus();
    }, 3 * 1000);

    // 定时更新当前时间
    this.autoUpdateNowMsTimer = setInterval(() => {
      this.nowMs = Date.now();
    }, 1 * 500);
  },
  beforeDestroy() {
    if (this.autoUpdateInstallStatusTimer) clearInterval(this.autoUpdateInstallStatusTimer);
    if (this.autoUpdateNowMsTimer)         clearInterval(this.autoUpdateNowMsTimer);
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
.installing-dialog-content {
  display: flex;
  flex-direction: column;
  font-size: 18px;
}
.install-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}
.install-list-item code {
  margin-left: 15px;
}
.install-list-item .el-button--text {
  padding: 0;
}
</style>

<style>
</style>
