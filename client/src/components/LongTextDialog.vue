<i18n locale="zh-CN" lang="yaml">
Download as a text file: 作为文本文件下载
</i18n>

<template>
  <el-dialog
    id="LongTextDialog"
    :visible.sync="show"
    :close-on-click-modal="false"
    width="70%">
    <template slot="title">
      {{ title }}
      <span class="text-info press-esc-to-close-tip">{{ $t('Press ESC to close') }}</span>
    </template>
    <div>
      <div class="download-link" v-if="showDownload && fileName && content">
        <el-link type="primary" @click="download">
          {{ $t('Download as a text file') }}
          <i class="fa fa-fw fa-download"></i>
        </el-link>
      </div>
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
      if (this.codeMirror) {
        // 清空原始内容
        this.codeMirror.setValue('');
      }

      this.content  = content;
      this.fileName = (fileName || 'dump') + '.txt';

      this.show = true;

      setImmediate(() => {
        // 初始化编辑器
        if (!this.codeMirror) {
          this.codeMirror = this.T.initCodeMirror('longTextDialogContent', this.mode || 'text');
          this.codeMirror.setOption('theme', this.T.getCodeMirrorThemeName());
          this.T.setCodeMirrorReadOnly(this.codeMirror, true);
        }

        // 载入代码
        this.codeMirror.setValue(this.content || '');
        this.codeMirror.refresh();

        this.codeMirror.focus();
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
    title       : String,
    mode        : String,
    showDownload: Boolean,
  },
  data() {
    return {
      show: false,

      fileName: null,
      content : null,

      codeMirror: null,
    }
  },
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.download-link {
  margin-bottom: 15px;
}
</style>
<style>
#LongTextDialog .CodeMirror {
  height: 100%;
}
</style>
