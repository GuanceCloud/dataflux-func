<i18n locale="zh-CN" lang="yaml">
Clear Cache                                                         : 清除缓存
If you got trouble with UI or Code Editor, please try to clear cache: 如果界面、代码编辑器等存在问题，可尝试清除缓存来解决
Code Editor Setting                                                 : 代码编辑器配置
Including                                                           : 包括
Selected UI theme                                                   : 已选择的主题
Font size, line height                                              : 文字大小、行距
UI Status                                                           : 页面状态
Expanded items in Code Editor Aside                                 : 编辑器侧栏中当前已展开的栏目
Position of Aside separator, output box                             : 编辑器当前拖动的的编辑器侧栏、脚本输出栏位置
Position of Simple Debug Panel                                      : 简易调试面板当前位置
Position of Quick View Panel                                        : 快速查看面板当前位置
Selected Func, Highlighted line or error line                       : 编辑器当前选择的函数、高亮已选择函数所在行、高亮错误行
Position of scroll in Management                                    : 管理界面列表当前滚动所处位置
Notice messages or dialogs                                          : 提示信息及对话框
Search history                                                      : 搜索历史

System Info loaded from server               : 从服务器加载的系统信息
Page will refresh after clearing this content: 清除本项目会刷新页面

Clear: 清除

Cache is cleared                                          : 缓存已清除
Page will be refreshed, and config will reload from server: 即将刷新页面，并从服务器重新加载系统配置
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Clear Cache') }}
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="setup-form">
              <el-form ref="form" :model="form" label-width="0px">
                <el-form-item>
                  <InfoBlock type="info" :title="$t('If you got trouble with UI or Code Editor, please try to clear cache')" />
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_codeMirrorSettings">
                    <strong>{{ $t('Code Editor Setting') }}</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">{{ $t('Including') }}{{ $t(':') }}
                    <br/>&emsp;{{ $t('Selected UI theme')}}
                    <br/>&emsp;{{ $t('Font size, line height')}}
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_UIStatus">
                    <strong>{{ $t('UI Status') }}</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">{{ $t('Including') }}{{ $t(':') }}
                    <br/>&emsp;{{ $t('Expanded items in Code Editor Aside') }}
                    <br/>&emsp;{{ $t('Position of Aside separator, output box') }}
                    <br/>&emsp;{{ $t('Position of Simple Debug Panel') }}
                    <br/>&emsp;{{ $t('Position of Quick View Panel') }}
                    <br/>&emsp;{{ $t('Selected Func, Highlighted line or error line') }}
                    <br/>&emsp;{{ $t('Position of scroll in Management') }}
                    <br/>&emsp;{{ $t('Notice messages or dialogs') }}
                    <br/>&emsp;{{ $t('Search history') }}
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_systemInfo">
                    <strong>{{ $t('System Info loaded from server') }}</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">{{ $t('Page will refresh after clearing this content') }}</div>
                </el-form-item>

                <el-form-item>
                  <el-button tabindex="5" type="primary" @click="clearCache" class="clear-cache-button">{{ $t('Clear') }}</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ClearCache',
  components: {
  },
  watch: {
  },
  methods: {
    async clearCache() {
      if (this.form.clear_codeMirrorSettings) {
        this.$store.commit('updateCodeMirrorSettings', null);
      }

      if (this.form.clear_UIStatus) {
        this.$store.commit('updateAsideScript_expandedNodeMap', null);
        this.$store.commit('updateAsideScript_quickViewWindowPosition', null);
        this.$store.commit('updateAsideConnector_simpleDebugWindowPosition', null);
        this.$store.commit('updateCodeEditor_splitPanePercent', null);
        this.$store.commit('updateCodeEditor_highlightedLineConfigMap', null);
        this.$store.commit('updateCodeViewer_highlightedLineConfigMap', null);
        this.$store.commit('updateEditor_selectedItemId', null);
        this.$store.commit('updateEditor_splitPanePercent', null);
        this.$store.commit('updateTableList_scrollY', null);
        this.$store.commit('resetFeatureNotice');
        this.$store.commit('clearFuzzySearchHistory');
      }

      let _message = this.$t('Cache is cleared');
      if (this.form.clear_systemInfo) {
        _message += `<br><span class="text-bad">${this.$t('Page will be refreshed, and config will reload from server')}</span>`;
      }

      this.T.notify(_message);

      if (this.form.clear_systemInfo) {
        // 延迟3秒，保证提示能够正常展示
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      form: {
        clear_UIStatus         : true,
        clear_codeMirrorSettings: true,
        clear_systemInfo     : false,
      },
    }
  },
  created() {
    this.$store.commit('updateLoadStatus', true);
  },
}
</script>

<style>
.setup-form .clear-cache-button {
  margin-left: 35px;
}
</style>
