(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-07f42442"],{"0f18":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Add external Script Sets by importing Script Sets":"使用指令碼集匯入功能新增外部指令碼集","No Script Set has ever been imported":"從未匯入過任何指令碼集"}}'),delete t.options._Ctor}},"104a":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Data imported":"數據已導入","Drag and drop the file here, or click here to upload":"將文件拖到此處，或點擊此處上傳","Imported Script Set requires 3rd party packages, do you want to open PIP tool now?":"導入的腳本集需要第三方包，是否現在前往 PIP 工具？","Imported contents do not include sensitive data (such as password), please re-entered them after import":"導入內容不包含敏感數據，請在導入後重新輸入","Importing":"即將導入","Select a file":"選擇文件"}}'),delete t.options._Ctor}},"1c11":function(t,e,o){"use strict";o.r(e);o("99af"),o("b0c0");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"common-page-header"},[e("h1",[t._v(t._s(t.$t("Script Set Import History")))]),t._v(" "),e("div",{staticClass:"header-control"})])]),t._v(" "),e("el-main",[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Script Set has ever been imported")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          "+t._s(t.$t("Add external Script Sets by importing Script Sets"))+"\n        ")]),t._v(" "),e("el-button",{on:{click:function(e){return t.openSetup(null,"import")}}},[e("i",{staticClass:"fa fa-fw fa-cloud-upload"}),t._v("\n          "+t._s(t.$t("Script Set Import"))+"\n        ")])],1):[e("el-timeline",t._l(t.data,(function(o){return e("el-timeline-item",{key:o.id,attrs:{placement:"top",size:"large",type:"primary",timestamp:"".concat(t.T.getDateTimeString(o.createTime)," (").concat(t.T.fromNow(o.createTime),")")}},[e("el-card",{staticClass:"history-card",attrs:{shadow:"hover"}},[t._l(t.C.IMPORT_DATA_TYPE,(function(a){return[t.T.notNothing(o.summaryJSON[a.key])?e("div",{staticClass:"history-summary"},[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t(a.name))+t._s(t.$t(":")))]),t._v(" "),e("p",t._l(o.summaryJSON[a.key],(function(o){return e("span",{key:o.id},[e("span",{class:a.showClass},[t._v(t._s(o[a.showField]||o.id))]),t._v("\n                      　\n                      "),e("small",[t._v("\n                        "+t._s(t.$t("("))+"\n                        "),e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n                         "),e("code",{staticClass:"text-main"},[t._v(t._s(o.id))]),t._v("\n                        "+t._s(t.$t(")"))+"\n                      ")]),t._v(" "),e("br")])})),0)]):t._e()]})),t._v(" "),t.T.notNothing(o.note)?e("div",{staticClass:"history-note"},[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Note"))+t._s(t.$t(":")))]),t._v(" "),e("pre",{staticClass:"text-info text-small"},[t._v(t._s(o.note))])]):t._e()],2)],1)})),1)]],2),t._v(" "),t.T.notNothing(t.data)?e("el-footer",[e("div",{staticClass:"setup-page-footer"},[e("el-button",{on:{click:function(e){return t.openSetup(null,"import")}}},[e("i",{staticClass:"fa fa-fw fa-cloud-upload"}),t._v("\n          "+t._s(t.$t("Script Set Import"))+"\n        ")])],1)]):t._e(),t._v(" "),e("ScriptSetImport",{ref:"setup"})],1)],1)},n=[],r=o("c7eb"),i=o("1da1"),s=(o("d3b7"),o("159b"),function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"ScriptSetSetup",visible:t.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"750px"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.$t("Script Set Import"))+"\n  ")]),t._v(" "),e("el-container",{attrs:{direction:"vertical"}},[e("el-main",[e("div",{staticClass:"setup-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px"}},[e("el-form-item",{attrs:{label:t.$t("Select a file"),prop:"upload"}},[e("el-upload",{ref:"upload",class:t.uploadAreaBorderClass,attrs:{drag:"",limit:2,multiple:!1,"auto-upload":!1,"show-file-list":!1,accept:".zip","http-request":t.handleUpload,"on-change":t.onUploadFileChange}},[e("i",{staticClass:"fa",class:t.uploadAreaIconClass}),t._v(" "),e("div",{staticClass:"el-upload__text"},[t._v(t._s(t.$t(t.uploadAreaIconText)))])]),t._v(" "),e("InfoBlock",{attrs:{type:"warning",title:t.$t("Imported contents do not include sensitive data (such as password), please re-entered them after import")}})],1),t._v(" "),e("el-form-item",{staticClass:"setup-footer"},[e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary",disabled:t.disableUpload},on:{click:t.submitData}},[t._v(t._s(t.$t("Import")))])],1)],1)],1)]),t._v(" "),e("el-dialog",{attrs:{title:t.$t("Importing"),visible:t.showConfirm,"close-on-click-modal":!1,"close-on-press-escape":!1,"show-close":!0,width:"750px"},on:{"update:visible":function(e){t.showConfirm=e}}},[e("span",{staticClass:"import-info-dialog-content"},[t.importInfo&&t.importInfo.diff?[t._l(t.C.IMPORT_DATA_TYPE,(function(o){return[t.T.notNothing(t.importInfo.diff[o.key])?[e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(o.name))])]),t._v(" "),e("el-table",{attrs:{data:t.importInfo.diff[o.key],"show-header":!1}},[e("el-table-column",{attrs:{width:"180",align:"center"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("strong",{class:t.DIFF_TYPE_MAP[o.row.diffType].class},[e("i",{staticClass:"fa",class:t.DIFF_TYPE_MAP[o.row.diffType].icon}),t._v("\n                      "+t._s(t.$t(o.row.diffType))+"\n                    ")])]}}],null,!0)}),t._v(" "),e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",[t._v(t._s(a.row[o.showField]||a.row.id))])]}}],null,!0)}),t._v(" "),e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(o){return[e("small",[e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n                       "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.id))])])]}}],null,!0)})],1)]:t._e()]}))]:t._e(),t._v(" "),t.importInfo&&t.importInfo.note?[e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Note")))])]),t._v(" "),e("pre",{staticClass:"import-note"},[t._v(t._s(t.importInfo.note))])]:t._e()],2),t._v(" "),e("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[e("el-button",{on:{click:function(e){t.showConfirm=!1}}},[t._v(t._s(t.$t("Cancel")))]),t._v(" "),e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary",loading:t.isImporting},on:{click:t.confirmImport}},[t._v("\n          "+t._s(t.$t("Confirm"))+"\n        ")])],1)])],1)],2)}),c=[],l=(o("a434"),{name:"ScriptSetImport",components:{},watch:{show:function(t){t||this.$root.$emit("reload.scriptSetImportHistoryList")},showConfirm:function(t){!1===t&&this.initFilePreview()}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:t.show=!0;case 1:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(i["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.$refs.upload.submit();case 2:return e.abrupt("return",e.sent);case 3:case"end":return e.stop()}}),e)})))()},handleUpload:function(t){var e=this;return Object(i["a"])(Object(r["a"])().mark((function o(){var a,n;return Object(r["a"])().wrap((function(o){while(1)switch(o.prev=o.next){case 0:return a=new FormData,a.append("checkOnly",!0),a.append("files",t.file),o.next=5,e.T.callAPI("post","/api/v1/script-sets/do/import",{body:a});case 5:if(n=o.sent,n.ok){o.next=8;break}return o.abrupt("return",e.alertOnError(n));case 8:e.importInfo=n.data,e.showConfirm=!0;case 10:case"end":return o.stop()}}),o)})))()},confirmImport:function(){var t=this;return Object(i["a"])(Object(r["a"])().mark((function e(){var o;return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return t.isImporting=!0,e.next=3,t.T.callAPI("post","/api/v1/script-sets/do/confirm-import",{body:{confirmId:t.importInfo.confirmId},alert:{okMessage:t.$t("Data imported")}});case 3:if(o=e.sent,t.isImporting=!1,o.ok){e.next=7;break}return e.abrupt("return",t.alertOnError(o));case 7:if(t.showConfirm=!1,t.show=!1,!t.T.notNothing(o.data.requirements)){e.next=14;break}return e.next=12,t.T.confirm(t.$t("Imported Script Set requires 3rd party packages, do you want to open PIP tool now?"));case 12:if(!e.sent){e.next=14;break}return e.abrupt("return",t.common.goToPIPTools(o.data.requirements));case 14:case"end":return e.stop()}}),e)})))()},alertOnError:function(t){t.ok||this.initFilePreview()},initFilePreview:function(){this.$refs.upload.clearFiles(),this.uploadAreaBorderClass=[],this.uploadAreaIconClass=["fa-cloud-upload"],this.uploadAreaIconText="Drag and drop the file here, or click here to upload"},showFilePreview:function(t){this.uploadAreaBorderClass=["upload-area-active"],this.uploadAreaIconClass=["fa-cloud-upload","text-main"],this.uploadAreaIconText=t},onUploadFileChange:function(t,e){e.length>1&&e.splice(0,1),this.disableUpload=e.length<=0,this.disableUpload?this.initFilePreview():this.showFilePreview(e[0].name)}},computed:{DIFF_TYPE_MAP:function(){return{add:{icon:"fa-plus",class:"text-good"},replace:{icon:"fa-refresh",class:"text-bad"}}}},props:{},data:function(){return{show:!1,scriptSetMap:{},uploadAreaBorderClass:[],uploadAreaIconClass:["fa-cloud-upload"],uploadAreaIconText:"Drag and drop the file here, or click here to upload",disableUpload:!0,showConfirm:!1,isImporting:!1,importInfo:{}}}}),p=l,d=(o("89e9"),o("1c33"),o("2877")),u=o("fcf7"),f=o("c0a3"),m=o("522f"),h=Object(d["a"])(p,s,c,!1,null,"55efd323",null);"function"===typeof u["default"]&&Object(u["default"])(h),"function"===typeof f["default"]&&Object(f["default"])(h),"function"===typeof m["default"]&&Object(m["default"])(h);var _=h.exports,v={name:"ScriptSetImportHistoryList",components:{ScriptSetImport:_},watch:{$route:{immediate:!0,handler:function(t,e){var o=this;return Object(i["a"])(Object(r["a"])().mark((function t(){return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,o.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(r["a"])().mark((function e(){var o;return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/script-set-import-history/do/list",{query:{pageSize:20}});case 2:if(o=e.sent,o&&o.ok){e.next=5;break}return e.abrupt("return");case 5:o.data.forEach((function(e){e.summaryJSON&&e.summaryJSON.dataSources&&(e.summaryJSON.connectors=e.summaryJSON.dataSources),t.T.isNothing(e.note)&&(e.note=t.T.jsonFindSafe(e,"summaryJSON.extra.note"))})),t.data=o.data,t.$store.commit("updateLoadStatus",!0);case 8:case"end":return e.stop()}}),e)})))()},openSetup:function(t,e){switch(e){case"import":this.$refs.setup.loadData();break}}},computed:{},props:{},data:function(){return{data:[]}},created:function(){var t=this;this.$root.$on("reload.scriptSetImportHistoryList",(function(){return t.loadData()}))},destroyed:function(){this.$root.$off("reload.scriptSetImportHistoryList")}},w=v,b=(o("3d48"),o("ac55")),S=o("5fc0"),I=o("f685"),y=Object(d["a"])(w,a,n,!1,null,"3f1ef3f6",null);"function"===typeof b["default"]&&Object(b["default"])(y),"function"===typeof S["default"]&&Object(S["default"])(y),"function"===typeof I["default"]&&Object(I["default"])(y);e["default"]=y.exports},"1c33":function(t,e,o){"use strict";o("eb5d")},"374e":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Add external Script Sets by importing Script Sets":"使用腳本集導入功能添加外部腳本集","No Script Set has ever been imported":"從未導入過任何腳本集"}}'),delete t.options._Ctor}},"3d48":function(t,e,o){"use strict";o("463b")},"463b":function(t,e,o){},"522f":function(t,e,o){"use strict";var a=o("9627"),n=o.n(a);e["default"]=n.a},"5dd8":function(t,e,o){},"5fc0":function(t,e,o){"use strict";var a=o("374e"),n=o.n(a);e["default"]=n.a},"88ff":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"No Script Set has ever been imported":"从未导入过任何脚本集","Add external Script Sets by importing Script Sets":"使用脚本集导入功能添加外部脚本集"}}'),delete t.options._Ctor}},"89e9":function(t,e,o){"use strict";o("5dd8")},9627:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Data imported":"資料已匯入","Drag and drop the file here, or click here to upload":"將檔案拖到此處，或點選此處上傳","Imported Script Set requires 3rd party packages, do you want to open PIP tool now?":"匯入的指令碼集需要第三方包，是否現在前往 PIP 工具？","Imported contents do not include sensitive data (such as password), please re-entered them after import":"匯入內容不包含敏感資料，請在匯入後重新輸入","Importing":"即將匯入","Select a file":"選擇檔案"}}'),delete t.options._Ctor}},a434:function(t,e,o){"use strict";var a=o("23e7"),n=o("7b0b"),r=o("23cb"),i=o("5926"),s=o("07fa"),c=o("3511"),l=o("65f0"),p=o("8418"),d=o("083a"),u=o("1dde"),f=u("splice"),m=Math.max,h=Math.min;a({target:"Array",proto:!0,forced:!f},{splice:function(t,e){var o,a,u,f,_,v,w=n(this),b=s(w),S=r(t,b),I=arguments.length;for(0===I?o=a=0:1===I?(o=0,a=b-S):(o=I-2,a=h(m(i(e),0),b-S)),c(b+o-a),u=l(w,a),f=0;f<a;f++)_=S+f,_ in w&&p(u,f,w[_]);if(u.length=a,o<a){for(f=S;f<b-a;f++)_=f+a,v=f+o,_ in w?w[v]=w[_]:d(w,v);for(f=b;f>b-a+o;f--)d(w,f-1)}else if(o>a)for(f=b-a;f>S;f--)_=f+a-1,v=f+o-1,_ in w?w[v]=w[_]:d(w,v);for(f=0;f<o;f++)w[f+S]=arguments[f+2];return w.length=b-a+o,u}})},ac55:function(t,e,o){"use strict";var a=o("88ff"),n=o.n(a);e["default"]=n.a},c0a3:function(t,e,o){"use strict";var a=o("104a"),n=o.n(a);e["default"]=n.a},c5f3:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Select a file":"选择文件","Data imported":"数据已导入","Importing":"即将导入","Imported contents do not include sensitive data (such as password), please re-entered them after import":"导入内容不包含敏感数据，请在导入后重新输入","Drag and drop the file here, or click here to upload":"将文件拖到此处，或点击此处上传","Imported Script Set requires 3rd party packages, do you want to open PIP tool now?":"导入的脚本集需要第三方包，是否现在前往 PIP 工具？"}}'),delete t.options._Ctor}},eb5d:function(t,e,o){},f685:function(t,e,o){"use strict";var a=o("0f18"),n=o.n(a);e["default"]=n.a},fcf7:function(t,e,o){"use strict";var a=o("c5f3"),n=o.n(a);e["default"]=n.a}}]);