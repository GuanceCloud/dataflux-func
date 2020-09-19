<template>
  <div class="copy-button">
    <el-tooltip
      effect="dark"
      :enterable="false"
      :value="showTip"
      :manual="manualTip"
      :content="tipContent"
      :placement="tipPlacement || 'right'">
      <el-button
        ref="copyButton"
        :type="type || 'text'"
        :size="size || 'mini'"
        :data-clipboard-text="content">
        <span style="font-size: 14px">
          <i class="fa fa-clipboard"></i>
          {{ title }}
        </span>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'CopyButton',
  components: {
  },
  watch: {
  },
  methods: {
    showCopiedTip(tipContent) {
      this.tipContent = '已复制';
      this.showTip    = true;
      this.manualTip  = true;

      setTimeout(() => {
        this.showTip   = false;
        this.manualTip = false;

        setTimeout(() => {
          this.tipContent = '点击复制';
        }, 500);
      }, 1000);
    },
  },
  computed: {
  },
  props: {
    type        : String,
    title       : String,
    content     : String,
    tipPlacement: String,

    size: String,
  },
  data() {
    return {
      manualTip : false,
      showTip   : false,
      tipContent: '点击复制',
    }
  },
  mounted() {
    let copyButton = this.$refs.copyButton.$el;
    let clipboard = new this.clipboard(copyButton, {
      text: (trigger) => {
        return this.content;
      }
    });

    clipboard.on('success', e => {
      this.showCopiedTip();
    });
    clipboard.on('error', e => {
      this.showCopiedTip('当前浏览器不支持');
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.copy-button {
  display: inline-block;
  margin-left: 5px;
}
</style>
