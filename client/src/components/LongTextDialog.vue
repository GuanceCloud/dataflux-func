<template>
  <el-dialog
    :visible.sync="show"
    width="70%">
    <template slot="title">
      <el-button type="primary" plain @click="download">作为文本文件下载</el-button>
    </template>
    <span>
      <span>{{ title }}</span>
      <pre class="long-text-content">{{ content }}</pre>
    </span>
  </el-dialog>
</template>

<script>
import FileSaver from 'file-saver';

export default {
  name: 'LongTextDialog',
  components: {
  },
  watch: {
  },
  methods: {
    update(content, fileName) {
      this.content  = content;
      this.fileName = (fileName || 'dump') + '.txt';

      this.show = true;
    },
    download() {
      let blob = new Blob([this.content], {type: 'text/plain'});
      let fileName = this.fileName;
      FileSaver.saveAs(blob, fileName);
    },
  },
  computed: {
  },
  props: {
    title: String,
  },
  data() {
    return {
      show: false,

      fileName: null,
      content : null,
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.long-text-content {
  font-size: 12px;
}
</style>
<style>
</style>
