<template>
  <div class="logo-img" :style="{width: width || '165px', height: height || '30px'}" :class="[`logo-img-${logoTheme}`]"></div>
</template>

<script>
export default {
  name: 'Logo',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    width : String,
    height: String,
    type  : String,
  },
  computed: {
    logoTheme() {
      if (this.type === 'auto') {
        return this.$store.getters.uiTheme;
      } else {
        return this.type;
      }
    },
  },
  data() {
    return {}
  },
  created() {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.logo-text {
  font-family: serif;
  font-size: 24px;
  font-style: italic;
  position: relative;
}
.logo-text-func {
  font-size: 30px;
  position: relative;
  top: -5px;
  right: -4px;
}
.logo-text-func-arg {
  font-size: 20px;
  position: relative;
  top: -3px;
  left: 3px;
}
.logo-img {
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
}
.logo-img-light {
  background-image: url(../assets/img/logo-dataflux-func.png);
}
.logo-img-dark {
  background-image: url(../assets/img/logo-dataflux-func-w.png);
}

@media (prefers-color-scheme: light) {
  .logo-img-auto {
    background-image: url(../assets/img/logo-dataflux-func.png);
  }
}
@media (prefers-color-scheme: dark) {
  .logo-img-auto {
    background-image: url(../assets/img/logo-dataflux-func-w.png);
  }
}
</style>
