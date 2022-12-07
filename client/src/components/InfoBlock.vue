<template>
  <div class="form-tip" v-if="T.notNothing(title)">
    <el-alert
      :show-icon="true"
      :closable="false"
      :type="type">
      <template slot="title">
        <template v-for="line in title.split('\n')">
          <code class="line">{{ line }}</code><br>
        </template>
      </template>
    </el-alert>
  </div>
</template>

<script>
export default {
  name: 'InfoBlock',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    title: String,
    type: String,
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
.form-tip {
  line-height: 20px;
  padding: 5px 0 5px 0;
}
.el-alert {
  align-items: baseline !important;
}
.line {
  word-break: break-word;
}
</style>
