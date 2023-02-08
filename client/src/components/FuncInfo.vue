<i18n locale="zh-CN" lang="yaml">
Func not exists: 函数不存在
Fixed          : 固定值
By Input       : 传入值

Get from the arguments when calling: 在调用时从参数中获取
</i18n>

<template>
  <div class="func-info">
    <template v-if="id">
      <strong class="func-title">{{ title || name }}</strong>
      <GotoFuncButton v-if="!hideGotoFunc" :funcId="id"></GotoFuncButton>
      <br>
      <span class="code-font text-info">def</span>
      <template v-if="fullDefinition">
        <!-- 优先使用定义方式展示 -->
        <code class="code-font text-main">{{ fullDefinition }}</code>
      </template>
      <template v-else>
        <!-- 其次封装方式展示 -->
        <code class="code-font text-main">{{ id }}(</code
        ><code v-if="!kwargsJSON" class="code-font">...</code
        ><template v-else>
          <div class="code-font func-kwargs-block" v-for="(value, name, index) in kwargsJSON">
            <code class="func-kwargs-name">{{ name }}</code>

            <el-tooltip placement="top" v-if="common.isFuncArgumentPlaceholder(value)">
              <div slot="content">
                <pre class="func-kwargs-value">{{ $t('Get from the arguments when calling') }}</pre>
              </div>
              <code>{{ $t('By Input') }}</code>
            </el-tooltip>
            <template v-else>
              <el-tooltip placement="top">
                <div slot="content">
                  <pre class="func-kwargs-value">{{ JSON.stringify(value, null, 2) }}</pre>
                </div>
                <code>{{ $t('Fixed') }}</code>
              </el-tooltip><CopyButton :content="JSON.stringify(value, null, 2)" />
            </template>

            <span v-if="index < T.jsonLength(kwargsJSON) - 1">,&nbsp;</span>
          </div>
        </template
        ><code class="code-font text-main">)</code>
      </template>
    </template>
    <template v-else>
      <span class="func-not-exists text-bad">{{ $t('Func not exists') }}</span>
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
