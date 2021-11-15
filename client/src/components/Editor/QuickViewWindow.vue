<i18n locale="zh-CN" lang="yaml">
Drag to place: 调整位置
</i18n>

<template>
  <div id="quickViewWindow"
    class="quick-view-window"
    v-show="show && script"
    :class="{'quick-view-window-no-scoll': isDragging}"
    :style="{top: showPosition.top + 'px', left: showPosition.left + 'px'}">
    <div @mousedown="startDrag" class="quick-view-header">
      <span class="quick-view-title">
        <span>{{ script.title || script.id }}</span>
      </span>
      <el-link class="quick-view-close" @mousedown.native.stop @click.stop="hideWindow()"><i class="fa fa-times"></i> {{ $t('Close') }}</el-link>
    </div>

    <div v-show="isDragging" class="quick-view-dragging-cover">
      <span class="quick-view-dragging-cover-tip">{{ $t('Drag to place') }}</span>
    </div>

    <el-tabs
      tab-position="bottom"
      type="border-card"
      v-model="selectedTab">
      <el-tab-pane :label="$t('Published')" name="code">
        <div class="quick-view-code">
          <textarea id="quickView_code"></textarea>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('Draft')" name="codeDraft">
        <div class="quick-view-code">
          <textarea id="quickView_codeDraft"></textarea>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'QuickViewWindow',
  components: {
  },
  watch: {
    selectedTab(val) {
      setImmediate(() => {
        switch(val) {
          case 'code':
            this.codeMirror_code.refresh();
            break;

          case 'codeDraft':
            this.codeMirror_codeDraft.refresh();
            break;
        }
      });
    },
  },
  methods: {
    async showWindow(scriptId) {
      let apiRes = await this.T.callAPI_get('/api/v1/scripts/:id/do/get', {
        params: { id: scriptId },
      });
      if (!apiRes.ok) return;

      if (!this.show) {
        this.$message({
          type    : 'warning',
          duration: 3000,
          message : '快速查看窗口仅在脚本侧边栏激活时显示，拖拽标题栏可以移动位置',
        });
      }

      this.script = apiRes.data;
      this.show = true;

      // 自动切换到第一个tab
      this.selectedTab = 'code';

      setImmediate(() => {
        this.fixShowPosition();

        // 初始化编辑器
        if (!this.codeMirror_code) {
          this.codeMirror_code = this.T.initCodeMirror('quickView_code');
          this.codeMirror_code.setOption('theme', this.T.getCodeMirrorThemeName());
          this.T.setCodeMirrorReadOnly(this.codeMirror_code, true);
        }

        if (!this.codeMirror_codeDraft) {
          this.codeMirror_codeDraft = this.T.initCodeMirror('quickView_codeDraft');
          this.codeMirror_codeDraft.setOption('theme', this.T.getCodeMirrorThemeName());
          this.T.setCodeMirrorReadOnly(this.codeMirror_codeDraft, true);
        }

        // 载入代码
        this.codeMirror_code.setValue('');
        this.codeMirror_code.setValue(this.script.code || '');
        this.codeMirror_code.refresh();

        this.codeMirror_codeDraft.setValue('');
        this.codeMirror_codeDraft.setValue(this.script.codeDraft || '');
        this.codeMirror_codeDraft.refresh();
      });
    },
    hideWindow() {
      this.show = false;
    },
    startDrag(event) {
      let $this = document.getElementById('quickViewWindow');

      let offsetX = event.screenX - $this.offsetLeft;
      let offsetY = event.screenY - $this.offsetTop;

      this.isDragging = true;

      document.onmousemove = docEvent => {
        let nextLeft = (docEvent || event).screenX - offsetX;
        let nextTop  = (docEvent || event).screenY - offsetY;

        let maxLeft = window.innerWidth  - $this.offsetWidth - 10;
        let maxTop  = window.innerHeight - $this.offsetHeight - 10;

        // 限位器
        if (nextLeft < 0) nextLeft = 0;
        if (nextTop  < 0) nextTop = 0;
        if (nextLeft > maxLeft) nextLeft = maxLeft;
        if (nextTop  > maxTop)  nextTop  = maxTop;

        let nextDragPosition = {
          left: nextLeft,
          top : nextTop,
        };

        this.dragPosition = nextDragPosition;
        this.$store.commit('updateAsideScript_quickViewWindowPosition', this.dragPosition);

        this.fixShowPosition();
      };
      document.onmouseup = docEvent => {
        document.onmousemove = null;
        document.onmouseup   = null;

        this.isDragging = false;
      };
    },
    fixShowPosition() {
      var nextShowPosition = {
        top : this.dragPosition.top,
        left: this.dragPosition.left,
      };

      let $this = document.getElementById('quickViewWindow');
      if (!$this) return;

      let maxLeft = window.innerWidth  - $this.offsetWidth - 10;
      let maxTop  = window.innerHeight - $this.offsetHeight - 10;

      // 限位器
      if (nextShowPosition.left < 0) nextShowPosition.left = 0;
      if (nextShowPosition.top  < 0) nextShowPosition.top = 0;
      if (nextShowPosition.left > maxLeft) nextShowPosition.left = maxLeft;
      if (nextShowPosition.top  > maxTop)  nextShowPosition.top  = maxTop;

      this.showPosition = nextShowPosition;
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    let dragPosition = this.$store.state.asideScript_quickViewWindowPosition || { left: 10, top : 10 };

    return {
      show: false,
      selectedTab: 'code',

      showPosition: this.T.jsonCopy(dragPosition),
      dragPosition: this.T.jsonCopy(dragPosition),
      isDragging  : false,

      script: {},

      codeMirror_code     : null,
      codeMirror_codeDraft: null,
    }
  },
  mounted() {
    window.addEventListener('resize', this.fixShowPosition, false);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.fixShowPosition, false);

    this.T.destoryCodeMirror(this.codeMirror_code);
    this.T.destoryCodeMirror(this.codeMirror_codeDraft);
  },
}
</script>

<style scoped>
.quick-view-window {
  position: fixed;
  z-index: 2060;
  height: 360px;
  width: 610px;
  border: 1px;
  border-radius: 5px;
  background-color: white;
  border: 5px solid lightgrey;
  box-shadow: grey 5px 5px 5px;
}
.quick-view-dragging-cover {
  background-color: lightgrey;
  height: 324px;
  width: 100%;
  position: absolute;
  z-index: 5;
  opacity: .7;
  text-align: center;
}
.quick-view-dragging-cover-tip {
  position: relative;
  font-size: 30px;
  top: 30%;
  background: black;
  padding: 5px 10px;
  border-radius: 5px;
  color: white;
}
.quick-view-header {
  cursor: move;
  width: 100%;
  height: 35px;
  border-bottom: 1px solid lightgrey;
}
.quick-view-title {
  font-size: 16px;
  line-height: 35px;
  margin-left: 10px;
}
.quick-view-close {
  cursor: pointer !important;
  float: right;
  margin-right: 10px;
  line-height: 36px;
}
.quick-view-code {
  font-size: 12px;
  line-height: 1.5;
}
</style>

<style>
.quick-view-window > .el-tabs {
  border: none;
}
.quick-view-window > .el-tabs > .el-tabs__content {
  height: 295px;
  padding: 0;
  overflow: auto;
}
.quick-view-window-no-scoll .CodeMirror-scroll {
  overflow: hidden !important;
}
.quick-view-window>.el-tabs>.el-tabs__header {
  margin-top: 0;
}
.quick-view-window>.el-tabs>.el-tabs__header .el-tabs__item {
  height: 30px;
  line-height: 30px;
}
</style>
