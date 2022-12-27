<i18n locale="en" lang="yaml">
codeExample: |-
  # Export function as an HTTP API
  @DFF.API('API Name')
  def hello_world():
      # Query data from connector
      db = DFF.CONN('db')
      db.query('SELECT * FROM table LIMIT 3', database='my_database')

      # Get environment variable
      company_name = DFF.ENV('my_env')

      # Print logs
      DFF.log('Hello, world!')
      print('Hello, world')

      # Return data
      ret = {
        'msg': 'Hello, world'
      }
      return ret
</i18n>

<i18n locale="zh-CN" lang="yaml">
Welcome: 欢迎

Before you start, please read the following: 在开始之前，请阅读以下内容

Left Sidebar: 编辑器左侧栏
'In the left sidebar you can find the core module entrance of the Editor:' : 在左边侧栏可以找到编辑器的核心模块入口：
Edit and manage Script Sets and Scripts                                    : 进行脚本集和脚本的编辑和管理
Manage the various external systems available within the Script            : 管理脚本内可用的各外部系统
Manage the environment variables available within the Script               : 管理脚本内可用的环境变量

Every tab supports quick jumping. Enter ID or name and select it to jump to the item.                          : 每个标签页都支持快速跳转。输入目标ID或名称并选择，即可定位到项目。
Information about the item and the actions that can be performed will be displayed after hovering over it.     : 将鼠标悬停在项目上，可展示项目的相关信息以及可进行的操作。
The gray divider between the left sidebar and the editing area can be dragged to adjust the left sidebar width.: 拖动左侧栏与编辑区的灰色分割线，可以调整左侧栏宽度。

Built-in Features: 内置功能
Some built-in objects are pre-injected into the context of the Script and can be accessed directly without importing. : 脚本的上下文环境预先注入了一些内置对象，无需导入即可直接使用。
codeExample: |-
  # 导出函数为 HTTP API 接口
  @DFF.API('API 名称')
  def hello_world():
      # 从连接器查询数据
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
      return ret

Code Editor: 代码编辑器
Select the Script in the left sidebar to enter the Code Editor.        : 在左边侧栏中选择脚本进入此脚本的代码编辑器
'The common shortcuts for the Code Editor are similar to Sublime Text:': 代码编辑器的基本快捷键与 Sublime Text 类似：
Prompt when typing                  : 键入时提示
Auto-completion                     : 自动补全
Toggle comments                     : 注释/取消注释
Add selection to next find match    : 将下一个查找匹配项添加到选择
When no characters are selected     : 未选中字符时
Cut whole line                      : 剪切整行
Copy whole line                     : 复制整行
Indent lines                        : 增加行缩进
Outdent lines                       : 减少行缩进
When multiple lines are selected    : 选中多行时
When the focus is in the Code Editor: 焦点在编辑器内时
Open search bar                     : 打开搜索栏

Features built on the Script are located in the management page.: 建立在脚本之上的各项功能位于管理页面。
Usage overview                                            : 使用概况
System version and status                                 : 系统版本和状态
API authentication for Auth Links and Batches             : 用于授权链接和批处理的 API 认证
Allow Python functions be called as HTTP APIs             : 允许 Python 函数作为 HTTP API 调用
Calling Python functions at regular intervals             : 定时调用 Python 函数
Allow Python functions be called as asynchronous HTTP APIs: 允许 Python 函数作为异步 HTTP API 调用
Export Script Sets as zip files                           : 将脚本集导出为 zip 文件
Import Script Sets from zip files                         : 从 zip 文件导入将脚本集
Recover Script Lib to a previous moment                   : 将脚本库恢复到以前的某个时刻
Manage the users who use the system                       : 管理使用本系统的用户
Some customization options for the system                 : 一些客制化选项
Some key operation logs                                   : 一些关键操作记录
Toggling experimental features                            : 打开/关闭实验性功能

