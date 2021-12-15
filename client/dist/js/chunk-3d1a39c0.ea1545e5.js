(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-3d1a39c0"],{4168:function(e,t,a){"use strict";a.r(t);var r=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[e._v("\n        "+e._s(e.modeName)+"脚本包\n        "),a("div",{staticClass:"header-control"},[a("el-button",{attrs:{size:"small"},on:{click:e.goToHistory}},[a("i",{staticClass:"fa fa-fw fa-history"}),e._v("\n            脚本包导入历史\n          ")])],1)])]),e._v(" "),a("el-main",[a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:15}},[a("div",{staticClass:"common-form"},[a("el-form",{ref:"form",attrs:{"label-width":"120px",model:e.form,rules:e.formRules}},[a("el-form-item",{attrs:{label:"导入脚本包",prop:"upload"}},[a("el-upload",{ref:"upload",class:e.uploadAreaBorderClass,attrs:{drag:"",limit:2,multiple:!1,"auto-upload":!1,"show-file-list":!1,"http-request":e.handleUpload,"on-change":e.onUploadFileChange,accept:e.$store.getters.CONFIG("_FUNC_PKG_EXPORT_EXT"),action:""}},[a("i",{staticClass:"fa",class:e.uploadAreaIconClass}),e._v(" "),a("div",{staticClass:"el-upload__text"},[a("span",{domProps:{innerHTML:e._s(e.uploadAreaIconText)}})])])],1),e._v(" "),a("el-form-item",{attrs:{label:"导入令牌",prop:"password"}},[a("el-input",{attrs:{resize:"none",maxlength:"64","show-word-limit":""},model:{value:e.form.password,callback:function(t){e.$set(e.form,"password",t)},expression:"form.password"}}),e._v(" "),a("InfoBlock",{attrs:{title:"填写导出时提示的密码，无密码则留空即可"}})],1),e._v(" "),a("el-form-item",[a("div",{staticClass:"setup-right"},[a("el-button",{attrs:{type:"primary",disabled:e.disableUpload},on:{click:e.submitData}},[e._v(e._s(e.modeName))])],1)])],1)],1)]),e._v(" "),a("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1),e._v(" "),a("el-dialog",{attrs:{title:"即将导入脚本包",visible:e.showConfirm,"close-on-click-modal":!0,"close-on-press-escape":!0,"show-close":!0,width:"750px"},on:{"update:visible":function(t){e.showConfirm=t}}},[a("span",{staticClass:"import-token-dialog-content"},[e.checkResult&&e.checkResult.diff?[e.T.isNothing(e.checkResult.diff.add)?e._e():[a("span",{staticClass:"text-good"},[e._v("新增脚本集：")]),e._v(" "),e._l(e.checkResult.diff.add,(function(t){return a("el-tag",{key:t.id,attrs:{size:"medium",type:"success"}},[e._v(e._s(t.title||t.id))])})),e._v(" "),a("hr",{staticClass:"br"})],e._v(" "),e.T.isNothing(e.checkResult.diff.replace)?e._e():[a("span",{staticClass:"text-watch"},[e._v("替换脚本集：")]),e._v(" "),e._l(e.checkResult.diff.replace,(function(t){return a("el-tag",{key:t.id,attrs:{size:"medium",type:"warning"}},[e._v(e._s(t.title||t.id))])})),e._v(" "),a("InfoBlock",{attrs:{type:"warning",title:"被替换的脚本集下所有脚本文件会被完整替换为新版本，新版本中不存在的脚本文件会被删除"}}),e._v(" "),a("hr",{staticClass:"br"})]]:e._e(),e._v(" "),e.checkResult&&e.checkResult.summary&&e.checkResult.summary.note?[a("span",{staticClass:"text-info"},[e._v("备注：")]),e._v(" "),a("pre",{staticClass:"import-note"},[e._v(e._s(e.checkResult.summary.note))]),e._v(" "),a("hr",{staticClass:"br"})]:e._e()],2),e._v(" "),a("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[a("el-button",{on:{click:function(t){e.showConfirm=!1}}},[e._v("取消")]),e._v(" "),a("el-button",{attrs:{type:"primary",loading:e.isImporting},on:{click:e.confirmImport}},[e._v("\n          确认导入\n        ")])],1)])],1)],1)},o=[],s=a("1da1"),n=(a("a15b"),a("130f"),a("a434"),a("b0c0"),a("96cf"),{name:"ScriptSetImport",components:{},watch:{},methods:{submitData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.T.setupPageMode(),t.next="import"===t.t1?11:14;break;case 11:return t.next=13,e.$refs.upload.submit();case 13:return t.abrupt("return",t.sent);case 14:case"end":return t.stop()}}),t,null,[[0,5]])})))()},handleUpload:function(e){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function a(){var r,o,s,n,i;return regeneratorRuntime.wrap((function(a){while(1)switch(a.prev=a.next){case 0:for(s in r=new FormData,o=t.T.jsonCopy(t.form),o)o.hasOwnProperty(s)&&(n=o[s],r.append(s,n));return r.append("checkOnly",!0),r.append("files",e.file),a.next=7,t.T.callAPI("post","/api/v1/script-sets/do/import",{body:r,alert:{muteError:!0}});case 7:if(i=a.sent,i.ok){a.next=10;break}return a.abrupt("return",t.alertOnError(i));case 10:t.showConfirm=!0,t.checkResult=i.data;case 12:case"end":return a.stop()}}),a)})))()},confirmImport:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a,r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.isImporting=!0,t.next=3,e.T.callAPI("post","/api/v1/script-sets/do/confirm-import",{body:{confirmId:e.checkResult.confirmId},alert:{okMessage:e.$t("Data imported")}});case 3:if(a=t.sent,e.isImporting=!1,a.ok){t.next=7;break}return t.abrupt("return",e.alertOnError(a));case 7:if(!e.T.isNothing(a.data.pkgs)){t.next=11;break}e.goToHistory(),t.next=20;break;case 11:return e.showConfirm=!1,t.next=14,e.T.confirm(e.$t("Imported Script Set requires 3rd party packages, do you want to open PIP tool now?"));case 14:if(t.sent){t.next=18;break}e.goToHistory(),t.next=20;break;case 18:r=a.data.pkgs.join(" "),e.$router.push({name:"pip-tool",query:{pkgs:e.T.getBase64(r)}});case 20:case"end":return t.stop()}}),t)})))()},alertOnError:function(e){var t=this;if(!e.ok){switch(e.reason){case"EBizCondition.InvalidPassword":this.T.alert("导入令牌错误<br>\n              请使用复制粘贴的方式填写导入令牌，避免错填容易混淆的字母数字");break;case"EBizCondition.ConfirmingImportTimeout":this.T.alert("脚本包导入确认超时<br>\n              脚本包导入后长时间未确认，请重新尝试导入");break;default:this.T.alert("脚本包导入时发生意外错误<br>\n              请尝试重新导入，如果问题一直出现，请联系脚本包发行方");break}this.form.password="",this.initFilePreview(),setImmediate((function(){t.$refs.form.clearValidate()}))}},initFilePreview:function(){this.$refs.upload.clearFiles(),this.uploadAreaBorderClass=[],this.uploadAreaIconClass=["fa-cloud-upload"],this.uploadAreaIconText="将文件拖到此处，或<em>点击上传</em>"},showFilePreview:function(e){this.uploadAreaBorderClass=["upload-area-active"],this.uploadAreaIconClass=["fa-cloud-upload","text-main"],this.uploadAreaIconText='<code class="text-main">'.concat(e,"</code>")},onUploadFileChange:function(e,t){t.length>1&&t.splice(0,1),this.disableUpload=t.length<=0,this.disableUpload?this.initFilePreview():this.showFilePreview(t[0].name)},goToHistory:function(){this.$router.push({name:"script-set-import-history-list"})}},computed:{modeName:function(){var e={import:"导入"};return e[this.T.setupPageMode()]}},props:{},data:function(){return{scriptSetMap:{},uploadAreaBorderClass:[],uploadAreaIconClass:["fa-cloud-upload"],uploadAreaIconText:"将文件拖到此处，或<em>点击上传</em>",disableUpload:!0,showConfirm:!1,isImporting:!1,checkResult:{},form:{password:""},formRules:{}}},created:function(){this.$store.commit("updateLoadStatus",!0)}}),i=n,l=(a("df7e"),a("d132"),a("2877")),c=a("fcf7"),d=Object(l["a"])(i,r,o,!1,null,"7681bcca",null);"function"===typeof c["default"]&&Object(c["default"])(d);t["default"]=d.exports},"89a4":function(e,t,a){},a434:function(e,t,a){"use strict";var r=a("23e7"),o=a("da84"),s=a("23cb"),n=a("5926"),i=a("07fa"),l=a("7b0b"),c=a("65f0"),d=a("8418"),u=a("1dde"),p=u("splice"),f=o.TypeError,m=Math.max,h=Math.min,v=9007199254740991,w="Maximum allowed length exceeded";r({target:"Array",proto:!0,forced:!p},{splice:function(e,t){var a,r,o,u,p,b,_=l(this),g=i(_),k=s(e,g),C=arguments.length;if(0===C?a=r=0:1===C?(a=0,r=g-k):(a=C-2,r=h(m(n(t),0),g-k)),g+a-r>v)throw f(w);for(o=c(_,r),u=0;u<r;u++)p=k+u,p in _&&d(o,u,_[p]);if(o.length=r,a<r){for(u=k;u<g-r;u++)p=u+r,b=u+a,p in _?_[b]=_[p]:delete _[b];for(u=g;u>g-r+a;u--)delete _[u-1]}else if(a>r)for(u=g-r;u>k;u--)p=u+r-1,b=u+a-1,p in _?_[b]=_[p]:delete _[b];for(u=0;u<a;u++)_[u+k]=arguments[u+2];return _.length=g-r+a,o}})},c5f3:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Data imported":"数据已导入","Imported Script Set requires 3rd party packages, do you want to open PIP tool now?":"导入的脚本集需要第三方包，是否现在前往PIP工具？"}}'),delete e.options._Ctor}},d132:function(e,t,a){"use strict";a("89a4")},ddb7:function(e,t,a){},df7e:function(e,t,a){"use strict";a("ddb7")},fcf7:function(e,t,a){"use strict";var r=a("c5f3"),o=a.n(r);t["default"]=o.a}}]);