(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-15d31022"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"0bfb":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Overview":"总览","Biz Entity":"业务实体","Worker Queue Info":"队列信息","Queue":"队列","overviewCountUnit":"个","workerCount":"工作单元 {n} 个","taskCount":"请求排队 {n} 个","Script overview":"脚本总览","scriptOverviewCount":"{n} 个","Code size":"代码大小","Publish ver.":"发布版本","Publish time":"发布时间","Never published":"从未发布","Recent operations":"最近操作记录","recentOperationCount":"最近 {n} 条","Client":"客户端","Client ID":"客户端ID","IP Address":"IP地址","Operation":"操作","Data ID":"数据ID","MODIFY":"修改操作","DELETE":"删除操作","Cost":"耗时","ms":"毫秒","Show detail":"显示请求详情","The full content is as follows":"完整内容如下","Request":"请求","Response":"响应","Pressure":"压力"}}'),delete t.options._Ctor}},1578:function(t,e,o){"use strict";var n=o("da56"),r=o.n(n);e["default"]=r.a},"21a6":function(t,e,o){(function(o){var n,r,s;(function(o,a){r=[],n=a,s="function"===typeof n?n.apply(e,r):n,void 0===s||(t.exports=s)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function n(t,e,o){var n=new XMLHttpRequest;n.open("GET",t),n.responseType="blob",n.onload=function(){c(n.response,e,o)},n.onerror=function(){console.error("could not download file")},n.send()}function r(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function s(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(n){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var a="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof o&&o.global===o?o:void 0,i=a.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=a.saveAs||("object"!=typeof window||window!==a?function(){}:"download"in HTMLAnchorElement.prototype&&!i?function(t,e,o){var i=a.URL||a.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin===location.origin?s(c):r(c.href)?n(t,e,o):s(c,c.target="_blank")):(c.href=i.createObjectURL(t),setTimeout((function(){i.revokeObjectURL(c.href)}),4e4),setTimeout((function(){s(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,o,a){if(o=o||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,a),o);else if(r(t))n(t,o,a);else{var i=document.createElement("a");i.href=t,i.target="_blank",setTimeout((function(){s(i)}))}}:function(t,e,o,r){if(r=r||open("","_blank"),r&&(r.document.title=r.document.body.innerText="downloading..."),"string"==typeof t)return n(t,e,o);var s="application/octet-stream"===t.type,c=/constructor/i.test(a.HTMLElement)||a.safari,u=/CriOS\/[\d]+/.test(navigator.userAgent);if((u||s&&c||i)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var t=l.result;t=u?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),r?r.location.href=t:location=t,r=null},l.readAsDataURL(t)}else{var d=a.URL||a.webkitURL,f=d.createObjectURL(t);r?r.location=f:location.href=f,r=null,setTimeout((function(){d.revokeObjectURL(f)}),4e4)}});a.saveAs=c.saveAs=c,t.exports=c}))}).call(this,o("c8ba"))},"4d09":function(t,e,o){"use strict";var n=o("0bfb"),r=o.n(n);e["default"]=r.a},"4fd7":function(t,e,o){"use strict";o("9ea3")},"62b6":function(t,e,o){"use strict";o("cc980")},"686d":function(t,e,o){"use strict";o("f623")},"7b0b4":function(t,e,o){"use strict";var n=o("0797"),r=o.n(n);e["default"]=r.a},8157:function(t,e,o){"use strict";o.r(e);o("b0c0"),o("a15b"),o("8a79");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.$t("Overview")))])]),t._v(" "),e("el-main",[e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Biz Entity")))])]),t._v(" "),t._l(t.bizEntityCount,(function(o){return e("el-card",{key:o.name,staticClass:"overview-card",attrs:{shadow:"hover"}},[t.C.OVERVIEW_ENTITY_MAP.get(o.name).icon?e("i",{staticClass:"fa fa-fw overview-icon",class:t.C.OVERVIEW_ENTITY_MAP.get(o.name).icon}):t.C.OVERVIEW_ENTITY_MAP.get(o.name).tagText?e("i",{staticClass:"overview-icon overview-icon-text",attrs:{type:"info"}},[e("code",[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(o.name).tagText))])]):t._e(),t._v(" "),e("span",{staticClass:"overview-name"},[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(o.name).name))]),t._v(" "),e("span",{staticClass:"overview-count",style:{"font-size":t.overviewCountFontSize(o.count)+"px"}},[t._v("\n          "+t._s(o.count)+"\n          "),e("span",{staticClass:"overview-count-unit"},[t._v(t._s(t.$t("overviewCountUnit")))])])])})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Worker Queue Info")))])]),t._v(" "),t._l(t.workerQueueInfo,(function(o,n){return e("el-card",{key:n,staticClass:"worker-queue-card",class:{"worker-queue-highlight":o.taskCount>0},attrs:{shadow:"hover"}},[e("el-progress",{attrs:{type:"dashboard",width:"100",percentage:t.workerQueuePressurePercentage(o.pressure,o.maxPressure),format:t.workerQueuePressureFormat,color:t.WORKER_QUEUE_PRESSURE_COLORS}}),t._v(" "),e("span",{staticClass:"worker-queue-info"},[e("span",{staticClass:"worker-queue-number"},[t._v("#"+t._s(n))]),t._v(" "+t._s(t.$t("Queue"))+"\n          "),e("br"),t._v(t._s(t.$tc("workerCount",o.workerCount||0))+"\n          "),e("br"),t._v(t._s(t.$tc("taskCount",t.T.numberLimit(o.taskCount,999)))+"\n        ")])],1)})),t._v(" "),e("el-divider",{staticClass:"overview-divider",attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Script overview"))+" "+t._s(t.$tc("scriptOverviewCount",t.scriptOverview.length)))])]),t._v(" "),e("el-table",{attrs:{data:t.scriptOverview,stripe:""}},[e("el-table-column",{attrs:{label:t.$t("Script Set"),sortable:""},scopedSlots:t._u([{key:"default",fn:function(o){return[e("span",[t._v(t._s(o.row.scriptSetTitle||o.row.scriptSetId))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Script"),sortable:"","sort-by":["title","id"]},scopedSlots:t._u([{key:"default",fn:function(o){return[e("span",[t._v(t._s(o.row.title||o.row.id))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Func"),sortable:"","sort-by":"funcCount",align:"right",width:"120"},scopedSlots:t._u([{key:"default",fn:function(o){return[o.row.funcCount?e("code",[t._v(t._s(o.row.funcCount))]):e("code",[t._v("-")])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Code size"),sortable:"","sort-by":"codeSize",align:"right",width:"120"},scopedSlots:t._u([{key:"default",fn:function(o){return[o.row.codeSize?e("code",[t._v(t._s(o.row.codeSizeHuman))]):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Publish ver."),sortable:"","sort-by":"publishVersion",align:"right",width:"150"},scopedSlots:t._u([{key:"default",fn:function(o){return[o.row.publishVersion?e("code",[t._v("v"+t._s("".concat(o.row.publishVersion)))]):e("code",[t._v("-")])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Publish time"),sortable:"","sort-by":"latestPublishTimestamp",align:"right",width:"200"},scopedSlots:t._u([{key:"default",fn:function(o){return[o.row.latestPublishTime?[e("span",[t._v(t._s(t._f("datetime")(o.row.latestPublishTime)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(o.row.latestPublishTime)))])]:t._e()]}}])})],1),t._v(" "),e("el-divider",{staticClass:"overview-divider",attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Recent operations"))+" "+t._s(t.$tc("recentOperationCount",t.latestOperations.length)))])]),t._v(" "),e("el-table",{attrs:{data:t.latestOperations,stripe:""}},[e("el-table-column",{attrs:{label:t.$t("Time"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("span",[t._v(t._s(t._f("datetime")(o.row.createTime)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(o.row.createTime)))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("User"),width:"350"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("strong",[t._v(t._s(o.row.u_name||t.$t("Anonymity")))]),t._v(" "),o.row.userId?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("User ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.userId))]),t._v(" "),e("CopyButton",{attrs:{content:o.row.userId}})]:t._e(),t._v(" "),t.T.notNothing(o.row.clientIPsJSON)?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("IP Address")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.clientIPsJSON.join(", ")))]),t._v(" "),e("CopyButton",{attrs:{content:o.row.clientIPsJSON.join(", ")}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Operation")},scopedSlots:t._u([{key:"default",fn:function(o){return[o.row.respStatusCode>=200&&o.row.respStatusCode<400?e("span",{staticClass:"text-good"},[e("i",{staticClass:"fa fa-fw fa-check"})]):e("span",{staticClass:"text-bad"},[e("i",{staticClass:"fa fa-fw fa-times"})]),t._v(" "),e("span",[t._v(t._s(o.row.reqRouteName))]),t._v(" "),t.T.endsWith(o.row.reqRoute,"/do/modify")?e("strong",{staticClass:"text-watch"},[t._v("\n              （"+t._s(t.$t("MODIFY"))+"）\n            ")]):t._e(),t._v(" "),t.T.endsWith(o.row.reqRoute,"/do/delete")?e("strong",{staticClass:"text-bad"},[t._v("\n              （"+t._s(t.$t("DELETE"))+"）\n            ")]):t._e(),t._v(" "),o.row._operationEntityId?[e("br"),t._v(" "),e("i",{staticClass:"fa fa-fw"}),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Data ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row._operationEntityId))]),t._v(" "),e("CopyButton",{attrs:{content:o.row._operationEntityId}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(o){return[t._v("\n            "+t._s(o.row.reqCost)+" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("ms")))])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"150"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("el-button",{attrs:{type:"text"},on:{click:function(e){return t.showDetail(o.row)}}},[t._v(t._s(t.$t("Show detail")))])]}}])})],1)],2),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{title:t.$t("The full content is as follows"),showDownload:!0}})],1)],1)},r=[],s=o("c7eb"),a=o("1da1"),i=(o("d3b7"),o("159b"),o("14d9"),o("99af"),o("e9c4"),o("b76c")),c={name:"Overview",components:{LongTextDialog:i["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var o=this;return Object(a["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,o.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t,e){var o=this;return Object(a["a"])(Object(s["a"])().mark((function n(){var r,a;return Object(s["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return e=e||{},r=null,o.T.notNothing(t)&&(r={sections:t.join(",")}),n.next=5,o.T.callAPI_get("/api/v1/func/overview",{query:r,alert:{muteError:e.mute}});case 5:if(a=n.sent,a&&a.ok){n.next=8;break}return n.abrupt("return");case 8:a.data.scriptOverview&&a.data.scriptOverview.forEach((function(t){t.latestPublishTimestamp=0,t.latestPublishTime&&(t.latestPublishTimestamp=new Date(t.latestPublishTime).getTime())})),(t||o.OVERVIEW_SECTIONS).forEach((function(t){o[t]=a.data[t]})),o.scriptOverview.forEach((function(t){t.codeSize&&(t.codeSizeHuman=o.T.byteSizeHuman(t.codeSize))})),o.$store.commit("updateLoadStatus",!0);case 12:case"end":return n.stop()}}),n)})))()},showDetail:function(t){this.$store.commit("updateHighlightedTableDataId",t.id);var e=[];e.push("===== ".concat(this.$t("Request")," =====")),e.push("".concat(t.reqMethod.toUpperCase()," ").concat(this.T.formatURL(t.reqRoute,{params:t.reqParamsJSON,query:t.reqQueryJSON}))),t.reqBodyJSON&&e.push(JSON.stringify(t.reqBodyJSON,null,2)),e.push("\n===== ".concat(this.$t("Response")," =====")),e.push("Status Code: ".concat(t.respStatusCode)),t.respBodyJSON&&e.push(JSON.stringify(t.respBodyJSON,null,2));var o=e.join("\n"),n=this.M(t.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),r="http-dump.".concat(n);this.$refs.longTextDialog.update(o,r)},overviewCountFontSize:function(t){var e=(""+t).length,o=parseInt(280/e*1.2);return Math.min(80,o)},workerQueuePressurePercentage:function(t,e){var o=100*t/(2*e);return o<0?o=0:o>100&&(o=100),o},workerQueuePressureFormat:function(t){return"".concat(this.$t("Pressure")).concat(this.$t(":")," ").concat(parseInt(2*t))}},computed:{OVERVIEW_SECTIONS:function(){return["bizEntityCount","workerQueueInfo","scriptOverview","latestOperations"]},WORKER_QUEUE_PRESSURE_COLORS:function(){return[{color:"#00aa00",percentage:50},{color:"#ff6600",percentage:80},{color:"#ff0000",percentage:100}]}},props:{},data:function(){return{bizEntityCount:[],workerQueueInfo:[],scriptOverview:[],latestOperations:[],autoRefreshTimer:null}},mounted:function(){var t=this;this.autoRefreshTimer=setInterval((function(){t.loadData(["workerQueueInfo"],{mute:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}},u=c,l=(o("4fd7"),o("2877")),d=o("1578"),f=o("4d09"),v=Object(l["a"])(u,n,r,!1,null,"09bb83a6",null);"function"===typeof d["default"]&&Object(d["default"])(v),"function"===typeof f["default"]&&Object(f["default"])(v);e["default"]=v.exports},"8a79":function(t,e,o){"use strict";var n=o("23e7"),r=o("e330"),s=o("06cf").f,a=o("50c4"),i=o("577e"),c=o("5a34"),u=o("1d80"),l=o("ab13"),d=o("c430"),f=r("".endsWith),v=r("".slice),p=Math.min,_=l("endsWith"),w=!d&&!_&&!!function(){var t=s(String.prototype,"endsWith");return t&&!t.writable}();n({target:"String",proto:!0,forced:!w&&!_},{endsWith:function(t){var e=i(u(this));c(t);var o=arguments.length>1?arguments[1]:void 0,n=e.length,r=void 0===o?n:p(a(o),n),s=i(t);return f?f(e,s,r):v(e,r-s.length,r)===s}})},"9ea3":function(t,e,o){},b76c:function(t,e,o){"use strict";var n=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n  ")]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},r=[],s=(o("130f"),o("21a6")),a=o.n(s),i={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var o=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){o.codeMirror||(o.codeMirror=o.T.initCodeMirror("longTextDialogContent",o.mode||"text"),o.codeMirror.setOption("theme",o.T.getCodeMirrorThemeName()),o.T.setCodeMirrorReadOnly(o.codeMirror,!0)),o.codeMirror.setValue(o.content||""),o.codeMirror.refresh(),o.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;a.a.saveAs(t,e)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=i,u=(o("686d"),o("62b6"),o("2877")),l=o("7b0b4"),d=Object(u["a"])(c,n,r,!1,null,"fedad6e2",null);"function"===typeof l["default"]&&Object(l["default"])(d);e["a"]=d.exports},cc980:function(t,e,o){},da56:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"overviewCountUnit":"","workerCount":"NO worker | {n} worker | {n} workers","taskCount":"NO task | {n} task | {n} tasks","scriptOverviewCount":"(NO script) | ({n} script) | ({n} scripts)","recentOperationCount":"(latest {n} operation) | (latest {n} operations)"}}'),delete t.options._Ctor}},f623:function(t,e,o){}}]);