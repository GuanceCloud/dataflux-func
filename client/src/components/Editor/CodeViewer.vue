<i18n locale="en" lang="yaml">
codeLines: '{n} line | {n} lines'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Script Setup                                                         : 脚本设置
'Other user or window are editing this Script, please wait...'       : '其他用户或窗口正在编辑此脚本，请稍后...'
'Shortcut:'                                                          : 快捷键：
Select Func                                                          : 选择聚焦函数
Draft                                                                : 草稿
Published                                                            : 已发布
DIFF                                                                 : 差异
Download {type}                                                      : 下载{type}
Setup Code Editor                                                    : 调整编辑器显示样式
This is a builtin Script, code will be reset when the system restarts: 这是一个内置脚本，代码会在系统重启后复位
This Script has been locked by other, editing is disabled            : 当前脚本被其他用户锁定，无法修改
Currently in view mode, click Edit button to enter edit mode         : 当前为查看模式，点击「编辑」按钮进入编辑模式
View Mode                                                            : 查看模式

Published Code  : 已发布的代码
Saved Draft Code: 已保存的草稿代码
</i18n>

<template>
  <transition name="fade">
    <el-container>
      <!-- 操作区 -->
      <el-header class="code-viewer" style="height: unset !important">
        <div class="code-viewer-action-left">
          <code class="code-viewer-action-title">
            <i class="fa fa-file-code-o"></i>
            {{ data.id }}
            <el-tooltip :content="$t('Script Setup')" placement="bottom" :enterable="false">
              <el-button
                type="text"
                @click.stop="$router.push({name: 'script-setup', params: {id: data.id}})">
                <i v-if="!isLockedByOther" class="fa fa-fw fa-wrench"></i>
                <i v-else class="fa fa-fw fa-search"></i>
              </el-button>
            </el-tooltip>
          </code>
        </div>
        <div class="code-viewer-action-breaker hidden-lg-and-up"></div>
        <div class="code-viewer-action-right">
          <el-form :inline="true">
            <el-form-item v-show="isConflict">
              <el-link type="danger" :underline="false">{{ $t('Other user or window are editing this Script, please wait...') }}</el-link>
              &#12288;
              &#12288;
            </el-form-item>

            <el-form-item v-if="!isConflict">
              <el-tooltip placement="bottom" :enterable="false">
                <div slot="content">
                  {{ $t('Shortcut:') }} <code>{{ T.getSuperKeyName() }} + E</code>
                </div>
                <el-button
                  @click="startEdit"
                  type="primary" plain
                  size="mini">
                  <i class="fa fa-fw" :class="[USER_OPERATION_META_MAP[userOperation].icon]"></i> {{ USER_OPERATION_META_MAP[userOperation].text }}</el-button>
              </el-tooltip>
            </el-form-item>

            <el-form-item>
              <el-select
                style="width: 150px"
                v-model="selectedFuncId"
                size="mini"
                filterable
                :placeholder="$t('Select Func')">
                <el-option v-for="f in draftFuncs" :key="f.id" :label="f.name" :value="f.id">
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item v-if="!isLockedByOther">
              <el-radio-group v-model="showMode" size="mini">
                <el-tooltip placement="bottom" v-for="meta, k, i in SHOW_MODE_META_MAP" :key="k" :enterable="false">
                  <div slot="content">
                    {{ $t('Shortcut:') }} <code>{{ T.getSuperKeyName() }} + {{ i + 1 }}</code>
                  </div>
                  <el-radio-button :label="k">{{ meta.text }}</el-radio-button>
                </el-tooltip>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="!isLockedByOther">
              <el-tooltip :content="$t('Download')" placement="bottom" :enterable="false">
                <el-button @click="download" plain size="mini">{{ $t('Download {type}', { type: SHOW_MODE_META_MAP[showMode].text } ) }}</el-button>
              </el-tooltip>
            </el-form-item>
          </el-form>
        </div>

        <InfoBlock v-if="scriptSet.isBuiltin" type="warning" :title="$t('This is a builtin Script, code will be reset when the system restarts')"></InfoBlock>
        <InfoBlock v-else-if="isLockedByOther" type="error" :title="$t('This Script has been locked by other, editing is disabled')"></InfoBlock>
        <InfoBlock v-else type="warning" :title="$t('Currently in view mode, click Edit button to enter edit mode')"></InfoBlock>
      </el-header>

      <!-- 代码区 -->
      <el-main id="editorContainer_CodeViewer" :style="$store.getters.codeMirrorSetting.style">
        <textarea id="editor_CodeViewer"></textarea>
        <h1 id="viewModeHint">{{ $t('View Mode') }}</h1>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
// @ is an alias to /src
import { createPatch } from 'diff'
import FileSaver from 'file-saver';

