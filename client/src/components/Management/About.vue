<i18n locale="zh-CN" lang="yaml">
About: 关于

'You are using {0} browser'          : 您正在使用 {0} 浏览器
'In this system:'                    : '在本系统中：'
'Monospaced font is from {0}'        : '等宽字体来自 {0}'
'Icons used are from {0}'            : '图标来自 {0}'
'Illustrations used are from {0}'    : '插图来自 {0}'
'Code Editor is powered by {0}'      : '代码编辑器基于 {0} 实现'
'Blueprint Canvans is powered by {0}': '蓝图画布基于 {0} 实现'

'New version {ver} is available, click here to go to the official website': '可以升级到 {ver} 版本，点击此处前往官方网站查看'

Version Information: 版本信息
System Tools       : 系统工具

Version              : 版本
Architecture         : 架构
Release Date         : 发布日期
'Loading...'         : '加载中...'
Loading System Report: 正在加载系统报告
Get System Report    : 获取系统报告

Show System Metrics   : 查看系统指标
Show System Logs      : 查看系统日志
Show Abnormal Requests: 查看异常请求

Clear Worker Queues: 清空工作队列
Clear Log and Cache: 清空日志与缓存表

Shut down All Workers: 关闭全部工作单元

Worker Queues cleared: 工作队列已清空
Log and Cache cleared: 日志与缓存表已清空
All Workers will be shut down soon: 所有工作队列即将关闭

'Full Worker Queue name is DataFluxFunc-worker#workerQueue@{Number}': 完整工作队列名称为 DataFluxFunc-worker#workerQueue@{序号}

Are you sure you want to clear the Worker Queues? : 是否确认清空工作队列？
Are you sure you want to clear the Log and Cache? : 是否确认清空日志与缓存表？
Are you sure you want to shut down all the Workers?: 是否确认关闭所有工作单元？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('About') }}</h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="about-form">
              <div class="announce">
                <p>
                  <i18n path="You are using {0} browser">
                    <span class="text-main">{{ T.getBrowser() }} ({{ T.getEngine() }})</span>
                  </i18n>
                </p>
                <p>
                  {{ $t('In this system:') }}
                  <ul>
                    <li>
                      <i18n path="Monospaced font is from {0}">
                        <el-link href="https://typeof.net/Iosevka/" target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Iosevka
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Icons used are from {0}">
                        <el-link href="https://fontawesome.com/v4/" target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Font Awesome (v4)
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Illustrations used are from {0}">
                        <el-link href="https://flexiple.com/illustrations/" target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Scale by flexiple
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Code Editor is powered by {0}">
                        <el-link href="https://codemirror.net/5/" target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          Code Mirror (v5)
                        </el-link>
                      </i18n>
                    </li>
                    <li>
                      <i18n path="Blueprint Canvans is powered by {0}">
                        <el-link href="https://site.logic-flow.cn/" target="_blank">
                          <i class="fa fa-fw fa-external-link"></i>
                          LogicFlow (v1.2)
                        </el-link>
                      </i18n>
                    </li>
                  </ul>
                </p>
              </div>

              <!-- Server -->
              <el-divider content-position="left"><h1>{{ $t('Version Information') }}</h1></el-divider>

              <el-form label-width="120px">
                <el-form-item :label="$t('Version')">
                  <el-input :readonly="true" :value="FULL_VERSION"></el-input>
                  <el-link href="https://func.guance.com/" target="_blank" v-if="common.hasNewVersion()">
                    {{ $t('New version {ver} is available, click here to go to the official website', { ver: $store.state.latestVersion }) }}
                  </el-link>
                </el-form-item>

                <el-form-item :label="$t('Architecture')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="imageInfo.architecture"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Release Date')">
                  <el-input :placeholder="$t('Loading...')" :readonly="true" :value="releaseDateTEXT"></el-input>
                </el-form-item>
              </el-form>

              <!-- 系统工具 -->
              <el-divider content-position="left"><h1>{{ $t('System Tools') }}</h1></el-divider>

              <el-form label-width="120px">
                <el-form-item>
                  <el-link v-prevent-re-click
                    :disabled="isLoadingSystemInfo"
                    @click="getSystemReport">
                    <span v-if="isLoadingSystemInfo">
                      <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
                      {{ $t('Loading System Report') }}
                    </span>
                    <span v-else>{{ $t('Get System Report') }}</span>
                  </el-link>
                  <br>
                  <el-link @click="$router.push({ name: 'system-metrics' })">{{ $t('Show System Metrics') }}</el-link>
                  &#12288;
                  <el-link @click="$router.push({ name: 'system-logs' })">{{ $t('Show System Logs') }}</el-link>
                  &#12288;
                  <el-link @click="$router.push({ name: 'abnormal-request-list' })">{{ $t('Show Abnormal Requests') }}</el-link>
                  <br>
                  <el-link @click="clearWorkerQueues">{{ $t('Clear Worker Queues') }}</el-link>
                  &#12288;
                  <el-link @click="clearLogCacheTables">{{ $t('Clear Log and Cache') }}</el-link>
                  <br>
                  <el-link @click="shutDownAllWorkers">{{ $t('Shut down All Workers') }}</el-link>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>

      <JSONViewerDialog ref="jsonViewerDialog" :showDownload="true" mode="json" />
    </el-container>
  </transition>
