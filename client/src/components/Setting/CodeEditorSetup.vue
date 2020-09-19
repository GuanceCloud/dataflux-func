<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          代码编辑器配置
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="24" :lg="12" :xl="12">
            <div>
              <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
                <el-form-item>
                  <InfoBlock type="info" title="代码编辑器配置仅保存在当前浏览器，更换浏览器或电脑后需要重新配置"></InfoBlock>
                </el-form-item>

                <el-form-item label="主题">
                  <el-select v-model="form.theme">
                    <el-option v-for="t in C.CODE_MIRROR_THEME" :key="t.key" :label="t.name" :value="t.key"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="文字大小" prop="style.fontSize">
                  <el-slider
                    :min="12"
                    :max="24"
                    :step="1"
                    :show-input="true"
                    :show-input-controls="false"
                    v-model.number="form.style.fontSize"></el-slider>
                </el-form-item>

                <el-form-item label="行距" prop="style.lineHeight">
                  <el-slider
                    :min="1"
                    :max="2"
                    :step="0.1"
                    :show-input="true"
                    :show-input-controls="false"
                    v-model.number="form.style.lineHeight"></el-slider>
                </el-form-item>

                <el-form-item>
                  <el-button @click="loadData(true)">恢复默认配置</el-button>
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
          theme: 'elegant-monokai',
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
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    codeExample() {
      return `
# 导出函数为HTTP API接口
@DFF.API('API名称')
def hello_world():
    # 从数据源读取数据
    db = DFF.HELPER('db')
    db.query('SELECT * FROM table LIMIT 3')

    # 日志输出
    DFF.log('Hello, world!')

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
      formRules: {
        'style.fontSize': [
          {
            trigger : 'change',
            message : '请输入文字大小',
            required: true,
          },
          {
            trigger : 'change',
            message : '文字大小设置范围为 12-24 px',
            type   : 'integer', min: 12, max: 24,
          },
        ],
        'style.lineHeight': [
          {
            trigger : 'change',
            message : '请输入行距',
            required: true,
          },
          {
            trigger : 'change',
            message : '行距设置范围为 1-2 倍',
            type   : 'number', min: 1, max: 2,
          },
        ],
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
