<template>
  <div class="form-tip" v-show="alwaysShow || reason && (matchReason === reason || '*' === matchReason)">
    <el-alert
      :title="title"
      :show-icon="true"
      :closable="false"
      type="error">
    </el-alert>
  </div>
</template>

<script>
export default {
  name: 'ErrorBlock',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    title      : String,
    alwaysShow : Boolean,
    reason     : String,
    matchReason: String,
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
</style>