Distribute and share code by publishing and installing Script Sets using git repositories, Alibaba Cloud OSS, file services etc.: 使用 git 库、阿里云 OSS、文件服务等进行脚本集的发布、安装，实现代码的分发和共享。
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
          <InfoBlock type="warning" :title="$t('Before you start, please read the following')" />

          <!-- 编辑器左侧栏 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Left Sidebar') }}</i>
            </h1>
          </el-divider>
          <p>
            {{ $t('In the left sidebar you can find the core module entrance of the Editor:') }}
            <table class="intro-feature-table">
              <tbody>
                <tr>
                  <td>{{ $t('Script Lib') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Edit and manage Script Sets and Scripts') }}</td>
                </tr>
                <tr>
                  <td>{{ $t('Connector') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Manage the various external systems available within the Script') }}</td>
                </tr>
                <tr>
                  <td>{{ $t('ENV') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Manage the environment variables available within the Script') }}</td>
                </tr>
              </tbody>
            </table>
          </p>
          <p>{{ $t('Every tab supports quick jumping. Enter ID or name and select it to jump to the item.') }}</p>
          <p>{{ $t('Information about the item and the actions that can be performed will be displayed after hovering over it.') }}</p>
          <p>{{ $t('The gray divider between the left sidebar and the editing area can be dragged to adjust the left sidebar width.') }}</p>

          <!-- 内置功能 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Built-in Features') }}</i>
            </h1>
          </el-divider>
          <p>{{ $t('Some built-in objects are pre-injected into the context of the Script and can be accessed directly without importing.') }}</p>
          <div id="editorContainer_Intro" :style="$store.getters.codeMirrorSetting.style">
            <textarea id="editor_Intro">{{ $t('codeExample') }}</textarea>
          </div>

          <!-- 编写代码 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Code Editor') }}</i>
            </h1>
          </el-divider>
          <p>
            {{ $t('Select the Script in the left sidebar to enter the Code Editor.') }}<br>
            {{ $t('The common shortcuts for the Code Editor are similar to Sublime Text:') }}
            <ul>
              <li>{{ $t('Prompt when typing') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>Tab</kbd>{{ $t(':') }} {{ $t('Auto-completion') }}</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>/</kbd>{{ $t(':') }} {{ $t('Toggle comments') }}</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>D</kbd>{{ $t(':') }} {{ $t('Add selection to next find match') }}</li>
              <li>{{ $t('When no characters are selected') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>X</kbd>{{ $t(':') }} {{ $t('Cut whole line') }}</li>
              <li>{{ $t('When no characters are selected') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>C</kbd>{{ $t(':') }} {{ $t('Copy whole line') }}</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>]</kbd>{{ $t(':') }} {{ $t('Indent lines') }}</li>
              <li><kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>[</kbd>{{ $t(':') }} {{ $t('Outdent lines') }}</li>
              <li>{{ $t('When multiple lines are selected') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>Tab</kbd>{{ $t(':') }} {{ $t('Indent lines') }}</li>
              <li>{{ $t('When multiple lines are selected') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>Shift</kbd> + <kbd>Tab</kbd>{{ $t(':') }} {{ $t('Outdent lines') }}</li>
              <li>{{ $t('When the focus is in the Code Editor') }} <i class="fa fa-fw fa-caret-right"></i> <kbd>{{ T.getSuperKeyName() }}</kbd> + <kbd>F</kbd>{{ $t(':') }} {{ $t('Open search bar') }}</li>
            </ul>
          </p>

          <!-- 管理 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Management') }}</i>
            </h1>
          </el-divider>
          <p>
            {{ $t('Features built on the Script are located in the management page.') }}
            <table class="intro-feature-table">
              <tbody>
                <tr>
                  <td><i class="fa fa-fw fa-dashboard"></i> {{ $t('Overview') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Usage overview') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-info-circle"></i> {{ $t('About') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('System version and status') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-lock"></i> {{ $t('API Auth') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('API authentication for Auth Links and Batches') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-link"></i> {{ $t('Auth Link') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Allow Python functions be called as HTTP APIs') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-clock-o"></i> {{ $t('Crontab Config') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Calling Python functions at regular intervals') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-tasks"></i> {{ $t('Batch') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Allow Python functions be called as asynchronous HTTP APIs') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-cloud-download"></i> {{ $t('Script Set Exporting') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Export Script Sets as zip files') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-cloud-upload"></i> {{ $t('Script Sets Importing') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Import Script Sets from zip files') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-history"></i> {{ $t('Script Lib Recovering') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Recover Script Lib to a previous moment') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-users"></i> {{ $t('User Manage') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Manage the users who use the system') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-cog"></i> {{ $t('System Config') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Some customization options for the system') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-keyboard-o"></i> {{ $t('Operation Logs') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Some key operation logs') }}</td>
                </tr>
                <tr>
                  <td><i class="fa fa-fw fa-flask"></i> {{ $t('Experimental Features') }}</td>
                  <td><i class="fa fa-fw fa-long-arrow-right"></i></td>
                  <td>{{ $t('Toggling experimental features') }}</td>
                </tr>
              </tbody>
            </table>
          </p>

          <!-- 脚本市场 -->
          <el-divider content-position="left">
            <h1>
              <i>{{ $t('Script Market') }}</i>
            </h1>
          </el-divider>
          <p>
            {{ $t('Distribute and share code by publishing and installing Script Sets using git repositories, Alibaba Cloud OSS, file services etc.') }}
          </p>
          <el-image :src="img_introScriptMarket"></el-image>
        </div>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import img_introScriptMarket from '@/assets/img/intro-script-market.png'

export default {
  name: 'Intro',
  components: {
  },
  watch: {
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
    '$store.state.uiLocale'(val) {
      if (this.codeMirror) {
        setImmediate(() => {
          this.codeMirror.setValue(this.$t('codeExample'));
          this.T.resetCodeMirrorPhrases(this.codeMirror);
        })
      }
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

    featureNameWidth_leftSidebar() {
      switch(this.$store.state.uiLocale) {
        case 'en':
          return '90px';

        case 'zh-CN':
        default:
          return '70px';
      }
    },
    featureNameWidth_management() {
      switch(this.$store.state.uiLocale) {
        case 'en':
          return '200px';

        case 'zh-CN':
        default:
          return '130px';
      }
    },
  },
  props: {
  },
  data() {
    return {
      codeMirror: null,

      img_introScriptMarket: img_introScriptMarket,
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

.intro-feature-table {
  padding: 10px;
}
.intro-feature-table td {
  padding: 0 6px;
  vertical-align: baseline;
}
.intro-feature-table td:first-child {
  white-space: nowrap;
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
