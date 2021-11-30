<i18n locale="zh-CN" lang="yaml">
Func not exists: 函数不存在
</i18n>

<template>
  <div class="func-info">
    <template v-if="id">
      <strong class="func-title">{{ title || name }}</strong>
      <GotoFuncButton :funcId="id"></GotoFuncButton>
      <br>
      <template v-if="fullDefinition">
        <!-- 优先使用定义方式展示 -->
        <code class="text-main">{{ fullDefinition }}</code>
      </template>
      <template v-else>
        <!-- 其次封装方式展示 -->
        <code class="text-main">{{ id }}(</code
        ><code v-if="!kwargsJSON">...</code
        ><template v-else>
          <div class="func-kwargs-block" v-for="(value, name, index) in kwargsJSON">
            <code class="func-kwargs-name">{{ name }}</code>
            <code class="func-kwargs-value" v-if="common.isFuncArgumentPlaceholder(value)">调用时指定</code>
            <el-tooltip placement="top" v-else>
              <pre class="func-kwargs-value" slot="content">{{ JSON.stringify(value, null, 2) }}</pre>
              <code class="func-kwargs-value">固定值</code>
            </el-tooltip>
            <span v-if="index < T.jsonLength(kwargsJSON) - 1">,&nbsp;</span>
          </div>
        </template
        ><code class="text-main">)</code>
      </template>
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
    fullDefinition() {
      if (this.id && this.definition) {
        return `${this.id.split('.')[0]}.${this.definition}`;
      } else {
        return '';
      }
    },
  },
  props: {
    mode      : String,
    title     : String,
    definition: String,
    id        : String,
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
.func-info {
  font-size: 16px;
}
.func-title {
  font-size: 18px;
}
.func-kwargs-block {
  display: inline-block;
}
.func-kwargs-name {
  color: #ff6600;
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
