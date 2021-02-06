<i18n locale="en" lang="yaml">
addedLines   : 'Added {n} line | Added {n} lines'
removedLines : ', Removed {n} Line | , Removed {n} Lines'
codeLines    : '{n} line | {n} lines'
codeLinesPrev: 'previously {n} line | previously {n} lines'
codeLinesCurr: ', currently {n} line| , currently {n} lines'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Script Setup                                              : 脚本设置
'Other user are editing this Script, please wait...'      : '其他用户正在编辑此脚本，请稍后...'
All top Func without a underscore prefix are avaliable    : 可以指定任意顶层非下划线开头的函数
Select Func                                               : 选择执行函数
Viewport are too narrow                                   : 当前可视宽度太窄
Writing test cases to test your Func is recommended       : 建议编写测试用例来测试您的函数
Arguments                                                 : 参数
'Arguments should be inputed like {"arg": value}'         : '参数以 {"参数名": 参数值} 方式填写'
'Leave blank or {} when no argument'                      : '没有参数的不用填写，或保留 {}'
'Arguments (in JSON)'                                     : 参数（JSON格式）
Run selected Func                                         : 执行指定的函数
'Shortcut:'                                               : 快捷键：
Run                                                       : 执行
Save Script draft, code will NOT take effect immediately  : 保存当前脚本草稿，但代码不会立即生效
Show code diff                                            : 查看代码差异
DIFF                                                      : 差异
Save and publish Script, code will take effect IMMEDIATELY: 保存并发布脚本，代码将立刻生效
Publish                                                   : 发布
Recover code to latest published version                  : 恢复代码为上次发布的版本
End edit                                                  : 结束编辑
Setup Code Editor                                         : 调整编辑器显示样式
This Script has been locked by other, editing is disabled : 当前脚本被其他用户锁定，无法修改
'DIFF:'                                                   : '差异：'
addedLines                                                : '新增 {n} 行'
removedLines                                              : '，删除 {n} 行'
codeLines                                                 : '共 {n} 行代码'
codeLinesPrev                                             : '修改前共 {n} 行代码'
codeLinesCurr                                             : '，修改后共 {n} 行代码'
Script is modified but NOT published yet                  : 脚本已修改但尚未发布
Script is published                                       : 脚本已发布
Diff between published and previously published           : 发布前后差异
Clear highlighted                                         : 清除高亮
Clear output                                              : 清除输出
Output                                                    : 脚本输出
Func exection result or log message will be shown here    : 函数执行结果与日志信息将显示在此处

Operating too frequently or Script is modified in other tab: 操作过于频繁，或脚本已经在其他窗口被修改。
You can download current Script to avoid losing your stuff : 为避免丢失正在编辑的代码，您可以下载当前展示的代码
Script has been modified                                   : 脚本已被修改
Download and end editing                                   : 下载并退出编辑
Just end editing                                           : 不保存直接退出编辑
To avoid losing current code, Script has been downloaded   : 为避免丢失正在编辑的代码，当前展示的代码已自动为您下载
Saving Script failed                                       : 保存脚本失败
'Filename:'                                                : 文件名：
Script saved successfully             : 脚本保存成功
You can continue with other operations: 你可以继续进行其他操作
</i18n>

