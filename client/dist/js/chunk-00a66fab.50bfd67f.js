(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-00a66fab"],{"4ef52":function(e,t,r){"use strict";var n=r("a9c1"),o=r.n(n);t["default"]=o.a},"67f8":function(e,t,r){"use strict";r.r(t);var n=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("transition",{attrs:{name:"fade"}},[e.$store.state.isLoaded?r("el-container",{attrs:{direction:"vertical"}},[r("el-header",{attrs:{height:"60px"}},[r("h1",[e._v(e._s(e.$t("About")))])]),e._v(" "),r("el-main",[r("el-row",{attrs:{gutter:20}},[r("el-col",{attrs:{span:15}},[r("div",{staticClass:"about-form"},[r("p",{staticClass:"text-main browser-detect"},[e._v(e._s(e.$t("You are using {browser} (engine: {engine}) browser",{browser:e.T.getBrowser(),engine:e.T.getEngine()})))]),e._v(" "),r("br"),e._v(" "),r("el-divider",{attrs:{"content-position":"left"}},[r("Logo",{staticStyle:{"margin-bottom":"-9px"},attrs:{type:"auto"}})],1),e._v(" "),r("el-form",{attrs:{"label-width":"120px"}},[r("el-form-item",{attrs:{label:e.$t("Version")}},[r("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.version}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Platform")}},[r("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.platform}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Release date")}},[r("el-input",{attrs:{placeholder:e.$t("Loading..."),readonly:!0,value:e.about.releaseDate}})],1)],1),e._v(" "),r("br"),e._v(" "),r("el-divider",{attrs:{"content-position":"left"}},[r("h1",[e._v(e._s(e.$t("System report")))])]),e._v(" "),r("el-form",{attrs:{"label-width":"120px"}},[e.showSystemReport?[r("el-form-item",[r("el-input",{attrs:{placeholder:e.$t("Loading..."),type:"textarea",autosize:"",resize:"none",readonly:!0,value:e.systemReportTEXT}})],1),e._v(" "),r("el-form-item",[r("InfoBlock",{attrs:{type:"info",title:'节点完整名称为：\n"celery@{编号}"'}}),e._v(" "),r("InfoBlock",{attrs:{type:"info",title:'工作队列完整 Key 格式为：\n"DataFluxFunc-worker#workerQueue@{序号}"'}})],1)]:e._e(),e._v(" "),r("el-form-item",[r("el-button",{on:{click:e.getSystemReport}},[e._v(e._s(e.$t("Get System Report")))])],1),e._v(" "),r("el-form-item",[e.dbDiskUsedInfoTEXT?r("el-button",{on:{click:e.clearLogCacheTables}},[e._v(e._s(e.$t("Clear Log and Cache")))]):e._e(),e._v(" "),e.workerQueues.length>0?r("el-dropdown",{attrs:{trigger:"click"},on:{command:e.clearWorkerQueue}},[r("el-button",[e._v(e._s(e.$t("Clear Worker Queue")))]),e._v(" "),r("el-dropdown-menu",{attrs:{slot:"dropdown"},slot:"dropdown"},e._l(e.workerQueues,(function(t){return r("el-dropdown-item",{key:t.name,attrs:{command:t.name}},[e._v("队列 #"+e._s(t.name)+" (存在 "+e._s(t.value)+" 个待处理任务)")])})),1)],1):e._e()],1)],2)],1)]),e._v(" "),r("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1):e._e()],1)},o=[],a=r("1da1"),s=(r("fb6a"),r("38cf"),r("99af"),r("a15b"),r("d3b7"),r("159b"),r("ac1f"),r("1276"),r("b680"),r("498a"),r("d81d"),r("96cf"),{name:"About",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var r=this;return Object(a["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{_getVersion:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){var r,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI_get("/api/v1/image-info/do/get");case 2:r=t.sent,r.ok&&!e.T.isNothing(r.data)?(n=r.data.CREATE_TIMESTAMP>0?e.M.utc(1e3*r.data.CREATE_TIMESTAMP).locale("zh_CN").utcOffset(8).format("YYYY-MM-DD HH:mm:ss"):"-",e.about={version:r.data.CI_COMMIT_REF_NAME,platform:r.data.PLATFORM,releaseDate:n}):e.about={version:e.NO_INFO_TEXT,platform:e.NO_INFO_TEXT,releaseDate:e.NO_INFO_TEXT};case 4:case"end":return t.stop()}}),t)})))()},_getDBSchemaVersion:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.dbSchemaVersionInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/upgrade-info",{query:{seq:"latest"}});case 3:r=t.sent,r.ok?e.T.isNothing(r.data)?e.dbSchemaVersionInfoTEXT="seq = 0":e.dbSchemaVersionInfoTEXT="seq = ".concat(r.data[0].seq):e.dbSchemaVersionInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},_getSysStats:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){var r,n,o,a,s,c;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.serverCPUPercentInfoTEXT="",e.serverMemoryRSSInfoTEXT="",e.workerCPUPercentInfoTEXT="",e.workerMemoryPSSInfoTEXT="",e.dbDiskUsedInfoTEXT="",e.cacheDBMemoryUsedInfoTEXT="",e.cacheDBKeyUsedInfoTEXT="",e.workerQueueLengthInfoTEXT="",t.next=10,e.T.callAPI_get("/api/v1/monitor/sys-stats/do/get");case 10:if(r=t.sent,r.ok&&!e.T.isNothing(r.data)){for(s in n=function(t,r,n){r=r||"",n=n||"",Array.isArray(t)&&(t={"":t});var o=[],a=0;for(var s in t)s.length>a&&(a=s.length);for(var c in t){var i=t[c];if(!e.T.isNothing(i)){var u=i.slice(-1)[0],T=u[0];if(!(Date.now()-T>9e5)){var l=u[1],f=" ".repeat(a-c.length);Array.isArray(r)&&(r=l>1?r[0]:r[1]),o.push("".concat(n).concat(c).concat(f," = ").concat(l).concat(r))}}}return o.join("\n")},o=r.data,e.serverCPUPercentInfoTEXT=n(o.serverCPUPercent,"%"),e.serverMemoryRSSInfoTEXT=n(o.serverMemoryRSS," MB"),e.workerCPUPercentInfoTEXT=n(o.workerCPUPercent,"%"),e.workerMemoryPSSInfoTEXT=n(o.workerMemoryPSS," MB"),e.dbDiskUsedInfoTEXT=n(o.dbDiskUsed," MB"),e.cacheDBKeyUsedInfoTEXT=n(o.cacheDBKeyUsed,[" Keys"," Key"]),e.cacheDBMemoryUsedInfoTEXT=n(o.cacheDBMemoryUsed," MB"),e.workerQueueLengthInfoTEXT=n(o.workerQueueLength,[" Tasks"," Task"],"#"),a=[],o.workerQueueLength)c=o.workerQueueLength[s],a.push({name:s,value:c.slice(-1)[0][1]});e.workerQueues=a}else e.serverCPUPercentInfoTEXT=e.NO_INFO_TEXT,e.serverMemoryRSSInfoTEXT=e.NO_INFO_TEXT,e.workerCPUPercentInfoTEXT=e.NO_INFO_TEXT,e.workerMemoryPSSInfoTEXT=e.NO_INFO_TEXT,e.dbDiskUsedInfoTEXT=e.NO_INFO_TEXT,e.cacheDBKeyUsedInfoTEXT=e.NO_INFO_TEXT,e.cacheDBMemoryUsedInfoTEXT=e.NO_INFO_TEXT,e.workerQueueLengthInfoTEXT=e.NO_INFO_TEXT;case 12:case"end":return t.stop()}}),t)})))()},_getNodesStats:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){var r,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.nodesStatsInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/monitor/nodes/do/get-stats");case 3:r=t.sent,r.ok&&!e.T.isNothing(r.data)?(n=[],r.data.forEach((function(t){var r=t.node.split("@")[1];n.push("\nNODE = ".concat(r)),n.push("  Pool   = ".concat(t.pool.processes.length," / ").concat(t.pool["max-concurrency"])),n.push("  Proc   = ".concat(t.pool.processes.join(", "))),n.push("  Dist#  = ".concat(t.pool.writes.raw," Tasks")),n.push("  Dist%  = ".concat(t.pool.writes.all)),n.push("  maxrss = ".concat((t.rusage.maxrss/1024).toFixed(2)," MB")),n.push("  ixrss  = ".concat((t.rusage.ixrss/1024).toFixed(2)," MB")),n.push("  idrss  = ".concat((t.rusage.idrss/1024).toFixed(2)," MB")),n.push("  isrss  = ".concat((t.rusage.isrss/1024).toFixed(2)," MB")),e.cacheDBNumberInfoTEXT=" = ".concat(t.broker.virtual_host)})),e.nodesStatsInfoTEXT=n.join("\n").trim()):e.nodesStatsInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},_getNodesActiveQueues:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){var r,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.nodesActiveQueuesInfoTEXT="",t.next=3,e.T.callAPI_get("/api/v1/monitor/nodes/do/get-active-queues");case 3:r=t.sent,r.ok&&!e.T.isNothing(r.data)?(n=[],r.data.forEach((function(e){var t=e.node.split("@")[1];n.push("\nNODE = ".concat(t));var r=e.activeQueues.map((function(e){return"#"+e.shortName}));n.push("  ".concat(r.join(", "))),n.push("  --- ".concat(e.activeQueues.length," Active Queues ---"))})),e.nodesActiveQueuesInfoTEXT=n.join("\n").trim()):e.nodesActiveQueuesInfoTEXT=e.NO_INFO_TEXT;case 5:case"end":return t.stop()}}),t)})))()},loadData:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:e.$store.commit("updateLoadStatus",!0),e._getVersion();case 2:case"end":return t.stop()}}),t)})))()},getSystemReport:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:e.showSystemReport=!0,e._getDBSchemaVersion(),e._getSysStats(),e._getNodesStats(),e._getNodesActiveQueues();case 5:case"end":return t.stop()}}),t)})))()},clearWorkerQueue:function(e){var t=this;return Object(a["a"])(regeneratorRuntime.mark((function r(){return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return r.next=2,t.T.confirm('是否确认清空队列 "#'.concat(e,'" ？'));case 2:if(r.sent){r.next=4;break}return r.abrupt("return");case 4:return r.next=6,t.T.callAPI("post","/api/v1/monitor/worker-queues/do/clear",{body:{workerQueues:[e]},alert:{okMessage:'工作队列 "#'.concat(e,'" 已被清空\n            <br><small>请注意系统报告内数据可能存在延迟<small>')}});case 6:r.sent;case 7:case"end":return r.stop()}}),r)})))()},clearLogCacheTables:function(){var e=this;return Object(a["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm("是否确认清空日志/缓存表？");case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("post","/api/v1/log-cache-tables/do/clear",{alert:{okMessage:"日志/缓存表已被清空\n            <br><small>请注意系统报告内数据可能存在延迟<small>"}});case 6:t.sent;case 7:case"end":return t.stop()}}),t)})))()}},computed:{NO_INFO_TEXT:function(){return"暂无数据"},systemReportTEXT:function(){return["[数据库结构版本]",this.dbSchemaVersionInfoTEXT,"\n[Web服务CPU使用率]",this.serverCPUPercentInfoTEXT,"\n[Web服务内存使用量]",this.serverMemoryRSSInfoTEXT,"\n[Worker CPU使用率]",this.workerCPUPercentInfoTEXT,"\n[Worker内存使用量]",this.workerMemoryPSSInfoTEXT,"\n[数据库磁盘使用量]",this.dbDiskUsedInfoTEXT,"\n[缓存数据库序号]",this.cacheDBNumberInfoTEXT,"\n[缓存键数量]",this.cacheDBKeyUsedInfoTEXT,"\n[缓存内存使用量]",this.cacheDBMemoryUsedInfoTEXT,"\n[Worker节点状态]",this.nodesStatsInfoTEXT,"\n[Worker队列分布]",this.nodesActiveQueuesInfoTEXT,"\n[Worker队列长度]",this.workerQueueLengthInfoTEXT].join("\n")}},props:{},data:function(){return{about:{},showSystemReport:!1,dbSchemaVersionInfoTEXT:"",dbDiskUsedInfoTEXT:"",cacheDBNumberInfoTEXT:"",cacheDBKeyUsedInfoTEXT:"",cacheDBMemoryUsedInfoTEXT:"",serverCPUPercentInfoTEXT:"",serverMemoryRSSInfoTEXT:"",workerCPUPercentInfoTEXT:"",workerMemoryPSSInfoTEXT:"",nodesStatsInfoTEXT:"",nodesActiveQueuesInfoTEXT:"",workerQueueLengthInfoTEXT:"",workerQueues:[]}}}),c=s,i=(r("ebac"),r("ae5b"),r("2877")),u=r("4ef52"),T=Object(i["a"])(c,n,o,!1,null,"b705dfec",null);"function"===typeof u["default"]&&Object(u["default"])(T);t["default"]=T.exports},a5c9:function(e,t,r){},a9c1:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"About":"关于","Version":"版本号","Platform":"平台","Release date":"发布日期","Loading...":"加载中...","System report":"系统报告","Get System Report":"获取系统报告","Clear Worker Queue":"清空工作队列","Clear Log and Cache":"清空日志与缓存表","Worker Queue cleared":"工作队列已清空","Log and Cache cleared":"日志与缓存表已清空","You are using {browser} (engine: {engine}) browser":"您正在使用 {browser}（{engine}）浏览器"}}'),delete e.options._Ctor}},ade3c:function(e,t,r){},ae5b:function(e,t,r){"use strict";r("ade3c")},ebac:function(e,t,r){"use strict";r("a5c9")}}]);