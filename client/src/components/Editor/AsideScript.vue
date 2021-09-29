<i18n locale="zh-CN" lang="yaml">
filter content                                 : 过滤内容
Refresh                                        : 刷新列表
Add Script                                     : 添加脚本
Add Script Set                                 : 添加脚本集
Edited                                         : 已修改
Builtin                                        : 内置
Locked by someone else                         : 被其他人锁定
Locked by you                                  : 被您锁定
Quick View Panel                               : 快速查看面板
View                                           : 查看
Setup                                          : 配置
Copy example                                   : 复制示例
Copy {name} ID                                 : 复制{name}ID
Example                                        : 示例
Code edited but not published yet              : 代码已修改但尚未发布
'Import/Calling will run the published version': 引用/API调用实际将运行已发布代码
Open Quick View Panel                          : 打开快速预览面板

Script Set {id}: 脚本集 {id}
Script {id}    : 脚本 {id}
</i18n>

<template>
  <div>
    <el-input :placeholder="$t('filter content')" size="small" :clearable="true" v-model="filterText">
      <el-button slot="prefix" type="text"></el-button>
    </el-input>

    <el-tree
      v-loading="loading"
      :data="data"
      :filter-node-method="filterNode"
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

        <span>
          <el-link v-if="data.type === 'refresh'" type="primary" :underline="false">
            <i class="fa fa-fw fa-refresh"></i> {{ $t('Refresh') }}
          </el-link>
          <el-link v-else-if="data.type === 'addScriptSet'" type="primary" :underline="false">
            <i class="fa fa-fw fa-plus"></i> {{ $t('Add Script Set') }}
          </el-link>
          <div v-else>
            <i v-if="data.type === 'scriptSet'" class="fa fa-fw" :class="[node.expanded ? 'fa-folder-open-o':'fa-folder-o']"></i>
            <i v-else-if="data.type === 'script'" class="fa fa-fw fa-file-code-o"></i>
            <el-tag v-else-if="data.type === 'func'" type="info" size="mini"><code>def</code></el-tag>

            <span>
              <el-tag v-if="data.isCodeEdited"
                type="danger"
                size="mini">{{ $t('Edited') }}</el-tag>
              <el-tag v-if="data.isBuiltin"
                effect="dark"
                type="warning"
                size="mini">{{ $t('Builtin') }}</el-tag>
              <span :class="{'text-watch': data.isBuiltin}">{{ node.label }}</span>
              <span class="child-nodes-count" v-if="data.childrenCount">&nbsp;({{ data.childrenCount}})</span>
            </span>
          </div>
        </span>

        <div>
          <el-tooltip effect="dark" :content="data.isLockedByOther ? $t('Locked by someone else') : $t('Locked by you')" placement="top" :enterable="false">
            <i v-if="data.isLocked" class="fa fa-fw fa-lock" :class="data.isLockedByOther ? 'text-bad' : 'text-good'"></i>
          </el-tooltip>

          <el-tooltip v-if="data.type === 'scriptSet'" effect="dark" :content="$t('Add Script')" placement="top" :enterable="false">
            <span>
              <el-button
                type="text"
                @click.stop="openEntity(node, data, 'add')">
                <i class="fa fa-fw fa-plus text-main"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip effect="dark" :content="$t('Quick View Panel')" placement="top" :enterable="false">
            <span>
              <el-button v-if="data.type === 'script'"
                type="text"
                @click.stop="showQuickViewWindow(data.id)">
                <i class="fa fa-fw fa-window-restore text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip effect="dark" :content="data.isLockedByOther ? $t('View') : $t('Setup')" placement="top" :enterable="false">
            <span>
              <el-button v-if="data.type === 'scriptSet'"
                type="text"
                @click.stop="openEntity(node, data, 'setup')">
                <i v-if="data.isLockedByOther" class="fa fa-fw fa-search text-info"></i>
                <i v-else class="fa fa-fw fa-wrench text-info"></i>
              </el-button>

              <el-button v-if="data.type === 'script'"
                type="text"
                @click.stop="openEntity(node, data, 'setup')">
                <i v-if="data.isLockedByOther" class="fa fa-fw fa-search text-info"></i>
                <i v-else class="fa fa-fw fa-wrench text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-popover v-if="data.id"
            placement="right-start"
            trigger="click"
            popper-class="aside-tip"
            :value="showPopoverId === data.id">

            <div class="aside-tree-node-description">
              <code v-if="data.title">{{ data.title }} (ID: {{ data.id }})</code>
              <code v-else>{{ data.id }}</code>
              <pre v-if="data.description">{{ data.description }}</pre>
            </div>

            <template v-if="data.sampleCode">
              <div class="aside-tree-node-sample-code">
                {{ $t('Example') }}{{ $t(':') }}
                <pre>{{ data.sampleCode }}</pre>
              </div>
            </template>

            <br><CopyButton
              :title="$t('Copy {name} ID', { name: C.ASIDE_ITEM_TYPE_MAP.get(data.type).name })"
              :content="data.id"></CopyButton>
            <br><CopyButton v-if="data.sampleCode"
              :title="$t('Copy example')"
              :content="data.sampleCode"></CopyButton>
            <br><el-button v-if="data.type === 'script'"
              class="aside-tree-node-quick-view"
              type="text"
              @click.stop="showQuickViewWindow(data.id)">
              <i class="fa fa-fw fa-window-restore"></i> {{ $t('Open Quick View Panel') }}
            </el-button>

            <template v-if="data.isCodeEdited">
              <div class="code-edited-tip">
                <span class="text-bad">{{ $t('Code edited but not published yet') }}<br>{{ $t('Import/Calling will run the published version') }}</span>
              </div>
            </template>

            <el-button slot="reference"
              type="text"
              @click.stop="showPopover(data.id)">
              <i class="fa fa-fw fa-question-circle"></i>
            </el-button>
          </el-popover>
        </div>
      </span>
    </el-tree>

    <QuickViewWindow ref="quickViewWindow"></QuickViewWindow>
  </div>