<template>
  <transition name="fade">
    <split-pane v-on:resize="resizeVueSplitPane" ref="vueSplitPane" :min-percent="0" :default-percent="100" split="horizontal" v-show="$store.state.isLoaded">
      <template slot="paneL">
        <el-container>
          <!-- 操作区 -->
          <el-header class="code-editor" style="height: unset !important">
            <div class="code-editor-action-left">
              <code class="code-editor-action-title">
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
            <div class="code-editor-action-right">
              <el-form :inline="true">
                <el-form-item v-if="isConflicted">
                  <el-link type="danger" :underline="false">{{ $t('Other user are editing this Script, please wait...') }}</el-link>
                </el-form-item>

                <el-form-item>
                  <el-tooltip :content="$t('All top Func without a underscore prefix are avaliable')" placement="left" :enterable="false">
                    <el-select
                      style="width: 200px"
                      v-model="selectedFuncId"
                      size="mini"
                      filterable
                      :placeholder="$t('Select Func')">
                      <el-option v-for="f in draftFuncs" :key="f.id" :label="f.name" :value="f.id">
                      </el-option>
                    </el-select>
                  </el-tooltip>
                </el-form-item>

                <template v-if="!isConflicted">
                  <el-form-item class="hidden-lg-and-up">
                    <el-tooltip placement="bottom" :enterable="false">
                      <div slot="content">
                        {{ $t('Viewport are too narrow') }}<br>
                        {{ $t('Writing test cases to test your Func is recommended') }}
                      </div>
                      <el-tag type="info">{{ $t('Arguments') }}</el-tag>
                    </el-tooltip>
                  </el-form-item>

                  <el-form-item class="hidden-md-and-down">
                    <el-tooltip placement="bottom" :enterable="false">
                      <div slot="content">
                        {{ $t('Writing test cases to test your Func is recommended') }}<br>
                        {{ $t('Arguments should be inputed like {"arg": value}') }}<br>
                        {{ $t('Leave blank or {} when no argument') }}
                      </div>
                      <el-input
                        style="width: 200px"
                        size="mini"
                        :placeholder="$t('Arguments (in JSON)')"
                        v-model="funcCallKwargsJSON"
                        class="code-editor-call-func-kwargs-json">
                      </el-input>
                    </el-tooltip>
                  </el-form-item>

                  <el-form-item>
                    <el-tooltip placement="bottom" :enterable="false">
                      <div slot="content">
                        {{ $t('Run selected Func') }}<br>
                        {{ $t('Shortcut:') }} <code>{{ T.getSuperKeyName() }} + B</code>
                      </div>
                      <el-button
                        @click="callFuncDraft"
                        type="primary" plain
                        size="mini"
                        :disabled="(selectedFuncId ? false : true) && !workerRunning"
                        v-loading.fullscreen.lock="workerResultLoading"
                        element-loading-spinner="el-icon-loading"
                        :element-loading-text="workerRunningTipTitle">
                        <i class="fa fa-fw fa-play"></i> <span class="hidden-md-and-down">{{ $t('Run') }}</span>
                      </el-button>
                    </el-tooltip>
                  </el-form-item>

                  <el-form-item v-if="!isLockedByOther">
                    <el-button-group>
                      <el-tooltip placement="bottom" :enterable="false">
                        <div slot="content">
                          {{ $t('Save Script draft, code will NOT take effect immediately') }}<br>
                          {{ $t('Shortcut:') }} <code>{{ T.getSuperKeyName() }} + S</code>
                        </div>
                        <el-button
                          @click="saveScript()"
                          :disalbed="!workerRunning"
                          plain
                          size="mini">
                          <i class="fa fa-fw fa-save"></i> <span class="hidden-md-and-down">{{ $t('Save') }}</span>
                        </el-button>
                      </el-tooltip>

                      <el-tooltip placement="bottom" :enterable="false">
                        <div slot="content">
                          {{ $t('Show code diff') }}
                        </div>
                        <el-button
                          @click="showDiff()"
                          :disalbed="!workerRunning"
                          plain
                          size="mini">
                          <i class="fa fa-fw fa-code"></i> <span class="hidden-md-and-down">{{ $t('DIFF') }}</span>
                        </el-button>
                      </el-tooltip>

                      <el-tooltip :content="$t('Save and publish Script, code will take effect IMMEDIATELY')" placement="bottom" :enterable="false">
                        <el-button
                          @click="publishScript"
                          :disalbed="!workerRunning"
                          plain
                          size="mini">
                          <i class="fa fa-fw fa-coffee"></i> <span class="hidden-md-and-down">{{ $t('Publish') }}</span>
                        </el-button>
                      </el-tooltip>
                    </el-button-group>
                  </el-form-item>

                  <el-form-item v-if="!isLockedByOther">
                    <el-tooltip :content="$t('Recover code to latest published version')" placement="bottom" :enterable="false">
                      <el-button
                        @click="resetScript"
                        :disalbed="!workerRunning"
                        plain
                        size="mini"><i class="fa fa-fw fa-history"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                </template>

                <el-form-item>
                  <el-tooltip :content="$t('End edit')" placement="bottom" :enterable="false">
                    <el-button
                      @click="endEdit"
                      :disalbed="!workerRunning"
                      plain
                      size="mini"><i class="fa fa-fw fa-sign-out"></i></el-button>
                  </el-tooltip>
                </el-form-item>

                <el-form-item>
                  <el-tooltip :content="$t('Setup Code Editor')" placement="bottom" :enterable="false">
                    <el-button
                      @click="gotoCodeEditorSetup"
                      :disalbed="!workerRunning"
                      plain
                      size="mini"><i class="fa fa-fw fa-cog"></i></el-button>
                  </el-tooltip>
                </el-form-item>
              </el-form>
            </div>

            <InfoBlock v-if="isLockedByOther" type="error" :title="$t('This Script has been locked by other, editing is disabled')"></InfoBlock>
          </el-header>

          <!-- 代码区 -->
          <el-main id="editorContainer_CodeEditor" :style="$store.getters.codeMirrorSetting.style">
            <textarea id="editor_CodeEditor"></textarea>
          </el-main>

          <!-- 状态栏 -->
          <div class="code-editor-status-bar" v-show="$store.state.isLoaded">
            <el-tooltip :content="`${$t('DIFF:')} ${$tc('addedLines', diffAddedCount)}${$tc('removedLines', diffRemovedCount)}`" placement="top-end">
              <span>
                <span class="text-good">+{{ diffAddedCount }}</span>/<span class="text-bad">-{{ diffRemovedCount }}</span>
              </span>
            </el-tooltip>
            ,
            <template v-if="codeLines === codeDraftLines">
              <el-tooltip :content="$tc('codeLines', codeLines)" placement="top-end">
                <span>{{ codeLines }}</span>
              </el-tooltip>
            </template>
            <template v-else>
              <el-tooltip :content="`${$tc('codeLinesPrev', codeLines)}${$tc('codeLinesCurr', codeDraftLines)}`" placement="top-end">
                <span>{{ codeLines }}<i class="fa fa-long-arrow-right"></i><span class="text-main">{{ codeDraftLines }}</span></span>
              </el-tooltip>
            </template>
            ,
            <template v-if="data.codeMD5 !== data.codeDraftMD5">
              <el-tooltip :content="$t('Script is modified but NOT published yet')" placement="top-end">
                <span class="text-main">MODIFIED</span>
              </el-tooltip>
            </template>
            <template v-else>
              <el-tooltip :content="$t('Script is published')" placement="top-end">
                <span class="text-good">CLEAR</span>
              </el-tooltip>
            </template>
          </div>

          <LongTextDialog :title="$t('Diff between published and previously published')" :diffMode="true" ref="longTextDialog"></LongTextDialog>
        </el-container>
      </template>

      <!-- 输出区 -->
      <template slot="paneR">
        <div class="code-editor-output">
          <div class="code-editor-output-close">
            <el-link type="info" @click.stop="clearHighlight()"><i class="fa fa-eraser"></i> {{ $t('Clear highlighted') }}</el-link>
            &#12288;
            <el-link type="info" @click.stop="clearOutput()"><i class="fa fa-trash-o"></i> {{ $t('Clear output') }}</el-link>
            &#12288;
            <el-link type="info" @click.stop="resizeVueSplitPane(100)"><i class="fa fa-times"></i> {{ $t('Close') }}</el-link>
          </div>
          <el-tabs tab-position="left" type="border-card">
            <el-tab-pane :label="`${$t('Output')} ${funcCallSeq > 0 ? `#${funcCallSeq}` : ''}`" ref="codeEditorTextOutput">
              <pre v-html.trim="textOutput || $t('Func exection result or log message will be shown here')"></pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
    </split-pane>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'
