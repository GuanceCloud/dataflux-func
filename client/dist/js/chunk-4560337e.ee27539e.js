(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-4560337e"],{1646:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Auth Type":"认证类型","Config":"配置","No config":"未配置","andMoreConfigs":"以及其他 {n} 项目配置","andMoreUsers":"以及其他 {n} 个用户","API Auth deleted":"API认证已删除","No API Auth has ever been added":"从未添加过任何API认证","Are you sure you want to delete the API Auth?":"是否确认删除此API认证？"}}'),delete t.options._Ctor}},"29c8":function(t,e,a){"use strict";a.r(e);a("b0c0");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"page-header"},[e("span",[t._v(t._s(t.$t("API Auth")))]),t._v(" "),e("div",{staticClass:"header-control"},[e("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),e("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(e){return t.openSetup(null,"add")}}},[e("i",{staticClass:"fa fa-fw fa-plus"}),t._v("\n            "+t._s(t.$t("New"))+"\n          ")])],1)])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No API Auth has ever been added")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          授权链接、批处理的API在默认情况下不需要认证即可访问\n          "),e("br"),t._v("如需要增强安全性，可以创建API认证后，为授权链接、批处理选择所需的API认证\n        ")])]):e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[e("el-table-column",{attrs:{label:t.$t("Name")},scopedSlots:t._u([{key:"default",fn:function(a){return[t._v("\n            "+t._s(a.row.name)+"\n            "),a.row.note?[e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v("　"+t._s(t.$t("Note"))+t._s(t.$t(":")))]),t._v(" "),e("span",[t._v(t._s(a.row.note))])]:t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Auth Type"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(e){return[t._v("\n            "+t._s(t.C.API_AUTH_MAP.get(e.row.type).name)+"\n          ")]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Config")},scopedSlots:t._u([{key:"default",fn:function(a){return["fixedField"===a.row.type?e("span",[t.T.isNothing(a.row.configJSON.fields)?e("span",{staticClass:"text-bad"},[t._v("\n                "+t._s(t.$t("No config"))+"\n              ")]):e("span",[t._v("\n                "+t._s(t.C.API_AUTH_FIXED_FIELD_LOCATION_MAP.get(a.row.configJSON.fields[0].location).name)+"\n                "),e("code",{staticClass:"text-code"},[t._v(t._s(a.row.configJSON.fields[0].name))]),t._v(" "),a.row.configJSON.fields.length>1?e("span",{staticClass:"more-configs-tip"},[e("br"),t._v("　\n                  "+t._s(t.$tc("andMoreConfigs",a.row.configJSON.fields.length-1))+"\n                ")]):t._e()])]):"httpBasic"===a.row.type||"httpDigest"===a.row.type?e("span",[t.T.isNothing(a.row.configJSON.users)?e("span",{staticClass:"text-bad"},[t._v("\n                "+t._s(t.$t("No config"))+"\n              ")]):e("span",[t._v("\n                "+t._s(t.$t("User"))+"\n                "),e("code",{staticClass:"text-code"},[t._v(t._s(a.row.configJSON.users[0].username))]),t._v(" "),a.row.configJSON.users.length>1?e("span",{staticClass:"more-configs-tip"},[e("br"),t._v("　\n                  "+t._s(t.$tc("andMoreUsers",a.row.configJSON.users.length-1))+"\n                ")]):t._e()])]):"func"===a.row.type?e("FuncInfo",{attrs:{id:a.row.func_id,title:a.row.func_title,name:a.row.func_name}}):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"300"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-link",{attrs:{disabled:"func"===a.row.type&&t.T.isNothing(a.row.func_id)},on:{click:function(e){return t.openSetup(a.row,"setup")}}},[t._v(t._s(t.$t("Setup")))]),t._v(" "),e("el-link",{on:{click:function(e){return t.quickSubmitData(a.row,"delete")}}},[t._v(t._s(t.$t("Delete")))])]}}])})],1)],1),t._v(" "),e("Pager",{attrs:{pageInfo:t.pageInfo}})],1)],1)},s=[],r=a("c7eb"),o=a("1da1"),i=(a("130f"),{name:"APIAuthList",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(o["a"])(Object(r["a"])().mark((function t(){return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(){var t=this;return Object(o["a"])(Object(r["a"])().mark((function e(){var a,n;return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery(),e.next=3,t.T.callAPI_get("/api/v1/api-auth/do/list",{query:a});case 3:if(n=e.sent,n.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=n.data,t.pageInfo=n.pageInfo,t.$store.commit("updateLoadStatus",!0);case 9:case"end":return e.stop()}}),e)})))()},quickSubmitData:function(t,e){var a=this;return Object(o["a"])(Object(r["a"])().mark((function n(){var s;return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:n.t0=e,n.next="delete"===n.t0?3:8;break;case 3:return n.next=5,a.T.confirm(a.$t("Are you sure you want to delete the API Auth?"));case 5:if(n.sent){n.next=7;break}return n.abrupt("return");case 7:return n.abrupt("break",8);case 8:s=null,n.t1=e,n.next="delete"===n.t1?12:16;break;case 12:return n.next=14,a.T.callAPI("/api/v1/api-auth/:id/do/delete",{params:{id:t.id},alert:{okMessage:a.$t("API Auth deleted")}});case 14:return s=n.sent,n.abrupt("break",16);case 16:if(s&&s.ok){n.next=18;break}return n.abrupt("return");case 18:return a.$store.commit("updateHighlightedTableDataId",t.id),n.next=21,a.loadData();case 21:case"end":return n.stop()}}),n)})))()},openSetup:function(t,e){var a=this.T.packRouteQuery();switch(this.$store.commit("updateTableList_scrollY"),e){case"add":this.$router.push({name:"api-auth-add",query:a});break;case"setup":this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"api-auth-setup",params:{id:t.id},query:a});break}}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch}}}}),c=i,u=(a("dbdd"),a("2877")),d=a("dd91"),l=a("809f"),f=Object(u["a"])(c,n,s,!1,null,"31230fee",null);"function"===typeof d["default"]&&Object(d["default"])(f),"function"===typeof l["default"]&&Object(l["default"])(f);e["default"]=f.exports},"809f":function(t,e,a){"use strict";var n=a("1646"),s=a.n(n);e["default"]=s.a},8807:function(t,e,a){},"985b":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"andMoreConfigs":"and {n} more config | and {n} more configs","andMoreUsers":"and {n} more user | and {n} more users"}}'),delete t.options._Ctor}},dbdd:function(t,e,a){"use strict";a("8807")},dd91:function(t,e,a){"use strict";var n=a("985b"),s=a.n(n);e["default"]=s.a}}]);