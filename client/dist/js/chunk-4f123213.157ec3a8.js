(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-4f123213"],{"0239":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"ScriptSetCount":"No Script Set included | Includes {n} Script Set | Includes {n} Script Sets"}}'),delete e.options._Ctor}},"0324":function(e,t,a){"use strict";var r=a("4a11"),i=a.n(r);t["default"]=i.a},"16db":function(e,t,a){"use strict";a("3931")},"237d":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add Script Market":"添加脚本市场","Setup Script Market":"配置脚本市场","Branch":"分支","Region":"地域","Password here is always required when the Script Market requires password":"如脚本市场需要密码，则每次修改都必须重新输入密码","AK Secret here is always required when the Script Market requires password":"如脚本市场需要 AK Secret，则每次修改都必须重新输入 AK Secret","Please input Script Market type":"请输入脚本市场类型","Please input URL":"请输入 URL","Please input Branch":"请输入分支","Please input user":"请输入用户名","Please input password":"请输入密码","Please input endpoint":"请输入访问地址","Please input bucket":"请输入 Bucket","Please input folder":"请输入文件夹","Please input AK Id":"请输入 AK ID","Please input AK Secret":"请输入 AK Secret","Should start with http:// or https://":"必须以 http:// 或 https://开头","Manage this Script Market":"管理此脚本市场","Script Market added":"脚本市场已添加","Script Market saved":"脚本市场已保存","Script Market removed":"脚本市场已删除","Are you sure you want to delete the Script Market?":"是否确认删除此脚本市场？"}}'),delete e.options._Ctor}},3176:function(e,t,a){"use strict";var r=a("0239"),i=a.n(r);t["default"]=i.a},3931:function(e,t,a){},"4a11":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Homepage":"前往主页","Branch":"分支","Access Timeout":"访问超时","Locked by other user ({user})":"被其他用户（{user}）锁定","Locked by you":"被您锁定","Add Official Script Market":"添加官方脚本市场","Script Market deleted":"脚本市场已删除","Script Market pinned":"脚本市场已置顶","Script Market unpinned":"脚本市场已取消置顶","Script Market locked":"脚本市场已上锁","Script Market unlocked":"脚本市场已解锁","No Script Market has ever been added":"从未添加过任何脚本市场","Are you sure you want to delete the Script Market?":"是否确认删除此脚本市场？","Official Script Market added":"官方脚本市场已添加","ScriptSetCount":"不包含任何脚本集 | 包含 {n} 个脚本集 | 包含 {n} 个脚本集","Checking Update...":"正在检查更新...","Deleting...":"正在删除...","After adding the Script Market, you can install Script Sets from the Script Market or push the local Script Sets to the Script Market.":"添加脚本市场后，可以从脚本市场安装脚本集，或将本地脚本集推送到市场"}}'),delete e.options._Ctor}},"7bc4":function(e,t,a){"use strict";var r=a("237d"),i=a.n(r);t["default"]=i.a},"7ef0":function(e,t,a){"use strict";a("dcbb")},"9d30":function(e,t,a){"use strict";a.r(t);var r=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[e.$store.state.isLoaded?e._e():t("PageLoading"),e._v(" "),t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"},{name:"loading",rawName:"v-loading.fullscreen.lock",value:e.isProcessing,expression:"isProcessing",modifiers:{fullscreen:!0,lock:!0}}],attrs:{direction:"vertical","element-loading-spinner":"el-icon-loading","element-loading-text":e.processingText}},[t("el-header",{attrs:{height:"60px"}},[t("div",{staticClass:"common-page-header"},[t("h1",[e._v(e._s(e.$t("Script Market")))]),e._v(" "),t("div",{staticClass:"header-control"},[e.$store.getters.SYSTEM_SETTINGS("OFFICIAL_SCRIPT_MARKET_ENABLED")?[e.hasOfficialScriptMarket?e._e():t("el-link",{on:{click:e.createOfficialScriptMarket}},[t("i",{staticClass:"fa fa-fw fa-star"}),e._v("\n              "+e._s(e.$t("Add Official Script Market"))+"\n            ")]),e._v("\n            　\n          ")]:e._e(),e._v(" "),t("FuzzySearchInput",{attrs:{dataFilter:e.dataFilter}}),e._v(" "),t("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(t){return e.openSetup(null,"add")}}},[t("i",{staticClass:"fa fa-fw fa-plus"}),e._v("\n            "+e._s(e.$t("Add"))+"\n          ")]),e._v(" "),t("el-button",{attrs:{type:"primary",plain:"",size:"small",disabled:e.isProcessing},on:{click:e.checkUpdate}},[e.isProcessing?t("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}):t("i",{staticClass:"fa fa-fw fa-refresh"}),e._v("\n            "+e._s(e.$t("Check Update"))+"\n          ")])],2)])]),e._v(" "),t("el-main",{staticClass:"common-table-container"},[e.T.isNothing(e.data)?t("div",{staticClass:"no-data-area"},[e.T.isPageFiltered()?t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-search"}),e._v(e._s(e.$t("No matched data found")))]):t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-info-circle"}),e._v(e._s(e.$t("No Script Market has ever been added")))]),e._v(" "),t("p",{staticClass:"no-data-tip"},[e._v("\n          "+e._s(e.$t("After adding the Script Market, you can install Script Sets from the Script Market or push the local Script Sets to the Script Market."))+"\n        ")])]):t("el-table",{staticClass:"common-table script-market-list-table",attrs:{height:"100%",data:e.data,"row-class-name":e.T.getHighlightRowCSS}},[t("el-table-column",{attrs:{label:e.$t("Type"),width:"150",align:"center"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("div",{staticClass:"script-market-logo-wrap"},[a.row.isOfficial?t("i",{staticClass:"fa fa-fw fa-3x fa-star text-watch"}):t("el-image",{staticClass:"script-market-logo",class:e.common.getScriptMarketClass(a.row),attrs:{src:e.common.getScriptMarketLogo(a.row)}})],1)]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Script Market")},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.isPinned?t("el-tooltip",{attrs:{effect:"dark",content:e.$t("Pinned"),placement:"top",enterable:!1}},[t("i",{staticClass:"fa fa-fw fa-thumb-tack text-bad"})]):e._e(),e._v(" "),t("strong",{staticClass:"script-market-title",class:a.row.isPinned?"text-bad":""},[a.row.isOfficial?t("span",[e._v(e._s(e.$t("Official Script Market")))]):t("span",[e._v(e._s(e.common.getScriptMarketTitle(a.row)))])]),e._v(" "),t("div",[a.row.isOfficial?e._e():["git"===a.row.type?[t("span",{staticClass:"text-info"},[e._v("URL")]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.url))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.configJSON.url}}),e._v(" "),t("br"),e._v(" "),t("span",{staticClass:"text-info"},[e._v(e._s(e.$t("Branch")))]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.branch||e.$t("Default")))])]:e._e(),e._v(" "),"aliyunOSS"===a.row.type?[t("span",{staticClass:"text-info"},[e._v(e._s(e.$t("Endpoint")))]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.endpoint))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.configJSON.endpoint}}),e._v(" "),t("br"),e._v(" "),t("span",{staticClass:"text-info"},[e._v("Bucket")]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.bucket))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.configJSON.bucket}}),e._v(" "),t("br"),e._v(" "),t("span",{staticClass:"text-info"},[e._v(e._s(e.$t("Folder")))]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.folder))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.configJSON.folder}})]:e._e(),e._v(" "),"httpService"===a.row.type?[t("span",{staticClass:"text-info"},[e._v("URL")]),e._v("\n                   "),t("code",{staticClass:"text-main code-font"},[e._v(e._s(a.row.configJSON.url))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.configJSON.url}})]:e._e(),e._v(" "),t("br")],e._v(" "),t("div",{staticClass:"script-market-extra-info"},[t("span",[e._v(e._s(e.$tc("ScriptSetCount",(a.row.scriptSets||[]).length)))])])],2),e._v(" "),a.row.error?t("InfoBlock",{attrs:{title:a.row.error,type:"error"}}):e._e()]}}])}),e._v(" "),t("el-table-column",{attrs:{width:"135"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.extra.homepageURL||"git"===a.row.type?t("el-link",{attrs:{href:a.row.extra.homepageURL||a.row.configJSON.url,target:"_blank"}},[t("i",{staticClass:"fa fa-fw fa-external-link"}),e._v("\n              "+e._s(e.$t("Homepage"))+"\n            ")]):e._e()]}}])}),e._v(" "),t("el-table-column",{attrs:{width:"135"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.isTimeout?t("span",{staticClass:"text-bad"},[e._v("\n              "+e._s(e.$t("Access Timeout"))+"\n            ")]):t("el-badge",{attrs:{value:e.common.getScriptMarketUpdateBadge(a.row.id)}},[t("el-button",{staticStyle:{width:"100px"},attrs:{type:"primary",size:"small",plain:!a.row.isAdmin},on:{click:function(t){return e.openContents(a.row)}}},[t("i",{staticClass:"fa fa-fw",class:a.row.isAdmin?"fa-cog":"fa-th-large"}),e._v("\n                "+e._s(a.row.isAdmin?e.$t("Admin"):e.$t("Enter"))+"\n              ")])],1)]}}])}),e._v(" "),t("el-table-column",{attrs:{width:"50"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("el-tooltip",{attrs:{effect:"dark",content:a.row.isLockedByOther?e.$t("Locked by other user ({user})",{user:a.row.lockedByUser}):e.$t("Locked by you"),placement:"top",enterable:!1}},[t("i",{staticClass:"fa fa-fw fa-2x",class:[a.row.isLocked?"fa-lock":"",a.row.isLockedByOther?"text-bad":"text-good"]})])]}}])}),e._v(" "),t("el-table-column",{attrs:{align:"right",width:"260"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("el-link",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{disabled:!a.row.isAccessible},on:{click:function(t){return e.quickSubmitData(a.row,a.row.isPinned?"unpin":"pin")}}},[e._v("\n              "+e._s(a.row.isPinned?e.$t("Unpin"):e.$t("Pin"))+"\n            ")]),e._v(" "),t("el-link",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{disabled:!a.row.isAccessible},on:{click:function(t){return e.lockData(a.row.id,!a.row.isLocked)}}},[e._v("\n              "+e._s(a.row.isLocked?e.$t("Unlock"):e.$t("Lock"))+"\n            ")]),e._v(" "),t("el-link",{attrs:{disabled:a.row.isOfficial||!a.row.isAccessible},on:{click:function(t){return e.openSetup(a.row,"setup")}}},[e._v("\n              "+e._s(e.$t("Setup"))+"\n            ")]),e._v(" "),t("el-link",{attrs:{disabled:!a.row.isAccessible},on:{click:function(t){return e.quickSubmitData(a.row,"delete")}}},[e._v("\n              "+e._s(e.$t("Delete"))+"\n            ")])]}}])})],1)],1),e._v(" "),t("ScriptMarketSetup",{ref:"setup"})],1)],1)},i=[],s=a("c7eb"),n=a("1da1"),o=(a("130f"),a("4de4"),a("d3b7"),a("159b"),a("14d9"),a("b0c0"),a("a4d3"),a("e01a"),function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"ScriptSetSetup",visible:e.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"750px"},on:{"update:visible":function(t){e.show=t}}},[t("template",{slot:"title"},[e._v("\n    "+e._s(e.pageTitle)+" "),t("code",{staticClass:"text-main"},[e._v(e._s(e.data.title||e.C.API_AUTH_MAP.get(e.selectedType).name))])]),e._v(" "),t("el-container",{attrs:{direction:"vertical"}},[t("el-main",[t("div",{staticClass:"setup-form"},[t("el-form",{ref:"form",attrs:{"label-width":"135px",model:e.form,rules:e.formRules}},[t("el-form-item",{staticStyle:{height:"0",overflow:"hidden"}},[t("input",{attrs:{tabindex:"-1",type:"text",name:"username"}}),e._v(" "),t("input",{attrs:{tabindex:"-1",type:"password",name:"password"}})]),e._v(" "),"add"===e.pageMode?t("el-form-item",{attrs:{label:e.$t("Type"),prop:"type"}},[t("el-select",{on:{change:e.switchType},model:{value:e.form.type,callback:function(t){e.$set(e.form,"type",t)},expression:"form.type"}},e._l(e.C.SCRIPT_MARKET_TYPE,(function(e){return t("el-option",{key:e.key,attrs:{label:e.name,value:e.key}})})),1)],1):t("el-form-item",{attrs:{label:e.$t("Type")}},[t("el-select",{attrs:{disabled:!0},model:{value:e.selectedType,callback:function(t){e.selectedType=t},expression:"selectedType"}},[t("el-option",{attrs:{label:e.C.SCRIPT_MARKET_TYPE_MAP.get(e.selectedType).name,value:e.selectedType}})],1)],1),e._v(" "),e.selectedType?[e.C.SCRIPT_MARKET_TYPE_MAP.get(e.selectedType).logo?t("el-form-item",[t("el-image",{staticClass:"script-market-logo",class:e.common.getScriptMarketClass(e.form),attrs:{src:e.common.getScriptMarketLogo(e.form)}})],1):e._e(),e._v(" "),t("el-form-item",[t("InfoBlock",{attrs:{type:"warning",title:e.C.SCRIPT_MARKET_TYPE_MAP.get(e.selectedType).tip}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Title")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),maxlength:"200"},model:{value:e.form.title,callback:function(t){e.$set(e.form,"title",t)},expression:"form.title"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Description")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000"},model:{value:e.form.description,callback:function(t){e.$set(e.form,"description",t)},expression:"form.description"}})],1),e._v(" "),e.hasConfigField(e.selectedType,"url")?t("el-form-item",{attrs:{label:"URL",prop:"configJSON.url"}},[t("el-input",{attrs:{type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000"},model:{value:e.form.configJSON.url,callback:function(t){e.$set(e.form.configJSON,"url",t)},expression:"form.configJSON.url"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"branch")?t("el-form-item",{attrs:{label:e.$t("Branch"),prop:"configJSON.branch"}},[t("el-input",{attrs:{placeholder:e.$t("Default")},model:{value:e.form.configJSON.branch,callback:function(t){e.$set(e.form.configJSON,"branch",t)},expression:"form.configJSON.branch"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"user")?t("el-form-item",{attrs:{label:e.$t("User"),prop:"configJSON.user"}},[t("el-input",{model:{value:e.form.configJSON.user,callback:function(t){e.$set(e.form.configJSON,"user",t)},expression:"form.configJSON.user"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"password")?t("el-form-item",{attrs:{label:e.$t("Password"),prop:"configJSON.password"}},[t("el-input",{attrs:{"show-password":""},model:{value:e.form.configJSON.password,callback:function(t){e.$set(e.form.configJSON,"password",t)},expression:"form.configJSON.password"}}),e._v(" "),"setup"===e.pageMode?t("InfoBlock",{attrs:{type:"info",title:e.$t("Password here is always required when the Script Market requires password")}}):e._e()],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"endpoint")?t("el-form-item",{attrs:{label:e.$t("Endpoint"),prop:"configJSON.endpoint"}},[t("el-input",{model:{value:e.form.configJSON.endpoint,callback:function(t){e.$set(e.form.configJSON,"endpoint",t)},expression:"form.configJSON.endpoint"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"bucket")?t("el-form-item",{attrs:{label:"Bucket",prop:"configJSON.bucket"}},[t("el-input",{model:{value:e.form.configJSON.bucket,callback:function(t){e.$set(e.form.configJSON,"bucket",t)},expression:"form.configJSON.bucket"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"folder")?t("el-form-item",{attrs:{label:e.$t("Folder"),prop:"configJSON.folder"}},[t("el-input",{model:{value:e.form.configJSON.folder,callback:function(t){e.$set(e.form.configJSON,"folder",t)},expression:"form.configJSON.folder"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"accessKeyId")?t("el-form-item",{attrs:{label:"AK ID",prop:"configJSON.accessKeyId"}},[t("el-input",{model:{value:e.form.configJSON.accessKeyId,callback:function(t){e.$set(e.form.configJSON,"accessKeyId",t)},expression:"form.configJSON.accessKeyId"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"accessKeySecret")?t("el-form-item",{attrs:{label:"AK Secret",prop:"configJSON.accessKeySecret"}},[t("el-input",{attrs:{"show-password":""},model:{value:e.form.configJSON.accessKeySecret,callback:function(t){e.$set(e.form.configJSON,"accessKeySecret",t)},expression:"form.configJSON.accessKeySecret"}}),e._v(" "),"setup"===e.pageMode?t("InfoBlock",{attrs:{type:"info",title:e.$t("AK Secret here is always required when the Script Market requires password")}}):e._e()],1):e._e(),e._v(" "),"add"!==e.pageMode||e.C.SCRIPT_MARKET_TYPE_MAP.get(e.selectedType).isReadonly?e._e():t("el-form-item",[t("el-switch",{attrs:{"active-text":e.$t("Manage this Script Market")},model:{value:e.setAdmin,callback:function(t){e.setAdmin=t},expression:"setAdmin"}})],1),e._v(" "),"setup"===e.pageMode&&e.data.isAdmin?t("el-form-item",[t("div",{staticClass:"manage-this-script-market-tip"},[t("i",{staticClass:"fa fa-fw fa-check text-main fa-2x"}),e._v(" "),t("span",[e._v(e._s(e.$t("Manage this Script Market")))])])]):e._e(),e._v(" "),t("el-form-item",{staticClass:"setup-footer"},["setup"===e.pageMode?t("el-button",{staticClass:"delete-button",on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]):e._e(),e._v(" "),t("el-button",{attrs:{type:"primary",disabled:e.isSaving},on:{click:e.submitData}},[e.isSaving?t("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}):e._e(),e._v("\n                "+e._s(e.$t("Save"))+"\n              ")])],1)]:e._e()],2)],1)])],1)],2)}),c=[],l=(a("b64b"),{name:"ScriptMarketSetup",components:{},watch:{show:function(e){e||this.$root.$emit("reload.scriptMarketList")}},methods:{updateValidator:function(e){this.$refs.form&&this.$refs.form.clearValidate();var t=this.C.SCRIPT_MARKET_TYPE_MAP.get(e).configFields;if(t)for(var a in t)if(t.hasOwnProperty(a)){var r=t[a];if(!r)continue;var i=this.formRules["configJSON.".concat(a)];i&&("git"===e&&["user","password"].indexOf(a)>=0?i[0].required=this.isUserPasswordRequired:i[0].required=!!r.isRequired)}},fillDefault:function(e){var t=this.C.SCRIPT_MARKET_TYPE_MAP.get(e).configFields;if(t){var a={};for(var r in t)if(t.hasOwnProperty(r)){var i=t[r];if(!i)continue;this.T.notNothing(i.default)&&(a[r]=i.default)}this.form.configJSON=a}},switchType:function(e){this.setAdmin=!1,this.fillDefault(e),this.updateValidator(e)},loadData:function(e){var t=this;return Object(n["a"])(Object(s["a"])().mark((function a(){var r,i;return Object(s["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(e){a.next=7;break}t.pageMode="add",t.T.jsonClear(t.form),t.form.configJSON={},t.data={},a.next=19;break;case 7:return t.pageMode="setup",t.data.id=e,a.next=11,t.T.callAPI_getOne("/api/v1/script-markets/do/list",t.data.id);case 11:if(r=a.sent,r&&r.ok){a.next=14;break}return a.abrupt("return");case 14:t.data=r.data,i={},Object.keys(t.form).forEach((function(e){return i[e]=t.data[e]})),t.form=i,t.updateValidator(t.data.type);case 19:t.show=!0;case 20:case"end":return a.stop()}}),a)})))()},submitData:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:e.isSaving=!0,t.t1=e.pageMode,t.next="add"===t.t1?12:"setup"===t.t1?15:18;break;case 12:return t.next=14,e.addData();case 14:return t.abrupt("break",18);case 15:return t.next=17,e.modifyData();case 17:return t.abrupt("break",18);case 18:setTimeout((function(){e.isSaving=!1}),500);case 19:case"end":return t.stop()}}),t,null,[[0,5]])})))()},_getFromData:function(){var e=this.T.jsonCopy(this.form);if(e.configJSON)for(var t in e.configJSON)this.T.isNothing(e.configJSON[t])&&(e.configJSON[t]=null);return e},addData:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){var a,r;return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("git"!==e.form.type||!e.form.configJSON.user||!e.form.configJSON.password||e.$root.checkUserProfileForGit()){t.next=2;break}return t.abrupt("return");case 2:return a=e._getFromData(),t.next=5,e.T.callAPI("post","/api/v1/script-markets/do/add",{body:{data:a,setAdmin:e.setAdmin},alert:{okMessage:e.$t("Script Market added")}});case 5:if(r=t.sent,r&&r.ok){t.next=8;break}return t.abrupt("return");case 8:e.$store.commit("updateHighlightedTableDataId",r.data.id),e.show=!1;case 10:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){var a,r;return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e._getFromData(),delete a.id,delete a.type,t.next=5,e.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:e.data.id},body:{data:a},alert:{okMessage:e.$t("Script Market saved")}});case 5:if(r=t.sent,r&&r.ok){t.next=8;break}return t.abrupt("return");case 8:e.$store.commit("updateHighlightedTableDataId",r.data.id),e.show=!1;case 10:case"end":return t.stop()}}),t)})))()},deleteData:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){var a;return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("git"!==e.data.type||!e.data.isAdmin||e.$root.checkUserProfileForGit()){t.next=2;break}return t.abrupt("return");case 2:return t.next=4,e.T.confirm(e.$t("Are you sure you want to delete the Script Market?"));case 4:if(t.sent){t.next=6;break}return t.abrupt("return");case 6:return t.next=8,e.T.callAPI("/api/v1/script-markets/:id/do/delete",{params:{id:e.data.id},alert:{okMessage:e.$t("Script Market removed")}});case 8:if(a=t.sent,a&&a.ok){t.next=11;break}return t.abrupt("return");case 11:e.show=!1;case 12:case"end":return t.stop()}}),t)})))()},hasConfigField:function(e,t){return!(!this.C.SCRIPT_MARKET_TYPE_MAP.get(e)||!this.C.SCRIPT_MARKET_TYPE_MAP.get(e).configFields)&&t in this.C.SCRIPT_MARKET_TYPE_MAP.get(e).configFields}},computed:{isUserPasswordRequired:function(){var e="setup"===this.pageMode?this.data.configJSON:this.form.configJSON;return e=e||{},!(!e.user&&!e.password)||this.setAdmin},pageTitle:function(){var e={setup:this.$t("Setup Script Market"),add:this.$t("Add Script Market")};return e[this.pageMode]},selectedType:function(){switch(this.pageMode){case"add":return this.form.type;case"setup":return this.data.type}}},props:{},data:function(){return{show:!1,pageMode:null,data:{},setAdmin:!1,form:{name:null,type:null,description:null,configJSON:{}},formRules:{type:[{trigger:"blur",message:this.$t("Please input Script Market type"),required:!0}],"configJSON.url":[{trigger:"blur",message:this.$t("Please input URL"),required:!1},{trigger:"change",message:this.$t("Should start with http:// or https://"),pattern:this.C.RE_PATTERN.httpURL}],"configJSON.branch":[{trigger:"blur",message:this.$t("Please input Branch"),required:!1}],"configJSON.user":[{trigger:"blur",message:this.$t("Please input user"),required:this.isUserPasswordRequired}],"configJSON.password":[{trigger:"blur",message:this.$t("Please input password"),required:this.isUserPasswordRequired}],"configJSON.endpoint":[{trigger:"blur",message:this.$t("Please input endpoint"),required:!0},{trigger:"change",message:this.$t("Should start with http:// or https://"),pattern:this.C.RE_PATTERN.httpURL}],"configJSON.bucket":[{trigger:"blur",message:this.$t("Please input bucket"),required:!0}],"configJSON.folder":[{trigger:"blur",message:this.$t("Please input folder"),required:!0}],"configJSON.accessKeyId":[{trigger:"blur",message:this.$t("Please input AK Id"),required:!0}],"configJSON.accessKeySecret":[{trigger:"blur",message:this.$t("Please input AK Secret"),required:!0}]},isSaving:!1}}}),d=l,u=(a("e469"),a("7ef0"),a("2877")),p=a("7bc4"),f=Object(u["a"])(d,o,c,!1,null,"a4ddc47e",null);"function"===typeof p["default"]&&Object(p["default"])(f);var m=f.exports,h={name:"ScriptMarketList",components:{ScriptMarketSetup:m},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(n["a"])(Object(s["a"])().mark((function e(){return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:case"end":return e.stop()}}),e)})))()}},"$store.state.isLoaded":function(e){var t=this;e&&setImmediate((function(){return t.T.autoScrollTable()}))}},methods:{loadData:function(e){var t=this;return Object(n["a"])(Object(s["a"])().mark((function a(){var r,i;return Object(s["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(e=e||{},!e.runCheckUpdate){a.next=4;break}return a.next=4,t.T.callAPI_get("/api/v1/script-markets/do/check-update");case 4:return r=t.dataFilter=t.T.createListQuery(),a.next=7,t.T.callAPI_get("/api/v1/script-markets/do/list",{query:r});case 7:if(i=a.sent,i&&i.ok){a.next=10;break}return a.abrupt("return");case 10:t.$store.getters.SYSTEM_SETTINGS("OFFICIAL_SCRIPT_MARKET_ENABLED")||(i.data=i.data.filter((function(e){return!e.isOfficial}))),i.data.forEach((function(e){e.lockedByUser="".concat(e.lockedByUserName||e.lockedByUsername||t.$t("UNKNOWN")),e.isLockedByMe=e.lockedByUserId===t.$store.getters.userId,e.isLockedByOther=e.lockedByUserId&&!e.isLockedByMe,e.isAccessible=t.$store.getters.isAdmin||!e.isLockedByOther,e.isLocked=e.isLockedByMe||e.isLockedByOther})),t.data=i.data,setTimeout((function(){t.$store.commit("updateLoadStatus",!0)}),500);case 14:case"end":return a.stop()}}),a)})))()},quickSubmitData:function(e,t){var a=this;return Object(n["a"])(Object(s["a"])().mark((function r(){var i,n;return Object(s["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:i=null,r.t0=t,r.next="delete"===r.t0?4:12;break;case 4:return r.next=6,a.T.callAPI_getOne("/api/v1/script-markets/do/list",e.id);case 6:if(i=r.sent,i&&i.ok){r.next=9;break}return r.abrupt("return");case 9:if("git"!==i.data.type||!i.data.isAdmin||a.$root.checkUserProfileForGit()){r.next=11;break}return r.abrupt("return");case 11:return r.abrupt("break",12);case 12:r.t1=t,r.next="delete"===r.t1?15:20;break;case 15:return r.next=17,a.T.confirm(a.$t("Are you sure you want to delete the Script Market?"));case 17:if(r.sent){r.next=19;break}return r.abrupt("return");case 19:return r.abrupt("break",20);case 20:n=null,r.t2=t,r.next="pin"===r.t2?24:"unpin"===r.t2?29:"delete"===r.t2?34:41;break;case 24:return n=!1,r.next=27,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:e.id},body:{data:{isPinned:!0}},alert:{okMessage:a.$t("Script Market pinned")}});case 27:return i=r.sent,r.abrupt("break",41);case 29:return n=!1,r.next=32,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:e.id},body:{data:{isPinned:!1}},alert:{okMessage:a.$t("Script Market unpinned")}});case 32:return i=r.sent,r.abrupt("break",41);case 34:return n=!0,a.processingText=a.$t("Deleting..."),a.isProcessing=!0,r.next=39,a.T.callAPI("/api/v1/script-markets/:id/do/delete",{params:{id:e.id},alert:{okMessage:a.$t("Script Market deleted")}});case 39:return i=r.sent,r.abrupt("break",41);case 41:if(i&&i.ok){r.next=43;break}return r.abrupt("return");case 43:return a.$store.commit("updateHighlightedTableDataId",e.id),r.next=46,a.loadData({runCheckUpdate:n});case 46:a.isProcessing=!1;case 47:case"end":return r.stop()}}),r)})))()},openSetup:function(e,t){switch(t){case"add":this.$refs.setup.loadData();break;case"setup":this.$store.commit("updateHighlightedTableDataId",e.id),this.$refs.setup.loadData(e.id);break}},openContents:function(e){var t=this.T.packRouteQuery();this.$store.commit("updateHighlightedTableDataId",e.id),this.$router.push({name:"script-market-contents",params:{id:e.id},query:t})},checkUpdate:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){var a,r,i,n;return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.processingText=e.$t("Checking Update..."),e.isProcessing=!0,a=1e3,r=Date.now(),t.next=6,e.common.checkScriptMarketUpdate();case 6:return t.next=8,e.loadData();case 8:i=Date.now(),n=i-r,n>a?e.isProcessing=!1:setTimeout((function(){e.isProcessing=!1}),a-n);case 11:case"end":return t.stop()}}),t)})))()},createOfficialScriptMarket:function(){var e=this;return Object(n["a"])(Object(s["a"])().mark((function t(){var a;return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI("post","/api/v1/script-markets/do/add-official",{alert:{okMessage:e.$t("Official Script Market added")}});case 2:if(a=t.sent,a&&a.ok){t.next=5;break}return t.abrupt("return");case 5:return e.$store.commit("updateHighlightedTableDataId",a.data.id),t.next=8,e.loadData();case 8:case"end":return t.stop()}}),t)})))()},lockData:function(e,t){var a=this;return Object(n["a"])(Object(s["a"])().mark((function r(){var i,n;return Object(s["a"])().wrap((function(r){while(1)switch(r.prev=r.next){case 0:return i=t?a.$t("Script Market locked"):a.$t("Script Market unlocked"),r.next=3,a.T.callAPI("post","/api/v1/script-markets/:id/do/modify",{params:{id:e},body:{data:{isLocked:t}},alert:{okMessage:i}});case 3:if(n=r.sent,n&&n.ok){r.next=6;break}return r.abrupt("return");case 6:return r.next=8,a.loadData();case 8:case"end":return r.stop()}}),r)})))()}},computed:{hasOfficialScriptMarket:function(){for(var e=0;e<this.data.length;e++)if(this.data[e].isOfficial)return!0;return!1}},props:{},data:function(){var e=this.T.createListQuery();return{data:[],dataFilter:{_fuzzySearch:e._fuzzySearch},isProcessing:!1,processingText:null}},created:function(){this.$root.$on("reload.scriptMarketList",this.loadData)},destroyed:function(){this.$root.$off("reload.scriptMarketList")}},g=h,k=(a("a09e"),a("16db"),a("3176")),_=a("0324"),b=Object(u["a"])(g,r,i,!1,null,"3f9453f8",null);"function"===typeof k["default"]&&Object(k["default"])(b),"function"===typeof _["default"]&&Object(_["default"])(b);t["default"]=b.exports},a09e:function(e,t,a){"use strict";a("ca38")},a627:function(e,t,a){},ca38:function(e,t,a){},dcbb:function(e,t,a){},e469:function(e,t,a){"use strict";a("a627")}}]);