import { createPatch } from 'diff'
import FileSaver from 'file-saver';

// @ is an alias to /src
export default {
  name: 'CodeEditor',
  components: {
    LongTextDialog,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        // 记录为新加载文件，不响应CodeMirror的change事件
        this.isNewLoaded = true;
      }
    },
    isConflicted: {
      immediate: true,
      handler(val) {
        this.T.setCodeMirrorReadOnly(this.codeMirror, val);
      }
    },
    selectedFuncId(val) {
      this.$store.commit('updateEditor_highlightedFuncId', val);
      this.highlightFunc(val);

      // 自动填充参数
      this.autoFillFuncCallKwargsJSON(val);
    },
    highlightedFuncId(val) {
      this.selectedFuncId = val;
    },
    splitPanePercent(val) {
      this.resizeVueSplitPane(val);
    },
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
    '$store.state.shortcutAction'(val) {
      switch(val.action) {
        case 'codeEditor.save':
          this.saveScript({skipSaveAlert: true});
          break;

        case 'codeEditor.run':
          this.callFuncDraft();
          break;
      }
    },
  },
  methods: {
    _refreshAside() {
      // 更新函数列表
      this.updateFuncList();
      // 更新左侧列表
      this.$store.commit('updateScriptListSyncTime');
    },
    _downloadEditingCodeDraft(codeContent) {
      let blob = new Blob([codeContent], {type: 'text/plain'});
      let fileName = `${this.scriptId}.${this.M().format('YYYYMMDD_HHmmss')}.py.DRAFT`;
      FileSaver.saveAs(blob, fileName);

      return fileName;
    },
    async _saveCodeDraft(options) {
      // 等待保存信号量，防止多重保存
      while (this.isSavingCodeDraft) {
        await this.T.sleep(1000);
      }
      this.isSavingCodeDraft = true;

      let res = null;
      try {
        return await this._saveCodeDraftImpl(options);
      } catch(err) {
        // nope
      } finally {
        this.isSavingCodeDraft = false;
      }
    },
    async _saveCodeDraftImpl(options) {
      if (this.isLockedByOther) return;
      if (!this.codeMirror) return;

      options = options || {};

      let prevCodeDraftMD5 = this.prevCodeDraftMD5;
      let codeDraft        = this.codeMirror.getValue();

      // 保存时，自动去除所有行尾空格
      let codeDraftLines = codeDraft.split('\n').map(line => {
        return line.replace(/\s+$/g, '');
      });
      codeDraft = codeDraftLines.join('\n');

      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/modify', {
        params: {id: this.scriptId},
        body  : {data: {codeDraft: codeDraft}, prevCodeDraftMD5: prevCodeDraftMD5},
      });

      if (!apiRes.ok) {
        // 详细处理错误
        switch(apiRes.reason) {
          // 乐观锁冲突
          case 'EBizRequestConflict.scriptDraftAlreadyChanged':
            try {
              await this.$confirm(`${this.$t('Operating too frequently or Script is modified in other tab')}
                  <br><span class="text-good">${this.$t('You can download current Script to avoid losing your stuff')}</span>`, this.$t('Script has been modified'), {
                dangerouslyUseHTMLString: true,
                confirmButtonText: this.$t('Download and end editing'),
                cancelButtonText: this.$t('Just end editing'),
                type: 'error',
              });

              this._downloadEditingCodeDraft(codeDraft);

            } catch(err) {
              // 取消操作
            }

            this.endEdit({ skipPublishCheck: true });

            break;

          default:
            if (options.silent) break;

            let downloadFileName = this._downloadEditingCodeDraft(codeDraft);
            await this.$alert(`<span class="text-good">${this.$t('To avoid losing current code, Script has been downloaded')}</span>
                <br>${this.$t('Filename:')}<code class="text-main">${downloadFileName}</code>`, this.$t('Saving Script failed'), {
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('OK'),
              type: 'error',
            });

            break;
        }

      } else {
        // 更新页面状态
        this.data.codeDraft = codeDraft;
        this.prevCodeDraftMD5 = apiRes.data.codeDraftMD5;
      }

      return apiRes;
    },
    async loadData(options) {
      options = options || {};
      options.codeField = options.codeField || 'codeDraft';

      let apiRes = await this.T.callAPI('/api/v1/scripts/:id/do/get', {
        params: {id: this.scriptId},
        alert : {showError: true},
      });
      if (!apiRes.ok) {
        // 获取脚本失败则跳回简介页面
        this.$router.push({
          name: 'intro',
        });
        return;
      };

      this.data = apiRes.data;
      this.prevCodeDraftMD5 = apiRes.data.codeDraftMD5;

      // 计算状态栏数据
      let diffInfo = this.T.getDiffInfo(this.data.code, this.data.codeDraft);
      this.diffAddedCount   = diffInfo.addedCount;
      this.diffRemovedCount = diffInfo.removedCount;

      // 获取关联数据
      apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', this.scriptSetId, {
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.scriptSet = apiRes.data;

      this.$store.commit('updateLoadStatus', true);

      setImmediate(() => {
        // 载入代码
        if (this.codeMirror) {
          this.codeMirror.setValue('');
          this.codeMirror.setValue(this.data[options.codeField] || this.data.code || '');
          this.codeMirror.refresh();
        }

        // 更新函数列表
        this.updateFuncList();

        // 加载高亮函数为已选择
        this.selectedFuncId = this.highlightedFuncId;
        // 自动填充参数
        this.autoFillFuncCallKwargsJSON(this.selectedFuncId);

        // 锁定编辑器
        if (this.isConflicted || this.isLockedByOther) {
          this.T.setCodeMirrorReadOnly(this.codeMirror, true);
        }

        // 自动保存
        if (!this.isLockedByOther) {
          this.codeMirror.on('change', this.T.debounce((editor, change) => {
            if (this.isNewLoaded) {
              this.isNewLoaded = false;
            }
            this.saveScript({isAutoSave: true});
          }, 1000));
        }

        this.$store.commit('updateCodeEditor_isCodeLoaded', true);
      });

      // 默认隐藏
      this.closeVueSplitPane();
    },
    async saveScript(options) {
      if (this.isLockedByOther) return;
      if (!this.codeMirror) return;

      options = options || {};
      let codeDraft = this.codeMirror.getValue();

      // 自动保存时，检查变化行数，变化过大的不自动保存
      if (options.isAutoSave) {
        // 代码被清空时，不自动保存
        if (!codeDraft.trim()) return;

        // 一次性修改超过30行，或30%的，跳过自动保存
        let draftDiffInfo = this.T.getDiffInfo(this.data.codeDraft, codeDraft);
        let changedCount = Math.max(draftDiffInfo.addedCount, draftDiffInfo.removedCount);
        if (changedCount > 30 || (changedCount / draftDiffInfo.srcTotalCount > 0.3)) {
          return;
        }
      }

      // 保存
      let apiRes = await this._saveCodeDraft({silent: true});
      if (!apiRes.ok) return;

      // 刷新侧边栏
      this._refreshAside();

      // 更新状态栏数据
      let diffInfo = this.T.getDiffInfo(this.data.code, codeDraft);
      this.diffAddedCount   = diffInfo.addedCount;
      this.diffRemovedCount = diffInfo.removedCount;

     // 提示
      if (!options.isAutoSave) {
        if (options.skipSaveAlert) {
          // 简易保存提示
          this.$notify({
            title   : this.$t('Script saved successfully'),
            message : this.$t('You can continue with other operations'),
            type    : 'success',
            position: 'top-right',
            offset  : 20,
            duration: 30000000,
            offset  : 75,
          });

        } else {
          // 完整保存提示
          this.$alert(`脚本保存成功，你可以继续进行其他操作
              <hr class="br">已保存的内容只能编辑器内执行，
              <span class="text-main">只有发布之后才会对外生效</span>
              <hr class="br"><small>您也可以使用快捷键 <kbd>${this.T.getSuperKeyName()}</kbd> + <kbd>s</kbd> 保存</small>`, '保存脚本', {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '非常好',
            type: 'success',
          });
        }
      }
    },
    showDiff() {
      let fileTitle = this.data.title ? ` (${this.data.title})` : '';
      let fileName  = `${this.scriptId}${fileTitle}`;
      let oldStr    = this.data.code      || '';
      let newStr    = this.data.codeDraft || '';
      let oldHeader = '已发布的正式代码';
      let newHeader = '已保存的草稿代码';
      let diffPatch = createPatch(fileName, oldStr, newStr, oldHeader, newHeader);

      let createTimeStr = this.moment().utcOffset(8).format('YYYYMMDD_HHmmss');
      let diffName = `${this.data.id}.diff.${createTimeStr}`;
      this.$refs.longTextDialog.update(diffPatch, diffName);
    },
    async publishScript() {
      if (this.isLockedByOther) return;
      if (!this.codeMirror) return;

      // 清除所有高亮
      this.updateHighlightLineConfig('selectedFuncLine', null);
      this.updateHighlightLineConfig('errorLine', null);

      try {
        await this.$confirm(`发布后新的脚本将立即生效，
            <br>DataFlux其他组件也立即可以调用被<code class="text-main">@DFF.API()</code>装饰的函数
            <hr class="br">是否确认发布？`, '发布脚本', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认发布',
          cancelButtonText: '放弃',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      // 保存
      let apiRes = await this._saveCodeDraft();
      if (!apiRes.ok) return;

      // 脚本发布中
      this.workerRunning         = true;
      this.workerRunningTipTitle = '脚本发布中，正常几秒就能完成，如长时间无响应请尝试刷新页面';
      let delayedLoadingT = setTimeout(() => {
        this.workerResultLoading = true;
      }, 200);

      // 发布
      apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/publish', {
        params: {id: this.scriptId},
        body  : {force: true, data: {note: '通过脚本编辑器发布'}},
      });

      clearTimeout(delayedLoadingT);
      this.workerRunning       = false;
      this.workerResultLoading = false;

      if (!apiRes.ok) {
        // 输出结果
        this.outputResult(`发布脚本：${this.scriptId}`, apiRes);
        this.alertOnEScript(apiRes, true);
        return;
      }

      // 刷新侧边栏
      this._refreshAside();

      // 弹框提示
      this.$alert(`脚本发布成功，新脚本已经生效
          <hr class="br">您可以：
          <br>1. 前往<a class="text-main" href="/#/management/auth-link-list">
              <i class="fa fa-fw fa-link"></i> 授权链接&#12288;</a> 管理页面配置需要公开的API
          <br>2. 前往<a class="text-main" href="/#/management/script-set-export">
              <i class="fa fa-fw fa-cloud-download"></i> 导出脚本集</a> 页面导出并发行脚本包`, '发布脚本', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '非常好',
        type: 'success',
      });
    },
    async resetScript() {
      if (this.isLockedByOther) return;
      if (!this.codeMirror) return;

      try {
        await this.$confirm(`复位脚本草稿到<code class="text-main">上次发布时</code>的状态，已修改的草稿内容将丢失
            <br>本操作仅影响脚本草稿，<code class="text-good">不影响已发布的内容</code>
            <hr class="br">是否确认复位？`, '复位脚本草稿', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认复位',
          cancelButtonText: '放弃',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      this.updateHighlightLineConfig('errorLine', null);

      await this.loadData({codeField: 'code'});
    },
    gotoCodeEditorSetup() {
      this.$router.push({
        name: 'code-editor-setup',
      })
    },
    async callFuncDraft() {
      if (!this.codeMirror) return;

      // 清除所有高亮
      this.updateHighlightLineConfig('selectedFuncLine', null);
      this.updateHighlightLineConfig('errorLine', null);

      // 保存
      if (!this.isLockedByOther) {
        // 仅限可编辑时
        let apiRes = await this._saveCodeDraft();
        if (!apiRes.ok) return;
      }

      let funcCallKwargs = null;
      try {
        funcCallKwargs = JSON.parse(this.funcCallKwargsJSON || '{}');
      } catch(err) {
        this.$alert(`调用参数不是正确的JSON格式<br>${err.toString()}`, `输入检查`, {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '了解',
          type: 'error',
        });
        return;
      }

      // 函数运行中
      const updateCountDownTipTitle = (countDown) => {
        let tipTitle = `函数执行中，长时间无响应后再尝试刷新页面`;
        if (countDown > 0) {
          tipTitle = `函数执行中，调试最多等待 ${countDown} 秒，长时间无响应后再尝试刷新页面`;
        }
        this.workerRunningTipTitle = tipTitle;
      }

      this.workerRunning = true;

      if (this.countDownTimer) {
        clearInterval(this.countDownTimer);
        this.countDownTimer = null;
      }

      let leftSeconds = this.$store.getters.CONFIG('_FUNC_TASK_DEBUG_TIMEOUT');
      updateCountDownTipTitle(leftSeconds);
      this.countDownTimer = setInterval(() => {
        leftSeconds--;
        if (leftSeconds <= 0) {
          clearInterval(this.countDownTimer);
        }

        updateCountDownTipTitle(leftSeconds);
      }, 1000);

      let delayedLoadingT = setTimeout(() => {
        this.workerResultLoading = true;
      }, 500);

      let apiRes = null;
      try {
        apiRes = await this.T.callAPI('post', '/api/v1/func-draft/:funcId', {
          params: {
            funcId: this.selectedFuncId,
          },
          body: {kwargs: funcCallKwargs},
          extraOptions: {noCountProcessing: true},
        });

      } catch(err) {
        return console.log(err);

      } finally {
        clearTimeout(delayedLoadingT);
        this.workerRunning       = false;
        this.workerResultLoading = false;
      }

      // 输出结果
      let argParts = [];
      for (let k in funcCallKwargs) if (funcCallKwargs.hasOwnProperty(k)) {
        let v = funcCallKwargs[k];
        if (v === null) {
          v = 'None';
        } else if (v === true) {
          v = 'True';
        } else if (v === false) {
          v = 'False';
        } else {
          v = JSON.stringify(v);
        }

        argParts.push(`${k}=${v}`);
      }
      let argStr = argParts.join(', ');

      let outputTitle = `执行函数：${this.selectedFuncId}(${argStr})`;
      this.outputResult(outputTitle, apiRes);

      // 标记运行的函数
      if (apiRes.ok) {
        // 等待输出栏弹出后执行
        setImmediate(() => {
          this.highlightFunc(this.selectedFuncId);
        });
      }

      if (!apiRes.ok && apiRes.reason !== 'EScriptPreCheck') {
        // 只在预检查以外的情况下才弹框
        this.alertOnEScript(apiRes);
      }
    },
    async leavingConfirm() {
      if (this.isLockedByOther) return true;
      if (!this.codeMirror) return true;

      // 清除所有高亮
      this.updateHighlightLineConfig('selectedFuncLine', null);
      this.updateHighlightLineConfig('errorLine', null);

      // 保存
      let apiRes = await this._saveCodeDraft();
      if (!apiRes.ok) return;

      // 检查发布状态
      apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', this.scriptId, {
        query: {fields: ['codeMD5', 'codeDraftMD5']},
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      if (apiRes.data.codeMD5 !== apiRes.data.codeDraftMD5) {
        try {
          await this.$confirm(`当前编辑的脚本尚未发布，脚本目前仍然以上次发布时的状态运行
              <hr class="br">是否需要发布？`, '脚本未发布', {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '立即发布',
            cancelButtonText: '暂不发布',
            type: 'warning',
          });

          // 脚本发布中
          this.workerRunning         = true;
          this.workerRunningTipTitle = '脚本发布中，正常数秒就能完成，如长时间无响应请尝试刷新页面';
          let delayedLoadingT = setTimeout(() => {
            this.workerResultLoading = true;
          }, 500);

          // 发布
          let apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/publish', {
            params: {id: this.scriptId},
            body  : {force: true, data: {note: '通过脚本编辑器发布'}},
          });

          clearTimeout(delayedLoadingT);
          this.workerRunning       = false;
          this.workerResultLoading = false;

          if (!apiRes.ok) {
            // 输出结果
            this.outputResult(`发布脚本：${this.scriptId}`, apiRes);
            this.alertOnEScript(apiRes, true);
            return;
          }

          this.data.code = this.data.codeDraft;

          // 更新函数列表
          this.updateFuncList();
          // 更新左侧列表
          this.$store.commit('updateScriptListSyncTime');

        } catch(err) {
          // 无操作
        }
      }

      return true;
    },
    clearHighlight() {
      this.updateHighlightLineConfig('selectedFuncLine', null);
      this.updateHighlightLineConfig('errorLine', null);
    },
    clearOutput() {
      this.textOutput = '';
      this.chartOutput = [];

      this.clearHighlight();
    },
    outputResult(outputTitle, apiRes) {
      if (!apiRes.ok && apiRes.reason !== 'EScriptPreCheck') {
        // 预检查失败不执行
        return;
      }

      // 限制输出总量
      let _lines = this.textOutput.split('\n');
      if (_lines.length > this.TEXT_OUTPUT_LIMIT) {
        this.textOutput = _lines.slice(-1 * this.TEXT_OUTPUT_LIMIT).join('\n');
      }

      // 分割线
      this.funcCallSeq++;
      let outputDivider = `\n<span class="code-editor-output-info">#<span class="code-editor-output-seq">${this.funcCallSeq}</span> ${'-'.repeat(20)}</span>`;

      // 标题
      outputTitle = `<span class="code-editor-output-info">${outputTitle}</span>`;

      let costInfo    = null; // 执行耗时
      let logMessages = null; // 日志输出
      let funcOutput  = null; // 函数输出
      let stackInfo   = null; // 错误堆栈

      if (apiRes.data) {
        if (apiRes.ok) {
          costInfo = `<span class="code-editor-output-info">耗时：${apiRes.data.result.funcResult.cost.toFixed(3)} 秒</span>`;
          if (apiRes.data.result.funcResult.cost > 3) {
            costInfo += `，<span class="text-watch">耗时较长，可能不适合需要响应速度较高的场景</span>`;
          }
        }

        // 在线调试，无论成功失败，包含日志输出
        logMessages = apiRes.data.result.logMessages;
        if (Array.isArray(logMessages)) {
          logMessages = logMessages.map(l => {
            let m = l.match(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
            if (!m) {
              return this.encoding.htmlEncode(l);
            } else {
              let restL = l.slice(m[0].length);
              return this.T.strf('<span class="text-main">{0}</span>{1}', m[0], this.encoding.htmlEncode(restL));
            }
          });
          logMessages = logMessages.join('\n') || null;
        }

        // 在线调试成功时，包含函数输出
        if (apiRes.ok) {
          funcOutput = apiRes.data.result.funcResult.repr || null;
        }
      }

      if (apiRes.detail) {
        // 发布失败/在线调试失败时，包含错误堆栈信息
        let stackLines = apiRes.detail.stack.split('\n').reduce((acc, x) => {
          if (!x.trim()) return acc;

          acc.push(`<span class="code-editor-output-error-stack">${this.encoding.htmlEncode(x)}</span>`);
          return acc;
        }, []);
        stackInfo = stackLines.join('\n');
      }

      // 函数返回/堆栈信息标题
      let funcReturnTitle = null;
      let stackTitle      = null;
      if (apiRes.ok) {
        funcReturnTitle = `<span class="code-editor-output-info">函数返回值：</span>`;
      } else {
        stackTitle = `<span class="code-editor-output-info">错误堆栈：</span>`
      }

      let nextTextOutput = [
        this.textOutput,
        '', // 空行
        outputDivider,
        outputTitle,
        costInfo,
        '', // 空行
        logMessages,
        '', // 空行
        funcReturnTitle,
        stackTitle,
        this.encoding.htmlEncode(funcOutput),
        stackInfo,
      ];
      let nextChartOutput = []; // TODO

      // 过滤空白内容
      nextTextOutput = nextTextOutput.filter(x => 'string' === typeof x).join('\n').trimStart();

      this.textOutput  = nextTextOutput;
      this.chartOutput = nextChartOutput;
      this.openVueSplitPane();

      // 输出框滚动到最底部
      setImmediate(() => {
        let $outputSeqs = document.getElementsByClassName('code-editor-output-seq');
        let $lastOutputSeq = $outputSeqs[$outputSeqs.length - 1];
        let $textOutputContainer = this.$refs.codeEditorTextOutput.$el.parentElement;
        let $outputPanel = $textOutputContainer.parentElement;
        $textOutputContainer.scrollTo({ left: 0, top: $lastOutputSeq.offsetTop - $outputPanel.scrollHeight + 35 });
        $textOutputContainer.scrollTo({ left: 0, top: $textOutputContainer.scrollHeight, behavior: 'smooth' });
      });

      // 标记错误行
      if (!apiRes.ok) {
        // 等待输出栏弹出后执行
        setImmediate(() => {
          const currentFilename = `${this.scriptId}`;

          let stack = apiRes.detail.traceInfo.stack;
          let inFileStack = stack.filter((s) => {
            if (!s.isInScript) return;
            if (s.filename !== currentFilename) return;
            return true;
          });

          let lastFrame       = stack[stack.length - 1];
          let lastInFileFrame = inFileStack[inFileStack.length - 1];

          let errorLine    = null;
          let errorText    = '';
          let locationText = '';

          if (lastInFileFrame) {
            // 本脚本内存在堆栈Frame（非编译错误），直接从traceInfo中提取内容即可
            errorLine = lastInFileFrame.lineNumber - 1;
            errorText = apiRes.detail.traceInfo.exceptionDump;

            // if (errorText.length > 30) {
            //   errorText = errorText.slice(0, 27) + '...';
            // }

            if (lastFrame.filename !== lastInFileFrame.filename) {
              let filename = lastFrame.filename;
              if (filename.slice(-3) === '.py') {
                filename = '<引擎内部>'
              }

              locationText = `发生于 ${filename} ${lastFrame.lineNumber} 行，${lastFrame.funcname} 函数内`;
            }

          } else {
            // 本脚本内不存在堆栈Frame（编译错误），堆栈指向引擎
            // 需要解析类似如下文本：
            // File "demo__ft_pred", line 55
            //     if value = 0:
            //              ^
            // SyntaxError: invalid syntax`
            try {errorText = apiRes.detail.traceInfo.exceptionDump} catch(err) {return console.error(err)}

            let lastMatch = [...errorText.matchAll(/^File \"(\w+)\", line (\d+)$/mg)].pop();
            if (!lastMatch) return;

            errorLine = parseInt(lastMatch[2]) - 1;
          }

          errorText = errorText.split('\n').pop().trim();

          let innerHTML = `
              <span class="error-info">
                <i class="fa fa-fw fa-times-circle"></i>
                <span>${errorText}</span>
                <span class="error-line-location">${locationText}</span>
              </span>
            `;

          this.updateHighlightLineConfig('errorLine', {
            line            : errorLine,
            scroll          : 1,
            marginType      : 'prev',
            textClass       : 'highlight-text',
            backgroundClass : 'error-line-background highlight-code-line-blink',
            lineWidgetConfig: {
              type     : 'errorLine',
              innerHTML: innerHTML,
            },
          });
        });
      }
    },
    autoFillFuncCallKwargsJSON(draftFuncId) {
      if (this.draftFuncs.length <= 0) {
        this.funcCallKwargsJSON = '';
        return;
      }

      for (let i = 0; i < this.draftFuncs.length; i++) {
        if (this.draftFuncs[i].id === draftFuncId) {
          this.funcCallKwargsJSON = JSON.stringify(this.draftFuncs[i].kwargs);
          return;
        }
      }
    },
    endEdit(options) {
      options = options || {};

      let toRoute = {
        name  : 'code-viewer',
        params: {id: this.scriptId},
      };

      if (options.skipPublishCheck) {
        toRoute.query = { skipPublishCheck: true };
      }

      this.$router.push(toRoute);
    },
    resizeVueSplitPane(percent) {
      if (percent >= this.SPLIT_PANE_CLOSE_PERCENT) {
        // 单纯关闭窗口，不需要记录位置
        this.$refs.vueSplitPane.percent = percent;
        return;
      }

      if (percent > this.SPLIT_PANE_MAX_PERCENT) {
        percent = this.SPLIT_PANE_MAX_PERCENT;
      } else if (percent < this.SPLIT_PANE_MIN_PERCENT) {
        percent = this.SPLIT_PANE_MIN_PERCENT;
      }

      this.$refs.vueSplitPane.percent = percent;
      this.debouncedUpdatePanePercent(this.$store, percent);
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
    openVueSplitPane() {
      this.$refs.vueSplitPane.percent = this.splitPanePercent;
    },
    closeVueSplitPane() {
      this.$refs.vueSplitPane.percent = this.SPLIT_PANE_CLOSE_PERCENT;
    },
    alertOnEScript(apiRes, isPublish) {
      // 预检查任务本身永远不会失败，脚本执行失败时返回的`reason`字段为`"EScriptPreCheck"`
      // 除此之外的报错均为引擎故障

      let title   = null;
      let message = null;
      switch(apiRes.reason) {
        case 'EScriptPreCheck':
          title   = isPublish ? '发布失败' : '脚本错误';
          message = isPublish ? `脚本发布预检查失败，请检查代码是否存在错误
                                    <br>详细堆栈信息可在下方输出窗口中查看`
                              : `脚本执行失败，请检查代码是否存在错误
                                    <br>详细堆栈信息可在下方输出窗口中查看`;
          this.$alert(message, title, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '了解',
            type: 'error',
          });
          break;

        case 'EAPITimeout':
        case 'EFuncTimeout':
          title   = isPublish ? '发布失败' : '等待超时';
          message = isPublish ? `脚本发布预检查超时，请注意不要再全局范围内编写耗时代码。
                                    <br>如果问题持续出现，可能是因为后端脚本执行模块未响应，请联系管理员排查问题`
                              : `等待函数响应超时
                                    <span class="text-main">
                                    <br>在编辑器中运行函数时，最长允许等待${this.$store.getters.CONFIG('_FUNC_TASK_DEBUG_TIMEOUT')}秒，
                                    <br>正式使用时应注意响应过慢的函数不适合同步方式调用</small>
                                    </span>`;
          this.$alert(message, title, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '了解',
            type: 'error',
          });
          break;

        case 'EFuncFailed':
          title   = isPublish ? '发布失败' : '脚本错误';
          message = isPublish ? `脚本发布失败，后端脚本执行模块可能存在问题，请联系管理员排查问题
                                    <br>详细堆栈信息可在下方输出窗口中查看`
                              : `脚本执行发生故障，后端脚本执行模块可能存在问题，请联系管理员排查问题
                                    <br>详细堆栈信息可在下方输出窗口中查看`;
          this.$alert(message, title, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '了解',
            type: 'error',
          });
          break;

        case 'EFuncResultParsingFailed':
          title   = '函数返回值无法解析';
          message = `函数返回了无法使用 Javascript 解析的数据，请检查函数返回值中是否包含了复杂数据。
                        <br>一般来说，Python 常用基本类型都能正常解析，如 list、dict、int、float、str、bool、None 等，
                        但一些数学库可能返回复杂的数字对象，如 numpy.NaN，
                        这些数字对象需要在函数返回前处理成 Python 的基本类型。
                        <br>如果不确定，可以使用类似 Python 内置的 type()、repr() 等函数帮助判断。`;
          this.$alert(message, title, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '了解',
            type: 'error',
          });
          break;

        case 'EClientDuplicated':
          title = '函数名重复';
          message = `被@DFF.API(...)装饰的函数存在重名
                      <br>请检查代码，修改后再试一次`
          this.$alert(message, title, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '了解',
            type: 'error',
          });
          break;
      }

      if (this.textOutput) this.openVueSplitPane();
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
          case 'errorLine':
            div = document.createElement('div');
            div.classList.add('error-line-text');
            div.classList.add('highlight-text');

            const editorStyle = this.$store.getters.codeMirrorSetting.style;
            div.style.top        = `-${parseInt(editorStyle.fontSize) * editorStyle.lineHeight}px`;
            div.style.fontSize   = `${editorStyle.fontSize}`;
            div.style.lineHeight = editorStyle.lineHeight;
            div.innerHTML        = config.innerHTML;
            break;
        }

        if (div) {
          this.codeMirror.addLineWidget(options.line, div);
        }
      }

      return this.codeMirror.lineInfo(options.line);
    },
    updateHighlightLineConfig(key, config) {
      let nextHighlightedLineConfigMap = this.T.jsonCopy(this.$store.state.codeEditor_highlightedLineConfigMap) || {};

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

      this.$store.commit('updateCodeEditor_highlightedLineConfigMap', nextHighlightedLineConfigMap);
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
  },
  computed: {
    SPLIT_PANE_MAX_PERCENT  : () => 80,
    SPLIT_PANE_MIN_PERCENT  : () => 30,
    SPLIT_PANE_CLOSE_PERCENT: () => 100,
    TEXT_OUTPUT_LIMIT       : () => 500,
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    scriptId() {
      return this.$route.params.id;
    },
    scriptSetId() {
      return this.scriptId.split('__')[0];
    },
    isConflicted() {
      return this.$store.getters.getConflictedRoute(this.$route);
    },
    isLockedByOther() {
      return this.data.lockedByUserId && this.data.lockedByUserId !== this.$store.getters.userId
          || this.scriptSet.lockedByUserId && this.scriptSet.lockedByUserId !== this.$store.getters.userId;
    },
    highlightedFuncId() {
      return this.$store.state.Editor_highlightedFuncId;
    },
    isSignedIn() {
      return !!this.$store.state.xAuthToken;
    },
    splitPanePercent() {
      return this.$store.state.codeEditor_splitPanePercent || this.$store.getters.DEFAULT_STATE.codeEditor_splitPanePercent;
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
      isNewLoaded: true,
      codeMirror: null,

      highlightedLineInfoMap: {},

      currentErrorLineInfo: null,

      data     : {},
      scriptSet: {},

      draftFuncs        : [],
      selectedFuncId    : '',
      funcCallKwargsJSON: '',
      funcCallSeq       : 0,

      countDownTimer       : null,
      workerRunning        : false,
      workerRunningTipTitle: '',
      workerResultLoading  : false,

      textOutput : '',
      chartOutput: [],

      // 用于乐观锁
      prevCodeDraftMD5: null,

      // 代码保存中标志位
      isSavingCodeDraft: false,

      // DIFF信息
      diffAddedCount  : 0,
      diffRemovedCount: 0,
    }
  },
  created() {
    this.debouncedUpdatePanePercent = this.T.debounce((store, nextPercent) => {
      store.commit('updateCodeEditor_splitPanePercent', nextPercent);
    }, 100);
  },
  mounted() {
    setImmediate(() => {
      // 初始化编辑器
      this.codeMirror = this.T.initCodeMirror('editor_CodeEditor');
      this.codeMirror.setOption('theme', this.codeMirrorTheme);
    });
  },
  async beforeRouteLeave(to, from, next) {
    if (!this.isSignedIn) return next();
    if (to.query.skipPublishCheck) return next();

    try {
      let isAllowed = await this.leavingConfirm();
      if (!isAllowed) {
        return next(false);
      }

    } catch(err) {
      console.error(err);
    }

    next();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#editor_CodeEditor {
  display: none;
}
.el-header {
  box-shadow: 5px 5px 5px lightgrey;
  z-index: 5;
}
.code-editor-action-title {
  font-size: 22px;
}
.code-editor-action-title i.fa {
  font-size: 18px;
}
.code-editor-action-left {
  margin-top: 5px;
  margin-left: 5px;
  height: 48px;
  position: absolute;
  background-image: linear-gradient(to left, rgba(255, 255,255, 0) 0%, white 2%);
  padding-right: 25px;
}
.code-editor-action-left:hover {
  z-index: 1;
}
.code-editor-action-right {
  float: right;
  margin-top: 5px;
  height: 48px;
  background-image: linear-gradient(to right, rgba(255, 255,255, 0) 0%, white 2%);
  padding-left: 25px;
  position: relative;
}
.code-editor-action-right .el-select {
  position: relative;
  top: 1px;
}
</style>
<style>
#editorContainer_CodeEditor {
  padding: 1px 0 0 5px;
  position: relative;
}
#editorContainer_CodeEditor .CodeMirror {
  height: 100% !important;
  position: absolute !important;
  top: 0;
  left: 5px;
  right: 0;
}
.CodeMirror .highlight-text {
  text-shadow: 1px 1px 3px #b3b3b3;
}
.CodeMirror .error-info {
  width: 15vw;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}
