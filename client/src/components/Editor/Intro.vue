<i18n locale="zh-CN" lang="yaml">
Welcome to: 欢迎使用
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1 class="main-text">{{ $t('Welcome to') }} <Logo type="auto" style="margin-bottom: -8px;"></Logo></h1>
      </el-header>

      <!-- 正文区 -->
      <el-main>
        <div class="intro-content">
          <InfoBlock type="warning" title="在开始之前，请大致阅读以下介绍"></InfoBlock>

          <template>
          <!-- 官方网站及使用手册 -->
          <el-divider content-position="left">
            <h1>
              <i>官方网站及使用手册</i>
            </h1>
          </el-divider>
          <p>
            我们编写了详细的使用手册，所有相关文档都可以在官方网站找到。<br>
            建议在使用本系统仔细阅读。<br>
            <el-link type="primary" :underline="true" href="https://function.guance.com/" target="_blank">
              <i class="fa fa-fw fa-link"></i>
              立即前往官方网站
            </el-link>
          </p>
          </template>

          <!-- 编辑器 -->
          <el-divider content-position="left">
            <h1>
              <i>编辑器</i>
            </h1>
          </el-divider>
          <p>
            在左边侧栏可以找到本编辑器的核心模块入口：
            <ul>
              <li>脚本库&#12288; <i class="fa fa-fw fa-long-arrow-right"></i> 可以进行脚本集、脚本以及脚本内函数的编辑管理</li>
              <li>数据源&#12288; <i class="fa fa-fw fa-long-arrow-right"></i> 可以维护脚本内所需各数据库的管理</li>
              <li>环境变量 <i class="fa fa-fw fa-long-arrow-right"></i> 可以配置在全局范围内可以引用的变量</li>
            </ul>
          </p>

          <!-- 脚本编辑器左侧栏 -->
          <el-divider content-position="left">
            <h1>
              <i>脚本编辑器左侧栏</i>
            </h1>
          </el-divider>
          <p>
            点击左边侧栏中的扳手图标<i class="fa fa-fw fa-wrench text-info"></i>，即可进入编辑管理页面<br>
            也可以将鼠标指向问号图标<i class="fa fa-fw fa-question-circle text-main"></i>，页面会显示一些与此项目关联的描述、提示、示例代码等。
          </p>
          <p>
            左侧栏每一页都可以进行过滤筛选项目，当项目数量过多时可以通过过滤找到您想要的内容。
          </p>
          <p>
            此外，如果左侧栏中的标题过长导致无法完全展示，可以拖动中间的灰色分割线调整左侧栏宽度。<br>
            左侧栏宽度会在本机保存，刷新页面后宽度会自动读取上一次调整到的位置。
          </p>

          <!-- 引擎内置功能 -->
          <el-divider content-position="left">
            <h1>
              <i>引擎内置功能</i>
            </h1>
          </el-divider>
          <p>脚本的上下文环境由引擎预先注入了一些内置功能，无需导入即可直接调用。</p>
          <div id="editorContainer_Intro" :style="$store.getters.codeMirrorSetting.style">
            <textarea id="editor_Intro">{{ codeExample }}</textarea>
          </div>
          <p>更多代码示例请参考DEMO脚本集以及侧边栏「参考」</p>
          <p>代码编辑器的文字大小、行高等可在设置页面进行配置</p>

          <!-- 编写代码 -->
          <el-divider content-position="left">
            <h1>
              <i>编写代码</i>
            </h1>
          </el-divider>
          <p>
            左边侧栏中选择脚本或函数项目可进入此脚本的代码编辑器<br>
            代码编辑器的基本快捷键与Sublime Text 基本相同，如：
            <ul>
              <li>随键入提示 <i class="fa fa-fw fa-caret-right"></i> <kbd>Tab</kbd>：自动补全上屏</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>/</kbd>：注释/取消注释（支持多行操作）</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>d</kbd>：选中整个单词</li>
              <li>光标未选中字符 <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>x</kbd>：剪切整行</li>
              <li>光标未选中字符 <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>c</kbd>：复制整行</li>
              <li>剪切或复制整行 <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>v</kbd>：粘贴整行</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>]</kbd>：增加缩进（支持多行操作）</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>[</kbd>：减少缩进（支持多行操作）</li>
              <li>选中多行 <i class="fa fa-fw fa-caret-right"></i> <kbd>Tab</kbd>：增加缩进</li>
              <li>选中多行 <i class="fa fa-fw fa-caret-right"></i> <kbd>Shift</kbd> + <kbd>Tab</kbd>：减少缩进</li>
              <li>焦点在编辑器内 <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>F</kbd>：搜索</li>
            </ul>
          </p>

          <!-- 管理 -->
          <el-divider content-position="left">
            <h1>
              <i>管理</i>
            </h1>
          </el-divider>
          <p>
            管理界面可以对系统的特定功能进行配置，包括：
            <ul>
              <li>
                <i class="fa fa-fw fa-link"></i> 授权链接&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以将指定的函数在公网暴露，供外部系统调用
              </li>
              <li>
                <i class="fa fa-fw fa-clock-o"></i> 自动触发配置
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定函数按照Crontab语法自动触发执行
              </li>
              <li>
                <i class="fa fa-fw fa-tasks"></i> 批处理&#12288;&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定函数执行长耗时任务
              </li>
              <li>
                <i class="fa fa-fw fa-cloud-download"></i> 脚本包导出&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定脚本包进行导出，用于备份、分发脚本包等用途
              </li>
              <li>
                <i class="fa fa-fw fa-cloud-upload"></i> 脚本包导入&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以导入从之前导出的脚本包
              </li>
              <li>
                <i class="fa fa-fw fa-history"></i> 脚本还原&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以将脚本库还原至以前的某个时刻，在脚本发生问题时及时回滚
              </li>
              <li>
                <i class="fa fa-fw fa-users"></i> 成员管理&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以添加和管理本系统等登录用户
              </li>
              <li>
                <i class="fa fa-fw fa-keyboard-o"></i> 操作记录&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以查看用户在系统内的关键操作
              </li>
              <li>
                <i class="fa fa-fw fa-flask"></i> 实验性功能&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以开启/关闭实验性功能的入口
              </li>
            </ul>
          </p>

          <!-- 授权链接函数文档 -->
          <el-divider content-position="left">
            <h1>
              <i>授权链接函数文档</i>
            </h1>
          </el-divider>
          <p>
            授权链接函数文档列出了所有<span>可公开访问</span>的函数，以及其参数、文档等。这些函数可以被外部系统调用以实现集成功能。
            <br>
            <a class="text-main" href="/#/auth-link-func-doc" target="_blank">
              <i class="fa fa-fw fa-link"></i>
              前往授权链接函数文档
            </a>
          </p>
        </div>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'Intro',
  components: {
  },
  watch: {
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
    '$store.state.uiLocale'(val) {
      this.T.resetCodeMirrorPhrases(this.codeMirror);
    },
  },
  methods: {
    onCollapseChange(activeNames) {
      if (Array.isArray(activeNames) && activeNames.indexOf('engineBuiltinFunction') >= 0) {
        setImmediate(() => {
          // 载入代码
          if (this.codeMirror) {
            this.codeMirror.refresh();
          }
        });
      }
    },
  },
  computed: {
    IMAGES() {
      return {
        introImg_editorEntry,
        introImg_editorAside,
      }
    },
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
    codeExample() {
      return `
# 导出函数为HTTP API接口
@DFF.API('API名称')
def hello_world():
    # 从数据源读取数据
    db = DFF.SRC('db')
    db.query('SELECT * FROM table LIMIT 3', database='my_database')

    # 使用环境变量
    company_name = DFF.ENV('my_env')

    # 日志输出
    DFF.log('Hello, world!')
    print('Hello, world')

    # 数据返回
    ret = {
      'msg': 'Hello, world'
    }
    return ret`.trim();
    },
  },
  props: {
  },
  data() {
    return {
      codeMirror: null,
    }
  },
  created() {
    this.$store.commit('updateLoadStatus', true);
  },
  mounted() {
    setImmediate(() => {
      // 初始化编辑器
      this.codeMirror = this.T.initCodeMirror('editor_Intro');
      this.codeMirror.setOption('theme', this.codeMirrorTheme);

      // 页面滚回顶部
      document.getElementsByTagName('main')[0].scrollTo(0,0);
    });
  },
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.intro-content {
  width: 700px;
  padding-left: 20px;
}
span, p, ul li {
  color: grey;
  font-size: 16px;
  line-height: 28px;
}
.el-primary {
  color: #FF6600;
  font-size: 20px;
}
.el-divider {
  margin-top: 60px;
}
</style>

<style>
.intro-content .el-collapse-item__header {
  padding-top: 30px;
  font-size: 22px;
  font-style: italic;
}
.intro-img {
  display: block;
  padding: 15px 5px;
}
.intro-img img {
  box-shadow: 3px 3px 3px lightgrey;
  border: 1px solid whitesmoke;
}
#editorContainer_Intro .CodeMirror {
  height: auto;
}
</style>
