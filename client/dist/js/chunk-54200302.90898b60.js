(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-54200302"],{"119b":function(t,e,n){"use strict";var o=n("dbe9"),a=n.n(o);e["default"]=a.a},2505:function(t,e,n){},"25c3":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Input filter content":"輸入過濾內容"}}'),delete t.options._Ctor}},"7c45":function(t,e,n){"use strict";n.r(e);var o=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"common-page-header"},[e("h1",[t._v(t._s(t.$t("System Logs")))]),t._v(" "),e("div",{staticClass:"header-control"},[e("div",{staticClass:"log-filter-input"},[e("el-input",{attrs:{placeholder:t.$t("Input filter content"),size:"small"},model:{value:t.logFilter,callback:function(e){t.logFilter=e},expression:"logFilter"}},[t.logFilter?e("i",{staticClass:"el-input__icon el-icon-close text-main",attrs:{slot:"prefix"},on:{click:function(e){t.logFilter=""}},slot:"prefix"}):t._e()])],1)])])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.notNothing(t.filteredData)?e("el-table",{staticClass:"common-table",attrs:{height:"100%",size:"mini","show-header":!1,data:t.filteredData}},[e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(n){return[e("pre",{staticClass:"log-line",class:t.logClass(n.row)},[t._v(t._s(n.row))])]}}],null,!1,1558803519)})],1):t._e()],1)],1)],1)},a=[],i=n("c7eb"),s=n("1da1"),r=(n("99af"),n("4de4"),n("fb6a"),n("d3b7"),{name:"SystemLogs",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var n=this;return Object(s["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,n.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t){var e=this;return Object(s["a"])(Object(i["a"])().mark((function n(){var o,a;return Object(i["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return t=t||{},o={},o[e.$store.getters.SYSTEM_INFO("_WEB_TRACE_ID_HEADER")]=e.$store.getters.SYSTEM_INFO("_WEB_PULL_LOG_TRACE_ID"),n.next=5,e.T.callAPI_get("/api/v1/debug/system-logs/do/pull",{headers:o,query:{position:e.nextPosition}});case 5:if(a=n.sent,a&&a.ok){n.next=8;break}return n.abrupt("return");case 8:t.append?e.data=e.data.concat(a.data.logs):e.data=a.data.logs,e.data=e.data.slice(-5e3),e.nextPosition=a.data.nextPosition,e.$store.commit("updateLoadStatus",!0);case 12:case"end":return n.stop()}}),n)})))()},logClass:function(t){var e=t.split(" ")[1];return"[D]"===e?"log-debug":"[I]"===e?"log-info":"[W]"===e?"log-warning":"[E]"===e?"log-error":""}},computed:{filteredData:function(){var t=this;return this.logFilter?this.data.filter((function(e){return e.toLowerCase().indexOf(t.logFilter.toLowerCase())>=0})):this.data}},props:{},data:function(){return{data:[],logFilter:"",nextPosition:null,autoRefreshTimer:null}},mounted:function(){var t=this;this.autoRefreshTimer=setInterval((function(){t.loadData({append:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}}),l=r,c=(n("a727"),n("2877")),u=n("ce39"),d=n("b0b2"),f=n("119b"),p=Object(c["a"])(l,o,a,!1,null,"6c47feb8",null);"function"===typeof u["default"]&&Object(u["default"])(p),"function"===typeof d["default"]&&Object(d["default"])(p),"function"===typeof f["default"]&&Object(f["default"])(p);e["default"]=p.exports},a727:function(t,e,n){"use strict";n("2505")},b0b2:function(t,e,n){"use strict";var o=n("25c3"),a=n.n(o);e["default"]=a.a},ce39:function(t,e,n){"use strict";var o=n("fb09"),a=n.n(o);e["default"]=a.a},dbe9:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Input filter content":"輸入過濾內容"}}'),delete t.options._Ctor}},fb09:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Input filter content":"输入过滤内容"}}'),delete t.options._Ctor}}}]);