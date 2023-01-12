<i18n locale="en" lang="yaml">
seconds: Second | Seconds
</i18n>

<i18n locale="zh-CN" lang="yaml">
API Example: API 调用示例

Request Options: 请求选项
Async       : 异步执行
Save Result : 保留结果
Func Timeout: 函数超时
API Timeout : API 超时

Build Request: 构建请求
'HTTP Header &quot;Content-Type&quot; should be &quot;application/json&quot; when using POST'                 : 'POST请求时，&quot;Content-Type&quot; 应设置为 &quot;application/json&quot;'
'&quot;INPUT_BY_CALLER&quot; is the argument of the Python function, please modify it according to your needs': '&quot;INPUT_BY_CALLER&quot;为 Python 函数的参数，请根据需要进行修改'
'This Python function allows additional parameters (**kwargs syntax)'                                         : '本 Python 函数允许传递额外的参数（**kwargs 语法）'
'This Python function allows uploading files, field name of the uploading file is &quot;files&quot;'          : '本 Python 函数支持文件上传，文件字段名为&quot;files&quot;'

'Invalid Body content. Examples require a valid Body content': 'Body 内容填写存在错误，正确填写后将展示示例'

Simplified Form for GET: GET 简化形式
'Only string arguments are allowed in this from. And parameter &quot;options&quot; are not supported': '此方式参数值只支持字符串，且不支持 &quot;options&quot; 参数'

Normal Form for GET: GET 标准形式
'Parameter &quot;kwargs&quot; should be URL encoded in HTTP request': '发送请求时，&quot;kwargs&quot; 参数需要进行 URL encode 编码'

Flattened Form for GET: GET 扁平形式请求
'Only string arguments are allowed in this from': '此方式参数值只支持字符串'

Simplified Form for POST: POST 简化形式请求
'Parameter &quot;options&quot; are not supported in this from'                                                                                                                                       : '此方式不支持 &quot;options&quot; 参数'
'When posting form data, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot; or &quot;application/x-www-form-urlencoded&quot;, and the values of the fields support string value only': '表单形式提交时，&quot;Content-Type&quot; 必须指定为 &quot;multipart/form-data&quot; 或 &quot;application/x-www-form-urlencoded&quot;，此时 Body 中参数值只支持字符串'
'When posting JSON data, &quot;Content-Type&quot; should be &quot;application/json&quot;, together with the Python function containing **kwargs parameter, Body can be any JSON data'                : 'JSON 形式提交时，&quot;Content-Type&quot; 必须指定为 &quot;application/json&quot;，配合包含 **kwargs 的 Python 函数，此时 Body 可以为任意 JSON 数据'
'When uploading files, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot;'                                                                                                           : '上传文件时，&quot;Content-Type&quot; 必须指定为 &quot;multipart/form-data&quot;'

Normal Form for POST: POST 标准形式
'File uploading is not supported in this this form': '此方式不支持文件上传'

Flattened Form for POST: POST 扁平形式请求
'When posting data, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot; or &quot;application/x-www-form-urlencoded&quot;' : '提交数据时，&quot;Content-Type&quot; 可以指定为 &quot;multipart/form-data&quot; 或 &quot;application/x-www-form-urlencoded&quot;'

seconds: 秒
</i18n>

