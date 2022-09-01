<i18n locale="zh-CN" lang="yaml">
Notice Bar         : 顶部提示栏
Monitor Data Upload: 监控数据上报

Enable: 启用功能
Text  : 文案
URL   : URL地址

System Config Saved: 系统配置已保存
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
              <el-form ref="form" label-width="120px" :model="form">
                <el-divider content-position="left"><h1>{{ $t('Notice Bar') }}</h1></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并配置文案后，会在整个 DataFlux Func UI 界面顶部展示固定的提示栏"></InfoBlock>
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

                <el-divider content-position="left"><h1>{{ $t('Monitor Data Upload') }}</h1></el-divider>

                <el-form-item>
                  <InfoBlock title="启用并配置上报地址（DataWay 或 DataKit）后，会将任务执行信息上报"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Enable')" prop="MONITOR_DATA_UPLOAD_ENABLED">
                  <el-select v-model="form['MONITOR_DATA_UPLOAD_ENABLED']" :class="enableClass(form['NOTICE_BAR_ENABLED'])">
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
      let apiRes = await this.T.callAPI_get('/api/v1/system-configs/do/list');
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      let nextForm = this.T.jsonCopy(this.$store.getters.CONFIG('VARIABLE_CONFIG'));
      this.data.forEach(d => {
        nextForm[d.id] = this.T.isNothing(d.value) ? null : d.value;
      })
      this.form = nextForm;

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

        apiRes = await this.T.callAPI('post', '/api/v1/system-configs/:id/do/set', {
          params: { id: id },
          body  : { data: { value: value } },
        });
        if (!apiRes.ok) break;
      }

      if (apiRes.ok) {
        this.T.alert(this.$t('System Config Saved'), 'success');
        this.$store.dispatch('reloadSystemConfig');
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
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {
        NOTICE_BAR_ENABLED         : null,
        NOTICE_BAR_TEXT            : null,
        MONITOR_DATA_UPLOAD_ENABLED: null,
        MONITOR_DATA_UPLOAD_URL    : null,
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.config-enabled input {
  color: green;
}
.config-disabled input {
  color: red;
}
</style>
