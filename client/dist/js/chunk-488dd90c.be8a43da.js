(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-488dd90c"],{"268e":function(e,a,t){"use strict";t.r(a);var n=function(){var e=this,a=e._self._c;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[e._v("\n        "+e._s(e.$t("Experimental Features"))+"\n      ")])]),e._v(" "),a("el-main",[a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:15}},[a("div",{staticClass:"common-form"},[a("el-form",{ref:"form",attrs:{model:e.form,"label-width":"0px"}},[a("el-form-item",[a("InfoBlock",{attrs:{type:"info",title:e.$t("Experimental Features that have not been officially released can be enabled here, configuration is only saved locally in the browser.")}})],1),e._v(" "),a("el-form-item",{attrs:{prop:"Blueprint"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Blueprint")},model:{value:e.form.Blueprint,callback:function(a){e.$set(e.form,"Blueprint",a)},expression:"form.Blueprint"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For developing Scripts graphically"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Navigation Bar {0} Blueprint"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("br"),a("br"),e._v(" "),a("el-form-item",{attrs:{prop:"PIPTool"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable PIP Tool")},model:{value:e.form.PIPTool,callback:function(a){e.$set(e.form,"PIPTool",a)},expression:"form.PIPTool"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For installing 3rd-party Python package"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} PIP tool"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"FileManage"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable File Manage")},model:{value:e.form.FileManage,callback:function(a){e.$set(e.form,"FileManage",a)},expression:"form.FileManage"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For managing files on the server side"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} File Manage"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"FileService"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable File Service")},model:{value:e.form.FileService,callback:function(a){e.$set(e.form,"FileService",a)},expression:"form.FileService"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For serving resource directories as file services"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} File Service"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"FuncCacheManage"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Func Cache Manage")},model:{value:e.form.FuncCacheManage,callback:function(a){e.$set(e.form,"FuncCacheManage",a)},expression:"form.FuncCacheManage"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For managing cached data from Scripts"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Func Cache Manage"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"FuncStoreManage"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Func Store Manage")},model:{value:e.form.FuncStoreManage,callback:function(a){e.$set(e.form,"FuncStoreManage",a)},expression:"form.FuncStoreManage"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For managing stored data from Scripts"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Func Store Manage"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"FuncDoc"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Func Doc")},model:{value:e.form.FuncDoc,callback:function(a){e.$set(e.form,"FuncDoc",a)},expression:"form.FuncDoc"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Document page for all exported Python functions and Auth Links"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Func Doc / Auth Link Doc"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"OpenAPIDoc"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Open API Doc")},model:{value:e.form.OpenAPIDoc,callback:function(a){e.$set(e.form,"OpenAPIDoc",a)},expression:"form.OpenAPIDoc"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Document page for Open API powered by Swagger"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Open API Doc"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"SysStat"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable System Status Page")},model:{value:e.form.SysStat,callback:function(a){e.$set(e.form,"SysStat",a)},expression:"form.SysStat"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Status Page for current system"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} System Status"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"SystemLogs"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable System Log Page")},model:{value:e.form.SystemLogs,callback:function(a){e.$set(e.form,"SystemLogs",a)},expression:"form.SystemLogs"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Log Page for current system"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} System Logs"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),a("el-form-item",{attrs:{prop:"AbnormalReqs"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Abnormal Request Page")},model:{value:e.form.AbnormalReqs,callback:function(a){e.$set(e.form,"AbnormalReqs",a)},expression:"form.AbnormalReqs"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Abnormal Request Page for current system"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Abnormal Requests"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1),e._v(" "),e.$store.getters.SYSTEM_INFO("_INTERNAL_KEEP_SCRIPT_LOG")?a("el-form-item",{attrs:{prop:"ScriptLogs"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Script Log Page")},model:{value:e.form.ScriptLogs,callback:function(a){e.$set(e.form,"ScriptLogs",a)},expression:"form.ScriptLogs"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Log Page for Script runtime"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Script Logs"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1):e._e(),e._v(" "),e.$store.getters.SYSTEM_INFO("_INTERNAL_KEEP_SCRIPT_FAILURE")?a("el-form-item",{attrs:{prop:"ScriptFailures"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Script Failure Page")},model:{value:e.form.ScriptFailures,callback:function(a){e.$set(e.form,"ScriptFailures",a)},expression:"form.ScriptFailures"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("Failure Page for Script runtime"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Script Failures"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1):e._e(),e._v(" "),e.$store.getters.isAdmin?a("el-form-item",{attrs:{prop:"AccessKeys"}},[a("el-switch",{attrs:{"active-text":e.$t("Enable Access Key Manage")},model:{value:e.form.AccessKeys,callback:function(a){e.$set(e.form,"AccessKeys",a)},expression:"form.AccessKeys"}}),e._v(" "),a("div",{staticClass:"text-small form-item-tip"},[e._v("\n                  "+e._s(e.$t("For allowing external systems to call Open APIs"))+"\n                  "),a("br"),a("i18n",{attrs:{path:"Once enabled, it can be accessed from Management page {0} Access Keys"}},[a("i",{staticClass:"fa fa-fw fa-long-arrow-right"})])],1)],1):e._e()],1)],1)]),e._v(" "),a("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},s=[],r=t("c7eb"),o=t("1da1"),c=(t("d3b7"),t("159b"),t("b64b"),{name:"ExperimentalFeatures",components:{},watch:{$route:{immediate:!0,handler:function(e,a){var t=this;return Object(o["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.loadData();case 2:case"end":return e.stop()}}),e)})))()}},form:{deep:!0,handler:function(e,a){var t=this.T.jsonCopy(this.form);this.$store.commit("updateEnabledExperimentalFeatures",t)}}},methods:{loadData:function(){var e=this;return Object(o["a"])(Object(r["a"])().mark((function a(){var t,n;return Object(r["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:t=e.T.jsonCopy(e.$store.state.enabledExperimentalFeatureMap)||{},n={},Object.keys(e.form).forEach((function(e){return n[e]=!!t[e]})),e.form=n,e.$store.commit("updateLoadStatus",!0);case 5:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){return{form:{PIPTool:!1,Blueprint:!1,FileManage:!1,FileService:!1,FuncCacheManage:!1,FuncStoreManage:!1,FuncDoc:!1,OpenAPIDoc:!1,SysStat:!1,SystemLogs:!1,AbnormalReqs:!1,ScriptLogs:!1,ScriptFailures:!1,AccessKeys:!1}}}}),i=c,l=t("2877"),m=t("77f8"),f=Object(l["a"])(i,n,s,!1,null,"41e3fa40",null);"function"===typeof m["default"]&&Object(m["default"])(f);a["default"]=f.exports},6845:function(e,a){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Experimental Features that have not been officially released can be enabled here, configuration is only saved locally in the browser.":"一些尚未正式公开的实验性功能可在本页面开启，本页面配置仅保存在浏览器本地","Enable Blueprint":"启用蓝图","For developing Scripts graphically":"用于图形化方式开发脚本","Once enabled, it can be accessed from Navigation Bar {0} Blueprint":"启用后，可在顶部「导航栏」{0}「蓝图」进入","Enable PIP Tool":"启用 PIP 工具","For installing 3rd-party Python package":"用于安装第三方 Python 包","Once enabled, it can be accessed from Management page {0} PIP tool":"启用后，可在「管理」{0}「PIP 工具」进入","Enable File Manage":"启用文件管理","For managing files on the server side":"用于管理服务器端文件","Once enabled, it can be accessed from Management page {0} File Manage":"启用后，可在「管理」{0}「文件管理」进入","Enable File Service":"启用文件服务","For serving resource directories as file services":"用于将资源目录提供为文件服务","Once enabled, it can be accessed from Management page {0} File Service":"启用后，可在「管理」{0}「文件服务」进入","Enable Func Cache Manage":"启用函数缓存管理","For managing cached data from Scripts":"用于管理脚本产生的缓存数据","Once enabled, it can be accessed from Management page {0} Func Cache Manage":"启用后，可在「管理」{0}「函数缓存管理」进入","Enable Func Store Manage":"启用函数存储管理","For managing stored data from Scripts":"用于管理脚本产生的存储数据","Once enabled, it can be accessed from Management page {0} Func Store Manage":"启用后，可在「管理」{0}「函数存储管理」进入","Enable Func Doc":"启用函数文档","Document page for all exported Python functions and Auth Links":"函数的文档，包含所有导出的 Python 函数和授权链接","Once enabled, it can be accessed from Management page {0} Func Doc / Auth Link Doc":"启用后，可在「管理」{0}「函数文档 / 授权链接文档」进入","Enable Open API Doc":"启用 Open API 文档","Document page for Open API powered by Swagger":"基于 Swagger 的 Open API 文档","Once enabled, it can be accessed from Management page {0} Open API Doc":"启用后，可在「管理」{0}「Open API 文档」进入","Enable System Status Page":"启用系统状态查看页面","Status Page for current system":"本系统状态查看页面","Once enabled, it can be accessed from Management page {0} System Status":"启用后，可在「管理」{0}「系统状态」进入","Enable System Log Page":"启用系统日志查看页面","Log Page for current system":"本系统日志查看页面","Once enabled, it can be accessed from Management page {0} System Logs":"启用后，可在「管理」{0}「系统日志」进入","Enable Abnormal Request Page":"启用异常请求查看页面","Abnormal Request Page for current system":"本系统异常请求查看页面","Once enabled, it can be accessed from Management page {0} Abnormal Requests":"启用后，可在「管理」{0}「异常请求」进入","Enable Script Log Page":"启用脚本日志查看页面","Log Page for Script runtime":"脚本运行时日志查看页面","Once enabled, it can be accessed from Management page {0} Script Logs":"启用后，可在「管理」{0}「脚本日志」进入","Enable Script Failure Page":"启用脚本故障查看页面","Failure Page for Script runtime":"脚本运行时故障查看页面","Once enabled, it can be accessed from Management page {0} Script Failures":"启用后，可在「管理」{0}「脚本故障」进入","Enable Access Key Manage":"启用 Access Key 管理","For allowing external systems to call Open APIs":"用于管理允许外部系统调用 DataFlux Func 的 API","Once enabled, it can be accessed from Management page {0} Access Keys":"启用后，可在「管理」{0}「Access Keys」进入"}}'),delete e.options._Ctor}},"77f8":function(e,a,t){"use strict";var n=t("6845"),s=t.n(n);a["default"]=s.a}}]);