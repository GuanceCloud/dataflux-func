<i18n locale="en" lang="yaml">
lastSucceeded : 'Succeeded {t}'
lastFailed    : 'Failed {t}'
lastRan       : 'Ran {t}'
successCount  : 'Success {n}'
failureCount  : 'Failure {n}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Jump to...                                     : 跳转到...
Refresh                                        : 刷新列表
New Script                                     : 新建脚本
New Script Set                                 : 新建脚本集
Edited                                         : 已修改
Builtin                                        : 内置
Locked by other user ({user})                  : 被其他用户（{user}）锁定
Locked by you                                  : 被您锁定
Quick View                                     : 快速查看
View                                           : 查看
Setup                                          : 配置
Copy example                                   : 复制示例
Copy {name} ID                                 : 复制{name}ID
Example                                        : 示例
Code edited but not published yet              : 代码已修改但尚未发布
'Import/Calling will run the published version': 引用/API调用实际将运行已发布代码

Script Set {id}: 脚本集 {id}
Script {id}    : 脚本 {id}

Please input ID                                   : 请输入ID
Script Set ID too long                            : 脚本集ID过长
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number                   : 不得以数字开头
Please input new Script Set ID                    : 请输入新脚本集ID
Inputed Script Set ID already exists              : 输入的脚本集ID已经存在

Builtin Script Set : 系统内置脚本集
Script Set pinned  : 脚本集已置顶
Script Set unpinned: 脚本集已取消
Script Set locked  : 脚本集已上锁
Script Set unlocked: 脚本集已解锁
Script Set cloned  : 脚本集已克隆
Script locked      : 脚本已上锁
Script unlocked    : 脚本已解锁

Installed form Script Market      : 从脚本市场安装的脚本集
The Script Market has been removed: 脚本市场已被删除

Config    : 配置
Auth      : 认证
Expires   : 过期
Throttling: 限流
Created   : 创建
Run       : 执行

Auth Link List     : 授权链接列表
Crontab Config List: 自动触发配置列表
Batch List         : 批处理列表

lastSucceeded : '{t}调用成功'
lastFailed    : '{t}调用失败'
lastRan       : '{t}调用'
successCount  : '成功 {n}'
failureCount  : '失败 {n}'

Are you sure you want to send a task of the Crontab Config?: 是否确认立刻发送此自动触发配置的任务？
Crontab Config Task sent: 自动触发配置任务已发送

Show Auth Links     : 显示授权链接列表
Show Crontab Configs: 显示自动触发配置列表
Show Batches        : 显示批处理列表
Go to Script Market : 前往脚本市场
</i18n>

