<template>
  <el-dialog
    :title="title || 'API调用示例'"
    :visible.sync="show"
    width="750px">
    <span>
      <span :class="descriptionClass">{{ description }}</span>

      <template v-if="showOptions">
        <el-divider content-position="left">请求选项</el-divider>
        <el-form class="call-options" label-width="80px">
          <el-form-item label="异步执行" v-if="showExecModeOption">
            <el-switch
              v-model="callOptions.execMode"
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

          <el-form-item label="执行超时" v-if="showTimeoutOption">
            <el-input-number
              v-model="callOptions.timeout"
              size="mini"
              step-strictly
              :step="1"
              :min="$store.getters.CONFIG('_FUNC_TASK_MIN_TIMEOUT')" :max="$store.getters.CONFIG('_FUNC_TASK_MAX_TIMEOUT')">
            </el-input-number>&#12288;秒
          </el-form-item>

          <el-form-item label="API超时" v-if="showAPITimeoutOption">
            <el-input-number
              v-model="callOptions.apiTimeout"
              size="mini"
              step-strictly
              :step="1"
              :min="$store.getters.CONFIG('_FUNC_TASK_MIN_API_TIMEOUT')" :max="$store.getters.CONFIG('_FUNC_TASK_MAX_API_TIMEOUT')">
            </el-input-number>&#12288;秒
          </el-form-item>
        </el-form>
      </template>

      <el-divider content-position="left">编辑请求</el-divider>
      <el-row :gutter="20">
        <el-col :span="22">
          <el-input
            type="textarea"
            readonly
            autosize
            resize="none"
            v-model="apiURLExample">
          </el-input>
        </el-col>
        <el-col :span="2">
          <CopyButton :content="apiURLExample"></CopyButton>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="apiBodyExample">
        <el-col :span="22">
          <el-input
            type="textarea"
            autosize
            resize="none"
            v-model="apiBodyExample">
          </el-input>
          <InfoBlock type="info" title="POST请求时，Content-Type 应设置为 application/json"></InfoBlock>
          <InfoBlock v-if="apiBodyExample && common.containsFuncArgumentPlaceholder(apiBodyExample) >= 0" type="info" title="&quot;INPUT_BY_CALLER&quot;为需要填写的参数，请根据需要进行修改"></InfoBlock>
          <InfoBlock v-if="supportCustomKwargs" type="success" title="本函数允许传递额外的自定义函数参数"></InfoBlock>
          <InfoBlock v-if="supportFileUpload" type="success" title="本函数支持文件上传，文件字段名为&quot;files&quot;"></InfoBlock>
        </el-col>
        <el-col :span="2">
          <CopyButton :content="apiBodyExample"></CopyButton>
        </el-col>
      </el-row>

      <template v-if="!apiBody">
        <span class="text-bad">Body内容填写存在错误，正确填写后将展示示例</span>
      </template>
      <template v-else>
        <template v-if="showGetExampleSimplified">
          <el-divider content-position="left">GET 简化形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link v-if="stringParametersOnly"
                type="primary"
                :href="apiURLWithQueryExample_simplified"
                target="_blank"
                class="api-url-with-query">
                <code v-html="apiURLWithQueryExampleText_simplified"></code>
              </el-link>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                title="此方式参数值只支持字符串，且不支持 options 参数"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiURLWithQueryExample_simplified"></CopyButton>
            </el-col>
          </el-row>
        </template>

        <template v-if="showGetExample">
          <el-divider content-position="left">GET 标准形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link type="primary" :href="apiURLWithQueryExample" target="_blank" class="api-url-with-query"><code v-html="apiURLWithQueryExampleText"></code></el-link>
              <InfoBlock type="info" title="kwargs 参数为 POST 方式中对 kwargs 参数进行 JSON 序列化，再进行 URL 编码后的字符串"></InfoBlock>
              <InfoBlock type="info" title="kwargs 参数处理代码参考：encodeURIComponent(JSON.stringify(kwargs))"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton :content="apiURLWithQueryExample"></CopyButton>
            </el-col>
          </el-row>
        </template>

        <template v-if="showGetExampleFlattened">
          <el-divider content-position="left">GET 扁平形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link v-if="stringParametersOnly"
                type="primary"
                :href="apiURLWithQueryExample_flattened"
                target="_blank"
                class="api-url-with-query">
                <code v-html="apiURLWithQueryExampleText_flattened"></code>
              </el-link>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                title="此方式参数值只支持字符串"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiURLWithQueryExample_flattened"></CopyButton>
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExampleSimplified">
          <el-divider content-position="left">POST 简化形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-input v-if="stringParametersOnly"
                type="textarea"
                readonly
                autosize
                resize="none"
                :value="apiCallByCurlExample_simplified"></el-input>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                title="此方式参数值只支持字符串，且不支持 options 参数"></InfoBlock>
              <InfoBlock type="info" title="单纯提交数据时，Content-Type 可以指定为 &quot;multipart/form-data&quot; 或 &quot;application/x-www-form-urlencoded&quot;"></InfoBlock>
              <InfoBlock type="info" title="上传文件时，Content-Type 需要指定为 &quot;multipart/form-data&quot;"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiCallByCurlExample_simplified"></CopyButton>
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExample">
          <el-divider content-position="left">POST 标准形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-input
                type="textarea"
                readonly
                autosize
                resize="none"
                :value="apiCallByCurlExample">
              </el-input>
              <InfoBlock type="info" title="此方式不支持文件上传"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton :content="apiCallByCurlExample"></CopyButton>
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExampleFlattened">
          <el-divider content-position="left">POST 扁平形式请求</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-input
                v-if="stringParametersOnly"
                type="textarea"
                readonly
                autosize
                resize="none"
                :value="apiCallByCurlExample_flattened">
              </el-input>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                title="此方式参数值只支持字符串"></InfoBlock>
              <InfoBlock type="info" title="单纯提交数据时，Content-Type 可以指定为 &quot;multipart/form-data&quot; 或 &quot;application/x-www-form-urlencoded&quot;"></InfoBlock>
              <InfoBlock type="info" title="上传文件时，Content-Type 需要指定为 &quot;multipart/form-data&quot;"></InfoBlock>
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiCallByCurlExample_flattened"></CopyButton>
            </el-col>
          </el-row>
        </template>
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
        let apiBodyExample = null;
        try { apiBodyExample = JSON.parse(this.apiBodyExample) } catch(_) {}

        if (!apiBodyExample) return;

        apiBodyExample.options = apiBodyExample.options || {};
        for (let k in val) {
          if (val[k] === this.DEFAULT_CALL_OPTIONS[k]) {
            delete apiBodyExample.options[k];
          } else {
            apiBodyExample.options[k] = val[k];
          }
        }

        if (this.T.isNothing(apiBodyExample.options)) {
          delete apiBodyExample.options;
        }

        this.apiBodyExample = JSON.stringify(apiBodyExample, null, 2);
      },
    },
  },
  methods: {
    prettyURLForHTML(url) {
      if (!url) return '';

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
    washAPIBody(apiBody) {
      apiBody = this.T.jsonCopy(apiBody);

      if (this.T.isNothing(apiBody)) {
        return apiBody;
      }

      if (!this.T.isNothing(apiBody.kwargs)) {
        for (let k in apiBody.kwargs) {
          // 不展示**kwargs、files
          if (k.indexOf('**') === 0 || k === 'files') {
            delete apiBody.kwargs[k];
          }
        }
      }

      if (this.T.isNothing(apiBody.kwargs)) {
        delete apiBody.kwargs;
      }
      if (this.T.isNothing(apiBody.options)) {
        delete apiBody.options;
      }
      return apiBody;
    },
    update(apiURLExample, apiBodyExample, funcKwargs) {
      apiBodyExample         = apiBodyExample         || {};
      apiBodyExample.kwargs  = apiBodyExample.kwargs  || {};
      apiBodyExample.options = apiBodyExample.options || {};
      funcKwargs             = funcKwargs             || {};

      // 初始化
      this.supportFileUpload   = false;
      this.supportCustomKwargs = false;
      for (let k in this.callOptions) {
        this.callOptions[k] = this.DEFAULT_CALL_OPTIONS[k];
      }

      // 判断是否支持上传文件
      if (apiBodyExample.kwargs.files) {
        this.supportFileUpload = this.common.isFuncArgumentPlaceholder(apiBodyExample.kwargs.files);
      }

      // 判断是否支持额外参数
      for (let k in funcKwargs) {
        if (k.indexOf('**') === 0) {
          this.supportCustomKwargs = true;
          break;
        }
      }

      // 清洗apiBodyExample
      apiBodyExample = this.washAPIBody(apiBodyExample);
      if (this.T.isNothing(apiBodyExample)) {
        apiBodyExample = '';
      } else {
        apiBodyExample = JSON.stringify(apiBodyExample, null, 2);
      }

      this.apiURLExample  = apiURLExample;
      this.apiBodyExample = apiBodyExample;

      this.show = true;
    },

    getAPIURLWithQueryExample(format, asText, decodeURL) {
      if (!this.apiBody) return null;
      let apiBody = this.washAPIBody(this.apiBody);

      format = format || 'normal';
      asText = asText || false;

      let url   = null;
      let query = {};
      switch(format) {
        case 'normal':
          query = apiBody || query;
          url = this.T.formatURL(this.apiURLExample, {query: query});
          break;

        case 'simplified':
          if (apiBody && apiBody.kwargs) {
            query = apiBody.kwargs || query;
          }
          url = this.T.formatURL(`${this.apiURLExample}/simplified`, {query: query});
          break;

        case 'flattened':
          if (apiBody) {
            if (apiBody.kwargs) {
              for (let k in apiBody.kwargs) {
                query[`kwargs_${k}`] = apiBody.kwargs[k];
              }
            }

            if (apiBody.options) {
              for (let k in apiBody.options) {
                query[`options_${k}`] = apiBody.options[k];
              }
            }
          }
          url = this.T.formatURL(`${this.apiURLExample}/flattened`, {query: query});
          break;
      }

      if (asText) {
        url = this.prettyURLForHTML(url);
      }

      if (decodeURL) {
        url = decodeURIComponent(url);
      }
      return url;
    },
    getAPICallByCurlPostExample(format) {
      if (!this.apiBody) return null;
      let apiBody = this.washAPIBody(this.apiBody);

      format = format || 'normal';

      let url       = '';
      let headerOpt = '';
      let dataOpt   = '';

      switch(format) {
        case 'normal':
          url = this.apiURLExample;
          headerOpt = `-H "Content-Type: application/json"`;

          if (!this.T.isNothing(apiBody)) {
            dataOpt = `-d '${JSON.stringify(apiBody)}'`
          }

          break;

        case 'simplified':
          url = `${this.apiURLExample}/${format}`;

          if (!this.T.isNothing(apiBody.kwargs)) {
            for (let k in apiBody.kwargs) {
              dataOpt += ` -F ${k}=${apiBody.kwargs[k]}`;
            }
          }

          if (this.supportFileUpload) {
            headerOpt = `-H "multipart/form-data"`;
            dataOpt += ` -F files=@FILE_TO_UPLOAD`;
          } else {
            headerOpt = `-H "application/x-www-form-urlencoded"`;
          }

          break;

        case 'flattened':
          url = `${this.apiURLExample}/${format}`;
          headerOpt = `-H "application/x-www-form-urlencoded"`;

          if (!this.T.isNothing(apiBody.kwargs)) {
            for (let k in apiBody.kwargs) {
              dataOpt += ` -F kwargs_${k}=${apiBody.kwargs[k]}`;
            }
          }

          if (!this.T.isNothing(apiBody.options)) {
            for (let k in apiBody.options) {
              dataOpt += ` -F options_${k}=${apiBody.options[k]}`;
            }
          }

          if (this.supportFileUpload) {
            dataOpt += ` -F kwargs_files=@FILE_TO_UPLOAD`;
          }

          break;
      }

      let curlCmd = 'curl -X POST';
      if (headerOpt) curlCmd += ` ${headerOpt.trim()}`;
      if (dataOpt)   curlCmd += ` ${dataOpt.trim()}`;
      if (url)       curlCmd += ` ${url.trim()}`;

      return curlCmd;
    },
  },
  computed: {
    DEFAULT_CALL_OPTIONS() {
      return {
        execMode  : 'sync',
        saveResult: false,
        timeout   : this.$store.getters.CONFIG('_FUNC_TASK_DEFAULT_TIMEOUT'),
        apiTimeout: this.$store.getters.CONFIG('_FUNC_TASK_DEFAULT_API_TIMEOUT'),
      }
    },
    showOptions() {
      return this.showExecModeOption
          || this.showSaveResultOption
          || this.showTimeoutOption
          || this.showAPITimeoutOption;
    },

    apiBody() {
      if (!this.apiBodyExample) return {};

      let apiBody = null;
      try {
        apiBody = JSON.parse(this.apiBodyExample);
      } catch(err) {
        // 无法解析JSON
        return null;
      }

      return apiBody;
    },
    apiURLWithQueryExample() {
      return this.getAPIURLWithQueryExample('normal');
    },
    apiURLWithQueryExample_flattened() {
      return this.getAPIURLWithQueryExample('flattened');
    },
    apiURLWithQueryExample_simplified() {
      return this.getAPIURLWithQueryExample('simplified');
    },
    apiURLWithQueryExampleText() {
      return this.getAPIURLWithQueryExample('normal', true, true);
    },
    apiURLWithQueryExampleText_simplified() {
      return this.getAPIURLWithQueryExample('simplified', true, true);
    },
    apiURLWithQueryExampleText_flattened() {
      return this.getAPIURLWithQueryExample('flattened', true, true);
    },

    apiCallByCurlExample() {
      return this.getAPICallByCurlPostExample('normal');
    },
    apiCallByCurlExample_simplified() {
      return this.getAPICallByCurlPostExample('simplified');
    },
    apiCallByCurlExample_flattened() {
      return this.getAPICallByCurlPostExample('flattened');
    },

    stringParametersOnly() {
      if (!this.apiBody) return false;

      let kwargs = this.apiBody.kwargs || {};
      for (let k in kwargs) {
        if ('string' !== typeof kwargs[k]) return false;
      }

      return true;
    },
  },
  props: {
    title           : String,
    description     : String,
    descriptionClass: Object,

    showExecModeOption: {
      type: Boolean,
      default: false,
    },
    showSaveResultOption: {
      type: Boolean,
      default: false,
    },
    showTimeoutOption: {
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
    showGetExampleSimplified: {
      type: Boolean,
      default: false,
    },
    showGetExampleFlattened: {
      type: Boolean,
      default: false,
    },
    showPostExample: {
      type: Boolean,
      default: true,
    },
    showPostExampleSimplified: {
      type: Boolean,
      default: false,
    },
    showPostExampleFlattened: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      show: false,

      supportFileUpload  : false,
      supportCustomKwargs: false,

      apiURLExample : null,
      apiBodyExample: null,
      funcKwargs    : null,

      callOptions: {
        execMode  : null,
        saveResult: null,
        timeout   : null,
        apiTimeout: null,
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.api-url-with-query .el-link--inner {
  padding: 0 5px;
}
.call-options .el-form-item {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
<style>
</style>
