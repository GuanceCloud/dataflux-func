(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-16cb41af"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as a text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"17b4":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"All recent Task Record will be collected and shown here":"所有近期任務會被記錄，並展示在此","Are you sure you want to clear the Task Record?":"是否確認清空任務記錄？","Blueprint ID: ":"藍圖 ID ：","Blueprint Title: ":"藍圖標題：","Delay":"延遲","Delay Time: ":"延遲執行：","End Time: ":"結束時間：","Exec Mode":"執行模式","Func ID":"函數 ID","Func ID: ":"函數 ID ：","Func Title: ":"函數標題：","Guance Data Upload Failed":"觀測雲數據上報失敗","Log Lines":"日誌行數","Main Task":"主任務","Main Task Only":"僅主任務","No Delay":"不延遲","No Print Log":"無 Print 日誌","No Recent Task Record":"尚無任何近期任務記錄","Non-critical Errors":"非關鍵錯誤","Non-critical errors exist":"存在非關鍵錯誤","Only main tasks are listed":"在本頁面只展示主任務","Origin":"來源","Origin ID":"來源 ID","Print Log":"Print 日誌","Queue: ":"所屬隊列：","Queuing":"排隊","Queuing Time: ":"排隊等待：","Recent Task Record":"近期任務記錄","Related Task Record":"相關任務記錄","Related Tasks":"相關任務","Run Cost":"執行耗時","Run Cost: ":"執行耗時：","Show Detail":"顯示詳情","Start Time: ":"開始時間：","Sub Task":"子任務","Task":"任務","Task Expires: ":"任務過期：","Task Record cleared":"任務記錄已清空","Task Status: ":"任務狀態：","Task Timeout: ":"任務超時：","Task Type: ":"任務類型：","Traceback":"調用堆棧","Trigger Time":"觸發時間","Trigger Time: ":"觸發時間：","Wait Cost":"等待耗時","authLink":"授權鏈接","batch":"批處理","connector":"連接器","crontabConfig":"自動觸發","direct":"直接調用","failure":"失敗","integration":"集成調用","skip":"跳過執行","success":"成功","timeout":"執行超時"}}'),delete t.options._Ctor}},19173:function(t,e,n){"use strict";var a=n("a387"),i=n.n(a);e["default"]=i.a},"1b85":function(t,e,n){"use strict";n("7c5d")},"1cbb":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"All recent Task Record will be collected and shown here":"所有近期任務會被記錄，並展示在此","Are you sure you want to clear the Task Record?":"是否確認清空任務記錄？","Blueprint ID: ":"藍圖 ID ：","Blueprint Title: ":"藍圖示題：","Delay":"延遲","Delay Time: ":"延遲執行：","End Time: ":"結束時間：","Exec Mode":"執行模式","Func ID":"函式 ID","Func ID: ":"函式 ID ：","Func Title: ":"函式標題：","Guance Data Upload Failed":"觀測雲資料上報失敗","Log Lines":"日誌行數","Main Task":"主任務","Main Task Only":"僅主任務","No Delay":"不延遲","No Print Log":"無 Print 日誌","No Recent Task Record":"尚無任何近期任務記錄","Non-critical Errors":"非關鍵錯誤","Non-critical errors exist":"存在非關鍵錯誤","Only main tasks are listed":"在本頁面只展示主任務","Origin":"來源","Origin ID":"來源 ID","Print Log":"Print 日誌","Queue: ":"所屬佇列：","Queuing":"排隊","Queuing Time: ":"排隊等待：","Recent Task Record":"近期任務記錄","Related Task Record":"相關任務記錄","Related Tasks":"相關任務","Run Cost":"執行耗時","Run Cost: ":"執行耗時：","Show Detail":"顯示詳情","Start Time: ":"開始時間：","Sub Task":"子任務","Task":"任務","Task Expires: ":"任務過期：","Task Record cleared":"任務記錄已清空","Task Status: ":"任務狀態：","Task Timeout: ":"任務超時：","Task Type: ":"任務型別：","Traceback":"呼叫堆疊","Trigger Time":"觸發時間","Trigger Time: ":"觸發時間：","Wait Cost":"等待耗時","authLink":"授權連結","batch":"批處理","connector":"聯結器","crontabConfig":"自動觸發","direct":"直接呼叫","failure":"失敗","integration":"整合呼叫","skip":"跳過執行","success":"成功","timeout":"執行超時"}}'),delete t.options._Ctor}},"21a6":function(t,e,n){(function(n){var a,i,o;(function(n,s){i=[],a=s,o="function"===typeof a?a.apply(e,i):a,void 0===o||(t.exports=o)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function a(t,e,n){var a=new XMLHttpRequest;a.open("GET",t),a.responseType="blob",a.onload=function(){c(a.response,e,n)},a.onerror=function(){console.error("could not download file")},a.send()}function i(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function o(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(a){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var s="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof n&&n.global===n?n:void 0,r=s.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=s.saveAs||("object"!=typeof window||window!==s?function(){}:"download"in HTMLAnchorElement.prototype&&!r?function(t,e,n){var r=s.URL||s.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin===location.origin?o(c):i(c.href)?a(t,e,n):o(c,c.target="_blank")):(c.href=r.createObjectURL(t),setTimeout((function(){r.revokeObjectURL(c.href)}),4e4),setTimeout((function(){o(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,n,s){if(n=n||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,s),n);else if(i(t))a(t,n,s);else{var r=document.createElement("a");r.href=t,r.target="_blank",setTimeout((function(){o(r)}))}}:function(t,e,n,i){if(i=i||open("","_blank"),i&&(i.document.title=i.document.body.innerText="downloading..."),"string"==typeof t)return a(t,e,n);var o="application/octet-stream"===t.type,c=/constructor/i.test(s.HTMLElement)||s.safari,u=/CriOS\/[\d]+/.test(navigator.userAgent);if((u||o&&c||r)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var t=l.result;t=u?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),i?i.location.href=t:location=t,i=null},l.readAsDataURL(t)}else{var d=s.URL||s.webkitURL,f=d.createObjectURL(t);i?i.location=f:location.href=f,i=null,setTimeout((function(){d.revokeObjectURL(f)}),4e4)}});s.saveAs=c.saveAs=c,t.exports=c}))}).call(this,n("c8ba"))},"260e":function(t,e,n){"use strict";n.r(e);n("99af"),n("b0c0");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"common-page-header"},[e("div",[e("h1",[t._v(t._s(t.isRoot?t.$t("Recent Task Record"):t.$t("Related Task Record")))]),t._v(" "),e("small",{staticClass:"text-info"},[t._v("\n            　\n            "),t.dataFilter.origin?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Origin"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.$t(t.dataFilter.origin)))])]):t._e(),t._v(" "),t.dataFilter.originId?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Origin ID"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.dataFilter.originId))]),t._v(" "),e("CopyButton",{attrs:{content:t.dataFilter.originId}})],1):t._e(),t._v(" "),t.dataFilter.funcId?e("span",{staticClass:"task-record-query"},[t._v("\n              "+t._s(t.$t("Func ID"))+"\n              "),e("code",{staticClass:"text-main"},[t._v(t._s(t.dataFilter.funcId))]),t._v(" "),e("CopyButton",{attrs:{content:t.dataFilter.funcId}})],1):t._e()])]),t._v(" "),e("div",{staticClass:"header-control"},[e("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),t.hasTaskType?e("el-tooltip",{attrs:{content:t.$t("Only main tasks are listed"),placement:"bottom",enterable:!1}},[t.isRoot?e("el-checkbox",{attrs:{border:!0,size:"small","true-label":"ROOT","false-label":""},on:{change:function(e){return t.T.changePageFilter(t.dataFilter)}},model:{value:t.dataFilter.rootTaskId,callback:function(e){t.$set(t.dataFilter,"rootTaskId",e)},expression:"dataFilter.rootTaskId"}},[t._v(t._s(t.$t("Main Task Only")))]):t._e()],1):t._e()],1)])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Recent Task Record")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          "+t._s(t.$t("All recent Task Record will be collected and shown here"))+"\n        ")])]):e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[e("el-table-column",{attrs:{label:t.$t("Status"),width:"120"},scopedSlots:t._u([{key:"default",fn:function(n){return[t.C.TASK_STATUS_MAP.get(n.row.status)?e("el-tag",{attrs:{type:t.C.TASK_STATUS_MAP.get(n.row.status).tagType}},[e("i",{class:t.C.TASK_STATUS_MAP.get(n.row.status).icon}),t._v("\n              "+t._s(t.C.TASK_STATUS_MAP.get(n.row.status).name)+"\n            ")]):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Trigger Time"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("span",[t._v(t._s(t._f("datetime")(n.row.triggerTimeMs)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(n.row.triggerTimeMs)))])]}}])}),t._v(" "),t.hasTaskType?e("el-table-column",{attrs:{width:"100",align:"center"},scopedSlots:t._u([{key:"default",fn:function(n){return[n.row.subTaskCount>0?e("el-tag",{attrs:{size:"medium",type:"primary"}},[t._v(t._s(t.$t("Main Task")))]):"ROOT"!==n.row.rootTaskId?e("el-tag",{attrs:{size:"small",type:"info"}},[t._v(t._s(t.$t("Sub Task")))]):t._e()]}}],null,!1,2618681449)}):t._e(),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Func"),"min-width":"300"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("FuncInfo",{attrs:{"config-func-id":n.row.funcId,id:n.row.func_id,title:n.row.func_title}}),t._v(" "),n.row.exceptionType?e("InfoBlock",{attrs:{type:"error",title:"".concat(n.row.exceptionType,": ").concat(n.row.exceptionTEXT)}}):t._e(),t._v(" "),n.row.nonCriticalErrorsTEXT?e("InfoBlock",{attrs:{type:"warning",title:"".concat(t.$t("Non-critical errors exist")).concat(t.$t(":")).concat(t.getNonCriticalErrorSumary(n.row))}}):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Wait Cost"),align:"left",width:"180"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Delay"))+t._s(t.$t(":")))]),t._v(" "),n.row.delay?[e("span",{staticClass:"text-main"},[e("TimeDuration",{attrs:{duration:n.row.delay,unit:"s"}})],1)]:[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("No Delay")))])],t._v(" "),n.row.queuingTime?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Queuing"))+t._s(t.$t(":")))]),t._v(" "),e("span",{class:n.row.waitCostClass},[e("TimeDuration",{attrs:{duration:n.row.queuingTime,unit:"ms"}})],1)]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Run Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(n){return[n.row.runCostMs?[e("TimeDuration",{attrs:{duration:n.row.runCostMs,unit:"ms"}})]:[t._v("-")]]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Log Lines"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(n){return[n.row.logLines<10?e("strong",{staticClass:"text-info"},[t._v(t._s(n.row.logLines))]):n.row.logLines<100?e("strong",{staticClass:"text-good"},[t._v(t._s(n.row.logLines))]):n.row.logLines<1e3?e("strong",{staticClass:"text-watch"},[t._v(t._s(n.row.logLines))]):e("strong",{staticClass:"text-bad"},[t._v(t._s(n.row.logLines))])]}}])}),t._v(" "),e("el-table-column",{attrs:{width:"240",align:"right"},scopedSlots:t._u([{key:"default",fn:function(n){return[t.isRoot?[n.row.subTaskCount>0||"ROOT"!==n.row.rootTaskId?e("el-button",{attrs:{type:"text"},on:{click:function(e){return t.openSubTaskRecord(n.row)}}},[t._v(t._s(t.$t("Related Tasks")))]):t._e()]:t._e(),t._v(" "),e("el-button",{attrs:{type:"text"},on:{click:function(e){return t.showDetail(n.row)}}},[t._v(t._s(t.$t("Show Detail")))])]}}])})],1)],1),t._v(" "),e("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{showDownload:!0}})],1)],1)},i=[],o=n("c7eb"),s=n("1da1"),r=(n("4de4"),n("a15b"),n("14d9"),n("4e82"),n("d3b7"),n("ac1f"),n("5319"),n("2ca0"),n("159b"),n("130f"),n("2ac1")),c=n("b76c"),u={name:"TaskRecordFuncList",components:{TimeDuration:r["a"],LongTextDialog:c["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var n=this;return Object(s["a"])(Object(o["a"])().mark((function t(){return Object(o["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,n.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(){var t=this;return Object(s["a"])(Object(o["a"])().mark((function e(){var n,a;return Object(o["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return n=t.dataFilter=t.T.createListQuery(),e.next=3,t.T.callAPI_get("/api/v1/task-records/func/do/list",{query:n});case 3:if(a=e.sent,a&&a.ok){e.next=6;break}return e.abrupt("return");case 6:a.data.sort((function(t,e){return t.triggerTimeMs<e.triggerTimeMs?1:t.triggerTimeMs>e.triggerTimeMs?-1:0})),a.data.forEach((function(e){(e.subTaskCount>0||"ROOT"!==e.rootTaskId)&&(t.hasTaskType=!0),e.logLines=0,e.printLogsTEXT&&(e.logLines=e.printLogsTEXT.split("\n").length),e.triggerTimeMs&&e.startTimeMs&&(e.queuingTime=e.startTimeMs-e.triggerTimeMs-1e3*e.delay,e.queuingTime>18e4?e.waitCostClass="text-bad":e.queuingTime>1e4?e.waitCostClass="text-watch":e.queuingTime>300?e.waitCostClass="text-good":e.waitCostClass="text-info"),e.startTimeMs&&e.endTimeMs&&(e.runCostMs=e.endTimeMs-e.startTimeMs,e.runCostMs>3e5?e.runCostClass="text-bad":e.runCostMs>1e4?e.runCostClass="text-watch":e.runCostClass="text-good")})),t.data=a.data,t.pageInfo=a.pageInfo,t.$store.commit("updateLoadStatus",!0);case 11:case"end":return e.stop()}}),e)})))()},openSubTaskRecord:function(t){var e=this.T.packRouteQuery();e.filter=this.T.createPageFilter({rootTaskId:"ROOT"===t.rootTaskId?t.id:t.rootTaskId}),this.$store.commit("updateHighlightedTableDataId",t.id),this.$store.commit("updateTableList_scrollY"),this.$router.push({name:"sub-task-record-func-list",params:{id:this.$route.params.id},query:e})},showDetail:function(t){this.$store.commit("updateHighlightedTableDataId",t.id);var e="scriptLib",n=t.funcId;this.T.startsWith(t.funcId,"_bp_")&&(e="blueprint",n=t.funcId.replace(/^_bp_/g,"").split("__")[0]);var a=[];a.push("===== ".concat(this.$t("Task")," =====")),"scriptLib"===e?(a.push("".concat(this.$t("Func ID: ")).concat(this.$t(n))),a.push("".concat(this.$t("Func Title: ")).concat(this.$t(t.func_title)))):(a.push("".concat(this.$t("Blueprint ID: ")).concat(this.$t(n))),a.push("".concat(this.$t("Blueprint Title: ")).concat(this.$t(t.func_title)))),a.push(""),a.push("".concat(this.$t("Queue: "),"#").concat(t.queue)),a.push("".concat(this.$t("Task Type: ")).concat("ROOT"===t.rootTaskId?this.$t("Main Task"):this.$t("Sub Task"))),a.push("".concat(this.$t("Task Timeout: ")).concat(t.timeout," ").concat(this.$t("s"))),a.push("".concat(this.$t("Task Expires: ")).concat(t.expires," ").concat(this.$t("s"))),a.push("".concat(this.$t("Trigger Time: ")).concat(this.T.getDateTimeString(t.triggerTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.triggerTimeMs)).concat(this.$t(")"))),a.push("".concat(this.$t("Start Time: ")).concat(this.T.getDateTimeString(t.startTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.startTimeMs)).concat(this.$t(")"))),a.push("".concat(this.$t("End Time: ")).concat(this.T.getDateTimeString(t.endTimeMs)," ").concat(this.$t("(")).concat(this.T.fromNow(t.endTimeMs)).concat(this.$t(")"))),t.delay>0?a.push("".concat(this.$t("Delay Time: ")).concat(t.delay," ").concat(this.$t("s"))):a.push("".concat(this.$t("Delay Time: "),"-")),a.push("".concat(this.$t("Queuing Time: ")).concat(t.queuingTime," ").concat(this.$t("ms"))),a.push("".concat(this.$t("Run Cost: ")).concat(t.runCostMs," ").concat(this.$t("ms"))),a.push("".concat(this.$t("Task Status: ")).concat(this.$t(t.status))),a.push(""),a.push("===== ".concat(this.$t("Print Log")," =====")),t.printLogsTEXT?a.push(t.printLogsTEXT):a.push(this.$t("No Print Log")),t.tracebackTEXT&&(a.push(""),a.push("===== ".concat(this.$t("Traceback")," =====")),a.push(t.tracebackTEXT)),t.nonCriticalErrorsTEXT&&(a.push(""),a.push("===== ".concat(this.$t("Non-critical Errors")," =====")),a.push(t.nonCriticalErrorsTEXT));var i=a.join("\n"),o=this.M(t.createTime).format("YYYYMMDD_HHmmss"),s="task-record.".concat(e,"-").concat(n,".log.").concat(o);this.$refs.longTextDialog.update(i,s)},getNonCriticalErrorSumary:function(t){if(!t.nonCriticalErrorsTEXT)return"";var e=[];return t.nonCriticalErrorsTEXT.indexOf("[Guance Data Upload Errors]")>=0&&e.push(this.$t("Guance Data Upload Failed")),e.join(this.$t(","))}},computed:{isRoot:function(){return"task-record-func-list"===this.$route.name}},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch,rootTaskId:e.rootTaskId},hasTaskType:!1}}},l=u,d=(n("bd3b"),n("2877")),f=n("2819"),p=n("7f76"),T=n("ab059"),h=n("8abb"),_=Object(d["a"])(l,a,i,!1,null,"5d06755c",null);"function"===typeof f["default"]&&Object(f["default"])(_),"function"===typeof p["default"]&&Object(p["default"])(_),"function"===typeof T["default"]&&Object(T["default"])(_),"function"===typeof h["default"]&&Object(h["default"])(_);e["default"]=_.exports},"277c":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"direct":"Directly Call","integration":"Integration Call","authLink":"Auth Link","crontabConfig":"Crontab","batch":"Batch","connector":"Connector","Func ID: ":"Func ID   : ","Func Title: ":"Func Title: ","Blueprint ID: ":"Blueprint ID   : ","Blueprint Title: ":"Blueprint Title: ","Queue: ":"Queue       : ","Trigger Time: ":"Trigger Time: ","Start Time: ":"Start Time  : ","End Time: ":"End Time    : ","Delay Time: ":"Delay Time  : ","Queuing Time: ":"Queuing Time: ","Task Timeout: ":"Task Timeout: ","Task Expires: ":"Task Expires: ","Run Cost: ":"Run Cost    : ","Task Type: ":"Task Type   : ","Task Status: ":"Task Status : "}}'),delete t.options._Ctor}},2819:function(t,e,n){"use strict";var a=n("277c"),i=n.n(a);e["default"]=i.a},"2ac1":function(t,e,n){"use strict";var a=function(){var t=this,e=t._self._c;return e("span",[t.T.notNothing(t.duration)?[t.prefix?e("span",[t._v(t._s(t.prefix))]):t._e(),t._v(" "),t.dataMS>3e3?[t.years?e("span",[e("strong",[t._v(t._s(t.years))]),t._v(" "+t._s(t.$t("y"))+"\n      ")]):t._e(),t._v(" "),t.days?e("span",[e("strong",[t._v(t._s(t.days))]),t._v(" "+t._s(t.$t("d"))+"\n      ")]):t._e(),t._v(" "),t.hours?e("span",[e("strong",[t._v(t._s(t.hours))]),t._v(" "+t._s(t.$t("h"))+"\n      ")]):t._e(),t._v(" "),t.minutes?e("span",[e("strong",[t._v(t._s(t.minutes))]),t._v(" "+t._s(t.$t("min"))+"\n      ")]):t._e(),t._v(" "),t.seconds?e("span",[e("strong",[t._v(t._s(t.seconds))]),t._v(" "+t._s(t.$t("s"))+"\n      ")]):t._e()]:e("span",[e("strong",[t._v(t._s(t.dataMS))]),t._v(" "+t._s(t.$t("ms"))+"\n    ")])]:[t._v("-")]],2)},i=[],o=(n("a9e3"),n("8ba4"),n("b680"),{name:"TimeDuration",components:{},watch:{},methods:{},computed:{YEAR_SECONDS:function(){return 31536e3},DAY_SECONDS:function(){return 86400},HOUR_SECONDS:function(){return 3600},MINUTE_SECONDS:function(){return 60},dataS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(this.duration);case"ms":return parseInt(this.duration/1e3)}},dataMS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(1e3*this.duration);case"ms":return parseInt(this.duration)}},years:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.YEAR_SECONDS?0:parseInt(this.dataS/this.YEAR_SECONDS)},days:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.DAY_SECONDS?0:parseInt(this.dataS%this.YEAR_SECONDS/this.DAY_SECONDS)},hours:function(){return this.dataS>31536e3||this.T.isNothing(this.duration)?null:this.dataS<this.HOUR_SECONDS?0:parseInt(this.dataS%this.DAY_SECONDS/this.HOUR_SECONDS)},minutes:function(){return this.dataS>86400||this.T.isNothing(this.duration)?null:this.dataS<this.MINUTE_SECONDS?0:parseInt(this.dataS%this.HOUR_SECONDS/this.MINUTE_SECONDS)},seconds:function(){return this.dataS>3600||this.T.isNothing(this.duration)?null:Number.isInteger(this.dataS)?this.dataS%this.MINUTE_SECONDS:(this.dataMS/1e3%this.MINUTE_SECONDS).toFixed(1)}},props:{duration:Number,prefix:String,unit:{type:String,default:"s"}},data:function(){return{}}}),s=o,r=n("2877"),c=n("b1a3"),u=n("388d"),l=n("19173"),d=Object(r["a"])(s,a,i,!1,null,"48ed0a4a",null);"function"===typeof c["default"]&&Object(c["default"])(d),"function"===typeof u["default"]&&Object(u["default"])(d),"function"===typeof l["default"]&&Object(l["default"])(d);e["a"]=d.exports},"308c":function(t,e,n){"use strict";var a=n("c59f"),i=n.n(a);e["default"]=i.a},"32df":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"min":"分"}}'),delete t.options._Ctor}},"388d":function(t,e,n){"use strict";var a=n("32df"),i=n.n(a);e["default"]=i.a},"4ee9":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"min":"分"}}'),delete t.options._Ctor}},"5e66":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Exec Mode":"执行模式","Trigger Time":"触发时间","Task":"任务","Func ID":"函数 ID","Main Task":"主任务","Sub Task":"子任务","Delay":"延迟","Queuing":"排队","Wait Cost":"等待耗时","Run Cost":"执行耗时","Log Lines":"日志行数","Print Log":"Print 日志","Traceback":"调用堆栈","No Print Log":"无 Print 日志","Non-critical Errors":"非关键错误","Recent Task Record":"近期任务记录","Related Task Record":"相关任务记录","Only main tasks are listed":"在本页面只展示主任务","success":"成功","failure":"失败","timeout":"执行超时","skip":"跳过执行","Main Task Only":"仅主任务","Show Detail":"显示详情","Related Tasks":"相关任务","Task Record cleared":"任务记录已清空","Are you sure you want to clear the Task Record?":"是否确认清空任务记录？","Non-critical errors exist":"存在非关键错误","Guance Data Upload Failed":"观测云数据上报失败","No Recent Task Record":"尚无任何近期任务记录","All recent Task Record will be collected and shown here":"所有近期任务会被记录，并展示在此","Origin":"来源","Origin ID":"来源 ID","direct":"直接调用","integration":"集成调用","authLink":"授权链接","crontabConfig":"自动触发","batch":"批处理","connector":"连接器","Func ID: ":"函数 ID ：","Func Title: ":"函数标题：","Blueprint ID: ":"蓝图 ID ：","Blueprint Title: ":"蓝图标题：","Queue: ":"所属队列：","Trigger Time: ":"触发时间：","Start Time: ":"开始时间：","End Time: ":"结束时间：","Task Timeout: ":"任务超时：","Task Expires: ":"任务过期：","Delay Time: ":"延迟执行：","Queuing Time: ":"排队等待：","Run Cost: ":"执行耗时：","Task Type: ":"任务类型：","Task Status: ":"任务状态：","No Delay":"不延迟"}}'),delete t.options._Ctor}},7094:function(t,e,n){"use strict";var a=n("e254"),i=n.n(a);e["default"]=i.a},"7b0b4":function(t,e,n){"use strict";var a=n("0797"),i=n.n(a);e["default"]=i.a},"7c5d":function(t,e,n){},"7f76":function(t,e,n){"use strict";var a=n("5e66"),i=n.n(a);e["default"]=i.a},"8ab2":function(t,e,n){},"8abb":function(t,e,n){"use strict";var a=n("1cbb"),i=n.n(a);e["default"]=i.a},"8ba4":function(t,e,n){var a=n("23e7"),i=n("eac5");a({target:"Number",stat:!0},{isInteger:i})},a387:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"min":"分"}}'),delete t.options._Ctor}},ab059:function(t,e,n){"use strict";var a=n("17b4"),i=n.n(a);e["default"]=i.a},b1a3:function(t,e,n){"use strict";var a=n("4ee9"),i=n.n(a);e["default"]=i.a},b76c:function(t,e,n){"use strict";var a=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n    "),e("span",{staticClass:"text-info press-esc-to-close-tip"},[t._v(t._s(t.$t("Press ESC to close")))])]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as a text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},i=[],o=(n("130f"),n("21a6")),s=n.n(o),r={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var n=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){if(!n.codeMirror){var t={mode:n.mode||"text"};n.codeMirror=n.T.initCodeMirror("longTextDialogContent",t),n.codeMirror.setOption("theme",n.T.getCodeMirrorThemeName()),n.T.setCodeMirrorReadOnly(n.codeMirror,!0)}n.codeMirror.setValue(n.content||""),n.codeMirror.refresh(),n.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;s.a.saveAs(t,e)}},computed:{},props:{title:String,mode:String,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=r,u=(n("1b85"),n("f7d2"),n("2877")),l=n("7b0b4"),d=n("7094"),f=n("308c"),p=Object(u["a"])(c,a,i,!1,null,"fc951d86",null);"function"===typeof l["default"]&&Object(l["default"])(p),"function"===typeof d["default"]&&Object(d["default"])(p),"function"===typeof f["default"]&&Object(f["default"])(p);e["a"]=p.exports},bd3b:function(t,e,n){"use strict";n("8ab2")},c3b8:function(t,e,n){},c59f:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Download as a text file":"作為文字檔案下載"}}'),delete t.options._Ctor}},e254:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Download as a text file":"作為文本文件下載"}}'),delete t.options._Ctor}},eac5:function(t,e,n){var a=n("861d"),i=Math.floor;t.exports=Number.isInteger||function(t){return!a(t)&&isFinite(t)&&i(t)===t}},f7d2:function(t,e,n){"use strict";n("c3b8")}}]);