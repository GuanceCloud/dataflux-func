<i18n locale="en" lang="yaml">
seconds: Second | Seconds
</i18n>

<i18n locale="zh-CN" lang="yaml">
API Example: API 调用示例

Request Options: 请求选项
Async          : 异步执行
Save Result    : 保留结果
Func Timeout   : 函数超时
API Timeout    : API 超时

Input Parameters  : 填写参数
Calling Example   : 调用示例
Simple GET        : GET 简化形式
Normal GET        : GET 标准形式
Simple POST (JSON): POST 简化形式（JSON）
Simple POST (Form): POST 简化形式（表单）
Normal POST       : POST 标准形式

'The JSON inside "kwargs" is the call parameter, modify its value and check out the calling example below': '"kwargs" 内的 JSON 即为调用参数，修改其中的值并在下方查看具体调用示例'
'This Python function allows additional parameters (**kwargs syntax)'                                     : '本 Python 函数支持传递额外的参数（**kwargs 语法）'
'This Python function allows uploading files, field name of the uploading file is "files"'                : '本 Python 函数支持文件上传，文件字段名为"files"'

'Invalid Parameters. Examples require a valid Body content': '参数填写存在错误，正确填写后将展示示例'

'Only string arguments are allowed in this from'                                                                                                                       : '此方式参数值只支持字符串'
'Parameter "kwargs" should be URL encoded in HTTP request'                                                                                                             : '发送请求时，"kwargs" 参数需要进行 URL encode 编码'
'Parameter "options" are not supported in this from'                                                                                                                   : '此方式不支持 "options" 参数'
'When posting form data, "Content-Type" should be "multipart/form-data" or "application/x-www-form-urlencoded", and the values of the fields support string value only': 'POST 表单数据时，"Content-Type" 必须指定为 "multipart/form-data" 或 "application/x-www-form-urlencoded"，此时 Body 中参数值只支持字符串'
'When posting JSON data, "Content-Type" should be "application/json"'                                                                                                  : 'POST JSON 数据时，"Content-Type" 必须指定为 "application/json"'
'When uploading files, "Content-Type" should be "multipart/form-data"'                                                                                                 : '上传文件时，"Content-Type" 必须指定为 "multipart/form-data"'
'File uploading is not supported in this this form'                                                                                                                    : '此方式不支持文件上传'

seconds: 秒
</i18n>