export default {
  name: 'CodeViewer',
  components: {
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
    selectedFuncId(val) {
      this.$store.commit('updateEditor_highlightedFuncId', val);
      this.highlightFunc(val);
    },
    highlightedFuncId(val) {
      this.selectedFuncId = val;
    },
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
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
          if (!this.isConflict) {
            this.startEdit();
          }
          break;
      }
    },
  },
  methods: {
    async loadData() {
      let apiRes = await this.T.callAPI_get('/api/v1/scripts/:id/do/get', {
        params: { id: this.$route.params.id }
      });
      if (!apiRes.ok) {
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

      // 获取关联数据
      apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', this.scriptSetId);
      if (!apiRes.ok) return;

      this.scriptSet = apiRes.data;

      this.$store.commit('updateLoadStatus', true);

      setImmediate(() => {
        // 载入代码
        this.codeMirror.setValue('');
        switch(this.showMode) {
          case 'draft':
          case 'published':
            let codeField = this.SHOW_MODE_META_MAP[this.showMode].codeField;

            this.codeMirror.setValue(this.data[codeField] || '');
            this.T.setCodeMirrorForPython(this.codeMirror);
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
            this.T.setCodeMirrorForDiff(this.codeMirror);
            break;
        }

        this.codeMirror.refresh();

        // 更新函数列表
        this.updateFuncList();

        // 加载高亮函数为已选择
        this.selectedFuncId = this.highlightedFuncId;

        this.$store.commit('updateCodeViewer_isCodeLoaded', true);
      });
    },
    startEdit() {
      this.$router.push({
        name  : 'code-editor',
        params: {id: this.data.id},
      });
    },
    updateFuncList() {
      if (!this.data.codeDraft) return;

      const regexp = /^def ([a-zA-Z][a-zA-Z0-9_]+)\((.*)\)\:/gm;
      let scriptDraftFuncs = Array.from(this.data.codeDraft.matchAll(regexp), m => {
        let name   = m[1];
        let id     = `${this.scriptId}.${name}`;
        let kwargs = m[2].replace(/\n/g, ' ').split(',').reduce((acc, x) => {
          let k = x.trim().split('=')[0]
          if (k) acc[k] = `${k.toUpperCase()}`; // 自动填充调用参数
          return acc;
        }, {});

        return {
          id    : id,
          name  : name,
          kwargs: kwargs,
        };
      });

      // 去重
      let nextDraftFuncs = [];
      let tmpMap = {};
      scriptDraftFuncs.forEach((f) => {
        if (tmpMap[f.id]) return;

        nextDraftFuncs.push(f);
        tmpMap[f.id] = true;
      });

      this.draftFuncs = nextDraftFuncs;
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

      let scrollTo = options.line + (options.scroll || 0);
      scrollTo = Math.min(Math.max(scrollTo, 0), this.codeMirror.lineCount() - 1);
      if (options.marginType === 'next') {
        // 向下留余地，触底回滚
        this.codeMirror.setCursor({line: this.codeMirror.lineCount() - 1});
        this.codeMirror.setCursor({line: scrollTo});
      } else if (options.marginType === 'prev') {
        // 向上留余地，回顶下滚
        this.codeMirror.setCursor({line: 0});
        this.codeMirror.setCursor({line: scrollTo});
      }

      this.codeMirror.setCursor({line: options.line});

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
    highlightFunc(funcId) {
      if (!this.codeMirror) return;
      if (!funcId) return;

      let nextFuncName = funcId.split('.')[1];

      // 清除之前选择
      this.updateHighlightLineConfig('selectedFuncLine', null);

      // 查找函数所在行
      let funcQuery = `def ${nextFuncName}(`;

      let searchCursor = this.codeMirror.getSearchCursor(funcQuery);
      if (searchCursor.findNext()) {
        let funcLine = searchCursor.from().line;

        this.updateHighlightLineConfig('selectedFuncLine', {
          line           : funcLine,
          marginType     : 'next',
          scroll         : -1,
          textClass      : 'highlight-text',
          backgroundClass: 'current-func-background highlight-code-line-blink',
        });
      }
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
  },
  computed: {
    USER_OPERATION_META_MAP() {
      return {
        edit: {
          text: this.$t('Edit'),
          icon: 'fa-edit',
        },
        debug: {
          text: this.$t('Debug'),
          icon: 'fa-search',
        },
      }
    },
    SHOW_MODE_META_MAP() {
      return {
        draft: {
          text     : this.$t('Draft'),
          codeField: 'codeDraft',
        },
        published: {
          text     : this.$t('Published'),
          codeField: 'code',
        },
        diff: {
          text     : this.$t('DIFF'),
          codeField: null,
        },
      }
    },
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    scriptId() {
      return this.$route.params.id;
    },
    scriptSetId() {
      return this.scriptId.split('__')[0];
    },
    isConflict() {
      return this.$store.getters.getConflictRoute(this.$route);
    },
    isLockedByOther() {
      return this.data.lockedByUserId && this.data.lockedByUserId !== this.$store.getters.userId
          || this.scriptSet.lockedByUserId && this.scriptSet.lockedByUserId !== this.$store.getters.userId;
    },
    userOperation() {
      return this.isLockedByOther ? 'debug' : 'edit';
    },
    highlightedFuncId() {
      return this.$store.state.Editor_highlightedFuncId;
    },
    codeLines() {
      return (this.data.code || '').split('\n').length;
    },
    codeDraftLines() {
      return (this.data.codeDraft || '').split('\n').length;
    },
  },
  props: {
  },
  data() {
    return {
      codeMirror: null,

      highlightedLineInfoMap: {},

      data     : {},
      scriptSet: {},

      draftFuncs    : [],
      selectedFuncId: '',

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
      this.T.setCodeMirrorReadOnly(this.codeMirror, true);
    });
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
.CodeMirror .highlight-text {
  text-shadow: 1px 1px 3px #b3b3b3;
}
/*.CodeMirror .current-func-background {
  background-color: lightyellow;
  border: 2px solid orange;
  border-radius: 5px;
  box-shadow: 3px 3px 3px lightgrey;
}
*/
.CodeMirror .current-func-background {
  border: 2px solid;
  border-image: linear-gradient(to right, rgb(255,165,0,1) 0, rgb(255,165,0,0) 75%) 1 1;
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
