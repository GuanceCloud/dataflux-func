<i18n locale="en" lang="yaml">
codeLines: '{n} line | {n} lines'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Script Setup                                                          : 脚本设置
'Script is under editing in other tab, please wait...'                : '其他标签页或窗口正在编辑此脚本，请稍后...'
'Script is under editing in other client, please wait...'             : '其他客户端正在编辑此脚本，请稍后...'
Shortcut                                                              : 快捷键
Select Target                                                         : 选择跳转目标
Download {type}                                                       : 下载{type}
Code Editor setting                                                   : 代码编辑器设置
This is a built-in Script, code will be reset when the system restarts: 这是一个内置脚本，代码会在系统重启后复位
This Script is locked by other user ({user})                          : 当前脚本被其他用户（{user}）锁定
Currently in view mode, click Edit button to enter edit mode          : 当前为查看模式，点击「编辑」按钮进入编辑模式
View Mode                                                             : 查看模式

Published Code  : 已发布的代码
Saved Draft Code: 已保存的草稿代码
</i18n>

<template>
  <transition name="fade-s">
    <el-container v-show="$store.state.isLoaded">
      <!-- 操作区 -->
      <el-header class="code-viewer" style="height: unset !important">
        <div class="code-viewer-action-left">
          <code class="code-viewer-action-title">
            <i class="fa fa-file-code-o"></i>
            {{ data.id }}
            <el-tooltip :content="$t('Script Setup')" placement="bottom" :enterable="false">
              <el-button
                type="text"
                @click.stop="showScriptSetup">
                <i class="fa fa-fw fa-wrench"></i>
              </el-button>
            </el-tooltip>
          </code>
        </div>
        <div class="code-viewer-action-breaker hidden-lg-and-up"></div>
        <div class="code-viewer-action-right">
          <el-form :inline="true">
            <el-form-item v-show="conflictStatus">
              <span class="text-bad" v-if="conflictStatus === 'otherTab'">{{ $t('Script is under editing in other tab, please wait...') }}</span>
              <span class="text-bad" v-else-if="conflictStatus === 'otherClient'">{{ $t('Script is under editing in other client, please wait...') }}</span>
              &#12288;
              &#12288;
            </el-form-item>

            <el-form-item>
              <el-select
                style="width: 150px"
                popper-class="code-font"
                v-model="selectedItemId"
                size="mini"
                filterable
                :placeholder="$t('Select Target')">
                <el-option v-for="item in selectableItems" :key="item.id" :label="item.name" :value="item.id">
                  <el-tag v-if="item.type === 'todo'"
                    size="mini"
                    class="select-todo-tag" :type="C.TODO_TYPE_MAP.get(item.todoType).tagType">
                    <i class="fa fa-fw" :class="C.TODO_TYPE_MAP.get(item.todoType).icon"></i>
                    {{ item.todoType }}
                  </el-tag>
                  <el-tag v-else class="select-item-tag" type="info" size="mini">{{ item.type }}</el-tag>
                  {{ item.name }}
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item v-if="!conflictStatus">
              <el-tooltip placement="bottom" :enterable="false">
                <div slot="content">
                  {{ $t('Shortcut') }}{{ $t(':') }}<kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>E</kbd>
                </div>
                <el-button
                  @click="startEdit"
                  type="primary" plain
                  size="mini">
                  <i class="fa fa-fw" :class="[C.CODE_VIEWR_USER_OPERATION_MAP.get(userOperation).icon]"></i> {{ C.CODE_VIEWR_USER_OPERATION_MAP.get(userOperation).name }}</el-button>
              </el-tooltip>
            </el-form-item>

            <el-form-item>
              <el-radio-group v-model="showMode" size="mini">
                <el-tooltip placement="bottom" v-for="mode, i in C.CODE_VIEWER_SHOW_MODE" :key="mode.key" :enterable="false">
                  <div slot="content">
                    {{ $t('Shortcut') }}{{ $t(':') }}<kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>{{ i + 1 }}</kbd>
                  </div>
                  <el-radio-button :label="mode.key">{{ mode.name }}</el-radio-button>
                </el-tooltip>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-tooltip :content="$t('Download')" placement="bottom" :enterable="false">
                <el-button v-prevent-re-click @click="download" plain size="mini">{{ $t('Download {type}', { type: C.CODE_VIEWER_SHOW_MODE_MAP.get(showMode).name } ) }}</el-button>
              </el-tooltip>
            </el-form-item>

            <el-form-item>
              <el-tooltip :content="$t('Code Editor setting')" placement="bottom" :enterable="false">
                <el-button
                  @click="$refs.codeEditorSetting.open()"
                  plain
                  size="mini"><i class="fa fa-fw fa-cog"></i></el-button>
              </el-tooltip>
            </el-form-item>
          </el-form>
        </div>

        <InfoBlock v-if="isLockedByOther" :type="isEditable ? 'warning' : 'error'" :title="$t('This Script is locked by other user ({user})', { user: lockedByUser })" />
        <InfoBlock v-else-if="data.sset_origin === 'builtin'" type="warning" :title="$t('This is a built-in Script, code will be reset when the system restarts')" />
        <InfoBlock v-else type="warning" :title="$t('Currently in view mode, click Edit button to enter edit mode')" />
      </el-header>

      <!-- 代码区 -->
      <el-main id="editorContainer_CodeViewer" :style="$store.getters.codeMirrorSettings.style">
        <textarea id="editor_CodeViewer"></textarea>
        <h1 id="viewModeHint">{{ $t('View Mode') }}</h1>
      </el-main>

      <CodeEditorSetting :codeMirror="codeMirror" ref="codeEditorSetting" />
      <ScriptSetup ref="setup" />
    </el-container>
  </transition>