.CodeMirror .current-func-background {
  border: 2px solid;
  border-image: linear-gradient(to right, rgb(255,165,0,1) 0, rgb(255,165,0,0) 75%) 1 1;
  background-image: linear-gradient(to right, rgba(255,255,224,1) 0, rgba(255,255,224,0) 75%);
  border-right: none;
}
.CodeMirror .error-line-background {
  border: 2px solid;
  border-image: linear-gradient(to left, rgb(255,0,0,1) 0, rgb(255,0,0,0) 75%) 1 1;
  background-image: linear-gradient(to left, rgba(255,214,220,1) 0, rgba(255,214,220,0) 75%);
  border-left: none;
}

.CodeMirror .error-line-text {
  position: absolute;
  color: red;
  right: 10px;
}
.CodeMirror .error-line-location {
  font-style: italic;
  margin-left: 15px;
}

.code-editor-call-func-kwargs-json {
  font-size: 12px;
}
.code-editor-output {
  height: 100%;
  overflow: hidden;
  position: relative;
}
.code-editor-output pre {
  margin: 0;
  padding-bottom: 70px;
  padding-right: 10px;
  white-space: pre-wrap;
}
.code-editor-output .el-tabs {
  height: 100%;
  margin-left: 5px;
  margin-top: 5px;
}
.code-editor-output .el-tabs__content {
  height: 100%;
  overflow: auto;
}
.code-editor-output-close {
  position: absolute;
  right: 15px;
  top: 15px;
  z-index: 100;
  background-color: white;
  padding: 0 0 5px 5px;
  border-radius: 3px;
}
pre .code-editor-output-info {
  font-style: italic;
  color: grey;
}
.code-editor-output-info + .code-editor-output-info:last-child {
  margin-bottom: 10px;
}
pre .code-editor-output-seq {
  font-size:large
}
pre .code-editor-output-error-stack {
  color: red;
}

.splitter-pane-resizer.horizontal[style*="top: 100%"] {
  display: none;
}

.code-editor-status-bar {
  position: fixed;
  bottom: 5px;
  right: 12px;
  z-index: 100;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid darkgrey;
  color: grey;
  background-color: white;
}
.code-editor-status-bar span {
  font-family: Iosevka;
  font-size: 14px;
}
</style>
