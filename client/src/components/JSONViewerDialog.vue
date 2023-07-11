<i18n locale="zh-CN" lang="yaml">
Download as a JSON file: 作为 JSON 文件下载
</i18n>

<template>
  <el-dialog
    id="JSONViewerDialog"
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
          {{ $t('Download as a JSON file') }}
          <i class="fa fa-fw fa-download"></i>
        </el-link>
      </div>
      <json-viewer :value="jsonContent" theme="json-view-theme" sort></json-viewer>
    </div>
  </el-dialog>
</template>

<script>
import FileSaver from 'file-saver';

export default {
  name: 'JSONViewerDialog',
  components: {
  },
  watch: {
  },
  methods: {
    update(content, fileName) {
      this.content  = content;
      this.fileName = (fileName || 'dump') + '.json';

      this.show = true;
    },
    download() {
      let blob = new Blob([this.content], {type: 'text/plain'});
      let fileName = this.fileName;
      FileSaver.saveAs(blob, fileName);
    },
  },
  computed: {
    jsonContent() {
      if ('string' === typeof this.content) {
        return JSON.parse(this.content);
      } else {
        return this.content;
      }
    }
  },
  props: {
    title       : String,
    showDownload: Boolean,
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
.download-link {
  margin-bottom: 15px;
}
</style>
<style>
.json-view-theme {
  font-size: 16px;

  .jv-ellipsis {
    color: white;
    background-color: #FF6600;
    display: inline-block;
    line-height: 0.9;
    font-size: 16px;
    padding: 0px 4px 2px 4px;
    border-radius: 3px;
    vertical-align: 2px;
    cursor: pointer;
    user-select: none;
  }

  .jv-link {
    font-family: "Iosevka";
    color: #FF6600;
    font-weight: bold;
  }
  .jv-key {
    font-family: "Iosevka";
  }
  .jv-item {
    font-family: "Iosevka";
    padding-left: 10px;
    padding-right: 10px;

    &.jv-boolean { color: #fc1e70 }
    &.jv-function { color: #067bca }
    &.jv-number { color: #fc1e70 }
    &.jv-number-float { color: #fc1e70 }
    &.jv-number-integer { color: #fc1e70 }
    &.jv-undefined { color: #e08331 }
    &.jv-string {
      color: #42b983;
      word-break: break-word;
      white-space: normal;
    }
  }
}
</style>
