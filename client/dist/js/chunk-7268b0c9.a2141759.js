(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-7268b0c9"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"21a6":function(t,e,r){(function(r){var a,n,i;(function(r,o){n=[],a=o,i="function"===typeof a?a.apply(e,n):a,void 0===i||(t.exports=i)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function a(t,e,r){var a=new XMLHttpRequest;a.open("GET",t),a.responseType="blob",a.onload=function(){c(a.response,e,r)},a.onerror=function(){console.error("could not download file")},a.send()}function n(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function i(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(a){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var o="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof r&&r.global===r?r:void 0,s=o.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=o.saveAs||("object"!=typeof window||window!==o?function(){}:"download"in HTMLAnchorElement.prototype&&!s?function(t,e,r){var s=o.URL||o.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin===location.origin?i(c):n(c.href)?a(t,e,r):i(c,c.target="_blank")):(c.href=s.createObjectURL(t),setTimeout((function(){s.revokeObjectURL(c.href)}),4e4),setTimeout((function(){i(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,r,o){if(r=r||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,o),r);else if(n(t))a(t,r,o);else{var s=document.createElement("a");s.href=t,s.target="_blank",setTimeout((function(){i(s)}))}}:function(t,e,r,n){if(n=n||open("","_blank"),n&&(n.document.title=n.document.body.innerText="downloading..."),"string"==typeof t)return a(t,e,r);var i="application/octet-stream"===t.type,c=/constructor/i.test(o.HTMLElement)||o.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||i&&c||s)&&"undefined"!=typeof FileReader){var d=new FileReader;d.onloadend=function(){var t=d.result;t=l?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),n?n.location.href=t:location=t,n=null},d.readAsDataURL(t)}else{var p=o.URL||o.webkitURL,u=p.createObjectURL(t);n?n.location=u:location.href=u,n=null,setTimeout((function(){p.revokeObjectURL(u)}),4e4)}});o.saveAs=c.saveAs=c,t.exports=c}))}).call(this,r("c8ba"))},4709:function(t,e,r){},"49e6":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Add Script":"添加脚本","Setup Script":"配置脚本","Script Template":"脚本模板","Show Script Template":"显示脚本模板","Basic Example":"基础示例","Blank Script":"空白脚本","From Example Script":"来自示例脚本","Script ID will be a part of the Func ID":"脚本集ID将作为函数ID的一部分","Please input ID":"请输入ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","Script ID should starts with \\"{prefix}\\"":"脚本ID必须以 \\"{prefix}\\" 开头","Script created":"脚本已创建","Script saved":"脚本已保存","Script deleted":"脚本已删除","Are you sure you want to delete the Script?":"是否确认删除此脚本？","This Script is locked by you":"当前脚本已被您锁定","This Script is locked by other user ({user})":"当前脚本已被其他用户（{user}）锁定"}}'),delete t.options._Ctor}},"69b6":function(t,e,r){"use strict";r("740d")},"6e45":function(t,e,r){"use strict";r("4709")},"72d7":function(t,e,r){},"740d":function(t,e,r){},"7b0b4":function(t,e,r){"use strict";var a=r("0797"),n=r.n(a);e["default"]=n.a},"98e2":function(t,e,r){"use strict";r.r(e);r("a4d3"),r("e01a");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.pageTitle)+" "),e("code",{staticClass:"text-main"},[t._v(t._s(t.data.title||t.data.id))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px",model:t.form,disabled:!t.isEditable,rules:t.formRules}},[t.isLockedByMe?e("el-form-item",[e("InfoBlock",{attrs:{type:"success",title:t.$t("This Script is locked by you")}})],1):t.isLockedByOther?e("el-form-item",[e("InfoBlock",{attrs:{type:t.isEditable?"warning":"error",title:t.$t("This Script is locked by other user ({user})",{user:t.lockedByUser})}})],1):t._e(),t._v(" "),e("el-form-item",{attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{disabled:"setup"===t.T.setupPageMode(),maxlength:"64"},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("Script ID will be a part of the Func ID")}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Title")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),maxlength:"25"},model:{value:t.form.title,callback:function(e){t.$set(t.form,"title",e)},expression:"form.title"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Description")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000"},model:{value:t.form.description,callback:function(e){t.$set(t.form,"description",e)},expression:"form.description"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Script Template")}},[e("el-select",{on:{change:t.showScriptTemplate},model:{value:t.templateScriptId,callback:function(e){t.templateScriptId=e},expression:"templateScriptId"}},[e("el-option-group",[e("el-option",{key:"_basicExample",attrs:{label:t.$t("Basic Example"),value:"_basicExample"}}),t._v(" "),e("el-option",{key:"_blankScript",attrs:{label:t.$t("Blank Script"),value:"_blankScript"}})],1),t._v(" "),e("el-option-group",{attrs:{label:t.$t("From Example Script")}},t._l(t.templateScripts,(function(r){return e("el-option",{key:r.id,attrs:{label:r.label,value:r.id}},[e("span",{staticClass:"example-script"},[t._v(t._s(r.label))])])})),1)],1),t._v(" "),t.templateScript?e("el-button",{attrs:{type:"text"},on:{click:t.showScriptTemplate}},[t._v(t._s(t.$t("Show Script Template")))]):t._e()],1),t._v(" "),e("el-form-item",["setup"===t.T.setupPageMode()?e("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("div",{staticClass:"setup-right"},[e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],1)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1),t._v(" "),e("LongTextDialog",{ref:"longTextDialog",attrs:{title:t.$t("Script Template"),mode:"python"}})],1)],1)},n=[],i=r("c7eb"),o=r("1da1"),s=(r("d3b7"),r("159b"),r("a15b"),r("fb6a"),r("99af"),r("13d5"),r("b64b"),r("14d9"),r("d9e2"),r("b76c")),c={name:"ScriptSetup",components:{LongTextDialog:s["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var r=this;return Object(o["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,r.loadData();case 2:t.t0=r.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?9:10;break;case 5:return r.T.jsonClear(r.form),r.data={},r.form.id="".concat(r.scriptSetId,"__"),t.abrupt("break",10);case 9:return t.abrupt("break",10);case 10:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(o["a"])(Object(i["a"])().mark((function e(){var r,a;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:r=null,e.t0=t.T.setupPageMode(),e.next="add"===e.t0?4:"setup"===e.t0?13:23;break;case 4:return e.next=6,t.T.callAPI_getAll("/api/v1/scripts/do/list",{query:{fields:["id","title","scriptSetId","sset_title","code"],_withCode:!0,scriptName:"example"}});case 6:if(r=e.sent,r&&r.ok){e.next=9;break}return e.abrupt("return");case 9:return r.data.forEach((function(t){var e=t.id.split("__").slice(1).join("__");t.label="".concat(t.sset_title||t.scriptSetId," / ").concat(t.title||e)})),t.templateScripts=r.data,t.templateScriptMap=r.data.reduce((function(t,e){return t[e.id]=e,t}),{}),e.abrupt("break",23);case 13:return e.next=15,t.T.callAPI_getOne("/api/v1/scripts/do/list",t.scriptId);case 15:if(r=e.sent,r&&r.ok){e.next=18;break}return e.abrupt("return");case 18:return t.data=r.data,a={},Object.keys(t.form).forEach((function(e){return a[e]=t.data[e]})),t.form=a,e.abrupt("break",23);case 23:t.$store.commit("updateLoadStatus",!0);case 24:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(o["a"])(Object(i["a"])().mark((function e(){var r;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:r=null,e.t1=t.T.setupPageMode(),e.next="add"===e.t1?12:"setup"===e.t1?16:20;break;case 12:return e.next=14,t.addData();case 14:return r=e.sent,e.abrupt("break",20);case 16:return e.next=18,t.modifyData();case 18:return r=e.sent,e.abrupt("break",20);case 20:r&&t.$store.commit("updateEditor_selectedItemId",null);case 21:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(o["a"])(Object(i["a"])().mark((function e(){var r,a,n;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:r=t.T.jsonCopy(t.form),e.t0=t.templateScriptId,e.next="_basicExample"===e.t0?4:"_blankScript"===e.t0?6:8;break;case 4:return delete r.codeDraft,e.abrupt("break",11);case 6:return r.codeDraft="",e.abrupt("break",11);case 8:return a=t.templateScriptMap[t.templateScriptId],r.codeDraft=a&&a.code?a.code:"",e.abrupt("break",11);case 11:return e.next=13,t.T.callAPI("post","/api/v1/scripts/do/add",{body:{data:r},alert:{okMessage:t.$t("Script created")}});case 13:if(n=e.sent,n&&n.ok){e.next=16;break}return e.abrupt("return");case 16:return t.$store.commit("updateScriptListSyncTime"),t.$router.push({name:"code-editor",params:{id:n.data.id}}),e.abrupt("return",n.data.id);case 19:case"end":return e.stop()}}),e)})))()},modifyData:function(){var t=this;return Object(o["a"])(Object(i["a"])().mark((function e(){var r,a;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=t.T.jsonCopy(t.form),delete r.id,e.next=4,t.T.callAPI("post","/api/v1/scripts/:id/do/modify",{params:{id:t.scriptId},body:{data:r},alert:{okMessage:t.$t("Script saved")}});case 4:if(a=e.sent,a&&a.ok){e.next=7;break}return e.abrupt("return");case 7:return e.next=9,t.loadData();case 9:return t.$store.commit("updateScriptListSyncTime"),e.abrupt("return",t.scriptId);case 11:case"end":return e.stop()}}),e)})))()},deleteData:function(){var t=this;return Object(o["a"])(Object(i["a"])().mark((function e(){var r;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm(t.$t("Are you sure you want to delete the Script?"));case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/scripts/:id/do/delete",{params:{id:t.scriptId},alert:{okMessage:t.$t("Script deleted")}});case 6:if(r=e.sent,r&&r.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"intro"}),t.$store.commit("updateScriptListSyncTime");case 11:case"end":return e.stop()}}),e)})))()},showScriptTemplate:function(){this.templateScript&&this.$refs.longTextDialog.update(this.templateScript)}},computed:{pageTitle:function(){var t={setup:this.$t("Setup Script"),add:this.$t("Add Script")};return t[this.T.setupPageMode()]},scriptSetId:function(){switch(this.T.setupPageMode()){case"add":return this.$route.params.id;case"setup":return this.data.scriptSetId}},scriptId:function(){switch(this.T.setupPageMode()){case"add":return this.form.id;case"setup":return this.$route.params.id}},lockedByUserId:function(){return this.data.sset_lockedByUserId||this.data.lockedByUserId},lockedByUser:function(){return this.data.sset_lockedByUserId?"".concat(this.data.sset_lockedByUserName||this.data.sset_lockedByUsername):this.data.lockedByUserId?"".concat(this.data.lockedByUserName||this.data.lockedByUsername):void 0},isLockedByMe:function(){return this.lockedByUserId===this.$store.getters.userId},isLockedByOther:function(){return this.lockedByUserId&&!this.isLockedByMe},isEditable:function(){return!!this.$store.getters.isAdmin||!this.isLockedByOther},templateScript:function(){return this.templateScriptId&&!this.T.isNothing(this.templateScriptMap)&&this.templateScriptMap[this.templateScriptId]&&this.templateScriptMap[this.templateScriptId].code||""}},props:{},data:function(){var t=this;return{data:{},templateScriptId:"_basicExample",templateScripts:[],templateScriptMap:{},form:{id:null,title:null,description:null,codeDraft:null},formRules:{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g},{trigger:"change",validator:function(e,r,a){var n="".concat(t.scriptSetId,"__");if(r.indexOf(n)<0||r===n){var i=t.$t('Script ID should starts with "{prefix}"',{scriptSetId:t.scriptSetId,prefix:n});return a(new Error(i))}return a()}}]}}}},l=c,d=(r("9a67"),r("2877")),p=r("f1f2"),u=Object(d["a"])(l,a,n,!1,null,"b737b924",null);"function"===typeof p["default"]&&Object(p["default"])(u);e["default"]=u.exports},"9a67":function(t,e,r){"use strict";r("72d7")},b76c:function(t,e,r){"use strict";var a=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.title)+"\n    "),e("span",{staticClass:"text-info press-esc-to-close-tip"},[t._v(t._s(t.$t("Press ESC to close")))])]),t._v(" "),e("div",[t.showDownload&&t.fileName&&t.content?e("div",{staticClass:"download-link"},[e("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n        "+t._s(t.$t("Download as text file"))+"\n        "),e("i",{staticClass:"fa fa-fw fa-download"})])],1):t._e(),t._v(" "),e("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},n=[],i=(r("130f"),r("21a6")),o=r.n(i),s={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var r=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){r.codeMirror||(r.codeMirror=r.T.initCodeMirror("longTextDialogContent",r.mode||"text"),r.codeMirror.setOption("theme",r.T.getCodeMirrorThemeName()),r.T.setCodeMirrorReadOnly(r.codeMirror,!0)),r.codeMirror.setValue(r.content||""),r.codeMirror.refresh(),r.codeMirror.focus()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;o.a.saveAs(t,e)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=s,l=(r("69b6"),r("6e45"),r("2877")),d=r("7b0b4"),p=Object(l["a"])(c,a,n,!1,null,"40d05b04",null);"function"===typeof d["default"]&&Object(d["default"])(p);e["a"]=p.exports},f1f2:function(t,e,r){"use strict";var a=r("49e6"),n=r.n(a);e["default"]=n.a}}]);