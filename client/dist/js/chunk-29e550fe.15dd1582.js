(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-29e550fe"],{"1bbc":function(t,e,a){"use strict";a("b25f")},2706:function(t,e,a){"use strict";var r=a("cb4c"),n=a.n(r);e["default"]=n.a},2939:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"randomIDString":"bat-{Random ID}","parameterHint":"When a parameter is set to \\"INPUT_BY_CALLER\\" means the parameter can be specified by the caller"}}'),delete t.options._Ctor}},"6a77":function(t,e,a){"use strict";var r=a("2939"),n=a.n(r);e["default"]=n.a},a434:function(t,e,a){t.exports=a("7ab4")(1168)},b25f:function(t,e,a){},cb4c:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"randomIDString":"bat-{随机ID}","Add Batch":"添加批处理","Setup Batch":"修改批处理","Customize ID":"定制ID","Func":"执行函数","Arguments":"参数指定","Tags":"标签","Add Tag":"添加标签","Note":"备注","URL Preview":"URL预览","ID will be a part of the calling URL":"此ID用于生成调用时的URL","JSON formated arguments (**kwargs)":"JSON格式的参数（**kwargs）","The Func accepts extra arguments not listed above":"本函数允许传递额外的自定义函数参数","ID must starts with \\"{prefix}\\"":"ID必须以\\"{prefix}\\"开头","Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed":"只能输入数字、英文、点（.）、下划线（_）以及连字符（-）","Please select Func":"请选择执行函数","Please input arguments, input \\"{}\\" when no argument":"请输入参数，无参数时填写 \\"{}\\"","Batch created":"批处理已创建","Batch saved":"批处理已保存","Batch deleted":"批处理已删除","Are you sure you want to delete the Batch?":"是否确认删除此批处理？","Invalid argument format":"参数格式不正确","parameterHint":"参数值指定为\\"INPUT_BY_CALLER\\"时表示允许调用时指定本参数"}}'),delete t.options._Ctor}},ff59:function(t,e,a){"use strict";a.r(e);var r=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[t._v(t._s(t.pageTitle)+" "),a("code",{staticClass:"text-main"},[t._v(t._s(t.data.func_title))])])]),t._v(" "),a("el-main",[a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:15}},[a("div",{staticClass:"common-form"},[a("el-form",{ref:"form",attrs:{"label-width":"120px",model:t.form,rules:t.formRules}},["add"===t.T.setupPageMode()?a("el-form-item",{attrs:{label:t.$t("Customize ID"),prop:"useCustomId"}},[a("el-switch",{model:{value:t.useCustomId,callback:function(e){t.useCustomId=e},expression:"useCustomId"}}),t._v(" "),a("span",{staticClass:"text-main float-right"},[t._v("\n                  "+t._s(t.$t("URL Preview"))+t._s(t.$t(":"))+"\n                  "),a("code",[t._v(t._s("/api/v1/bat/"+(t.useCustomId?t.form.id:t.$t("randomIDString"))))])])],1):t._e(),t._v(" "),"add"===t.T.setupPageMode()?a("el-form-item",{directives:[{name:"show",rawName:"v-show",value:t.useCustomId,expression:"useCustomId"}],attrs:{label:"ID",prop:"id"}},[a("el-input",{attrs:{maxlength:"50","show-word-limit":""},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),a("InfoBlock",{attrs:{title:t.$t("ID will be a part of the calling URL")}})],1):t._e(),t._v(" "),a("el-form-item",{attrs:{label:t.$t("Func"),prop:"funcId"}},[a("el-cascader",{ref:"funcCascader",staticClass:"func-cascader-input",attrs:{placeholder:"--",filterable:"",options:t.funcCascader,props:{expandTrigger:"hover",emitPath:!1,multiple:!1}},on:{change:t.autoFillFuncCallKwargsJSON},model:{value:t.form.funcId,callback:function(e){t.$set(t.form,"funcId",e)},expression:"form.funcId"}})],1),t._v(" "),a("el-form-item",{attrs:{label:t.$t("Arguments"),prop:"funcCallKwargsJSON"}},[a("el-input",{attrs:{type:"textarea",resize:"none",autosize:!0},model:{value:t.form.funcCallKwargsJSON,callback:function(e){t.$set(t.form,"funcCallKwargsJSON",e)},expression:"form.funcCallKwargsJSON"}}),t._v(" "),a("InfoBlock",{attrs:{title:t.$t("JSON formated arguments (**kwargs)")}}),t._v(" "),a("InfoBlock",{attrs:{title:t.$t("parameterHint")}}),t._v(" "),t.apiCustomKwargsSupport?a("InfoBlock",{attrs:{type:"success",title:t.$t("The Func accepts extra arguments not listed above")}}):t._e()],1),t._v(" "),a("el-form-item",{attrs:{label:t.$t("Tags"),prop:"tagsJSON"}},[t._l(t.form.tagsJSON,(function(e){return a("el-tag",{key:e,attrs:{type:"warning",size:"mini",closable:""},on:{close:function(a){return t.removeTag(e)}}},[t._v(t._s(e))])})),t._v(" "),t.showAddTag?a("el-input",{ref:"newTag",attrs:{size:"mini"},on:{blur:t.addTag},nativeOn:{keyup:function(e){return!e.type.indexOf("key")&&t._k(e.keyCode,"enter",13,e.key,"Enter")?null:t.addTag.apply(null,arguments)}},model:{value:t.newTag,callback:function(e){t.newTag=e},expression:"newTag"}}):a("el-button",{attrs:{type:"text"},on:{click:t.openAddTagInput}},[t._v(t._s(t.$t("Add Tag")))])],2),t._v(" "),a("el-form-item",{attrs:{label:t.$t("API Auth"),prop:"apiAuthId"}},[a("el-select",{model:{value:t.form.apiAuthId,callback:function(e){t.$set(t.form,"apiAuthId",e)},expression:"form.apiAuthId"}},t._l(t.apiAuthOptions,(function(t){return a("el-option",{key:t.id,attrs:{label:t.label,value:t.id}})})),1)],1),t._v(" "),a("el-form-item",{attrs:{label:t.$t("Note")}},[a("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"200","show-word-limit":""},model:{value:t.form.note,callback:function(e){t.$set(t.form,"note",e)},expression:"form.note"}})],1),t._v(" "),a("el-form-item",["setup"===t.T.setupPageMode()?a("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),a("div",{staticClass:"setup-right"},[a("el-button",{attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],1)],1)]),t._v(" "),a("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=a("1da1"),o=(a("d3b7"),a("159b"),a("b64b"),a("e9c4"),a("d81d"),a("99af"),a("25f0"),a("a434"),a("b0c0"),a("ac1f"),a("466d"),a("96cf"),{name:"BatchSetup",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:t.t0=a.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?8:9;break;case 5:return a.T.jsonClear(a.form),a.data={},t.abrupt("break",9);case 8:return t.abrupt("break",9);case 9:case"end":return t.stop()}}),t)})))()}},useCustomId:function(t){this.form.id=t?"".concat(this.ID_PREFIX,"foobar"):null}},methods:{loadData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){var a,r,n,s;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("setup"!==t.T.setupPageMode()){e.next=13;break}return e.next=3,t.T.callAPI_getOne("/api/v1/batches/do/list",t.$route.params.id);case 3:if(a=e.sent,a.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=a.data,r={},Object.keys(t.form).forEach((function(e){return r[e]=t.data[e]})),r.funcCallKwargsJSON=JSON.stringify(r.funcCallKwargsJSON,null,2),r.tagsJSON=r.tagsJSON||[],r.apiAuthId=t.data.apia_id,t.form=r;case 13:return e.next=15,t.common.getFuncList();case 15:return n=e.sent,t.funcMap=n.map,t.funcCascader=n.cascader,e.next=20,t.common.getAPIAuthList();case 20:s=e.sent,t.apiAuthList=s,t.$store.commit("updateLoadStatus",!0);case 23:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:e.t1=t.T.setupPageMode(),e.next="add"===e.t1?11:"setup"===e.t1?14:17;break;case 11:return e.next=13,t.addData();case 13:return e.abrupt("return",e.sent);case 14:return e.next=16,t.modifyData();case 16:return e.abrupt("return",e.sent);case 17:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){var a,r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:a={body:{data:t.T.jsonCopy(t.form)},alert:{okMessage:t.$t("Batch created")}},e.prev=1,a.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](1),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 8:return e.next=10,t.T.callAPI("post","/api/v1/batches/do/add",a);case 10:if(r=e.sent,r.ok){e.next=13;break}return e.abrupt("return");case 13:t.$store.commit("updateTableList_scrollY"),t.$store.commit("updateHighlightedTableDataId",r.data.id),t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 16:case"end":return e.stop()}}),e,null,[[1,5]])})))()},modifyData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){var a,r,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:a=t.T.jsonCopy(t.form),delete a.id,r={params:{id:t.$route.params.id},body:{data:a},alert:{okMessage:t.$t("Batch saved")}},e.prev=3,r.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=10;break;case 7:return e.prev=7,e.t0=e["catch"](3),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 10:return e.next=12,t.T.callAPI("post","/api/v1/batches/:id/do/modify",r);case 12:if(n=e.sent,n.ok){e.next=15;break}return e.abrupt("return");case 15:t.$store.commit("updateHighlightedTableDataId",n.data.id),t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 17:case"end":return e.stop()}}),e,null,[[3,7]])})))()},deleteData:function(){var t=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){var a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm("Are you sure you want to delete the Batch?");case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/batches/:id/do/delete",{params:{id:t.$route.params.id},alert:{okMessage:t.$t("Batch deleted")}});case 6:if(a=e.sent,a.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 10:case"end":return e.stop()}}),e)})))()},autoFillFuncCallKwargsJSON:function(t){var e=this.funcMap[t].argsJSON||Object.keys(this.funcMap[t].kwargsJSON),a={};e.forEach((function(t){0===t.indexOf("**")||(a[t]="INPUT_BY_CALLER")})),this.form.funcCallKwargsJSON=JSON.stringify(a,null,2)},removeTag:function(t){this.form.tagsJSON.splice(this.form.tagsJSON.indexOf(t),1)},openAddTagInput:function(){var t=this;this.showAddTag=!0,this.$nextTick((function(e){t.$refs.newTag.$refs.input.focus()}))},addTag:function(){var t=this.newTag;t&&(Array.isArray(this.form.tagsJSON)||this.$set(this.form,"tagsJSON",[]),this.form.tagsJSON.push(t)),this.showAddTag=!1,this.newTag=""}},computed:{ID_PREFIX:function(){return"bat-"},pageTitle:function(){var t={setup:this.$t("Setup Batch"),add:this.$t("Add Batch")};return t[this.T.setupPageMode()]},apiCustomKwargsSupport:function(){var t=this.form.funcId;if(!t)return!1;for(var e in this.funcMap[t].kwargsJSON)if(0===e.indexOf("**"))return!0;return!1},apiAuthOptions:function(){var t=this;return this.apiAuthList.map((function(e){var a=t.C.API_AUTH_MAP.get(e.type).name;return e.label="[".concat(a,"] ").concat(e.name||""),e}))},datetimePickerOptions:function(){var t=(new Date).getTime(),e=[1,3,7,30,90,365],a=[];return e.forEach((function(e){var r=new Date;r.setTime(t+86400*e*1e3),a.push({text:"".concat(e,"天"),onClick:function(t){t.$emit("pick",r)}})})),{shortcuts:a}}},props:{},data:function(){var t=this;return{data:{},funcMap:{},funcCascader:[],apiAuthList:[],useCustomId:!1,showAddTag:!1,newTag:"",form:{id:null,funcId:null,funcCallKwargsJSON:null,tagsJSON:[],apiAuthId:null,note:null},formRules:{id:[{trigger:"change",validator:function(e,a,r){if(!t.T.isNothing(a)){if(0!==a.indexOf(t.ID_PREFIX)||a===t.ID_PREFIX)return r(new Error('ID必须以"'.concat(t.ID_PREFIX,'"开头')));if(!a.match(/^[0-9a-zA-Z\.\-\_]+$/g))return r(new Error(t.$t("Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed")))}return r()}}],funcId:[{trigger:"change",message:"请选择执行函数",required:!0}],funcCallKwargsJSON:[{trigger:"change",message:"请输入调用参数，无参数的直接填写 {}",required:!0},{trigger:"change",message:"调用参数需要以 JSON 形式填写",validator:function(t,e,a){try{var r=JSON.parse(e);return Array.isArray(r)?a(new Error('调用参数需要以 JSON 形式填写，如 {"arg1": "value1"}')):a()}catch(n){return a(new Error("调用参数需要以 JSON 形式填写，无参数的直接填写 {}"))}}}]}}}}),i=o,u=(a("1bbc"),a("2877")),c=a("6a77"),l=a("2706"),d=Object(u["a"])(i,r,n,!1,null,"b9ca1520",null);"function"===typeof c["default"]&&Object(c["default"])(d),"function"===typeof l["default"]&&Object(l["default"])(d);e["default"]=d.exports}}]);