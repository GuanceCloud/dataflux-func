<!-- # NOTE: i18n 翻译在 locales.yaml 中定义 -->
<i18n locale="zh-CN" lang="yaml">
</i18n>

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
        <span :style="{ 'font-size': fontSize || '14px' }">
          <i class="fa fa-fw fa-clipboard"></i> {{ title }}
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
    showCopiedTip(tipStatus) {
      this.tipStatus = tipStatus || 'ok';
      this.showTip   = true;
      this.manualTip = true;

      setTimeout(() => {
        this.showTip   = false;
        this.manualTip = false;

        setTimeout(() => {
          this.tipStatus = tipStatus || 'ready';
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

    size    : String,
    fontSize: String,
  },
  computed: {
    tipContent() {
      switch (this.tipStatus) {
        case 'ready':
          return this.$root.i18n.t('Click to Copy');

        case 'ok':
          return this.$root.i18n.t('Copied');

        case 'error':
          return this.$root.i18n.t('Browser not supported');
      }
    }
  },
  data() {
    return {
      manualTip: false,
      showTip  : false,
      tipStatus: 'ready',

      clipboard: null,
    }
  },
  mounted() {
    let copyButton = this.$refs.copyButton.$el;
    this.clipboard = new this.clipboardJS(copyButton, {
      text: (trigger) => {
        return this.content;
      }
    });

    this.clipboard.on('success', e => {
      this.showCopiedTip();
    });
    this.clipboard.on('error', e => {
      this.showCopiedTip('error');
    });
  },
  beforeDestroy() {
    if (this.clipboard) this.clipboard.destroy();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.copy-button {
  display: inline-block;
  margin-left: 5px;
}
</style>
