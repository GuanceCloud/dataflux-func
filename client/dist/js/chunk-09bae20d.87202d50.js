(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-09bae20d"],{"11a9":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"ScriptSetCount":"No Script Set included | Includes {n} Script Set | Includes {n} Script Sets"}}'),delete t.options._Ctor}},1855:function(t,e,a){},"5a39":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Branch":"分支","Access Timeout":"访问超时","Locked by other user ({user})":"被其他用户（{user}）锁定","Locked by you":"被您锁定","Add Official Script Market":"添加官方脚本市场","Script Market deleted":"脚本市场已删除","Script Market pinned":"脚本市场已置顶","Script Market unpinned":"脚本市场已取消置顶","Script Market locked":"脚本市场已上锁","Script Market unlocked":"脚本市场已解锁","No Script Market has ever been added":"从未添加过任何脚本市场","Are you sure you want to delete the Script Market?":"是否确认删除此脚本市场？","Official Script Market added":"官方脚本市场已添加","ScriptSetCount":"不包含任何脚本集 | 包含 {n} 个脚本集 | 包含 {n} 个脚本集","Open Script Market Homepage":"打开脚本市场主页","Checking Update...":"正在检查更新...","Deleting...":"正在删除..."}}'),delete t.options._Ctor}},8188:function(t,e,a){},"941a":function(t,e,a){"use strict";a("8188")},a437:function(t,e,a){"use strict";var r=a("11a9"),i=a.n(r);e["default"]=i.a},a906:function(t,e,a){"use strict";a("1855")},f5cb:function(t,e,a){"use strict";var r=a("5a39"),i=a.n(r);e["default"]=i.a},fb98:function(t,e,a){"use strict";a.r(e);var r=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[t.$store.state.isLoaded?t._e():e("PageLoading"),t._v(" "),e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"},{name:"loading",rawName:"v-loading.fullscreen.lock",value:t.isProcessing,expression:"isProcessing",modifiers:{fullscreen:!0,lock:!0}}],attrs:{direction:"vertical","element-loading-spinner":"el-icon-loading","element-loading-text":t.processingText}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"page-header"},[e("span",[t._v(t._s(t.$t("Script Market")))]),t._v(" "),e("div",{staticClass:"header-control"},[t.$root.variableConfig["OFFICIAL_SCRIPT_MARKET_ENABLED"]?[t.hasOfficialScriptMarket?t._e():e("el-link",{on:{click:t.createOfficialScriptMarket}},[e("i",{staticClass:"fa fa-fw fa-star"}),t._v("\n              "+t._s(t.$t("Add Official Script Market"))+"\n            ")]),t._v("\n            　\n          ")]:t._e(),t._v(" "),e("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),e("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(e){return t.openSetup(null,"add")}}},[e("i",{staticClass:"fa fa-fw fa-plus"}),t._v("\n            "+t._s(t.$t("Add"))+"\n          ")]),t._v(" "),e("el-button",{attrs:{type:"primary",plain:"",size:"small",disabled:t.isProcessing},on:{click:t.checkUpdate}},[t.isProcessing?e("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}):e("i",{staticClass:"fa fa-fw fa-refresh"}),t._v("\n            "+t._s(t.$t("Check Update"))+"\n          ")])],2)])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Script Market has ever been added")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          添加脚本市场后，可以从脚本市场安装现成脚本集，或将本地脚本集推送到市场\n        ")])]):e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[e("el-table-column",{attrs:{label:t.$t("Type"),width:"210",align:"center"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isOfficial?e("i",{staticClass:"fa fa-fw fa-3x fa-star text-watch"}):e("el-image",{staticClass:"script-market-logo",class:t.common.getScriptMarketClass(a.row),attrs:{src:t.common.getScriptMarketLogo(a.row)}})]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Script Market")},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isPinned?e("el-tooltip",{attrs:{effect:"dark",content:t.$t("Pinned"),placement:"top",enterable:!1}},[e("i",{staticClass:"fa fa-fw fa-thumb-tack text-bad"})]):t._e(),t._v(" "),e("strong",{staticClass:"script-market-name",class:a.row.isPinned?"text-bad":""},[a.row.isOfficial?e("span",[t._v(t._s(t.$t("Official Script Market")))]):e("span",[t._v(t._s(t.common.getScriptMarketName(a.row)))])]),t._v(" "),e("div",[a.row.isOfficial?t._e():["git"===a.row.type?[e("span",{staticClass:"text-info"},[t._v("URL")]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.url))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.configJSON.url}}),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Branch")))]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.branch||t.$t("Default")))])]:t._e(),t._v(" "),"aliyunOSS"===a.row.type?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Endpoint")))]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.endpoint))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.configJSON.endpoint}}),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v("Bucket")]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.bucket))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.configJSON.bucket}}),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Folder")))]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.folder))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.configJSON.folder}})]:t._e(),t._v(" "),"httpService"===a.row.type?[e("span",{staticClass:"text-info"},[t._v("URL")]),t._v("\n                   "),e("code",{staticClass:"text-main code-font"},[t._v(t._s(a.row.configJSON.url))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.configJSON.url}})]:t._e(),t._v(" "),e("br")],t._v(" "),e("div",{staticClass:"script-market-extra-info"},[e("span",[t._v(t._s(t.$tc("ScriptSetCount",(a.row.scriptSets||[]).length)))]),t._v(" "),a.row.extra.homepageURL||"git"===a.row.type?[t._v("\n                   \n                  "),e("el-button",{attrs:{type:"primary",round:"",plain:"",size:"mini"},on:{click:function(e){return t.T.openURL(a.row.extra.homepageURL||a.row.configJSON.url)}}},[t._v("\n                    "+t._s(t.$t("Open Script Market Homepage"))+"\n                  ")])]:t._e()],2)],2),t._v(" "),a.row.error?e("InfoBlock",{attrs:{title:a.row.error,type:"error"}}):t._e()]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"left",width:"50"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-tooltip",{attrs:{effect:"dark",content:a.row.isLockedByOther?t.$t("Locked by other user ({user})",{user:a.row.lockedByUser}):t.$t("Locked by you"),placement:"top",enterable:!1}},[e("i",{staticClass:"fa fa-fw fa-2x",class:[a.row.isLocked?"fa-lock":"",a.row.isLockedByOther?"text-bad":"text-good"]})])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"120"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isTimeout?e("span",{staticClass:"text-bad"},[t._v("\n              "+t._s(t.$t("Access Timeout"))+"\n            ")]):e("el-badge",{attrs:{value:t.common.getScriptMarketUpdateBadge(a.row.id)}},[e("el-button",{staticStyle:{width:"87px"},attrs:{type:"primary",size:"small",plain:!a.row.isAdmin},on:{click:function(e){return t.openDetail(a.row)}}},[e("i",{staticClass:"fa fa-fw",class:a.row.isAdmin?"fa-wrench":"fa-th-large"}),t._v("\n                "+t._s(a.row.isAdmin?t.$t("Admin"):t.$t("Detail"))+"\n              ")])],1)]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"270"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-link",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{disabled:!a.row.isAccessible},on:{click:function(e){return t.quickSubmitData(a.row,a.row.isPinned?"unpin":"pin")}}},[t._v("\n              "+t._s(a.row.isPinned?t.$t("Unpin"):t.$t("Pin"))+"\n            ")]),t._v(" "),e("el-link",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{disabled:!a.row.isAccessible},on:{click:function(e){return t.lockData(a.row.id,!a.row.isLocked)}}},[t._v("\n              "+t._s(a.row.isLocked?t.$t("Unlock"):t.$t("Lock"))+"\n            ")]),t._v(" "),e("el-link",{attrs:{disabled:a.row.isOfficial||!a.row.isAccessible},on:{click:function(e){return t.openSetup(a.row,"setup")}}},[t._v("\n              "+t._s(t.$t("Setup"))+"\n            ")]),t._v(" "),e("el-link",{attrs:{disabled:!a.row.isAccessible},on:{click:function(e){return t.quickSubmitData(a.row,"delete")}}},[t._v("\n              "+t._s(t.$t("Delete"))+"\n            ")])]}}])})],1)],1)],1)],1)},i=[],n=a("c7eb"),s=a("1da1"),c=(a("130f"),a("4de4"),a("d3b7"),a("159b"),a("14d9"),{name:"ScriptMarketList",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(s["a"])(Object(n["a"])().mark((function t(){return Object(n["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}},"$store.state.isLoaded":function(t){var e=this;t&&setImmediate((function(){return e.T.autoScrollTable()}))}},methods:{loadData:function(t){var e=this;return Object(s["a"])(Object(n["a"])().mark((function a(){var r,i;return Object(n["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(t=t||{},!t.runCheckUpdate){a.next=4;break}return a.next=4,e.T.callAPI_get("/api/v1/script-markets/do/check-update");case 4:return r=e.dataFilter=e.T.createListQuery(),a.next=7,e.T.callAPI_get("/api/v1/script-markets/do/list",{query:r});case 7:if(i=a.sent,i&&i.ok){a.next=10;break}return a.abrupt("return");case 10:e.$root.variableConfig["OFFICIAL_SCRIPT_MARKET_ENABLED"]||(i.data=i.data.filter((function(t){return!t.isOfficial}))),i.data.forEach((function(t){t.lockedByUser="".concat(t.lockedByUserName||t.lockedByUsername||e.$t("UNKNOW")),t.isLockedByMe=t.lockedByUserId===e.$store.getters.userId,t.isLockedByOther=t.lockedByUserId&&!t.isLockedByMe,t.isAccessible=e.$store.getters.isAdmin||!t.isLockedByOther,t.isLocked=t.isLockedByMe||t.isLockedByOther})),e.data=i.data,e.$store.commit("updateLoadStatus",!0);case 14:case"end":return a.stop()}}),a)})))()},quickSubmitData:function(t,e){var a=this;return Object(s["a"])(Object(n["a"])().mark((function r(){var i,s;return Object(n["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:i=null,r.t0=e,r.next="delete"===r.t0?4:12;break;case 4:return r.next=6,a.T.callAPI_getOne("/api/v1/script-markets/do/list",t.id);case 6:if(i=r.sent,i&&i.ok){r.next=9;break}return r.abrupt("return");case 9:if("git"!==i.data.type||!i.data.isAdmin||a.$root.checkUserProfileForGit()){r.next=11;break}return r.abrupt("return");case 11:return r.abrupt("break",12);case 12:r.t1=e,r.next="delete"===r.t1?15:20;break;case 15:return r.next=17,a.T.confirm(a.$t("Are you sure you want to delete the Script Market?"));case 17:if(r.sent){r.next=19;break}return r.abrupt("return");case 19:return r.abrupt("break",20);case 20:s=null,r.t2=e,r.next="pin"===r.t2?24:"unpin"===r.t2?29:"delete"===r.t2?34:41;break;case 24:return s=!1,r.next=27,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:t.id},body:{data:{isPinned:!0}},alert:{okMessage:a.$t("Script Market pinned")}});case 27:return i=r.sent,r.abrupt("break",41);case 29:return s=!1,r.next=32,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:t.id},body:{data:{isPinned:!1}},alert:{okMessage:a.$t("Script Market unpinned")}});case 32:return i=r.sent,r.abrupt("break",41);case 34:return s=!0,a.processingText=a.$t("Deleting..."),a.isProcessing=!0,r.next=39,a.T.callAPI("/api/v1/script-markets/:id/do/delete",{params:{id:t.id},alert:{okMessage:a.$t("Script Market deleted")}});case 39:return i=r.sent,r.abrupt("break",41);case 41:if(i&&i.ok){r.next=43;break}return r.abrupt("return");case 43:return a.$store.commit("updateHighlightedTableDataId",t.id),r.next=46,a.loadData({runCheckUpdate:s});case 46:a.isProcessing=!1;case 47:case"end":return r.stop()}}),r)})))()},openSetup:function(t,e){var a=this.T.packRouteQuery();switch(this.$store.commit("updateTableList_scrollY"),e){case"add":this.$router.push({name:"script-market-add",query:a});break;case"setup":this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"script-market-setup",params:{id:t.id},query:a});break}},openDetail:function(t){var e=this.T.packRouteQuery();this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"script-market-detail",params:{id:t.id},query:e})},checkUpdate:function(){var t=this;return Object(s["a"])(Object(n["a"])().mark((function e(){var a,r,i,s;return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return t.processingText=t.$t("Checking Update..."),t.isProcessing=!0,a=1e3,r=Date.now(),e.next=6,t.common.checkScriptMarketUpdate();case 6:return e.next=8,t.loadData();case 8:i=Date.now(),s=i-r,s>a?t.isProcessing=!1:setTimeout((function(){t.isProcessing=!1}),a-s);case 11:case"end":return e.stop()}}),e)})))()},createOfficialScriptMarket:function(){var t=this;return Object(s["a"])(Object(n["a"])().mark((function e(){var a;return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI("post","/api/v1/script-markets/do/add-official",{alert:{okMessage:t.$t("Official Script Market added")}});case 2:if(a=e.sent,a&&a.ok){e.next=5;break}return e.abrupt("return");case 5:return t.$store.commit("updateHighlightedTableDataId",a.data.id),e.next=8,t.loadData();case 8:case"end":return e.stop()}}),e)})))()},lockData:function(t,e){var a=this;return Object(s["a"])(Object(n["a"])().mark((function r(){var i,s;return Object(n["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:return i=e?a.$t("Script Market locked"):a.$t("Script Market unlocked"),r.next=3,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:t},body:{data:{isLocked:e}},alert:{okMessage:i}});case 3:if(s=r.sent,s&&s.ok){r.next=6;break}return r.abrupt("return");case 6:return r.next=8,a.loadData();case 8:case"end":return r.stop()}}),r)})))()}},computed:{hasOfficialScriptMarket:function(){for(var t=0;t<this.data.length;t++)if(this.data[t].isOfficial)return!0;return!1}},props:{},data:function(){var t=this.T.createListQuery();return{data:[],dataFilter:{_fuzzySearch:t._fuzzySearch},isProcessing:!1,processingText:null}}}),o=c,l=(a("a906"),a("941a"),a("2877")),d=a("a437"),u=a("f5cb"),p=Object(l["a"])(o,r,i,!1,null,"577c8126",null);"function"===typeof d["default"]&&Object(d["default"])(p),"function"===typeof u["default"]&&Object(u["default"])(p);e["default"]=p.exports}}]);