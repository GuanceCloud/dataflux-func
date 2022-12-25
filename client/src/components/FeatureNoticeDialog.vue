<i18n locale="zh-CN" lang="yaml">
Don't prompt again: 不再提示
</i18n>

<template>
  <el-dialog
    id="FeatureNotice"
    :visible="show && !disabled"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="850px">
    <div class="feature-notice-container">
      <el-image style="width: 600px; left: -50px;" :src="image"></el-image>
      <el-card class="feature-notice-content">
        <i class="fa fa-fw feature-notice-icon" :class="icon"></i>
        <p v-html="description"></p>
      </el-card>
      <div class="feature-notice-buttons">
        <el-button type="text" @click="close(true)">{{ $t("Don't prompt again") }}</el-button>
        <el-button type="primary" size="small" @click="close()">{{ $t('OK') }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>

import img_featureNotice from '@/assets/img/feature-notice.png'

export default {
  name: 'FeatureNoticeDialog',
  components: {
  },
  watch: {
  },
  methods: {
    close(disable) {
      this.show = false;
      this.$store.commit('dismissFeatureNotice', this.featureKey);
      if (disable) {
        this.$store.commit('disableFeatureNotice', this.featureKey);
      }
    },
  },
  computed: {
  },
  props: {
    featureKey : String,
    description: String,
    icon: {
      type: String,
      default: 'fa-lightbulb-o',
    },
    image: {
      type: Object,
      default: img_featureNotice,
    },
    disabled: {
      type   : Boolean,
      default: false,
    }
  },
  data() {
    return {
      show: false,
    }
  },
  mounted() {
    setImmediate(() => {
      if (this.$store.getters.showFeatureNotice(this.featureKey)) {
        this.show = true;
      }
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.feature-notice-container {

}
.feature-notice-content {
  width: 480px;
  height: 270px;
  border-radius: 20px;
  position: absolute;
  top: 30px;
  right: 30px;
}
.feature-notice-content p {
  font-size: 18px;
  line-height: 1.8;
  word-break: break-word;
  position: relative;
}
.feature-notice-buttons {
  position: absolute;
  bottom: 30px;
  right: 30px;
}
.feature-notice-icon {
  position: absolute;
  font-size: 245px;
  right: -15%;
  bottom: -5%;
  color: #ff660018;
  line-height: 200px;
  z-index: 0;
}
</style>
<style>
</style>
