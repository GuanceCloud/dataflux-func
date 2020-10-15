<template>
  <el-dialog
    :title="title || 'API调用示例'"
    :visible.sync="show"
    width="750px">
    <span>
      <span>{{ description }}</span>

      <template v-if="showOptions">
        <el-divider content-position="left">请求选项</el-divider>
        <el-form class="call-options" label-width="80px">
          <el-form-item label="异步执行" v-if="showModeOption">
            <el-switch
              v-model="callOptions.mode"
              inactive-value="sync"
              active-value="async">
            </el-switch>
          </el-form-item>

          <el-form-item label="保留结果" v-if="showSaveResultOption">
            <el-switch
              v-model="callOptions.saveResult"
              :inactive-value="false"
              :active-value="true">
            </el-switch>
          </el-form-item>

          <el-form-item label="API超时" v-if="showAPITimeoutOption">
            <el-input-number
              v-model="callOptions.apiTimeout"
              size="mini"
              step-strictly
              :step="1"
              :min="1" :max="30">
            </el-input-number>&#12288;秒
          </el-form-item>
        </el-form>
      </template>

      <template v-if="showPostExample">
        <el-divider content-position="left">POST 请求格式</el-divider>
        <el-row :gutter="20" style="margin-bottom: 5px;">
          <el-col :span="22">
            <el-input
              type="textarea"
              :autosize="true"
              :readonly="true"
              resize="none"
              v-model="apiURLExample">
            </el-input>
          </el-col>
          <el-col :span="2">
            <CopyButton :content="apiURLExample"></CopyButton>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-input
              type="textarea"
              :autosize="true"
              v-model="apiBodyExample">
            </el-input>
            <InfoBlock type="info" title="Content-Type 应设置为 application/json"></InfoBlock>
            <InfoBlock v-if="apiBodyExample && apiBodyExample.indexOf('FROM_PARAMETER') >= 0" type="info" title="&quot;FROM_PARAMETER&quot;为需要填写的参数，请根据需要进行修改"></InfoBlock>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiURLWithQueryExample" :content="apiBodyExample"></CopyButton>
          </el-col>
        </el-row>
      </template>

      <template v-if="showGetExample">
        <el-divider content-position="left">GET 方式请求</el-divider>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-link type="primary" :href="apiURLWithQueryExample" target="_blank" class="api-url-with-query"><code v-html="apiURLWithQueryExampleText"></code></el-link>
            <template v-if="apiURLWithQueryExample">
              <InfoBlock type="info" title="kwargs 参数即，上述POST方式中 kwargs 参数进行 JSON 序列化，再进行 URL 编码后的字符串"></InfoBlock>
              <InfoBlock type="info" title="kwargs 参数处理代码参考：encodeURIComponent(JSON.stringify(kwargs))"></InfoBlock>
            </template>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiURLWithQueryExample" :content="apiURLWithQueryExample"></CopyButton>
          </el-col>
        </el-row>
      </template>

      <template v-if="showGetExampleFlattened">
        <el-divider content-position="left">GET 方式请求（扁平形式，<code>.../flattened?kwargs_key=value</code>）</el-divider>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-link type="primary" :href="apiURLWithQueryFlattenedExample" target="_blank" class="api-url-with-query"><code v-html="apiURLWithQueryFlattenedExampleText"></code></el-link>
            <template v-if="apiURLWithQueryFlattenedExample">
              <InfoBlock type="info" title="此方式参数值只支持字符串"></InfoBlock>
            </template>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiURLWithQueryFlattenedExample" :content="apiURLWithQueryFlattenedExample"></CopyButton>
          </el-col>
        </el-row>
      </template>

      <template v-if="showGetExampleSimplified">
        <el-divider content-position="left">GET 方式请求（简化形式，<code>.../simplified?key=value</code>）</el-divider>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-link type="primary" :href="apiURLWithQuerySimplifiedExample" target="_blank" class="api-url-with-query"><code v-html="apiURLWithQuerySimplifiedExampleText"></code></el-link>
            <template v-if="apiURLWithQuerySimplifiedExample">
              <InfoBlock type="info" title="此方式参数值只支持字符串，且不支持options参数"></InfoBlock>
            </template>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiURLWithQuerySimplifiedExample" :content="apiURLWithQuerySimplifiedExample"></CopyButton>
          </el-col>
        </el-row>
      </template>

      <template v-if="showPostExample">
        <el-divider content-position="left">CURL 方式请求（POST）</el-divider>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-link type="primary" :underline="false" class="api-call-by-curl"><code v-html="apiCallByCurlExampleText"></code></el-link>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiCallByCurlExample" :content="apiCallByCurlExample"></CopyButton>
          </el-col>
        </el-row>

        <el-divider content-position="left"><a class="text-main" href="https://httpie.org/" target="_blank">HTTPie</a> 方式请求（POST）</el-divider>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-link type="primary" :underline="false" class="api-call-by-httpie"><code v-html="apiCallByHTTPieExampleText"></code></el-link>
          </el-col>
          <el-col :span="2">
            <CopyButton v-if="apiCallByHTTPieExample" :content="apiCallByHTTPieExample"></CopyButton>
          </el-col>
        </el-row>
      </template>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'APIExampleDialog',
  components: {
  },
  watch: {
    callOptions: {
      deep: true,
      handler(val) {
        this.update(this.apiURLExample, this.apiBodyExample);
      },
    },
  },
  methods: {
    prettyURLForHTML(url) {
      try {
        let urlParts = url.split('?');
        if (!urlParts[1]) return url;

        let paramParts = urlParts[1].split('&');
        for (let i = 0; i < paramParts.length; i++) {
          if (i === 0) {
            paramParts[i] = '?' + paramParts[i];
          } else {
            paramParts[i] = '&' + paramParts[i];
          }
        }

        let prettied = urlParts[0] + '<br>' + paramParts.join('<br>');

        return prettied;

      } catch(err) {
        console.error(err);
        return url;
      }
    },
    update(apiURLExample, apiBodyExample) {
      if ('string' === typeof apiBodyExample) {
        apiBodyExample = JSON.parse(apiBodyExample);
      }

      let nextCallOptions = {};
      let fillOptions = (field, skipValue) => {
        if (this.callOptions[field] === skipValue) return;
        nextCallOptions[field] = this.callOptions[field];
      }

      fillOptions('mode', 'sync');
      fillOptions('saveResult', false);
      fillOptions('apiTimeout', 5);

      let nextAPIBodyExample = {}
      if (!this.T.isNothing(apiBodyExample.kwargs)) {
        nextAPIBodyExample.kwargs = apiBodyExample.kwargs;

        // **kwargs 转换为OTHER_ARGS: FROM_PARAMETER
        if (!this.T.isNothing(nextAPIBodyExample.kwargs)) {
          for (let k in nextAPIBodyExample.kwargs) {
            if (k.indexOf('**') < 0) continue;

            delete nextAPIBodyExample.kwargs[k];
            nextAPIBodyExample.kwargs['OTHER_ARGS'] = 'FROM_PARAMETER';
            break;
          }
        }
      }

      if (!this.T.isNothing(nextCallOptions)) {
        nextAPIBodyExample.options = nextCallOptions;
      }

      this.apiURLExample  = apiURLExample;
      this.apiBodyExample = JSON.stringify(nextAPIBodyExample, null, 2);

      this.show = true;
    },
  },
  computed: {
    INVALID_BODY_HTML() {
      return '<span style="color:red">本内容与上述POST请求内容联动，但Body内容填写存在错误</span>';
    },
    showOptions() {
      return this.showModeOption
          || this.showSaveResultOption
          || this.showAPITimeoutOption;
    },
    apiBody() {
      if (!this.apiBodyExample) return '';

      let apiBody = null;
      try {
        apiBody = JSON.parse(this.apiBodyExample);
      } catch(err) {
        return null;
      }

      return apiBody;
    },
    apiURLWithQueryExample() {
      if (!this.apiBody) return null;

      let apiURLWithQueryExample = this.T.formatURL(this.apiURLExample, {query: this.apiBody});
      return apiURLWithQueryExample;
    },
    apiURLWithQueryFlattenedExample() {
      if (!this.apiBody) return null;

      let flattenedQuery = {};
      if (this.apiBody.kwargs) {
        for (let k in this.apiBody.kwargs) {
          let v = this.apiBody.kwargs[k];
          flattenedQuery[`kwargs_${k}`] = v;
        }
      }
      if (this.apiBody.options) {
        for (let k in this.apiBody.options) {
          let v = this.apiBody.options[k];
          flattenedQuery[`options_${k}`] = v;
        }
      }
      let apiURLWithQueryFlattenedExample = this.T.formatURL(`${this.apiURLExample}/flattened`, {query: flattenedQuery});
      return apiURLWithQueryFlattenedExample;
    },
    apiURLWithQuerySimplifiedExample() {
      if (!this.apiBody) return null;

      let simplifiedQuery = {};
      if (this.apiBody.kwargs) {
        for (let k in this.apiBody.kwargs) {
          let v = this.apiBody.kwargs[k];
          simplifiedQuery[k] = v;
        }
      }
      let apiURLWithQuerySimplifiedExample = this.T.formatURL(`${this.apiURLExample}/simplified`, {query: simplifiedQuery});
      return apiURLWithQuerySimplifiedExample;
    },
    apiCallByCurlExample() {
      if (!this.apiBody) return null;

      let dataOpt = this.T.isNothing(this.apiBody)
                  ? ''
                  : `--data '${JSON.stringify(this.apiBody)}'`;
      let curlCmd = `curl -H "Content-Type: application/json" -X POST ${dataOpt} ${this.apiURLExample}`;
      return curlCmd;
    },
    apiCallByHTTPieExample() {
      if (!this.apiBody) return null;

      let httpieCmd = `http POST ${this.apiURLExample}`;
      if (this.apiBody.kwargs) {
        httpieCmd += ` kwargs:='${JSON.stringify(this.apiBody.kwargs)}'`;
      }
      if (this.apiBody.options) {
        httpieCmd += ` options:='${JSON.stringify(this.apiBody.options)}'`;
      }
      return httpieCmd;
    },

    apiURLWithQueryExampleText() {
      if (!this.apiURLWithQueryExample) return this.INVALID_BODY_HTML;
      console.log(this.apiURLWithQueryExample)
      return this.prettyURLForHTML(this.apiURLWithQueryExample);
    },
    apiURLWithQueryFlattenedExampleText() {
      if (!this.apiURLWithQueryFlattenedExample) return this.INVALID_BODY_HTML;
      return this.prettyURLForHTML(this.apiURLWithQueryFlattenedExample);
    },
    apiURLWithQuerySimplifiedExampleText() {
      if (!this.apiURLWithQuerySimplifiedExample) return this.INVALID_BODY_HTML;
      return this.prettyURLForHTML(this.apiURLWithQuerySimplifiedExample);
    },
    apiCallByCurlExampleText() {
      if (!this.apiCallByCurlExample) return this.INVALID_BODY_HTML
      return this.encoding.htmlEncode(this.apiCallByCurlExample);
    },
    apiCallByHTTPieExampleText() {
      if (!this.apiCallByHTTPieExample) return this.INVALID_BODY_HTML
      return this.encoding.htmlEncode(this.apiCallByHTTPieExample);
    },
  },
  props: {
    title: String,
    description: String,
    showModeOption: {
      type: Boolean,
      default: false,
    },
    showSaveResultOption: {
      type: Boolean,
      default: false,
    },
    showAPITimeoutOption: {
      type: Boolean,
      default: false,
    },
    showGetExample: {
      type: Boolean,
      default: true,
    },
    showGetExampleFlattened: {
      type: Boolean,
      default: false,
    },
    showGetExampleSimplified: {
      type: Boolean,
      default: false,
    },
    showPostExample: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      show: false,

      apiURLExample : null,
      apiBodyExample: null,

      callOptions: {
        mode      : 'sync',
        saveResult: false,
        apiTimeout: 5,
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.api-url-with-query .el-link--inner,
.api-call-by-curl .el-link--inner,
.api-call-by-httpie .el-link--inner {
  padding: 0 5px;
}
.call-options .el-form-item {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
<style>
</style>
