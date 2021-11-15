<i18n locale="zh-CN" lang="yaml">
Code Editor Setup                                : 代码编辑器配置
Setting of Code Editor only effect current brower: 代码编辑器配置仅保存在当前浏览器，更换浏览器或电脑后需要重新配置
Theme                                            : 主题
Font Size                                        : 文字大小
Line Height                                      : 行高
Reset to default                                 : 恢复默认配置

Please input font size                         : 请输入文字大小
Font size should be a integer between 12 and 24: 文字大小设置范围为 12-24 px
Please input line height                       : 请输入行高
Line height should be a number between 1 and 2 : 行高设置范围为 1-2 倍
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Code Editor Setup')}}
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="24" :lg="12" :xl="12">
            <div>
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item>
                  <InfoBlock type="info" :title="$t('Setting of Code Editor only effect current brower')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Theme')">
                  <el-select v-model="form.theme">
                    <el-option v-for="t in C.CODE_MIRROR_THEME" :key="t.key" :label="$t(t.name)" :value="t.key"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Font Size')" prop="style.fontSize">
                  <el-slider
                    :min="12"
                    :max="24"
                    :step="1"
                    :show-input="true"
                    :show-input-controls="false"
                    v-model.number="form.style.fontSize"></el-slider>
                </el-form-item>

                <el-form-item :label="$t('Line Height')" prop="style.lineHeight">
                  <el-slider
                    :min="1"
                    :max="2"
                    :step="0.1"
                    :show-input="true"
                    :show-input-controls="false"
                    v-model.number="form.style.lineHeight"></el-slider>
                </el-form-item>

                <el-form-item>
                  <el-button @click="loadData(true)">{{ $t('Reset to default') }}</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="24" :lg="12" :xl="12">
            <div id="editorContainer_CodeEditorSetup" :style="$store.getters.codeMirrorSetting.style">
              <textarea id="editor_CodeEditorSetup">{{ codeExample }}</textarea>
            </div>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'CodeEditorSetup',
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
        this.$store.commit('updateCodeMirrorSetting', _formData);
      }
    },
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
  },
  methods: {
    async loadData(useDefault) {
      if (useDefault) {
        let defaultSetting = {
          theme: this.C.CODE_MIRROR_THEME_DEFAULT.key,
          style: this.T.jsonCopy(this.$store.getters.DEFAULT_STATE.codeMirrorStyle),
        };
        this.form = defaultSetting;

      } else {
        this.form = this.T.jsonCopy({
          theme: this.$store.getters.codeMirrorSetting.theme,
          style: {
            fontSize  : parseInt(this.$store.getters.codeMirrorSetting.style.fontSize),
            lineHeight: this.$store.getters.codeMirrorSetting.style.lineHeight,
          }
        });
      }

      this.$store.commit('updateLoadStatus', true);
    },
  },
  computed: {
    formRules() {
      return {
        'style.fontSize': [
          {
            trigger : 'change',
            message : this.$t('Please input font size'),
            required: true,
          },
          {
            trigger : 'change',
            message : this.$t('Font size should be a integer between 12 and 24'),
            type   : 'integer', min: 12, max: 24,
          },
        ],
        'style.lineHeight': [
          {
            trigger : 'change',
            message : this.$t('Please input line height'),
            required: true,
          },
          {
            trigger : 'change',
            message : this.$t('Line height should be a number between 1 and 2'),
            type   : 'number', min: 1, max: 2,
          },
        ],
      }
    },
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    codeExample() {
      return `
# Export Func as HTTP API
@DFF.API('API Name')
def hello_world():
    # Query data from Data Source
    db = DFF.HELPER('db')
    db.query('SELECT * FROM table LIMIT 3')

    return 'Hello, world'`.trim();
    },
  },
  props: {
  },
  data() {
    return {
      form: {
        theme: null,
        style: {
          fontSize  : null,
          lineHeight: null,
        }
      },
    }
  },
  mounted() {
    setImmediate(() => {
      // 初始化编辑器
      this.codeMirror = this.T.initCodeMirror('editor_CodeEditorSetup');
      this.codeMirror.setOption('theme', this.codeMirrorTheme);
    });
  },
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
  },
}
</script>

<style scoped>
</style>
<style>
#editorContainer_CodeEditorSetup .CodeMirror {
  height: auto;
}
.el-slider__input {
  width: 40px;
}
.el-input-number.is-without-controls .el-input__inner {
  padding: 0;
}
.el-slider__runway.show-input {
  margin-right: 50px;
}
</style>
