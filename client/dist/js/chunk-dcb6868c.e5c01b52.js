(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-dcb6868c"],{4168:function(t,e,o){"use strict";o.r(e);o("b0c0");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"page-header"},[e("span",[t._v(t._s(t.$t("Script Sets Import")))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px"}},[e("el-form-item",{attrs:{label:t.$t("Select a file"),prop:"upload"}},[e("el-upload",{ref:"upload",class:t.uploadAreaBorderClass,attrs:{drag:"",limit:2,multiple:!1,"auto-upload":!1,"show-file-list":!1,accept:".zip","http-request":t.handleUpload,"on-change":t.onUploadFileChange}},[e("i",{staticClass:"fa",class:t.uploadAreaIconClass}),t._v(" "),e("div",{staticClass:"el-upload__text"},[t._v(t._s(t.$t(t.uploadAreaIconText)))])]),t._v(" "),e("InfoBlock",{attrs:{type:"warning",title:t.$t("Imported contents do not include sensitive data (such as password), please re-entered them after import")}})],1),t._v(" "),e("el-form-item",[e("el-button",{on:{click:t.goToHistory}},[e("i",{staticClass:"fa fa-fw fa-history"}),t._v("\n                  "+t._s(t.$t("Script Set Importing History"))+"\n                ")]),t._v(" "),e("div",{staticClass:"setup-right"},[e("el-button",{attrs:{type:"primary",disabled:t.disableUpload},on:{click:t.submitData}},[t._v(t._s(t.$t("Import")))])],1)],1)],1)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1),t._v(" "),e("el-dialog",{attrs:{title:t.$t("Importing"),visible:t.showConfirm,"close-on-click-modal":!1,"close-on-press-escape":!1,"show-close":!0,width:"750px"},on:{"update:visible":function(e){t.showConfirm=e}}},[e("span",{staticClass:"import-info-dialog-content"},[t.importInfo&&t.importInfo.diff?[t._l(t.C.IMPORT_DATA_TYPE,(function(o){return[t.T.notNothing(t.importInfo.diff[o.key])?[e("el-divider",{attrs:{"content-position":"left"}},[e("h3",[t._v(t._s(o.name))])]),t._v(" "),e("el-table",{attrs:{data:t.importInfo.diff[o.key],"show-header":!1}},[e("el-table-column",{attrs:{width:"180",align:"center"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("strong",{class:t.DIFF_TYPE_MAP[o.row.diffType].class},[e("i",{staticClass:"fa",class:t.DIFF_TYPE_MAP[o.row.diffType].icon}),t._v("\n                      "+t._s(t.$t(o.row.diffType))+"\n                    ")])]}}],null,!0)}),t._v(" "),e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",[t._v(t._s(a.row[o.showField]||a.row.id))])]}}],null,!0)}),t._v(" "),e("el-table-column",{scopedSlots:t._u([{key:"default",fn:function(o){return[e("small",[e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n                       "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.id))])])]}}],null,!0)})],1)]:t._e()]}))]:t._e(),t._v(" "),t.importInfo&&t.importInfo.note?[e("el-divider",{attrs:{"content-position":"left"}},[e("h3",[t._v(t._s(t.$t("Note")))])]),t._v(" "),e("pre",{staticClass:"import-note"},[t._v(t._s(t.importInfo.note))])]:t._e()],2),t._v(" "),e("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[e("el-button",{on:{click:function(e){t.showConfirm=!1}}},[t._v(t._s(t.$t("Cancel")))]),t._v(" "),e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary",loading:t.isImporting},on:{click:t.confirmImport}},[t._v("\n          "+t._s(t.$t("Confirm"))+"\n        ")])],1)])],1)],1)},r=[],n=o("c7eb"),i=o("1da1"),s=(o("a434"),o("14d9"),{name:"ScriptSetImport",components:{},watch:{showConfirm:function(t){!1===t&&this.initFilePreview()}},methods:{submitData:function(){var t=this;return Object(i["a"])(Object(n["a"])().mark((function e(){return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:e.t0=t.T.setupPageMode(),e.next="import"===e.t0?3:6;break;case 3:return e.next=5,t.$refs.upload.submit();case 5:return e.abrupt("return",e.sent);case 6:case"end":return e.stop()}}),e)})))()},handleUpload:function(t){var e=this;return Object(i["a"])(Object(n["a"])().mark((function o(){var a,r;return Object(n["a"])().wrap((function(o){while(1)switch(o.prev=o.next){case 0:return a=new FormData,a.append("checkOnly",!0),a.append("files",t.file),o.next=5,e.T.callAPI("post","/api/v1/script-sets/do/import",{body:a});case 5:if(r=o.sent,r.ok){o.next=8;break}return o.abrupt("return",e.alertOnError(r));case 8:e.importInfo=r.data,e.showConfirm=!0;case 10:case"end":return o.stop()}}),o)})))()},confirmImport:function(){var t=this;return Object(i["a"])(Object(n["a"])().mark((function e(){var o;return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return t.isImporting=!0,e.next=3,t.T.callAPI("post","/api/v1/script-sets/do/confirm-import",{body:{confirmId:t.importInfo.confirmId},alert:{okMessage:t.$t("Data imported")}});case 3:if(o=e.sent,t.isImporting=!1,o.ok){e.next=7;break}return e.abrupt("return",t.alertOnError(o));case 7:if(!t.T.isNothing(o.data.requirements)){e.next=11;break}t.goToHistory(),e.next=19;break;case 11:return t.showConfirm=!1,e.next=14,t.T.confirm(t.$t("Imported Script Set requires 3rd party packages, do you want to open PIP tool now?"));case 14:if(!e.sent){e.next=18;break}return e.abrupt("return",t.common.goToPIPTools(o.data.requirements));case 18:t.goToHistory();case 19:case"end":return e.stop()}}),e)})))()},alertOnError:function(t){t.ok||this.initFilePreview()},initFilePreview:function(){this.$refs.upload.clearFiles(),this.uploadAreaBorderClass=[],this.uploadAreaIconClass=["fa-cloud-upload"],this.uploadAreaIconText="Drag and drop the file here, or click here to upload"},showFilePreview:function(t){this.uploadAreaBorderClass=["upload-area-active"],this.uploadAreaIconClass=["fa-cloud-upload","text-main"],this.uploadAreaIconText=t},onUploadFileChange:function(t,e){e.length>1&&e.splice(0,1),this.disableUpload=e.length<=0,this.disableUpload?this.initFilePreview():this.showFilePreview(e[0].name)},goToHistory:function(){this.$router.push({name:"script-set-import-history-list"})}},computed:{DIFF_TYPE_MAP:function(){return{add:{icon:"fa-plus",class:"text-good"},replace:{icon:"fa-refresh",class:"text-bad"}}}},props:{},data:function(){return{scriptSetMap:{},uploadAreaBorderClass:[],uploadAreaIconClass:["fa-cloud-upload"],uploadAreaIconText:"Drag and drop the file here, or click here to upload",disableUpload:!0,showConfirm:!1,isImporting:!1,importInfo:{}}},created:function(){this.$store.commit("updateLoadStatus",!0)}}),l=s,c=(o("4877"),o("b34e"),o("2877")),p=o("fcf7"),d=Object(c["a"])(l,a,r,!1,null,"4913d2da",null);"function"===typeof p["default"]&&Object(p["default"])(d);e["default"]=d.exports},4877:function(t,e,o){"use strict";o("ce82")},"9a94":function(t,e,o){},a434:function(t,e,o){"use strict";var a=o("23e7"),r=o("7b0b"),n=o("23cb"),i=o("5926"),s=o("07fa"),l=o("3511"),c=o("65f0"),p=o("8418"),d=o("083a"),u=o("1dde"),f=u("splice"),m=Math.max,h=Math.min;a({target:"Array",proto:!0,forced:!f},{splice:function(t,e){var o,a,u,f,v,_,w=r(this),b=s(w),I=n(t,b),g=arguments.length;for(0===g?o=a=0:1===g?(o=0,a=b-I):(o=g-2,a=h(m(i(e),0),b-I)),l(b+o-a),u=c(w,a),f=0;f<a;f++)v=I+f,v in w&&p(u,f,w[v]);if(u.length=a,o<a){for(f=I;f<b-a;f++)v=f+a,_=f+o,v in w?w[_]=w[v]:d(w,_);for(f=b;f>b-a+o;f--)d(w,f-1)}else if(o>a)for(f=b-a;f>I;f--)v=f+a-1,_=f+o-1,v in w?w[_]=w[v]:d(w,_);for(f=0;f<o;f++)w[f+I]=arguments[f+2];return w.length=b-a+o,u}})},b34e:function(t,e,o){"use strict";o("9a94")},c5f3:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Select a file":"选择文件","Data imported":"数据已导入","Importing":"即将导入","Imported contents do not include sensitive data (such as password), please re-entered them after import":"导入内容不包含敏感数据，请在导入后重新输入","Drag and drop the file here, or click here to upload":"将文件拖到此处，或点击此处上传","Imported Script Set requires 3rd party packages, do you want to open PIP tool now?":"导入的脚本集需要第三方包，是否现在前往PIP工具？"}}'),delete t.options._Ctor}},ce82:function(t,e,o){},fcf7:function(t,e,o){"use strict";var a=o("c5f3"),r=o.n(a);e["default"]=r.a}}]);