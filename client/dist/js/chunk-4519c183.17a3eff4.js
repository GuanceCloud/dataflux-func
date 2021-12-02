(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-4519c183"],{"191c":function(t,a,i){"use strict";i("39fd")},2345:function(t,a){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Welcome to":"欢迎使用"}}'),delete t.options._Ctor}},"39fd":function(t,a,i){},"3a7f":function(t,a,i){"use strict";i.r(a);var e=function(){var t=this,a=t.$createElement,i=t._self._c||a;return i("transition",{attrs:{name:"fade"}},[i("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[i("el-header",{attrs:{height:"60px"}},[i("h1",{staticClass:"main-text"},[t._v(t._s(t.$t("Welcome to"))+" "),i("Logo",{staticStyle:{"margin-bottom":"-8px"},attrs:{type:"auto"}})],1)]),t._v(" "),i("el-main",[i("div",{staticClass:"intro-content"},[i("InfoBlock",{attrs:{type:"warning",title:"在开始之前，请大致阅读以下介绍"}}),t._v(" "),[i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("官方网站及使用手册")])])]),t._v(" "),i("p",[t._v("\n          我们编写了详细的使用手册，所有相关文档都可以在官方网站找到。"),i("br"),t._v("\n          建议在使用本系统仔细阅读。"),i("br"),t._v(" "),i("el-link",{attrs:{type:"primary",href:"https://function.guance.com/",target:"_blank"}},[i("i",{staticClass:"fa fa-fw fa-link"}),t._v("\n            立即前往官方网站\n          ")])],1)],t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("编辑器")])])]),t._v(" "),i("p",[t._v("\n          在左边侧栏可以找到本编辑器的核心模块入口：\n          "),i("ul",[i("li",[t._v("脚本库　 "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v(" 可以进行脚本集、脚本以及脚本内函数的编辑管理")]),t._v(" "),i("li",[t._v("数据源　 "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v(" 可以维护脚本内所需各数据库的管理")]),t._v(" "),i("li",[t._v("环境变量 "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v(" 可以配置在全局范围内可以引用的变量")])])]),t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("脚本编辑器左侧栏")])])]),t._v(" "),i("p",[t._v("\n          点击左边侧栏中的扳手图标"),i("i",{staticClass:"fa fa-fw fa-wrench text-info"}),t._v("，即可进入编辑管理页面"),i("br"),t._v("\n          也可以将鼠标指向问号图标"),i("i",{staticClass:"fa fa-fw fa-question-circle text-main"}),t._v("，页面会显示一些与此项目关联的描述、提示、示例代码等。\n        ")]),t._v(" "),i("p",[t._v("\n          左侧栏每一页都可以进行过滤筛选项目，当项目数量过多时可以通过过滤找到您想要的内容。\n        ")]),t._v(" "),i("p",[t._v("\n          此外，如果左侧栏中的标题过长导致无法完全展示，可以拖动中间的灰色分割线调整左侧栏宽度。"),i("br"),t._v("\n          左侧栏宽度会在本机保存，刷新页面后宽度会自动读取上一次调整到的位置。\n        ")]),t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("引擎内置功能")])])]),t._v(" "),i("p",[t._v("脚本的上下文环境由引擎预先注入了一些内置功能，无需导入即可直接调用。")]),t._v(" "),i("div",{style:t.$store.getters.codeMirrorSetting.style,attrs:{id:"editorContainer_Intro"}},[i("textarea",{attrs:{id:"editor_Intro"}},[t._v(t._s(t.codeExample))])]),t._v(" "),i("p",[t._v("更多代码示例请参考DEMO脚本集以及侧边栏「参考」")]),t._v(" "),i("p",[t._v("代码编辑器的文字大小、行高等可在设置页面进行配置")]),t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("编写代码")])])]),t._v(" "),i("p",[t._v("\n          左边侧栏中选择脚本或函数项目可进入此脚本的代码编辑器"),i("br"),t._v("\n          代码编辑器的基本快捷键与Sublime Text 基本相同，如：\n          "),i("ul",[i("li",[t._v("随键入提示 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v("Tab")]),t._v("：自动补全上屏")]),t._v(" "),i("li",[i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("/")]),t._v("：注释/取消注释（支持多行操作）")]),t._v(" "),i("li",[i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("d")]),t._v("：选中整个单词")]),t._v(" "),i("li",[t._v("光标未选中字符 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("x")]),t._v("：剪切整行")]),t._v(" "),i("li",[t._v("光标未选中字符 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("c")]),t._v("：复制整行")]),t._v(" "),i("li",[t._v("剪切或复制整行 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("v")]),t._v("：粘贴整行")]),t._v(" "),i("li",[i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("]")]),t._v("：增加缩进（支持多行操作）")]),t._v(" "),i("li",[i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("[")]),t._v("：减少缩进（支持多行操作）")]),t._v(" "),i("li",[t._v("选中多行 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v("Tab")]),t._v("：增加缩进")]),t._v(" "),i("li",[t._v("选中多行 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v("Shift")]),t._v(" + "),i("kbd",[t._v("Tab")]),t._v("：减少缩进")]),t._v(" "),i("li",[t._v("焦点在编辑器内 "),i("i",{staticClass:"fa fa-fw fa-caret-right"}),t._v(" "),i("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),i("kbd",[t._v("F")]),t._v("：搜索")])])]),t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("管理")])])]),t._v(" "),i("p",[t._v("\n          管理界面可以对系统的特定功能进行配置，包括：\n          "),i("ul",[i("li",[i("i",{staticClass:"fa fa-fw fa-link"}),t._v(" 授权链接　　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以将指定的函数在公网暴露，供外部系统调用\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-clock-o"}),t._v(" 自动触发配置\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以指定函数按照Crontab语法自动触发执行\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-tasks"}),t._v(" 批处理　　　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以指定函数执行长耗时任务\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-cloud-download"}),t._v(" 脚本包导出　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以指定脚本包进行导出，用于备份、分发脚本包等用途\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-cloud-upload"}),t._v(" 脚本包导入　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以导入从之前导出的脚本包\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-history"}),t._v(" 脚本还原　　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以将脚本库还原至以前的某个时刻，在脚本发生问题时及时回滚\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-users"}),t._v(" 成员管理　　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以添加和管理本系统等登录用户\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-keyboard-o"}),t._v(" 操作记录　　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以查看用户在系统内的关键操作\n            ")]),t._v(" "),i("li",[i("i",{staticClass:"fa fa-fw fa-flask"}),t._v(" 实验性功能　\n              "),i("i",{staticClass:"fa fa-fw fa-long-arrow-right"}),t._v("\n              可以开启/关闭实验性功能的入口\n            ")])])]),t._v(" "),i("el-divider",{attrs:{"content-position":"left"}},[i("h1",[i("i",[t._v("授权链接函数文档")])])]),t._v(" "),i("p",[t._v("\n          授权链接函数文档列出了所有"),i("span",[t._v("可公开访问")]),t._v("的函数，以及其参数、文档等。这些函数可以被外部系统调用以实现集成功能。\n          "),i("br"),t._v(" "),i("a",{staticClass:"text-main",attrs:{href:"/#/auth-link-func-doc",target:"_blank"}},[i("i",{staticClass:"fa fa-fw fa-link"}),t._v("\n            前往授权链接函数文档\n          ")])])],2)])],1)],1)},n=[],r=(i("130f"),i("498a"),{name:"Intro",components:{},watch:{codeMirrorTheme:function(t){this.codeMirror.setOption("theme",t)}},methods:{onCollapseChange:function(t){var a=this;Array.isArray(t)&&t.indexOf("engineBuiltinFunction")>=0&&setImmediate((function(){a.codeMirror&&a.codeMirror.refresh()}))}},computed:{IMAGES:function(){return{introImg_editorEntry:introImg_editorEntry,introImg_editorAside:introImg_editorAside}},codeMirrorTheme:function(){return this.T.getCodeMirrorThemeName()},codeExample:function(){return"\n# 导出函数为HTTP API接口\n@DFF.API('API名称')\ndef hello_world():\n    # 从数据源读取数据\n    db = DFF.SRC('db')\n    db.query('SELECT * FROM table LIMIT 3', database='my_database')\n\n    # 使用环境变量\n    company_name = DFF.ENV('my_env')\n\n    # 日志输出\n    DFF.log('Hello, world!')\n    print('Hello, world')\n\n    # 数据返回\n    ret = {\n      'msg': 'Hello, world'\n    }\n    return ret".trim()}},props:{},data:function(){return{codeMirror:null}},created:function(){this.$store.commit("updateLoadStatus",!0)},mounted:function(){var t=this;setImmediate((function(){t.codeMirror=t.T.initCodeMirror("editor_Intro"),t.codeMirror.setOption("theme",t.codeMirrorTheme),document.getElementsByTagName("main")[0].scrollTo(0,0)}))},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}}),s=r,o=(i("957f"),i("191c"),i("2877")),f=i("fe92"),_=Object(o["a"])(s,e,n,!1,null,"b1aa92a4",null);"function"===typeof f["default"]&&Object(f["default"])(_);a["default"]=_.exports},"957f":function(t,a,i){"use strict";i("aa49")},aa49:function(t,a,i){},fe92:function(t,a,i){"use strict";var e=i("2345"),n=i.n(e);a["default"]=n.a}}]);