<template>
  <div id="aside-script-content">
    <el-select class="jump-to-select"
      :placeholder="$t('Jump to...')"
      :no-data-text="$t('No Data')"
      size="small"
      :filterable="true"
      :clearable="true"
      :filter-method="doFilter"
      v-model="selectFilterText">
      <el-option
        v-for="item in selectShowOptions"
        :key="item.id"
        :label="item.label"
        :value="item.id">
        <span class="select-item-name">
          <i v-if="item.type === 'scriptSet'" class="fa fa-fw fa-folder"></i>
          <i v-else-if="item.type === 'script'" class="fa fa-fw fa-file-code-o"></i>
          <el-tag v-else-if="item.type === 'func'" type="info" size="mini"><code>def</code></el-tag>
          {{ item.label }}
        </span>
        <code class="select-item-id code-font">ID: {{ item.id }}</code>
      </el-option>
    </el-select>

    <el-tree class="aside-tree"
      v-loading="loading"
      :data="data"
      :highlight-current="true"
      :default-expand-all="false"
      :default-expanded-keys="defaultExpandedNodeKeys"
      :auto-expand-parent="false"
      :expand-on-click-node="false"
      :indent="10"
      node-key="id"
      v-on:node-expand="onExpandNode"
      v-on:node-collapse="onCollapseNode"
      ref="tree">

      <span
        slot-scope="{node, data}"
        class="aside-tree-node"
        :entry-id="data.id"
        @click="openEntity(node, data)">

        <!-- 菜单 -->
        <el-popover
          placement="right-start"
          trigger="hover"
          popper-class="aside-tip"
          :disabled="!!!data.id"
          :value="showPopoverId === data.id">

          <!-- 基本信息 -->
          <div class="aside-tree-node-description">
            <InfoBlock type="warning" v-if="data.origin === 'builtin'" :title="$t('Builtin Script Set')"></InfoBlock>
            <InfoBlock type="warning" v-if="data.origin === 'scriptMarket'" :title="$t('Installed form Script Market')"></InfoBlock>

            <span class="text-info">ID</span>
            &nbsp;<code class="text-main">{{ data.id }}</code>
            <CopyButton :content="data.id"></CopyButton>

            <pre v-if="(data.type === 'scriptSet' || data.type === 'script') && data.description">{{ data.description }}</pre>
          </div>

          <!-- 示例代码 -->
          <template v-if="data.sampleCode">
            <div class="aside-tree-node-sample-code">
              <span class="text-info">{{ $t('Example') }}</span>
              <CopyButton :content="data.sampleCode"></CopyButton>

              <pre>{{ data.sampleCode }}</pre>
            </div>
          </template>

          <!-- 提示 -->
          <template v-if="data.isCodeEdited">
            <br>
            <div class="code-edited-tip">
              <span class="text-bad">{{ $t('Code edited but not published yet') }}<br>{{ $t('Import/Calling will run the published version') }}</span>
            </div>
          </template>

          <!-- 操作 -->
          <template v-if="[ 'scriptSet', 'script', 'func' ].indexOf(data.type) >= 0">
            <template v-if="[ 'scriptSet', 'script' ].indexOf(data.type) >= 0">
              <br>
              <el-button-group>
                <!-- 添加脚本集 -->
                <el-button v-if="data.type === 'scriptSet'"
                  size="mini"
                  :disabled="!data.isEditable"
                  @click="openEntity(node, data, 'add')">
                  <i class="fa fa-fw fa-plus"></i>
                  {{ $t('New Script') }}
                </el-button>

                <!-- 快速查看 -->
                <el-button v-if="data.type === 'script'"
                  size="mini"
                  @click="showQuickViewWindow(data.id)">
                  <i class="fa fa-fw fa-window-restore"></i>
                  {{ $t('Quick View') }}
                </el-button>

                <!-- 置顶 -->
                <el-button v-if="data.type === 'scriptSet'"
                  size="mini"
                  :disabled="!data.isEditable"
                  v-prevent-re-click @click="pinData(data.type, data.id, !data.isPinned)">
                  <i class="fa fa-fw" :class="[data.isPinned ? 'fa-thumb-tack fa-rotate-270' : 'fa-thumb-tack']"></i>
                  {{ data.isPinned ? $t('Unpin') : $t('Pin') }}
                </el-button>

                <!-- 锁定/解锁脚本/脚本集 -->
                <el-button
                  size="mini"
                  :disabled="!data.isEditable || (data.type === 'script' && data.isLockedByScriptSet)"
                  v-prevent-re-click @click="lockData(data.type, data.id, !data.isLocked)">
                  <i class="fa fa-fw" :class="[data.isLocked ? 'fa-unlock' : 'fa-lock']"></i>
                  {{ data.isLocked ? $t('Unlock') : $t('Lock') }}
                </el-button>

                <!-- 克隆 -->
                <el-button v-if="data.type === 'scriptSet'"
                  size="mini"
                  @click="cloneData(data.id)">
                  <i class="fa fa-fw fa-files-o"></i>
                  {{ $t('Clone') }}
                </el-button>

                <!-- 配置 -->
                <el-button
                  size="mini"
                  @click="openEntity(node, data, 'setup')">
                  <i class="fa fa-fw fa-wrench"></i>
                  {{ $t('Setup') }}
                </el-button>
              </el-button-group>
            </template>

            <div class="goto-links">
              <!-- 关联配置 -->
              <el-link v-if="data.type === 'func'"
                @click="openRelEntity(node, data, 'authLink')">
                <i class="fa fa-fw fa-link"></i>
                {{ $t('Show Auth Links') }}
              </el-link>
              <el-link v-if="data.type === 'func'"
                @click="openRelEntity(node, data, 'crontabConfig')">
                <i class="fa fa-fw fa-clock-o"></i>
                {{ $t('Show Crontab Configs') }}
              </el-link>
              <el-link v-if="data.type === 'func'"
                @click="openRelEntity(node, data, 'batch')">
                <i class="fa fa-fw fa-tasks"></i>
                {{ $t('Show Batches') }}
              </el-link>

              <!-- 前往脚本市场 -->
              <el-tooltip effect="dark" :disabled="!!data.scriptMarketId" :content="$t('The Script Market has been removed')" placement="right">
                <el-link v-if="data.origin === 'scriptMarket' && data.originId"
                  :disabled="!data.scriptMarketId"
                  @click="openEntity(node, data, 'scriptMarket')">
                  <i class="fa fa-fw fa-shopping-cart"></i>
                  {{ $t('Go to Script Market') }}
                </el-link>
              </el-tooltip>
            </div>
          </template>

          <div slot="reference" class="aside-item">
            <!-- 项目内容 -->
            <span :class="{'text-watch': data.origin === 'builtin', 'text-main': data.origin === 'scriptMarket', 'text-bad': data.isPinned}">
              <el-link v-if="data.type === 'refresh'" type="primary">
                <i class="fa fa-fw fa-refresh"></i> {{ $t('Refresh') }}
              </el-link>
              <el-link v-else-if="data.type === 'addScriptSet'" type="primary">
                <i class="fa fa-fw fa-plus"></i> {{ $t('New Script Set') }}
              </el-link>
              <div v-else>
                <template v-if="data.type === 'scriptSet'">
                  <i v-if="data.origin === 'builtin'" class="fa fa-fw fa-microchip"></i>
                  <i v-else-if="data.origin === 'scriptMarket'" class="fa fa-fw fa-shopping-cart"></i>
                  <i v-else class="fa fa-fw" :class="[node.expanded ? 'fa-folder-open':'fa-folder']"></i>
                </template>
                <i v-else-if="data.type === 'script'" class="fa fa-fw fa-file-code-o"></i>
                <el-tag v-else-if="data.type === 'func'" type="info" size="mini"><code>def</code></el-tag>

                <el-tag v-if="data.isCodeEdited"
                  type="danger"
                  size="mini">{{ $t('Edited') }}</el-tag>
                <span>{{ node.label }}</span>
              </div>
            </span>

            <!-- 状态图标 -->
            <div>
              <el-tooltip effect="dark" :content="data.isLockedByOther ? $t('Locked by other user ({user})', { user: data.lockedByUser }) : $t('Locked by you')" placement="top" :enterable="false">
                <i class="fa fa-fw" :class="[ data.isLocked ? 'fa-lock':'', (data.isLockedByOther ? 'text-bad':'text-good') + (data.isLockedByScriptSet ? '-fade text-small':'') ]"></i>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false">
                <i class="fa fa-fw text-bad" :class="[ data.isPinned ? 'fa-thumb-tack':'' ]"></i>
              </el-tooltip>
            </div>
          </div>
        </el-popover>
      </span>
    </el-tree>

    <QuickViewWindow ref="quickViewWindow"></QuickViewWindow>

    <APIExampleDialog ref="apiExampleDialog"
      :showPostExample="true"
      :showPostExampleSimplified="true"
      :showGetExample="true"
      :showGetExampleSimplified="true"></APIExampleDialog>

    <el-dialog
      :visible.sync="showRelEntity"
      width="1050px">
      <div slot="title">
        <FuncInfo
          :id="relEntityFunc.id"
          :title="relEntityFunc.title"
          :definition="relEntityFunc.definition"
          :hideGotoFunc="true"></FuncInfo>
      </div>
      <el-tabs v-model="relEntityTarget">
        <el-tab-pane name="authLink">
          <span slot="label"><i class="fa fa-fw fa-link"></i> {{ $t('Auth Link') }}</span>

          <transition name="fade">
          <el-table
            class="common-table" v-if="showRelEntityData"
            :data="relEntities.authLinks">
            <el-table-column :label="$t('Auth Link')">
              <template slot-scope="scope">
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id"></CopyButton>

                <template v-if="scope.row.note">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                  <span>{{ scope.row.note }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Config')" width="220">
              <template slot-scope="scope">
                <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
                <el-tooltip :content="scope.row.apia_name" :disabled="!!!scope.row.apia_name" placement="right">
                  <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
                </el-tooltip>

                <br>
                <span class="text-info">{{ $t('Expires') }}{{ $t(':') }}</span>
                <span v-if="!scope.row.expireTime">-</span>
                <template v-else>
                  <RelativeDateTime :datetime="scope.row.expireTime"
                    :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'"></RelativeDateTime>
                </template>

                <br>
                <span class="text-info">{{ $t('Throttling') }}{{ $t(':') }}</span>
                <span v-if="T.isNothing(scope.row.throttlingJSON)">-</span>
                <el-tooltip v-else placement="right">
                  <div slot="content">
                    <template v-for="opt in C.AUTH_LINK_THROTTLING">
                      <span v-if="scope.row.throttlingJSON[opt.key]">{{ $tc(opt.name, scope.row.throttlingJSON[opt.key]) }}<br></span>
                    </template>
                  </div>
                  <span class="text-bad">{{ $t('ON') }}</span>
                </el-tooltip>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Status')" width="220">
              <template slot-scope="scope">
                <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
                <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>

                <template v-if="scope.row.lastStartTime">
                  <br>
                  <span v-if="scope.row.lastStatus === 'success'" class="text-good">
                    <i class="fa fa-fw fa-check"></i> {{ $t('lastSucceeded', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else-if="scope.row.lastStatus === 'failure'" class="text-bad">
                    <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else class="text-main">
                    <i class="fa fa-fw fa-clock-o"></i> {{ $t('lastRan', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>

                  <br>
                  <i class="fa fa-fw fa-pie-chart text-info"></i>
                  <span :class="{ 'text-good': !!scope.row.recentSuccessCount }">{{ $t('successCount', { n: T.numberLimit(scope.row.recentSuccessCount) }) }}</span>
                  / <span :class="{ 'text-bad': !!scope.row.recentFailureCount }">{{ $t('failureCount', { n: T.numberLimit(scope.row.recentFailureCount) }) }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column align="right" width="180">
              <template slot="header" slot-scope="scope">
                <el-link type="primary" @click="$router.push({name: 'auth-link-list'})">
                  {{ $t('Auth Link List') }}
                  <i class="fa fa-fw fa-share-square"></i>
                </el-link>
              </template>
              <template slot-scope="scope">
                <el-link :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row, '/api/v1/al/:id')">{{ $t('Example') }}</el-link>
              </template>
            </el-table-column>
          </el-table>
          </transition>
        </el-tab-pane>
        <el-tab-pane name="crontabConfig">
          <span slot="label"><i class="fa fa-fw fa-clock-o"></i> {{ $t('Crontab Config') }}</span>

          <transition name="fade">
          <el-table
            class="common-table" v-if="showRelEntityData"
            :data="relEntities.crontabConfigs">
            <el-table-column :label="$t('Crontab Config')">
              <template slot-scope="scope">
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id"></CopyButton>

                <template v-if="scope.row.note">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                  <span>{{ scope.row.note }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Config')" width="220">
              <template slot-scope="scope">
                <span class="text-info">Crontab{{ $t(':') }}</span>
                <template v-if="scope.row.func_extraConfigJSON && scope.row.func_extraConfigJSON.fixedCrontab">
                  <code class="text-main">{{ scope.row.func_extraConfigJSON.fixedCrontab }}</code>
                  <el-tag size="mini">{{ $t('Fixed') }}</el-tag>
                </template>
                <code v-else-if="scope.row.crontab" class="text-main">{{ scope.row.crontab }}</code>
                <span v-else class="text-bad">{{ $t('Not Set') }}</span>

                <br>
                <span class="text-info">{{ $t('Created') }}{{ $t(':') }}</span>
                <RelativeDateTime :datetime="scope.row.createTime"></RelativeDateTime>

                <br>
                <span class="text-info">{{ $t('Expires') }}{{ $t(':') }}</span>
                <span v-if="!scope.row.expireTime">-</span>
                <template v-else>
                  <RelativeDateTime :datetime="scope.row.expireTime"
                    :class="T.isExpired(scope.row.expireTime) ? 'text-bad' : 'text-good'"></RelativeDateTime>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Status')" width="220">
              <template slot-scope="scope">
                <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
                <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>

                <template v-if="scope.row.lastStartTime">
                  <br>
                  <span v-if="scope.row.lastStatus === 'success'" class="text-good">
                    <i class="fa fa-fw fa-check"></i> {{ $t('lastSucceeded', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else-if="scope.row.lastStatus === 'failure'" class="text-bad">
                    <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else class="text-main">
                    <i class="fa fa-fw fa-clock-o"></i> {{ $t('lastRan', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>

                  <br>
                  <i class="fa fa-fw fa-pie-chart text-info"></i>
                  <span :class="{ 'text-good': !!scope.row.recentSuccessCount }">{{ $t('successCount', { n: T.numberLimit(scope.row.recentSuccessCount) }) }}</span>
                  / <span :class="{ 'text-bad': !!scope.row.recentFailureCount }">{{ $t('failureCount', { n: T.numberLimit(scope.row.recentFailureCount) }) }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column align="right" width="180">
              <template slot="header" slot-scope="scope">
                <el-link type="primary" @click="$router.push({name: 'crontab-config-list'})">
                  {{ $t('Crontab Config List') }}
                  <i class="fa fa-fw fa-share-square"></i>
                </el-link>
              </template>
              <template slot-scope="scope">
                <el-link @click="runCrontabTask(scope.row)" :disabled="!scope.row.func_id">
                  {{ $t('Run') }}
                </el-link>
              </template>
            </el-table-column>
          </el-table>
          </transition>
        </el-tab-pane>

        <el-tab-pane name="batch">
          <span slot="label"><i class="fa fa-fw fa-tasks"></i> {{ $t('Batch') }}</span>

          <transition name="fade">
          <el-table
            class="common-table" v-if="showRelEntityData"
            :data="relEntities.batches">
            <el-table-column :label="$t('Batch')">
              <template slot-scope="scope">
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id"></CopyButton>

                <template v-if="scope.row.note">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                  <span>{{ scope.row.note }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Config')" width="220">
              <template slot-scope="scope">
                <span class="text-info">{{ $t('Auth') }}{{ $t(':') }}</span>
                <el-tooltip :content="scope.row.apia_name" :disabled="!!!scope.row.apia_name" placement="right">
                  <span :class="{ 'text-main': !!scope.row.apia_id }">{{ C.API_AUTH_MAP.get(scope.row.apia_type).name }}</span>
                </el-tooltip>
              </template>
            </el-table-column>

            <el-table-column :label="$t('Status')" width="220">
              <template slot-scope="scope">
                <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
                <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>

                <template v-if="scope.row.lastStartTime">
                  <br>
                  <span v-if="scope.row.lastStatus === 'success'" class="text-good">
                    <i class="fa fa-fw fa-check"></i> {{ $t('lastSucceeded', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else-if="scope.row.lastStatus === 'failure'" class="text-bad">
                    <i class="fa fa-fw fa-times"></i> {{ $t('lastFailed', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>
                  <span v-else class="text-main">
                    <i class="fa fa-fw fa-clock-o"></i> {{ $t('lastRan', { t: T.fromNow(scope.row.lastStartTime) }) }}
                  </span>

                  <br>
                  <i class="fa fa-fw fa-pie-chart text-info"></i>
                  <span :class="{ 'text-good': !!scope.row.recentSuccessCount }">{{ $t('successCount', { n: T.numberLimit(scope.row.recentSuccessCount) }) }}</span>
                  / <span :class="{ 'text-bad': !!scope.row.recentFailureCount }">{{ $t('failureCount', { n: T.numberLimit(scope.row.recentFailureCount) }) }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column align="right" width="180">
              <template slot="header" slot-scope="scope">
                <el-link type="primary" @click="$router.push({name: 'batch-list'})">
                  {{ $t('Batch List') }}
                  <i class="fa fa-fw fa-share-square"></i>
                </el-link>
              </template>
              <template slot-scope="scope">
                <el-link :disabled="T.isNothing(scope.row.func_id)" @click="showAPI(scope.row, '/api/v1/bat/:id')">{{ $t('Example') }}</el-link>
              </template>
            </el-table-column>
          </el-table>
          </transition>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script>
import QuickViewWindow from '@/components/Editor/QuickViewWindow'
import APIExampleDialog from '@/components/APIExampleDialog'

export default {
  name: 'AsideScript',
  components: {
    QuickViewWindow,
    APIExampleDialog,
  },
  watch: {
    $route() {
      this.showPopoverId = null;
    },
    selectFilterText(val) {
      if (!val) return;
      if (!this.$refs.tree) return;

      let node = this.$refs.tree.getNode(val);
      this.openEntity(node, node.data);
    },
    '$store.state.scriptListSyncTime': function() {
      this.loadData();
    },
    expandedNodeMap(val) {
      // 自动记录已展开的节点
      this.$store.commit('updateAsideScript_expandedNodeMap', val);
    },
    relEntityTarget(val) {
      this.showRelEntityData = false;
      this.$nextTick(() => {
        this.showRelEntityData = true;
      });
    },
  },
  methods: {
    doFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectShowOptions = this.selectOptions;
      } else {
        this.selectShowOptions = this.T.searchKeywords(q, this.selectOptions);
      }
    },

    // 展开/收起节点
    onExpandNode(data, node) {
      this.$set(this.expandedNodeMap, data.id, true);
    },
    onCollapseNode(data, node) {
      this.$delete(this.expandedNodeMap, data.id);
    },

    // 选中节点
    selectNode(nodeKey, options) {
      options = options || {};

      if (!this.$refs.tree) return;
      if (!nodeKey) return;

      setImmediate(() => {
        let node = this.$refs.tree.getNode(nodeKey);
        if (!node || !node.data) return;

        // 选中
        this.$refs.tree.setCurrentKey(node.data.id);

        // 展开所有父层
        let parentNode = node.parent;
        while (parentNode) {
          parentNode.expand();
          this.onExpandNode(parentNode.data, parentNode);

          parentNode = parentNode.parent;
        }

        // 展开当前节点
        if (options.expandChildren) {
          node.expand();
          this.onExpandNode(node.data, node);
        }

        setTimeout(() => {
          // 滚动到目标位置
          let $asideContent = document.getElementById('aside-script-content');
          let $target = document.querySelector(`[entry-id="${node.data.id}"]`);
          if (!$target) return;

          let scrollTop = 0;
          let topPadding = 35;
          if ($asideContent.scrollTop + topPadding > $target.offsetTop) {
            scrollTop = $target.offsetTop - topPadding;
          } else if ($asideContent.scrollTop + $asideContent.offsetHeight < $target.offsetTop) {
            scrollTop = $target.offsetTop - $asideContent.offsetHeight + $target.offsetHeight;
          } else {
            return;
          }
          $asideContent.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }, 300);
      });
    },

    async loadData() {
      if (this.T.isNothing(this.data)) {
        this.loading = true;
      }

      // 节点实体表。主要用于判断业务实体是否存在，结构为：{ "<ID>": "scriptSet|script|func" }
      let nodeEntity = {};

      // 脚本集/脚本/函数表。结构为：{ "<ID>": {JSON Data} }
      let scriptSetMap = {};
      let scriptMap    = {};
      let funcMap      = {};

      /***** 脚本集 *****/
      let apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', {
        query: {
          fields: [
            'id',
            'title',
            'description',
            'lockedByUserId',
            'lockedByUserUsername',
            'lockedByUserName',
            'origin',
            'originId',
            'pinTime',
            'smkt_id',
          ]
        },
      });
      if (!apiRes || !apiRes.ok) return;

      apiRes.data.forEach(d => {
        // 记录节点
        nodeEntity[d.id] = 'scriptSet';

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 创建节点数据
        let lockedByUser    = `${d.lockedByUserName || d.lockedByUsername || this.$t('UNKNOW')}`;
        let isLockedByMe    = d.lockedByUserId === this.$store.getters.userId;
        let isLockedByOther = d.lockedByUserId && !isLockedByMe;
        let isEditable      = this.$store.getters.isAdmin || !isLockedByOther;
        let isLocked        = isLockedByMe || isLockedByOther;
        let isPinned        = !!d.pinTime;
        scriptSetMap[d.id] = {
          id             : d.id,
          label          : d.title || d.id,
          type           : 'scriptSet',
          lockedByUser   : lockedByUser,
          isLockedByMe   : isLockedByMe,
          isLockedByOther: isLockedByOther,
          isEditable     : isEditable,
          isLocked       : isLocked,
          isPinned       : isPinned,
          pinTime        : d.pinTime,
          origin         : d.origin,
          originId       : d.originId,
          scriptMarketId : d.smkt_id,

          title      : d.title,
          description: d.description,

          children: [],
        };
        this.T.appendSearchFields(scriptSetMap[d.id], ['id', 'title'])
      });

      /***** 脚本 *****/
      apiRes = await this.T.callAPI_getAll('/api/v1/scripts/do/list', {
        query: {
          fields: [
            'id',
            'title',
            'description',
            'scriptSetId',
            'codeMD5',
            'codeDraftMD5',
            'lockedByUserId',
            'lockedByUserUsername',
            'lockedByUserName',
            'sset_lockedByUserId',
            'sset_lockedByUserUsername',
            'sset_lockedByUserName',
          ]
        },
      });
      if (!apiRes || !apiRes.ok) return;

      window._DFF_scriptIds = [];
      apiRes.data.forEach(d => {
        window._DFF_scriptIds.push(d.id);

        // 记录节点
        nodeEntity[d.id] = 'script';

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 示例代码
        let shortScriptId = d.id.split('__').slice(1).join('__');
        let sampleCode = `import ${d.id} as ${shortScriptId}`;

        // 创建节点数据
        let isCodeEdited   = d.codeMD5 !== d.codeDraftMD5;
        let lockedByUserId = d.sset_lockedByUserId || d.lockedByUserId;
        let lockedByUser   = d.sset_lockedByUserId
                            ? `${d.sset_lockedByUserName || d.sset_lockedByUsername || this.$t('UNKNOW')}`
                            : `${d.lockedByUserName || d.lockedByUsername || this.$t('UNKNOW')}`;
        let isLockedByMe        = lockedByUserId === this.$store.getters.userId;
        let isLockedByOther     = lockedByUserId && !isLockedByMe;
        let isLocked            = isLockedByMe || isLockedByOther;
        let isLockedByScriptSet = isLocked && !!d.sset_lockedByUserId;
        let isEditable          = this.$store.getters.isAdmin || !isLockedByOther;
        scriptMap[d.id] = {
          id                 : d.id,
          scriptSetId        : d.scriptSetId,
          label              : d.title || shortScriptId,
          type               : 'script',
          isCodeEdited       : isCodeEdited,
          lockedByUser       : lockedByUser,
          isLockedByMe       : isLockedByMe,
          isLockedByOther    : isLockedByOther,
          isLocked           : isLocked,
          isLockedByScriptSet: isLockedByScriptSet,
          isEditable         : isEditable,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          children: [],
        };
        this.T.appendSearchFields(scriptMap[d.id], ['id', 'title'])

        // 插入上一层节点"children"
        if (scriptSetMap[d.scriptSetId]) {
          scriptSetMap[d.scriptSetId].children.push(scriptMap[d.id]);
        }
      });

      /***** 函数 *****/
      apiRes = await this.T.callAPI_getAll('/api/v1/funcs/do/list', {
        query: {
          fields: [
            'id',
            'title',
            'description',
            'definition',
            'scriptSetId',
            'scriptId',
            'sset_type',
            'integration',
            'extraConfigJSON',
          ]
        },
      });
      if (!apiRes || !apiRes.ok) return;

      window._DFF_funcIds = [];
      apiRes.data.forEach(d => {
        window._DFF_funcIds.push(d.id);

        // 记录节点
        nodeEntity[d.id] = 'func';

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 示例代码
        let shortScriptId = d.scriptId.split('__').slice(1).join('__');
        let sampleCode = `import ${d.scriptId} as ${shortScriptId}\n${shortScriptId}.${d.definition}`;

        // 创建节点数据
        funcMap[d.id] = {
          id         : d.id,
          scriptSetId: d.scriptSetId,
          scriptId   : d.scriptId,
          label      : d.title || d.id,
          type       : 'func',
          definition : d.definition,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          disabled: !this.$store.state.codeEditor_isCodeLoaded,

          integration    : d.integration,
          extraConfigJSON: d.extraConfigJSON,
        };
        this.T.appendSearchFields(funcMap[d.id], ['id', 'title'])

        // 插入上一层节点"children"
        if (scriptMap[d.scriptId]) {
          scriptMap[d.scriptId].children.push(funcMap[d.id]);
        }
      });

      // 转换为tree数据，并增加「刷新」/「添加脚本集/脚本」项
      let treeData = Object.values(scriptSetMap);
      treeData.forEach(d => {
        d.children.sort(this.T.asideItemSorter);
      })
      treeData.sort(this.T.asideItemSorter);
      treeData.unshift({type: 'addScriptSet'});
      treeData.unshift({type: 'refresh'});

      // 清理无效数据（已经不存在的节点）
      let _d = this.T.jsonCopy(this.$store.state.asideScript_expandedNodeMap);
      for (let nodeId in _d) {
        if (!nodeEntity[nodeId]) delete _d[nodeId];
      }
      this.$store.commit('updateAsideScript_expandedNodeMap', _d);

      // 清理无效数据（代码编辑器中，已经不存在的脚本/无高亮行的脚本）
      _d = this.T.jsonCopy(this.$store.state.codeEditor_highlightedLineConfigMap);
      for (let scriptId in _d) {
        if (!scriptMap[scriptId] || this.T.isNothing(_d[scriptId])) delete _d[scriptId];
      }
      this.$store.commit('updateCodeEditor_highlightedLineConfigMap', _d);

      // 清理无效数据（代码查看器中，已经不存在的脚本/无高亮行的脚本）
      _d = this.T.jsonCopy(this.$store.state.codeViewer_highlightedLineConfigMap);
      for (let scriptId in _d) {
        if (!scriptMap[scriptId] || this.T.isNothing(_d[scriptId])) delete _d[scriptId];
      }
      this.$store.commit('updateCodeViewer_highlightedLineConfigMap', _d);

      // 生成选择器选项
      let selectOptions = [];
      [scriptSetMap, scriptMap, funcMap].forEach(x => {
        let _options = Object.values(x);
        _options.sort(this.T.asideItemSorter);
        selectOptions = selectOptions.concat(_options)
      });

      // 加载数据
      this.loading           = false;
      this.data              = treeData;
      this.selectOptions     = selectOptions;
      this.selectShowOptions = selectOptions;

      // 自动展开
      this.expandedNodeMap = this.$store.state.asideScript_expandedNodeMap || {};
      this.defaultExpandedNodeKeys = Object.keys(this.expandedNodeMap);

      // 自动选择
      this.selectNode(this.$route.params.id);
    },
    async pinData(dataType, dataId, isPinned) {
      let apiPath   = null;
      let okMessage = null;
      switch(dataType) {
        case 'scriptSet':
          apiPath   = '/api/v1/script-sets/:id/do/modify';
          okMessage = isPinned
                    ? this.$t('Script Set pinned')
                    : this.$t('Script Set unpinned');
          break;

        default:
          return;
      }
      let apiRes = await this.T.callAPI('post', apiPath, {
        params: { id: dataId },
        body  : { data: { isPinned: isPinned } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');
    },
    async lockData(dataType, dataId, isLocked) {
      let apiPath   = null;
      let okMessage = null;
      switch(dataType) {
        case 'scriptSet':
          apiPath   = '/api/v1/script-sets/:id/do/modify';
          okMessage = isLocked
                    ? this.$t('Script Set locked')
                    : this.$t('Script Set unlocked');
          break;

        case 'script':
          apiPath   = '/api/v1/scripts/:id/do/modify';
          okMessage = isLocked
                    ? this.$t('Script locked')
                    : this.$t('Script unlocked');
          break;
      }
      let apiRes = await this.T.callAPI('post', apiPath, {
        params: { id: dataId },
        body  : { data: { isLocked: isLocked } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');
    },
    async cloneData(dataId) {
      let promptOpt = {
        inputValidator: v => {
          if (v.length <= 0) {
            return this.$t('Please input ID');
          } else if (v.length > 32) {
            return this.$t('Script Set ID too long');
          } else if (!v.match(/^[a-zA-Z0-9_]*$/g)) {
            return this.$t('Only alphabets, numbers and underscore are allowed');
          } else if (!v.match(/^[^0-9]/g)) {
            return this.$t('Cannot not starts with a number');
          }
          return true;
        }
      }
      let newScriptSetId = await this.T.prompt(this.$t('Please input new Script Set ID'), `${dataId}_2`, promptOpt);
      if (!newScriptSetId) return;

      // 检查重名
      let apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', newScriptSetId);
      if (apiRes.data) {
        return this.T.alert(this.$t('Inputed Script Set ID already exists'));
      }

      // 执行克隆
      apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/clone', {
        params: { id: dataId },
        body  : { newId: newScriptSetId },
        alert : { okMessage: this.$t('Script Set cloned') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');
    },
    showQuickViewWindow(scriptId) {
      this.$refs.quickViewWindow.showWindow(scriptId);
    },

    openEntity(node, data, target) {
      let setCodeLoading = (nextScriptId) => {
        if (this.$route.name === 'code-editor' && this.$route.params.id !== nextScriptId) {
          this.$store.commit('updateCodeEditor_isCodeLoaded', false);
        }
      }

      switch(data.type) {
        // 刷新
        case 'refresh':
          this.loadData();
          break;

        // 「添加脚本集」节点
        case 'addScriptSet':
          this.$router.push({
            name: 'script-set-add',
          });
          break;

        // 脚本集节点
        case 'scriptSet':
          if (target === 'add') {
            // 添加脚本
            this.selectNode(data.id, { expandChildren: true });

            this.$router.push({
              name  : 'script-add',
              params: {id: data.id},
            });

          } else if (target === 'setup') {
            // 打开脚本集配置
            this.selectNode(data.id, { expandChildren: false });

            this.$router.push({
              name  : 'script-set-setup',
              params: {id: data.id},
            });

          } else if (target === 'scriptMarket') {
            // 前往脚本市场
            this.$router.push({
              name  : 'script-market-detail',
              params: {id: data.originId},
            });

          } else {
            // 点击脚本
            this.selectNode(data.id, { expandChildren: true });
          }
          break;

        // 脚本节点
        case 'script':
          if (target === 'setup') {
            // 打开脚本配置
            this.selectNode(data.id, { expandChildren: false });

            this.$router.push({
              name  : 'script-setup',
              params: {id: data.id},
            });

          } else if ((this.$route.name === 'code-viewer' || this.$route.name === 'code-editor')
                && data.id === this.$route.params.id) {
            // 点击当前脚本
            this.selectNode(data.id, { expandChildren: true });

          } else {
            // 点击其他脚本
            this.selectNode(data.id, { expandChildren: true });

            setCodeLoading(data.id);

            this.$router.push({
              name  : 'code-viewer',
              params: {id: data.id},
            });

          }
          break;

        // 函数节点
        case 'func':
          // 高亮选中函数
          this.$store.commit('updateEditor_selectedItemId', data.id);

          if ((this.$route.name === 'code-viewer' || this.$route.name === 'code-editor')
                && data.scriptId === this.$route.params.id) {
            // 点击同一脚本内函数
            this.selectNode(data.id, { expandChildren: false });

          } else {
            // 点击不同脚本下的函数
            this.selectNode(data.id, { expandChildren: false });

            setCodeLoading(data.scriptId);
            this.$router.push({
              name  : 'code-viewer',
              params: {id: data.scriptId},
            });
          }

          break;

        default:
          console.error(`Unexcepted data type: ${data.type}`);
          break;
      }
    },

    async loadRelEntityData(funcId) {
      let apiRes  = null;
      let listOpt = {
        query: {
          _withTaskInfo: true,
          origin       : 'user',
          funcId       : funcId,
          pageSize     : 100,
        }
      };

      // 加载授权链接列表
      apiRes = await this.T.callAPI_get('/api/v1/auth-links/do/list', listOpt);
      if (apiRes.ok) {
        this.relEntities.authLinks = apiRes.data;
      }

      // 加载自动触发配置列表
      apiRes = await this.T.callAPI_get('/api/v1/crontab-configs/do/list', listOpt);
      if (apiRes.ok) {
        this.relEntities.crontabConfigs = apiRes.data;
      }

      // 加载批处理列表
      apiRes = await this.T.callAPI_get('/api/v1/batches/do/list', listOpt);
      if (apiRes.ok) {
        this.relEntities.batches = apiRes.data;
      }
    },
    async openRelEntity(node, data, target) {
      await this.loadRelEntityData(data.id);

      this.relEntityFunc   = data;
      this.relEntityTarget = target;
      this.showRelEntity   = true;
      this.showPopoverId   = null;
    },
    async showAPI(d, urlPattern) {
      // 获取函数详情
      let apiRes = await this.T.callAPI_getOne('/api/v1/funcs/do/list', d.funcId);
      if (!apiRes || !apiRes.ok) return;

      let funcKwargs = apiRes.data.kwargsJSON;

      // 生成API请求示例
      let apiURLExample = this.T.formatURL(urlPattern, {
        baseURL: true,
        params : { id: d.id },
      });

      let funcCallKwargsJSON = {};
      for (let k in d.funcCallKwargsJSON) if (d.funcCallKwargsJSON.hasOwnProperty(k)) {
        if (this.common.isFuncArgumentPlaceholder(d.funcCallKwargsJSON[k])) {
          funcCallKwargsJSON[k] = d.funcCallKwargsJSON[k];
        }
      }
      let apiBodyExample = { kwargs: funcCallKwargsJSON };

      this.$refs.apiExampleDialog.update(apiURLExample, apiBodyExample, funcKwargs);
    },
    async runCrontabTask(d) {
      if (!await this.T.confirm(this.$t('Are you sure you want to send a task of the Crontab Config?'))) return;

      let apiRes = await this.T.callAPI_get('/api/v1/cron/:id', {
        params: { id: d.id },
        alert : { okMessage: this.$t('Crontab Config Task sent') },
      });
    },
  },
  computed: {
    highlightedFuncId() {
      switch(this.$route.name) {
        case 'code-editor':
        case 'code-viewer':
          return this.$store.state.Editor_selectedItemId;

        default:
          return null;
      }
    },
  },
  props: {
  },
  data() {
    return {
      loading: false,
      data   : [],

      selectFilterText : '',
      selectOptions    : [],
      selectShowOptions: [],

      showPopoverId: null,

      // 直接修改el-tree的`default-expanded-keys`参数会导致过渡动画被跳过
      // 因此需要将初始状态单独提取且防止中途修改
      expandedNodeMap        : {},
      defaultExpandedNodeKeys: [],

      showRelEntity    : false,
      showRelEntityData: false,
      relEntityTarget  : '',
      relEntityFunc: {

      },
      relEntities: {
        authLinks     : [],
        crontabConfigs: [],
        batches       : [],
      },
    };
  },
  created() {
    this.loadData();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.goto-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 10px;
}
.goto-links > a {
  font-size: 12px;
  padding-top: 5px;
  display: inline-block;
}
.jump-to-select {
  position: absolute;
  left: 5px;
  right: 9px;
  z-index: 9;
}
.select-item-name {
  float: left;
}
.select-item-id {
  float: right;
  padding-left: 30px;
  font-size: 12px;
}

.aside-tree {
  padding-top: 35px;
}
.aside-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  height: 31px;
}
.aside-tree-node i.fa {
  font-size: 14px;
}
.aside-tip pre {
  padding: 0 0 0 10px;
  margin: 0;
  font-size: 14px;
}
.aside-tree-node-description {

}
.aside-tree-node-sample-code {
  padding-top: 10px;
  text-align: left;
}
.aside-tree-node-quick-view {
  margin-left: 5px;
}

.aside-tree-node > span {
  display: block;
  width: 100%;
}
.aside-item {
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-edited-tip {
  font-size: 14px;
  padding-top: 5px;
  padding-bottom: 5px;
}
.child-nodes-count {
  font-size: 14px;
}

</style>