</template>

<script>
// @ is an alias to /src
import CodeEditorSetting from '@/components/Development/CodeEditorSetting'

import { createPatch } from 'diff'
import FileSaver from 'file-saver';

import ScriptSetup from '@/components/Development/ScriptSetup'

export default {
  name: 'CodeViewer',
  components: {
    CodeEditorSetting,

    ScriptSetup,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    showMode(val) {
      this.loadData();
    },
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
    selectedItemId(val) {
      this.$store.commit('updateEditor_selectedItemId', val);
      this.highlightQuickSelectItem();
    },
    '$store.state.Editor_selectedItemId'(val) {
      if (this.selectedItemId !== val) {
        this.selectedItemId = val;
      }
    },
    '$store.state.shortcutAction'(val) {
      switch(val.action) {
        case 'codeViewer.showDraft':
          this.showMode = 'draft';
          break;

        case 'codeViewer.showPublished':
          this.showMode = 'published';
          break;

        case 'codeViewer.showDiff':
          this.showMode = 'diff';
          break;

        case 'codeViewer.enterEditor':
          if (!this.conflictStatus) {
            this.startEdit();
          }
          break;
      }
    },
  },
  methods: {
    async loadData() {
      let apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', this.$route.params.id, {
        query: { _withCode: true, _withCodeDraft: true },
      });
      if (!apiRes.ok || !apiRes.data) {
        // 获取脚本失败则跳回简介页面
        this.$router.push({
          name: 'intro',
        });
        return;
      };

      this.data = apiRes.data;

      // 计算状态栏数据
      let diffInfo = this.T.getDiffInfo(this.data.code, this.data.codeDraft);
      this.diffAddedCount   = diffInfo.addedCount;
      this.diffRemovedCount = diffInfo.removedCount;

      this.$store.commit('updateLoadStatus', true);

      setImmediate(() => {
        // 载入代码
        this.codeMirror.setValue('');
        switch(this.showMode) {
          case 'draft':
          case 'published':
            let codeField = this.C.CODE_VIEWER_SHOW_MODE_MAP.get(this.showMode).codeField;

            this.codeMirror.setValue(this.data[codeField] || '');
            this.T.setCodeMirrorMode(this.codeMirror, 'python');
            break;

          case 'diff':
            let fileTitle = this.data.title ? ` (${this.data.title})` : '';
            let fileName  = `${this.scriptId}${fileTitle}`;
            let oldStr    = this.data.code      || '';
            let newStr    = this.data.codeDraft || '';
            let oldHeader = this.$t('Published Code');
            let newHeader = this.$t('Saved Draft Code');
            let diffPatch = createPatch(fileName, oldStr, newStr, oldHeader, newHeader);

            this.codeMirror.setValue(diffPatch);
            this.T.setCodeMirrorMode(this.codeMirror, 'diff');
            break;
        }
        this.codeMirror.refresh();
        this.codeMirror.focus();

        // 更新函数列表
        this.updateSelectableItems();

        if (this.$store.state.Editor_selectedItemId) {
          // 选中函数定位
          this.selectedItemId = this.$store.state.Editor_selectedItemId;
          this.highlightQuickSelectItem();
        } else {
          // 上次活跃位置定位
          let cursor = this.$store.state.Editor_scriptCursorMap[this.scriptId];
          this.T.jumpToCodeMirrorLine(this.codeMirror, cursor);
        }

        this.isReady = true;
      });
    },
    startEdit() {
      this.$router.push({
        name  : 'code-editor',
        params: {id: this.data.id},
      });
    },
    updateSelectableItems() {
      this.selectableItems = this.common.getPythonCodeItems(this.data.codeDraft, this.scriptId);
    },
    _clearLineHighlight(line) {
      try {
        this.codeMirror.removeLineClass(line, 'text');
        this.codeMirror.removeLineClass(line, 'background');
        this.codeMirror.removeLineClass(line, 'wrap');

        let widgets = this.codeMirror.lineInfo(line).widgets;
        if (Array.isArray(widgets)) {
          widgets.forEach((w) => {
            w.clear();
          });
        }

      } catch(err) {
        // 忽略
      }
    },
    _setLineHighlight(options) {
      if (!this.codeMirror) return null;

      options = options || {};

      // 添加样式
      if (options.textClass) {
        this.codeMirror.addLineClass(options.line, 'text', options.textClass);
      }
      if (options.backgroundClass) {
        this.codeMirror.addLineClass(options.line, 'background', options.backgroundClass);
      }
      if (options.wrapClass) {
        this.codeMirror.addLineClass(options.line, 'wrap', options.wrapClass);
      }

      // 添加额外内容
      if (options.lineWidgetConfig) {
        let config = options.lineWidgetConfig;

        let div = null;
        switch(config.type) {
        }

        if (div) {
          this.codeMirror.addLineWidget(options.line, div);
        }
      }

      // 跳转位置
      this.T.jumpToCodeMirrorLine(this.codeMirror, options.line);

      return this.codeMirror.lineInfo(options.line);
    },
    updateHighlightLineConfig(key, config) {
      let nextHighlightedLineConfigMap = this.T.jsonCopy(this.$store.state.codeViewer_highlightedLineConfigMap) || {};

      if (config === null) {
        // 清除高亮
        if (nextHighlightedLineConfigMap[this.scriptId]) {
          delete nextHighlightedLineConfigMap[this.scriptId][key];
        }

      } else {
        // 设置高亮
        if (!nextHighlightedLineConfigMap[this.scriptId]) {
          nextHighlightedLineConfigMap[this.scriptId] = {};
        }
        nextHighlightedLineConfigMap[this.scriptId][key] = config;
      }

      if (!this.codeMirror) return;

      // 旧高亮全部去除
      for (let scriptId in this.highlightedLineInfoMap) if (this.highlightedLineInfoMap.hasOwnProperty(scriptId)) {
        let lineInfoMap = this.highlightedLineInfoMap[scriptId];
        for (let key in lineInfoMap) if (lineInfoMap.hasOwnProperty(key)) {
          let lineInfo = lineInfoMap[key];
          this._clearLineHighlight(lineInfo.handle.lineNo());
        }
      }

      // 重新添加高亮
      let nextHighlightedInfoMap = {};
      let configMap = nextHighlightedLineConfigMap[this.scriptId] || {};
      for (let key in configMap) if (configMap.hasOwnProperty(key)) {
        let config = configMap[key];
        let lineInfo = this._setLineHighlight(config);
        if (lineInfo) {
          if (!nextHighlightedInfoMap[this.scriptId]) {
            nextHighlightedInfoMap[this.scriptId] = {};
          }
          nextHighlightedInfoMap[this.scriptId][key] = lineInfo;
        }
      }
      this.highlightedLineInfoMap = nextHighlightedInfoMap;

      this.$store.commit('updateCodeViewer_highlightedLineConfigMap', nextHighlightedLineConfigMap);
    },
    highlightQuickSelectItem() {
      if (!this.$store.state.isLoaded) return;
      if (!this.codeMirror) return;
      if (!this.selectedItem) return;

      // 清除之前选择
      this.updateHighlightLineConfig('selectedFuncLine', null);

      // 定位到选择行
      this.updateHighlightLineConfig('selectedFuncLine', {
        line           : this.selectedItem.line,
        marginType     : 'next',
        textClass      : 'highlight-text',
        backgroundClass: 'current-func-background highlight-code-line-blink',
      });
    },
    download() {
      let blob = new Blob([this.codeMirror.getValue()], {type: 'text/plain'});

      let fileName = null;
      switch(this.showMode) {
        case 'draft':
          fileName = this.data.id + '.draft.py';
          break;

        case 'published':
          fileName = this.data.id + '.py';
          break;

        case 'diff':
          fileName = this.data.id + '.py.diff';
          break;
      }
      FileSaver.saveAs(blob, fileName);
    },
    showSetup() {
      this.$refs.setup.loadData(this.scriptSetId, this.scriptId);
    },
  },
  computed: {
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    scriptId() {
      return this.$route.params.id;
    },
    scriptSetId() {
      return this.scriptId.split('__')[0];
    },
    conflictStatus() {
      return this.$store.getters.getConflictStatus(this.$route);
    },

    lockedByUserId() {
      return this.data.sset_lockedByUserId || this.data.lockedByUserId;
    },
    lockedByUser() {
      if (this.data.sset_lockedByUserId) {
        return `${this.data.sset_lockedByUserName || this.data.sset_lockedByUsername}`
      } else if (this.data.lockedByUserId) {
        return `${this.data.lockedByUserName || this.data.lockedByUsername}`
      }
    },
    isLockedByMe() {
      return this.lockedByUserId === this.$store.getters.userId
    },
    isLockedByOther() {
      return this.lockedByUserId && !this.isLockedByMe;
    },
    isEditable() {
      // 超级管理员不受限制
      if (this.$store.getters.isAdmin) return true;
      return !this.isLockedByOther;
    },

    userOperation() {
      return this.isEditable ? 'edit' : 'debug';
    },
    codeLines() {
      return (this.data.code || '').split('\n').length;
    },
    codeDraftLines() {
      return (this.data.codeDraft || '').split('\n').length;
    },

    selectedItem() {
      if (!this.selectedItemId) return null;

      for (let i = 0; i < this.selectableItems.length; i++) {
        let _item = this.selectableItems[i];
        if (_item.id === this.selectedItemId) {
          return _item;
        }
      }
    },
  },
  props: {
  },
  data() {
    return {
      isReady: false,
      codeMirror: null,

      highlightedLineInfoMap: {},

      data: {},

      selectableItems: [],
      selectedItemId : '',

      showMode: 'draft', // 'draft|published|diff'

      // DIFF信息
      diffAddedCount  : 0,
      diffRemovedCount: 0,
    }
  },
  mounted() {
    setImmediate(() => {
      // 初始化编辑器
      this.codeMirror = this.T.initCodeMirror('editor_CodeViewer');
      this.codeMirror.setOption('theme', this.codeMirrorTheme);
      this.codeMirror.on('cursorActivity', () => {
        if (!this.isReady) return;

        let cursorInfo = {
          scriptId: this.scriptId,
          cursor  : this.codeMirror.getCursor(),
        };
        this.$store.commit('updateEditor_scriptCursorMap', cursorInfo);
      });

      this.T.setCodeMirrorReadOnly(this.codeMirror, true);
    });
  },
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.select-todo-tag {
  width: 62px;
  text-align: left;
}
.select-item-tag {
  width: 42px;
  text-align: center;
}
#editor_CodeViewer {
  display: none;
}
.el-header {
  box-shadow: 5px 5px 5px lightgrey;
  z-index: 5;
}
.code-viewer {
  padding-right: 5px;
}
.code-viewer-action-title {
  font-size: 22px;
}
.code-viewer-action-title i.fa {
  font-size: 18px;
}
.code-viewer-action-left {
  margin-top: 5px;
  height: 48px;
  position: absolute;
  background-image: linear-gradient(to left, rgba(255, 255,255, 0) 0%, white 2%);
  padding-right: 25px;
}
.code-viewer-action-left:hover {
  z-index: 1;
}
.code-viewer-action-breaker {
  height: 50px;
}
.code-viewer-action-right {
  float: right;
  margin-top: 5px;
  height: 48px;
  background-image: linear-gradient(to right, rgba(255, 255,255, 0) 0%, white 2%);
  padding-left: 10px;
  position: relative;
  white-space: nowrap;
}
</style>
<style>
.code-viewer-action-right .el-radio-group,
.code-viewer-action-right .el-button-group {
  position: relative;
  top: -0.5px;
}
#viewModeHint {
  position: absolute;
  right: 30px;
  top: 0px;
  font-size: 30px;
  color: grey;
  border: 1px solid darkgray;
  padding: 0 10px;
  border-radius: 5px;
  z-index: 10;
  background-color: #eee;
}
#editorContainer_CodeViewer {
  padding: 1px 0 0 5px;
  position: relative;
}
#editorContainer_CodeViewer .CodeMirror {
  height: 100% !important;
  position: absolute !important;
  top: 0;
  left: 5px;
  right: 0;
}
#editorContainer_CodeViewer .CodeMirror-wrap {
  border: none !important;
}
.CodeMirror .highlight-text {
  text-shadow: 1px 1px 3px #b3b3b3;
}

.CodeMirror .current-func-background {
  border: 2px solid;
  border-image: linear-gradient(to right, rgb(255,165,0,1) 30%, rgb(255,165,0,0) 100%) 1 1;
  background-image: linear-gradient(to right, rgba(255,255,224,1) 0, rgba(255,255,224,0) 75%);
  border-right: none;
}

.code-viewer-status-bar {
  position: fixed;
  bottom: 5px;
  right: 12px;
  z-index: 100;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid darkgrey;
  color: grey;
}
.code-viewer-status-bar span {
  font-family: Iosevka;
  font-size: 12px;
}
</style>
