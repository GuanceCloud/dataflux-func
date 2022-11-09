(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-e6819048"],{"199e":function(e,t,r){},2521:function(e,t,r){},"4ef52":function(e,t,r){"use strict";var n=r("a9c1"),o=r.n(n);t["default"]=o.a},"67f8":function(e,t,r){"use strict";r.r(t);r("b0c0");var n=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("h1",[e._v(e._s(e.$t("About")))])]),e._v(" "),t("el-main",[t("el-row",{attrs:{gutter:20}},[t("el-col",{attrs:{span:15}},[t("div",{staticClass:"about-form"},[t("p",{staticClass:"text-main browser-detect"},[e._v(e._s(e.$t("You are using {browser} (engine: {engine}) browser",{browser:e.T.getBrowser(),engine:e.T.getEngine()})))]),e._v(" "),t("br"),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("System Information")))])]),e._v(" "),t("el-form",{attrs:{"label-width":"120px"}},[t("el-form-item",{attrs:{label:e.$t("Version")}},[t("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.version}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Architecture")}},[t("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.architecture}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Node Version")}},[t("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.nodeVersion}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Python Version")}},[t("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.pythonVersion}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Release date")}},[t("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.releaseDateTEXT}})],1)],1),e._v(" "),t("br"),e._v(" "),t("el-divider",{attrs:{"content-position":"left"}},[t("h1",[e._v(e._s(e.$t("System Report")))])]),e._v(" "),t("el-form",{attrs:{"label-width":"120px"}},[e.showSystemReport?[t("el-form-item",[t("el-input",{attrs:{placeholder:e.$t("Loading..."),type:"textarea",autosize:"",resize:"none",readonly:!0,value:e.systemReportTEXT}})],1),e._v(" "),t("el-form-item",[t("InfoBlock",{attrs:{type:"info",title:'节点完整名称为：\n"celery@{编号}"'}}),e._v(" "),t("InfoBlock",{attrs:{type:"info",title:'工作队列完整 Key 格式为：\n"DataFluxFunc-worker#workerQueue@{序号}"'}})],1)]:e._e(),e._v(" "),t("el-form-item",[t("el-button",{on:{click:e.getSystemReport}},[e._v(e._s(e.$t("Get System Report")))])],1),e._v(" "),t("el-form-item",[e.dbDiskUsedInfoTEXT?t("el-button",{on:{click:e.clearLogCacheTables}},[e._v(e._s(e.$t("Clear Log and Cache")))]):e._e(),e._v(" "),e.workerQueues.length>0?t("el-dropdown",{attrs:{trigger:"click"},on:{command:e.clearWorkerQueue}},[t("el-button",[e._v(e._s(e.$t("Clear Worker Queue")))]),e._v(" "),t("el-dropdown-menu",{attrs:{slot:"dropdown"},slot:"dropdown"},e._l(e.workerQueues,(function(r){return t("el-dropdown-item",{key:r.name,attrs:{command:r.name}},[e._v("队列 #"+e._s(r.name)+" (存在 "+e._s(r.value)+" 个待处理任务)")])})),1)],1):e._e()],1)],2)],1)]),e._v(" "),t("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},o=[],a=r("c7eb"),s=r("1da1"),c=(r("fb6a"),r("38cf"),r("99af"),r("a15b"),r("d3b7"),r("159b"),r("ac1f"),r("1276"),r("b680"),r("498a"),r("d81d"),{name:"About",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var r=this;return Object(s["a"])(Object(a["a"])().mark((function e(){return Object(a["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{_getVersion:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){var r;return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI_get("/api/v1/image-info/do/get");case 2:r=t.sent,r.ok&&!e.T.isNothing(r.data)?e.about={version:r.data.CI_COMMIT_REF_NAME,architecture:r.data.ARCHITECTURE,nodeVersion:r.data.NODE_VERSION,pythonVersion:r.data.PYTHON_VERSION,releaseTimestamp:r.data.CREATE_TIMESTAMP}:e.about={version:e.NO_INFO_TEXT,architecture:e.NO_INFO_TEXT,nodeVersion:e.NO_INFO_TEXT,pythonVersion:e.NO_INFO_TEXT,releaseDate:e.NO_INFO_TEXT};case 4:case"end":return t.stop()}}),t)})))()},_getDBSchemaVersion:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){var r;return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.dbSchemaVersionInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/upgrade-info",{query:{seq:"latest"}});case 3:r=t.sent,r.ok?e.T.isNothing(r.data)?e.dbSchemaVersionInfoTEXT="seq = 0":e.dbSchemaVersionInfoTEXT="seq = ".concat(r.data[0].seq):e.dbSchemaVersionInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},_getSysStats:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){var r,n,o,s,c,i;return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.serverCPUPercentInfoTEXT="",e.serverMemoryRSSInfoTEXT="",e.workerCPUPercentInfoTEXT="",e.workerMemoryPSSInfoTEXT="",e.dbDiskUsedInfoTEXT="",e.cacheDBMemoryUsedInfoTEXT="",e.cacheDBKeyUsedInfoTEXT="",e.workerQueueLengthInfoTEXT="",t.next=10,e.T.callAPI_get("/api/v1/monitor/sys-stats/do/get");case 10:if(r=t.sent,r.ok&&!e.T.isNothing(r.data)){for(c in n=function(t,r,n){r=r||"",n=n||"",Array.isArray(t)&&(t={"":t});var o=[],a=0;for(var s in t)s.length>a&&(a=s.length);for(var c in t){var i=t[c];if(!e.T.isNothing(i)){var u=i.slice(-1)[0],T=u[0];if(!(Date.now()-T>9e5)){var l=u[1],d=" ".repeat(a-c.length);Array.isArray(r)&&(r=l>1?r[0]:r[1]),o.push("".concat(n).concat(c).concat(d," = ").concat(l).concat(r))}}}return o.join("\n")},o=r.data,e.serverCPUPercentInfoTEXT=n(o.serverCPUPercent,"%"),e.serverMemoryRSSInfoTEXT=n(o.serverMemoryRSS," MB"),e.workerCPUPercentInfoTEXT=n(o.workerCPUPercent,"%"),e.workerMemoryPSSInfoTEXT=n(o.workerMemoryPSS," MB"),e.dbDiskUsedInfoTEXT=n(o.dbDiskUsed," MB"),e.cacheDBKeyUsedInfoTEXT=n(o.cacheDBKeyUsed,[" Keys"," Key"]),e.cacheDBMemoryUsedInfoTEXT=n(o.cacheDBMemoryUsed," MB"),e.workerQueueLengthInfoTEXT=n(o.workerQueueLength,[" Tasks"," Task"],"#"),s=[],o.workerQueueLength)i=o.workerQueueLength[c],s.push({name:c,value:i.slice(-1)[0][1]});e.workerQueues=s}else e.serverCPUPercentInfoTEXT=e.NO_INFO_TEXT,e.serverMemoryRSSInfoTEXT=e.NO_INFO_TEXT,e.workerCPUPercentInfoTEXT=e.NO_INFO_TEXT,e.workerMemoryPSSInfoTEXT=e.NO_INFO_TEXT,e.dbDiskUsedInfoTEXT=e.NO_INFO_TEXT,e.cacheDBKeyUsedInfoTEXT=e.NO_INFO_TEXT,e.cacheDBMemoryUsedInfoTEXT=e.NO_INFO_TEXT,e.workerQueueLengthInfoTEXT=e.NO_INFO_TEXT;case 12:case"end":return t.stop()}}),t)})))()},_getNodesStats:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){var r,n;return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.nodesStatsInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/monitor/nodes/do/get-stats");case 3:r=t.sent,r.ok&&!e.T.isNothing(r.data)?(n=[],r.data.forEach((function(t){var r=t.node.split("@")[1];n.push("\nNODE = ".concat(r)),n.push("  Pool   = ".concat(t.pool.processes.length," / ").concat(t.pool["max-concurrency"])),n.push("  Proc   = ".concat(t.pool.processes.join(", "))),n.push("  Dist#  = ".concat(t.pool.writes.raw," Tasks")),n.push("  Dist%  = ".concat(t.pool.writes.all)),n.push("  maxrss = ".concat((t.rusage.maxrss/1024).toFixed(2)," MB")),n.push("  ixrss  = ".concat((t.rusage.ixrss/1024).toFixed(2)," MB")),n.push("  idrss  = ".concat((t.rusage.idrss/1024).toFixed(2)," MB")),n.push("  isrss  = ".concat((t.rusage.isrss/1024).toFixed(2)," MB")),e.cacheDBNumberInfoTEXT=" = ".concat(t.broker.virtual_host)})),e.nodesStatsInfoTEXT=n.join("\n").trim()):e.nodesStatsInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},_getNodesActiveQueues:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){var r,n;return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.nodesActiveQueuesInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/monitor/nodes/do/get-active-queues");case 3:r=t.sent,r.ok&&!e.T.isNothing(r.data)?(n=[],r.data.forEach((function(e){var t=e.node.split("@")[1];n.push("\nNODE = ".concat(t));var r=e.activeQueues.map((function(e){return"#"+e.shortName}));n.push("  ".concat(r.join(", "))),n.push("  --- ".concat(e.activeQueues.length," Active Queues ---"))})),e.nodesActiveQueuesInfoTEXT=n.join("\n").trim()):e.nodesActiveQueuesInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},loadData:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:e.$store.commit("updateLoadStatus",!0),e._getVersion();case 2:case"end":return t.stop()}}),t)})))()},getSystemReport:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:e.showSystemReport=!0,e._getDBSchemaVersion(),e._getSysStats(),e._getNodesStats(),e._getNodesActiveQueues();case 5:case"end":return t.stop()}}),t)})))()},clearWorkerQueue:function(e){var t=this;return Object(s["a"])(Object(a["a"])().mark((function r(){return Object(a["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:return r.next=2,t.T.confirm('是否确认清空队列 "#'.concat(e,'" ？'));case 2:if(r.sent){r.next=4;break}return r.abrupt("return");case 4:return r.next=6,t.T.callAPI("post","/api/v1/monitor/worker-queues/do/clear",{body:{workerQueues:[e]},alert:{okMessage:'工作队列 "#'.concat(e,'" 已被清空\n            <br><small>请注意系统报告内数据可能存在延迟<small>')}});case 6:r.sent;case 7:case"end":return r.stop()}}),r)})))()},clearLogCacheTables:function(){var e=this;return Object(s["a"])(Object(a["a"])().mark((function t(){return Object(a["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm("是否确认清空日志/缓存表？");case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("post","/api/v1/log-cache-tables/do/clear",{alert:{okMessage:"日志/缓存表已被清空\n            <br><small>请注意系统报告内数据可能存在延迟<small>"}});case 6:t.sent;case 7:case"end":return t.stop()}}),t)})))()}},computed:{NO_INFO_TEXT:function(){return"暂无数据"},systemReportTEXT:function(){return["[数据库结构版本]",this.dbSchemaVersionInfoTEXT,"\n[Web服务CPU使用率]",this.serverCPUPercentInfoTEXT,"\n[Web服务内存使用量]",this.serverMemoryRSSInfoTEXT,"\n[Worker CPU使用率]",this.workerCPUPercentInfoTEXT,"\n[Worker内存使用量]",this.workerMemoryPSSInfoTEXT,"\n[数据库磁盘使用量]",this.dbDiskUsedInfoTEXT,"\n[缓存数据库序号]",this.cacheDBNumberInfoTEXT,"\n[缓存键数量]",this.cacheDBKeyUsedInfoTEXT,"\n[缓存内存使用量]",this.cacheDBMemoryUsedInfoTEXT,"\n[Worker节点状态]",this.nodesStatsInfoTEXT,"\n[Worker队列分布]",this.nodesActiveQueuesInfoTEXT,"\n[Worker队列长度]",this.workerQueueLengthInfoTEXT].join("\n")},releaseDateTEXT:function(){var e="",t="";if(this.about.releaseTimestamp>0){var r=1e3*this.about.releaseTimestamp;e=this.M.utc(r).locale(this.$store.getters.uiLocale).utcOffset(8).format("YYYY-MM-DD HH:mm:ss"),t=this.M.utc(r).locale(this.$store.getters.uiLocale).fromNow()}return e&&t?"".concat(e," ").concat(this.$t("(")).concat(t).concat(this.$t(")")):"-"}},props:{},data:function(){return{about:{},showSystemReport:!1,dbSchemaVersionInfoTEXT:"",dbDiskUsedInfoTEXT:"",cacheDBNumberInfoTEXT:"",cacheDBKeyUsedInfoTEXT:"",cacheDBMemoryUsedInfoTEXT:"",serverCPUPercentInfoTEXT:"",serverMemoryRSSInfoTEXT:"",workerCPUPercentInfoTEXT:"",workerMemoryPSSInfoTEXT:"",nodesStatsInfoTEXT:"",nodesActiveQueuesInfoTEXT:"",workerQueueLengthInfoTEXT:"",workerQueues:[]}}}),i=c,u=(r("7c8f"),r("9f6d"),r("2877")),T=r("4ef52"),l=Object(u["a"])(i,n,o,!1,null,"0bf6486a",null);"function"===typeof T["default"]&&Object(T["default"])(l);t["default"]=l.exports},"7c8f":function(e,t,r){"use strict";r("2521")},"9f6d":function(e,t,r){"use strict";r("199e")},a9c1:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"About":"关于","System Information":"系统信息","System Report":"系统报告","Infomation":"信息","Version":"版本号","Architecture":"架构","Node Version":"Node 版本","Python Version":"Python 版本","Release date":"发布日期","Loading...":"加载中...","Get System Report":"获取系统报告","Clear Worker Queue":"清空工作队列","Clear Log and Cache":"清空日志与缓存表","Worker Queue cleared":"工作队列已清空","Log and Cache cleared":"日志与缓存表已清空","You are using {browser} (engine: {engine}) browser":"您正在使用 {browser}（{engine}）浏览器"}}'),delete e.options._Ctor}}}]);