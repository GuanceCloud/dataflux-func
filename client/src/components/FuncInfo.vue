<i18n locale="zh-CN" lang="yaml">
Func not exists: 函数不存在
</i18n>

<template>
  <div>
    <template v-if="id">
      <strong class="func-title">{{ title || name }}</strong>
      <GotoFuncButton :funcId="id"></GotoFuncButton>
      <br>
      <el-tag type="info" size="mini"><code>def</code></el-tag>
      <code class="text-main text-small">{{ id }}(</code>
      <div class="func-kwargs-block" v-for="(value, name, index) in kwargsJSON">
        <code class="func-kwargs-name">{{ name }}</code>
        <code class="func-kwargs-value" v-if="value === 'FROM_PARAMETER'">调用时指定</code>
        <el-tooltip placement="top" v-else>
          <pre class="func-kwargs-value" slot="content">{{ JSON.stringify(value, null, 2) }}</pre>
          <code class="func-kwargs-value">固定值</code>
        </el-tooltip>
        <span v-if="index < T.jsonLength(kwargsJSON) - 1">,&nbsp;</span>
      </div>
      <code class="text-main text-small">)</code>
    </template>
    <template v-else>
      <span class="text-bad">{{ $t('Func not exists') }}</span>
    </template>
  </div>
</template>

<script>
export default {
  name: 'FuncInfo',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    id        : String,
    title     : String,
    name      : String,
    kwargsJSON: Object,
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.func-title {
  font-size: 16px;
}
.func-kwargs-block {
  display: inline-block;
}
.func-kwargs-name {
  font-style: italic;
  color: #ff6600;
  font-weight: bold;
}
.func-kwargs-name:after {
  content: ' =';
  color: red;
}
pre.func-kwargs-value {
  padding: 0;
  margin: 0;
}
</style>