<template>
  <el-dialog
    :title="title || $t('API Example')"
    :visible.sync="show"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="750px">
    <span>
      <span :class="descriptionClass">{{ description }}</span>

      <template v-if="showOptions">
        <el-divider content-position="left">{{ $t('Request Options') }}</el-divider>
        <el-form class="call-options" label-width="120px">
          <el-form-item :label="$t('Async')" v-if="showExecModeOption">
            <el-switch
              v-model="callOptions.execMode"
              inactive-value="sync"
              active-value="async">
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('Save Result')" v-if="showSaveResultOption">
            <el-switch
              v-model="callOptions.saveResult"
              :inactive-value="false"
              :active-value="true">
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('Func Timeout')" v-if="showTimeoutOption">
            <el-input-number
              v-model="callOptions.timeout"
              size="mini"
              step-strictly
              :step="1"
              :precision="0"
              :min="$store.getters.CONFIG('_FUNC_TASK_MIN_TIMEOUT')" :max="$store.getters.CONFIG('_FUNC_TASK_MAX_TIMEOUT')">
            </el-input-number>&emsp;{{ $tc('seconds', callOptions.timeout) }}
          </el-form-item>

          <el-form-item :label="$t('API Timeout')" v-if="showAPITimeoutOption">
            <el-input-number
              v-model="callOptions.apiTimeout"
              size="mini"
              step-strictly
              :step="1"
              :precision="0"
              :min="$store.getters.CONFIG('_FUNC_TASK_MIN_API_TIMEOUT')" :max="$store.getters.CONFIG('_FUNC_TASK_MAX_API_TIMEOUT')">
            </el-input-number>&emsp;{{ $tc('seconds', callOptions.apiTimeout) }}
          </el-form-item>
        </el-form>
      </template>

      <el-divider content-position="left">{{ $t('Build Request') }}</el-divider>
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
          <CopyButton :content="apiURLExample" />
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="apiBodyExample || supportCustomKwargs">
        <el-col :span="22">
          <el-input
            type="textarea"
            autosize
            resize="none"
            v-model="apiBodyExample">
          </el-input>
          <InfoBlock type="info"
            :title="$t('HTTP Header &quot;Content-Type&quot; should be &quot;application/json&quot; when using POST')" />
          <InfoBlock type="info" v-if="apiBodyExample && common.containsFuncArgumentPlaceholder(apiBodyExample) >= 0"
            :title="$t('&quot;INPUT_BY_CALLER&quot; is the argument of the Python function, please modify it according to your needs')" />
          <InfoBlock type="success" v-if="supportCustomKwargs"
            :title="$t('This Python function allows additional parameters (**kwargs syntax)')" />
          <InfoBlock type="success" v-if="supportFileUpload"
            :title="$t('This Python function allows uploading files, field name of the uploading file is &quot;files&quot;')" />
        </el-col>
        <el-col :span="2">
          <CopyButton :content="apiBodyExample" />
        </el-col>
      </el-row>

      <template v-if="!apiBody">
        <span class="text-bad">{{ $t('Invalid Body content. Examples require a valid Body content') }}</span>
      </template>
      <template v-else>
        <template v-if="showGetExampleSimplified">
          <el-divider content-position="left">{{ $t('Simplified Form for GET') }}</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link v-if="stringParametersOnly"
                type="primary" :underline="true"
                :href="apiURLWithQueryExample_simplified"
                target="_blank"
                class="api-url-with-query">
                <code v-html="apiURLWithQueryExampleText_simplified"></code>
              </el-link>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                :title="$t('Only string arguments are allowed in this from. And parameter &quot;options&quot; are not supported')" />
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiURLWithQueryExample_simplified" />
            </el-col>
          </el-row>
        </template>

        <template v-if="showGetExample">
          <el-divider content-position="left">{{ $t('Normal Form for GET') }}</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link
                type="primary" :underline="true"
                :href="apiURLWithQueryExample"
                target="_blank"
                class="api-url-with-query">
                <code v-html="apiURLWithQueryExampleText"></code>
              </el-link>
              <InfoBlock type="info" :title="$t('Parameter &quot;kwargs&quot; should be URL encoded in HTTP request')" />
            </el-col>
            <el-col :span="2">
              <CopyButton :content="apiURLWithQueryExample" />
            </el-col>
          </el-row>
        </template>

        <template v-if="showGetExampleFlattened">
          <el-divider content-position="left">{{ $t('Flattened Form for GET') }}</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-link v-if="stringParametersOnly"
                type="primary" :underline="true"
                :href="apiURLWithQueryExample_flattened"
                target="_blank"
                class="api-url-with-query">
                <code v-html="apiURLWithQueryExampleText_flattened"></code>
              </el-link>
              <InfoBlock
                :type="stringParametersOnly ? 'info' : 'error'"
                :title="$t('Only string arguments are allowed in this from')" />
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiURLWithQueryExample_flattened" />
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExampleSimplified">
          <el-divider content-position="left">{{ $t('Simplified Form for POST') }}</el-divider>
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
                :title="$t('Parameter &quot;options&quot; are not supported in this from')" />
              <InfoBlock type="info" :title="$t('When posting form data, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot; or &quot;application/x-www-form-urlencoded&quot;, and the values of the fields support string value only')" />
              <InfoBlock type="info" :title="$t('When posting JSON data, &quot;Content-Type&quot; should be &quot;application/json&quot;, together with the Python function containing **kwargs parameter, Body can be any JSON data')" />
              <InfoBlock type="info" :title="$t('When uploading files, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot;')" />
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiCallByCurlExample_simplified" />
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExample">
          <el-divider content-position="left">{{ $t('Normal Form for POST') }}</el-divider>
          <el-row :gutter="20">
            <el-col :span="22">
              <el-input
                type="textarea"
                readonly
                autosize
                resize="none"
                :value="apiCallByCurlExample">
              </el-input>
              <InfoBlock type="info" :title="$t('File uploading is not supported in this this form')" />
            </el-col>
            <el-col :span="2">
              <CopyButton :content="apiCallByCurlExample" />
            </el-col>
          </el-row>
        </template>

        <template v-if="showPostExampleFlattened">
          <el-divider content-position="left">{{ $t('Flattened Form for POST') }}</el-divider>
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
                :title="$t('Only string arguments are allowed in this from')" />
              <InfoBlock type="info" :title="$t('When posting data, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot; or &quot;application/x-www-form-urlencoded&quot;')" />
              <InfoBlock type="info" :title="$t('When uploading files, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot;')" />
            </el-col>
            <el-col :span="2">
              <CopyButton v-if="stringParametersOnly"
                :content="apiCallByCurlExample_flattened" />
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

      if (this.T.notNothing(apiBody.kwargs)) {
        for (let k in apiBody.kwargs) {
          // 不展示**kwargs、files
          if (k.indexOf('**') === 0 || k === 'files') {
            delete apiBody.kwargs[k];
          }
        }
      }

      if (this.T.isNothing(apiBody.kwargs) && !this.supportCustomKwargs) {
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

          if (this.T.notNothing(apiBody)) {
            dataOpt = `-d '${JSON.stringify(apiBody)}'`;
          }

          break;

        case 'simplified':
          url = `${this.apiURLExample}/${format}`;

          if (this.supportFileUpload) {
            headerOpt = `-H "Content-Type: multipart/form-data"`;

            if (this.T.notNothing(apiBody.kwargs)) {
              for (let k in apiBody.kwargs) {
                dataOpt += ` -F '${k}=${apiBody.kwargs[k]}'`;
              }
            }
            dataOpt += ` -F files=@FILE_TO_UPLOAD`;

          } else {
            headerOpt = `-H "Content-Type: application/x-www-form-urlencoded"`;

            if (this.T.notNothing(apiBody.kwargs)) {
              dataOpt += ` -d '${this.T.formatQuery(apiBody.kwargs)}'`;
            }
          }

          break;

        case 'flattened':
          url = `${this.apiURLExample}/${format}`;
          headerOpt = `-H "Content-Type: application/x-www-form-urlencoded"`;

          if (this.T.notNothing(apiBody.kwargs)) {
            for (let k in apiBody.kwargs) {
              dataOpt += ` -F kwargs_${k}=${apiBody.kwargs[k]}`;
            }
          }

          if (this.T.notNothing(apiBody.options)) {
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
