(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-09c6d19a"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as a text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"0b22":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Biz Entity":"業務實體","Client":"客戶端","Client ID":"客戶端 ID","Cost":"耗時","Current browser-server time difference:":"當前瀏覽器與伺服器時差：","DELETE":"刪除操作","Data ID":"資料 ID","IP Address":"IP地址","Jam":"擁堵","MODIFY":"修改操作","Operation":"操作","Overview":"總覽","Recent operations":"最近操作記錄","Request":"請求","Response":"響應","Worker Queue Info":"佇列資訊","overviewCountUnit":"個","processCount":"工作程序 {n} 個","recentOperationCount":"最近 {n} 條","taskCount":"任務 {n} 個","workerCount":"工作單元 {n} 個"}}'),delete t.options._Ctor}},"0bfb":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Current browser-server time difference:":"当前浏览器与服务器时差：","overviewCountUnit":"个","workerCount":"工作单元 {n} 个","processCount":"工作进程 {n} 个","taskCount":"任务 {n} 个","recentOperationCount":"最近 {n} 条","Overview":"总览","Biz Entity":"业务实体","Worker Queue Info":"队列信息","Recent operations":"最近操作记录","Client":"客户端","Client ID":"客户端 ID","IP Address":"IP地址","Operation":"操作","Data ID":"数据 ID","MODIFY":"修改操作","DELETE":"删除操作","Cost":"耗时","Request":"请求","Response":"响应","Jam":"拥堵"}}'),delete t.options._Ctor}},1578:function(t,e,n){"use strict";var o=n("da56"),s=n.n(o);e["default"]=s.a},19173:function(t,e,n){"use strict";var o=n("a387"),s=n.n(o);e["default"]=s.a},"1b85":function(t,e,n){"use strict";n("7c5d")},"21a6":function(t,e,n){(function(n){var o,s,i;(function(n,a){s=[],o=a,i="function"===typeof o?o.apply(e,s):o,void 0===i||(t.exports=i)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function o(t,e,n){var o=new XMLHttpRequest;o.open("GET",t),o.responseType="blob",o.onload=function(){u(o.response,e,n)},o.onerror=function(){console.error("could not download file")},o.send()}function s(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function i(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(o){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var a="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof n&&n.global===n?n:void 0,r=a.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),u=a.saveAs||("object"!=typeof window||window!==a?function(){}:"download"in HTMLAnchorElement.prototype&&!r?function(t,e,n){var r=a.URL||a.webkitURL,u=document.createElement("a");e=e||t.name||"download",u.download=e,u.rel="noopener","string"==typeof t?(u.href=t,u.origin===location.origin?i(u):s(u.href)?o(t,e,n):i(u,u.target="_blank")):(u.href=r.createObjectURL(t),setTimeout((function(){r.revokeObjectURL(u.href)}),4e4),setTimeout((function(){i(u)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,n,a){if(n=n||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,a),n);else if(s(t))o(t,n,a);else{var r=document.createElement("a");r.href=t,r.target="_blank",setTimeout((function(){i(r)}))}}:function(t,e,n,s){if(s=s||open("","_blank"),s&&(s.document.title=s.document.body.innerText="downloading..."),"string"==typeof t)return o(t,e,n);var i="application/octet-stream"===t.type,u=/constructor/i.test(a.HTMLElement)||a.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||i&&u||r)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var t=l.result;t=c?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),s?s.location.href=t:location=t,s=null},l.readAsDataURL(t)}else{var f=a.URL||a.webkitURL,d=f.createObjectURL(t);s?s.location=d:location.href=d,s=null,setTimeout((function(){f.revokeObjectURL(d)}),4e4)}});a.saveAs=u.saveAs=u,t.exports=u}))}).call(this,n("c8ba"))},"2a71":function(t,e,n){},"2ac1":function(t,e,n){"use strict";var o=function(){var t=this,e=t._self._c;return e("span",[t.T.notNothing(t.duration)?[t.prefix?e("span",[t._v(t._s(t.prefix))]):t._e(),t._v(" "),t.dataMS>3e3?[t.years?e("span",[e("strong",[t._v(t._s(t.years))]),t._v(" "+t._s(t.$t("y"))+"\n      ")]):t._e(),t._v(" "),t.days?e("span",[e("strong",[t._v(t._s(t.days))]),t._v(" "+t._s(t.$t("d"))+"\n      ")]):t._e(),t._v(" "),t.hours?e("span",[e("strong",[t._v(t._s(t.hours))]),t._v(" "+t._s(t.$t("h"))+"\n      ")]):t._e(),t._v(" "),t.minutes?e("span",[e("strong",[t._v(t._s(t.minutes))]),t._v(" "+t._s(t.$t("min"))+"\n      ")]):t._e(),t._v(" "),t.seconds?e("span",[e("strong",[t._v(t._s(t.seconds))]),t._v(" "+t._s(t.$t("s"))+"\n      ")]):t._e()]:e("span",[e("strong",[t._v(t._s(t.dataMS))]),t._v(" "+t._s(t.$t("ms"))+"\n    ")])]:[t._v("-")]],2)},s=[],i=(n("a9e3"),n("8ba4"),n("b680"),{name:"TimeDuration",components:{},watch:{},methods:{},computed:{YEAR_SECONDS:function(){return 31536e3},DAY_SECONDS:function(){return 86400},HOUR_SECONDS:function(){return 3600},MINUTE_SECONDS:function(){return 60},dataS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(this.duration);case"ms":return parseInt(this.duration/1e3)}},dataMS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(1e3*this.duration);case"ms":return parseInt(this.duration)}},years:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.YEAR_SECONDS?0:parseInt(this.dataS/this.YEAR_SECONDS)},days:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.DAY_SECONDS?0:parseInt(this.dataS%this.YEAR_SECONDS/this.DAY_SECONDS)},hours:function(){return this.dataS>31536e3||this.T.isNothing(this.duration)?null:this.dataS<this.HOUR_SECONDS?0:parseInt(this.dataS%this.DAY_SECONDS/this.HOUR_SECONDS)},minutes:function(){return this.dataS>86400||this.T.isNothing(this.duration)?null:this.dataS<this.MINUTE_SECONDS?0:parseInt(this.dataS%this.HOUR_SECONDS/this.MINUTE_SECONDS)},seconds:function(){return this.dataS>3600||this.T.isNothing(this.duration)?null:Number.isInteger(this.dataS)?this.dataS%this.MINUTE_SECONDS:(this.dataMS/1e3%this.MINUTE_SECONDS).toFixed(1)}},props:{duration:Number,prefix:String,unit:{type:String,default:"s"}},data:function(){return{}}}),a=i,r=n("2877"),u=n("b1a3"),c=n("388d"),l=n("19173"),f=Object(r["a"])(a,o,s,!1,null,"48ed0a4a",null);"function"===typeof u["default"]&&Object(u["default"])(f),"function"===typeof c["default"]&&Object(c["default"])(f),"function"===typeof l["default"]&&Object(l["default"])(f);e["a"]=f.exports},"2dee":function(t,e,n){"use strict";var o=n("0b22"),s=n.n(o);e["default"]=s.a},"308c":function(t,e,n){"use strict";var o=n("c59f"),s=n.n(o);e["default"]=s.a},"32df":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"min":"分"}}'),delete t.options._Ctor}},"388d":function(t,e,n){"use strict";var o=n("32df"),s=n.n(o);e["default"]=s.a},"3b90":function(t,e,n){},"4d09":function(t,e,n){"use strict";var o=n("0bfb"),s=n.n(o);e["default"]=s.a},"4ee9":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"min":"分"}}'),delete t.options._Ctor}},5139:function(t,e,n){"use strict";n("3b90")},"6b0f":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Biz Entity":"業務實體","Client":"客户端","Client ID":"客户端 ID","Cost":"耗時","Current browser-server time difference:":"當前瀏覽器與服務器時差：","DELETE":"刪除操作","Data ID":"數據 ID","IP Address":"IP地址","Jam":"擁堵","MODIFY":"修改操作","Operation":"操作","Overview":"總覽","Recent operations":"最近操作記錄","Request":"請求","Response":"響應","Worker Queue Info":"隊列信息","overviewCountUnit":"個","processCount":"工作進程 {n} 個","recentOperationCount":"最近 {n} 條","taskCount":"任務 {n} 個","workerCount":"工作單元 {n} 個"}}'),delete t.options._Ctor}},7094:function(t,e,n){"use strict";var o=n("e254"),s=n.n(o);e["default"]=s.a},"7b0b4":function(t,e,n){"use strict";var o=n("0797"),s=n.n(o);e["default"]=s.a},"7c5d":function(t,e,n){},8157:function(t,e,n){"use strict";n.r(e);n("a15b"),n("b0c0"),n("8a79");var o=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.$t("Overview")))])]),t._v(" "),e("el-main",[e("span",{staticClass:"browser-server-time-diff",class:t.browserServerTimeDiff>1e3?"text-bad":"text-info"},[e("i",{staticClass:"fa fa-fw",class:t.browserServerTimeDiff>1e3?"fa-exclamation-triangle":"fa-exchange"}),t._v("\n        "+t._s(t.$t("Current browser-server time difference:"))+"\n        "),e("TimeDuration",{attrs:{duration:t.browserServerTimeDiff,unit:"ms"}})],1),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Worker Queue Info")))])]),t._v(" "),t._l(t.workerQueueInfo,(function(n,o){return e("el-card",{key:o,staticClass:"worker-queue-card",class:{"worker-queue-highlight":n.taskCount>0},attrs:{shadow:"hover"}},[e("div",{staticClass:"worker-queue-info"},[e("span",{staticClass:"worker-queue-number"},[t._v("#"+t._s(o))]),t._v(" "),e("br"),e("span",{class:{"text-bad":n.workerCount<=0}},[t._v(t._s(t.$tc("workerCount",n.workerCount)))]),t._v(" "),e("br"),e("span",{class:{"text-bad":n.processCount<=0}},[t._v(t._s(t.$tc("processCount",n.processCount)))]),t._v(" "),e("br"),e("span",{class:{"text-main":n.taskCount>0}},[t._v(t._s(t.$tc("taskCount",n.taskCount)))])]),t._v(" "),e("el-progress",{attrs:{type:"circle",width:"110",percentage:t.workerQueueLoadPercentage(n.taskCount,n.processCount),format:t.workerQueueLoadFormat,color:t.WORKER_QUEUE_TASK_COUNT_COLORS}})],1)})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Biz Entity")))])]),t._v(" "),t._l(t.bizEntityCount,(function(n){return e("el-card",{key:n.name,staticClass:"overview-card",attrs:{shadow:"hover"}},[t.C.OVERVIEW_ENTITY_MAP.get(n.name).icon?e("i",{staticClass:"fa fa-fw overview-icon",class:t.C.OVERVIEW_ENTITY_MAP.get(n.name).icon}):t.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText?e("i",{staticClass:"overview-icon overview-icon-text",attrs:{type:"info"}},[e("code",[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText))])]):t._e(),t._v(" "),e("span",{staticClass:"overview-name"},[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(n.name).name))]),t._v(" "),n.countEnabled?[e("span",{staticClass:"overview-count"},[e("el-tooltip",{attrs:{effect:"dark",content:t.$t("Enabled"),placement:"left"}},[e("span",{staticClass:"text-good"},[t._v("\n                "+t._s(n.countEnabled)+"\n              ")])]),t._v(" "),e("span",{staticClass:"overview-count-unit"},[t._v(t._s(t.$t("overviewCountUnit")))])],1),t._v(" "),e("span",{staticClass:"overview-count-sub"},[t._v("\n            "+t._s(t.$t("Total"))+t._s(t.$t(":"))+"\n            "+t._s(n.count)+"\n          ")])]:[e("span",{staticClass:"overview-count"},[t._v("\n            "+t._s(n.count)+"\n            "),e("span",{staticClass:"overview-count-unit"},[t._v(t._s(t.$t("overviewCountUnit")))])])]],2)})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v("\n          "+t._s(t.$t("Recent operations"))+"\n          "),e("small",[t._v(t._s(t.$t("("))+t._s(t.$tc("recentOperationCount",t.latestOperations.length))+t._s(t.$t(")")))])])]),t._v(" "),e("el-table",{attrs:{data:t.latestOperations}},[e("el-table-column",{attrs:{label:t.$t("Time"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("span",[t._v(t._s(t._f("datetime")(n.row.createTime)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(n.row.createTime)))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("User"),width:"350"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("strong",[t._v(t._s(n.row.u_name||t.$t("Anonymity")))]),t._v(" "),n.row.userId?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("User ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row.userId))]),t._v(" "),e("CopyButton",{attrs:{content:n.row.userId}})]:t._e(),t._v(" "),t.T.notNothing(n.row.clientIPsJSON)?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("IP Address")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row.clientIPsJSON.join(", ")))]),t._v(" "),e("CopyButton",{attrs:{content:n.row.clientIPsJSON.join(", ")}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Operation")},scopedSlots:t._u([{key:"default",fn:function(n){return[n.row.respStatusCode>=200&&n.row.respStatusCode<400?e("span",{staticClass:"text-good"},[e("i",{staticClass:"fa fa-fw fa-check"})]):e("span",{staticClass:"text-bad"},[e("i",{staticClass:"fa fa-fw fa-times"})]),t._v(" "),e("span",[t._v(t._s(t.$t(n.row.reqRouteName)))]),t._v(" "),t.T.endsWith(n.row.reqRoute,"/do/modify")?e("strong",{staticClass:"text-watch"},[t._v("\n              （"+t._s(t.$t("MODIFY"))+"）\n            ")]):t._e(),t._v(" "),t.T.endsWith(n.row.reqRoute,"/do/delete")?e("strong",{staticClass:"text-bad"},[t._v("\n              （"+t._s(t.$t("DELETE"))+"）\n            ")]):t._e(),t._v(" "),n.row._operationEntityId?[e("br"),t._v(" "),e("i",{staticClass:"fa fa-fw"}),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Data ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row._operationEntityId))]),t._v(" "),e("CopyButton",{attrs:{content:n.row._operationEntityId}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(t){return[e("TimeDuration",{attrs:{duration:t.row.reqCost,unit:"ms"}})]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"150"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("el-link",{attrs:{type:"primary"},on:{click:function(e){return t.showDetail(n.row)}}},[t._v(t._s(t.$t("Show detail")))])]}}])})],1)],2),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{showDownload:!0}})],1)],1)},s=[],i=n("c7eb"),a=n("1da1"),r=(n("99af"),n("14d9"),n("e9c4"),n("d3b7"),n("159b"),n("2ac1")),u=n("b76c"),c={name:"Overview",components:{TimeDuration:r["a"],LongTextDialog:u["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var n=this;return Object(a["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,n.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t,e){var n=this;return Object(a["a"])(Object(i["a"])().mark((function o(){var s,a;return Object(i["a"])().wrap((function(o){while(1)switch(o.prev=o.next){case 0:return e=e||{},s=null,n.T.notNothing(t)&&(s={sections:t.join(",")}),o.next=5,n.T.callAPI_get("/api/v1/func/overview",{query:s,alert:{muteError:e.mute}});case 5:if(a=o.sent,a&&a.ok){o.next=8;break}return o.abrupt("return");case 8:n.browserServerTimeDiff=new Date(a.reqTime)-new Date(a.clientTime),(t||n.OVERVIEW_SECTIONS).forEach((function(t){n[t]=a.data[t],"latestOperations"===t&&n[t].forEach((function(t){t.reqRouteName=t.reqRouteNames[n.$store.getters.uiLocale]||t.reqRouteNames.default}))})),n.$store.commit("updateLoadStatus",!0);case 11:case"end":return o.stop()}}),o)})))()},showDetail:function(t){var e=this;this.$store.commit("updateHighlightedTableDataId",t.id);var n=[];n.push("===== ".concat(this.$t("Request")," =====")),n.push("".concat(t.reqMethod.toUpperCase()," ").concat(this.T.formatURL(t.reqRoute,{params:t.reqParamsJSON,query:t.reqQueryJSON}))),t.reqBodyJSON&&n.push(JSON.stringify(t.reqBodyJSON,null,2)),t.reqFileInfoJSON&&(n.push("\n===== ".concat(this.$t("Upload")," =====")),t.reqFileInfoJSON.forEach((function(t){n.push("".concat(t.name," <").concat(e.T.byteSizeHuman(t.size),">"))}))),n.push("\n===== ".concat(this.$t("Response")," =====")),n.push("Status Code: ".concat(t.respStatusCode)),t.respBodyJSON&&n.push(JSON.stringify(t.respBodyJSON,null,2));var o=n.join("\n"),s=this.M(t.createTime).format("YYYYMMDD_HHmmss"),i="http-dump.".concat(s);this.$refs.longTextDialog.update(o,i)},overviewCountFontSize:function(t,e){var n=(""+t).length,o=parseInt(80-10*n*(e||1));return Math.max(50,o)},workerQueueLoadPercentage:function(t,e){var n=100*e;if(n<=0&&t>0)return 100;if(0===t)return 0;var o=100*t/n;return o<0?o=0:o>100&&(o=100),o},workerQueueLoadFormat:function(t){return"".concat(this.$t("Jam")).concat(this.$t(":")).concat(parseInt(t),"%")}},computed:{OVERVIEW_SECTIONS:function(){return["workerQueueInfo","bizEntityCount","latestOperations"]},WORKER_QUEUE_TASK_COUNT_COLORS:function(){return[{color:"#00aa00",percentage:50},{color:"#ff6600",percentage:80},{color:"#ff0000",percentage:100}]}},props:{},data:function(){return{browserServerTimeDiff:0,workerQueueInfo:[],bizEntityCount:[],latestOperations:[],autoRefreshTimer:null}},mounted:function(){var t=this;this.autoRefreshTimer=setInterval((function(){t.loadData(["workerQueueInfo"],{mute:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}},l=c,f=(n("5139"),n("8e7e"),n("2877")),d=n("1578"),_=n("4d09"),p=n("99b4"),v=n("2dee"),h=Object(f["a"])(l,o,s,!1,null,"4b8b2e5f",null);"function"===typeof d["default"]&&Object(d["default"])(h),"function"===typeof _["default"]&&Object(_["default"])(h),"function"===typeof p["default"]&&Object(p["default"])(h),"function"===typeof v["default"]&&Object(v["default"])(h);e["default"]=h.exports},"8a79":function(t,e,n){"use strict";var o=n("23e7"),s=n("e330"),i=n("06cf").f,a=n("50c4"),r=n("577e"),u=n("5a34"),c=n("1d80"),l=n("ab13"),f=n("c430"),d=s("".endsWith),_=s("".slice),p=Math.min,v=l("endsWith"),h=!f&&!v&&!!function(){var t=i(String.prototype,"endsWith");return t&&!t.writable}();o({target:"String",proto:!0,forced:!h&&!v},{endsWith:function(t){var e=r(c(this));u(t);var n=arguments.length>1?arguments[1]:void 0,o=e.length,s=void 0===n?o:p(a(n),o),i=r(t);return d?d(e,i,s):_(e,s-i.length,s)===i}})},"8ba4":function(t,e,n){var o=n("23e7"),s=n("eac5");o({target:"Number",stat:!0},{isInteger:s})},"8e7e":function(t,e,n){"use strict";n("2a71")},"99b4":function(t,e,n){"use strict";var o=n("6b0f"),s=n.n(o);e["default"]=s.a},a387:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"min":"分"}}'),delete t.options._Ctor}},b1a3:function(t,e,n){"use strict";var o=n("4ee9"),s=n.n(o);e["default"]=s.a},b76c:function(t,e,n){"use strict";var o=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n    "),e("span",{staticClass:"text-info press-esc-to-close-tip"},[t._v(t._s(t.$t("Press ESC to close")))])]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as a text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},s=[],i=(n("130f"),n("21a6")),a=n.n(i),r={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var n=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){if(!n.codeMirror){var t={mode:n.mode||"text"};n.codeMirror=n.T.initCodeMirror("longTextDialogContent",t),n.codeMirror.setOption("theme",n.T.getCodeMirrorThemeName()),n.T.setCodeMirrorReadOnly(n.codeMirror,!0)}n.codeMirror.setValue(n.content||""),n.codeMirror.refresh(),n.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;a.a.saveAs(t,e)}},computed:{},props:{title:String,mode:String,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},u=r,c=(n("1b85"),n("f7d2"),n("2877")),l=n("7b0b4"),f=n("7094"),d=n("308c"),_=Object(c["a"])(u,o,s,!1,null,"fc951d86",null);"function"===typeof l["default"]&&Object(l["default"])(_),"function"===typeof f["default"]&&Object(f["default"])(_),"function"===typeof d["default"]&&Object(d["default"])(_);e["a"]=_.exports},c3b8:function(t,e,n){},c59f:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Download as a text file":"作為文字檔案下載"}}'),delete t.options._Ctor}},da56:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"overviewCountUnit":" ","workerCount":"NO Worker | {n} Worker | {n} Workers","processCount":"NO Process | {n} Process | {n} Processes","taskCount":"NO Task | {n} Task | {n} Tasks","recentOperationCount":"(Latest {n} Operation) | (Latest {n} Operations)"}}'),delete t.options._Ctor}},e254:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Download as a text file":"作為文本文件下載"}}'),delete t.options._Ctor}},eac5:function(t,e,n){var o=n("861d"),s=Math.floor;t.exports=Number.isInteger||function(t){return!o(t)&&isFinite(t)&&s(t)===t}},f7d2:function(t,e,n){"use strict";n("c3b8")}}]);