(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-2d856a61"],{"0797":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete e.options._Ctor}},"21a6":function(e,t,a){(function(a){var n,r,i;(function(a,o){r=[],n=o,i="function"===typeof n?n.apply(t,r):n,void 0===i||(e.exports=i)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function n(e,t,a){var n=new XMLHttpRequest;n.open("GET",e),n.responseType="blob",n.onload=function(){c(n.response,t,a)},n.onerror=function(){console.error("could not download file")},n.send()}function r(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function i(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(n){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var o="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof a&&a.global===a?a:void 0,s=o.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=o.saveAs||("object"!=typeof window||window!==o?function(){}:"download"in HTMLAnchorElement.prototype&&!s?function(e,t,a){var s=o.URL||o.webkitURL,c=document.createElement("a");t=t||e.name||"download",c.download=t,c.rel="noopener","string"==typeof e?(c.href=e,c.origin===location.origin?i(c):r(c.href)?n(e,t,a):i(c,c.target="_blank")):(c.href=s.createObjectURL(e),setTimeout((function(){s.revokeObjectURL(c.href)}),4e4),setTimeout((function(){i(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,a,o){if(a=a||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,o),a);else if(r(e))n(e,a,o);else{var s=document.createElement("a");s.href=e,s.target="_blank",setTimeout((function(){i(s)}))}}:function(e,t,a,r){if(r=r||open("","_blank"),r&&(r.document.title=r.document.body.innerText="downloading..."),"string"==typeof e)return n(e,t,a);var i="application/octet-stream"===e.type,c=/constructor/i.test(o.HTMLElement)||o.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||i&&c||s)&&"undefined"!=typeof FileReader){var u=new FileReader;u.onloadend=function(){var e=u.result;e=l?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),r?r.location.href=e:location=e,r=null},u.readAsDataURL(e)}else{var d=o.URL||o.webkitURL,f=d.createObjectURL(e);r?r.location=f:location.href=f,r=null,setTimeout((function(){d.revokeObjectURL(f)}),4e4)}});o.saveAs=c.saveAs=c,e.exports=c}))}).call(this,a("c8ba"))},"5fd9":function(e,t,a){"use strict";a("d3d5")},"681e":function(e,t,a){},"6e4d":function(e,t,a){"use strict";var n=a("7beb"),r=a.n(n);t["default"]=r.a},7935:function(e,t,a){"use strict";a("681e")},"7b0b4":function(e,t,a){"use strict";var n=a("0797"),r=a.n(n);t["default"]=r.a},"7beb":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add API Auth":"添加 API 认证","Setup API Auth":"配置 API 认证","Auth Type":"认证类型","Auth Config":"认证配置","Func":"认证函数","Note":"备注","Fixed Fields":"固定字段","Add Fixed Field":"添加固定字段","Field Name":"字段名","Field Value":"字段值","Users":"用户","Add User":"添加用户","Username":"用户名","Password (leave blank when not changing)":"密码（不修改时请留空）","Please select Func":"请选择认证函数","Func with a specific format is required":"必须指定特定格式的函数作为认证函数","Sample Code":"示例代码","API Auth created":"API 认证已创建","API Auth saved":"API 认证已保存","API Auth deleted":"API 认证已删除","Are you sure you want to delete the API Auth?":"是否确认删除此 API 认证？","Get / Check fields in Header":"获取/检查 Header 中字段","Get / Check fields in Query (e.g. http://you_domain/?auth-token=TOKEN)":"获取/检查 Query 中字段（如：http://you_domain/?auth-token=TOKEN）","Throw Exception when authentication fails":"认证失败时，抛出 Exception 即可","Return True when authentication succeeds":"认证成功时，返回 True 即可"}}'),delete e.options._Ctor}},a434:function(e,t,a){"use strict";var n=a("23e7"),r=a("7b0b"),i=a("23cb"),o=a("5926"),s=a("07fa"),c=a("3511"),l=a("65f0"),u=a("8418"),d=a("083a"),f=a("1dde"),p=f("splice"),m=Math.max,h=Math.min;n({target:"Array",proto:!0,forced:!p},{splice:function(e,t){var a,n,f,p,v,g,_=r(this),b=s(_),y=i(e,b),w=arguments.length;for(0===w?a=n=0:1===w?(a=0,n=b-y):(a=w-2,n=h(m(o(t),0),b-y)),c(b+a-n),f=l(_,n),p=0;p<n;p++)v=y+p,v in _&&u(f,p,_[v]);if(f.length=n,a<n){for(p=y;p<b-n;p++)v=p+n,g=p+a,v in _?_[g]=_[v]:d(_,g);for(p=b;p>b-n+a;p--)d(_,p-1)}else if(a>n)for(p=b-n;p>y;p--)v=p+n-1,g=p+a-1,v in _?_[g]=_[v]:d(_,g);for(p=0;p<a;p++)_[p+y]=arguments[p+2];return _.length=b-n+a,f}})},b76c:function(e,t,a){"use strict";var n=function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"LongTextDialog",visible:e.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(t){e.show=t}}},[t("template",{slot:"title"},[e.showDownload&&e.fileName&&e.content?t("el-link",{attrs:{type:"primary"},on:{click:e.download}},[e._v("\n      "+e._s(e.$t("Download as text file"))+"\n      "),t("i",{staticClass:"fa fa-fw fa-download"})]):e._e()],1),e._v(" "),t("div",[t("p",[e._v(e._s(e.title))]),e._v(" "),t("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},r=[],i=(a("130f"),a("21a6")),o=a.n(i),s={name:"LongTextDialog",components:{},watch:{},methods:{update:function(e,t){var a=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=e,this.fileName=(t||"dump")+".txt",this.show=!0,setImmediate((function(){a.codeMirror||(a.codeMirror=a.T.initCodeMirror("longTextDialogContent",a.mode||"text"),a.codeMirror.setOption("theme",a.T.getCodeMirrorThemeName()),a.T.setCodeMirrorReadOnly(a.codeMirror,!0)),a.codeMirror.setValue(a.content||""),a.codeMirror.refresh()}))},download:function(){var e=new Blob([this.content],{type:"text/plain"}),t=this.fileName;o.a.saveAs(e,t)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=s,l=(a("7935"),a("2877")),u=a("7b0b4"),d=Object(l["a"])(c,n,r,!1,null,"54d10888",null);"function"===typeof u["default"]&&Object(u["default"])(d);t["a"]=d.exports},d3d5:function(e,t,a){},f238:function(e,t,a){"use strict";a.r(t);a("b0c0");var n=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("h1",[e._v(e._s(e.pageTitle)+" "),e.data.name?t("code",{staticClass:"text-main"},[e._v(e._s(e.data.name||e.C.API_AUTH_MAP.get(e.selectedType).name))]):e._e()])]),e._v(" "),t("el-main",[t("el-row",{attrs:{gutter:20}},[t("el-col",{attrs:{span:15}},[t("div",{staticClass:"common-form"},[t("el-form",{ref:"form",attrs:{"label-width":"135px",model:e.form,rules:e.formRules}},["add"===e.T.setupPageMode()?t("el-form-item",{attrs:{label:e.$t("Auth Type"),prop:"type"}},[t("el-select",{on:{change:e.switchType},model:{value:e.form.type,callback:function(t){e.$set(e.form,"type",t)},expression:"form.type"}},e._l(e.C.API_AUTH,(function(e){return t("el-option",{key:e.key,attrs:{label:e.name,value:e.key}})})),1)],1):t("el-form-item",{attrs:{label:e.$t("Auth Type")}},[t("el-select",{attrs:{disabled:!0},model:{value:e.selectedType,callback:function(t){e.selectedType=t},expression:"selectedType"}},[t("el-option",{attrs:{label:e.C.API_AUTH_MAP.get(e.selectedType).name,value:e.selectedType}})],1)],1),e._v(" "),e.selectedType?[e.C.API_AUTH_MAP.get(e.selectedType).tips?t("el-form-item",[t("InfoBlock",{attrs:{type:"info",title:e.C.API_AUTH_MAP.get(e.selectedType).tips}})],1):e._e(),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Name")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),maxlength:"25"},model:{value:e.form.name,callback:function(t){e.$set(e.form,"name",t)},expression:"form.name"}})],1),e._v(" "),e.hasConfigField(e.selectedType,"fields")?[t("el-form-item",{staticClass:"config-divider",attrs:{label:e.$t("Fixed Fields")}},[t("el-divider")],1),e._v(" "),e._l(e.form.configJSON.fields||[],(function(a,n){return[t("el-form-item",{key:"fieldLocation-".concat(n),staticClass:"fixed-field-location",attrs:{label:"#".concat(n+1),prop:"configJSON.fields.".concat(n,".location"),rules:e.formRules_fixedFieldLocation}},[t("el-select",{model:{value:a.location,callback:function(t){e.$set(a,"location",t)},expression:"fixedField.location"}},e._l(e.C.API_AUTH_FIXED_FIELD_LOCATION,(function(e){return t("el-option",{key:e.key,attrs:{label:e.name,value:e.key}})})),1),e._v(" "),t("el-link",{attrs:{type:"primary"},on:{click:function(t){return t.preventDefault(),e.removeFixedFieldItem(n)}}},[e._v(e._s(e.$t("Delete")))])],1),e._v(" "),t("el-form-item",{key:"fieldName-".concat(n),staticClass:"fixed-field",attrs:{prop:"configJSON.fields.".concat(n,".name"),rules:e.formRules_fixedFieldName}},[t("el-input",{attrs:{placeholder:e.$t("Field Name")},model:{value:a.name,callback:function(t){e.$set(a,"name",t)},expression:"fixedField.name"}})],1),e._v(" "),t("el-form-item",{key:"fieldValue-".concat(n),staticClass:"fixed-field",attrs:{prop:"configJSON.fields.".concat(n,".value"),rules:e.formRules_fixedFieldValue}},[t("el-input",{attrs:{placeholder:e.$t("Field Value")},model:{value:a.value,callback:function(t){e.$set(a,"value",t)},expression:"fixedField.value"}})],1)]})),e._v(" "),t("el-form-item",[t("el-link",{attrs:{type:"primary"},on:{click:e.addFixedFieldItem}},[t("i",{staticClass:"fa fa-fw fa-plus"}),e._v(" "+e._s(e.$t("Add Fixed Field")))])],1)]:e._e(),e._v(" "),e.hasConfigField(e.selectedType,"users")?[t("el-form-item",{staticClass:"config-divider",attrs:{label:e.$t("Users")}},[t("el-divider")],1),e._v(" "),e._l(e.form.configJSON.users||[],(function(a,n){return[t("el-form-item",{key:"username-".concat(n),staticClass:"http-auth",attrs:{label:"#".concat(n+1),prop:"configJSON.users.".concat(n,".username"),rules:e.formRules_httpAuthUsername}},[t("el-input",{attrs:{placeholder:e.$t("Username")},model:{value:a.username,callback:function(t){e.$set(a,"username",t)},expression:"user.username"}}),e._v(" "),t("el-link",{attrs:{type:"primary"},on:{click:function(t){return t.preventDefault(),e.removeHTTPAuthUser(n)}}},[e._v(e._s(e.$t("Delete")))])],1),e._v(" "),t("el-form-item",{key:"password-".concat(n),staticClass:"http-auth",attrs:{prop:"configJSON.users.".concat(n,".password"),rules:e.formRules_httpAuthPassword}},[t("el-input",{attrs:{placeholder:e.$t("Password (leave blank when not changing)")},model:{value:a.password,callback:function(t){e.$set(a,"password",t)},expression:"user.password"}})],1)]})),e._v(" "),t("el-form-item",[t("el-link",{attrs:{type:"primary"},on:{click:e.addHTTPAuthUser}},[t("i",{staticClass:"fa fa-fw fa-plus"}),e._v(" "+e._s(e.$t("Add User")))])],1)]:e._e(),e._v(" "),e.hasConfigField(e.selectedType,"funcId")?[t("el-form-item",{attrs:{label:e.$t("Func"),prop:"configJSON.funcId"}},[t("el-cascader",{ref:"funcCascader",staticClass:"func-cascader-input",attrs:{placeholder:"--",filterable:"","filter-method":e.common.funcCascaderFilter,options:e.funcCascader,props:{expandTrigger:"hover",emitPath:!1,multiple:!1}},model:{value:e.form.configJSON.funcId,callback:function(t){e.$set(e.form.configJSON,"funcId",t)},expression:"form.configJSON.funcId"}}),e._v(" "),t("InfoBlock",{attrs:{type:"info",title:e.$t("Func with a specific format is required")}}),e._v(" "),t("el-button",{attrs:{type:"text"},on:{click:e.showAuthFuncSampleCode}},[e._v(e._s(e.$t("Sample Code")))])],1)]:e._e(),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Note")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"200"},model:{value:e.form.note,callback:function(t){e.$set(e.form,"note",t)},expression:"form.note"}})],1)]:e._e(),e._v(" "),t("el-form-item",["setup"===e.T.setupPageMode()?t("el-button",{on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]):e._e(),e._v(" "),t("div",{staticClass:"setup-right"},[t("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)],1)],2)],1)]),e._v(" "),t("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1),e._v(" "),t("LongTextDialog",{ref:"longTextDialog",attrs:{title:e.$t("Sample Code"),mode:"python"}})],1)],1)},r=[],i=a("c7eb"),o=a("1da1"),s=(a("d3b7"),a("159b"),a("b64b"),a("d81d"),a("14d9"),a("a434"),a("99af"),a("b76c")),c={name:"APIAuthSetup",components:{LongTextDialog:s["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(o["a"])(Object(i["a"])().mark((function e(){return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:e.t0=a.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?9:10;break;case 5:return a.T.jsonClear(a.form),a.form.configJSON={},a.data={},e.abrupt("break",10);case 9:return e.abrupt("break",10);case 10:case"end":return e.stop()}}),e)})))()}}},methods:{updateValidator:function(e){this.$refs.form&&this.$refs.form.clearValidate();var t=this.C.API_AUTH_MAP.get(e).configFields;if(t)for(var a in t)if(t.hasOwnProperty(a)){var n=t[a];if(!n)continue;var r=this.formRules["configJSON.".concat(a)];r&&(r[0].required=!!n.isRequired)}},fillDefault:function(e){var t=this.C.API_AUTH_MAP.get(e).configFields;if(t){var a={};for(var n in t)if(t.hasOwnProperty(n)){var r=t[n];if(!r)continue;this.T.notNothing(r.default)&&(a[n]=r.default)}this.form.configJSON=a}},switchType:function(e){this.fillDefault(e),this.updateValidator(e)},loadData:function(){var e=this;return Object(o["a"])(Object(i["a"])().mark((function t(){var a,n,r;return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=11;break}return t.next=3,e.T.callAPI_getOne("/api/v1/api-auth/do/list",e.$route.params.id);case 3:if(a=t.sent,a&&a.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=a.data,n={},Object.keys(e.form).forEach((function(t){return n[t]=e.data[t]})),e.form=n,e.updateValidator(e.data.type);case 11:return t.next=13,e.common.getFuncList();case 13:r=t.sent,e.funcMap=r.map,e.funcCascader=r.cascader,e.$store.commit("updateLoadStatus",!0);case 17:case"end":return t.stop()}}),t)})))()},submitData:function(){var e=this;return Object(o["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.T.setupPageMode(),t.next="add"===t.t1?11:"setup"===t.t1?14:17;break;case 11:return t.next=13,e.addData();case 13:return t.abrupt("return",t.sent);case 14:return t.next=16,e.modifyData();case 16:return t.abrupt("return",t.sent);case 17:case"end":return t.stop()}}),t,null,[[0,5]])})))()},_getFromData:function(){var e=this.T.jsonCopy(this.form);if(e.configJSON)for(var t in e.configJSON)this.T.isNothing(e.configJSON[t])&&(e.configJSON[t]=null);return e},addData:function(){var e=this;return Object(o["a"])(Object(i["a"])().mark((function t(){var a,n;return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e._getFromData(),t.next=3,e.T.callAPI("post","/api/v1/api-auth/do/add",{body:{data:a},alert:{okMessage:e.$t("API Auth created")}});case 3:if(n=t.sent,n&&n.ok){t.next=6;break}return t.abrupt("return");case 6:e.$store.commit("updateTableList_scrollY"),e.$store.commit("updateHighlightedTableDataId",n.data.id),e.$router.push({name:"api-auth-list",query:e.T.getPrevQuery()});case 9:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(o["a"])(Object(i["a"])().mark((function t(){var a,n;return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e._getFromData(),delete a.id,delete a.type,t.next=5,e.T.callAPI("post","/api/v1/api-auth/:id/do/modify",{params:{id:e.$route.params.id},body:{data:a},alert:{okMessage:e.$t("API Auth saved")}});case 5:if(n=t.sent,n&&n.ok){t.next=8;break}return t.abrupt("return");case 8:e.$store.commit("updateHighlightedTableDataId",n.data.id),e.$router.push({name:"api-auth-list",query:e.T.getPrevQuery()});case 10:case"end":return t.stop()}}),t)})))()},deleteData:function(){var e=this;return Object(o["a"])(Object(i["a"])().mark((function t(){var a;return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm(e.$t("Are you sure you want to delete the API Auth?"));case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("/api/v1/api-auth/:id/do/delete",{params:{id:e.$route.params.id},alert:{okMessage:e.$t("API Auth deleted")}});case 6:if(a=t.sent,a&&a.ok){t.next=9;break}return t.abrupt("return");case 9:e.$router.push({name:"api-auth-list",query:e.T.getPrevQuery()});case 10:case"end":return t.stop()}}),t)})))()},hasConfigField:function(e,t){return!(!this.C.API_AUTH_MAP.get(e)||!this.C.API_AUTH_MAP.get(e).configFields)&&t in this.C.API_AUTH_MAP.get(e).configFields},addFixedFieldItem:function(){this.T.isNothing(this.form.configJSON.fields)&&this.$set(this.form.configJSON,"fields",[]),this.form.configJSON.fields.push({location:"",name:"",value:""})},removeFixedFieldItem:function(e){this.form.configJSON.fields.splice(e,1)},addHTTPAuthUser:function(){this.T.isNothing(this.form.configJSON.users)&&this.$set(this.form.configJSON,"users",[]),this.form.configJSON.users.push({username:"",password:""})},removeHTTPAuthUser:function(e){this.form.configJSON.users.splice(e,1)},showAuthFuncSampleCode:function(){var e="@DFF.API('My Auth Func')\ndef my_auth_func():\n    # ".concat(this.$t("Get / Check fields in Header"),"\n    try:\n        is_valid_header = _DFF_HTTP_REQUEST['headers']['x-auth-token'] == 'TOKEN'\n    except Exception as e:\n        raise Exception('Missing `x-auth-token` in header')\n\n    # ").concat(this.$t("Get / Check fields in Query (e.g. http://you_domain/?auth-token=TOKEN)"),"\n    try:\n        is_valid_query = _DFF_HTTP_REQUEST['query']['auth-token'] == 'TOKEN'\n    except Exception as e:\n        raise Exception('Missing `auth-token` in query')\n\n    # ").concat(this.$t("Throw Exception when authentication fails"),"\n    if not (is_valid_header and is_valid_query):\n        raise Exception('Bad Auth Token')\n\n    # ").concat(this.$t("Return True when authentication succeeds"),"\n    return True");this.$refs.longTextDialog.update(e)}},computed:{pageTitle:function(){var e={setup:this.$t("Setup API Auth"),add:this.$t("Add API Auth")};return e[this.T.setupPageMode()]},selectedType:function(){switch(this.T.setupPageMode()){case"add":return this.form.type;case"setup":return this.data.type}}},props:{},data:function(){return{data:{},funcMap:{},funcCascader:[],form:{name:null,type:null,configJSON:{},note:null},formRules:{type:[{trigger:"change",message:this.$t("Please input API Auth type"),required:!0}],funcId:[{trigger:"change",message:this.$t("Please select Func"),required:!0}]},formRules_fixedFieldLocation:{trigger:"change",message:this.$t("Please input location"),required:!0},formRules_fixedFieldName:{trigger:"change",message:this.$t("Please input field name"),required:!0},formRules_fixedFieldValue:{trigger:"change",message:this.$t("Please input field value"),required:!0},formRules_httpAuthUsername:{trigger:"change",message:this.$t("Please input HTTP Auth username"),required:!0},formRules_httpAuthPassword:{trigger:"change",message:this.$t("Please input HTTP Auth password"),required:!1}}}},l=c,u=(a("5fd9"),a("2877")),d=a("6e4d"),f=Object(u["a"])(l,n,r,!1,null,"3bb0bb03",null);"function"===typeof d["default"]&&Object(d["default"])(f);t["default"]=f.exports}}]);