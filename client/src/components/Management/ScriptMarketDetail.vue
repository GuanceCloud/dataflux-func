<i18n locale="en" lang="yaml">
FoundScriptSetCount: 'Scrpt Set not Found | Found {n} Script Set | Found {n} Script Sets'
ScriptCount: 'No Script included | Includes {n} Script | Includes {n} Scripts'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Publish Script Set  : 发布脚本集
Delete Script Set   : 删除脚本集
Install Script Set  : 安装脚本集
Reinstall Script Set: 重新安装脚本集
Upgrade Script Set  : 升级脚本集

Exactly Match              : 完全匹配
Local                      : 本地
Remote                     : 远端
Requirements               : 依赖项
Publisher                  : 发布者
Not Published              : 尚未发布
Not Installed              : 尚未安装
No Corresponding Script Set: 无对应脚本集
Edited                     : 已修改
Publish Note               : 发布说明
Force Mode                 : 强制模式
Force Install              : 强制安装

'This Script Set is not from current Script Market, you can:'    : 此脚本集并非来自【当前】脚本市场，您可以：
'This Script Set is edited locally, you can:'                    : 此脚本集已在本地被修改，您可以：
1. Remove the local Script Set and install from the Script Market: 1. 删除本地脚本集后再从脚本市场安装
2. Enable the Force Mode and reinstall the Script Set            : 2. 开启强制模式并重新安装脚本集

Please input note: 请输入发布说明

Are you sure you want to publish the Script Set to the Script Market? : 是否确认发布脚本集到此脚本市场？
Are you sure you want to delete the Script Set from the Script Market?: 是否确认从脚本市场删除此脚本集？
Are you sure you want to install the Script Set?                      : 是否确认安装此脚本集？
Are you sure you want to reinstall the Script Set?                    : 是否确认重新安装此脚本集？
Are you sure you want to upgrade the Script Set?                      : 是否确认升级此脚本集？

This Script Market is locked by you: 当前脚本市场已被您锁定
This Script Market is locked by other user ({user}): 当前脚本市场已被其他用户（{user}）锁定

Script Set published to the Script Market                      : 脚本集已发布至脚本市场
Script Set deleted from the Script Market                      : 脚本集已从脚本市场删除
Script Set installed, new Script Set is in effect immediately  : 脚本集已安装，新脚本集立即生效
Script Set reinstalled, new Script Set is in effect immediately: 脚本集已重新安装，新脚本集立即生效
Script Set upgraded, new Script Set is in effect immediately   : 脚本集已升级，新脚本集立即生效

No Script Set has ever been published: 尚未发布过任何脚本集到脚本市场

FoundScriptSetCount: '找不到脚本集 | 共找到 {n} 个脚本集 | 共找到 {n} 个脚本集'
ScriptCount: '不包含任何脚本 | 包含 {n} 个脚本 | 包含 {n} 个脚本'
Homepage: 前往主页
Stay Here: 留在本页

'Processing...': '正在处理...'

Script Set Installed Successfully!: 成功安装脚本集！
'In addition, this Script Set...' :  '同时，这个脚本集...'

Requires 3rd party Python packages                 : 依赖第三方 Python 包
Go to PIP Tool                                     : 前往 PIP 工具
Includes a Startup Script                          : 包含了启动脚本（Startup）
'Includes a Startup Script with following configs:': 包含了启动脚本（Startup）及如下配置项目：
Deploy Startup Script                              : 部署启动脚本
Deploy Startup Script and Crontab Config           : 部署启动脚本及自动触发配置
Startup Script is deployed                         : 启动脚本已部署
Go to Startup Script                               : 前往启动脚本
Go to the Crontab Config                           : 前往自动触发配置

The published Script Set will be shown here, you can find and install the ones you need: 发布后的脚本集将在此展示，可以查找并安装需要的脚本集
</i18n>

