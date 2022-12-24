<i18n locale="zh-CN" lang="yaml">
Custom Site Title     : 自定义网站标题
Custom Site Favicon   : 自定义网站 Favicon
Custom Site Logo      : 自定义网站 Logo
Notice Bar            : 顶部提示栏
Navi Bar Doc Link     : 导航栏文档链接
Monitor Data Upload   : 监控数据上报
Official Script Market: 官方脚本市场

Enable: 启用
Text  : 文案
Color : 颜色
Image : 图片
URL   : URL 地址

Drag file to here, or click here to upload: 将文件拖到此处，或点击此处上传
'System Config Saved. Page will be refreshed soon...': '系统配置已保存，页面即将刷新...'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('System Config') }}</h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px" :model="form">
                <!-- 网站标题 -->
                <el-divider content-position="left"><h3>{{ $t('Custom Site Title') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并配置文案后，会使用指定的文案作为网站标题" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="CUSTOM_SITE_TITLE_ENABLED">
                  <el-select v-model="form['CUSTOM_SITE_TITLE_ENABLED']" :class="enableClass(form['CUSTOM_SITE_TITLE_ENABLED'])">
                    <el-option :label="$t('Enabled')"  key="true"  :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Text')" prop="CUSTOM_SITE_TITLE_TEXT">
                  <el-input v-model="form['CUSTOM_SITE_TITLE_TEXT']"></el-input>
                </el-form-item>

                <!-- 自定义 Favicon -->
                <el-divider content-position="left"><h3>{{ $t('Custom Site Favicon') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并选择图片后，会使用指定的图片作为网站 Favicon" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="CUSTOM_FAVICON_ENABLED">
                  <el-select v-model="form['CUSTOM_FAVICON_ENABLED']" :class="enableClass(form['CUSTOM_FAVICON_ENABLED'])">
                    <el-option :label="$t('Enabled')"  key="true"  :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Image')" prop="CUSTOM_FAVICON_IMAGE_SRC">
                  <el-upload drag ref="CUSTOM_FAVICON_IMAGE_SRC"
                    :limit="2"
                    :multiple="false"
                    :auto-upload="false"
                    :show-file-list="false"
                    :accept="['.jpg', '.jpeg', '.png', '.gif', 'ico']"
                    :on-change="onCustomFaviconChange">
                    <div v-if="form.CUSTOM_FAVICON_IMAGE_SRC" class="image-preview">
                      <img :src="form.CUSTOM_FAVICON_IMAGE_SRC" />
                    </div>
                    <template v-else>
                      <i class="fa fa-cloud-upload"></i>
                      <div class="el-upload__text">{{ $t('Drag file to here, or click here to upload') }}</div>
                    </template>
                  </el-upload>
                </el-form-item>

                <!-- 自定义 Logo -->
                <el-divider content-position="left"><h3>{{ $t('Custom Site Logo') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并选择图片后，会使用指定的图片作为网站 Logo" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="CUSTOM_LOGO_ENABLED">
                  <el-select v-model="form['CUSTOM_LOGO_ENABLED']" :class="enableClass(form['CUSTOM_LOGO_ENABLED'])">
                    <el-option :label="$t('Enabled')"  key="true"  :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Image')" prop="CUSTOM_LOGO_IMAGE_SRC">
                  <el-upload drag ref="CUSTOM_LOGO_IMAGE_SRC"
                    :limit="2"
                    :multiple="false"
                    :auto-upload="false"
                    :show-file-list="false"
                    :accept="['.jpg', '.jpeg', '.png', '.gif']"
                    :on-change="onCustomLogoChange">
                    <div v-if="form.CUSTOM_LOGO_IMAGE_SRC" class="image-preview">
                      <img :src="form.CUSTOM_LOGO_IMAGE_SRC" />
                    </div>
                    <template v-else>
                      <i class="fa fa-cloud-upload"></i>
                      <div class="el-upload__text">{{ $t('Drag file to here, or click here to upload') }}</div>
                    </template>
                  </el-upload>
                </el-form-item>

                <!-- 提示栏 -->
                <el-divider content-position="left"><h3>{{ $t('Notice Bar') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并配置文案后，会在整个 DataFlux Func UI 界面顶部展示固定的提示栏" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="NOTICE_BAR_ENABLED">
                  <el-select v-model="form['NOTICE_BAR_ENABLED']" :class="enableClass(form['NOTICE_BAR_ENABLED'])">
                    <el-option :label="$t('Enabled')"  key="true"  :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Text')" prop="NOTICE_BAR_TEXT">
                  <el-input
                    type="textarea"
                    :autosize="{ minRows: 2 }"
                    v-model="form['NOTICE_BAR_TEXT']"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Color')" prop="NOTICE_BAR_COLOR">
                  <el-color-picker
                    :predefine="colorPanel"
                    color-format="rgb"
                    @active-change="onNoticeBarColorChange"
                    v-model="form['NOTICE_BAR_COLOR']"></el-color-picker>
                </el-form-item>

                <!-- 导航栏文档链接 -->
                <el-divider content-position="left"><h3>{{ $t('Navi Bar Doc Link') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并指定 URL 地址后，导航栏会出现「文档」，并可以跳转至指定的 URL 地址" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="NAVI_DOC_LINK_ENABLED">
                  <el-select v-model="form['NAVI_DOC_LINK_ENABLED']" :class="enableClass(form['NAVI_DOC_LINK_ENABLED'])">
                    <el-option :label="$t('Enabled')"  key="true"  :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('URL')" prop="NAVI_DOC_LINK_URL">
                  <el-input
                    type="textarea"
                    :autosize="{ minRows: 2 }"
                    v-model="form['NAVI_DOC_LINK_URL']"></el-input>
                </el-form-item>

                <!-- 监控数据上传 -->
                <el-divider content-position="left"><h3>{{ $t('Monitor Data Upload') }}</h3></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并配置上报地址（DataWay 或 DataKit）后，会将任务执行信息上报" />
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="MONITOR_DATA_UPLOAD_ENABLED">
                  <el-select v-model="form['MONITOR_DATA_UPLOAD_ENABLED']" :class="enableClass(form['MONITOR_DATA_UPLOAD_ENABLED'])">
                    <el-option :label="$t('Enabled')" key="true"   :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('URL')" prop="MONITOR_DATA_UPLOAD_URL">
                  <el-input
                    type="textarea"
                    :autosize="{ minRows: 2 }"
                    v-model="form['MONITOR_DATA_UPLOAD_URL']"></el-input>
                </el-form-item>

                <!-- 官方脚本市场 -->
                <el-divider content-position="left"><h3>{{ $t('Official Script Market') }}</h3></el-divider>

                <el-form-item :label="$t('Enable')" prop="OFFICIAL_SCRIPT_MARKET_ENABLED">
                  <el-select v-model="form['OFFICIAL_SCRIPT_MARKET_ENABLED']" :class="enableClass(form['OFFICIAL_SCRIPT_MARKET_ENABLED'])">
                    <el-option :label="$t('Enabled')" key="true"   :value="true"></el-option>
                    <el-option :label="$t('Disabled')" key="false" :value="false"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <div class="setup-right">
                    <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'SystemConfig',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      },
    },
  },
  methods: {
    async loadData() {
      await this.$store.dispatch('reloadSystemConfig');

      this.data = this.T.jsonCopy(this.$root.variableConfig);
      this.form = this.T.jsonCopy(this.$root.variableConfig);

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      return await this.setData();
    },
    async setData() {
      let apiRes = null;
      for (let id in this.form) {
        let v = this.form[id]
        let value = this.T.isNothing(v) ? null : v;

        // 没有改变的内容不提交
        if (value === this.data[id]) continue;

        // URL地址自动添加 http://
        if (id.slice(-4) === '_URL' && value && !value.match(/^\w+:\/\//g)) {
          value = `http://${value}`;
        }

        apiRes = await this.T.callAPI('post', '/api/v1/system-configs/:id/do/set', {
          params: { id: id },
          body  : { data: { value: value } },
        });
        if (!apiRes || !apiRes.ok) return;
      }

      if (!apiRes || apiRes.ok) {
        await this.T.alert(this.$t('System Config Saved. Page will be refreshed soon...'), 'success');
        location.reload();
      }
    },
    enableClass(val) {
      if (val === true) {
        return 'config-enabled';
      } else if (val === false) {
        return 'config-disabled';
      } else {
        return '';
      }
    },

    onCustomBase64ImageChange(file, fileList, key) {
      var self = this;

      if (fileList.length > 1) fileList.splice(0, 1);

      var reader = new FileReader();
      reader.readAsDataURL(file.raw);
      reader.onload = () => {
        this.form[key] = reader.result;
      };
    },
    onCustomFaviconChange(file, fileList) {
      return this.onCustomBase64ImageChange(file, fileList, 'CUSTOM_FAVICON_IMAGE_SRC');
    },
    onCustomLogoChange(file, fileList) {
      return this.onCustomBase64ImageChange(file, fileList, 'CUSTOM_LOGO_IMAGE_SRC');
    },
    onNoticeBarColorChange(color) {
      this.form.NOTICE_BAR_COLOR = color;
    },
  },
  computed: {
    colorPanel() {
      return [
        '#FF0000',
        '#FF6600',
        '#3BA272',
        '#359EC6',
        '#5470C6',
        '#9A60B4',
        '#EA7CCC',
        '#666666',
        '#000000',
      ]
    },
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {},
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.config-enabled input {
  color: green !important;
  font-weight: bold;
}
.config-disabled input {
  color: red !important;
  font-weight: bold;
}
</style>
