(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-38a96863"],{2706:function(t,e,a){"use strict";var r=a("cb4c"),n=a.n(r);e["default"]=n.a},2939:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"randomIDString":"bat-{Random ID}","parameterHint":"When the parameter value is specified as \\"INPUT_BY_CALLER\\", this parameter is allowed to be specified by the caller","recentTaskCount":"recent {n} task | recent {n} tasks"}}'),delete t.options._Ctor}},"6a77":function(t,e,a){"use strict";var r=a("2939"),n=a.n(r);e["default"]=n.a},"86ce":function(t,e,a){"use strict";a("8ad9")},"8ad9":function(t,e,a){},a434:function(t,e,a){"use strict";var r=a("23e7"),n=a("7b0b"),s=a("23cb"),i=a("5926"),o=a("07fa"),u=a("3511"),c=a("65f0"),l=a("8418"),f=a("083a"),d=a("1dde"),p=d("splice"),m=Math.max,h=Math.min;r({target:"Array",proto:!0,forced:!p},{splice:function(t,e){var a,r,d,p,g,b,v=n(this),I=o(v),_=s(t,I),k=arguments.length;for(0===k?a=r=0:1===k?(a=0,r=I-_):(a=k-2,r=h(m(i(e),0),I-_)),u(I+a-r),d=c(v,r),p=0;p<r;p++)g=_+p,g in v&&l(d,p,v[g]);if(d.length=r,a<r){for(p=_;p<I-r;p++)g=p+r,b=p+a,g in v?v[b]=v[g]:f(v,b);for(p=I;p>I-r+a;p--)f(v,p-1)}else if(a>r)for(p=I-r;p>_;p--)g=p+r-1,b=p+a-1,g in v?v[b]=v[g]:f(v,b);for(p=0;p<a;p++)v[p+_]=arguments[p+2];return v.length=I-r+a,d}})},cb4c:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"randomIDString":"bat-{随机 ID}","Add Batch":"添加批处理","Setup Batch":"修改批处理","Customize ID":"定制 ID","Func":"执行函数","Arguments":"参数指定","Task Info":"任务信息","Keep":"保留","Tags":"标签","Add Tag":"添加标签","Note":"备注","URL Preview":"URL预览","ID will be a part of the calling URL":"此 ID 用于生成调用时的 URL","JSON formated arguments (**kwargs)":"JSON 格式的参数（**kwargs）","The Func accepts extra arguments not listed above":"本函数允许传递额外的自定义函数参数","ID must starts with \\"{prefix}\\"":"ID 必须以\\"{prefix}\\"开头","Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed":"只能输入数字、英文、点（.）、下划线（_）以及连字符（-）","Please select Func":"请选择执行函数","Please input arguments, input \\"{}\\" when no argument":"请输入参数，无参数时填写 \\"{}\\"","Batch created":"批处理已创建","Batch saved":"批处理已保存","Batch deleted":"批处理已删除","Are you sure you want to delete the Batch?":"是否确认删除此批处理？","Invalid argument format":"参数格式不正确","parameterHint":"参数值指定为 \\"INPUT_BY_CALLER\\" 时表示允许调用时指定本参数","recentTaskCount":"{n} 个近期任务"}}'),delete t.options._Ctor}},ff59:function(t,e,a){"use strict";a.r(e);var r=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.pageTitle)+" "),e("code",{staticClass:"text-main"},[t._v(t._s(t.data.func_title))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px",model:t.form,rules:t.formRules}},["add"===t.T.setupPageMode()?e("el-form-item",{attrs:{label:t.$t("Customize ID"),prop:"useCustomId"}},[e("el-switch",{model:{value:t.useCustomId,callback:function(e){t.useCustomId=e},expression:"useCustomId"}}),t._v(" "),e("span",{staticClass:"text-main float-right"},[t._v("\n                  "+t._s(t.$t("URL Preview"))+t._s(t.$t(":"))+"\n                  "),e("code",{staticClass:"code-font"},[t._v(t._s("/api/v1/bat/".concat(t.useCustomId?t.form.id:t.$t("randomIDString"))))])])],1):t._e(),t._v(" "),"add"===t.T.setupPageMode()?e("el-form-item",{directives:[{name:"show",rawName:"v-show",value:t.useCustomId,expression:"useCustomId"}],attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{maxlength:"50"},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("ID will be a part of the calling URL")}})],1):t._e(),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Func"),prop:"funcId"}},[e("el-cascader",{ref:"funcCascader",staticClass:"func-cascader-input",attrs:{"popper-class":"code-font",placeholder:"--",filterable:"","filter-method":t.common.funcCascaderFilter,options:t.funcCascader,props:{expandTrigger:"hover",emitPath:!1,multiple:!1}},on:{change:t.autoFillFuncCallKwargsJSON},model:{value:t.form.funcId,callback:function(e){t.$set(t.form,"funcId",e)},expression:"form.funcId"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Arguments"),prop:"funcCallKwargsJSON"}},[e("el-input",{attrs:{type:"textarea",resize:"none",autosize:{minRows:2}},model:{value:t.form.funcCallKwargsJSON,callback:function(e){t.$set(t.form,"funcCallKwargsJSON",e)},expression:"form.funcCallKwargsJSON"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("JSON formated arguments (**kwargs)")}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("parameterHint")}}),t._v(" "),t.apiCustomKwargsSupport?e("InfoBlock",{attrs:{type:"success",title:t.$t("The Func accepts extra arguments not listed above")}}):t._e()],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Tags"),prop:"tagsJSON"}},[t._l(t.form.tagsJSON,(function(a){return e("el-tag",{key:a,attrs:{type:"warning",size:"small",closable:""},on:{close:function(e){return t.removeTag(a)}}},[t._v(t._s(a))])})),t._v(" "),t.showAddTag?e("el-input",{ref:"newTag",attrs:{size:"mini"},on:{blur:t.addTag},nativeOn:{keyup:function(e){return!e.type.indexOf("key")&&t._k(e.keyCode,"enter",13,e.key,"Enter")?null:t.addTag.apply(null,arguments)}},model:{value:t.newTag,callback:function(e){t.newTag=e},expression:"newTag"}}):e("el-button",{attrs:{type:"text"},on:{click:t.openAddTagInput}},[t._v(t._s(t.$t("Add Tag")))])],2),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Task Info")}},[e("span",{staticClass:"task-info-limit-prefix"},[t._v(t._s(t.$t("Keep"))+" ")]),t._v(" "),t.fixedTaskInfoLimit?e("el-input-number",{staticClass:"task-info-limit-input",attrs:{disabled:!0,value:t.fixedTaskInfoLimit}}):e("el-input-number",{staticClass:"task-info-limit-input",attrs:{min:t.$store.getters.CONFIG("_TASK_INFO_MIN_LIMIT"),max:t.$store.getters.CONFIG("_TASK_INFO_MAX_LIMIT"),step:10,precision:0},model:{value:t.form.taskInfoLimit,callback:function(e){t.$set(t.form,"taskInfoLimit",e)},expression:"form.taskInfoLimit"}}),t._v(" "),e("span",{staticClass:"task-info-limit-unit"},[t._v(t._s(t.$tc("recentTaskCount",t.form.taskInfoLimit,{n:""}))+" ")]),t._v(" "),e("el-link",{staticClass:"task-info-limit-clear",attrs:{type:"primary"},on:{click:function(e){e.stopPropagation(),t.form.taskInfoLimit=t.$store.getters.CONFIG("_TASK_INFO_DEFAULT_LIMIT_BATCH")}}},[t._v(t._s(t.$t("Restore Default")))])],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("API Auth"),prop:"apiAuthId"}},[e("el-select",{model:{value:t.form.apiAuthId,callback:function(e){t.$set(t.form,"apiAuthId",e)},expression:"form.apiAuthId"}},t._l(t.apiAuthOptions,(function(t){return e("el-option",{key:t.id,attrs:{label:t.label,value:t.id}})})),1)],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Note")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"200"},model:{value:t.form.note,callback:function(e){t.$set(t.form,"note",e)},expression:"form.note"}})],1),t._v(" "),e("el-form-item",["setup"===t.T.setupPageMode()?e("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("div",{staticClass:"setup-right"},[e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],1)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=a("c7eb"),i=a("1da1"),o=(a("d3b7"),a("159b"),a("b64b"),a("e9c4"),a("d81d"),a("99af"),a("25f0"),a("14d9"),a("a434"),a("b0c0"),a("d9e2"),a("ac1f"),a("466d"),{name:"BatchSetup",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:t.t0=a.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?9:10;break;case 5:return a.T.jsonClear(a.form),a.form.taskInfoLimit=a.$store.getters.CONFIG("_TASK_INFO_DEFAULT_LIMIT_BATCH"),a.data={},t.abrupt("break",10);case 9:return t.abrupt("break",10);case 10:case"end":return t.stop()}}),t)})))()}},useCustomId:function(t){this.form.id=t?"".concat(this.ID_PREFIX,"foobar"):null}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r,n,i;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("setup"!==t.T.setupPageMode()){e.next=14;break}return e.next=3,t.T.callAPI_getOne("/api/v1/batches/do/list",t.$route.params.id);case 3:if(a=e.sent,a&&a.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=a.data,r={},Object.keys(t.form).forEach((function(e){return r[e]=t.data[e]})),r.funcCallKwargsJSON=JSON.stringify(r.funcCallKwargsJSON,null,2),r.tagsJSON=r.tagsJSON||[],r.apiAuthId=t.data.apia_id,t.T.isNothing(r.taskInfoLimit)&&(r.taskInfoLimit=t.$store.getters.CONFIG("_TASK_INFO_DEFAULT_LIMIT_BATCH")),t.form=r;case 14:return e.next=16,t.common.getFuncList();case 16:return n=e.sent,t.funcMap=n.map,t.funcCascader=n.cascader,e.next=21,t.common.getAPIAuthList();case 21:i=e.sent,t.apiAuthList=i,t.$store.commit("updateLoadStatus",!0);case 24:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:e.t1=t.T.setupPageMode(),e.next="add"===e.t1?11:"setup"===e.t1?14:17;break;case 11:return e.next=13,t.addData();case 13:return e.abrupt("return",e.sent);case 14:return e.next=16,t.modifyData();case 16:return e.abrupt("return",e.sent);case 17:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r,n;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:a=t.T.jsonCopy(t.form),t.fixedTaskInfoLimit&&(a.taskInfoLimit=t.fixedTaskInfoLimit),r={body:{data:a},alert:{okMessage:t.$t("Batch created")}},e.prev=3,r.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=10;break;case 7:return e.prev=7,e.t0=e["catch"](3),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 10:return e.next=12,t.T.callAPI("post","/api/v1/batches/do/add",r);case 12:if(n=e.sent,n&&n.ok){e.next=15;break}return e.abrupt("return");case 15:t.$store.commit("updateTableList_scrollY"),t.$store.commit("updateHighlightedTableDataId",n.data.id),t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 18:case"end":return e.stop()}}),e,null,[[3,7]])})))()},modifyData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r,n;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:a=t.T.jsonCopy(t.form),t.fixedTaskInfoLimit&&(a.taskInfoLimit=t.fixedTaskInfoLimit),delete a.id,r={params:{id:t.$route.params.id},body:{data:a},alert:{okMessage:t.$t("Batch saved")}},e.prev=4,r.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=11;break;case 8:return e.prev=8,e.t0=e["catch"](4),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 11:return e.next=13,t.T.callAPI("post","/api/v1/batches/:id/do/modify",r);case 13:if(n=e.sent,n&&n.ok){e.next=16;break}return e.abrupt("return");case 16:t.$store.commit("updateHighlightedTableDataId",n.data.id),t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 18:case"end":return e.stop()}}),e,null,[[4,8]])})))()},deleteData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm("Are you sure you want to delete the Batch?");case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/batches/:id/do/delete",{params:{id:t.$route.params.id},alert:{okMessage:t.$t("Batch deleted")}});case 6:if(a=e.sent,a&&a.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"batch-list",query:t.T.getPrevQuery()});case 10:case"end":return e.stop()}}),e)})))()},autoFillFuncCallKwargsJSON:function(t){var e=this.funcMap[t].argsJSON||Object.keys(this.funcMap[t].kwargsJSON),a={};e.forEach((function(t){0===t.indexOf("**")||(a[t]="INPUT_BY_CALLER")})),this.form.funcCallKwargsJSON=JSON.stringify(a,null,2)},removeTag:function(t){this.form.tagsJSON.splice(this.form.tagsJSON.indexOf(t),1)},openAddTagInput:function(){var t=this;this.showAddTag=!0,this.$nextTick((function(e){t.$refs.newTag.$refs.input.focus()}))},addTag:function(){var t=this.newTag;t&&(Array.isArray(this.form.tagsJSON)||this.$set(this.form,"tagsJSON",[]),this.form.tagsJSON.push(t)),this.showAddTag=!1,this.newTag=""}},computed:{ID_PREFIX:function(){return"bat-"},pageTitle:function(){var t={setup:this.$t("Setup Batch"),add:this.$t("Add Batch")};return t[this.T.setupPageMode()]},apiCustomKwargsSupport:function(){var t=this.form.funcId;if(!t)return!1;if(!this.funcMap[t])return!1;for(var e in this.funcMap[t].kwargsJSON)if(0===e.indexOf("**"))return!0;return!1},fixedTaskInfoLimit:function(){var t=this.funcMap[this.form.funcId];return t&&t.extraConfigJSON&&t.extraConfigJSON.fixedTaskInfoLimit?t.extraConfigJSON.fixedTaskInfoLimit:null},apiAuthOptions:function(){var t=this;return this.apiAuthList.map((function(e){var a=t.C.API_AUTH_MAP.get(e.type).name;return e.label="[".concat(a,"] ").concat(e.name||""),e}))}},data:function(){var t=this,e=this.$t('Please input arguments, input "{}" when no argument');return{data:{},funcMap:{},funcCascader:[],apiAuthList:[],useCustomId:!1,showAddTag:!1,newTag:"",form:{id:null,funcId:null,funcCallKwargsJSON:null,tagsJSON:[],apiAuthId:null,taskInfoLimit:this.$store.getters.CONFIG("_TASK_INFO_DEFAULT_LIMIT_BATCH"),note:null},formRules:{id:[{trigger:"change",validator:function(e,a,r){if(t.T.notNothing(a)){if(0!==a.indexOf(t.ID_PREFIX)||a===t.ID_PREFIX)return r(new Error(t.$t('ID must starts with "{prefix}"',{prefix:t.ID_PREFIX})));if(!a.match(/^[0-9a-zA-Z\.\-\_]+$/g))return r(new Error(t.$t("Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed")))}return r()}}],funcId:[{trigger:"change",message:this.$t("Please select Func"),required:!0}],funcCallKwargsJSON:[{trigger:"change",message:e,required:!0},{trigger:"change",validator:function(t,a,r){try{var n=JSON.parse(a);return Array.isArray(n)?r(new Error(e)):r()}catch(s){return r(new Error(e))}}}]}}}}),u=o,c=(a("86ce"),a("2877")),l=a("6a77"),f=a("2706"),d=Object(c["a"])(u,r,n,!1,null,"8e1e16a2",null);"function"===typeof l["default"]&&Object(l["default"])(d),"function"===typeof f["default"]&&Object(f["default"])(d);e["default"]=d.exports}}]);