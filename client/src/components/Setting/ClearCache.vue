<i18n locale="zh-CN" lang="yaml">
Clear Cache                                                         : 清除缓存
If you got trouble with UI or Code Editor, please try to clear cache: 如果界面、代码编辑器等存在问题，可尝试清除缓存来解决
Code Editor Setting                                                 : 代码编辑器配置
'Including:'                                                        : 包括：
Selected UI theme                                                   : 已选择的主题
Font size, line height                                              : 文字大小、行距
</i18n>
<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('清除缓存') }}
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" label-width="0px">
                <el-form-item>
                  <InfoBlock type="info" :title="$t('If you got trouble with UI or Code Editor, please try to clear cache')"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_codeMirrorSetting">
                    <strong>{{ $t('Code Editor Setting') }}</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">{{ $t('Including:') }}
                    <br/>&#12288;{{ $t('Selected UI theme')}}
                    <br/>&#12288;{{ $t('Font size, line height')}}
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_UIStatus">
                    <strong>页面状态</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">{{ $t('Including:') }}
                    <br/>&#12288;编辑器侧栏中当前已展开的栏目
                    <br/>&#12288;编辑器当前拖动的的编辑器侧栏、脚本输出栏位置
                    <br/>&#12288;简易调试面板当前位置
                    <br/>&#12288;快速查看面板当前位置
                    <br/>&#12288;编辑器当前选择的函数、高亮已选择函数所在行、高亮错误行
                    <br/>&#12288;管理界面列表当前滚动所处位置
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-checkbox v-model="form.clear_systemConfig">
                    <strong>从服务器加载的系统配置</strong>
                  </el-checkbox>
                  <div class="text-small form-item-tip">清除本项目会刷新页面</div>
                </el-form-item>

                <el-form-item>
                  <el-button tabindex="5" type="primary" @click="clearCache" class="clear-cache-button">清除</el-button>
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
      if (this.form.clear_codeMirrorSetting) {
        this.$store.commit('updateCodeMirrorSetting', null);
      }

      if (this.form.clear_UIStatus) {
        this.$store.commit('updateAsideScript_expandedNodeMap', null);
        this.$store.commit('updateAsideScript_currentNodeKey', null);
        this.$store.commit('updateAsideScript_quickViewWindowPosition', null);
        this.$store.commit('updateAsideDataSource_simpleDebugWindowPosition', null);
        this.$store.commit('updateCodeEditor_splitPanePercent', null);
        this.$store.commit('updateCodeEditor_highlightedLineConfigMap', null);
        this.$store.commit('updateCodeViewer_highlightedLineConfigMap', null);
        this.$store.commit('updateEditor_highlightedFuncId', null);
        this.$store.commit('updateEditor_splitPanePercent', null);
        this.$store.commit('updateAuthLinkList_scrollY', null);
        this.$store.commit('updateCrontabConfigList_scrollY', null);
      }

      let alertMessage = '缓存已清除';
      if (this.form.clear_systemConfig) {
        alertMessage += '<br><span class="text-bad">即将刷新页面，并从服务器重新加载系统配置</span>';
      }

      await this.$alert(alertMessage, '清除缓存', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '非常好',
        type: 'success',
      });

      if (this.form.clear_systemConfig) {
        location.reload();
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
        clear_codeMirrorSetting: true,
        clear_systemConfig     : false,
      },
    }
  },
  created() {
    this.$store.commit('updateLoadStatus', true);
  },
}
</script>

<style>
.common-form .clear-cache-button {
  margin-left: 35px;
}
</style>
