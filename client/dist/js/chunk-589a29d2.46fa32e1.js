(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-589a29d2"],{"0fa9":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add ENV":"添加环境变量","Setup ENV":"配置环境变量","Title":"标题","Description":"描述","Value":"值","Value Type":"值类型","Please input ID":"请输入ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","Please input Value":"请输入值","ENV Variable created":"环境变量已创建","ENV Variable saved":"环境变量已保存","ENV Variable deleted":"环境变量已删除","Are you sure you want to delete the ENV?":"是否确认删除此环境变量？"}}'),delete e.options._Ctor}},2045:function(e,t,a){"use strict";var r=a("0fa9"),n=a.n(r);t["default"]=n.a},"3c95":function(e,t,a){"use strict";a.r(t);var r=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[e._v(e._s(e.pageTitle)+" "),a("code",{staticClass:"text-main"},[e._v(e._s(e.data.title||e.data.id))])])]),e._v(" "),a("el-main",[a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:15}},[a("div",{staticClass:"common-form"},[a("el-form",{ref:"form",attrs:{"label-width":"120px",model:e.form,rules:e.formRules}},[a("el-form-item",{attrs:{label:"ID",prop:"id"}},[a("el-input",{attrs:{disabled:"setup"===e.T.setupPageMode(),maxlength:"40","show-word-limit":""},model:{value:e.form.id,callback:function(t){e.$set(e.form,"id",t)},expression:"form.id"}})],1),e._v(" "),a("el-form-item",{attrs:{label:e.$t("Title")}},[a("el-input",{attrs:{placeholder:e.$t("Optional"),maxlength:"25","show-word-limit":""},model:{value:e.form.title,callback:function(t){e.$set(e.form,"title",t)},expression:"form.title"}})],1),e._v(" "),a("el-form-item",{attrs:{label:e.$t("Description")}},[a("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:e.form.description,callback:function(t){e.$set(e.form,"description",t)},expression:"form.description"}})],1),e._v(" "),a("el-form-item",{attrs:{label:e.$t("Value"),prop:"valueTEXT"}},[a("el-input",{attrs:{type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000","show-word-limit":""},model:{value:e.form.valueTEXT,callback:function(t){e.$set(e.form,"valueTEXT",t)},expression:"form.valueTEXT"}})],1),e._v(" "),a("el-form-item",{attrs:{label:e.$t("Value Type")}},[a("el-select",{model:{value:e.form.autoTypeCasting,callback:function(t){e.$set(e.form,"autoTypeCasting",t)},expression:"form.autoTypeCasting"}},e._l(e.C.ENV_VARIABLE,(function(e){return a("el-option",{key:e.key,attrs:{label:e.name,value:e.key}})})),1),e._v(" "),e.C.ENV_VARIABLE_MAP.get(e.form.autoTypeCasting)?a("InfoBlock",{attrs:{title:e.C.ENV_VARIABLE_MAP.get(e.form.autoTypeCasting).tips}}):e._e()],1),e._v(" "),a("el-form-item",["setup"===e.T.setupPageMode()?a("el-button",{on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]):e._e(),e._v(" "),a("div",{staticClass:"setup-right"},[a("el-button",{attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)],1)],1)],1)]),e._v(" "),a("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=a("1da1"),i=(a("d3b7"),a("159b"),a("b64b"),a("96cf"),{name:"EnvVariableSetup",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:e.t0=a.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?9:10;break;case 5:return a.T.jsonClear(a.form),a.data={},a.form.autoTypeCasting="string",e.abrupt("break",10);case 9:return e.abrupt("break",10);case 10:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a,r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=10;break}return t.next=3,e.T.callAPI_getOne("/api/v1/env-variables/do/list",e.$route.params.id);case 3:if(a=t.sent,a.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=a.data,r={},Object.keys(e.form).forEach((function(t){return r[t]=e.data[t]})),e.form=r;case 10:e.$store.commit("updateLoadStatus",!0);case 11:case"end":return t.stop()}}),t)})))()},submitData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.T.setupPageMode(),t.next="add"===t.t1?11:"setup"===t.t1?14:17;break;case 11:return t.next=13,e.addData();case 13:return t.abrupt("return",t.sent);case 14:return t.next=16,e.modifyData();case 16:return t.abrupt("return",t.sent);case 17:case"end":return t.stop()}}),t,null,[[0,5]])})))()},addData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI("post","/api/v1/env-variables/do/add",{body:{data:e.T.jsonCopy(e.form)},alert:{okMessage:e.$t("ENV Variable created")}});case 2:if(a=t.sent,a.ok){t.next=5;break}return t.abrupt("return");case 5:e.$router.push({name:"env-variable-setup",params:{id:a.data.id}}),e.$store.commit("updateEnvVariableListSyncTime");case 7:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a,r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.T.jsonCopy(e.form),delete a.id,t.next=4,e.T.callAPI("post","/api/v1/env-variables/:id/do/modify",{params:{id:e.$route.params.id},body:{data:a},alert:{okMessage:e.$t("ENV Variable saved")}});case 4:if(r=t.sent,r.ok){t.next=7;break}return t.abrupt("return");case 7:e.$store.commit("updateEnvVariableListSyncTime");case 8:case"end":return t.stop()}}),t)})))()},deleteData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm(e.$t("Are you sure you want to delete the ENV?"));case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("/api/v1/env-variables/:id/do/delete",{params:{id:e.$route.params.id},alert:{okMessage:e.$t("ENV Variable deleted")}});case 6:if(a=t.sent,a.ok){t.next=9;break}return t.abrupt("return");case 9:e.$router.push({name:"intro"}),e.$store.commit("updateEnvVariableListSyncTime");case 11:case"end":return t.stop()}}),t)})))()}},computed:{formRules:function(){return{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g}],valueTEXT:[{trigger:"change",message:this.$t("Please input Value"),required:!0}]}},pageTitle:function(){var e={setup:this.$t("Setup ENV"),add:this.$t("Add ENV")};return e[this.T.setupPageMode()]}},props:{},data:function(){return{data:{},form:{id:null,title:null,description:null,valueTEXT:null,autoTypeCasting:null}}}}),o=i,u=a("2877"),l=a("2045"),c=Object(u["a"])(o,r,n,!1,null,"7770456a",null);"function"===typeof l["default"]&&Object(l["default"])(c);t["default"]=c.exports}}]);