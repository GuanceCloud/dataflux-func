(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-31f3b930"],{"054b":function(t,e,a){"use strict";var n=a("1fe4"),r=a.n(n);e["default"]=r.a},"1fe4":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Fixed":"固定","Not Set":"未配置","Config":"配置","Created":"创建时间","Expires":"有效期限","Never":"长期有效","Recent Tasks":"近期任务","Run Now":"立即执行","Crontab Config disabled":"自动触发配置已禁用","Crontab Config enabled":"自动触发配置已启用","Crontab Config deleted":"自动触发配置已删除","Crontab Config Task sent":"自动触发配置任务已发送","Check to show the contents created by outside systems":"勾选后展示由其他系统自动创建的内容","No Crontab Config has ever been added":"从未添加过任何自动触发配置","Are you sure you want to disable the Crontab Config?":"是否确认禁用此自动触发配置？","Are you sure you want to delete the Crontab Config?":"是否确认删除此自动触发配置？","Are you sure you want to send a task of the Crontab Config?":"是否确认立刻发送此自动触发配置的任务？","Integration Func Tasks":"集成函数任务"}}'),delete t.options._Ctor}},"39bd":function(t,e,a){"use strict";a("da87")},da87:function(t,e,a){},f7cf:function(t,e,a){"use strict";a.r(e);var n=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[t._v("\n        "+t._s(t.$t("Crontab Config"))+"\n        "),a("div",{staticClass:"header-control"},[a("el-button",{attrs:{type:"text"},on:{click:function(e){return t.openTaskInfo({id:"cron-AUTORUN"})}}},[t._v(t._s(t.$t("Integration Func Tasks")))]),t._v("\n          　\n\n          "),a("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),a("el-tooltip",{attrs:{content:t.$t("Check to show the contents created by outside systems"),placement:"bottom",enterable:!1}},[a("el-checkbox",{attrs:{border:!0,size:"small","true-label":"API,UI","false-label":""},on:{change:function(e){return t.T.changePageFilter(t.dataFilter)}},model:{value:t.dataFilter.origin,callback:function(e){t.$set(t.dataFilter,"origin",e)},expression:"dataFilter.origin"}},[t._v(t._s(t.$t("Show all")))])],1),t._v(" "),a("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(e){return t.openSetup(null,"add")}}},[a("i",{staticClass:"fa fa-fw fa-plus"}),t._v("\n            "+t._s(t.$t("New"))+"\n          ")])],1)])]),t._v(" "),a("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?a("div",{staticClass:"no-data-area"},[t.T.isPageFiltered({ignore:{origin:"API,UI"}})?a("h1",{staticClass:"no-data-title"},[t._v("当前过滤条件无匹配数据")]):a("h1",{staticClass:"no-data-title"},[t._v(t._s(t.$t("No Crontab Config has ever been added")))]),t._v(" "),a("p",{staticClass:"no-data-tip"},[t._v("\n          使用自动触发配置，可以让函数定时执行\n          "),a("br"),t._v("可灵活运用于数据检测、数据搜集、定时播报等应用场景\n        ")])]):a("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[a("el-table-column",{attrs:{label:t.$t("Func"),"min-width":"420"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("FuncInfo",{attrs:{id:e.row.func_id,title:e.row.func_title,name:e.row.func_name,kwargsJSON:e.row.funcCallKwargsJSON}}),t._v(" "),a("div",[a("span",{staticClass:"text-info"},[t._v("　ID")]),t._v(" "),a("code",{staticClass:"text-code"},[t._v(t._s(e.row.id))]),a("CopyButton",{attrs:{content:e.row.id}}),t._v(" "),t.T.isNothing(e.row.tagsJSON)&&t.T.isNothing(e.row.func_tagsJSON)?t._e():[a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v("　"+t._s(t.$t("Tags")))]),t._v(" "),t._l(e.row.func_tagsJSON,(function(e){return a("el-tag",{key:e,attrs:{size:"mini",type:"info"}},[t._v(t._s(e))])})),t._v(" "),t._l(e.row.tagsJSON,(function(e){return a("el-tag",{key:e,attrs:{size:"mini",type:"warning"}},[t._v(t._s(e))])}))]],2)]}}])}),t._v(" "),a("el-table-column",{attrs:{label:t.$t("Config"),width:"240"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{staticClass:"text-info"},[t._v("Crontab"+t._s(t.$t(":")))]),t._v(" "),e.row.func_extraConfigJSON&&e.row.func_extraConfigJSON.fixedCrontab?[a("code",{staticClass:"text-code"},[t._v(t._s(e.row.func_extraConfigJSON.fixedCrontab))]),t._v(" "),a("el-tag",{attrs:{size:"mini"}},[t._v(t._s(t.$t("Fixed")))])]:e.row.crontab?a("code",{staticClass:"text-code"},[t._v(t._s(e.row.crontab))]):a("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Not Set")))]),t._v(" "),a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Created"))+t._s(t.$t(":")))]),t._v(" "),a("RelativeDateTime",{attrs:{datetime:e.row.createTime}}),t._v(" "),a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Expires"))+t._s(t.$t(":")))]),t._v(" "),e.row.expireTime?[a("RelativeDateTime",{class:t.T.isExpired(e.row.expireTime)?"text-bad":"text-good",attrs:{datetime:e.row.expireTime}})]:a("span",{staticClass:"text-good"},[t._v(t._s(t.$t("Never")))])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:t.$t("Status"),width:"120"},scopedSlots:t._u([{key:"default",fn:function(e){return[e.row.isDisabled?a("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Disabled")))]):a("span",{staticClass:"text-good"},[t._v(t._s(t.$t("Enabled")))])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:t.$t("Note"),width:"160"},scopedSlots:t._u([{key:"default",fn:function(e){return[e.row.note?a("span",{staticClass:"text-info text-small"},[t._v(t._s(e.row.note))]):t._e()]}}])}),t._v(" "),a("el-table-column",{attrs:{align:"right",width:"350"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-button",{attrs:{type:"text",disabled:!e.row.taskInfoCount},on:{click:function(a){return t.openTaskInfo(e.row)}}},[t._v(t._s(t.$t("Recent Tasks"))+" "),e.row.taskInfoCount?a("code",[t._v("("+t._s(t.T.numberLimit(e.row.taskInfoCount))+")")]):t._e()]),t._v(" "),a("el-button",{attrs:{type:"text",disabled:!e.row.func_id},on:{click:function(a){return t.runTask(e.row)}}},[t._v("\n              "+t._s(t.$t("Run Now"))+"\n            ")]),t._v(" "),e.row.isDisabled?a("el-button",{attrs:{disabled:t.T.isNothing(e.row.func_id),type:"text"},on:{click:function(a){return t.quickSubmitData(e.row,"enable")}}},[t._v(t._s(t.$t("Enable")))]):t._e(),t._v(" "),e.row.isDisabled?t._e():a("el-button",{attrs:{disabled:t.T.isNothing(e.row.func_id),type:"text"},on:{click:function(a){return t.quickSubmitData(e.row,"disable")}}},[t._v(t._s(t.$t("Disable")))]),t._v(" "),a("el-button",{attrs:{disabled:t.T.isNothing(e.row.func_id),type:"text"},on:{click:function(a){return t.openSetup(e.row,"setup")}}},[t._v(t._s(t.$t("Setup")))]),t._v(" "),a("el-button",{attrs:{type:"text"},on:{click:function(a){return t.quickSubmitData(e.row,"delete")}}},[t._v(t._s(t.$t("Delete")))])]}}])})],1)],1),t._v(" "),a("Pager",{attrs:{pageInfo:t.pageInfo}})],1)],1)},r=[],s=a("1da1"),o=(a("130f"),a("96cf"),{name:"CrontabConfigList",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){var a,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.T.createListQuery({_withTaskInfoCount:!0}),t.T.isNothing(t.dataFilter.origin)&&(a.origin="UI"),e.next=4,t.T.callAPI_get("/api/v1/crontab-configs/do/list",{query:a});case 4:if(n=e.sent,n.ok){e.next=7;break}return e.abrupt("return");case 7:t.data=n.data,t.pageInfo=n.pageInfo,t.$store.commit("updateLoadStatus",!0);case 10:case"end":return e.stop()}}),e)})))()},quickSubmitData:function(t,e){var a=this;return Object(s["a"])(regeneratorRuntime.mark((function n(){var r;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:n.t0=e,n.next="disable"===n.t0?3:"delete"===n.t0?8:13;break;case 3:return n.next=5,a.T.confirm(a.$t("Are you sure you want to disable the Crontab Config?"));case 5:if(n.sent){n.next=7;break}return n.abrupt("return");case 7:return n.abrupt("break",13);case 8:return n.next=10,a.T.confirm(a.$t("Are you sure you want to delete the Crontab Config?"));case 10:if(n.sent){n.next=12;break}return n.abrupt("return");case 12:return n.abrupt("break",13);case 13:r=null,n.t1=e,n.next="disable"===n.t1?17:"enable"===n.t1?21:"delete"===n.t1?25:29;break;case 17:return n.next=19,a.T.callAPI("post","/api/v1/crontab-configs/:id/do/modify",{params:{id:t.id},body:{data:{isDisabled:!0}},alert:{okMessage:a.$t("Crontab Config disabled")}});case 19:return r=n.sent,n.abrupt("break",29);case 21:return n.next=23,a.T.callAPI("post","/api/v1/crontab-configs/:id/do/modify",{params:{id:t.id},body:{data:{isDisabled:!1}},alert:{okMessage:a.$t("Crontab Config enabled")}});case 23:return r=n.sent,n.abrupt("break",29);case 25:return n.next=27,a.T.callAPI("/api/v1/crontab-configs/:id/do/delete",{params:{id:t.id},alert:{okMessage:a.$t("Crontab Config deleted")}});case 27:return r=n.sent,n.abrupt("break",29);case 29:if(r&&r.ok){n.next=31;break}return n.abrupt("return");case 31:return a.$store.commit("updateHighlightedTableDataId",t.id),n.next=34,a.loadData();case 34:case"end":return n.stop()}}),n)})))()},openSetup:function(t,e){var a=this.T.packRouteQuery();switch(this.$store.commit("updateTableList_scrollY"),e){case"add":this.$router.push({name:"crontab-config-add",query:a});break;case"setup":this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"crontab-config-setup",params:{id:t.id},query:a});break}},openTaskInfo:function(t){var e=this.T.packRouteQuery();this.$store.commit("updateHighlightedTableDataId",t.id),this.$store.commit("updateTableList_scrollY"),this.$router.push({name:"task-info-list",params:{id:t.id},query:e})},runTask:function(t){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function a(){return regeneratorRuntime.wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,e.T.confirm(e.$t("Are you sure you want to send a task of the Crontab Config?"));case 2:if(a.sent){a.next=4;break}return a.abrupt("return");case 4:return a.next=6,e.T.callAPI_get("/api/v1/cron/:id",{params:{id:t.id},alert:{okMessage:e.$t("Crontab Config Task sent")}});case 6:a.sent,e.$store.commit("updateHighlightedTableDataId",t.id);case 8:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch,origin:e.origin}}}}),i=o,u=(a("39bd"),a("2877")),c=a("054b"),l=Object(u["a"])(i,n,r,!1,null,"61e54d80",null);"function"===typeof c["default"]&&Object(c["default"])(l);e["default"]=l.exports}}]);