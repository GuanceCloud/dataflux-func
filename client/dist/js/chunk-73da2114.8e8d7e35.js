(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-73da2114"],{"1c11":function(t,e,a){"use strict";a.r(e);var s=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[t._v("\n        脚本包导入历史\n        "),a("div",{staticClass:"header-control"},[a("el-button",{attrs:{size:"small"},on:{click:function(e){return t.openSetup(null,"import")}}},[a("i",{staticClass:"fa fa-fw fa-cloud-upload"}),t._v("\n            导入脚本包\n          ")])],1)])]),t._v(" "),a("el-main",[t.T.isNothing(t.data)?a("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?a("h1",{staticClass:"no-data-title"},[t._v("当前过滤条件无匹配数据")]):a("h1",{staticClass:"no-data-title"},[t._v("从未导入或安装过脚本包")]),t._v(" "),a("p",{staticClass:"no-data-tip"},[t._v("\n          如需从外部引入脚本集，可以使用导入功能\n          "),a("br"),t._v("导入用的文件，可在系统的「脚本包导出」功能中导出并下载\n        ")])]):[a("el-timeline",t._l(t.data,(function(e){return a("el-timeline-item",{key:e.id,attrs:{placement:"top",size:"large",type:"primary",timestamp:t.T.getDateTimeString(e.createTime)+" ("+t.T.fromNow(e.createTime)+")"}},[a("el-card",{staticClass:"history-card",attrs:{shadow:"hover"}},[a("div",{staticClass:"history-summary"},[a("span",{staticClass:"text-info"},[t._v("脚本集：")]),t._v(" "),t._l(e.summaryJSON.scriptSets,(function(e){return a("el-tag",{key:e.id,attrs:{size:"medium",type:"info"}},[a("code",[t._v(t._s(e.title||e.id))])])}))],2),t._v(" "),t.T.isNothing(e.summaryJSON.dataSources)?t._e():a("div",{staticClass:"history-summary"},[a("span",{staticClass:"text-info"},[t._v("数据源：")]),t._v(" "),t._l(e.summaryJSON.dataSources,(function(e){return a("el-tag",{key:e.id,attrs:{size:"medium",type:"info"}},[a("code",[t._v(t._s(e.title||e.id))])])}))],2),t._v(" "),t.T.isNothing(e.summaryJSON.envVariables)?t._e():a("div",{staticClass:"history-summary"},[a("span",{staticClass:"text-info"},[t._v("环境变量：")]),t._v(" "),t._l(e.summaryJSON.envVariables,(function(e){return a("el-tag",{key:e.id,attrs:{size:"medium",type:"info"}},[a("code",[t._v(t._s(e.title||e.id))])])}))],2),t._v(" "),e.note?a("div",{staticClass:"history-note"},[a("span",{staticClass:"text-info"},[t._v("备注:")]),t._v(" "),a("pre",{staticClass:"text-info text-small"},[t._v(t._s(e.note))])]):t._e()])],1)})),1)]],2)],1)],1)},i=[],r=a("1da1"),n=(a("96cf"),{name:"ScriptSetImportHistoryList",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(r["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function e(){var a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/script-set-import-history/do/list",{query:{pageSize:50}});case 2:if(a=e.sent,a.ok){e.next=5;break}return e.abrupt("return");case 5:t.data=a.data,t.$store.commit("updateLoadStatus",!0);case 7:case"end":return e.stop()}}),e)})))()},openSetup:function(t,e){switch(e){case"import":this.$router.push({name:"script-set-import"});break}}},computed:{},props:{},data:function(){return{data:[]}}}),o=n,c=(a("4e22"),a("2877")),u=Object(c["a"])(o,s,i,!1,null,"127c92fd",null);e["default"]=u.exports},"4e22":function(t,e,a){"use strict";a("cc4b")},cc4b:function(t,e,a){}}]);