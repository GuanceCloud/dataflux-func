(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-4b3b0550"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as a text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"0b22":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Biz Entities":"業務實體","Client":"客戶端","Client ID":"客戶端 ID","Collapse And Categorize":"摺疊並歸類","Cost":"耗時","Current browser-server time difference:":"當前瀏覽器與伺服器時差：","DELETE":"刪除操作","Data ID":"資料 ID","Delay Queue":"延遲佇列","Expand All":"展開所有服務","Hostname":"主機名","IP Address":"IP 地址","Jam":"擁堵","MODIFY":"修改操作","Operation":"操作","Overview":"總覽","Process":"工作程序","Process ID":"程序 ID","Queues":"佇列","Recent operations":"最近操作記錄","Request":"請求","Response":"響應","Services":"服務","Up Time":"已執行","Up Time AVG":"平均已執行","Up Time MAX":"最長已執行","Up Time MIN":"最短已執行","Worker":"工作單元","Worker Queue":"工作佇列","Worker Queue Limit":"工作佇列限制","generalCount":"{n} 個","generalCountUnit":" 個","recentOperationCount":"最近 {n} 條","taskCount":"{n} 個任務"}}'),delete t.options._Ctor}},"0bfb":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Current browser-server time difference:":"当前浏览器与服务器时差：","generalCount":"{n} 个","generalCountUnit":" 个","taskCount":"{n} 个任务","recentOperationCount":"最近 {n} 条","Expand All":"展开所有服务","Collapse And Categorize":"折叠并归类","Overview":"总览","Services":"服务","Hostname":"主机名","Process ID":"进程 ID","Up Time":"已运行","Up Time AVG":"平均已运行","Up Time MAX":"最长已运行","Up Time MIN":"最短已运行","Queues":"队列","Worker":"工作单元","Process":"工作进程","Delay Queue":"延迟队列","Worker Queue":"工作队列","Worker Queue Limit":"工作队列限制","Jam":"拥堵","Biz Entities":"业务实体","Recent operations":"最近操作记录","Client":"客户端","Client ID":"客户端 ID","IP Address":"IP 地址","Operation":"操作","Data ID":"数据 ID","MODIFY":"修改操作","DELETE":"删除操作","Cost":"耗时","Request":"请求","Response":"响应"}}'),delete t.options._Ctor}},1578:function(t,e,n){"use strict";var s=n("da56"),o=n.n(s);e["default"]=o.a},19173:function(t,e,n){"use strict";var s=n("a387"),o=n.n(s);e["default"]=o.a},"1b85":function(t,e,n){"use strict";n("7c5d")},"21a6":function(t,e,n){(function(n){var s,o,r;(function(n,i){o=[],s=i,r="function"===typeof s?s.apply(e,o):s,void 0===r||(t.exports=r)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function s(t,e,n){var s=new XMLHttpRequest;s.open("GET",t),s.responseType="blob",s.onload=function(){u(s.response,e,n)},s.onerror=function(){console.error("could not download file")},s.send()}function o(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function r(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(s){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var i="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof n&&n.global===n?n:void 0,a=i.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),u=i.saveAs||("object"!=typeof window||window!==i?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(t,e,n){var a=i.URL||i.webkitURL,u=document.createElement("a");e=e||t.name||"download",u.download=e,u.rel="noopener","string"==typeof t?(u.href=t,u.origin===location.origin?r(u):o(u.href)?s(t,e,n):r(u,u.target="_blank")):(u.href=a.createObjectURL(t),setTimeout((function(){a.revokeObjectURL(u.href)}),4e4),setTimeout((function(){r(u)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,n,i){if(n=n||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,i),n);else if(o(t))s(t,n,i);else{var a=document.createElement("a");a.href=t,a.target="_blank",setTimeout((function(){r(a)}))}}:function(t,e,n,o){if(o=o||open("","_blank"),o&&(o.document.title=o.document.body.innerText="downloading..."),"string"==typeof t)return s(t,e,n);var r="application/octet-stream"===t.type,u=/constructor/i.test(i.HTMLElement)||i.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||r&&u||a)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var t=l.result;t=c?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),o?o.location.href=t:location=t,o=null},l.readAsDataURL(t)}else{var d=i.URL||i.webkitURL,_=d.createObjectURL(t);o?o.location=_:location.href=_,o=null,setTimeout((function(){d.revokeObjectURL(_)}),4e4)}});i.saveAs=u.saveAs=u,t.exports=u}))}).call(this,n("c8ba"))},"26af":function(t,e,n){},"2ac1":function(t,e,n){"use strict";var s=function(){var t=this,e=t._self._c;return e("span",[t.T.notNothing(t.duration)?[t.prefix?e("span",[t._v(t._s(t.prefix))]):t._e(),t._v(" "),t.dataMS>3e3?[t.years?e("span",[e("strong",[t._v(t._s(t.years))]),t._v(" "+t._s(t.$t("y"))+"\n      ")]):t._e(),t._v(" "),t.days?e("span",[e("strong",[t._v(t._s(t.days))]),t._v(" "+t._s(t.$t("d"))+"\n      ")]):t._e(),t._v(" "),t.hours?e("span",[e("strong",[t._v(t._s(t.hours))]),t._v(" "+t._s(t.$t("h"))+"\n      ")]):t._e(),t._v(" "),t.minutes?e("span",[e("strong",[t._v(t._s(t.minutes))]),t._v(" "+t._s(t.$t("min"))+"\n      ")]):t._e(),t._v(" "),t.seconds?e("span",[e("strong",[t._v(t._s(t.seconds))]),t._v(" "+t._s(t.$t("s"))+"\n      ")]):t._e()]:e("span",[e("strong",[t._v(t._s(t.dataMS))]),t._v(" "+t._s(t.$t("ms"))+"\n    ")])]:[t._v("-")]],2)},o=[],r=(n("a9e3"),n("8ba4"),n("b680"),{name:"TimeDuration",components:{},watch:{},methods:{},computed:{YEAR_SECONDS:function(){return 31536e3},DAY_SECONDS:function(){return 86400},HOUR_SECONDS:function(){return 3600},MINUTE_SECONDS:function(){return 60},dataS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(this.duration);case"ms":return parseInt(this.duration/1e3)}},dataMS:function(){if(this.T.isNothing(this.duration))return null;switch(this.unit){case"s":return parseInt(1e3*this.duration);case"ms":return parseInt(this.duration)}},years:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.YEAR_SECONDS?0:parseInt(this.dataS/this.YEAR_SECONDS)},days:function(){return this.T.isNothing(this.duration)?null:this.dataS<this.DAY_SECONDS?0:parseInt(this.dataS%this.YEAR_SECONDS/this.DAY_SECONDS)},hours:function(){return this.dataS>31536e3||this.T.isNothing(this.duration)?null:this.dataS<this.HOUR_SECONDS?0:parseInt(this.dataS%this.DAY_SECONDS/this.HOUR_SECONDS)},minutes:function(){return this.dataS>86400||this.T.isNothing(this.duration)?null:this.dataS<this.MINUTE_SECONDS?0:parseInt(this.dataS%this.HOUR_SECONDS/this.MINUTE_SECONDS)},seconds:function(){return this.dataS>3600||this.T.isNothing(this.duration)?null:Number.isInteger(this.dataS)?this.dataS%this.MINUTE_SECONDS:(this.dataMS/1e3%this.MINUTE_SECONDS).toFixed(1)}},props:{duration:Number,prefix:String,unit:{type:String,default:"s"}},data:function(){return{}}}),i=r,a=n("2877"),u=n("b1a3"),c=n("388d"),l=n("19173"),d=Object(a["a"])(i,s,o,!1,null,"48ed0a4a",null);"function"===typeof u["default"]&&Object(u["default"])(d),"function"===typeof c["default"]&&Object(c["default"])(d),"function"===typeof l["default"]&&Object(l["default"])(d);e["a"]=d.exports},"2dee":function(t,e,n){"use strict";var s=n("0b22"),o=n.n(s);e["default"]=o.a},"308c":function(t,e,n){"use strict";var s=n("c59f"),o=n.n(s);e["default"]=o.a},"32df":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"min":"分"}}'),delete t.options._Ctor}},"388d":function(t,e,n){"use strict";var s=n("32df"),o=n.n(s);e["default"]=o.a},"4d09":function(t,e,n){"use strict";var s=n("0bfb"),o=n.n(s);e["default"]=o.a},"4ee9":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"min":"分"}}'),delete t.options._Ctor}},"6b0f":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Biz Entities":"業務實體","Client":"客户端","Client ID":"客户端 ID","Collapse And Categorize":"摺疊並歸類","Cost":"耗時","Current browser-server time difference:":"當前瀏覽器與服務器時差：","DELETE":"刪除操作","Data ID":"數據 ID","Delay Queue":"延遲隊列","Expand All":"展開所有服務","Hostname":"主機名","IP Address":"IP 地址","Jam":"擁堵","MODIFY":"修改操作","Operation":"操作","Overview":"總覽","Process":"工作進程","Process ID":"進程 ID","Queues":"隊列","Recent operations":"最近操作記錄","Request":"請求","Response":"響應","Services":"服務","Up Time":"已運行","Up Time AVG":"平均已運行","Up Time MAX":"最長已運行","Up Time MIN":"最短已運行","Worker":"工作單元","Worker Queue":"工作隊列","Worker Queue Limit":"工作隊列限制","generalCount":"{n} 個","generalCountUnit":" 個","recentOperationCount":"最近 {n} 條","taskCount":"{n} 個任務"}}'),delete t.options._Ctor}},7094:function(t,e,n){"use strict";var s=n("e254"),o=n.n(s);e["default"]=o.a},"7b0b4":function(t,e,n){"use strict";var s=n("0797"),o=n.n(s);e["default"]=o.a},"7c5d":function(t,e,n){},8157:function(t,e,n){"use strict";n.r(e);n("a15b"),n("d81d"),n("b0c0"),n("8a79");var s=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.$t("Overview")))])]),t._v(" "),e("el-main",[e("span",{staticClass:"browser-server-time-diff",class:t.browserServerTimeDiff>1e3?"text-bad":"text-info"},[e("i",{staticClass:"fa fa-fw",class:t.browserServerTimeDiff>1e3?"fa-exclamation-triangle":"fa-exchange"}),t._v("\n        "+t._s(t.$t("Current browser-server time difference:"))+"\n        "),e("TimeDuration",{attrs:{duration:t.browserServerTimeDiff,unit:"ms"}})],1),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Services"))+" "+t._s(t.$t("("))+t._s(t.$tc("generalCount",t.serviceInfo.length))+t._s(t.$t(")")))])]),t._v(" "),e("div",{staticClass:"service-group-expand-button"},[e("el-link",{on:{click:function(e){t.serviceGroupCollapsed=!t.serviceGroupCollapsed}}},[e("i",{staticClass:"fa fa-angle-left",class:{"fa-flip-horizontal":!t.serviceGroupCollapsed}}),e("i",{staticClass:"fa fa-angle-left",class:{"fa-flip-horizontal":t.serviceGroupCollapsed},staticStyle:{"margin-left":"2px"}}),t._v("\n          "+t._s(t.serviceGroupCollapsed?t.$t("Expand All"):t.$t("Collapse And Categorize"))+"\n        ")])],1),t._v(" "),t._l([t.serviceGroup_servers,t.serviceGroup_workers,t.serviceGroup_beat],(function(n){return[e("div",{class:{"service-group-collapsed":t.serviceGroupCollapsed}},[t._l(n,(function(s,o){return e("el-card",{key:o,staticClass:"service-card",class:{"service-group-rest":t.serviceGroupCollapsed&&o>0},attrs:{shadow:"hover"}},[e("div",{staticClass:"service-info"},[e("span",{staticClass:"service-name"},[t._v(t._s(s.name))]),t._v(" "),e("table",[t.serviceGroupCollapsed&&n.length>1?e("tr",[e("td",[t._v(t._s(t.$t("Up Time")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v("AVG. "+t._s(t.T.duration(t.serviceGroupUptime_avg[s.name])))])])]):t._e(),t._v(" "),t.serviceGroupCollapsed&&n.length>1?e("tr",[e("td"),t._v(" "),e("td"),t._v(" "),e("td",[e("code",[t._v("MIN. "+t._s(t.T.duration(t.serviceGroupUptime_min[s.name])))])])]):t._e(),t._v(" "),t.serviceGroupCollapsed&&n.length>1?e("tr",[e("td"),t._v(" "),e("td"),t._v(" "),e("td",[e("code",[t._v("MAX. "+t._s(t.T.duration(t.serviceGroupUptime_max[s.name])))])])]):t._e(),t._v(" "),t.serviceGroupCollapsed&&"worker"===s.name?e("tr",[e("td",[t._v(t._s(t.$t("Queues")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v(t._s(t.serviceGroupQueues.map((function(t){return"#".concat(t)})).join(" ")))])])]):t._e(),t._v(" "),t.serviceGroupCollapsed?t._e():e("tr",[e("td",[t._v(t._s(t.$t("Hostname")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v(t._s(s.hostname))])])]),t._v(" "),t.serviceGroupCollapsed?t._e():e("tr",[e("td",[t._v(t._s(t.$t("Process ID")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v(t._s(s.pid))])])]),t._v(" "),t.serviceGroupCollapsed&&1!==n.length?t._e():e("tr",[e("td",[t._v(t._s(t.$t("Up Time")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v(t._s(t.T.duration(1e3*s.uptime)))])])]),t._v(" "),!t.serviceGroupCollapsed&&s.queues?e("tr",[e("td",[t._v(t._s(t.$t("Queues")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("code",[t._v(t._s(s.queues.map((function(t){return"#".concat(t)})).join(" ")))])])]):t._e()]),t._v(" "),e("div",{staticClass:"service-active"},[e("el-progress",{attrs:{percentage:t.serviceGroupCollapsed?100:s.activePercent,format:t.serviceActiveFormat,color:t.serviceActiveColor}})],1)])])})),t._v(" "),n.length>0&&t.serviceGroupCollapsed?e("el-card",{staticClass:"service-group-count"},[e("span",{staticClass:"service-group-count-text"},[t._v("\n              ×\n              "+t._s(n.length)+"\n            ")])]):t._e()],2)]})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Queues")))])]),t._v(" "),t._l(t.queueInfo,(function(n,s){return e("el-card",{key:s,staticClass:"queue-card",class:{"queue-highlight":n.workerQueueLength>0},attrs:{shadow:"hover"}},[e("div",{staticClass:"queue-info"},[e("span",{staticClass:"queue-number"},[t._v("#"+t._s(s))]),t._v(" "),e("table",[e("tr",{class:{"text-bad":n.workerCount<=0}},[e("td",[t._v(t._s(t.$t("Worker")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[t._v(t._s(t.$tc("generalCount",n.workerCount)))])]),t._v(" "),e("tr",{class:{"text-bad":n.processCount<=0}},[e("td",[t._v(t._s(t.$t("Process")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[t._v(t._s(t.$tc("generalCount",n.processCount)))])]),t._v(" "),e("tr",[e("td",[t._v(t._s(t.$t("Delay Queue")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("span",{staticClass:"cover"},[t._v(t._s(t.$tc("taskCount",n.delayQueueLength)))])])]),t._v(" "),e("tr",{class:{"text-good":n.workerQueueJamPercent<50,"text-watch":n.workerQueueJamPercent>=50&&n.workerQueueJamPercent<80,"text-bad":n.workerQueueJamPercent>=80}},[e("td",[t._v(t._s(t.$t("Worker Queue")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("span",{staticClass:"cover"},[t._v(t._s(t.$tc("taskCount",n.workerQueueLength)))])])]),t._v(" "),n.workerQueueLimit?e("tr",{staticClass:"text-main"},[e("td",[t._v(t._s(t.$t("Worker Queue Limit")))]),t._v(" "),e("td",[t._v(t._s(t.$t(":")))]),t._v(" "),e("td",[e("span",{staticClass:"cover"},[t._v("≤ "+t._s(t.$tc("taskCount",n.workerQueueLimit)))])])]):t._e()])]),t._v(" "),e("el-progress",{staticClass:"worker-queue-jam-percent",attrs:{type:"circle",width:"100",percentage:n.workerQueueJamPercent,format:t.workerQueueJamPercentFormat,color:t.WORKER_QUEUE_JAM_PERCENT_COLORS}})],1)})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Biz Entities")))])]),t._v(" "),t._l(t.bizEntityInfo,(function(n){return e("el-card",{key:n.name,staticClass:"biz-entity-card",attrs:{shadow:"hover"}},[t.C.OVERVIEW_ENTITY_MAP.get(n.name).icon?e("i",{staticClass:"fa fa-fw biz-entity-icon",class:t.C.OVERVIEW_ENTITY_MAP.get(n.name).icon}):t.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText?e("i",{staticClass:"biz-entity-icon biz-entity-icon-text",attrs:{type:"info"}},[e("code",[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(n.name).tagText))])]):t._e(),t._v(" "),e("span",{staticClass:"biz-entity-name"},[t._v(t._s(t.C.OVERVIEW_ENTITY_MAP.get(n.name).name))]),t._v(" "),n.countEnabled?[e("span",{staticClass:"biz-entity-count"},[e("el-tooltip",{attrs:{effect:"dark",content:t.$t("Enabled"),placement:"left"}},[e("span",{staticClass:"text-good"},[t._v("\n                "+t._s(n.countEnabled)+"\n              ")])]),t._v(" "),e("span",{staticClass:"biz-entity-count-unit"},[t._v(t._s(t.$t("generalCountUnit")))])],1),t._v(" "),e("span",{staticClass:"biz-entity-count-sub"},[t._v("\n            "+t._s(t.$t("Total"))+t._s(t.$t(":"))+"\n            "+t._s(n.count)+"\n          ")])]:[e("span",{staticClass:"biz-entity-count"},[t._v("\n            "+t._s(n.count)+"\n            "),e("span",{staticClass:"biz-entity-count-unit"},[t._v(t._s(t.$t("generalCountUnit")))])])]],2)})),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v("\n          "+t._s(t.$t("Recent operations"))+"\n          "),e("small",[t._v(t._s(t.$t("("))+t._s(t.$tc("recentOperationCount",t.latestOperations.length))+t._s(t.$t(")")))])])]),t._v(" "),e("el-table",{attrs:{data:t.latestOperations}},[e("el-table-column",{attrs:{label:t.$t("Time"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("span",[t._v(t._s(t._f("datetime")(n.row.createTime)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(n.row.createTime)))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("User"),width:"350"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("strong",[t._v(t._s(n.row.u_name||t.$t("Anonymity")))]),t._v(" "),n.row.userId?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("User ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row.userId))]),t._v(" "),e("CopyButton",{attrs:{content:n.row.userId}})]:t._e(),t._v(" "),t.T.notNothing(n.row.clientIPsJSON)?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("IP Address")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row.clientIPsJSON.join(", ")))]),t._v(" "),e("CopyButton",{attrs:{content:n.row.clientIPsJSON.join(", ")}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Operation")},scopedSlots:t._u([{key:"default",fn:function(n){return[n.row.respStatusCode>=200&&n.row.respStatusCode<400?e("span",{staticClass:"text-good"},[e("i",{staticClass:"fa fa-fw fa-check"})]):e("span",{staticClass:"text-bad"},[e("i",{staticClass:"fa fa-fw fa-times"})]),t._v(" "),e("span",[t._v(t._s(t.$t(n.row.reqRouteName)))]),t._v(" "),t.T.endsWith(n.row.reqRoute,"/do/modify")?e("strong",{staticClass:"text-watch"},[t._v("\n              （"+t._s(t.$t("MODIFY"))+"）\n            ")]):t._e(),t._v(" "),t.T.endsWith(n.row.reqRoute,"/do/delete")?e("strong",{staticClass:"text-bad"},[t._v("\n              （"+t._s(t.$t("DELETE"))+"）\n            ")]):t._e(),t._v(" "),n.row._operationEntityId?[e("br"),t._v(" "),e("i",{staticClass:"fa fa-fw"}),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Data ID")))]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(n.row._operationEntityId))]),t._v(" "),e("CopyButton",{attrs:{content:n.row._operationEntityId}})]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Cost"),align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(t){return[e("TimeDuration",{attrs:{duration:t.row.reqCost,unit:"ms"}})]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"150"},scopedSlots:t._u([{key:"default",fn:function(n){return[e("el-link",{attrs:{type:"primary"},on:{click:function(e){return t.showDetail(n.row)}}},[t._v(t._s(t.$t("Show detail")))])]}}])})],1)],2),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{showDownload:!0}})],1)],1)},o=[],r=n("c7eb"),i=n("1da1"),a=(n("99af"),n("4de4"),n("14d9"),n("13d5"),n("4e82"),n("e9c4"),n("d3b7"),n("3ca3"),n("159b"),n("ddb0"),n("2ac1")),u=n("b76c"),c={name:"Overview",components:{TimeDuration:a["a"],LongTextDialog:u["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var n=this;return Object(i["a"])(Object(r["a"])().mark((function t(){return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,n.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t,e){var n=this;return Object(i["a"])(Object(r["a"])().mark((function s(){var o,i,a,u;return Object(r["a"])().wrap((function(s){while(1)switch(s.prev=s.next){case 0:return e=e||{},o=null,n.T.notNothing(t)&&(o={sections:t.join(",")}),s.next=5,n.T.callAPI_get("/api/v1/func/overview",{query:o,alert:{muteError:e.mute}});case 5:if(i=s.sent,i&&i.ok){s.next=8;break}return s.abrupt("return");case 8:n.browserServerTimeDiff=new Date(i.reqTime)-new Date(i.clientTime),a=Object(r["a"])().mark((function t(){var e;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:n[u]=i.data[u],t.t0=u,t.next="serviceInfo"===t.t0?4:"latestOperations"===t.t0?7:9;break;case 4:return e=n.$store.getters.SYSTEM_INFO("_MONITOR_REPORT_INTERVAL"),n.serviceInfo.forEach((function(t){t.ttl>=e?(t.activePercent=100,t.activeStatus="success"):(t.activePercent=100*t.ttl/e,t.activeStatus="warning")})),t.abrupt("break",9);case 7:return n.latestOperations.forEach((function(t){t.reqRouteName=t.reqRouteNames[n.$store.getters.uiLocale]||t.reqRouteNames.default})),t.abrupt("break",9);case 9:case"end":return t.stop()}}),t)})),s.t0=Object(r["a"])().keys(i.data);case 11:if((s.t1=s.t0()).done){s.next=16;break}return u=s.t1.value,s.delegateYield(a(),"t2",14);case 14:s.next=11;break;case 16:n.$store.commit("updateLoadStatus",!0);case 17:case"end":return s.stop()}}),s)})))()},showDetail:function(t){var e=this;this.$store.commit("updateHighlightedTableDataId",t.id);var n=[];n.push("===== ".concat(this.$t("Request")," =====")),n.push("".concat(t.reqMethod.toUpperCase()," ").concat(this.T.formatURL(t.reqRoute,{params:t.reqParamsJSON,query:t.reqQueryJSON}))),t.reqBodyJSON&&n.push(JSON.stringify(t.reqBodyJSON,null,2)),t.reqFileInfoJSON&&(n.push("\n===== ".concat(this.$t("Upload")," =====")),t.reqFileInfoJSON.forEach((function(t){n.push("".concat(t.name," <").concat(e.T.byteSizeHuman(t.size),">"))}))),n.push("\n===== ".concat(this.$t("Response")," =====")),n.push("Status Code: ".concat(t.respStatusCode)),t.respBodyJSON&&n.push(JSON.stringify(t.respBodyJSON,null,2));var s=n.join("\n"),o=this.M(t.createTime).format("YYYYMMDD_HHmmss"),r="http-dump.".concat(o);this.$refs.longTextDialog.update(s,r)},serviceActiveFormat:function(t){return t>=100?this.$t("Online"):this.$t("Going Offline")},serviceActiveColor:function(t){return t>=100?"rgb(0,128,0)":"orange"},overviewCountFontSize:function(t,e){var n=(""+t).length,s=parseInt(80-10*n*(e||1));return Math.max(50,s)},workerQueueJamPercentFormat:function(t){return"".concat(this.$t("Jam")).concat(this.$t(":")).concat(parseInt(t),"%")}},computed:{WORKER_QUEUE_JAM_PERCENT_COLORS:function(){return[{color:"#00aa00",percentage:50},{color:"#ff6600",percentage:80},{color:"#ff0000",percentage:100}]},serviceGroup_servers:function(){return this.serviceInfo.filter((function(t){return"server"===t.name}))},serviceGroup_workers:function(){return this.serviceInfo.filter((function(t){return"worker"===t.name}))},serviceGroup_beat:function(){return this.serviceInfo.filter((function(t){return"beat"===t.name}))},serviceGroupUptime_avg:function(){return{server:parseInt(this.serviceGroup_servers.reduce((function(t,e){return t+e.uptime}),0)/this.serviceGroup_servers.length*1e3),worker:parseInt(this.serviceGroup_workers.reduce((function(t,e){return t+e.uptime}),0)/this.serviceGroup_workers.length*1e3),beat:parseInt(this.serviceGroup_beat.reduce((function(t,e){return t+e.uptime}),0)/this.serviceGroup_beat.length*1e3)}},serviceGroupUptime_min:function(){return{server:1e3*Math.min.apply(null,this.serviceGroup_servers.map((function(t){return t.uptime}))),worker:1e3*Math.min.apply(null,this.serviceGroup_workers.map((function(t){return t.uptime}))),beat:1e3*Math.min.apply(null,this.serviceGroup_beat.map((function(t){return t.uptime})))}},serviceGroupUptime_max:function(){return{server:1e3*Math.max.apply(null,this.serviceGroup_servers.map((function(t){return t.uptime}))),worker:1e3*Math.max.apply(null,this.serviceGroup_workers.map((function(t){return t.uptime}))),beat:1e3*Math.max.apply(null,this.serviceGroup_beat.map((function(t){return t.uptime})))}},serviceGroupQueues:function(){var t=this.serviceGroup_workers.reduce((function(t,e){return t.concat(e.queues||[])}),[]);return t=this.T.noDuplication(t),t.sort(),t}},props:{},data:function(){return{browserServerTimeDiff:0,serviceGroupCollapsed:!0,queueInfo:[],serviceInfo:[],bizEntityInfo:[],latestOperations:[],autoRefreshTimer:null}},mounted:function(){var t=this;this.autoRefreshTimer=setInterval((function(){t.loadData(["serviceInfo","queueInfo"],{mute:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}},l=c,d=(n("d3fe"),n("d4de"),n("2877")),_=n("1578"),p=n("4d09"),f=n("99b4"),v=n("2dee"),h=Object(d["a"])(l,s,o,!1,null,"3d4ce956",null);"function"===typeof _["default"]&&Object(_["default"])(h),"function"===typeof p["default"]&&Object(p["default"])(h),"function"===typeof f["default"]&&Object(f["default"])(h),"function"===typeof v["default"]&&Object(v["default"])(h);e["default"]=h.exports},"8a79":function(t,e,n){"use strict";var s=n("23e7"),o=n("e330"),r=n("06cf").f,i=n("50c4"),a=n("577e"),u=n("5a34"),c=n("1d80"),l=n("ab13"),d=n("c430"),_=o("".endsWith),p=o("".slice),f=Math.min,v=l("endsWith"),h=!d&&!v&&!!function(){var t=r(String.prototype,"endsWith");return t&&!t.writable}();s({target:"String",proto:!0,forced:!h&&!v},{endsWith:function(t){var e=a(c(this));u(t);var n=arguments.length>1?arguments[1]:void 0,s=e.length,o=void 0===n?s:f(i(n),s),r=a(t);return _?_(e,r,o):p(e,o-r.length,o)===r}})},"8ba4":function(t,e,n){var s=n("23e7"),o=n("eac5");s({target:"Number",stat:!0},{isInteger:o})},"99b4":function(t,e,n){"use strict";var s=n("6b0f"),o=n.n(s);e["default"]=o.a},a387:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"min":"分"}}'),delete t.options._Ctor}},b1a3:function(t,e,n){"use strict";var s=n("4ee9"),o=n.n(s);e["default"]=o.a},b76c:function(t,e,n){"use strict";var s=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n    "),e("span",{staticClass:"text-info press-esc-to-close-tip"},[t._v(t._s(t.$t("Press ESC to close")))])]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as a text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},o=[],r=(n("130f"),n("21a6")),i=n.n(r),a={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var n=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){if(!n.codeMirror){var t={mode:n.mode||"text"};n.codeMirror=n.T.initCodeMirror("longTextDialogContent",t),n.codeMirror.setOption("theme",n.T.getCodeMirrorThemeName()),n.T.setCodeMirrorReadOnly(n.codeMirror,!0)}n.codeMirror.setValue(n.content||""),n.codeMirror.refresh(),n.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;i.a.saveAs(t,e)}},computed:{},props:{title:String,mode:String,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},u=a,c=(n("1b85"),n("f7d2"),n("2877")),l=n("7b0b4"),d=n("7094"),_=n("308c"),p=Object(c["a"])(u,s,o,!1,null,"fc951d86",null);"function"===typeof l["default"]&&Object(l["default"])(p),"function"===typeof d["default"]&&Object(d["default"])(p),"function"===typeof _["default"]&&Object(_["default"])(p);e["a"]=p.exports},c3b8:function(t,e,n){},c59f:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Download as a text file":"作為文字檔案下載"}}'),delete t.options._Ctor}},d3fe:function(t,e,n){"use strict";n("26af")},d4de:function(t,e,n){"use strict";n("d690")},d690:function(t,e,n){},da56:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"generalCount":"{n}","generalCountUnit":" ","taskCount":"{n} Task | {n} Tasks","recentOperationCount":"Latest {n} Operation | Latest {n} Operations"}}'),delete t.options._Ctor}},e254:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Download as a text file":"作為文本文件下載"}}'),delete t.options._Ctor}},eac5:function(t,e,n){var s=n("861d"),o=Math.floor;t.exports=Number.isInteger||function(t){return!s(t)&&isFinite(t)&&o(t)===t}},f7d2:function(t,e,n){"use strict";n("c3b8")}}]);