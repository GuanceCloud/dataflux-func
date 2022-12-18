<i18n locale="zh-CN" lang="yaml">
Welcome: 欢迎

Before you start, please read the following: 在开始之前，请阅读以下内容

Editor: 编辑器
'In the left sidebar you can find the core module entrance of the Editor:' : 在左边侧栏可以找到编辑器的核心模块入口：
Edit and manage Script Sets, Scripts and Functions                         : 进行脚本集、脚本以及内函数的编辑和管理
Manage the various external systems available within the Script            : 管理脚本内可用的各外部系统
Manage the environment variables available within the Script               : 管理脚本内可用的环境变量

Editor Left Sidebar: 编辑器左侧栏
Every tab supports quick jumping. Enter ID or name and select it to jump to the item                          : 每个标签页都支持快速跳转。输入目标ID或名称并选择，即可定位到项目
Information about the item and the actions that can be performed will be displayed after hovering over it     : 将鼠标悬停在项目上，可展示项目的相关信息以及可进行的操作
The gray divider between the left sidebar and the editing area can be dragged to adjust the left sidebar width: 拖动左侧栏与编辑区的灰色分割线，可以调整左侧栏宽度

Built-in Features: 内置功能
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1 class="main-text">
          {{ $t('Welcome') }}
        </h1>
      </el-header>

      <!-- 正文区 -->
      <el-main>
        <div class="intro-content">
          <InfoBlock type="warning" :title="$t('Before you start, please read the following')"></InfoBlock>

          <!-- 编辑器 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Editor') }}</i>
            </h1>
          </el-divider>
          <p>
            {{ $t('In the left sidebar you can find the core module entrance of the Editor:') }}
            <ul>
              <li>
                <span class="intro-editor-list">{{ $t('Script Lib') }}</span>
                <i class="fa fa-fw fa-long-arrow-right"></i>
                {{ $t('Edit and manage Script Sets, Scripts and Functions') }}
              </li>
              <li>
                <span class="intro-editor-list">{{ $t('Connector') }}</span>
                <i class="fa fa-fw fa-long-arrow-right"></i>
                {{ $t('Manage the various external systems available within the Script') }}
              </li>
              <li>
                <span class="intro-editor-list">{{ $t('ENV') }}</span>
                <i class="fa fa-fw fa-long-arrow-right"></i>
                {{ $t('Manage the environment variables available within the Script') }}
              </li>
            </ul>
          </p>

          <!-- 编辑器左侧栏 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Editor Left Sidebar') }}</i>
            </h1>
          </el-divider>
          <p>
            <ul>
              <li>{{ $t('Every tab supports quick jumping. Enter ID or name and select it to jump to the item') }}</li>
              <li>{{ $t('Information about the item and the actions that can be performed will be displayed after hovering over it') }}</li>
              <li>{{ $t('The gray divider between the left sidebar and the editing area can be dragged to adjust the left sidebar width') }}</li>
            </ul>
          </p>

          <!-- 内置功能 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Built-in Features') }}</i>
            </h1>
          </el-divider>
          <p>脚本的上下文环境预先注入了一些内置功能，无需导入即可直接调用。</p>
          <div id="editorContainer_Intro" :style="$store.getters.codeMirrorSetting.style">
            <textarea id="editor_Intro">{{ codeExample }}</textarea>
          </div>

          <!-- 编写代码 -->
          <el-divider content-position="left">
            <h1>
              <i>编写代码</i>
            </h1>
          </el-divider>
          <p>
            左边侧栏中选择脚本或函数项目可进入此脚本的代码编辑器<br>
            代码编辑器的基本快捷键与 Sublime Text 类似，如：
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
                <i class="fa fa-fw fa-dashboard"></i> 总览&#12288;&#12288;&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                展示当前系统的使用信息
              </li>
              <li>
                <i class="fa fa-fw fa-info-circle"></i> 关于&#12288;&#12288;&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                展示当前系统的版本、系统信息
              </li>
              <li>
                <i class="fa fa-fw fa-lock"></i> API认证&#12288;&#12288;&nbsp;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以为授权链接创建认证处理
              </li>
              <li>
                <i class="fa fa-fw fa-link"></i> 授权链接&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以将指定的函数在公网暴露，供外部系统调用
              </li>
              <li>
                <i class="fa fa-fw fa-clock-o"></i> 自动触发配置
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定函数按照 Crontab 语法自动触发执行
              </li>
              <li>
                <i class="fa fa-fw fa-tasks"></i> 批处理&#12288;&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定函数执行长耗时任务
              </li>
              <li>
                <i class="fa fa-fw fa-cloud-download"></i> 脚本集导出&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以指定脚本集进行导出，用于备份、分发脚本集等用途
              </li>
              <li>
                <i class="fa fa-fw fa-cloud-upload"></i> 脚本集导入&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以导入从之前导出的脚本集
              </li>
              <li>
                <i class="fa fa-fw fa-history"></i> 脚本库还原&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以将脚本库还原至以前的某个时刻，在脚本发生问题时及时回滚
              </li>
              <li>
                <i class="fa fa-fw fa-users"></i> 成员管理&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以添加和管理本系统等登录用户
              </li>
              <li>
                <i class="fa fa-fw fa-cog"></i> 系统配置&#12288;&#12288;
                <i class="fa fa-fw fa-long-arrow-right"></i>
                可以对系统进行一些个性化配置
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
    # 从连接器读取数据
    db = DFF.CONN('db')
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

.intro-editor-list {
  display: inline-block;
  width: 90px;
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
