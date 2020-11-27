<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          实验性功能
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form"  label-width="0px">
                <el-form-item>
                  <InfoBlock type="info" :title="'一些尚未正式公开的实验性功能可在本页面开启\n本页面配置仅保存在浏览器本地'"></InfoBlock>
                </el-form-item>

                <el-form-item prop="ScriptLog">
                  <el-switch
                    :active-value="true"
                    :inactive-value="false"
                    active-text="开启脚本日志查看模块"
                    v-model="form.ScriptLog">
                  </el-switch>
                  <div class="text-small form-item-tip">
                    用于查看脚本运行时，通过<code>print()</code>函数输出的内容。每次运行产生一条记录，并包含所有输出内容
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「脚本日志」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="ScriptFailure">
                  <el-switch
                    :active-value="true"
                    :inactive-value="false"
                    active-text="开启脚本故障查看模块"
                    v-model="form.ScriptFailure">
                  </el-switch>
                  <div class="text-small form-item-tip">
                    用于查看脚本运行时，最终由平台处理的报错信息。每次报错产生一条记录，并包含了完整错误堆栈
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「脚本故障」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="AccessKey" v-if="$store.getters.isSuperAdmin">
                  <el-switch
                    :active-value="true"
                    :inactive-value="false"
                    active-text="开启AccessKey 管理模块"
                    v-model="form.AccessKey">
                  </el-switch>
                  <div class="text-small form-item-tip">
                    用于管理允许外部系统调用本平台接口的认证信息。
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「AccessKey」进入模块
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
  name: 'ExperimentalFeatures',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    form: {
      deep: true,
      handler(to, from) {
        let _formData = this.T.jsonCopy(this.form);
        this.$store.commit('updateEnabledExperimentalFeatures', _formData);
      }
    },
  },
  methods: {
    async loadData() {
      let _featureMap = this.T.jsonCopy(this.$store.state.enabledExperimentalFeatureMap) || {};

      let nextForm = {};
      Object.keys(this.form).forEach(f => nextForm[f] = !!_featureMap[f]);
      this.form = nextForm;

      this.$store.commit('updateLoadStatus', true);
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      form: {
        ScriptLog    : false,
        ScriptFailure: false,
        AccessKey    : false,
      },
    }
  },
}
</script>

<style scoped>

</style>