<template>
  <transition name="fade">
    <PageLoading v-if="!$store.state.isLoaded"></PageLoading>
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>
            <span class="text-main script-market-name">
              <span v-if="scriptMarket.isOfficial"><i class="fa fa-fw fa-star text-watch"></i> {{ $t('Official Script Market') }}</span>
              <span v-else>{{ common.getScriptMarketName(scriptMarket) }}</span>
            </span>
          </span>

          <div class="header-control" v-if="T.notNothing(data)">
            <template v-if="homepageURL || scriptMarket.type === 'git'">
              <el-link :href="homepageURL || scriptMarket.configJSON.url" target="_blank">
                <i class="fa fa-fw fa-external-link"></i>
                {{ $t('Homepage') }}
              </el-link>
              &#12288;
            </template>

            <span class="text-main">{{ $tc('FoundScriptSetCount', filteredData.length) }}</span>
            &#12288;
            <el-input :placeholder="$t('Filter')"
              size="small"
              class="filter-input"
              v-model="filterInput"
              @input="onFilterChange">
              <i slot="prefix"
                class="el-input__icon el-icon-close text-main"
                v-if="filterInput"
                @click="filterInput = ''; onFilterChange()"></i>
            </el-input>
          </div>
        </div>
      </el-header>

      <!-- 横幅 -->
      <div v-if="isLockedByMe || isLockedByOther" style="padding: 0 30px">
        <InfoBlock v-if="isLockedByMe" type="success" :title="$t('This Script Market is locked by you')" />
        <InfoBlock v-else-if="isLockedByOther" :type="isAccessible ? 'warning' : 'error'" :title="$t('This Script Market is locked by other user ({user})', { user: lockedByUser })" />
      </div>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(filteredData)">
          <h1 class="no-data-title" v-if="T.notNothing(filterTEXT)"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Script Set has ever been published') }}</h1>

          <p class="no-data-tip">
            {{ $t('The published Script Set will be shown here, you can find and install the ones you need' )}}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="filteredData"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column width="100" align="right" v-if="hasLocalMarker">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.isLocalEdited"
                effect="dark"
                type="danger"
                size="mini">
                {{ $t('Edited') }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column>
            <template slot="header" slot-scope="scope">
              <i class="fa fa-fw fa-home"></i>
              {{ $t('Local') }}
            </template>
            <template slot-scope="scope">
              <template v-if="scope.row.local">
                <strong class="script-set-name">{{ scope.row.local.title || scope.row.local.id }}</strong>
                &#12288;
                <el-tag v-if="scope.row.local.title === filterInput" type="primary" size="mini" effect="dark">{{ $t('Exactly Match') }}</el-tag>
                <div>
                  <span class="text-info">ID</span>
                  &nbsp;<code class="text-main">{{ scope.row.local.id }}</code>
                  <CopyButton :content="scope.row.local.id" />
                  &#12288;
                  <el-tag v-if="scope.row.local.id === filterInput" type="primary" size="mini" effect="dark">{{ $t('Exactly Match') }}</el-tag>
                  <br>
                  &#12288;{{ $tc('ScriptCount', (scope.row.local.scripts || []).length ) }}
                </div>
              </template>
              <template v-else>
                <template v-if="scriptMarket.isAdmin">
                  <i class="text-info">{{ $t('No Corresponding Script Set') }}</i>
                </template>
                <template v-else>
                  <i class="text-info">{{ $t('Not Installed') }}</i>
                </template>
              </template>
            </template>
          </el-table-column>

          <el-table-column width="120" align="center" class-name="arrow-icon-cell">
            <template slot-scope="scope">
              <el-tooltip v-if="!scriptMarket.isAdmin && scope.row.local && !scope.row.isScriptMarketMatched" effect="dark" placement="top" :enterable="false">
                <div slot="content">
                  {{ $t('This Script Set is not from current Script Market, you can:') }}
                  <br>{{ $t('1. Remove the local Script Set and install from the Script Market') }}
                  <br>{{ $t('2. Enable the Force Mode and reinstall the Script Set') }}
                </div>
                <i class="fa fa-fw fa-exclamation fa-3x text-bad arrow-icon-cover"></i>
              </el-tooltip>
              <el-tooltip v-else-if="!scriptMarket.isAdmin && scope.row.isLocalEdited" effect="dark" placement="top" :enterable="false">
                <div slot="content" class="xxx">
                  {{ $t('This Script Set is edited locally, you can:') }}
                  <br>{{ $t('1. Remove the local Script Set and install from the Script Market') }}
                  <br>{{ $t('2. Enable the Force Mode and reinstall the Script Set') }}
                </div>
                <i class="fa fa-fw fa-exclamation fa-3x text-bad arrow-icon-cover"></i>
              </el-tooltip>

              <span v-if="scriptMarket.isAdmin && scope.row.local"
                :class="scope.row.isIdMatched ? 'text-main' : 'text-info'">
                <i v-for="opacity in [ 0.3, 0.5, 1.0 ]" class="fa fa-angle-right fa-2x" :style="{ opacity: opacity}"></i>
              </span>
              <span v-else-if="!scriptMarket.isAdmin && scope.row.remote"
                :class="scope.row.isIdMatched ? 'text-main' : 'text-info'">
                <i v-for="opacity in [ 1.0, 0.5, 0.3 ]" class="fa fa-angle-left fa-2x" :style="{ opacity: opacity}"></i>
              </span>
            </template>
          </el-table-column>

          <el-table-column width="100" align="right" v-if="hasRemoteMarker">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.isRemoteUpdated"
                effect="dark"
                type="danger"
                size="mini">
                {{ $t('New Version') }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column>
            <template slot="header" slot-scope="scope">
              <i class="fa fa-fw fa-cloud"></i>
              {{ $t('Remote') }}
            </template>
            <template slot-scope="scope">
              <template v-if="scope.row.remote">
                <strong class="script-set-name">{{ scope.row.remote.title || scope.row.remote.id }}</strong>
                &#12288;
                <el-tag v-if="scope.row.remote.title === filterInput" type="primary" size="mini" effect="dark">{{ $t('Exactly Match') }}</el-tag>
                <div>
                  <span class="text-info">ID</span>
                  &nbsp;<code class="text-main">{{ scope.row.remote.id }}</code>
                  <CopyButton :content="scope.row.remote.id" />
                  &#12288;
                  <el-tag v-if="scope.row.remote.id === filterInput" type="primary" size="mini" effect="dark">{{ $t('Exactly Match') }}</el-tag>
                  <br>
                  &#12288;{{ $tc('ScriptCount', (scope.row.remote.scripts || []).length ) }}
                </div>
              </template>
              <template v-else>
                <i class="text-info" v-if="scriptMarket.isAdmin">{{ $t('Not Published') }}</i>
                <i class="text-info" v-else>{{ $t('No Corresponding Script Set') }}</i>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Publisher')" width="200">
            <template slot-scope="scope">
              <div v-if="scope.row.remote">
                <span>{{ scope.row.remote._extra.exportUser }}</span>
              </div>

              <div v-if="scope.row.remote" class="publish-time">
                <span>{{ scope.row.remote._extra.exportTime | datetime }}</span>
                <br>
                <span class="text-info">{{ scope.row.remote._extra.exportTime | fromNow }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column align="right" width="180">
            <template slot="header" slot-scope="scope">
              <el-switch v-if="!scriptMarket.isAdmin && hasNonInstallable && isAccessible"
                v-model="forceModeEnabled"
                active-color="#FF0000"
                :active-text="$t('Force Mode')">
              </el-switch>
            </template>
            <template slot-scope="scope">
              <!-- 发布方 -->
              <template v-if="scriptMarket.isAdmin">
                <el-link :disabled="!scope.row.isPublishable" @click="openDialog(scope.row.local,  'publish')">{{ $t('Publish') }}</el-link>
                <el-link :disabled="!scope.row.isDeletable"   @click="openDialog(scope.row.remote, 'delete')">{{ $t('Delete') }}</el-link>
              </template>
              <!-- 订阅方 -->
              <template v-else>
                <!-- 没有本地时为安装 -->
                <el-link v-if="!scope.row.local"
                  @click="openDialog(scope.row.remote, 'install')"
                  :disabled="!isAccessible">
                  {{ $t('Install') }}
                </el-link>
                <!-- 强制模式（且原本无法安装的） -->
                <el-button v-else-if="forceModeEnabled && !scope.row.isInstallable"
                  size="mini"
                  type="danger"
                  @click="openDialog(scope.row.remote, 'install')">
                  <i class="fa fa-fw fa-exclamation-triangle"></i>
                  {{ $t('Force Install') }}
                </el-button>
                <!-- 存在本地时为重新安装 / 升级 -->
                <el-link v-else
                  @click="openDialog(scope.row.remote, scope.row.hasNewVersion ? 'upgrade' : 'reinstall')"
                  :disabled="!isAccessible || !scope.row.isInstallable">
                  {{ scope.row.hasNewVersion ? $t('Upgrade') : $t('Reinstall') }}
                </el-link>

              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 操作确认 -->
      <el-dialog
        :title="operationDialogTitle"
        :visible.sync="showOperation"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        v-loading.fullscreen.lock="isProcessing"
        element-loading-spinner="el-icon-loading"
        :element-loading-text="$t('Processing...')"
        width="650px">
        <el-form ref="form" label-width="115px" :model="form" :rules="formRules">
          <el-form-item :label="$t('Name')">
            <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation" :value="scriptSetToOperate.title"></el-input>
          </el-form-item>
          <el-form-item label="ID">
            <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation" :value="scriptSetToOperate.id"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Description')" v-if="T.notNothing(scriptSetToOperate.description)">
            <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 2 }"
              :value="scriptSetToOperate.description"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Requirements')" v-if="T.notNothing(scriptSetToOperate.requirements)">
            <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 2 }"
              :value="scriptSetToOperate.requirements"></el-input>
          </el-form-item>

          <template v-if="isWriteOperation">
            <el-form-item>
              <el-divider class="commit-divider"></el-divider>
            </el-form-item>

            <el-form-item :label="$t('User Name')">
              <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation" :value="$store.state.userProfile.name"></el-input>
            </el-form-item>

            <el-form-item :label="$t('Email')">
              <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation" :value="$store.state.userProfile.email"></el-input>
            </el-form-item>

            <el-form-item v-if="operation === 'publish'" :label="$t('Publish Note')" prop="note">
              <el-input
                type="textarea"
                resize="none"
                :autosize="{ minRows: 2 }"
                v-model="form.note"></el-input>
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item :label="$t('Publish Note')" v-if="scriptSetToOperate._extra">
              <el-input :disabled="isWriteOperation" :readonly="!isWriteOperation" :value="scriptSetToOperate._extra.note"></el-input>
            </el-form-item>
          </template>
        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="showOperation = false">{{ $t('Cancel') }}</el-button>
          <el-button size="small" type="primary" @click="submitData(operation)" :loading="isProcessing">{{ operationButtonTitle }}</el-button>
        </div>
      </el-dialog>

      <!-- 部署 -->
      <el-dialog
        :visible.sync="showDeploy"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        width="950px">
        <div class="deploy-container">
          <el-image :src="deployImage"></el-image>
          <el-card class="deploy-content">
            <i class="fa fa-fw fa-check-circle deploy-icon"></i>

            <h1 class="text-main">{{ $t('Script Set Installed Successfully!') }}</h1>
            <p class="text-info">{{ $t('In addition, this Script Set...') }}<p>

            <p v-if="T.notNothing(deployment.requirements)">
              <br>
              {{ $t('Requires 3rd party Python packages') }}
              <br>&#12288;
              <el-button type="text" @click="common.goToPIPTools(deployment.requirements, { newTab: true })">
                <i class="fa fa-fw fa-arrow-right"></i>
                {{ $t('Go to PIP Tool') }}
              </el-button>
            </p>

            <p v-if="T.notNothing(deployment.exampleScriptIds)">
              <br>
              <!-- 已部署 -->
              <template v-if="T.notNothing(deployment.startupScriptIds)">
                {{ $t('Startup Script is deployed') }}
                <br>
                <el-button type="text" @click="common.goToScript(deployment.startupScriptIds[0])">
                  <i class="fa fa-fw fa-arrow-right"></i>
                  {{ $t('Go to Startup Script') }}
                </el-button>

                <template v-if="T.notNothing(deployment.startupCrontabIds)">
                  <br>
                  <el-button type="text" @click="common.goToList('crontab-config-list', { _fuzzySearch: deployment.startupCrontabIds[0] })">
                    <i class="fa fa-fw fa-arrow-right"></i>
                    {{ $t('Go to the Crontab Config') }}
                  </el-button>
                </template>
              </template>

              <!-- 尚未部署 -->
              <template v-else>
                <template v-if="T.isNothing(deployment.configFields)">
                  {{ $t('Includes a Startup Script') }}
                </template>
                <template v-else>
                  {{ $t('Includes a Startup Script with following configs:') }}
                  <el-form :model="configReplacerForm" size="small">
                    <el-form-item v-for="f in deployment.configFields" :label="f" :key="f">
                      <el-input v-model="configReplacerForm[f]"></el-input>
                    </el-form-item>
                  </el-form>
                  <el-button type="text" @click="deploy()">
                    <i class="fa fa-fw fa-arrow-right"></i>
                    {{ $t('Deploy Startup Script') }}
                  </el-button>
                  <br>
                  <el-button type="text" @click="deploy({ crontabConfig: true })">
                    <i class="fa fa-fw fa-arrow-right"></i>
                    {{ $t('Deploy Startup Script and Crontab Config') }}
                  </el-button>
                </template>
              </template>
            </p>
          </el-card>
          <div class="deploy-buttons">
            <el-button @click="showDeploy = false">{{ $t('Stay Here') }}</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 主页提示 -->
      <FeatureNoticeDialog
        featureKey="scriptMarket.homepage"
        :disabled="scriptMarket.isAdmin || !homepageURL && scriptMarket.type !== 'git'"
        :description="$t('FeatureNotice_scriptMarketHomepage')"
        :image="img_noticeScriptMarketHomepage" />

    </el-container>
  </transition>
</template>

<script>
import { debounce } from '@/toolkit'

import FeatureNoticeDialog from '@/components/FeatureNoticeDialog'
import img_noticeScriptMarketHomepage from '@/assets/img/notice-script-market-homepage.png'

import img_deploy from '@/assets/img/notice-todo-list.png'

export default {
  name: 'ScriptMarketDetail',
  components: {
    FeatureNoticeDialog,
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
    onFilterChange: debounce(function(val) {
      this.filterTEXT = val;
    }),

    async loadData(opt) {
      opt = opt || {};

      let apiRes = null;

      // 获取脚本市场信息
      if (this.T.isNothing(this.scriptMarket)) {
        apiRes = await this.T.callAPI_getOne('/api/v1/script-markets/do/list', this.$route.params.id, {
          alert: true,
        });
        if (!apiRes || !apiRes.ok) return;

        this.scriptMarket = apiRes.data;

        // 检查更新
        this.common.checkScriptMarketUpdate(this.scriptMarket.id);
      }

      // 获取远端脚本集列表
      if (!opt.skipLoadRemote) {
        apiRes = await this.T.callAPI_get('/api/v1/script-markets/:id/script-sets/do/list', {
          params: { id: this.$route.params.id },
        });
        if (!apiRes || !apiRes.ok) {
          return this.$router.push({
            name: 'script-market-list',
          });
        };

        let dataMap = apiRes.data.reduce((acc, x) => {
          acc[x.id] = { remote: x };
          return acc;
        }, {});

        this.remoteScriptSetMap = dataMap;
      }

      // 获取本地脚本集列表
      if (!opt.skipLoadLocal) {
        apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', {
          query: {
            _withScripts: true,
            fields: [
              'id',
              'title',
              'description',
              'requirements',
              'scripts',
              'md5',
              'origin',
              'originId',
              'originMD5',
            ]
          },
        });
        if (!apiRes || !apiRes.ok) return;

        this.localScriptSets = apiRes.data;
      }

      let remoteScriptSetMap = this.T.jsonCopy(this.remoteScriptSetMap);
      let localScriptSets    = this.T.jsonCopy(this.localScriptSets);
      localScriptSets.forEach(x => {
        let d = remoteScriptSetMap[x.id];
        if (d) {
          d.local = x;
        } else if (this.scriptMarket.isAdmin) {
          remoteScriptSetMap[x.id] = { local: x };
        }
      });

      // 生成列表并排序
      var data = Object.values(remoteScriptSetMap);
      data.forEach(d => {
        // 是否有对应 ID 的脚本集
        d.isIdMatched = !!(d.local && d.remote);

        if (this.scriptMarket.isAdmin) {
          // 发布模式

          // 本地是否编辑过（有匹配，但本地 MD5 与远端 Origin MD5 不同）
          d.isLocalEdited = !!(d.isIdMatched && d.local.md5 != d.remote.originMD5);

          // 是否可以发布（有本地，可操作）
          d.isPublishable = !!(d.local && this.isAccessible);
          // 是否可以删除（有远端，可操作）
          d.isDeletable = !!(d.remote && this.isAccessible);

        } else {
          // 安装模式

          // 是否从本脚本市场安装
          d.isScriptMarket        = !!(d.local && d.local.origin === 'scriptMarket');
          d.isScriptMarketMatched = !!(d.local && d.local.origin === 'scriptMarket' && d.local.originId === this.scriptMarket.id);

          // 是否已经是最新版
          d.hasNewVersion = !!(d.isScriptMarketMatched && d.local.originMD5 !== d.remote.originMD5);

          if (!d.isIdMatched) {
            // 无对应
            // 是否可以安装（有远端即可）
            d.isInstallable = !!d.remote;

          } else if (d.isIdMatched && d.isScriptMarket && !d.isScriptMarketMatched) {
            // 有对应，但来自不同脚本市场
            // 是否可以安装（不可）
            d.isInstallable = false;

          } else if (d.isIdMatched && d.isScriptMarket && d.isScriptMarketMatched) {
            // 有对应，来自相同脚本市场

            // 本地是否编辑（本地MD5 与本地 Origin MD5 不同）
            d.isLocalEdited = d.local.md5 !== d.local.originMD5;

            // 远端是否更新
            d.isRemoteUpdated = !!(d.local.originMD5 !== d.remote.originMD5);

            // 是否可以安装（本地未修改、可操作）
            d.isInstallable = !d.isLocalEdited && this.isAccessible;
          }
        }
      });

      data.sort((a, b) => {
        let getScore = x => {
          let score = 0;
          if (x.isRemoteUpdated) score += 1000;
          if (x.isLocalEdited)   score += 100;
          if (x.isIdMatched)     score += 10;

          if (this.scriptMarket.isAdmin) {
            if (x.local) score += 1;
          } else {
            if (x.remote) score += 1;
          }

          return score;
        }
        let aScore = getScore(a);
        let bScore = getScore(b);

        return bScore - aScore;
      });
      // 添加搜索关键字
      data.forEach(d => {
        let local  = d.local  || {};
        let remote = d.remote || {};
        this.T.appendSearchKeywords(d, [
          local.id     || remote.id,
          local.title  || remote.title,
          remote.id    || local.id,
          remote.title || local.title,
        ]);
      });

      this.data = data;

      setTimeout(() => {
        this.$store.commit('updateLoadStatus', true);
      }, 500);
    },
    openDialog(scriptSet, operation) {
      this.form.note = null;

      switch(operation) {
        case 'publish':
        case 'delete':
          if (this.scriptMarket.type === 'git'
            && !this.$root.checkUserProfileForGit()) return;
          break;
      }

      switch(operation) {
        case 'publish':
          this.operationDialogTitle = this.$t('Publish Script Set');
          this.operationButtonTitle = this.$t('Publish');
          break;

        case 'delete':
          this.operationDialogTitle = this.$t('Delete Script Set');
          this.operationButtonTitle = this.$t('Delete');
          break;

        case 'install':
          this.operationDialogTitle = this.$t('Install Script Set');
          this.operationButtonTitle = this.$t('Install');
          break;

        case 'reinstall':
          this.operationDialogTitle = this.$t('Reinstall Script Set');
          this.operationButtonTitle = this.$t('Reinstall');
          break;

        case 'upgrade':
          this.operationDialogTitle = this.$t('Upgrade Script Set');
          this.operationButtonTitle = this.$t('Upgrade');
          break;
      }

      this.operation          = operation;
      this.scriptSetToOperate = scriptSet;
      this.showOperation      = true;
    },
    async submitData(operation) {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(operation) {
        case 'publish':
          if (!await this.T.confirm(this.$t('Are you sure you want to publish the Script Set to the Script Market?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Set from the Script Market?'))) return;
          break;

        case 'install':
          if (!await this.T.confirm(this.$t('Are you sure you want to install the Script Set?'))) return;
          break;

        case 'reinstall':
          if (!await this.T.confirm(this.$t('Are you sure you want to reinstall the Script Set?'))) return;
          break;

        case 'upgrade':
          if (!await this.T.confirm(this.$t('Are you sure you want to upgrade the Script Set?'))) return;
          break;
      }

      this.isProcessing = true;

      let apiRes = null;
      switch(operation) {
        case 'publish':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/publish', {
            params: { id: this.scriptMarket.id },
            body  : {
              scriptSetIds: [ this.scriptSetToOperate.id ],
              mode        : 'add',
              note        : this.form.note,
            },
            alert : { okMessage: this.$t('Script Set published to the Script Market') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/publish', {
            params: { id: this.scriptMarket.id },
            body  : {
              scriptSetIds: [ this.scriptSetToOperate.id ],
              mode        : 'delete',
              note        : `Delete Script Set: ${this.scriptSetToOperate.id}`,
            },
            alert : { okMessage: this.$t('Script Set deleted from the Script Market') },
          });
          break;

        case 'install':
        case 'reinstall':
        case 'upgrade':
          let installMessageMap = {
            install  : 'Script Set installed, new Script Set is in effect immediately',
            reinstall: 'Script Set reinstalled, new Script Set is in effect immediately',
            upgrade  : 'Script Set upgraded, new Script Set is in effect immediately',

          }
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/install', {
            params: { id: this.scriptMarket.id },
            body  : { scriptSetIds : [ this.scriptSetToOperate.id ] },
            alert : { okMessage: this.$t(installMessageMap[operation]) },
          });

          this.$store.commit('updateScriptListSyncTime');
          break;
      }

      if (!apiRes || !apiRes.ok) return;

      // 后续操作
      let skipCheckUpdate = null; // 跳过检查更新
      let skipLoadLocal   = null; // 跳过加载本地数据
      let skipLoadRemote  = null; // 跳过加载远端数据
      switch(operation) {
        case 'publish':
        case 'delete':
          skipCheckUpdate = true;
          skipLoadLocal   = true;
          skipLoadRemote  = false;
          break;

        case 'install':
        case 'reinstall':
        case 'upgrade':
          skipCheckUpdate = false;
          skipLoadLocal   = false;
          skipLoadRemote  = true;
          break;
      }

      // 重新检查更新
      if (!skipCheckUpdate) {
        this.common.checkScriptMarketUpdate(this.scriptMarket.id);
      }

      await this.loadData({
        skipLoadLocal : skipLoadLocal,
        skipLoadRemote: skipLoadRemote,
      });

      this.isProcessing  = false;
      this.showOperation = false;

      // 跳转个后续提示
      switch(operation) {
        case 'install':
        case 'reinstall':
        case 'upgrade':
          if (this.T.notNothing(apiRes.data.requirements)
            || this.T.notNothing(apiRes.data.exampleScriptIds)) {
            // 提取部署信息
            this.deployment         = apiRes.data;
            this.configReplacerForm = {};
            this.showDeploy         = true;
          }
          break;
      }
    },
    async deploy(options) {
      options = options || {};
      options.configReplacer = this.configReplacerForm || {};

      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/deploy', {
        params: { id: this.scriptSetToOperate.id },
        body  : options,
      });
      if (!apiRes || !apiRes.ok) return;

      if (apiRes.data.startupScriptId) {
        this.deployment.startupScriptIds = [ apiRes.data.startupScriptId ];
      }
      if (apiRes.data.startupCrontabId) {
        this.deployment.startupCrontabIds = [ apiRes.data.startupCrontabId ];
      }
    },
  },
  computed: {
    isWriteOperation() {
      switch(this.operation) {
        case 'publish':
        case 'delete':
          return true;

        default:
          return false;
      }
    },
    lockedByUser() {
        return `${this.scriptMarket.lockedByUserName || this.scriptMarket.lockedByUsername}`
    },
    isLockedByMe() {
      return this.scriptMarket.lockedByUserId === this.$store.getters.userId
    },
    isLockedByOther() {
      return this.scriptMarket.lockedByUserId && !this.isLockedByMe;
    },
    isAccessible() {
      // 超级管理员不受限制
      if (this.$store.getters.isAdmin) return true;
      return !this.isLockedByOther;
    },
    homepageURL() {
      if (!this.scriptMarket || !this.scriptMarket.extra) return null;
      return this.scriptMarket.extra.homepageURL;
    },
    hasLocalMarker() {
      for (let i = 0; i < this.data.length; i++) {
        let d = this.data[i];
        if (d.isLocalEdited) {
          return true;
        }
      }
      return false;
    },
    hasRemoteMarker() {
      for (let i = 0; i < this.data.length; i++) {
        let d = this.data[i];
        if (d.isRemoteUpdated) {
          return true;
        }
      }
      return false;
    },
    hasNonInstallable() {
      for (let i = 0; i < this.data.length; i++) {
        let d = this.data[i];
        if (!this.scriptMarket.isAdmin && !d.isInstallable) {
          return true;
        }
      }
      return false;
    },
    filteredData() {
      let q = (this.filterTEXT || '').toLowerCase().trim();
      if (!q) {
        return this.data;
      } else {
        return this.T.filterByKeywords(q, this.data);
      }
    },
    deployImage() {
      return img_deploy;
    },
  },
  props: {
  },
  data() {
    return {
      data: [],

      scriptMarket      : {},
      remoteScriptSetMap: {},

      form: {
        note: null,
      },
      formRules: {
        note: [
          {
            trigger : 'change',
            message : this.$t('Please input note'),
            required: true,
          },
        ]
      },

      filterInput: '',
      filterTEXT : '',

      scriptSetToOperate: {},
      operation           : null,
      showOperation       : false,
      operationDialogTitle: null,
      operationButtonTitle: null,
      isProcessing        : false,

      deployment        : {},
      configReplacerForm: {},
      showDeploy        : false,

      forceModeEnabled: false,

      // 主页提示
      img_noticeScriptMarketHomepage: img_noticeScriptMarketHomepage,
    }
  },
}
</script>

