(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-30e465d2"],{"49e6":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add Script":"添加脚本","Setup Script":"配置脚本","Title":"标题","Description":"描述","Script ID will be a part of the Func ID":"脚本集ID将作为函数ID的一部分","Please input ID":"请输入ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","Script ID should starts with \\"{prefix}\\"":"脚本ID必须以 \\"{prefix}\\" 开头","Script created":"脚本已创建","Script saved":"脚本已保存","Script deleted":"脚本已删除","Are you sure you want to delete the Script?":"是否确认删除此脚本？","This Script Set is locked by someone else, setup is disabled":"当前脚本已被其他人锁定，无法更改配置","This Script Set is locked by you, setup is disabled to others":"当前脚本已被您锁定，其他人无法更改配置"}}'),delete e.options._Ctor}},"98e2":function(e,t,r){"use strict";r.r(t);var a=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("transition",{attrs:{name:"fade"}},[r("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[r("el-header",{attrs:{height:"60px"}},[r("h1",[e._v(e._s(e.pageTitle)+" "),r("code",{staticClass:"text-main"},[e._v(e._s(e.data.title||e.data.id))])])]),e._v(" "),r("el-main",[r("el-row",{attrs:{gutter:20}},[r("el-col",{attrs:{span:15}},[r("div",{staticClass:"common-form"},[r("el-form",{ref:"form",attrs:{"label-width":"120px",model:e.form,disabled:e.isLockedByOther,rules:e.formRules}},[e.isLockedByOther?r("el-form-item",[r("InfoBlock",{attrs:{type:"error",title:e.$t("This Script Set is locked by someone else, setup is disabled")}})],1):e.data.isLocked?r("el-form-item",[r("InfoBlock",{attrs:{type:"success",title:e.$t("This Script Set is locked by you, setup is disabled to others")}})],1):e._e(),e._v(" "),r("el-form-item",{attrs:{label:"ID",prop:"id"}},[r("el-input",{attrs:{disabled:"setup"===e.T.setupPageMode(),maxlength:"80","show-word-limit":""},model:{value:e.form.id,callback:function(t){e.$set(e.form,"id",t)},expression:"form.id"}}),e._v(" "),r("InfoBlock",{attrs:{title:e.$t("Script ID will be a part of the Func ID")}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Title")}},[r("el-input",{attrs:{placeholder:e.$t("Optional"),maxlength:"25","show-word-limit":""},model:{value:e.form.title,callback:function(t){e.$set(e.form,"title",t)},expression:"form.title"}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Description")}},[r("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:e.form.description,callback:function(t){e.$set(e.form,"description",t)},expression:"form.description"}})],1),e._v(" "),r("el-form-item",["setup"===e.T.setupPageMode()?r("el-button",{on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]):e._e(),e._v(" "),r("div",{staticClass:"setup-right"},[r("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)],1)],1)],1)]),e._v(" "),r("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},s=[],i=r("1da1"),n=(r("d3b7"),r("159b"),r("b64b"),r("96cf"),{name:"ScriptSetup",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var r=this;return Object(i["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.loadData();case 2:e.t0=r.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?9:10;break;case 5:return r.T.jsonClear(r.form),r.data={},r.form.id="".concat(r.scriptSetId,"__"),e.abrupt("break",10);case 9:return e.abrupt("break",10);case 10:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=10;break}return t.next=3,e.T.callAPI_getOne("/api/v1/scripts/do/list",e.scriptId);case 3:if(r=t.sent,r.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=r.data,a={},Object.keys(e.form).forEach((function(t){return a[t]=e.data[t]})),e.form=a;case 10:e.$store.commit("updateLoadStatus",!0);case 11:case"end":return t.stop()}}),t)})))()},submitData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:r=null,t.t1=e.T.setupPageMode(),t.next="add"===t.t1?12:"setup"===t.t1?16:20;break;case 12:return t.next=14,e.addData();case 14:return r=t.sent,t.abrupt("break",20);case 16:return t.next=18,e.modifyData();case 18:return r=t.sent,t.abrupt("break",20);case 20:r&&(e.$store.commit("updateAsideScript_currentNodeKey",r),e.$store.commit("updateEditor_highlightedFuncId",null));case 21:case"end":return t.stop()}}),t,null,[[0,5]])})))()},addData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI("post","/api/v1/scripts/do/add",{body:{data:e.T.jsonCopy(e.form)},alert:{okMessage:e.$t("Script created")}});case 2:if(r=t.sent,r.ok){t.next=5;break}return t.abrupt("return");case 5:return e.$store.commit("updateScriptListSyncTime"),e.$router.push({name:"code-editor",params:{id:r.data.id}}),t.abrupt("return",r.data.id);case 8:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return r=e.T.jsonCopy(e.form),delete r.id,t.next=4,e.T.callAPI("post","/api/v1/scripts/:id/do/modify",{params:{id:e.scriptId},body:{data:r},alert:{okMessage:e.$t("Script saved")}});case 4:if(a=t.sent,a.ok){t.next=7;break}return t.abrupt("return");case 7:return t.next=9,e.loadData();case 9:return e.$store.commit("updateScriptListSyncTime"),t.abrupt("return",e.scriptId);case 11:case"end":return t.stop()}}),t)})))()},deleteData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm(e.$t("Are you sure you want to delete the Script?"));case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("/api/v1/scripts/:id/do/delete",{params:{id:e.scriptId},alert:{okMessage:e.$t("Script deleted")}});case 6:if(r=t.sent,r.ok){t.next=9;break}return t.abrupt("return");case 9:e.$router.push({name:"intro"}),e.$store.commit("updateScriptListSyncTime");case 11:case"end":return t.stop()}}),t)})))()}},computed:{formRules:function(){var e=this;return{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g},{trigger:"change",validator:function(t,r,a){var s="".concat(e.scriptSetId,"__");if(r.indexOf(s)<0||r===s){var i=e.$t('Script ID should starts with "{prefix}"',{scriptSetId:e.scriptSetId,prefix:s});return a(new Error(i))}return a()}}]}},pageTitle:function(){var e={setup:this.$t("Setup Script"),add:this.$t("Add Script")};return e[this.T.setupPageMode()]},scriptSetId:function(){switch(this.T.setupPageMode()){case"add":return this.$route.params.id;case"setup":return this.data.scriptSetId}},scriptId:function(){switch(this.T.setupPageMode()){case"add":return this.form.id;case"setup":return this.$route.params.id}},isLockedByOther:function(){return this.data.lockedByUserId&&this.data.lockedByUserId!==this.$store.getters.userId||this.data.sset_lockedByUserId&&this.data.sset_lockedByUserId!==this.$store.getters.userId}},props:{},data:function(){return{data:{},form:{id:null,title:null,description:null}}}}),o=n,c=r("2877"),u=r("f1f2"),d=Object(c["a"])(o,a,s,!1,null,"3c53a222",null);"function"===typeof u["default"]&&Object(u["default"])(d);t["default"]=d.exports},f1f2:function(e,t,r){"use strict";var a=r("49e6"),s=r.n(a);t["default"]=s.a}}]);