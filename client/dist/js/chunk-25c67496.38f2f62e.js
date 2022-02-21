(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-25c67496"],{"0154":function(e,t,r){"use strict";var a=r("cdae"),n=r.n(a);t["default"]=n.a},4147:function(e,t,r){"use strict";r.r(t);var a=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("transition",{attrs:{name:"fade"}},[r("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[r("el-header",{attrs:{height:"60px"}},[r("h1",[e._v(e._s(e.pageTitle)+" "),r("code",{staticClass:"text-main"},[e._v(e._s(e.data.root))])])]),e._v(" "),r("el-main",[r("el-row",{attrs:{gutter:20}},[r("el-col",{attrs:{span:15}},[r("div",{staticClass:"common-form"},[r("el-form",{ref:"form",attrs:{"label-width":"120px",model:e.form,rules:e.formRules}},["add"===e.T.setupPageMode()?r("el-form-item",{attrs:{label:e.$t("Customize ID"),prop:"useCustomId"}},[r("el-switch",{model:{value:e.useCustomId,callback:function(t){e.useCustomId=t},expression:"useCustomId"}}),e._v(" "),r("span",{staticClass:"text-main float-right"},[e._v("\n                  "+e._s(e.$t("URL Preview"))+e._s(e.$t(":"))+"\n                  "),r("code",[e._v(e._s("/api/v1/fs/"+(e.useCustomId?e.form.id:e.$t("randomIDString"))))])])],1):e._e(),e._v(" "),"add"===e.T.setupPageMode()?r("el-form-item",{directives:[{name:"show",rawName:"v-show",value:e.useCustomId,expression:"useCustomId"}],attrs:{label:"ID",prop:"id"}},[r("el-input",{attrs:{maxlength:"50","show-word-limit":""},model:{value:e.form.id,callback:function(t){e.$set(e.form,"id",t)},expression:"form.id"}}),e._v(" "),r("InfoBlock",{attrs:{title:e.$t("ID is used in the access URL")}})],1):e._e(),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Root"),prop:"root"}},[r("el-cascader",{ref:"rootCascader",staticClass:"root-cascader-input",attrs:{placeholder:"--",separator:"",props:e.rootCascaderProps},model:{value:e.form.root,callback:function(t){e.$set(e.form,"root",t)},expression:"form.root"}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Note")}},[r("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"200","show-word-limit":""},model:{value:e.form.note,callback:function(t){e.$set(e.form,"note",t)},expression:"form.note"}})],1),e._v(" "),r("el-form-item",["setup"===e.T.setupPageMode()?r("el-button",{on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]):e._e(),e._v(" "),r("div",{staticClass:"setup-right"},[r("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)],1)],1)],1)]),e._v(" "),r("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],o=r("1da1"),s=(r("d3b7"),r("159b"),r("b64b"),r("130f"),r("ac1f"),r("466d"),r("8a79"),r("d81d"),r("b0c0"),r("99af"),r("96cf"),{name:"FileServiceSetup",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var r=this;return Object(o["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.loadData();case 2:e.t0=r.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?8:9;break;case 5:return r.T.jsonClear(r.form),r.data={},e.abrupt("break",9);case 8:return e.abrupt("break",9);case 9:case"end":return e.stop()}}),e)})))()}},useCustomId:function(e){this.form.id=e?"".concat(this.ID_PREFIX,"foobar"):null}},methods:{loadData:function(){var e=this;return Object(o["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=10;break}return t.next=3,e.T.callAPI_getOne("/api/v1/file-services/do/list",e.$route.params.id);case 3:if(r=t.sent,r.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=r.data,a={},Object.keys(e.form).forEach((function(t){return a[t]=e.data[t]})),e.form=a;case 10:e.$store.commit("updateLoadStatus",!0),setImmediate((function(){e.$refs.rootCascader.presentText=e.data.root}));case 12:case"end":return t.stop()}}),t)})))()},submitData:function(){var e=this;return Object(o["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.T.setupPageMode(),t.next="add"===t.t1?11:"setup"===t.t1?14:17;break;case 11:return t.next=13,e.addData();case 13:return t.abrupt("return",t.sent);case 14:return t.next=16,e.modifyData();case 16:return t.abrupt("return",t.sent);case 17:case"end":return t.stop()}}),t,null,[[0,5]])})))()},addData:function(){var e=this;return Object(o["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI("post","/api/v1/file-services/do/add",{body:{data:e.T.jsonCopy(e.form)},alert:{okMessage:e.$t("File Service created")}});case 2:if(r=t.sent,r.ok){t.next=5;break}return t.abrupt("return");case 5:e.$store.commit("updateTableList_scrollY"),e.$store.commit("updateHighlightedTableDataId",r.data.id),e.$router.push({name:"file-service-list",query:e.T.getPrevQuery()});case 8:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(o["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return r=e.T.jsonCopy(e.form),delete r.id,t.next=4,e.T.callAPI("post","/api/v1/file-services/:id/do/modify",{params:{id:e.$route.params.id},body:{data:r},alert:{okMessage:e.$t("File Service saved")}});case 4:if(a=t.sent,a.ok){t.next=7;break}return t.abrupt("return");case 7:e.$store.commit("updateHighlightedTableDataId",a.data.id),e.$router.push({name:"file-service-list",query:e.T.getPrevQuery()});case 9:case"end":return t.stop()}}),t)})))()},deleteData:function(){var e=this;return Object(o["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm(e.$t("Are you sure you want to delete the File Service?"));case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("/api/v1/file-services/:id/do/delete",{params:{id:e.$route.params.id},alert:{okMessage:e.$t("File Service deleted")}});case 6:if(r=t.sent,r.ok){t.next=9;break}return t.abrupt("return");case 9:e.$router.push({name:"file-service-list",query:e.T.getPrevQuery()});case 10:case"end":return t.stop()}}),t)})))()}},computed:{formRules:function(){var e=this;return{id:[{trigger:"change",validator:function(t,r,a){if(!e.T.isNothing(r)){if(0!==r.indexOf(e.ID_PREFIX)||r===e.ID_PREFIX)return a(new Error(e.$t('ID must starts with "{prefix}"',{prefix:e.ID_PREFIX})));if(!r.match(/^[0-9a-zA-Z\.\-\_]+$/g))return a(new Error(e.$t("Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed")))}return a()}}],root:[{trigger:"change",message:this.$t("Please select root"),required:!0}]}},ID_PREFIX:function(){return"fsvc-"},pageTitle:function(){var e={setup:this.$t("Setup File Service"),add:this.$t("Add File Service")};return e[this.T.setupPageMode()]}},props:{},data:function(){var e=this;return{data:{},useCustomId:!1,form:{id:null,root:null,note:null},rootCascaderProps:{expandTrigger:"hover",emitPath:!1,multiple:!1,checkStrictly:!0,lazy:!0,lazyLoad:function(){var t=Object(o["a"])(regeneratorRuntime.mark((function t(r,a){var n,o,s;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI_get("/api/v1/resources/dir",{query:{folder:r.value,type:"folder"}});case 2:if(n=t.sent,n.ok){t.next=5;break}return t.abrupt("return");case 5:o=r.value||"",o&&!e.T.endsWith(o,"/")&&(o+="/"),s=n.data.map((function(e){return{label:"".concat(e.name,"/"),value:"".concat(o).concat(e.name,"/")}})),a(s);case 9:case"end":return t.stop()}}),t)})));function r(e,r){return t.apply(this,arguments)}return r}()}}}}),i=s,u=(r("dccd"),r("2877")),c=r("0154"),d=r("ed1e"),l=Object(u["a"])(i,a,n,!1,null,"48d21b08",null);"function"===typeof c["default"]&&Object(c["default"])(l),"function"===typeof d["default"]&&Object(d["default"])(l);t["default"]=l.exports},"8a79":function(e,t,r){"use strict";var a=r("23e7"),n=r("e330"),o=r("06cf").f,s=r("50c4"),i=r("577e"),u=r("5a34"),c=r("1d80"),d=r("ab13"),l=r("c430"),p=n("".endsWith),f=n("".slice),m=Math.min,v=d("endsWith"),h=!l&&!v&&!!function(){var e=o(String.prototype,"endsWith");return e&&!e.writable}();a({target:"String",proto:!0,forced:!h&&!v},{endsWith:function(e){var t=i(c(this));u(e);var r=arguments.length>1?arguments[1]:void 0,a=t.length,n=void 0===r?a:m(s(r),a),o=i(e);return p?p(t,o,n):f(t,n-o.length,n)===o}})},"9c65":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"randomIDString":"fsvc-{随机ID}","Add File Service":"添加文件服务","Setup File Service":"配置文件服务","Customize ID":"定制ID","Root":"根目录","Note":"备注","URL Preview":"URL预览","ID is used in the access URL":"此ID用于生成访问时的URL","ID must starts with \\"{prefix}\\"":"ID必须以\\"{prefix}\\"开头","Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed":"只能输入数字、英文、点（.）、下划线（_）以及连字符（-）","Please select root":"请选择根目录","File Service created":"文件服务已创建","File Service saved":"文件服务已保存","File Service deleted":"文件服务已删除","Are you sure you want to delete the File Service?":"是否确认删除此文件服务？"}}'),delete e.options._Ctor}},aafa:function(e,t,r){},cdae:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"randomIDString":"fsvc-{Random ID}"}}'),delete e.options._Ctor}},dccd:function(e,t,r){"use strict";r("aafa")},ed1e:function(e,t,r){"use strict";var a=r("9c65"),n=r.n(a);t["default"]=n.a}}]);