<style scoped>
.arrow-icon-cover {
  position: absolute;
  z-index: 9;
}
.script-market-name {
  display: inline-block;
  vertical-align: bottom;
  max-width: 500px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 18px;
}
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

.script-set-name {
  font-size: 16px;
}
.publish-time {
  padding-left: 20px;
}

.deploy-container {
  min-height: 350px;
}
.deploy-container .el-image {
  width: 550px;
  left: -50px;
  top: 0px;
  position: absolute;
}
.deploy-content {
  width: 500px;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-radius: 20px;
  position: relative;
  top: -30px;
  left: 400px;
}
.deploy-content h1 {
  text-align: center;
}
.deploy-content p {
  font-size: 16px;
  line-height: 20px;
  word-break: break-word;
  position: relative;
  padding: 0;
  margin: 0;
}
.deploy-content .el-form {
  padding-left: 20px;
}
.deploy-content .el-form-item {
  margin-bottom: 0;
  margin-top: 15px;
}
.deploy-content .el-button {
  margin-bottom: 0;
  margin-top: 15px;
  padding: 0 0 0 20px;
}
.deploy-buttons {
  position: absolute;
  bottom: 30px;
  right: 30px;
}
.deploy-icon {
  position: absolute;
  font-size: 245px;
  right: -12%;
  top: -5%;
  color: #ff660018;
  line-height: 200px;
  z-index: 0;
}
</style>

<style>
.deploy-content .el-form-item__label {
  font-size: 14px;
  line-height: 1.5;
}
.commit-divider {
  margin: 1px 0;
}
.arrow-icon-cell > .cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-table th .el-switch {
  display: inline-flex;
  line-height: 20px;
}
</style>
