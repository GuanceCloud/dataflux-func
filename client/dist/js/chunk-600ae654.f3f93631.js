(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-600ae654"],{"03aa":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Python functions that can only be called internally":"只能被内部调用的 Python 函数","Press {0} to search":"按 {0} 开始搜索"}}'),delete t.options._Ctor}},1168:function(t,e,o){"use strict";o("14c5")},"14c5":function(t,e,o){},"1fe2":function(t,e,o){"use strict";var n=o("a2b6"),a=o.n(n);e["default"]=a.a},"3e7e":function(t,e,o){"use strict";o("4d8d")},"4d8d":function(t,e,o){},"8e41":function(t,e,o){"use strict";var n=o("03aa"),a=o.n(n);e["default"]=a.a},a2ad:function(t,e,o){"use strict";var n=o("ebfc"),a=o.n(n);e["default"]=a.a},a2b6:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"seconds":"Second | Seconds"}}'),delete t.options._Ctor}},b3fd:function(t,e,o){"use strict";var n=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{title:t.title||t.$t("API Example"),visible:t.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"850px"},on:{"update:visible":function(e){t.show=e}}},[e("span",[t.showOptions?[e("el-divider",{attrs:{"content-position":"left"}},[t._v(t._s(t.$t("Request Options")))]),t._v(" "),e("el-form",{staticClass:"call-options",attrs:{"label-width":"120px"}},[t.showExecModeOption?e("el-form-item",{attrs:{label:t.$t("Async")}},[e("el-switch",{attrs:{"inactive-value":"sync","active-value":"async"},model:{value:t.callOptions.execMode,callback:function(e){t.$set(t.callOptions,"execMode",e)},expression:"callOptions.execMode"}})],1):t._e(),t._v(" "),t.showSaveResultOption?e("el-form-item",{attrs:{label:t.$t("Save Result")}},[e("el-switch",{attrs:{"inactive-value":!1,"active-value":!0},model:{value:t.callOptions.saveResult,callback:function(e){t.$set(t.callOptions,"saveResult",e)},expression:"callOptions.saveResult"}})],1):t._e(),t._v(" "),t.showTimeoutOption?e("el-form-item",{attrs:{label:t.$t("Func Timeout")}},[e("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_TIMEOUT")},model:{value:t.callOptions.timeout,callback:function(e){t.$set(t.callOptions,"timeout",e)},expression:"callOptions.timeout"}}),t._v(" "+t._s(t.$tc("seconds",t.callOptions.timeout))+"\n        ")],1):t._e(),t._v(" "),t.showAPITimeoutOption?e("el-form-item",{attrs:{label:t.$t("API Timeout")}},[e("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_API_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_API_TIMEOUT")},model:{value:t.callOptions.apiTimeout,callback:function(e){t.$set(t.callOptions,"apiTimeout",e)},expression:"callOptions.apiTimeout"}}),t._v(" "+t._s(t.$tc("seconds",t.callOptions.apiTimeout))+"\n        ")],1):t._e()],1)]:t._e(),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[t._v(t._s(t.$t("Input Parameters")))]),t._v(" "),t.apiBodyInput||t.supportCustomKwargs?e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{type:"textarea",autosize:"",resize:"none"},model:{value:t.apiBodyInput,callback:function(e){t.apiBodyInput=e},expression:"apiBodyInput"}}),t._v(" "),t.apiBodyInput.indexOf("kwargs")>=0?e("InfoBlock",{attrs:{type:"info",title:t.$t('The JSON inside "kwargs" is the call parameter, modify its value and check out the calling example below')}}):t._e(),t._v(" "),t.supportCustomKwargs?e("InfoBlock",{attrs:{type:"success",title:t.$t("This Python function allows additional parameters (**kwargs syntax)")}}):t._e(),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"success",title:t.$t('This Python function allows uploading files, field name of the uploading file is "files"')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.apiBodyInput}})],1)],1):t._e(),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[t._v(t._s(t.$t("Calling Example")))]),t._v(" "),t.apiBody?[t.showGet?[e("el-tabs",{attrs:{"tab-position":"top"}},[e("el-tab-pane",{attrs:{label:t.$t("Simple GET")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[t.onlyStringParameter?e("el-link",{staticClass:"get-example",attrs:{href:t.getExample("simplified"),underline:!0,type:"primary",target:"_blank"}},[e("code",{domProps:{innerHTML:t._s(t.getExample("simplified",{asHTML:!0,decodeURL:!0}))}})]):t._e(),t._v(" "),e("InfoBlock",{attrs:{type:t.onlyStringParameter?"info":"error",title:t.$t("Only string arguments are allowed in this from")}}),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[t.onlyStringParameter?e("CopyButton",{attrs:{content:t.getExample("simplified")}}):t._e()],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Normal GET")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-link",{staticClass:"get-example",attrs:{href:t.getExample("normal"),underline:!0,type:"primary",target:"_blank"}},[e("code",{domProps:{innerHTML:t._s(t.getExample("normal",{asHTML:!0,decodeURL:!0}))}})]),t._v(" "),e("br"),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('Parameter "kwargs" should be URL encoded in HTTP request')}})],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.getExample("normal")}})],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Simple POST (JSON)")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("simplified",{contentType:"json"}),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting JSON data, "Content-Type" should be "application/json"')}}),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.postExample("simplified",{contentType:"json",oneLine:!0})}})],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Simple POST (Form)")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("simplified",{contentType:"form"}),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting form data, "Content-Type" should be "multipart/form-data" or "application/x-www-form-urlencoded", and the values of the fields support string value only')}}),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"warning",title:t.$t('When uploading files, "Content-Type" should be "multipart/form-data"')}}):t._e(),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{type:"error",title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[t.onlyStringParameter?e("CopyButton",{attrs:{content:t.postExample("simplified",{contentType:"form",oneLine:!0})}}):t._e()],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Normal POST")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("normal"),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting JSON data, "Content-Type" should be "application/json"')}}),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"error",title:t.$t("File uploading is not supported in this this form")}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.postExample("normal",{oneLine:!0})}})],1)],1)],1)],1)]:t._e()]:[e("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Invalid Parameters. Examples require a valid Body content")))])]],2)])},a=[],s=(o("e9c4"),o("a15b"),o("14d9"),o("99af"),o("4de4"),o("d3b7"),{name:"APIExampleDialog",components:{},watch:{callOptions:{deep:!0,handler:function(t){var e=null;try{e=JSON.parse(this.apiBodyExample)}catch(n){}if(e){for(var o in e.options=e.options||{},t)t[o]===this.DEFAULT_CALL_OPTIONS[o]?delete e.options[o]:e.options[o]=t[o];this.T.isNothing(e.options)&&delete e.options,this.apiBodyExample=JSON.stringify(e,null,2)}}}},methods:{prettyURLForHTML:function(t){if(!t)return"";try{var e=t.split("?");if(!e[1])return t;for(var o=e[1].split("&"),n=0;n<o.length;n++)o[n]=0===n?"?"+o[n]:"&"+o[n];var a=e[0]+"<br>"+o.join("<br>");return a}catch(s){return console.error(s),t}},washAPIBody:function(t){if(t=this.T.jsonCopy(t),this.T.isNothing(t))return t;if(this.T.isNothing(t.kwargs)&&!this.supportCustomKwargs&&delete t.kwargs,this.T.isNothing(t.options)&&delete t.options,this.T.notNothing(t.kwargs))for(var e in t.kwargs)0!==e.indexOf("**")&&"files"!==e||delete t.kwargs[e];return t},update:function(t,e,o){for(var n in e=e||{},e.kwargs=e.kwargs||{},e.options=e.options||{},this.apiKwargs=this.T.jsonCopy(e.kwargs),this.funcKwargs=this.T.jsonCopy(o)||{},this.callOptions)this.callOptions[n]=this.DEFAULT_CALL_OPTIONS[n];e=this.washAPIBody(e);var a="";this.T.notNothing(e)&&(a=JSON.stringify(e,null,2)),this.apiURL=t,this.apiBodyInput=a,this.show=!0},getExample:function(t,e){if(!this.apiBody)return null;t=t||"normal",e=e||{},e.asHTML=e.asHTML||!1,e.decodeURL=e.decodeURL||!1;var o=this.washAPIBody(this.apiBody)||{},n=null,a={};switch(t){case"normal":a=o||a,n=this.T.formatURL(this.apiURL,{query:a});break;case"simplified":a=o.kwargs||a,n=this.T.formatURL(this.apiURL_simplified,{query:a});break}return e.asHTML&&(n=this.prettyURLForHTML(n)),e.decodeURL&&(n=decodeURIComponent(n)),n},postExample:function(t,e){if(!this.apiBody)return null;t=t||"normal",e=e||{},e.oneLine=e.oneLine||!1,e.contentType=e.contentType||"json";var o=this.washAPIBody(this.apiBody)||{},n="\\\n",a=["curl",n,"-X","POST",n];switch(t){case"normal":this.T.notNothing(o)&&(a.push("-H",'"Content-Type: application/json"',n),a.push("-d","'".concat(JSON.stringify(o),"'"),n)),a.push(this.apiURL);break;case"simplified":if(this.T.notNothing(o.kwargs))switch(e.contentType){case"json":a.push("-H",'"Content-Type: application/json"',n),a.push("-d","'".concat(JSON.stringify(o.kwargs),"'"),n);break;case"form":if(this.supportFileUpload)for(var s in a.push("-H",'"Content-Type: multipart/form-data"',n),o.kwargs)a.push("-F","'".concat(s,"=").concat(o.kwargs[s],"'"),n);else a.push("-H",'"Content-Type: application/x-www-form-urlencoded"',n),a.push("-d","'".concat(this.T.formatQuery(o.kwargs),"'"),n);break}this.supportFileUpload&&a.push("-F","files=@UPLOAD_FILE_PATH",n),a.push(this.apiURL_simplified);break}e.oneLine&&(a=a.filter((function(t){return t!==n})));var i=a.join(" ");return i}},computed:{DEFAULT_CALL_OPTIONS:function(){return{execMode:"sync",saveResult:!1,timeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_TIMEOUT"),apiTimeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_API_TIMEOUT")}},showOptions:function(){return this.showExecModeOption||this.showSaveResultOption||this.showTimeoutOption||this.showAPITimeoutOption},showGet:function(){return this.showGetExample||this.showGetExampleSimplified},showPost:function(){return this.showPostExample||this.showPostExampleSimplified},apiURL_simplified:function(){return"".concat(this.apiURL,"/simplified")},apiBody:function(){if(!this.apiBodyInput)return{};var t=null;try{t=JSON.parse(this.apiBodyInput)}catch(e){return null}return t},onlyStringParameter:function(){if(!this.apiBody)return!1;var t=this.apiBody.kwargs||{};for(var e in t)if("string"!==typeof t[e])return!1;return!0},supportFileUpload:function(){return!(!this.apiKwargs||!this.apiKwargs.files)&&this.common.isFuncArgumentPlaceholder(this.apiKwargs.files)},supportCustomKwargs:function(){if(this.funcKwargs)for(var t in this.funcKwargs)if(0===t.indexOf("**"))return!0;return!1}},props:{title:String,showExecModeOption:{type:Boolean,default:!1},showSaveResultOption:{type:Boolean,default:!1},showTimeoutOption:{type:Boolean,default:!1},showAPITimeoutOption:{type:Boolean,default:!1},showGetExample:{type:Boolean,default:!0},showGetExampleSimplified:{type:Boolean,default:!1},showPostExample:{type:Boolean,default:!0},showPostExampleSimplified:{type:Boolean,default:!1}},data:function(){return{show:!1,apiURL:null,apiBodyInput:null,apiKwargs:null,funcKwargs:null,callOptions:{execMode:null,saveResult:null,timeout:null,apiTimeout:null}}},mounted:function(){window.vmc=this}}),i=s,r=(o("3e7e"),o("2877")),l=o("1fe2"),p=o("a2ad"),u=Object(r["a"])(i,n,a,!1,null,"1490b0cc",null);"function"===typeof l["default"]&&Object(l["default"])(u),"function"===typeof p["default"]&&Object(p["default"])(u);e["a"]=u.exports},c7be:function(t,e,o){"use strict";o.r(e);o("b0c0"),o("a4d3"),o("e01a");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[e("Logo",{staticClass:"doc-logo",attrs:{type:"auto",width:"200px",height:"40px"}}),t._v("\n        "+t._s(t.$t("Func Documents"))+"\n         \n        "),e("small",[t._v(t._s(t.$t("Python functions that can only be called internally")))]),t._v(" "),e("span",{staticClass:"text-info title-tip"},[e("i18n",{attrs:{path:"Press {0} to search"}},[e("span",[e("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),e("kbd",[t._v("F")])])])],1)],1)]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data}},[e("el-table-column",{attrs:{label:t.$t("Func")},scopedSlots:t._u([{key:"default",fn:function(o){return[e("FuncInfo",{attrs:{id:o.row.id,title:o.row.title,definition:o.row.definition}}),t._v(" "),e("div",[e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.id))]),t._v(" "),e("CopyButton",{attrs:{content:o.row.id}}),t._v(" "),e("br"),t._v(" "),t.T.notNothing(o.row.category)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Category")))]),t._v("\n                 "),e("code",{staticClass:"text-main"},[t._v(t._s(o.row.category))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(o.row.integration)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Integration")))]),t._v("\n                 \n                "),t.C.FUNC_INTEGRATION_MAP.get(o.row.integration)?e("code",[t._v(t._s(t.C.FUNC_INTEGRATION_MAP.get(o.row.integration).name))]):e("code",[t._v(t._s(o.row.integration))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(o.row.tagsJSON)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Tags")))]),t._v("\n                 "),t._l(o.row.tagsJSON,(function(o){return e("el-tag",{key:o,attrs:{size:"mini",type:"info"}},[e("code",[t._v(t._s(o))])])})),t._v(" "),e("br")]:t._e()],2)]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Document")},scopedSlots:t._u([{key:"default",fn:function(o){return[e("pre",{staticClass:"func-doc"},[t._v(t._s(o.row.description))])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(o){return[e("el-link",{on:{click:function(e){return t.showAPI(o.row)}}},[t._v(t._s(t.$t("Example")))])]}}])})],1)],1),t._v(" "),e("APIExampleDialog",{ref:"apiExampleDialog",attrs:{showExecModeOption:!0,showSaveResultOption:!0,showAPITimeoutOption:!0,showPostExample:!0,showGetExample:!1}})],1)],1)},a=[],s=o("c7eb"),i=o("1da1"),r=o("b3fd"),l={name:"FuncDoc",components:{APIExampleDialog:r["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var o=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,o.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var o;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/func-list");case 2:if(o=e.sent,o&&o.ok){e.next=5;break}return e.abrupt("return");case 5:t.data=o.data,t.$store.commit("updateLoadStatus",!0);case 7:case"end":return e.stop()}}),e)})))()},showAPI:function(t){var e=this;return Object(i["a"])(Object(s["a"])().mark((function o(){var n,a,i,r,l,p;return Object(s["a"])().wrap((function(o){while(1)switch(o.prev=o.next){case 0:return o.next=2,e.T.callAPI_getOne("/api/v1/funcs/do/list",t.id);case 2:if(n=o.sent,n&&n.ok){o.next=5;break}return o.abrupt("return");case 5:for(r in a=e.T.formatURL("/api/v1/func/:funcId",{baseURL:e.$store.getters.CONFIG("WEB_INNER_BASE_URL"),params:{funcId:t.id}}),i={},t.kwargsJSON)t.kwargsJSON.hasOwnProperty(r)&&(i[r]=e.$store.getters.CONFIG("_FUNC_ARGUMENT_PLACEHOLDER_LIST")[0]);l={kwargs:i},p=n.data.kwargsJSON,e.$refs.apiExampleDialog.update(a,l,p);case 11:case"end":return o.stop()}}),o)})))()}},computed:{},props:{},data:function(){return{data:[]}}},p=l,u=(o("1168"),o("2877")),c=o("8e41"),d=Object(u["a"])(p,n,a,!1,null,"337c82d0",null);"function"===typeof c["default"]&&Object(c["default"])(d);e["default"]=d.exports},ebfc:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"API Example":"API 调用示例","Request Options":"请求选项","Async":"异步执行","Save Result":"保留结果","Func Timeout":"函数超时","API Timeout":"API 超时","Input Parameters":"填写参数","Calling Example":"调用示例","Simple GET":"GET 简化形式","Normal GET":"GET 标准形式","Simple POST (JSON)":"POST 简化形式（JSON）","Simple POST (Form)":"POST 简化形式（表单）","Normal POST":"POST 标准形式","The JSON inside \\"kwargs\\" is the call parameter, modify its value and check out the calling example below":"\\"kwargs\\" 内的 JSON 即为调用参数，修改其中的值并在下方查看具体调用示例","This Python function allows additional parameters (**kwargs syntax)":"本 Python 函数支持传递额外的参数（**kwargs 语法）","This Python function allows uploading files, field name of the uploading file is \\"files\\"":"本 Python 函数支持文件上传，文件字段名为\\"files\\"","Invalid Parameters. Examples require a valid Body content":"参数填写存在错误，正确填写后将展示示例","Only string arguments are allowed in this from":"此方式参数值只支持字符串","Parameter \\"kwargs\\" should be URL encoded in HTTP request":"发送请求时，\\"kwargs\\" 参数需要进行 URL encode 编码","Parameter \\"options\\" are not supported in this from":"此方式不支持 \\"options\\" 参数","When posting form data, \\"Content-Type\\" should be \\"multipart/form-data\\" or \\"application/x-www-form-urlencoded\\", and the values of the fields support string value only":"POST 表单数据时，\\"Content-Type\\" 必须指定为 \\"multipart/form-data\\" 或 \\"application/x-www-form-urlencoded\\"，此时 Body 中参数值只支持字符串","When posting JSON data, \\"Content-Type\\" should be \\"application/json\\"":"POST JSON 数据时，\\"Content-Type\\" 必须指定为 \\"application/json\\"","When uploading files, \\"Content-Type\\" should be \\"multipart/form-data\\"":"上传文件时，\\"Content-Type\\" 必须指定为 \\"multipart/form-data\\"","File uploading is not supported in this this form":"此方式不支持文件上传","seconds":"秒"}}'),delete t.options._Ctor}}}]);