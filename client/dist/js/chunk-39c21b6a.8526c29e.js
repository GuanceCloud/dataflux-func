(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-39c21b6a"],{"1c11":function(t,a,e){"use strict";e.r(a);var s=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"page-header"},[e("span",[t._v("脚本包导入历史")]),t._v(" "),e("div",{staticClass:"header-control"},[e("el-button",{attrs:{size:"small"},on:{click:function(a){return t.openSetup(null,"import")}}},[e("i",{staticClass:"fa fa-fw fa-cloud-upload"}),t._v("\n            导入脚本包\n          ")])],1)])]),t._v(" "),e("el-main",[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v("从未导入或安装过脚本包")]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          如需从外部引入脚本集，可以使用导入功能\n          "),e("br"),t._v("导入用的文件，可在系统的「脚本包导出」功能中导出并下载\n        ")])]):[e("el-timeline",t._l(t.data,(function(a){return e("el-timeline-item",{key:a.id,attrs:{placement:"top",size:"large",type:"primary",timestamp:t.T.getDateTimeString(a.createTime)+" ("+t.T.fromNow(a.createTime)+")"}},[e("el-card",{staticClass:"history-card",attrs:{shadow:"hover"}},[e("div",{staticClass:"history-summary"},[e("span",{staticClass:"text-info"},[t._v("脚本集：")]),t._v(" "),t._l(a.summaryJSON.scriptSets,(function(a){return e("el-tag",{key:a.id,attrs:{size:"medium",type:"info"}},[e("code",[t._v(t._s(a.title||a.id))])])}))],2),t._v(" "),t.T.isNothing(a.summaryJSON.dataSources)?t._e():e("div",{staticClass:"history-summary"},[e("span",{staticClass:"text-info"},[t._v("数据源：")]),t._v(" "),t._l(a.summaryJSON.dataSources,(function(a){return e("el-tag",{key:a.id,attrs:{size:"medium",type:"info"}},[e("code",[t._v(t._s(a.title||a.id))])])}))],2),t._v(" "),t.T.isNothing(a.summaryJSON.envVariables)?t._e():e("div",{staticClass:"history-summary"},[e("span",{staticClass:"text-info"},[t._v("环境变量：")]),t._v(" "),t._l(a.summaryJSON.envVariables,(function(a){return e("el-tag",{key:a.id,attrs:{size:"medium",type:"info"}},[e("code",[t._v(t._s(a.title||a.id))])])}))],2),t._v(" "),a.note?e("div",{staticClass:"history-note"},[e("span",{staticClass:"text-info"},[t._v("备注:")]),t._v(" "),e("pre",{staticClass:"text-info text-small"},[t._v(t._s(a.note))])]):t._e()])],1)})),1)]],2)],1)],1)},i=[],r=e("c7eb"),n=e("1da1"),o={name:"ScriptSetImportHistoryList",components:{},watch:{$route:{immediate:!0,handler:function(t,a){var e=this;return Object(n["a"])(Object(r["a"])().mark((function t(){return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(n["a"])(Object(r["a"])().mark((function a(){var e;return Object(r["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,t.T.callAPI_get("/api/v1/script-set-import-history/do/list",{query:{pageSize:50}});case 2:if(e=a.sent,e.ok){a.next=5;break}return a.abrupt("return");case 5:t.data=e.data,t.$store.commit("updateLoadStatus",!0);case 7:case"end":return a.stop()}}),a)})))()},openSetup:function(t,a){switch(a){case"import":this.$router.push({name:"script-set-import"});break}}},computed:{},props:{},data:function(){return{data:[]}}},c=o,l=(e("8caf"),e("2877")),u=Object(l["a"])(c,s,i,!1,null,"5766bffd",null);a["default"]=u.exports},5789:function(t,a,e){},"8caf":function(t,a,e){"use strict";e("5789")}}]);