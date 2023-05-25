(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-6343cfa4"],{"0861":function(t,e,a){"use strict";a.r(e);a("b0c0");var r=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.pageTitle)+" "),e("code",{staticClass:"text-main"},[t._v(t._s(t.data.func_title))])])]),t._v(" "),e("el-main",[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:15}},[e("div",{staticClass:"common-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px",model:t.form,rules:t.formRules}},["add"===t.T.setupPageMode()?e("el-form-item",{attrs:{label:t.$t("Customize ID"),prop:"useCustomId"}},[e("el-switch",{model:{value:t.useCustomId,callback:function(e){t.useCustomId=e},expression:"useCustomId"}}),t._v(" "),e("span",{staticClass:"text-main float-right"},[t._v("\n                  "+t._s(t.$t("URL Preview"))+t._s(t.$t(":"))+"\n                  "),e("code",{staticClass:"code-font"},[t._v(t._s("/api/v1/al/".concat(t.useCustomId?t.form.id:t.$t("randomIDString"))))])])],1):t._e(),t._v(" "),"add"===t.T.setupPageMode()?e("el-form-item",{directives:[{name:"show",rawName:"v-show",value:t.useCustomId,expression:"useCustomId"}],attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{maxlength:"50"},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("ID will be a part of the calling URL")}})],1):t._e(),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Func"),prop:"funcId"}},[e("el-cascader",{ref:"funcCascader",staticClass:"func-cascader-input",attrs:{"popper-class":"code-font",placeholder:"--",filterable:"","filter-method":t.common.funcCascaderFilter,options:t.funcCascader,props:{expandTrigger:"hover",emitPath:!1,multiple:!1}},on:{change:t.autoFillFuncCallKwargsJSON},model:{value:t.form.funcId,callback:function(e){t.$set(t.form,"funcId",e)},expression:"form.funcId"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Arguments"),prop:"funcCallKwargsJSON"}},[e("el-input",{attrs:{type:"textarea",resize:"none",autosize:{minRows:2}},model:{value:t.form.funcCallKwargsJSON,callback:function(e){t.$set(t.form,"funcCallKwargsJSON",e)},expression:"form.funcCallKwargsJSON"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("JSON formated arguments (**kwargs)")}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("parameterHint")}}),t._v(" "),t.apiCustomKwargsSupport?e("InfoBlock",{attrs:{type:"success",title:t.$t("The Func accepts extra arguments not listed above")}}):t._e()],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Tags"),prop:"tagsJSON"}},[t._l(t.form.tagsJSON,(function(a){return e("el-tag",{key:a,attrs:{type:"warning",size:"small",closable:""},on:{close:function(e){return t.removeTag(a)}}},[t._v(t._s(a))])})),t._v(" "),t.showAddTag?e("el-input",{ref:"newTag",attrs:{size:"mini"},on:{blur:t.addTag},nativeOn:{keyup:function(e){return!e.type.indexOf("key")&&t._k(e.keyCode,"enter",13,e.key,"Enter")?null:t.addTag.apply(null,arguments)}},model:{value:t.newTag,callback:function(e){t.newTag=e},expression:"newTag"}}):e("el-button",{attrs:{type:"text"},on:{click:t.openAddTagInput}},[t._v(t._s(t.$t("Add Tag")))])],2),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Task Info")}},[e("span",{staticClass:"task-info-limit-prefix"},[t._v(t._s(t.$t("Keep"))+" ")]),t._v(" "),t.fixedTaskInfoLimit?e("el-input-number",{staticClass:"task-info-limit-input",attrs:{disabled:!0,value:t.fixedTaskInfoLimit}}):e("el-input-number",{staticClass:"task-info-limit-input",attrs:{min:t.$store.getters.SYSTEM_INFO("_TASK_INFO_MIN_LIMIT"),max:t.$store.getters.SYSTEM_INFO("_TASK_INFO_MAX_LIMIT"),step:10,precision:0},model:{value:t.form.taskInfoLimit,callback:function(e){t.$set(t.form,"taskInfoLimit",e)},expression:"form.taskInfoLimit"}}),t._v(" "),e("span",{staticClass:"task-info-limit-unit"},[t._v(t._s(t.$tc("recentTaskCount",t.form.taskInfoLimit,{n:""}))+" ")]),t._v(" "),e("el-link",{staticClass:"task-info-limit-clear",attrs:{type:"primary"},on:{click:function(e){e.stopPropagation(),t.form.taskInfoLimit=t.$store.getters.SYSTEM_INFO("_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK")}}},[t._v(t._s(t.$t("Restore Default")))])],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("API Auth"),prop:"apiAuthId"}},[e("el-select",{model:{value:t.form.apiAuthId,callback:function(e){t.$set(t.form,"apiAuthId",e)},expression:"form.apiAuthId"}},t._l(t.apiAuthOptions,(function(t){return e("el-option",{key:t.id,attrs:{label:t.label,value:t.id}})})),1)],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Show in doc"),prop:"showInDoc"}},[e("el-switch",{model:{value:t.form.showInDoc,callback:function(e){t.$set(t.form,"showInDoc",e)},expression:"form.showInDoc"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Expires"),prop:"expireTime"}},[e("el-date-picker",{staticClass:"expire-time-input",attrs:{type:"datetime",align:"left",format:"yyyy-MM-dd HH:mm",clearable:!0,"picker-options":t.datetimePickerOptions},model:{value:t.form.expireTime,callback:function(e){t.$set(t.form,"expireTime",e)},expression:"form.expireTime"}})],1),t._v(" "),t._l(t.C.AUTH_LINK_THROTTLING,(function(a,r){return[e("el-form-item",{attrs:{label:0===r?t.$t("Limiting"):"",prop:"throttlingJSON.".concat(a.key)}},[e("el-input-number",{staticClass:"throttling-input",attrs:{min:1,step:1,precision:0},model:{value:t.form.throttlingJSON[a.key],callback:function(e){t.$set(t.form.throttlingJSON,a.key,e)},expression:"form.throttlingJSON[opt.key]"}}),t._v(" "),e("span",{staticClass:"throttling-unit"},[t._v(t._s(t.$tc(a.name,t.form.throttlingJSON[a.key],{n:""}))+" ")]),t._v(" "),e("el-link",{staticClass:"throttling-clear",on:{click:function(e){e.stopPropagation(),t.form.throttlingJSON[a.key]=void 0}}},[t._v(t._s(t.$t("Clear")))])],1)]})),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Note")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"200"},model:{value:t.form.note,callback:function(e){t.$set(t.form,"note",e)},expression:"form.note"}})],1),t._v(" "),e("el-form-item",["setup"===t.T.setupPageMode()?e("el-button",{on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("div",{staticClass:"setup-right"},[e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],2)],1)]),t._v(" "),e("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=a("c7eb"),i=a("1da1"),o=(a("d3b7"),a("159b"),a("b64b"),a("e9c4"),a("d81d"),a("99af"),a("25f0"),a("14d9"),a("a434"),a("d9e2"),a("ac1f"),a("466d"),{name:"AuthLinkSetup",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:t.t0=a.T.setupPageMode(),t.next="add"===t.t0?5:"setup"===t.t0?11:12;break;case 5:return a.T.jsonClear(a.form),a.form.throttlingJSON={},a.form.showInDoc=!1,a.form.taskInfoLimit=a.$store.getters.SYSTEM_INFO("_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK"),a.data={},t.abrupt("break",12);case 11:return t.abrupt("break",12);case 12:case"end":return t.stop()}}),t)})))()}},useCustomId:function(t){this.form.id=t?"".concat(this.ID_PREFIX,"foobar"):null}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r,n,i;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("setup"!==t.T.setupPageMode()){e.next=15;break}return e.next=3,t.T.callAPI_getOne("/api/v1/auth-links/do/list",t.$route.params.id);case 3:if(a=e.sent,a&&a.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=a.data,r={},Object.keys(t.form).forEach((function(e){return r[e]=t.data[e]})),r.funcCallKwargsJSON=JSON.stringify(r.funcCallKwargsJSON,null,2),r.tagsJSON=r.tagsJSON||[],r.apiAuthId=t.data.apia_id,r.throttlingJSON=r.throttlingJSON||{},t.T.isNothing(r.taskInfoLimit)&&(r.taskInfoLimit=t.$store.getters.SYSTEM_INFO("_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK")),t.form=r;case 15:return e.next=17,t.common.getFuncList();case 17:return n=e.sent,t.funcMap=n.map,t.funcCascader=n.cascader,e.next=22,t.common.getAPIAuthList();case 22:i=e.sent,t.apiAuthList=i,t.$store.commit("updateLoadStatus",!0);case 25:case"end":return e.stop()}}),e)})))()},submitData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:e.t1=t.T.setupPageMode(),e.next="add"===e.t1?11:"setup"===e.t1?14:17;break;case 11:return e.next=13,t.addData();case 13:return e.abrupt("return",e.sent);case 14:return e.next=16,t.modifyData();case 16:return e.abrupt("return",e.sent);case 17:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:a={body:{data:t.T.jsonCopy(t.form)},alert:{okMessage:t.$t("Auth Link created")}},e.prev=1,a.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](1),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 8:return e.next=10,t.T.callAPI("post","/api/v1/auth-links/do/add",a);case 10:if(r=e.sent,r&&r.ok){e.next=13;break}return e.abrupt("return");case 13:t.$store.commit("updateTableList_scrollY"),t.$store.commit("updateHighlightedTableDataId",r.data.id),t.$router.push({name:"auth-link-list",query:t.T.getPrevQuery()});case 16:case"end":return e.stop()}}),e,null,[[1,5]])})))()},modifyData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a,r,n;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:a=t.T.jsonCopy(t.form),delete a.id,r={params:{id:t.$route.params.id},body:{data:a},alert:{okMessage:t.$t("Auth Link saved")}},e.prev=3,r.body.data.funcCallKwargsJSON=JSON.parse(t.form.funcCallKwargsJSON),e.next=10;break;case 7:return e.prev=7,e.t0=e["catch"](3),e.abrupt("return",t.T.alert("".concat(t.$t("Invalid argument format"),"<br>").concat(e.t0.toString())));case 10:return e.next=12,t.T.callAPI("post","/api/v1/auth-links/:id/do/modify",r);case 12:if(n=e.sent,n&&n.ok){e.next=15;break}return e.abrupt("return");case 15:t.$store.commit("updateHighlightedTableDataId",n.data.id),t.$router.push({name:"auth-link-list",query:t.T.getPrevQuery()});case 17:case"end":return e.stop()}}),e,null,[[3,7]])})))()},deleteData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm(t.$t("Are you sure you want to delete the Auth Link?"));case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/auth-links/:id/do/delete",{params:{id:t.$route.params.id},alert:{okMessage:t.$t("Auth Link deleted")}});case 6:if(a=e.sent,a&&a.ok){e.next=9;break}return e.abrupt("return");case 9:t.$router.push({name:"auth-link-list",query:t.T.getPrevQuery()});case 10:case"end":return e.stop()}}),e)})))()},autoFillFuncCallKwargsJSON:function(t){var e=this.funcMap[t].argsJSON||Object.keys(this.funcMap[t].kwargsJSON),a={};e.forEach((function(t){0===t.indexOf("**")||(a[t]="INPUT_BY_CALLER")})),this.form.funcCallKwargsJSON=JSON.stringify(a,null,2)},removeTag:function(t){this.form.tagsJSON.splice(this.form.tagsJSON.indexOf(t),1)},openAddTagInput:function(){var t=this;this.showAddTag=!0,this.$nextTick((function(e){t.$refs.newTag.$refs.input.focus()}))},addTag:function(){var t=this.newTag;t&&(Array.isArray(this.form.tagsJSON)||this.$set(this.form,"tagsJSON",[]),this.form.tagsJSON.push(t)),this.showAddTag=!1,this.newTag=""}},computed:{ID_PREFIX:function(){return"auln-"},pageTitle:function(){var t={setup:this.$t("Setup Auth Link"),add:this.$t("Add Auth Link")};return t[this.T.setupPageMode()]},apiCustomKwargsSupport:function(){var t=this.form.funcId;if(!t)return!1;if(!this.funcMap[t])return!1;for(var e in this.funcMap[t].kwargsJSON)if(0===e.indexOf("**"))return!0;return!1},apiAuthOptions:function(){var t=this;return this.apiAuthList.map((function(e){var a=t.C.API_AUTH_MAP.get(e.type).name;return e.label="[".concat(a,"] ").concat(e.name||""),e}))},datetimePickerOptions:function(){var t=this,e=(new Date).getTime(),a=[1,3,7,30,90,365],r=[];return a.forEach((function(a){var n=new Date;n.setTime(e+86400*a*1e3),r.push({text:t.$tc("shortcutDays",a),onClick:function(t){t.$emit("pick",n)}})})),{shortcuts:r}}},props:{},data:function(){var t=this,e=this.$t('Please input arguments, input "{}" when no argument');return{data:{},funcMap:{},funcCascader:[],apiAuthList:[],useCustomId:!1,showAddTag:!1,newTag:"",form:{id:null,funcId:null,funcCallKwargsJSON:null,tagsJSON:[],apiAuthId:null,expireTime:null,throttlingJSON:{},showInDoc:!1,taskInfoLimit:this.$store.getters.SYSTEM_INFO("_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK"),note:null},formRules:{id:[{trigger:"change",validator:function(e,a,r){if(t.T.notNothing(a)){if(0!==a.indexOf(t.ID_PREFIX)||a===t.ID_PREFIX)return r(new Error(t.$t('ID must starts with "{prefix}"',{prefix:t.ID_PREFIX})));if(!a.match(/^[0-9a-zA-Z\.\-\_]+$/g))return r(new Error(t.$t("Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed")))}return r()}}],funcId:[{trigger:"change",message:this.$t("Please select Func"),required:!0}],expireTime:[{trigger:"change",message:this.$t("Only date-time between 1970 and 2037 are allowed"),validator:function(e,a,r){var n=t.M(a).unix();return n<t.T.MIN_UNIX_TIMESTAMP?r(new Error(t.$t("Date-time cannot earlier than 1970"))):n>t.T.MAX_UNIX_TIMESTAMP?r(new Error(t.$t("Date-time cannot later than 2037"))):r()}}],funcCallKwargsJSON:[{trigger:"change",message:e,required:!0},{trigger:"change",validator:function(t,a,r){try{var n=JSON.parse(a);return Array.isArray(n)?r(new Error(e)):r()}catch(s){return r(new Error(e))}}}]}}}}),u=o,c=(a("45d1"),a("2877")),l=a("d66c"),d=a("a26d"),f=Object(c["a"])(u,r,n,!1,null,"c599e54e",null);"function"===typeof l["default"]&&Object(l["default"])(f),"function"===typeof d["default"]&&Object(d["default"])(f);e["default"]=f.exports},"12a5":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"randomIDString":"auln-{随机 ID}","Add Auth Link":"添加授权链接","Setup Auth Link":"配置授权链接","Customize ID":"定制 ID","Func":"执行函数","Arguments":"参数指定","Task Info":"任务信息","Keep":"保留","Tags":"标签","Add Tag":"添加标签","Show in doc":"显示于文档","Expires":"有效期","Limiting":"限流","Note":"备注","URL Preview":"URL预览","ID will be a part of the calling URL":"此 ID 用于生成调用时的 URL","JSON formated arguments (**kwargs)":"JSON 格式的参数（**kwargs）","The Func accepts extra arguments not listed above":"本函数允许传递额外的自定义函数参数","ID must starts with \\"{prefix}\\"":"ID 必须以\\"{prefix}\\"开头","Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed":"只能输入数字、英文、点（.）、下划线（_）以及连字符（-）","Please select Func":"请选择执行函数","Please input arguments, input \\"{}\\" when no argument":"请输入参数，无参数时填写 \\"{}\\"","Only date-time between 1970 and 2037 are allowed":"只能选择1970年至2037年之间的日期","Date-time cannot earlier than 1970":"日期不能早于1970年","Date-time cannot later than 2037":"时间不能晚于2037年","Auth Link created":"授权链接已创建","Auth Link saved":"授权链接已保存","Auth Link deleted":"授权链接已删除","Are you sure you want to delete the Auth Link?":"是否确认删除此授权链接？","Invalid argument format":"参数格式不正确","parameterHint":"参数值指定为 \\"INPUT_BY_CALLER\\" 时，允许调用时指定本参数","shortcutDays":"{n} 天","recentTaskCount":"{n} 个近期任务"}}'),delete t.options._Ctor}},"1b5b":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"randomIDString":"auln-{Random ID}","parameterHint":"When the parameter value is specified as \\"INPUT_BY_CALLER\\", this parameter is allowed to be specified by the caller","shortcutDays":"{n} day | {n} days","recentTaskCount":"recent {n} task | recent {n} tasks"}}'),delete t.options._Ctor}},"45d1":function(t,e,a){"use strict";a("5845")},5845:function(t,e,a){},a26d:function(t,e,a){"use strict";var r=a("12a5"),n=a.n(r);e["default"]=n.a},a434:function(t,e,a){"use strict";var r=a("23e7"),n=a("7b0b"),s=a("23cb"),i=a("5926"),o=a("07fa"),u=a("3511"),c=a("65f0"),l=a("8418"),d=a("083a"),f=a("1dde"),p=f("splice"),m=Math.max,h=Math.min;r({target:"Array",proto:!0,forced:!p},{splice:function(t,e){var a,r,f,p,g,_,v=n(this),b=o(v),k=s(t,b),I=arguments.length;for(0===I?a=r=0:1===I?(a=0,r=b-k):(a=I-2,r=h(m(i(e),0),b-k)),u(b+a-r),f=c(v,r),p=0;p<r;p++)g=k+p,g in v&&l(f,p,v[g]);if(f.length=r,a<r){for(p=k;p<b-r;p++)g=p+r,_=p+a,g in v?v[_]=v[g]:d(v,_);for(p=b;p>b-r+a;p--)d(v,p-1)}else if(a>r)for(p=b-r;p>k;p--)g=p+r-1,_=p+a-1,g in v?v[_]=v[g]:d(v,_);for(p=0;p<a;p++)v[p+k]=arguments[p+2];return v.length=b-r+a,f}})},d66c:function(t,e,a){"use strict";var r=a("1b5b"),n=a.n(r);e["default"]=n.a}}]);