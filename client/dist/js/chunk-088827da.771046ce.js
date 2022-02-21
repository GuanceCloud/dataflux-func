(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-088827da"],{3286:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Administrator":"系统管理员","User disabled":"用户已禁用","User enabled":"用户已启用","No User has ever been added":"从未添加过任何用户","Are you sure you want to disable the User?":"是否确认禁用此用户？"}}'),delete e.options._Ctor}},ac7d:function(e,t,a){"use strict";var r=a("3286"),s=a.n(r);t["default"]=s.a},fbd0:function(e,t,a){"use strict";a.r(t);var r=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("div",{staticClass:"page-header"},[a("span",[e._v(e._s(e.$t("User Manager")))]),e._v(" "),a("div",{staticClass:"header-control"},[a("FuzzySearchInput",{attrs:{dataFilter:e.dataFilter}}),e._v(" "),a("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(t){return e.openSetup(null,"add")}}},[a("i",{staticClass:"fa fa-fw fa-plus"}),e._v("\n            "+e._s(e.$t("New"))+"\n          ")])],1)])]),e._v(" "),a("el-main",{staticClass:"common-table-container"},[e.T.isNothing(e.data)?a("div",{staticClass:"no-data-area"},[e.T.isPageFiltered()?a("h1",{staticClass:"no-data-title"},[e._v(e._s(e.$t("No matched data found")))]):a("h1",{staticClass:"no-data-title"},[e._v(e._s(e.$t("No User has ever been added")))]),e._v(" "),a("p",{staticClass:"no-data-tip"},[e._v("\n          添加成员，允许其他用户使用本平台\n        ")])]):e._e(),e._v(" "),a("el-table",{staticClass:"common-table",attrs:{height:"100%",data:e.data,"row-class-name":e.T.getHighlightRowCSS}},[a("el-table-column",{attrs:{label:e.$t("Username")},scopedSlots:e._u([{key:"default",fn:function(t){return[a("code",{staticClass:"text-code text-small"},[e._v(e._s(t.row.username))]),a("CopyButton",{attrs:{content:t.row.username}})]}}])}),e._v(" "),a("el-table-column",{attrs:{label:e.$t("Name")},scopedSlots:e._u([{key:"default",fn:function(t){return[a("span",[e._v(e._s(t.row.name))])]}}])}),e._v(" "),a("el-table-column",{attrs:{label:e.$t("Status"),width:"100"},scopedSlots:e._u([{key:"default",fn:function(t){return[t.row.isDisabled?a("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Disabled")))]):a("span",{staticClass:"text-good"},[e._v(e._s(e.$t("Enabled")))])]}}])}),e._v(" "),a("el-table-column",{attrs:{align:"right",width:"200"},scopedSlots:e._u([{key:"default",fn:function(t){return[Array.isArray(t.row.roles)&&t.row.roles.indexOf("sa")>=0?a("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Administrator")))]):[t.row.isDisabled?a("el-link",{on:{click:function(a){return e.quickSubmitData(t.row,"enable")}}},[e._v(e._s(e.$t("Enable")))]):a("el-link",{on:{click:function(a){return e.quickSubmitData(t.row,"disable")}}},[e._v(e._s(e.$t("Disable")))]),e._v(" "),a("el-link",{on:{click:function(a){return e.openSetup(t.row,"setup")}}},[e._v(e._s(e.$t("Setup")))])]]}}])})],1)],1),e._v(" "),a("Pager",{attrs:{pageInfo:e.pageInfo}})],1)],1)},s=[],n=a("1da1"),i=(a("130f"),a("96cf"),{name:"UserList",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(n["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:case"end":return e.stop()}}),e)})))()}},"$store.state.isLoaded":function(e){var t=this;e&&setImmediate((function(){return t.T.autoScrollTable()}))}},methods:{loadData:function(){var e=this;return Object(n["a"])(regeneratorRuntime.mark((function t(){var a,r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.dataFilter=e.T.createListQuery({sort:["seq"]}),t.next=3,e.T.callAPI_get("/api/v1/users/do/list",{query:a});case 3:if(r=t.sent,r.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=r.data,e.pageInfo=r.pageInfo,e.$store.commit("updateLoadStatus",!0);case 9:case"end":return t.stop()}}),t)})))()},quickSubmitData:function(e,t){var a=this;return Object(n["a"])(regeneratorRuntime.mark((function r(){var s;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:r.t0=t,r.next="disable"===r.t0?3:8;break;case 3:return r.next=5,a.T.confirm(a.$t("Are you sure you want to disable the User?"));case 5:if(r.sent){r.next=7;break}return r.abrupt("return");case 7:return r.abrupt("break",8);case 8:s=null,r.t1=t,r.next="disable"===r.t1?12:"enable"===r.t1?16:20;break;case 12:return r.next=14,a.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.id},body:{data:{isDisabled:!0}},alert:{okMessage:a.$t("User disabled")}});case 14:return s=r.sent,r.abrupt("break",20);case 16:return r.next=18,a.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.id},body:{data:{isDisabled:!1}},alert:{okMessage:a.$t("User enabled")}});case 18:return s=r.sent,r.abrupt("break",20);case 20:if(s&&s.ok){r.next=22;break}return r.abrupt("return");case 22:return a.$store.commit("updateHighlightedTableDataId",e.id),r.next=25,a.loadData();case 25:case"end":return r.stop()}}),r)})))()},openSetup:function(e,t){var a=this.T.packRouteQuery();switch(t){case"add":this.$router.push({name:"user-add",query:a});break;case"setup":this.$store.commit("updateHighlightedTableDataId",e.id),this.$router.push({name:"user-setup",params:{id:e.id},query:a});break}}},computed:{},props:{},data:function(){var e=this.T.createPageInfo(),t=this.T.createListQuery();return{data:[],pageInfo:e,dataFilter:{_fuzzySearch:t._fuzzySearch}}}}),o=i,u=a("2877"),l=a("ac7d"),c=Object(u["a"])(o,r,s,!1,null,"1d539c0f",null);"function"===typeof l["default"]&&Object(l["default"])(c);t["default"]=c.exports}}]);