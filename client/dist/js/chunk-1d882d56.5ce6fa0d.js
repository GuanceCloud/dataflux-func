(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-1d882d56"],{6332:function(t,e,a){},7708:function(t,e,a){"use strict";a("6332")},"7c45":function(t,e,a){"use strict";a.r(e);var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"list-page-header"},[e("span",[t._v(t._s(t.$t("System Logs")))]),t._v(" "),e("div",{staticClass:"header-control"},[e("div",{staticClass:"log-filter-input"},[e("el-input",{attrs:{placeholder:t.$t("Input filter content"),size:"small"},model:{value:t.logFilter,callback:function(e){t.logFilter=e},expression:"logFilter"}},[t.logFilter?e("i",{staticClass:"el-input__icon el-icon-close text-main",attrs:{slot:"prefix"},on:{click:function(e){t.logFilter=""}},slot:"prefix"}):t._e()])],1)])])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.notNothing(t.filteredData)?e("el-table",{staticClass:"common-table",attrs:{height:"100%",size:"mini","show-header":!1,data:t.filteredData}},[e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(a){return[e("pre",{staticClass:"log-line",class:t.logClass(a.row)},[t._v(t._s(a.row))])]}}],null,!1,1558803519)})],1):t._e()],1)],1)],1)},o=[],s=a("c7eb"),i=a("1da1"),r=(a("99af"),a("fb6a"),a("4de4"),a("d3b7"),{name:"SystemLogs",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t){var e=this;return Object(i["a"])(Object(s["a"])().mark((function a(){var n,o;return Object(s["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return t=t||{},n={},n[e.$store.getters.SYSTEM_INFO("_WEB_TRACE_ID_HEADER")]=e.$store.getters.SYSTEM_INFO("_WEB_PULL_LOG_TRACE_ID"),a.next=5,e.T.callAPI_get("/api/v1/debug/system-logs/do/pull",{headers:n,query:{position:e.nextPosition}});case 5:if(o=a.sent,o&&o.ok){a.next=8;break}return a.abrupt("return");case 8:t.append?e.data=e.data.concat(o.data.logs):e.data=o.data.logs,e.data=e.data.slice(-5e3),e.nextPosition=o.data.nextPosition,e.$store.commit("updateLoadStatus",!0);case 12:case"end":return a.stop()}}),a)})))()},logClass:function(t){var e=t.split(" ")[1];return"[D]"===e?"log-debug":"[I]"===e?"log-info":"[W]"===e?"log-warning":"[E]"===e?"log-error":""}},computed:{filteredData:function(){var t=this;return this.logFilter?this.data.filter((function(e){return e.toLowerCase().indexOf(t.logFilter.toLowerCase())>=0})):this.data}},props:{},data:function(){return{data:[],logFilter:"",nextPosition:null,autoRefreshTimer:null}},mounted:function(){var t=this;this.autoRefreshTimer=setInterval((function(){t.loadData({append:!0})}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}}),l=r,c=(a("7708"),a("2877")),u=a("ce39"),d=Object(c["a"])(l,n,o,!1,null,"79d6aa12",null);"function"===typeof u["default"]&&Object(u["default"])(d);e["default"]=d.exports},ce39:function(t,e,a){"use strict";var n=a("fb09"),o=a.n(n);e["default"]=o.a},fb09:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Input filter content":"输入过滤内容"}}'),delete t.options._Ctor}}}]);