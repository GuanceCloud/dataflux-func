(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-25123fb9"],{"0797":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Download as a text file":"作为文本文件下载"}}'),delete e.options._Ctor}},"0b22":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Biz Entities":"業務實體","Biz Metrics":"業務指標","Collapse And Categorize":"摺疊並歸類","Cron Job":"定時任務","Current browser-server time difference:":"當前瀏覽器與伺服器時差：","Delayed":"延遲執行","Exclude Disabled Items":"不包括已禁用的項","Expand All":"展開所有服務","Hostname":"主機名","Load":"負載","Overview":"總覽","Process":"工作程序","Process ID":"程序 ID","Queue Limit":"佇列限制","Queues":"佇列","Services":"服務","Triggers Per Day":"每天觸發次數","Triggers Per Hour":"每小時觸發次數","Triggers Per Minute":"每分鐘觸發次數","Triggers Per Second":"每秒觸發次數","Up Time":"已執行","Up Time AVG":"平均已執行","Up Time MAX":"最長已執行","Up Time MIN":"最短已執行","When the Work Queue length reaches the limit, Cron Jobs will stop generating new tasks":"當工作佇列長度達到限制時，定時任務將停止產生新任務","Worker":"工作單元","Worker Queue":"工作佇列","generalCount":"{n} 個","recentOperationCount":"最近 {n} 條","taskCount":"{n} 個任務"}}'),delete e.options._Ctor}},"0bfb":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Current browser-server time difference:":"当前浏览器与服务器时差：","generalCount":"{n} 个","taskCount":"{n} 个任务","recentOperationCount":"最近 {n} 条","Expand All":"展开所有服务","Collapse And Categorize":"折叠并归类","Overview":"总览","Services":"服务","Hostname":"主机名","Process ID":"进程 ID","Up Time":"已运行","Up Time AVG":"平均已运行","Up Time MAX":"最长已运行","Up Time MIN":"最短已运行","Queues":"队列","Worker":"工作单元","Process":"工作进程","Delayed":"延迟执行","Worker Queue":"工作队列","Queue Limit":"队列限制","Load":"负载","Biz Metrics":"业务指标","Biz Entities":"业务实体","When the Work Queue length reaches the limit, Cron Jobs will stop generating new tasks":"当工作队列长度达到限制时，定时任务将停止产生新任务","Exclude Disabled Items":"不包括已禁用的项","Cron Job":"定时任务","Triggers Per Second":"每秒触发次数","Triggers Per Minute":"每分钟触发次数","Triggers Per Hour":"每小时触发次数","Triggers Per Day":"每天触发次数"}}'),delete e.options._Ctor}},1578:function(e,t,n){"use strict";var r=n("da56"),s=n.n(r);t["default"]=s.a},19173:function(e,t,n){"use strict";var r=n("a387"),s=n.n(r);t["default"]=s.a},"1b85":function(e,t,n){"use strict";n("7c5d")},"1cd5":function(e,t,n){"use strict";n("24d2")},"21a6":function(e,t,n){(function(n){var r,s,i;(function(n,o){s=[],r=o,i="function"===typeof r?r.apply(t,s):r,void 0===i||(e.exports=i)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function r(e,t,n){var r=new XMLHttpRequest;r.open("GET",e),r.responseType="blob",r.onload=function(){u(r.response,t,n)},r.onerror=function(){console.error("could not download file")},r.send()}function s(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function i(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(r){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var o="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof n&&n.global===n?n:void 0,a=o.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),u=o.saveAs||("object"!=typeof window||window!==o?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(e,t,n){var a=o.URL||o.webkitURL,u=document.createElement("a");t=t||e.name||"download",u.download=t,u.rel="noopener","string"==typeof e?(u.href=e,u.origin===location.origin?i(u):s(u.href)?r(e,t,n):i(u,u.target="_blank")):(u.href=a.createObjectURL(e),setTimeout((function(){a.revokeObjectURL(u.href)}),4e4),setTimeout((function(){i(u)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,n,o){if(n=n||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,o),n);else if(s(e))r(e,n,o);else{var a=document.createElement("a");a.href=e,a.target="_blank",setTimeout((function(){i(a)}))}}:function(e,t,n,s){if(s=s||open("","_blank"),s&&(s.document.title=s.document.body.innerText="downloading..."),"string"==typeof e)return r(e,t,n);var i="application/octet-stream"===e.type,u=/constructor/i.test(o.HTMLElement)||o.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||i&&u||a)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var e=l.result;e=c?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),s?s.location.href=e:location=e,s=null},l.readAsDataURL(e)}else{var d=o.URL||o.webkitURL,_=d.createObjectURL(e);s?s.location=_:location.href=_,s=null,setTimeout((function(){d.revokeObjectURL(_)}),4e4)}});o.saveAs=u.saveAs=u,e.exports=u}))}).call(this,n("c8ba"))},"24d2":function(e,t,n){},"2ac1":function(e,t,n){"use strict";var r=function(){var e=this,t=e._self._c;return t("span",[e.T.notNothing(e.duration)?[e.prefix?t("span",[e._v(e._s(e.prefix))]):e._e(),e._v(" "),e.dataMS>3e3?[e.years?t("span",[t("strong",[e._v(e._s(e.years))]),e._v(" "+e._s(e.$t("y"))+"\n      ")]):e._e(),e._v(" "),e.days?t("span",[t("strong",[e._v(e._s(e.days))]),e._v(" "+e._s(e.$t("d"))+"\n      ")]):e._e(),e._v(" "),e.hours?t("span",[t("strong",[e._v(e._s(e.hours))]),e._v(" "+e._s(e.$t("h"))+"\n      ")]):e._e(),e._v(" "),e.minutes?t("span",[t("strong",[e._v(e._s(e.minutes))]),e._v(" "+e._s(e.$t("min"))+"\n      ")]):e._e(),e._v(" "),e.seconds?t("span",[t("strong",[e._v(e._s(e.seconds))]),e._v(" "+e._s(e.$t("s"))+"\n      ")]):e._e()]:t("span",[t("strong",[e._v(e._s(e.dataMS))]),e._v(" "+e._s(e.$t("ms"))+"\n    ")])]:[e._v("-")]],2)},s=[],i=(n("a9e3"),n("8ba4"),n("b680"),{name:"TimeDuration",components:{},watch:{},methods:{},computed:{YEAR_SECONDS:function(){return 31536e3},DAY_SECONDS:function(){return 86400},HOUR_SECONDS:function(){return 3600},MINUTE_SECONDS:function(){return 60},dataS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(this.duration);case"ms":return parseInt(this.duration/1e3)}},dataMS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(1e3*this.duration);case"ms":return parseInt(this.duration)}},years:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.YEAR_SECONDS?0:parseInt(this.dataS/this.YEAR_SECONDS)},days:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.DAY_SECONDS?0:parseInt(this.dataS%this.YEAR_SECONDS/this.DAY_SECONDS)},hours:function(){return this.dataS>31536e3||this.T.isNothing(this.duration)?null:this.dataS<this.HOUR_SECONDS?0:parseInt(this.dataS%this.DAY_SECONDS/this.HOUR_SECONDS)},minutes:function(){return this.dataS>86400||this.T.isNothing(this.duration)?null:this.dataS<this.MINUTE_SECONDS?0:parseInt(this.dataS%this.HOUR_SECONDS/this.MINUTE_SECONDS)},seconds:function(){return this.dataS>3600||this.T.isNothing(this.duration)?null:Number.isInteger(this.dataS)?this.dataS%this.MINUTE_SECONDS:(this.dataMS/1e3%this.MINUTE_SECONDS).toFixed(1)}},props:{duration:Number,prefix:String,unit:{type:String,default:"s"}},data:function(){return{}}}),o=i,a=n("2877"),u=n("b1a3"),c=n("388d"),l=n("19173"),d=Object(a["a"])(o,r,s,!1,null,"48ed0a4a",null);"function"===typeof u["default"]&&Object(u["default"])(d),"function"===typeof c["default"]&&Object(c["default"])(d),"function"===typeof l["default"]&&Object(l["default"])(d);t["a"]=d.exports},"2dee":function(e,t,n){"use strict";var r=n("0b22"),s=n.n(r);t["default"]=s.a},"308c":function(e,t,n){"use strict";var r=n("c59f"),s=n.n(r);t["default"]=s.a},"32df":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"min":"分"}}'),delete e.options._Ctor}},"388d":function(e,t,n){"use strict";var r=n("32df"),s=n.n(r);t["default"]=s.a},"4d09":function(e,t,n){"use strict";var r=n("0bfb"),s=n.n(r);t["default"]=s.a},"4ee9":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"min":"分"}}'),delete e.options._Ctor}},"6b0f":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Biz Entities":"業務實體","Biz Metrics":"業務指標","Collapse And Categorize":"摺疊並歸類","Cron Job":"定時任務","Current browser-server time difference:":"當前瀏覽器與服務器時差：","Delayed":"延遲執行","Exclude Disabled Items":"不包括已禁用的項","Expand All":"展開所有服務","Hostname":"主機名","Load":"負載","Overview":"總覽","Process":"工作進程","Process ID":"進程 ID","Queue Limit":"隊列限制","Queues":"隊列","Services":"服務","Triggers Per Day":"每天觸發次數","Triggers Per Hour":"每小時觸發次數","Triggers Per Minute":"每分鐘觸發次數","Triggers Per Second":"每秒觸發次數","Up Time":"已運行","Up Time AVG":"平均已運行","Up Time MAX":"最長已運行","Up Time MIN":"最短已運行","When the Work Queue length reaches the limit, Cron Jobs will stop generating new tasks":"當工作隊列長度達到限制時，定時任務將停止產生新任務","Worker":"工作單元","Worker Queue":"工作隊列","generalCount":"{n} 個","recentOperationCount":"最近 {n} 條","taskCount":"{n} 個任務"}}'),delete e.options._Ctor}},7094:function(e,t,n){"use strict";var r=n("e254"),s=n.n(r);t["default"]=s.a},"7b0b4":function(e,t,n){"use strict";var r=n("0797"),s=n.n(r);t["default"]=s.a},"7c5d":function(e,t,n){},8157:function(e,t,n){"use strict";n.r(t);n("a15b"),n("d81d"),n("b0c0");var r=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("h1",[e._v(e._s(e.$t("Overview")))])]),e._v(" "),t("el-main",[t("span",{staticClass:"browser-server-time-diff",class:e.browserServerTimeDiff>1e3?"text-bad":"text-info"},[t("i",{staticClass:"fa fa-fw",class:e.browserServerTimeDiff>1e3?"fa-exclamation-triangle":"fa-exchange"}),e._v("\n        "+e._s(e.$t("Current browser-server time difference:"))+"\n        "),t("TimeDuration",{attrs:{duration:e.browserServerTimeDiff,unit:"ms"}})],1),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("Services"))+" "+e._s(e.$t("("))+e._s(e.$tc("generalCount",e.services.length))+e._s(e.$t(")")))])]),e._v(" "),t("div",{staticClass:"service-group-expand-button"},[t("el-link",{on:{click:function(t){e.serviceGroupCollapsed=!e.serviceGroupCollapsed}}},[t("i",{staticClass:"fa fa-angle-left",class:{"fa-flip-horizontal":!e.serviceGroupCollapsed}}),t("i",{staticClass:"fa fa-angle-left",class:{"fa-flip-horizontal":e.serviceGroupCollapsed},staticStyle:{"margin-left":"2px"}}),e._v("\n          "+e._s(e.serviceGroupCollapsed?e.$t("Expand All"):e.$t("Collapse And Categorize"))+"\n        ")])],1),e._v(" "),e._l([e.serviceGroup_servers,e.serviceGroup_workers,e.serviceGroup_beat],(function(n){return[t("div",{class:{"service-group-collapsed":e.serviceGroupCollapsed}},[e._l(n,(function(n,r){return t("el-card",{key:r,staticClass:"service-card",class:{"service-group-rest":e.serviceGroupCollapsed&&r>0},attrs:{shadow:"hover"}},[t("div",{staticClass:"service-info"},[t("span",{staticClass:"service-name"},[e._v(e._s(n.name))]),e._v(" "),t("table",[e.serviceGroupCollapsed?[t("tr",[t("td",[e._v(e._s(e.$t("Version")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",{class:{"text-bad":e.serviceGroupVersionEditions[n.name].length>1}},[e._v(e._s(e.serviceGroupVersionEditions[n.name].join(", ")))])])]),e._v(" "),t("tr",[t("td",[e._v(e._s(e.$t("Up Time")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v("AVG. "+e._s(e.T.duration(e.serviceGroupUptime_avg[n.name])))])])]),e._v(" "),t("tr",[t("td"),e._v(" "),t("td"),e._v(" "),t("td",[t("code",[e._v("MIN. "+e._s(e.T.duration(e.serviceGroupUptime_min[n.name])))])])]),e._v(" "),t("tr",[t("td"),e._v(" "),t("td"),e._v(" "),t("td",[t("code",[e._v("MAX. "+e._s(e.T.duration(e.serviceGroupUptime_max[n.name])))])])]),e._v(" "),"worker"===n.name?t("tr",[t("td",[e._v(e._s(e.$t("Queues")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(e.serviceGroupQueues.map((function(e){return"#".concat(e)})).join(" ")))])])]):e._e()]:[t("tr",[t("td",[e._v(e._s(e.$t("Version")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(n.version)+" "),n.edition?t("span",[e._v("("+e._s(n.edition)+")")]):e._e()])])]),e._v(" "),t("tr",[t("td",[e._v(e._s(e.$t("Hostname")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(n.hostname))])])]),e._v(" "),t("tr",[t("td",[e._v(e._s(e.$t("Process ID")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(n.pid))])])]),e._v(" "),t("tr",[t("td",[e._v(e._s(e.$t("Up Time")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(e.T.duration(1e3*n.uptime)))])])]),e._v(" "),n.queues?t("tr",[t("td",[e._v(e._s(e.$t("Queues")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("code",[e._v(e._s(n.queues.map((function(e){return"#".concat(e)})).join(" ")))])])]):e._e()]],2),e._v(" "),t("div",{staticClass:"service-active"},[t("el-progress",{attrs:{percentage:e.serviceGroupCollapsed?100:n.activePercent,format:e.serviceActiveFormat,color:e.serviceActiveColor}})],1)])])})),e._v(" "),n.length>0&&e.serviceGroupCollapsed?t("el-card",{staticClass:"service-group-count"},[t("span",{staticClass:"service-group-count-text"},[e._v("\n              ×\n              "+e._s(n.length)+"\n            ")])]):e._e()],2)]})),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("Queues")))])]),e._v(" "),e._l(e.queues,(function(n,r){return t("el-card",{key:r,staticClass:"queue-card",class:{"queue-highlight":n.workerQueueLength>0},attrs:{shadow:"hover"}},[t("div",{staticClass:"queue-info"},[t("span",{staticClass:"queue-number"},[e._v("#"+e._s(r))]),e._v(" "),t("table",[t("tbody",[t("tr",{class:{"text-bad":n.workerCount<=0}},[t("td",[e._v(e._s(e.$t("Worker")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[e._v(e._s(e.$tc("generalCount",n.workerCount)))])]),e._v(" "),t("tr",{class:{"text-bad":n.processCount<=0}},[t("td",[e._v(e._s(e.$t("Process")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[e._v(e._s(e.$tc("generalCount",n.processCount)))])]),e._v(" "),t("tr",[t("td",[e._v(e._s(e.$t("Delayed")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("span",{staticClass:"cover"},[e._v(e._s(e.$tc("taskCount",n.delayQueueLength)))])])]),e._v(" "),t("tr",{class:{"text-good":n.workerQueueLoad<50,"text-watch":n.workerQueueLoad>=50&&n.workerQueueLoad<99,"text-bad":n.workerQueueLoad>=100}},[t("td",[e._v(e._s(e.$t("Worker Queue")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("span",{staticClass:"cover"},[e._v(e._s(e.$tc("taskCount",n.workerQueueLength)))])])]),e._v(" "),n.workerQueueLimit?t("tr",{staticClass:"text-main"},[t("td",[e._v(e._s(e.$t("Queue Limit")))]),e._v(" "),t("td",[e._v(e._s(e.$t(":")))]),e._v(" "),t("td",[t("el-tooltip",{attrs:{effect:"dark",content:e.$t("When the Work Queue length reaches the limit, Cron Jobs will stop generating new tasks"),placement:"bottom"}},[t("span",{staticClass:"cover"},[e._v("\n                      ≤ "+e._s(e.$tc("taskCount",n.workerQueueLimit))+"\n                      "),t("i",{staticClass:"fa fa-fw fa-question-circle"})])])],1)]):e._e()])])]),e._v(" "),t("el-progress",{staticClass:"worker-queue-load",attrs:{type:"circle",width:"100",percentage:n.workerQueueLoad,format:e.workerQueueLoadFormat,color:e.WORKER_QUEUE_LOAD_COLORS}})],1)})),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("Biz Metrics")))])]),e._v(" "),e._l(e.bizMetrics,(function(n){return t("el-card",{key:n.name,staticClass:"biz-metric-card",attrs:{shadow:"hover"}},[t("span",{staticClass:"biz-metric-title"},[e._v(e._s(n.isBuiltin?e.$t(n.title):n.title))]),e._v(" "),t("span",{staticClass:"biz-metric-sub-title"},[e._v(e._s(n.isBuiltin?e.$t(n.subTitle):n.subTitle))]),e._v(" "),t("span",{staticClass:"biz-metric-value"},[e._v(e._s("number"===typeof n.value?e.T.numberComma(n.value):n.value))])])})),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("Biz Entities")))])]),e._v(" "),e._l(e.bizEntities,(function(n){return t("el-card",{key:n.name,staticClass:"biz-entity-card",attrs:{shadow:"hover"}},[e.C.OVERVIEW_ENTITY_MAP.get(n.name).icon?t("i",{staticClass:"fa fa-fw biz-entity-icon",class:e.C.OVERVIEW_ENTITY_MAP.get(n.name).icon}):e.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText?t("i",{staticClass:"biz-entity-icon biz-entity-icon-text",attrs:{type:"info"}},[t("code",[e._v(e._s(e.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText))])]):e._e(),e._v(" "),t("span",{staticClass:"biz-entity-name"},[e._v(e._s(e.C.OVERVIEW_ENTITY_MAP.get(n.name).name))]),e._v(" "),e.T.notNothing(n.countEnabled)?[t("span",{staticClass:"biz-entity-count"},[t("el-tooltip",{attrs:{effect:"dark",content:e.$t("Exclude Disabled Items"),placement:"left"}},[t("span",{staticClass:"text-good"},[e._v("\n                "+e._s(n.countEnabled)+"\n              ")])])],1),e._v(" "),t("span",{staticClass:"biz-entity-count-sub"},[e._v("\n            "+e._s(e.$t("Total"))+e._s(e.$t(":"))+"\n            "+e._s(n.count)+"\n          ")])]:[t("span",{staticClass:"biz-entity-count"},[e._v("\n            "+e._s(n.count)+"\n          ")])]],2)}))],2),e._v(" "),t("LongTextDialog",{ref:"longTextDialog",attrs:{showDownload:!0}})],1)],1)},s=[],i=n("c7eb"),o=n("1da1"),a=(n("99af"),n("4de4"),n("14d9"),n("13d5"),n("4e82"),n("d3b7"),n("3ca3"),n("159b"),n("ddb0"),n("2ac1")),u=n("b76c"),c={name:"Overview",components:{TimeDuration:a["a"],LongTextDialog:u["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var n=this;return Object(o["a"])(Object(i["a"])().mark((function e(){return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,n.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(e,t){var n=this;return Object(o["a"])(Object(i["a"])().mark((function r(){var s,o,a,u;return Object(i["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:return t=t||{},s=null,n.T.notNothing(e)&&(s={sections:e.join(",")}),r.next=5,n.T.callAPI_get("/api/v1/func/overview",{query:s,alert:{muteError:t.mute}});case 5:if(o=r.sent,o&&o.ok){r.next=8;break}return r.abrupt("return");case 8:n.browserServerTimeDiff=new Date(o.reqTime)-new Date(o.clientTime),a=Object(i["a"])().mark((function e(){var t;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:n[u]=o.data[u],e.t0=u,e.next="services"===e.t0?4:7;break;case 4:return t=n.$store.getters.SYSTEM_INFO("_MONITOR_REPORT_INTERVAL"),n.services.forEach((function(e){e.ttl>=t?(e.activePercent=100,e.activeStatus="success"):(e.activePercent=100*e.ttl/t,e.activeStatus="warning")})),e.abrupt("break",7);case 7:case"end":return e.stop()}}),e)})),r.t0=Object(i["a"])().keys(o.data);case 11:if((r.t1=r.t0()).done){r.next=16;break}return u=r.t1.value,r.delegateYield(a(),"t2",14);case 14:r.next=11;break;case 16:n.$store.commit("updateLoadStatus",!0);case 17:case"end":return r.stop()}}),r)})))()},serviceActiveFormat:function(e){return e>=100?this.$t("Online"):this.$t("Going Offline")},serviceActiveColor:function(e){return e>=100?"rgb(0,128,0)":"orange"},overviewCountFontSize:function(e,t){var n=(""+e).length,r=parseInt(80-10*n*(t||1));return Math.max(50,r)},workerQueueLoadFormat:function(e){return"".concat(this.$t("Load")).concat(this.$t(":")).concat(this.T.numberLimit(e,999))}},computed:{WORKER_QUEUE_LOAD_COLORS:function(){return[{color:"#00aa00",percentage:50},{color:"#ff6600",percentage:99},{color:"#ff0000",percentage:100}]},serviceGroup_servers:function(){return this.services.filter((function(e){return"server"===e.name}))},serviceGroup_workers:function(){return this.services.filter((function(e){return"worker"===e.name}))},serviceGroup_beat:function(){return this.services.filter((function(e){return"beat"===e.name}))},serviceGroupUptime_avg:function(){return{server:parseInt(this.serviceGroup_servers.reduce((function(e,t){return e+t.uptime}),0)/this.serviceGroup_servers.length*1e3),worker:parseInt(this.serviceGroup_workers.reduce((function(e,t){return e+t.uptime}),0)/this.serviceGroup_workers.length*1e3),beat:parseInt(this.serviceGroup_beat.reduce((function(e,t){return e+t.uptime}),0)/this.serviceGroup_beat.length*1e3)}},serviceGroupUptime_min:function(){return{server:1e3*Math.min.apply(null,this.serviceGroup_servers.map((function(e){return e.uptime}))),worker:1e3*Math.min.apply(null,this.serviceGroup_workers.map((function(e){return e.uptime}))),beat:1e3*Math.min.apply(null,this.serviceGroup_beat.map((function(e){return e.uptime})))}},serviceGroupUptime_max:function(){return{server:1e3*Math.max.apply(null,this.serviceGroup_servers.map((function(e){return e.uptime}))),worker:1e3*Math.max.apply(null,this.serviceGroup_workers.map((function(e){return e.uptime}))),beat:1e3*Math.max.apply(null,this.serviceGroup_beat.map((function(e){return e.uptime})))}},serviceGroupVersionEditions:function(){var e=this,t=function(t,n){var r="".concat(n.version);return n.edition&&(r+=" (".concat(n.edition,")")),t.push(r),t=e.T.noDuplication(t),t.sort(),t};return{server:this.serviceGroup_servers.reduce(t,[]),worker:this.serviceGroup_workers.reduce(t,[]),beat:this.serviceGroup_beat.reduce(t,[])}},serviceGroupQueues:function(){var e=this,t=function(t,n){return t=t.concat(n.queues||[]),t=e.T.noDuplication(t),t.sort(),t};return this.serviceGroup_workers.reduce(t,[])}},props:{},data:function(){return{browserServerTimeDiff:0,serviceGroupCollapsed:!0,services:[],queues:[],bizMetrics:[],bizEntities:[],autoRefreshTimer:null}},mounted:function(){var e=this;this.autoRefreshTimer=setInterval((function(){e.loadData(["services","queues"],{mute:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}},l=c,d=(n("1cd5"),n("e7daf"),n("2877")),_=n("1578"),v=n("4d09"),p=n("99b4"),f=n("2dee"),h=Object(d["a"])(l,r,s,!1,null,"42f68050",null);"function"===typeof _["default"]&&Object(_["default"])(h),"function"===typeof v["default"]&&Object(v["default"])(h),"function"===typeof p["default"]&&Object(p["default"])(h),"function"===typeof f["default"]&&Object(f["default"])(h);t["default"]=h.exports},"8ba4":function(e,t,n){var r=n("23e7"),s=n("eac5");r({target:"Number",stat:!0},{isInteger:s})},"99b4":function(e,t,n){"use strict";var r=n("6b0f"),s=n.n(r);t["default"]=s.a},a387:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"min":"分"}}'),delete e.options._Ctor}},b1a3:function(e,t,n){"use strict";var r=n("4ee9"),s=n.n(r);t["default"]=s.a},b76c:function(e,t,n){"use strict";var r=function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"LongTextDialog",visible:e.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(t){e.show=t}}},[t("template",{slot:"title"},[e._v("\n    "+e._s(e.title)+"\n    "),t("span",{staticClass:"text-info press-esc-to-close-tip"},[e._v(e._s(e.$t("Press ESC to close")))])]),e._v(" "),t("div",[e.showDownload&&e.fileName&&e.content?t("div",{staticClass:"download-link"},[t("el-link",{attrs:{type:"primary"},on:{click:e.download}},[e._v("\n        "+e._s(e.$t("Download as a text file"))+"\n        "),t("i",{staticClass:"fa fa-fw fa-download"})])],1):e._e(),e._v(" "),t("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},s=[],i=(n("130f"),n("21a6")),o=n.n(i),a={name:"LongTextDialog",components:{},watch:{},methods:{update:function(e,t){var n=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=e,this.fileName=(t||"dump")+".txt",this.show=!0,setImmediate((function(){if(!n.codeMirror){var e={mode:n.mode||"text"};n.codeMirror=n.T.initCodeMirror("longTextDialogContent",e),n.codeMirror.setOption("theme",n.T.getCodeMirrorThemeName()),n.T.setCodeMirrorReadOnly(n.codeMirror,!0)}n.codeMirror.setValue(n.content||""),n.codeMirror.refresh(),n.codeMirror.focus()}))},download:function(){var e=new Blob([this.content],{type:"text/plain"}),t=this.fileName;o.a.saveAs(e,t)}},computed:{},props:{title:String,mode:String,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},u=a,c=(n("1b85"),n("f7d2"),n("2877")),l=n("7b0b4"),d=n("7094"),_=n("308c"),v=Object(c["a"])(u,r,s,!1,null,"fc951d86",null);"function"===typeof l["default"]&&Object(l["default"])(v),"function"===typeof d["default"]&&Object(d["default"])(v),"function"===typeof _["default"]&&Object(_["default"])(v);t["a"]=v.exports},c3b8:function(e,t,n){},c59f:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Download as a text file":"作為文字檔案下載"}}'),delete e.options._Ctor}},da56:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"generalCount":"{n}","taskCount":"{n} Task | {n} Tasks"}}'),delete e.options._Ctor}},e254:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Download as a text file":"作為文本文件下載"}}'),delete e.options._Ctor}},e7daf:function(e,t,n){"use strict";n("f0df")},eac5:function(e,t,n){var r=n("861d"),s=Math.floor;e.exports=Number.isInteger||function(e){return!r(e)&&isFinite(e)&&s(e)===e}},f0df:function(e,t,n){},f7d2:function(e,t,n){"use strict";n("c3b8")}}]);