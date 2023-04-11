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
    <div class="notice-feature-container">
      <el-image style="width: 550px; left: -50px;" :src="image"></el-image>
      <el-card class="notice-feature-content">
        <i class="fa fa-fw notice-feature-icon" :class="icon"></i>
        <p v-html="description"></p>
      </el-card>
      <div class="notice-feature-buttons">
        <el-button type="text" @click="close(true)">{{ $t("Don't prompt again") }}</el-button>
        <el-button type="primary" size="small" @click="close()">{{ $t('OK') }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>

import img_noticeFeature from '@/assets/img/notice-feature.png'

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
      default: img_noticeFeature,
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
    setTimeout(() => {
      if (this.$store.getters.showFeatureNotice(this.featureKey)) {
        this.show = true;
      }
    }, 500);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.notice-feature-container {

}
.notice-feature-content {
  width: 420px;
  height: 350px;
  border-radius: 20px;
  position: absolute;
  top: 30px;
  right: 30px;
}
.notice-feature-content p {
  font-size: 16px;
  line-height: 20px;
  word-break: break-word;
  position: relative;
  padding: 0;
  margin: 0;
}
.notice-feature-buttons {
  position: absolute;
  bottom: 30px;
  right: 30px;
}
.notice-feature-icon {
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
.notice-feature-content h1,
.notice-feature-content p>h1 {
  text-align: center !important;
}
</style>
