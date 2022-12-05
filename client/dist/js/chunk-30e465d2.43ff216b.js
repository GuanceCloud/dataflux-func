(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-30e465d2"],{"49e6":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Add Script":"添加脚本","Setup Script":"配置脚本","Script ID will be a part of the Func ID":"脚本集ID将作为函数ID的一部分","Please input ID":"请输入ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","Script ID should starts with \\"{prefix}\\"":"脚本ID必须以 \\"{prefix}\\" 开头","Script created":"脚本已创建","Script saved":"脚本已保存","Script deleted":"脚本已删除","Are you sure you want to delete the Script?":"是否确认删除此脚本？","This Script is locked by you":"当前脚本已被您锁定","This Script is locked by other user({user})":"当前脚本已被其他用户（{user}）锁定"}}'),delete t.options._Ctor}},"98e2":function(t,e,r){"use strict";r.r(e);r("a4d3"),r("e01a");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.pageTitle)+" "),e("code",{staticClass:"text-main"},[t._v(t._s(t.data.title||t.data.id))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px",model:t.form,disabled:!t.isEditable,rules:t.formRules}},[t.isLockedByMe?e("el-form-item",[e("InfoBlock",{attrs:{type:"success",title:t.$t("This Script is locked by you")}})],1):t.isLockedByOther?e("el-form-item",[e("InfoBlock",{attrs:{type:t.isEditable?"warning":"error",title:t.$t("This Script is locked by other user({user})",{user:t.lockedByUser})}})],1):t._e(),t._v(" "),e("el-form-item",{attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{disabled:"setup"===t.T.setupPageMode(),maxlength:"64","show-word-limit":""},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("Script ID will be a part of the Func ID")}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Title")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),maxlength:"25","show-word-limit":""},model:{value:t.form.title,callback:function(e){t.$set(t.form,"title",e)},expression:"form.title"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Description")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:t.form.description,callback:function(e){t.$set(t.form,"description",e)},expression:"form.description"}})],1),t._v(" "),e("el-form-item",["setup"===t.T.setupPageMode()?e("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("div",{staticClass:"setup-right"},[e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],1)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},s=[],i=r("c7eb"),n=r("1da1"),o=(r("d3b7"),r("159b"),r("b64b"),r("d9e2"),{name:"ScriptSetup",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var r=this;return Object(n["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,r.loadData();case 2:t.t0=r.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?9:10;break;case 5:return r.T.jsonClear(r.form),r.data={},r.form.id="".concat(r.scriptSetId,"__"),t.abrupt("break",10);case 9:return t.abrupt("break",10);case 10:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(n["a"])(Object(i["a"])().mark((function e(){var r,a;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("setup"!==t.T.setupPageMode()){e.next=10;break}return e.next=3,t.T.callAPI_getOne("/api/v1/scripts/do/list",t.scriptId);case 3:if(r=e.sent,r.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=r.data,a={},Object.keys(t.form).forEach((function(e){return a[e]=t.data[e]})),t.form=a;case 10:t.$store.commit("updateLoadStatus",!0);case 11:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(n["a"])(Object(i["a"])().mark((function e(){var r;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:r=null,e.t1=t.T.setupPageMode(),e.next="add"===e.t1?12:"setup"===e.t1?16:20;break;case 12:return e.next=14,t.addData();case 14:return r=e.sent,e.abrupt("break",20);case 16:return e.next=18,t.modifyData();case 18:return r=e.sent,e.abrupt("break",20);case 20:r&&t.$store.commit("updateEditor_selectedItemId",null);case 21:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(n["a"])(Object(i["a"])().mark((function e(){var r;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI("post","/api/v1/scripts/do/add",{body:{data:t.T.jsonCopy(t.form)},alert:{okMessage:t.$t("Script created")}});case 2:if(r=e.sent,r.ok){e.next=5;break}return e.abrupt("return");case 5:return t.$store.commit("updateScriptListSyncTime"),t.$router.push({name:"code-editor",params:{id:r.data.id}}),e.abrupt("return",r.data.id);case 8:case"end":return e.stop()}}),e)})))()},modifyData:function(){var t=this;return Object(n["a"])(Object(i["a"])().mark((function e(){var r,a;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=t.T.jsonCopy(t.form),delete r.id,e.next=4,t.T.callAPI("post","/api/v1/scripts/:id/do/modify",{params:{id:t.scriptId},body:{data:r},alert:{okMessage:t.$t("Script saved")}});case 4:if(a=e.sent,a.ok){e.next=7;break}return e.abrupt("return");case 7:return e.next=9,t.loadData();case 9:return t.$store.commit("updateScriptListSyncTime"),e.abrupt("return",t.scriptId);case 11:case"end":return e.stop()}}),e)})))()},deleteData:function(){var t=this;return Object(n["a"])(Object(i["a"])().mark((function e(){var r;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm(t.$t("Are you sure you want to delete the Script?"));case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/scripts/:id/do/delete",{params:{id:t.scriptId},alert:{okMessage:t.$t("Script deleted")}});case 6:if(r=e.sent,r.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"intro"}),t.$store.commit("updateScriptListSyncTime");case 11:case"end":return e.stop()}}),e)})))()}},computed:{formRules:function(){var t=this;return{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g},{trigger:"change",validator:function(e,r,a){var s="".concat(t.scriptSetId,"__");if(r.indexOf(s)<0||r===s){var i=t.$t('Script ID should starts with "{prefix}"',{scriptSetId:t.scriptSetId,prefix:s});return a(new Error(i))}return a()}}]}},pageTitle:function(){var t={setup:this.$t("Setup Script"),add:this.$t("Add Script")};return t[this.T.setupPageMode()]},scriptSetId:function(){switch(this.T.setupPageMode()){case"add":return this.$route.params.id;case"setup":return this.data.scriptSetId}},scriptId:function(){switch(this.T.setupPageMode()){case"add":return this.form.id;case"setup":return this.$route.params.id}},lockedByUserId:function(){return this.data.sset_lockedByUserId||this.data.lockedByUserId},lockedByUser:function(){return this.data.sset_lockedByUserId?"".concat(this.data.sset_lockedByUserName||this.data.sset_lockedByUsername):this.data.lockedByUserId?"".concat(this.data.lockedByUserName||this.data.lockedByUsername):void 0},isLockedByMe:function(){return this.lockedByUserId===this.$store.getters.userId},isLockedByOther:function(){return this.lockedByUserId&&!this.isLockedByMe},isEditable:function(){return!!this.$store.getters.isAdmin||!this.isLockedByOther}},props:{},data:function(){return{data:{},form:{id:null,title:null,description:null}}}}),c=o,d=r("2877"),u=r("f1f2"),l=Object(d["a"])(c,a,s,!1,null,"3287d188",null);"function"===typeof u["default"]&&Object(u["default"])(l);e["default"]=l.exports},f1f2:function(t,e,r){"use strict";var a=r("49e6"),s=r.n(a);e["default"]=s.a}}]);