</template>

<script>
import QuickViewWindow from '@/components/Editor/QuickViewWindow'

export default {
  name: 'AsideScript',
  components: {
    QuickViewWindow,
  },
  watch: {
    $route() {
      this.showPopoverId = null;
    },
    filterText(val) {
      this.$refs.tree.filter(val);
    },
    '$store.state.scriptListSyncTime': function() {
      this.loadData();
    },
    expandedNodeMap(val) {
      // 自动记录已展开的节点
      this.$store.commit('updateAsideScript_expandedNodeMap', val);
    },
    highlightedFuncId(val) {
      // 自动选中函数
      this.$refs.tree.setCurrentKey(val);
    },
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true;
      if (['addScriptSet', 'refresh'].indexOf(data.type) >= 0) return true;

      let targetValue = ('' + value).toLowerCase();
      let searchTEXT  = ('' + data.searchTEXT).toLowerCase();

      if (targetValue === '+') {
        return data.isCodeEdited;
      }

      return searchTEXT.indexOf(targetValue) >= 0;
    },
    onExpandNode(data, node) {
      this.$set(this.expandedNodeMap, data.id, true);
    },
    onCollapseNode(data, node) {
      this.$delete(this.expandedNodeMap, data.id);
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

      let pushedScriptMap = {};
      let pushedFuncMap   = {};

      /***** 脚本集 *****/
      let apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', {
        query: { fields: ['id', 'title', 'description', 'isLocked', 'lockedByUserId', 'isBuiltin'] },
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        // 记录节点
        nodeEntity[d.id] = 'scriptSet';

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 创建节点数据
        let isLockedByOther = d.lockedByUserId && d.lockedByUserId !== this.$store.getters.userId;
        scriptSetMap[d.id] = {
          id             : d.id,
          label          : d.title || d.id,
          type           : 'scriptSet',
          isLocked       : d.isLocked,
          isLockedByOther: isLockedByOther,
          isBuiltin      : d.isBuiltin,
          searchTEXT     : `${d.title} ${d.id}`,

          title      : d.title,
          description: d.description,

          children: [],
        };
      });

      /***** 脚本 *****/
      apiRes = await this.T.callAPI_getAll('/api/v1/scripts/do/list', {
        query: { fields: ['id', 'title', 'description', 'scriptSetId', 'codeMD5', 'codeDraftMD5', 'isLocked', 'lockedByUserId', 'sset_lockedByUserId'] },
      });
      if (!apiRes.ok) return;

      window._DFF_scriptIds = [];
      apiRes.data.forEach(d => {
        window._DFF_scriptIds.push(d.id);

        // 记录节点
        nodeEntity[d.id] = 'script';

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 状态
        let isCodeEdited = d.codeMD5 !== d.codeDraftMD5;
        let isLockedByOther = d.lockedByUserId && d.lockedByUserId !== this.$store.getters.userId
                            || d.sset_lockedByUserId && d.sset_lockedByUserId !== this.$store.getters.userId;

        // 示例代码
        let shortScriptId = d.id.split('__').slice(1).join('__');
        let sampleCode = `import ${d.id} as ${shortScriptId}`;

        // 创建节点数据
        scriptMap[d.id] = {
          id             : d.id,
          scriptSetId    : d.scriptSetId,
          label          : d.title || d.id,
          type           : 'script',
          isLocked       : d.isLocked,
          isCodeEdited   : isCodeEdited,
          isLockedByOther: isLockedByOther,
          searchTEXT     : `${d.title} ${d.id}`,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          children: [],
        };

        // 插入上一层节点"children"
        if (scriptSetMap[d.scriptSetId]) {
          scriptSetMap[d.scriptSetId].children.push(scriptMap[d.id]);
        }
      });

      /***** 函数 *****/
      apiRes = await this.T.callAPI_getAll('/api/v1/funcs/do/list', {
        query: { fields: ['id', 'title', 'description', 'definition', 'scriptSetId', 'scriptId', 'sset_type', 'integration', 'extraConfigJSON'] },
      });
      if (!apiRes.ok) return;

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
          searchTEXT: `${d.title} ${d.id}`,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          disabled: !this.$store.state.codeEditor_isCodeLoaded,

          integration    : d.integration,
          extraConfigJSON: d.extraConfigJSON,
        };

        // 插入上一层节点"children"
        if (scriptMap[d.scriptId]) {
          scriptMap[d.scriptId].children.push(funcMap[d.id]);
        }
      });

      // 转换为tree数据，并增加「刷新」/「添加脚本集/脚本」项
      let treeData = Object.values(scriptSetMap);
      treeData.forEach(d => {
        if (!this.T.isNothing(d.children)) {
          d.childrenCount = d.children.filter(x => x.type === 'script').length;
        }
        d.children.sort(this.T.asideItemSorter);

        d.children.forEach(dd => {
          if (!this.T.isNothing(dd.children)) {
            dd.childrenCount = dd.children.filter(x => x.type === 'func').length;
          }
        });
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

      // 加载数据
      this.loading = false;
      this.data = treeData;

      // 自动展开
      this.expandedNodeMap = this.$store.state.asideScript_expandedNodeMap || {};
      this.defaultExpandedNodeKeys = Object.keys(this.expandedNodeMap);

      setImmediate(() => {
        if (!this.$refs.tree) return;

        // 自动选中
        this.$refs.tree.setCurrentKey(this.$store.state.asideScript_currentNodeKey || null);
      });

      setTimeout(() => {
        if (!this.$refs.tree) return;

        // 滚动到目标位置
        let entryId = this.$refs.tree.getCurrentKey();
        if (entryId) {
          let $asideContent = document.getElementById('pane-aside-script').parentElement;
          let $target = document.querySelector(`[entry-id="${entryId}"]`);

          let scrollTop = $target.offsetTop - $asideContent.offsetHeight / 2 + 100;
          $asideContent.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 500);
    },
    showQuickViewWindow(scriptId) {
      this.$refs.quickViewWindow.showWindow(scriptId);
    },
    showPopover(id) {
      setImmediate(() => {
        this.showPopoverId = id;
      })
    },
    expandNode(nodeKey) {
      this.$set(this.expandedNodeMap, nodeKey, true);

      setImmediate(() => {
        this.$refs.tree.getNode(nodeKey).expanded = true;
      });
    },
    openEntity(node, data, target) {
      if (target === 'setup') {
        this.$refs.tree.setCurrentKey(data.id);
      }

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
            // 只有点击「添加」按钮才跳转
            this.$router.push({
              name  : 'script-add',
              params: {id: data.id},
            });

          } else if (target === 'setup') {
            // 只有点击「配置」按钮才跳转
            this.$router.push({
              name  : 'script-set-setup',
              params: {id: data.id},
            });
          }

          this.expandNode(data.id);
          break;

        // 脚本节点
        case 'script':
          if (target === 'setup') {
            // 只有点击「配置」按钮才跳转
            this.$router.push({
              name  : 'script-setup',
              params: {id: data.id},
            });

          } else if ((this.$route.name === 'code-viewer' || this.$route.name === 'code-editor')
                && data.id === this.$route.params.id) {
            // 点击同一脚本项目，无处理

          } else {
            // 跳转至代码查看器
            setCodeLoading(data.id);

            this.$router.push({
              name  : 'code-viewer',
              params: {id: data.id},
            });

            this.expandNode(data.id);
          }
          break;

        // 函数节点
        case 'func':
          setCodeLoading(data.scriptId);

          if ((this.$route.name === 'code-viewer' || this.$route.name === 'code-editor')
                && data.scriptId === this.$route.params.id) {
            // 同一脚本内切换函数，无处理

          } else {
            // 不同脚本切换，进入查看模式
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

      this.$store.commit('updateAsideScript_currentNodeKey', data.id);
      this.$store.commit('updateEditor_highlightedFuncId', data.type === 'func' ? data.id : null);
    },
  },
  computed: {
    highlightedFuncId() {
      switch(this.$route.name) {
        case 'code-editor':
        case 'code-viewer':
          return this.$store.state.Editor_highlightedFuncId;

        default:
          return null;
      }
    },
  },
  props: {
  },
  data() {
    return {
      loading   : false,
      filterText: '',
      data      : [],

      // 直接修改el-tree的`default-expanded-keys`参数会导致过渡动画被跳过
      // 因此需要将初始状态单独提取且防止中途修改
      expandedNodeMap        : {},
      defaultExpandedNodeKeys: [],

      showPopoverId: null,
    };
  },
  created() {
    this.loadData();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
  color: grey;
}
.aside-tree-node-quick-view {
  margin-left: 5px;
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
