(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-3ff67be9"],{2020:function(t,e,a){"use strict";var i=a("a2b7"),s=a.n(i);e["default"]=s.a},"244c":function(t,e,a){},6678:function(t,e,a){"use strict";var i=a("759b"),s=a.n(i);e["default"]=s.a},"759b":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"lastSucceeded":"Succeeded {t}","lastFailed":"Failed {t}","lastRan":"Ran {t}","successCount":"Success {n}","failureCount":"Failure {n}"}}'),delete t.options._Ctor}},"99d5":function(t,e,a){"use strict";a.r(e);var i=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("div",{staticClass:"page-header"},[a("span",[t._v(t._s(t.$t("Batch")))]),t._v(" "),a("div",{staticClass:"header-control"},[a("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),a("el-tooltip",{attrs:{content:t.$t("Check to show the contents created by outside systems"),placement:"bottom",enterable:!1}},[a("el-checkbox",{attrs:{border:!0,size:"small","true-label":"API,UI","false-label":""},on:{change:function(e){return t.T.changePageFilter(t.dataFilter)}},model:{value:t.dataFilter.origin,callback:function(e){t.$set(t.dataFilter,"origin",e)},expression:"dataFilter.origin"}},[t._v(t._s(t.$t("Show all")))])],1),t._v(" "),a("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(e){return t.openSetup(null,"add")}}},[a("i",{staticClass:"fa fa-fw fa-plus"}),t._v("\n            "+t._s(t.$t("New"))+"\n          ")])],1)])]),t._v(" "),a("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?a("div",{staticClass:"no-data-area"},[t.T.isPageFiltered({ignore:{origin:"API,UI"}})?a("h1",{staticClass:"no-data-title"},[a("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):a("h1",{staticClass:"no-data-title"},[a("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Batch has ever been added")))]),t._v(" "),a("p",{staticClass:"no-data-tip"},[t._v("\n          使用批处理，可以执行长耗时的函数\n          "),a("br"),t._v("可运用于数据清洗、数据提取等应用场景\n        ")])]):a("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[a("el-table-column",{attrs:{label:t.$t("Func"),"min-width":"420"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("FuncInfo",{attrs:{id:e.row.func_id,title:e.row.func_title,name:e.row.func_name,kwargsJSON:e.row.funcCallKwargsJSON}}),t._v(" "),a("div",[a("span",{staticClass:"text-info"},[t._v("　ID")]),t._v(" "),a("code",{staticClass:"text-code text-small"},[t._v(t._s(e.row.id))]),a("CopyButton",{attrs:{content:e.row.id}}),t._v(" "),t.T.isNothing(e.row.tagsJSON)&&t.T.isNothing(e.row.func_tagsJSON)?t._e():[a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v("　"+t._s(t.$t("Tags")))]),t._v(" "),t._l(e.row.func_tagsJSON,(function(e){return a("el-tag",{key:e,attrs:{size:"mini",type:"info"}},[t._v(t._s(e))])})),t._v(" "),t._l(e.row.tagsJSON,(function(e){return a("el-tag",{key:e,attrs:{size:"mini",type:"warning"}},[t._v(t._s(e))])}))],t._v(" "),e.row.note?[a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v("　"+t._s(t.$t("Note"))+t._s(t.$t(":")))]),t._v(" "),a("span",[t._v(t._s(e.row.note))])]:t._e()],2)]}}])}),t._v(" "),a("el-table-column",{attrs:{label:t.$t("Config"),width:"220"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Auth"))+t._s(t.$t(":")))]),t._v(" "),a("el-tooltip",{attrs:{content:e.row.apia_name,disabled:!e.row.apia_name,placement:"right"}},[a("span",{class:{"text-main":!!e.row.apia_id}},[t._v(t._s(t.C.API_AUTH_MAP.get(e.row.apia_type).name))])])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:t.$t("Status"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(e){return[e.row.isDisabled?a("span",{staticClass:"text-bad"},[a("i",{staticClass:"fa fa-fw fa-ban"}),t._v(" "+t._s(t.$t("Disabled")))]):a("span",{staticClass:"text-good"},[a("i",{staticClass:"fa fa-fw fa-check"}),t._v(" "+t._s(t.$t("Enabled")))]),t._v(" "),e.row.lastStartTime?[a("br"),t._v(" "),"success"===e.row.lastStatus?a("span",{staticClass:"text-good"},[a("i",{staticClass:"fa fa-fw fa-check"}),t._v(" "+t._s(t.$t("lastSucceeded",{t:t.T.fromNow(e.row.lastStartTime)}))+"\n              ")]):"failure"===e.row.lastStatus?a("span",{staticClass:"text-bad"},[a("i",{staticClass:"fa fa-fw fa-times"}),t._v(" "+t._s(t.$t("lastFailed",{t:t.T.fromNow(e.row.lastStartTime)}))+"\n              ")]):a("span",{staticClass:"text-main"},[a("i",{staticClass:"fa fa-fw fa-clock-o"}),t._v(" "+t._s(t.$t("lastRan",{t:t.T.fromNow(e.row.lastStartTime)}))+"\n              ")]),t._v(" "),a("br"),t._v(" "),a("i",{staticClass:"fa fa-fw fa-pie-chart text-info"}),t._v(" "),a("span",{class:{"text-good":!!e.row.recentSuccessCount}},[t._v(t._s(t.$t("successCount",{n:t.T.numberLimit(e.row.recentSuccessCount)})))]),t._v("\n              / "),a("span",{class:{"text-bad":!!e.row.recentFailureCount}},[t._v(t._s(t.$t("failureCount",{n:t.T.numberLimit(e.row.recentFailureCount)})))])]:t._e()]}}])}),t._v(" "),a("el-table-column",{attrs:{align:"right",width:"350"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-link",{attrs:{disabled:!e.row.taskInfoCount},on:{click:function(a){return t.openTaskInfo(e.row)}}},[t._v("\n              "+t._s(t.$t("Recent"))+" "),e.row.taskInfoCount?a("code",[t._v("("+t._s(t.T.numberLimit(e.row.taskInfoCount))+")")]):t._e()]),t._v(" "),a("el-link",{attrs:{disabled:t.T.isNothing(e.row.func_id)},on:{click:function(a){return t.showAPI(e.row)}}},[t._v("\n              "+t._s(t.$t("Example"))+"\n            ")]),t._v(" "),e.row.isDisabled?a("el-link",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{disabled:t.T.isNothing(e.row.func_id)},on:{click:function(a){return t.quickSubmitData(e.row,"enable")}}},[t._v(t._s(t.$t("Enable")))]):t._e(),t._v(" "),e.row.isDisabled?t._e():a("el-link",{attrs:{disabled:t.T.isNothing(e.row.func_id)},on:{click:function(a){return t.quickSubmitData(e.row,"disable")}}},[t._v(t._s(t.$t("Disable")))]),t._v(" "),a("el-link",{attrs:{disabled:t.T.isNothing(e.row.func_id)},on:{click:function(a){return t.openSetup(e.row,"setup")}}},[t._v(t._s(t.$t("Setup")))]),t._v(" "),a("el-link",{on:{click:function(a){return t.quickSubmitData(e.row,"delete")}}},[t._v(t._s(t.$t("Delete")))])]}}])})],1)],1),t._v(" "),a("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),a("APIExampleDialog",{ref:"apiExampleDialog",attrs:{description:t.$t("Batch only supports asynchronous calling"),showExecModeOption:!1,showPostExample:!0,showPostExampleSimplified:!0,showGetExample:!0,showGetExampleSimplified:!0}})],1)],1)},s=[],n=a("c7eb"),o=a("1da1"),r=(a("130f"),a("b3fd")),l={name:"BatchList",components:{APIExampleDialog:r["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(o["a"])(Object(n["a"])().mark((function t(){return Object(n["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(){var t=this;return Object(o["a"])(Object(n["a"])().mark((function e(){var a,i;return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery({_withTaskInfo:!0}),t.T.isNothing(t.dataFilter.origin)&&(a.origin="UI"),e.next=4,t.T.callAPI_get("/api/v1/batches/do/list",{query:a});case 4:if(i=e.sent,i.ok){e.next=7;break}return e.abrupt("return");case 7:t.data=i.data,t.pageInfo=i.pageInfo,t.$store.commit("updateLoadStatus",!0);case 10:case"end":return e.stop()}}),e)})))()},quickSubmitData:function(t,e){var a=this;return Object(o["a"])(Object(n["a"])().mark((function i(){var s;return Object(n["a"])().wrap((function(i){while(1)switch(i.prev=i.next){case 0:i.t0=e,i.next="disable"===i.t0?3:"delete"===i.t0?8:13;break;case 3:return i.next=5,a.T.confirm(a.$t("Are you sure you want to disable the Batch?"));case 5:if(i.sent){i.next=7;break}return i.abrupt("return");case 7:return i.abrupt("break",13);case 8:return i.next=10,a.T.confirm(a.$t("Are you sure you want to delete the Batch?"));case 10:if(i.sent){i.next=12;break}return i.abrupt("return");case 12:return i.abrupt("break",13);case 13:s=null,i.t1=e,i.next="disable"===i.t1?17:"enable"===i.t1?21:"delete"===i.t1?25:29;break;case 17:return i.next=19,a.T.callAPI("post","/api/v1/batches/:id/do/modify",{params:{id:t.id},body:{data:{isDisabled:!0}},alert:{okMessage:a.$t("Batch disabled")}});case 19:return s=i.sent,i.abrupt("break",29);case 21:return i.next=23,a.T.callAPI("post","/api/v1/batches/:id/do/modify",{params:{id:t.id},body:{data:{isDisabled:!1}},alert:{okMessage:a.$t("Batch enabled")}});case 23:return s=i.sent,i.abrupt("break",29);case 25:return i.next=27,a.T.callAPI("/api/v1/batches/:id/do/delete",{params:{id:t.id},alert:{okMessage:a.$t("Batch deleted")}});case 27:return s=i.sent,i.abrupt("break",29);case 29:if(s&&s.ok){i.next=31;break}return i.abrupt("return");case 31:return a.$store.commit("updateHighlightedTableDataId",t.id),i.next=34,a.loadData();case 34:case"end":return i.stop()}}),i)})))()},openSetup:function(t,e){var a=this.T.packRouteQuery();switch(this.$store.commit("updateTableList_scrollY"),e){case"add":this.$router.push({name:"batch-add",query:a});break;case"setup":this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"batch-setup",params:{id:t.id},query:a});break}},openTaskInfo:function(t){var e=this.T.packRouteQuery();this.$store.commit("updateHighlightedTableDataId",t.id),this.$store.commit("updateTableList_scrollY"),this.$router.push({name:"task-info-list",params:{id:t.id},query:e})},showAPI:function(t){var e=this;return Object(o["a"])(Object(n["a"])().mark((function a(){var i,s,o,r,l,c;return Object(n["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,e.T.callAPI_getOne("/api/v1/funcs/do/list",t.funcId);case 2:if(i=a.sent,i.ok){a.next=5;break}return a.abrupt("return");case 5:for(l in s=i.data.kwargsJSON,o=e.T.formatURL("/api/v1/bat/:id",{baseURL:!0,params:{id:t.id}}),r={},t.funcCallKwargsJSON)t.funcCallKwargsJSON.hasOwnProperty(l)&&e.common.isFuncArgumentPlaceholder(t.funcCallKwargsJSON[l])&&(r[l]=t.funcCallKwargsJSON[l]);c={kwargs:r},e.$store.commit("updateHighlightedTableDataId",t.id),e.$refs.apiExampleDialog.update(o,c,s);case 12:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch,origin:e.origin}}}},c=l,p=(a("cddf"),a("2877")),u=a("6678"),d=a("2020"),f=Object(p["a"])(c,i,s,!1,null,"70e6d872",null);"function"===typeof u["default"]&&Object(u["default"])(f),"function"===typeof d["default"]&&Object(d["default"])(f);e["default"]=f.exports},a2b7:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Config":"配置","Auth":"认证","Recent":"近期调用","Batch disabled":"批处理已禁用","Batch enabled":"批处理已启用","Batch deleted":"批处理已删除","Check to show the contents created by outside systems":"勾选后展示由其他系统自动创建的内容","No Batch has ever been added":"从未添加过任何批处理","Batch only supports asynchronous calling":"批处理只支持异步调用","Are you sure you want to disable the Batch?":"是否确认禁用此批处理？","Are you sure you want to delete the Batch?":"是否确认删除此批处理？","lastSucceeded":"{t}调用成功","lastFailed":"{t}调用失败","lastRan":"{t}调用","successCount":"成功 {n}","failureCount":"失败 {n}"}}'),delete t.options._Ctor}},b350:function(t,e,a){"use strict";a("244c")},b3fd:function(t,e,a){"use strict";var i=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("el-dialog",{attrs:{title:t.title||"API调用示例",visible:t.show,"close-on-click-modal":!1,width:"750px"},on:{"update:visible":function(e){t.show=e}}},[a("span",[a("span",{class:t.descriptionClass},[t._v(t._s(t.description))]),t._v(" "),t.showOptions?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("请求选项")]),t._v(" "),a("el-form",{staticClass:"call-options",attrs:{"label-width":"80px"}},[t.showExecModeOption?a("el-form-item",{attrs:{label:"异步执行"}},[a("el-switch",{attrs:{"inactive-value":"sync","active-value":"async"},model:{value:t.callOptions.execMode,callback:function(e){t.$set(t.callOptions,"execMode",e)},expression:"callOptions.execMode"}})],1):t._e(),t._v(" "),t.showSaveResultOption?a("el-form-item",{attrs:{label:"保留结果"}},[a("el-switch",{attrs:{"inactive-value":!1,"active-value":!0},model:{value:t.callOptions.saveResult,callback:function(e){t.$set(t.callOptions,"saveResult",e)},expression:"callOptions.saveResult"}})],1):t._e(),t._v(" "),t.showTimeoutOption?a("el-form-item",{attrs:{label:"执行超时"}},[a("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_TIMEOUT")},model:{value:t.callOptions.timeout,callback:function(e){t.$set(t.callOptions,"timeout",e)},expression:"callOptions.timeout"}}),t._v("　秒\n        ")],1):t._e(),t._v(" "),t.showAPITimeoutOption?a("el-form-item",{attrs:{label:"API超时"}},[a("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_API_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_API_TIMEOUT")},model:{value:t.callOptions.apiTimeout,callback:function(e){t.$set(t.callOptions,"apiTimeout",e)},expression:"callOptions.apiTimeout"}}),t._v("　秒\n        ")],1):t._e()],1)]:t._e(),t._v(" "),a("el-divider",{attrs:{"content-position":"left"}},[t._v("编辑请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[a("el-input",{attrs:{type:"textarea",readonly:"",autosize:"",resize:"none"},model:{value:t.apiURLExample,callback:function(e){t.apiURLExample=e},expression:"apiURLExample"}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[a("CopyButton",{attrs:{content:t.apiURLExample}})],1)],1),t._v(" "),t.apiBodyExample||t.supportCustomKwargs?a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[a("el-input",{attrs:{type:"textarea",autosize:"",resize:"none"},model:{value:t.apiBodyExample,callback:function(e){t.apiBodyExample=e},expression:"apiBodyExample"}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:"POST请求时，Content-Type 应设置为 application/json"}}),t._v(" "),t.apiBodyExample&&t.common.containsFuncArgumentPlaceholder(t.apiBodyExample)>=0?a("InfoBlock",{attrs:{type:"info",title:'"INPUT_BY_CALLER"为需要填写的参数，请根据需要进行修改'}}):t._e(),t._v(" "),t.supportCustomKwargs?a("InfoBlock",{attrs:{type:"success",title:"本函数允许传递额外的自定义函数参数（**kwargs 语法）"}}):t._e(),t._v(" "),t.supportFileUpload?a("InfoBlock",{attrs:{type:"success",title:'本函数支持文件上传，文件字段名为"files"'}}):t._e()],1),t._v(" "),a("el-col",{attrs:{span:2}},[a("CopyButton",{attrs:{content:t.apiBodyExample}})],1)],1):t._e(),t._v(" "),t.apiBody?[t.showGetExampleSimplified?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("GET 简化形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[t.stringParametersOnly?a("el-link",{staticClass:"api-url-with-query",attrs:{type:"primary",underline:!0,href:t.apiURLWithQueryExample_simplified,target:"_blank"}},[a("code",{domProps:{innerHTML:t._s(t.apiURLWithQueryExampleText_simplified)}})]):t._e(),t._v(" "),a("InfoBlock",{attrs:{type:t.stringParametersOnly?"info":"error",title:"此方式参数值只支持字符串，且不支持 options 参数"}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[t.stringParametersOnly?a("CopyButton",{attrs:{content:t.apiURLWithQueryExample_simplified}}):t._e()],1)],1)]:t._e(),t._v(" "),t.showGetExample?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("GET 标准形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[a("el-link",{staticClass:"api-url-with-query",attrs:{type:"primary",underline:!0,href:t.apiURLWithQueryExample,target:"_blank"}},[a("code",{domProps:{innerHTML:t._s(t.apiURLWithQueryExampleText)}})]),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:"kwargs 参数为 POST 方式中对 kwargs 参数进行 JSON 序列化，再进行 URL 编码后的字符串"}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:"kwargs 参数处理代码参考：encodeURIComponent(JSON.stringify(kwargs))"}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[a("CopyButton",{attrs:{content:t.apiURLWithQueryExample}})],1)],1)]:t._e(),t._v(" "),t.showGetExampleFlattened?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("GET 扁平形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[t.stringParametersOnly?a("el-link",{staticClass:"api-url-with-query",attrs:{type:"primary",underline:!0,href:t.apiURLWithQueryExample_flattened,target:"_blank"}},[a("code",{domProps:{innerHTML:t._s(t.apiURLWithQueryExampleText_flattened)}})]):t._e(),t._v(" "),a("InfoBlock",{attrs:{type:t.stringParametersOnly?"info":"error",title:"此方式参数值只支持字符串"}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[t.stringParametersOnly?a("CopyButton",{attrs:{content:t.apiURLWithQueryExample_flattened}}):t._e()],1)],1)]:t._e(),t._v(" "),t.showPostExampleSimplified?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("POST 简化形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[t.stringParametersOnly?a("el-input",{attrs:{type:"textarea",readonly:"",autosize:"",resize:"none",value:t.apiCallByCurlExample_simplified}}):t._e(),t._v(" "),a("InfoBlock",{attrs:{type:t.stringParametersOnly?"info":"error",title:"此方式不支持 options 参数"}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:'表单形式提交时，Content-Type 可以指定为 "multipart/form-data" 或 "application/x-www-form-urlencoded"，此时 Body 中参数值只支持字符串'}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:'JSON 形式提交时，Content-Type 可以指定为 "application/json"，配合 def f(**kwargs) 形式的函数，此时 Body 可以为任意 JSON 数据'}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:'上传文件时，Content-Type 需要指定为 "multipart/form-data"'}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[t.stringParametersOnly?a("CopyButton",{attrs:{content:t.apiCallByCurlExample_simplified}}):t._e()],1)],1)]:t._e(),t._v(" "),t.showPostExample?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("POST 标准形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[a("el-input",{attrs:{type:"textarea",readonly:"",autosize:"",resize:"none",value:t.apiCallByCurlExample}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:"此方式不支持文件上传"}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[a("CopyButton",{attrs:{content:t.apiCallByCurlExample}})],1)],1)]:t._e(),t._v(" "),t.showPostExampleFlattened?[a("el-divider",{attrs:{"content-position":"left"}},[t._v("POST 扁平形式请求")]),t._v(" "),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:22}},[t.stringParametersOnly?a("el-input",{attrs:{type:"textarea",readonly:"",autosize:"",resize:"none",value:t.apiCallByCurlExample_flattened}}):t._e(),t._v(" "),a("InfoBlock",{attrs:{type:t.stringParametersOnly?"info":"error",title:"此方式参数值只支持字符串"}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:'单纯提交数据时，Content-Type 可以指定为 "multipart/form-data" 或 "application/x-www-form-urlencoded"'}}),t._v(" "),a("InfoBlock",{attrs:{type:"info",title:'上传文件时，Content-Type 需要指定为 "multipart/form-data"'}})],1),t._v(" "),a("el-col",{attrs:{span:2}},[t.stringParametersOnly?a("CopyButton",{attrs:{content:t.apiCallByCurlExample_flattened}}):t._e()],1)],1)]:t._e()]:[a("span",{staticClass:"text-bad"},[t._v("Body内容填写存在错误，正确填写后将展示示例")])]],2)])},s=[],n=(a("e9c4"),a("ac1f"),a("1276"),a("a15b"),a("99af"),a("498a"),{name:"APIExampleDialog",components:{},watch:{callOptions:{deep:!0,handler:function(t){var e=null;try{e=JSON.parse(this.apiBodyExample)}catch(i){}if(e){for(var a in e.options=e.options||{},t)t[a]===this.DEFAULT_CALL_OPTIONS[a]?delete e.options[a]:e.options[a]=t[a];this.T.isNothing(e.options)&&delete e.options,this.apiBodyExample=JSON.stringify(e,null,2)}}}},methods:{prettyURLForHTML:function(t){if(!t)return"";try{var e=t.split("?");if(!e[1])return t;for(var a=e[1].split("&"),i=0;i<a.length;i++)a[i]=0===i?"?"+a[i]:"&"+a[i];var s=e[0]+"<br>"+a.join("<br>");return s}catch(n){return console.error(n),t}},washAPIBody:function(t){if(t=this.T.jsonCopy(t),this.T.isNothing(t))return t;if(!this.T.isNothing(t.kwargs))for(var e in t.kwargs)0!==e.indexOf("**")&&"files"!==e||delete t.kwargs[e];return this.T.isNothing(t.kwargs)&&!this.supportCustomKwargs&&delete t.kwargs,this.T.isNothing(t.options)&&delete t.options,t},update:function(t,e,a){for(var i in e=e||{},e.kwargs=e.kwargs||{},e.options=e.options||{},a=a||{},this.supportFileUpload=!1,this.supportCustomKwargs=!1,this.callOptions)this.callOptions[i]=this.DEFAULT_CALL_OPTIONS[i];for(var s in e.kwargs.files&&(this.supportFileUpload=this.common.isFuncArgumentPlaceholder(e.kwargs.files)),a)if(0===s.indexOf("**")){this.supportCustomKwargs=!0;break}e=this.washAPIBody(e),e=this.T.isNothing(e)?"":JSON.stringify(e,null,2),this.apiURLExample=t,this.apiBodyExample=e,this.show=!0},getAPIURLWithQueryExample:function(t,e,a){if(!this.apiBody)return null;var i=this.washAPIBody(this.apiBody);t=t||"normal",e=e||!1;var s=null,n={};switch(t){case"normal":n=i||n,s=this.T.formatURL(this.apiURLExample,{query:n});break;case"simplified":i&&i.kwargs&&(n=i.kwargs||n),s=this.T.formatURL("".concat(this.apiURLExample,"/simplified"),{query:n});break;case"flattened":if(i){if(i.kwargs)for(var o in i.kwargs)n["kwargs_".concat(o)]=i.kwargs[o];if(i.options)for(var r in i.options)n["options_".concat(r)]=i.options[r]}s=this.T.formatURL("".concat(this.apiURLExample,"/flattened"),{query:n});break}return e&&(s=this.prettyURLForHTML(s)),a&&(s=decodeURIComponent(s)),s},getAPICallByCurlPostExample:function(t){if(!this.apiBody)return null;var e=this.washAPIBody(this.apiBody);t=t||"normal";var a="",i="",s="";switch(t){case"normal":a=this.apiURLExample,i='-H "Content-Type: application/json"',this.T.isNothing(e)||(s="-d '".concat(JSON.stringify(e),"'"));break;case"simplified":if(a="".concat(this.apiURLExample,"/").concat(t),this.supportFileUpload){if(i='-H "Content-Type: multipart/form-data"',!this.T.isNothing(e.kwargs))for(var n in e.kwargs)s+=" -F '".concat(n,"=").concat(e.kwargs[n],"'");s+=" -F files=@FILE_TO_UPLOAD"}else i='-H "Content-Type: application/x-www-form-urlencoded"',this.T.isNothing(e.kwargs)||(s+=" -d '".concat(this.T.formatQuery(e.kwargs),"'"));break;case"flattened":if(a="".concat(this.apiURLExample,"/").concat(t),i='-H "Content-Type: application/x-www-form-urlencoded"',!this.T.isNothing(e.kwargs))for(var o in e.kwargs)s+=" -F kwargs_".concat(o,"=").concat(e.kwargs[o]);if(!this.T.isNothing(e.options))for(var r in e.options)s+=" -F options_".concat(r,"=").concat(e.options[r]);this.supportFileUpload&&(s+=" -F kwargs_files=@FILE_TO_UPLOAD");break}var l="curl -X POST";return i&&(l+=" ".concat(i.trim())),s&&(l+=" ".concat(s.trim())),a&&(l+=" ".concat(a.trim())),l}},computed:{DEFAULT_CALL_OPTIONS:function(){return{execMode:"sync",saveResult:!1,timeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_TIMEOUT"),apiTimeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_API_TIMEOUT")}},showOptions:function(){return this.showExecModeOption||this.showSaveResultOption||this.showTimeoutOption||this.showAPITimeoutOption},apiBody:function(){if(!this.apiBodyExample)return{};var t=null;try{t=JSON.parse(this.apiBodyExample)}catch(e){return null}return t},apiURLWithQueryExample:function(){return this.getAPIURLWithQueryExample("normal")},apiURLWithQueryExample_flattened:function(){return this.getAPIURLWithQueryExample("flattened")},apiURLWithQueryExample_simplified:function(){return this.getAPIURLWithQueryExample("simplified")},apiURLWithQueryExampleText:function(){return this.getAPIURLWithQueryExample("normal",!0,!0)},apiURLWithQueryExampleText_simplified:function(){return this.getAPIURLWithQueryExample("simplified",!0,!0)},apiURLWithQueryExampleText_flattened:function(){return this.getAPIURLWithQueryExample("flattened",!0,!0)},apiCallByCurlExample:function(){return this.getAPICallByCurlPostExample("normal")},apiCallByCurlExample_simplified:function(){return this.getAPICallByCurlPostExample("simplified")},apiCallByCurlExample_flattened:function(){return this.getAPICallByCurlPostExample("flattened")},stringParametersOnly:function(){if(!this.apiBody)return!1;var t=this.apiBody.kwargs||{};for(var e in t)if("string"!==typeof t[e])return!1;return!0}},props:{title:String,description:String,descriptionClass:Object,showExecModeOption:{type:Boolean,default:!1},showSaveResultOption:{type:Boolean,default:!1},showTimeoutOption:{type:Boolean,default:!1},showAPITimeoutOption:{type:Boolean,default:!1},showGetExample:{type:Boolean,default:!0},showGetExampleSimplified:{type:Boolean,default:!1},showGetExampleFlattened:{type:Boolean,default:!1},showPostExample:{type:Boolean,default:!0},showPostExampleSimplified:{type:Boolean,default:!1},showPostExampleFlattened:{type:Boolean,default:!1}},data:function(){return{show:!1,supportFileUpload:!1,supportCustomKwargs:!1,apiURLExample:null,apiBodyExample:null,funcKwargs:null,callOptions:{execMode:null,saveResult:null,timeout:null,apiTimeout:null}}}}),o=n,r=(a("b350"),a("2877")),l=Object(r["a"])(o,i,s,!1,null,"27941e0a",null);e["a"]=l.exports},c25d:function(t,e,a){},cddf:function(t,e,a){"use strict";a("c25d")}}]);