</template>

<script>
import Vue from 'vue'
import JSONViewerDialog from '@/components/JSONViewerDialog'

export default {
  name: 'About',
  components: {
    JSONViewerDialog,
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
      this.$store.commit('updateLoadStatus', true);

      // 获取镜像信息
      let apiRes = await this.T.callAPI_get('/api/v1/image-info');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        this.imageInfo = {
          architecture    : apiRes.data.ARCHITECTURE,
          releaseTimestamp: apiRes.data.RELEASE_TIMESTAMP,
        };

      } else {
        this.imageInfo = {
          architecture    : this.NO_INFO_TEXT,
          releaseTimestamp: this.NO_INFO_TEXT,
        };
      }
    },
    async getSystemReport() {
      this.isLoadingSystemInfo = true;

      // 获取系统报告
      let apiRes = await this.T.callAPI_get('/api/v1/system-report');
      if (apiRes.ok && this.T.notNothing(apiRes.data)) {
        var contentTEXT = JSON.stringify(apiRes.data, null, 2);
        let createTimeStr = this.M().format('YYYYMMDD_HHmmss');
        let fileName = `system-report.${createTimeStr}`;
        this.$refs.jsonViewerDialog.update(contentTEXT, fileName);
      }

      this.isLoadingSystemInfo = false;
    },
    async clearWorkerQueues(queue) {
      if (!await this.T.confirm(this.$t('Are you sure you want to clear the Worker Queues?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/debug/worker-queues/do/clear', {
        body : { workerQueues: [queue] },
        alert: { okMessage: `${this.$t('Worker Queues cleared')}` },
      });
    },
    async clearLogCacheTables() {
      if (!await this.T.confirm(this.$t('Are you sure you want to clear the Log and Cache?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/debug/log-cache-tables/do/clear', {
        alert: { okMessage: `${this.$t('Log and Cache cleared')}` },
      });
    },
    async shutDownAllWorkers() {
      if (!await this.T.confirm(this.$t('Are you sure you want to shut down all the Workers?'))) return;

      let apiRes = await this.T.callAPI('post', '/api/v1/temporary-flags/:id/do/set', {
        params: { id: 'shutDownAllWorkers' },
        body  : {  },
        alert: { okMessage: `${this.$t('All Workers will be shut down soon')}` },
      });
    },
  },
  computed: {
    NO_INFO_TEXT() {
      return this.$t('No Data');
    },
    FULL_VERSION() {
      if (this.$store.getters.SYSTEM_INFO('EDITION')) {
        return `${this.$store.getters.SYSTEM_INFO('VERSION')} (${this.$store.getters.SYSTEM_INFO('EDITION')})`;
      } else {
        return this.$store.getters.SYSTEM_INFO('VERSION');
      }
    },
    releaseDateTEXT() {
      let releaseDate    = '';
      let releaseFromNow = '';
      if (this.imageInfo.releaseTimestamp > 0) {
        let releaseTimestamp = this.imageInfo.releaseTimestamp * 1000;

        releaseDate    = this.M.utc(releaseTimestamp).locale(this.T.getUILocale()).format('YYYY-MM-DD HH:mm:ss Z');
        releaseFromNow = this.M.utc(releaseTimestamp).locale(this.T.getUILocale()).fromNow();
      }

      if (releaseDate && releaseFromNow) {
        return `${releaseDate} ${this.$t('(')}${releaseFromNow}${this.$t(')')}`
      } else {
        return '-';
      }
    },
  },
  props: {
  },
  data() {
    return {
      imageInfo: {},

      isLoadingSystemInfo: false,

      workerQueues: [],
    }
  },
}
</script>

<style scoped>
.announce {
  position: relative;
  left: 45px;
  top: -20px;
}
.announce li {
  margin-top: 10px;
}
.about-form {
  width: 600px;
}
</style>
<style>
</style>
