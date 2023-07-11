<i18n locale="zh-CN" lang="yaml">
Func not exists: 函数不存在

Get from the arguments when calling: 在调用时从参数中获取
</i18n>

<template>
  <div class="func-info">
    <!-- 函数标题 -->
    <strong class="func-title">
      <span v-if="id">{{ title || name }}</span>
      <span v-else class="func-not-exists text-bad">{{ $t('Func not exists') }}</span>
    </strong>
    <GotoFuncButton v-if="id && !hideGotoFunc" :funcId="id"></GotoFuncButton>

    <!-- 函数定义 -->
    <br>
    <span class="code-font text-info">def</span>
    <template v-if="fullDefinition">
      <!-- 优先使用定义方式展示 -->
      <code class="code-font text-main">{{ fullDefinition }}</code>
    </template>
    <template v-else>
      <!-- 其次封装方式展示 -->
      <code class="code-font text-main">{{ configFuncId }}(</code
      ><code v-if="!kwargsJSON" class="code-font">...</code
      ><template v-else>
        <div class="code-font func-kwargs-block" v-for="(value, name, index) in kwargsJSON">
          <el-tooltip placement="top">
            <div slot="content">
              <pre class="func-kwargs-value" v-if="common.isFuncArgumentPlaceholder(value)">{{ $t('Get from the arguments when calling') }}</pre>
              <pre class="func-kwargs-value" v-else>{{ T.limitText(JSON.stringify(value, null, 2), 500, { showLength: 'newLine' }) }}</pre>
            </div>
            <code class="func-kwargs-name">{{ name }}</code>
          </el-tooltip><span v-if="index < T.jsonLength(kwargsJSON) - 1">,&nbsp;</span>
        </div>
      </template
      ><code class="code-font text-main">)</code>
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
    name() {
      return this.id.split('.').pop();
    },
    fullDefinition() {
      if (this.id && this.definition) {
        return `${this.id.split('.')[0]}.${this.definition}`;
      } else {
        return '';
      }
    },
  },
  props: {
    mode        : String,
    configFuncId: String,
    id          : String,
    title       : String,
    definition  : String,
    kwargsJSON  : Object,
    hideGotoFunc: Boolean,
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
.func-info {
  font-size: 16px;
}
.func-not-exists {
  font-size: 14px;
}
.func-kwargs-block {
  display: inline-block;
}
.func-kwargs-name {
  color: #ff6600;
  padding: 0px 5px;
}
pre.func-kwargs-value {
  padding: 0;
  margin: 0;
}
</style>
