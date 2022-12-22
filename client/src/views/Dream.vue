<i18n locale="zh-CN" lang="yaml">
"If you're reading this"                                          : 如果你正在读这段话
"You've been in a coma for almost 20 years"                       : 你已经昏迷快 20 年了
"We are now trying new treatment plans"                           : 你已经昏迷快20年了
"We don't know where this message will appear in your dream world": 我们不知道这段信息会出现在你梦境的哪里
"But we really hope you can see it"                               : 但是我们真心希望你可以看到
"Please wake up"                                                  : 请快醒来
</i18n>

<template>
  <div class="dream">
    <h1>{{ $t("If you're reading this") }}</h1>
    <h1>{{ $t("You've been in a coma for almost 20 years") }}</h1>
    <h1>{{ $t("We are now trying new treatment plans") }}</h1>
    <h1>{{ $t("We don't know where this message will appear in your dream world") }}</h1>
    <h1>{{ $t('But we really hope you can see it') }}</h1>
    <h1>{{ $t('Please wake up') }}</h1>
  </div>
</template>

<script>
export default {
  name: 'Dream',
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
  created() {
  },
  mounted() {
  },
}
</script>

<style scoped>
.dream {
  margin-top: 10%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
