<i18n locale="zh-CN" lang="yaml">
Func not exists: 函数不存在
Fixed          : 固定值
By Input       : 调用时指定
</i18n>

<template>
  <div class="func-info">
    <template v-if="id">
      <strong class="func-title">{{ title || name }}</strong>
      <GotoFuncButton v-if="!hideGotoFunc" :funcId="id"></GotoFuncButton>
      <br>
      <span class="text-info">def</span>&nbsp;
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
            <code class="func-kwargs-value" v-if="common.isFuncArgumentPlaceholder(value)"><{{ $t('By Input') }}></code>
            <el-tooltip placement="top" v-else>
              <div slot="content">
                <pre class="func-kwargs-value">{{ JSON.stringify(value, null, 2) }}</pre>
                <CopyButton :content="JSON.stringify(value, null, 2)" :title="$t('Copy')" font-size="12px"></CopyButton>
              </div>
              <code class="func-kwargs-value"><{{ $t('Fixed') }}></code>
            </el-tooltip>
            <span v-if="index < T.jsonLength(kwargsJSON) - 1">,&nbsp;</span>
          </div>
        </template
        ><code class="code-font text-main">)</code>
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
    title       : String,
    definition  : String,
    id          : String,
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
.func-info {
  font-size: 16px;
}
.func-title {
  font-size: 18px;
  line-height: 25px;
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
