<i18n locale="zh-CN" lang="yaml">
Go to the Func: 前往此函数
</i18n>

<!-- Generated by OpenCC START -->
<i18n locale="zh-HK" lang="yaml">
Go to the Func: 前往此函數
</i18n>
<i18n locale="zh-TW" lang="yaml">
Go to the Func: 前往此函式
</i18n>
<!-- Generated by OpenCC END -->

<template>
  <div class="goto-func-button">
    <el-tooltip
      effect="dark"
      :enterable="false"
      :content="$t('Go to the Func')"
      :placement="tipPlacement || 'right'">
      <el-button
        :type="type || 'text'"
        :size="size || 'mini'"
        @click.stop="gotoFunc">
        <span style="font-size: 14px">
          <i class="fa fa-share-square"></i>
        </span>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'GotoFuncButton',
  components: {
  },
  watch: {
  },
  methods: {
    gotoFunc() {
      this.$store.commit('updateCodeEditor_isCodeLoaded', false);

      // 自动展开
      let nextExpandedNodeMap = this.T.jsonCopy(this.$store.state.asideScript_expandedNodeMap);
      nextExpandedNodeMap[this.scriptSetId] = true;
      nextExpandedNodeMap[this.scriptId]    = true;
      this.$store.commit('updateAsideScript_expandedNodeMap', nextExpandedNodeMap);

      // 记录选择的脚本 ID，记录函数高亮
      this.$store.commit('updateEditor_selectedItemId', this.funcId);

      // 跳转
      this.$router.push({
        name  : 'code-viewer',
        params: { id: this.scriptId },
      });
    },
  },
  computed: {
    scriptSetId() {
      return this.funcId.split('__')[0];
    },
    scriptId() {
      return this.funcId.split('.')[0];
    },
  },
  props: {
    type        : String,
    funcId      : String,
    tipPlacement: String,

    size: String,
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.goto-func-button {
  display: inline-block;
  margin-left: 5px;
}
</style>