<template>
  <el-dialog
    :title="title || $t('API Example')"
    :visible.sync="show"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="850px">
    <span>
      <template v-if="showOptions">
        <el-divider content-position="left"><h1>{{ $t('Request Options') }}</h1></el-divider>
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

      <el-divider content-position="left"><h1>{{ $t('Input Parameters') }}</h1></el-divider>
      <el-row :gutter="20" v-if="apiBodyInput || supportCustomKwargs">
        <el-col :span="22">
          <el-input
            type="textarea"
            autosize
            resize="none"
            v-model="apiBodyInput">
          </el-input>
          <InfoBlock type="info" v-if="apiBodyInput.indexOf('kwargs') >= 0"
            :title="$t('The JSON inside &quot;kwargs&quot; is the call parameter, modify its value and check out the calling example below')" />
          <InfoBlock type="success" v-if="supportCustomKwargs"
            :title="$t('This Python function allows additional parameters (**kwargs syntax)')" />
          <InfoBlock type="success" v-if="supportFileUpload"
            :title="$t('This Python function allows uploading files, field name of the uploading file is &quot;files&quot;')" />
        </el-col>
        <el-col :span="2">
          <CopyButton :content="apiBodyInput" />
        </el-col>
      </el-row>

      <el-divider content-position="left"><h1>{{ $t('Calling Example') }}</h1></el-divider>
      <template v-if="!apiBody">
        <span class="text-bad">{{ $t('Invalid Parameters. Examples require a valid Body content') }}</span>
      </template>
      <template v-else>
        <!-- GET 方式 -->
        <template v-if="showGet">
          <el-tabs tab-position="top">
            <el-tab-pane :label="$t('Simple GET')">
              <el-row :gutter="20">
                <el-col :span="22">
                  <el-link v-if="onlyStringParameter"
                    :href="getExample('simplified')"
                    :underline="true"
                    type="primary"
                    target="_blank"
                    class="get-example">
                    <code v-html="getExample('simplified', { asHTML: true, decodeURL: true })"></code>
                  </el-link>
                  <InfoBlock
                    :type="onlyStringParameter ? 'info' : 'error'"
                    :title="$t('Only string arguments are allowed in this from')" />
                  <InfoBlock v-if="showOptions" :title="$t('Parameter &quot;options&quot; are not supported in this from')" />
                </el-col>
                <el-col :span="2">
                  <CopyButton v-if="onlyStringParameter" :content="getExample('simplified')" />
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane :label="$t('Normal GET')">
              <el-row :gutter="20">
                <el-col :span="22">
                  <el-link
                    :href="getExample('normal')"
                    :underline="true"
                    type="primary"
                    target="_blank"
                    class="get-example">
                    <code v-html="getExample('normal', { asHTML: true, decodeURL: true })"></code>
                  </el-link>
                  <br>
                  <InfoBlock type="info" :title="$t('Parameter &quot;kwargs&quot; should be URL encoded in HTTP request')" />
                </el-col>
                <el-col :span="2">
                  <CopyButton :content="getExample('normal')" />
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane :label="$t('Simple POST (JSON)')">
              <el-row :gutter="20">
                <el-col :span="22">
                  <el-input
                    :value="postExample('simplified', { contentType: 'json' })"
                    :autosize="{ minRows: 6 }"
                    type="textarea"
                    resize="none"
                    readonly></el-input>
                  <InfoBlock type="info" :title="$t('When posting JSON data, &quot;Content-Type&quot; should be &quot;application/json&quot;')" />
                  <InfoBlock v-if="showOptions" :title="$t('Parameter &quot;options&quot; are not supported in this from')" />
                </el-col>
                <el-col :span="2">
                  <CopyButton :content="postExample('simplified', { contentType: 'json', oneLine: true })" />
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane :label="$t('Simple POST (Form)')">
              <el-row :gutter="20">
                <el-col :span="22">
                  <el-input
                    :value="postExample('simplified', { contentType: 'form' })"
                    :autosize="{ minRows: 6 }"
                    type="textarea"
                    resize="none"
                    readonly></el-input>
                  <InfoBlock type="info" :title="$t('When posting form data, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot; or &quot;application/x-www-form-urlencoded&quot;, and the values of the fields support string value only')" />
                  <InfoBlock v-if="supportFileUpload" type="warning" :title="$t('When uploading files, &quot;Content-Type&quot; should be &quot;multipart/form-data&quot;')" />
                  <InfoBlock v-if="showOptions" type="error" :title="$t('Parameter &quot;options&quot; are not supported in this from')" />
                </el-col>
                <el-col :span="2">
                  <CopyButton v-if="onlyStringParameter" :content="postExample('simplified', { contentType: 'form', oneLine: true })" />
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane :label="$t('Normal POST')">
              <el-row :gutter="20">
                <el-col :span="22">
                  <el-input
                    :value="postExample('normal')"
                    :autosize="{ minRows: 6 }"
                    type="textarea"
                    resize="none"
                    readonly></el-input>
                  <InfoBlock type="info" :title="$t('When posting JSON data, &quot;Content-Type&quot; should be &quot;application/json&quot;')" />
                  <InfoBlock v-if="supportFileUpload" type="error" :title="$t('File uploading is not supported in this this form')" />
                </el-col>
                <el-col :span="2">
                  <CopyButton :content="postExample('normal', { oneLine: true })" />
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>

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

      if (this.T.isNothing(apiBody)) return apiBody;

      // 无任何参数
      if (this.T.isNothing(apiBody.kwargs) && !this.supportCustomKwargs) {
        delete apiBody.kwargs;
      }

      // 无任何调用选项
      if (this.T.isNothing(apiBody.options)) {
        delete apiBody.options;
      }

      // 不展示 **kwargs、files
      if (this.T.notNothing(apiBody.kwargs)) {
        for (let k in apiBody.kwargs) {
          if (k.indexOf('**') === 0 || k === 'files') delete apiBody.kwargs[k];
        }
      }

      return apiBody;
    },

    update(apiURL, apiBody, funcKwargs) {
      apiBody         = apiBody         || {};
      apiBody.kwargs  = apiBody.kwargs  || {};
      apiBody.options = apiBody.options || {};

      this.apiKwargs  = this.T.jsonCopy(apiBody.kwargs);
      this.funcKwargs = this.T.jsonCopy(funcKwargs) || {};

      // 默认调用配置
      for (let k in this.callOptions) {
        this.callOptions[k] = this.DEFAULT_CALL_OPTIONS[k];
      }

      // 准备请求体
      apiBody = this.washAPIBody(apiBody);

      let apiBodyInput = ''
      if (this.T.notNothing(apiBody)) {
        apiBodyInput = JSON.stringify(apiBody, null, 2);
      }

      this.apiURL       = apiURL;
      this.apiBodyInput = apiBodyInput;

      this.show = true;
    },

    getExample(format, opt) {
      if (!this.apiBody) return null;

      format = format || 'normal';

      opt = opt || {};
      opt.asHTML    = opt.asHTML    || false;
      opt.decodeURL = opt.decodeURL || false;

      let body = this.washAPIBody(this.apiBody) || {};

      let url   = null;
      let query = {};
      switch(format) {
        // 标准形式
        case 'normal':
          query = body || query;
          url = this.T.formatURL(this.apiURL, { query: query });
          break;

        // 简化形式
        case 'simplified':
          query = body.kwargs || query;
          url = this.T.formatURL(this.apiURL_simplified, { query: query });
          break;
      }

      if (opt.asHTML)    url = this.prettyURLForHTML(url);
      if (opt.decodeURL) url = decodeURIComponent(url);

      return url;
    },
    postExample(format, opt) {
      if (!this.apiBody) return null;

      format = format || 'normal';

      opt = opt || {};
      opt.oneLine     = opt.oneLine     || false;
      opt.contentType = opt.contentType || 'json';

      let body = this.washAPIBody(this.apiBody) || {};

      let url = null;
      let shellNewLine = `\\\n`;
      let cURLOpts = [`curl`, shellNewLine, `-X`, `POST`, shellNewLine ];   // 示例仅限 cURL

      switch(format) {
        // 标准形式
        case 'normal':
          if (this.T.notNothing(body)) {
            cURLOpts.push(`-H`, `"Content-Type: application/json"`, shellNewLine);
            cURLOpts.push(`-d`, `'${JSON.stringify(body)}'`, shellNewLine);
          }
          cURLOpts.push(this.apiURL);
          break;

        // 简化形式
        case 'simplified':
          // 请求体
          if (this.T.notNothing(body.kwargs)) {
            switch(opt.contentType) {
              case 'json':
                cURLOpts.push(`-H`, `"Content-Type: application/json"`, shellNewLine);
                cURLOpts.push(`-d`, `'${JSON.stringify(body.kwargs)}'`, shellNewLine);
                break;

              case 'form':
                if (this.supportFileUpload) {
                  cURLOpts.push(`-H`, `"Content-Type: multipart/form-data"`, shellNewLine);
                  for (let k in body.kwargs) {
                    cURLOpts.push(`-F`, `'${k}=${body.kwargs[k]}'`, shellNewLine);
                  }

                } else {
                  cURLOpts.push(`-H`, `"Content-Type: application/x-www-form-urlencoded"`, shellNewLine);
                  cURLOpts.push(`-d`, `'${this.T.formatQuery(body.kwargs)}'`, shellNewLine);
                }
                break;
            }
          }

          // 上传文件
          if (this.supportFileUpload) {
            cURLOpts.push(`-F`, `files=@UPLOAD_FILE_PATH`, shellNewLine);
          }

          cURLOpts.push(this.apiURL_simplified);
          break;
      }

      if (opt.oneLine) {
        cURLOpts = cURLOpts.filter(item => item !== shellNewLine);
      }

      let cURLCmd = cURLOpts.join(' ');
      return cURLCmd;
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
    showGet() {
      return this.showGetExample
          || this.showGetExampleSimplified;
    },
    showPost() {
      return this.showPostExample
          || this.showPostExampleSimplified;
    },

    apiURL_simplified() {
      return `${this.apiURL}/simplified`;
    },
    apiBody() {
      if (!this.apiBodyInput) return {};

      let obj = null;
      try {
        obj = JSON.parse(this.apiBodyInput);
      } catch(err) {
        // 无法解析JSON
        return null;
      }

      return obj;
    },
    onlyStringParameter() {
      if (!this.apiBody) return false;

      let kwargs = this.apiBody.kwargs || {};
      for (let k in kwargs) {
        if ('string' !== typeof kwargs[k]) return false;
      }

      return true;
    },
    supportFileUpload() {
      if (this.apiKwargs && this.apiKwargs.files) {
        return this.common.isFuncArgumentPlaceholder(this.apiKwargs.files);
      }
      return false;
    },
    supportCustomKwargs() {
      if (this.funcKwargs) {
        for (let k in this.funcKwargs) {
          if (k.indexOf('**') === 0) return true;
        }
      }
      return false;
    },
  },
  props: {
    title: String,

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
    showPostExample: {
      type: Boolean,
      default: true,
    },
    showPostExampleSimplified: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      show: false,

      apiURL      : null,
      apiBodyInput: null,
      apiKwargs   : null,
      funcKwargs  : null,

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
.get-example {
  margin-bottom: 20px;
}
.get-example .el-link--inner {
  padding: 0 5px;
}
.call-options .el-form-item {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
<style>
</style>
