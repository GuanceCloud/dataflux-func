<i18n locale="zh-CN" lang="yaml">
Loading: 加载中
</i18n>

<template>
  <h1 class="loading">
    <i class="fa fa-fw fa-circle-o-notch fa-spin"></i>
    {{ $t('Loading') }}
  </h1>
</template>

<script>
export default {
  name: 'PageLoading',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.loading {
  font-size: 40px;
  text-align: center;
  width: 100%;
  margin-top: 50px;
}
</style>
