<template>
  <el-dialog
    id="LongTextDialog"
    :visible.sync="show"
    width="70%">
    <template slot="title">
      <el-link type="primary" @click="download">
        作为文本文件下载
        <i class="fa fa-fw fa-download"></i>
      </el-link>
    </template>
    <div>
      <p>{{ title }}</p>
      <textarea id="longTextDialogContent"></textarea>
    </div>
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

      setImmediate(() => {
        // 初始化编辑器
        if (!this.codeMirror) {
          this.codeMirror = this.T.initCodeMirror('longTextDialogContent');
          this.codeMirror.setOption('theme', this.T.getCodeMirrorThemeName());
          this.T.setCodeMirrorReadOnly(this.codeMirror, true);
        }

        // 载入代码
        this.codeMirror.setValue('');
        this.codeMirror.setValue(this.content || '');
        if (this.diffMode) {
          this.T.setCodeMirrorForDiff(this.codeMirror);
        } else {
          this.T.setCodeMirrorForText(this.codeMirror);
        }
        this.codeMirror.refresh();
      });
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
    diffMode: Boolean,
  },
  data() {
    return {
      show: false,

      fileName: null,
      content : null,

      codeMirror: null,
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
<style>
#LongTextDialog .el-dialog__body {
  padding: 5px 20px;
}
#LongTextDialog .CodeMirror {
  height: 100%;
}
</style>
