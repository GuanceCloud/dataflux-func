(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-c7ffc746"],{"70a3":function(t,e,r){"use strict";var a=r("d0fc"),n=r.n(a);e["default"]=n.a},d0fc:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Add Script Set":"添加脚本集","Setup Script Set":"配置脚本集","Title":"标题","Description":"描述","Requirements":"依赖包","Script Set ID will be a part of the Func ID":"脚本集ID将作为函数ID的一部分","requirements.txt format, one for each line":"requirements.txt 文件格式，一行一个","Go to PIP tool to install":"前往PIP工具安装","Please input ID":"请输入ID","Script Set ID too long":"脚本集ID过长","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","ID cannot contains double underscore \\"__\\"":"脚本集ID不能包含\\"__\\"，\\"__\\"为脚本集ID与脚本ID的分隔标志","Script Set created":"脚本集已创建","Script Set saved":"脚本集已保存","Script Set deleted":"脚本集已删除","Script Set cloned":"脚本集已克隆","Are you sure you want to delete the Script Set?":"是否确认删除此脚本集？","This Script Set is locked by you":"当前脚本已被您锁定","This Script Set is locked by other user({user})":"当前脚本已被其他用户（{user}）锁定","Please input new Script Set ID":"请输入新脚本集ID","Inputed Script Set ID already exists":"输入的脚本集ID已经存在"}}'),delete t.options._Ctor}},e145:function(t,e,r){"use strict";r.r(e);r("a4d3"),r("e01a");var a=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.pageTitle)+" "),e("code",{staticClass:"text-main"},[t._v(t._s(t.data.title||t.data.id))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"120px",model:t.form,disabled:!t.isEditable,rules:t.formRules}},[t.isLockedByMe?e("el-form-item",[e("InfoBlock",{attrs:{type:"success",title:t.$t("This Script Set is locked by you")}})],1):t.isLockedByOther?e("el-form-item",[e("InfoBlock",{attrs:{type:t.isEditable?"warning":"error",title:t.$t("This Script Set is locked by other user({user})",{user:t.lockedByUser})}})],1):t._e(),t._v(" "),e("el-form-item",{attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{disabled:"setup"===t.T.setupPageMode(),maxlength:"32","show-word-limit":""},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("Script Set ID will be a part of the Func ID")}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Title")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),maxlength:"25","show-word-limit":""},model:{value:t.form.title,callback:function(e){t.$set(t.form,"title",e)},expression:"form.title"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Description")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:t.form.description,callback:function(e){t.$set(t.form,"description",e)},expression:"form.description"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Requirements")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:t.form.requirements,callback:function(e){t.$set(t.form,"requirements",e)},expression:"form.requirements"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("requirements.txt format, one for each line")}}),t._v(" "),e("div",{staticClass:"setup-right"},[t.requirementsTEXT?e("el-button",{attrs:{type:"text"},on:{click:t.goToPIPTool}},[t._v(t._s(t.$t("Go to PIP tool to install")))]):t._e()],1)],1),t._v(" "),e("el-form-item",["setup"===t.T.setupPageMode()?e("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("div",{staticClass:"setup-right"},["setup"===t.T.setupPageMode()?[e("el-button",{on:{click:t.cloneData}},[t._v(t._s(t.$t("Clone")))])]:t._e(),t._v(" "),e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],2)],1)],1)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=r("c7eb"),i=r("1da1"),o=(r("d3b7"),r("159b"),r("b64b"),r("ac1f"),r("466d"),r("d9e2"),r("a15b"),r("1276"),{name:"ScriptSetSetup",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var r=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,r.loadData();case 2:t.t0=r.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?8:9;break;case 5:return r.T.jsonClear(r.form),r.data={},t.abrupt("break",9);case 8:return t.abrupt("break",9);case 9:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r,a;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("setup"!==t.T.setupPageMode()){e.next=10;break}return e.next=3,t.T.callAPI_getOne("/api/v1/script-sets/do/list",t.scriptSetId);case 3:if(r=e.sent,r.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=r.data,a={},Object.keys(t.form).forEach((function(e){return a[e]=t.data[e]})),t.form=a;case 10:t.$store.commit("updateLoadStatus",!0);case 11:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:r=null,e.t1=t.T.setupPageMode(),e.next="add"===e.t1?12:"setup"===e.t1?16:20;break;case 12:return e.next=14,t.addData();case 14:return r=e.sent,e.abrupt("break",20);case 16:return e.next=18,t.modifyData();case 18:return r=e.sent,e.abrupt("break",20);case 20:r&&t.$store.commit("updateEditor_selectedItemId",null);case 21:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI("post","/api/v1/script-sets/do/add",{body:{data:t.T.jsonCopy(t.form)},alert:{okMessage:t.$t("Script Set created")}});case 2:if(r=e.sent,r.ok){e.next=5;break}return e.abrupt("return");case 5:return t.$router.push({name:"intro"}),t.$store.commit("updateScriptListSyncTime"),e.abrupt("return",r.data.id);case 8:case"end":return e.stop()}}),e)})))()},modifyData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r,a;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=t.T.jsonCopy(t.form),delete r.id,e.next=4,t.T.callAPI("post","/api/v1/script-sets/:id/do/modify",{params:{id:t.scriptSetId},body:{data:r},alert:{okMessage:t.$t("Script Set saved")}});case 4:if(a=e.sent,a.ok){e.next=7;break}return e.abrupt("return");case 7:return t.$store.commit("updateScriptListSyncTime"),e.abrupt("return",t.scriptSetId);case 9:case"end":return e.stop()}}),e)})))()},deleteData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm(t.$t("Are you sure you want to delete the Script Set?"));case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/script-sets/:id/do/delete",{params:{id:t.scriptSetId},alert:{okMessage:t.$t("Script Set deleted")}});case 6:if(r=e.sent,r.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"intro"}),t.$store.commit("updateScriptListSyncTime");case 11:case"end":return e.stop()}}),e)})))()},cloneData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var r,a,n;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r={inputValidator:function(e){return e.length<=0?t.$t("Please input ID"):e.length>32?t.$t("Script Set ID too long"):e.match(/^[a-zA-Z0-9_]*$/g)?!!e.match(/^[^0-9]/g)||t.$t("Cannot not starts with a number"):t.$t("Only alphabets, numbers and underscore are allowed")}},e.next=3,t.T.prompt(t.$t("Please input new Script Set ID"),"".concat(t.scriptSetId,"_2"),r);case 3:if(a=e.sent,a){e.next=6;break}return e.abrupt("return");case 6:return e.next=8,t.T.callAPI_getOne("/api/v1/script-sets/do/list",a);case 8:if(n=e.sent,!n.data){e.next=11;break}return e.abrupt("return",t.T.alert(t.$t("Inputed Script Set ID already exists")));case 11:return e.next=13,t.T.callAPI("post","/api/v1/script-sets/:id/do/clone",{params:{id:t.scriptSetId},body:{newId:a},alert:{okMessage:t.$t("Script Set cloned")}});case 13:if(n=e.sent,n.ok){e.next=16;break}return e.abrupt("return");case 16:t.$store.commit("updateScriptListSyncTime");case 17:case"end":return e.stop()}}),e)})))()},goToPIPTool:function(){this.$router.push({name:"pip-tool",query:{pkgs:this.T.getBase64(this.requirementsTEXT)}})}},computed:{formRules:function(){var t=this;return{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g},{trigger:"change",validator:function(e,r,a){if(r.indexOf("__")>=0){var n=t.$t('ID cannot contains double underscore "__"');return a(new Error(n))}return a()}}]}},pageTitle:function(){var t={setup:this.$t("Setup Script Set"),add:this.$t("Add Script Set")};return t[this.T.setupPageMode()]},scriptSetId:function(){switch(this.T.setupPageMode()){case"add":return this.form.id;case"setup":return this.$route.params.id}},lockedByUser:function(){return"".concat(this.data.lockedByUserName||this.data.lockedByUsername)},isLockedByMe:function(){return this.data.lockedByUserId===this.$store.getters.userId},isLockedByOther:function(){return this.data.lockedByUserId&&!this.isLockedByMe},isEditable:function(){return!!this.$store.getters.isAdmin||!this.isLockedByOther},requirementsTEXT:function(){if(!this.form.requirements)return null;var t=this.form.requirements.split(/\s+/).join(" ");return t}},props:{},data:function(){return{data:{},form:{id:null,title:null,description:null,requirements:null}}}}),c=o,u=r("2877"),l=r("70a3"),d=Object(u["a"])(c,a,n,!1,null,"4f796404",null);"function"===typeof l["default"]&&Object(l["default"])(d);e["default"]=d.exports}}]);