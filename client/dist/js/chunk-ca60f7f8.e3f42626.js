(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-ca60f7f8"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as a text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"21a6":function(t,e,a){(function(a){var o,s,n;(function(a,i){s=[],o=i,n="function"===typeof o?o.apply(e,s):o,void 0===n||(t.exports=n)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function o(t,e,a){var o=new XMLHttpRequest;o.open("GET",t),o.responseType="blob",o.onload=function(){c(o.response,e,a)},o.onerror=function(){console.error("could not download file")},o.send()}function s(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function n(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(o){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var i="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof a&&a.global===a?a:void 0,r=i.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=i.saveAs||("object"!=typeof window||window!==i?function(){}:"download"in HTMLAnchorElement.prototype&&!r?function(t,e,a){var r=i.URL||i.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin===location.origin?n(c):s(c.href)?o(t,e,a):n(c,c.target="_blank")):(c.href=r.createObjectURL(t),setTimeout((function(){r.revokeObjectURL(c.href)}),4e4),setTimeout((function(){n(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,a,i){if(a=a||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,i),a);else if(s(t))o(t,a,i);else{var r=document.createElement("a");r.href=t,r.target="_blank",setTimeout((function(){n(r)}))}}:function(t,e,a,s){if(s=s||open("","_blank"),s&&(s.document.title=s.document.body.innerText="downloading..."),"string"==typeof t)return o(t,e,a);var n="application/octet-stream"===t.type,c=/constructor/i.test(i.HTMLElement)||i.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||n&&c||r)&&"undefined"!=typeof FileReader){var u=new FileReader;u.onloadend=function(){var t=u.result;t=l?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),s?s.location.href=t:location=t,s=null},u.readAsDataURL(t)}else{var d=i.URL||i.webkitURL,f=d.createObjectURL(t);s?s.location=f:location.href=f,s=null,setTimeout((function(){d.revokeObjectURL(f)}),4e4)}});i.saveAs=c.saveAs=c,t.exports=c}))}).call(this,a("c8ba"))},"260e":function(t,e,a){"use strict";a.r(e);a("b0c0"),a("99af"),a("b680");var o=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"common-page-header"},[e("div",[e("h1",[t._v(t._s(t.isRoot?t.$t("Recent Task Record"):t.$t("Related Task Record")))]),t._v(" "),e("small",{staticClass:"text-info"},[t._v("\n            　\n            "),t.dataFilter.origin?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Origin"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.$t(t.dataFilter.origin)))])]):t._e(),t._v(" "),t.dataFilter.originId?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Origin ID"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.dataFilter.originId))]),t._v(" "),e("CopyButton",{attrs:{content:t.dataFilter.originId}})],1):t._e(),t._v(" "),t.dataFilter.funcId?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Func ID"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.dataFilter.funcId))]),t._v(" "),e("CopyButton",{attrs:{content:t.dataFilter.funcId}})],1):t._e()])]),t._v(" "),e("div",{staticClass:"header-control"},[e("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),t.hasTaskType?e("el-tooltip",{attrs:{content:t.$t("Only main tasks are listed"),placement:"bottom",enterable:!1}},[t.isRoot?e("el-checkbox",{attrs:{border:!0,size:"small","true-label":"ROOT","false-label":""},on:{change:function(e){return t.T.changePageFilter(t.dataFilter)}},model:{value:t.dataFilter.rootTaskId,callback:function(e){t.$set(t.dataFilter,"rootTaskId",e)},expression:"dataFilter.rootTaskId"}},[t._v(t._s(t.$t("Main Task Only")))]):t._e()],1):t._e()],1)])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Recent Task Record")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          "+t._s(t.$t("All recent Task Record will be collected and shown here"))+"\n        ")])]):e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[e("el-table-column",{attrs:{label:t.$t("Status"),width:"150"},scopedSlots:t._u([{key:"default",fn:function(a){return[t.C.TASK_STATUS_MAP.get(a.row.status)?e("el-tag",{attrs:{type:t.C.TASK_STATUS_MAP.get(a.row.status).tagType}},[e("i",{class:t.C.TASK_STATUS_MAP.get(a.row.status).icon}),t._v("\n              "+t._s(t.C.TASK_STATUS_MAP.get(a.row.status).name)+"\n            ")]):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Trigger Time"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",[t._v(t._s(t._f("datetime")(a.row.triggerTimeMs)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(a.row.triggerTimeMs)))])]}}])}),t._v(" "),t.hasTaskType?e("el-table-column",{attrs:{width:"100",align:"center"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.subTaskCount>0?e("el-tag",{attrs:{size:"medium",type:"primary"}},[t._v(t._s(t.$t("Main Task")))]):"ROOT"!==a.row.rootTaskId?e("el-tag",{attrs:{size:"small",type:"info"}},[t._v(t._s(t.$t("Sub Task")))]):t._e()]}}],null,!1,2618681449)}):t._e(),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Func"),"min-width":"300"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("FuncInfo",{attrs:{"config-func-id":a.row.funcId,id:a.row.func_id,title:a.row.func_title}}),t._v(" "),a.row.exceptionType?e("InfoBlock",{attrs:{type:"error",title:"".concat(a.row.exceptionType,": ").concat(a.row.exceptionTEXTReduced)}}):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Wait Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.waitCostMs&&a.row.waitCostMs>2e3?[e("strong",{class:a.row.waitCostClass},[t._v(t._s(a.row.waitCostMs<1e4?a.row.waitCostMs:(a.row.waitCostMs/1e3).toFixed(1)))]),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(a.row.waitCostMs<1e4?t.$t("ms"):t.$t("s")))])]:[t._v("-")]]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Run Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.runCostMs?[e("strong",{class:a.row.runCostClass},[t._v(t._s(a.row.runCostMs<1e4?a.row.runCostMs:(a.row.runCostMs/1e3).toFixed(1)))]),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(a.row.runCostMs<1e4?t.$t("ms"):t.$t("s")))])]:[t._v("-")]]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Log Lines"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.logLines<10?e("strong",{staticClass:"text-info"},[t._v(t._s(a.row.logLines))]):a.row.logLines<100?e("strong",{staticClass:"text-good"},[t._v(t._s(a.row.logLines))]):a.row.logLines<1e3?e("strong",{staticClass:"text-watch"},[t._v(t._s(a.row.logLines))]):e("strong",{staticClass:"text-bad"},[t._v(t._s(a.row.logLines))])]}}])}),t._v(" "),e("el-table-column",{attrs:{width:"240",align:"right"},scopedSlots:t._u([{key:"default",fn:function(a){return[t.isRoot?[a.row.subTaskCount>0||"ROOT"!==a.row.rootTaskId?e("el-button",{attrs:{type:"text"},on:{click:function(e){return t.openSubTaskRecord(a.row)}}},[t._v(t._s(t.$t("Related Tasks")))]):t._e()]:t._e(),t._v(" "),e("el-button",{attrs:{type:"text"},on:{click:function(e){return t.showDetail(a.row)}}},[t._v(t._s(t.$t("Show Detail")))])]}}])})],1)],1),t._v(" "),e("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{showDownload:!0}})],1)],1)},s=[],n=a("c7eb"),i=a("1da1"),r=(a("130f"),a("d3b7"),a("159b"),a("4de4"),a("14d9"),a("2ca0"),a("ac1f"),a("5319"),a("a15b"),a("b76c")),c={name:"TaskRecordFuncList",components:{LongTextDialog:r["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(i["a"])(Object(n["a"])().mark((function t(){return Object(n["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(n["a"])().mark((function e(){var a,o;return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery(),e.next=3,t.T.callAPI_get("/api/v1/task-records/func/do/list",{query:a});case 3:if(o=e.sent,o&&o.ok){e.next=6;break}return e.abrupt("return");case 6:o.data.forEach((function(e){(e.subTaskCount>0||"ROOT"!==e.rootTaskId)&&(t.hasTaskType=!0),e.logLines=0,e.printLogsTEXT&&(e.logLines=e.printLogsTEXT.split("\n").length),e.triggerTimeMs&&e.startTimeMs&&(e.waitCostMs=e.startTimeMs-e.triggerTimeMs,e.waitCostMs>18e4?e.waitCostClass="text-bad":e.waitCostMs>1e4?e.waitCostClass="text-watch":e.waitCostClass="text-good"),e.startTimeMs&&e.endTimeMs&&(e.runCostMs=e.endTimeMs-e.startTimeMs,e.runCostMs>3e5?e.runCostClass="text-bad":e.runCostMs>1e4?e.runCostClass="text-watch":e.runCostClass="text-good"),e.exceptionTEXT&&(e.exceptionTEXTReduced=t.T.limitText(e.exceptionTEXT,300,{showLength:"newLine"}))})),t.data=o.data,t.pageInfo=o.pageInfo,t.$store.commit("updateLoadStatus",!0);case 10:case"end":return e.stop()}}),e)})))()},openSubTaskRecord:function(t){var e=this.T.packRouteQuery();e.filter=this.T.createPageFilter({rootTaskId:"ROOT"===t.rootTaskId?t.id:t.rootTaskId}),this.$store.commit("updateHighlightedTableDataId",t.id),this.$store.commit("updateTableList_scrollY"),this.$router.push({name:"sub-task-record-func-list",params:{id:this.$route.params.id},query:e})},showDetail:function(t){this.$store.commit("updateHighlightedTableDataId",t.id);var e="scriptLib",a=t.funcId;this.T.startsWith(t.funcId,"_bp_")&&(e="blueprint",a=t.funcId.replace(/^_bp_/g,"").split("__")[0]);var o=[];o.push("===== ".concat(this.$t("Task")," =====")),"scriptLib"===e?(o.push("".concat(this.$t("Func ID")," : ").concat(this.$t(a))),o.push("".concat(this.$t("Func Title"),": ").concat(this.$t(t.func_title)))):(o.push("".concat(this.$t("Blueprint ID")," : ").concat(this.$t(a))),o.push("".concat(this.$t("Blueprint Title"),": ").concat(this.$t(t.func_title)))),o.push("".concat(this.$t("Queue"),": #").concat(t.queue)),o.push(""),o.push("".concat(this.$t("Trigger Time"),": ").concat(this.T.getDateTimeString(t.triggerTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.triggerTimeMs)).concat(this.$t(")"))),o.push("".concat(this.$t("Start Time"),": ").concat(this.T.getDateTimeString(t.startTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.startTimeMs)).concat(this.$t(")"))),o.push("".concat(this.$t("End Time"),": ").concat(this.T.getDateTimeString(t.endTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.endTimeMs)).concat(this.$t(")"))),t.delay>0?o.push("".concat(this.$t("Delay"),": ").concat(t.delay," ").concat(this.$t("s"))):o.push("".concat(this.$t("Delay"),": -")),t.waitCostMs>1e3?o.push("".concat(this.$t("Wait Cost"),": ").concat(t.waitCostMs," ").concat(this.$t("ms"))):o.push("".concat(this.$t("Wait Cost"),": -")),o.push("".concat(this.$t("Run Cost"),": ").concat(t.runCostMs," ").concat(this.$t("ms"))),o.push("".concat(this.$t("Task Type"),": ").concat("ROOT"===t.rootTaskId?this.$t("Main Task"):this.$t("Sub Task"))),o.push("".concat(this.$t("Task Status"),": ").concat(this.$t(t.status))),o.push(""),o.push("===== ".concat(this.$t("Print Log")," =====")),t.printLogsTEXT?o.push(t.printLogsTEXT):o.push(this.$t("No Print Log")),o.push(""),o.push("===== ".concat(this.$t("Traceback")," =====")),t.tracebackTEXT?o.push(t.tracebackTEXT):o.push(this.$t("No Traceback"));var s=o.join("\n"),n=this.M(t.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),i="".concat(e,"-").concat(a,".log.").concat(n);this.$refs.longTextDialog.update(s,i)}},computed:{isRoot:function(){return"task-record-func-list"===this.$route.name}},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch,rootTaskId:e.rootTaskId},hasTaskType:!1}}},l=c,u=(a("3dd2"),a("2877")),d=a("626e"),f=a("7f76"),h=Object(u["a"])(l,o,s,!1,null,"359ded7e",null);"function"===typeof d["default"]&&Object(d["default"])(h),"function"===typeof f["default"]&&Object(f["default"])(h);e["default"]=h.exports},"3aac":function(t,e,a){},"3dd2":function(t,e,a){"use strict";a("c5af")},"5e66":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Exec Mode":"执行模式","Trigger Time":"触发时间","Start Time":"启动时间","End Time":"结束时间","Task":"任务","Func Title":"函数标题","Func ID":"函数 ID","Blueprint Title":"蓝图标题","Blueprint ID":"蓝图 ID","Main Task":"主任务","Sub Task":"子任务","Delay":"延迟执行","Queue":"所属队列","Wait Cost":"排队耗时","Run Cost":"执行耗时","Log Lines":"日志行数","Task Type":"任务类型","Task Status":"任务状态","Print Log":"Print 日志","Traceback":"调用堆栈","No Print Log":"无 Print 日志","No Traceback":"无调用堆栈信息","Recent Task Record":"近期任务记录","Related Task Record":"相关任务记录","Only main tasks are listed":"在本页面只展示主任务","success":"成功","failure":"失败","timeout":"执行超时","skip":"跳过执行","Main Task Only":"仅主任务","Show Detail":"显示详情","Related Tasks":"相关任务","Task Record cleared":"任务记录已清空","Are you sure you want to clear the Task Record?":"是否确认清空任务记录？","No Recent Task Record":"尚无任何近期任务记录","All recent Task Record will be collected and shown here":"所有近期任务会被记录，并展示在此","Origin":"来源","Origin ID":"来源 ID","direct":"直接调用","integration":"集成调用","authLink":"授权链接","crontab":"自动触发","batch":"批处理","connector":"连接器"}}'),delete t.options._Ctor}},"626e":function(t,e,a){"use strict";var o=a("791a"),s=a.n(o);e["default"]=s.a},"68fc":function(t,e,a){"use strict";a("8026")},"791a":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"direct":"Directly Call","integration":"Integration Call","authLink":"Auth Link","crontab":"Crontab","batch":"Batch","connector":"Connector"}}'),delete t.options._Ctor}},"7b0b4":function(t,e,a){"use strict";var o=a("0797"),s=a.n(o);e["default"]=s.a},"7f76":function(t,e,a){"use strict";var o=a("5e66"),s=a.n(o);e["default"]=s.a},8026:function(t,e,a){},b76c:function(t,e,a){"use strict";var o=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n    "),e("span",{staticClass:"text-info press-esc-to-close-tip"},[t._v(t._s(t.$t("Press ESC to close")))])]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as a text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},s=[],n=(a("130f"),a("21a6")),i=a.n(n),r={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var a=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){if(!a.codeMirror){var t={mode:a.mode||"text"};a.codeMirror=a.T.initCodeMirror("longTextDialogContent",t),a.codeMirror.setOption("theme",a.T.getCodeMirrorThemeName()),a.T.setCodeMirrorReadOnly(a.codeMirror,!0)}a.codeMirror.setValue(a.content||""),a.codeMirror.refresh(),a.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;i.a.saveAs(t,e)}},computed:{},props:{title:String,mode:String,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=r,l=(a("68fc"),a("cb4e"),a("2877")),u=a("7b0b4"),d=Object(l["a"])(c,o,s,!1,null,"7f557796",null);"function"===typeof u["default"]&&Object(u["default"])(d);e["a"]=d.exports},c5af:function(t,e,a){},cb4e:function(t,e,a){"use strict";a("3aac")}}]);