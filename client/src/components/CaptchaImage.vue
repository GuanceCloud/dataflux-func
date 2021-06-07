<template>
  <div class="captcha-image">
    <div v-html="captchaImageRaw"></div>
  </div>
</template>

<script>

export default {
  name: 'CaptchaImage',
  components: {
  },
  watch: {
    captchaToken: {
      immediate: true,
      async handler(oldVal, newVal) {
        await this.showCaptchaImage();
      }
    }
  },
  methods: {
    async showCaptchaImage() {
      if (!this.captchaToken) return;

      let query = {
        captchaToken: this.captchaToken,
      }
      if (this.captchaCategory) {
        query.captchaCategory =  this.captchaCategory;
      }
      let apiRes = await this.T.callAPI_get(this.captchaUrl, {
        respType: 'text',
        query   : query,
      });

      this.captchaImageRaw = apiRes || '';
    },
  },
  computed: {
  },
  props: {
    captchaCategory: String,
    captchaToken   : String,
    captchaUrl: {
      type: String,
      default: '/api/v1/captcha/do/get',
    }
  },
  data() {
    return {
      captchaImageRaw: '',
    }
  },
  created() {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.captcha-image {
  cursor: pointer;
}
</style>
