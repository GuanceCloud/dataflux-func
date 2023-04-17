(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-460f209e"],{"0ea2":function(t,e,a){},"1fe2":function(t,e,a){"use strict";var n=a("a2b6"),o=a.n(n);e["default"]=o.a},"49e8":function(t,e,a){"use strict";a("669f")},"5b02":function(t,e,a){"use strict";a("0ea2")},6652:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Config":"配置","Auth":"认证","Expires":"过期","Throttling":"限流","Python functions that can be called externally":"可被外部调用的 Python 函数","Press {0} to search":"按 {0} 开始搜索"}}'),delete t.options._Ctor}},"669f":function(t,e,a){},"8d04":function(t,e,a){"use strict";var n=a("6652"),o=a.n(n);e["default"]=o.a},a2ad:function(t,e,a){"use strict";var n=a("ebfc"),o=a.n(n);e["default"]=o.a},a2b6:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"seconds":"Second | Seconds"}}'),delete t.options._Ctor}},b3fd:function(t,e,a){"use strict";var n=function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{title:t.title||t.$t("API Example"),visible:t.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"850px"},on:{"update:visible":function(e){t.show=e}}},[e("span",[t.showOptions?[e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Request Options")))])]),t._v(" "),e("el-form",{staticClass:"call-options",attrs:{"label-width":"120px"}},[t.showExecModeOption?e("el-form-item",{attrs:{label:t.$t("Async")}},[e("el-switch",{attrs:{"inactive-value":"sync","active-value":"async"},model:{value:t.callOptions.execMode,callback:function(e){t.$set(t.callOptions,"execMode",e)},expression:"callOptions.execMode"}})],1):t._e(),t._v(" "),t.showSaveResultOption?e("el-form-item",{attrs:{label:t.$t("Save Result")}},[e("el-switch",{attrs:{"inactive-value":!1,"active-value":!0},model:{value:t.callOptions.saveResult,callback:function(e){t.$set(t.callOptions,"saveResult",e)},expression:"callOptions.saveResult"}})],1):t._e(),t._v(" "),t.showTimeoutOption?e("el-form-item",{attrs:{label:t.$t("Func Timeout")}},[e("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_TIMEOUT")},model:{value:t.callOptions.timeout,callback:function(e){t.$set(t.callOptions,"timeout",e)},expression:"callOptions.timeout"}}),t._v(" "+t._s(t.$tc("seconds",t.callOptions.timeout))+"\n        ")],1):t._e(),t._v(" "),t.showAPITimeoutOption?e("el-form-item",{attrs:{label:t.$t("API Timeout")}},[e("el-input-number",{attrs:{size:"mini","step-strictly":"",step:1,precision:0,min:t.$store.getters.CONFIG("_FUNC_TASK_MIN_API_TIMEOUT"),max:t.$store.getters.CONFIG("_FUNC_TASK_MAX_API_TIMEOUT")},model:{value:t.callOptions.apiTimeout,callback:function(e){t.$set(t.callOptions,"apiTimeout",e)},expression:"callOptions.apiTimeout"}}),t._v(" "+t._s(t.$tc("seconds",t.callOptions.apiTimeout))+"\n        ")],1):t._e()],1)]:t._e(),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Input Parameters")))])]),t._v(" "),t.apiBodyInput||t.supportCustomKwargs?e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{type:"textarea",autosize:"",resize:"none"},model:{value:t.apiBodyInput,callback:function(e){t.apiBodyInput=e},expression:"apiBodyInput"}}),t._v(" "),t.apiBodyInput.indexOf("kwargs")>=0?e("InfoBlock",{attrs:{type:"info",title:t.$t('The JSON inside "kwargs" is the call parameter, modify its value and check out the calling example below')}}):t._e(),t._v(" "),t.supportCustomKwargs?e("InfoBlock",{attrs:{type:"success",title:t.$t("This Python function allows additional parameters (**kwargs syntax)")}}):t._e(),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"success",title:t.$t('This Python function allows uploading files, field name of the uploading file is "files"')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.apiBodyInput}})],1)],1):t._e(),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Calling Example")))])]),t._v(" "),t.apiBody?[t.showGet?[e("el-tabs",{attrs:{"tab-position":"top"}},[e("el-tab-pane",{attrs:{label:t.$t("Simple GET")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[t.onlyStringParameter?e("el-link",{staticClass:"get-example",attrs:{href:t.getExample("simplified"),underline:!0,type:"primary",target:"_blank"}},[e("code",{domProps:{innerHTML:t._s(t.getExample("simplified",{asHTML:!0,decodeURL:!0}))}})]):t._e(),t._v(" "),e("InfoBlock",{attrs:{type:t.onlyStringParameter?"info":"error",title:t.$t("Only string arguments are allowed in this from")}}),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[t.onlyStringParameter?e("CopyButton",{attrs:{content:t.getExample("simplified")}}):t._e()],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Normal GET")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-link",{staticClass:"get-example",attrs:{href:t.getExample("normal"),underline:!0,type:"primary",target:"_blank"}},[e("code",{domProps:{innerHTML:t._s(t.getExample("normal",{asHTML:!0,decodeURL:!0}))}})]),t._v(" "),e("br"),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('Parameter "kwargs" should be URL encoded in HTTP request')}})],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.getExample("normal")}})],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Simple POST (JSON)")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("simplified",{contentType:"json"}),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting JSON data, "Content-Type" should be "application/json"')}}),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.postExample("simplified",{contentType:"json",oneLine:!0})}})],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Simple POST (Form)")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("simplified",{contentType:"form"}),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting form data, "Content-Type" should be "multipart/form-data" or "application/x-www-form-urlencoded", and the values of the fields support string value only')}}),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"warning",title:t.$t('When uploading files, "Content-Type" should be "multipart/form-data"')}}):t._e(),t._v(" "),t.showOptions?e("InfoBlock",{attrs:{type:"error",title:t.$t('Parameter "options" are not supported in this from')}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[t.onlyStringParameter?e("CopyButton",{attrs:{content:t.postExample("simplified",{contentType:"form",oneLine:!0})}}):t._e()],1)],1)],1),t._v(" "),e("el-tab-pane",{attrs:{label:t.$t("Normal POST")}},[e("el-row",{attrs:{gutter:20}},[e("el-col",{attrs:{span:22}},[e("el-input",{attrs:{value:t.postExample("normal"),autosize:{minRows:6},type:"textarea",resize:"none",readonly:""}}),t._v(" "),e("InfoBlock",{attrs:{type:"info",title:t.$t('When posting JSON data, "Content-Type" should be "application/json"')}}),t._v(" "),t.supportFileUpload?e("InfoBlock",{attrs:{type:"error",title:t.$t("File uploading is not supported in this this form")}}):t._e()],1),t._v(" "),e("el-col",{attrs:{span:2}},[e("CopyButton",{attrs:{content:t.postExample("normal",{oneLine:!0})}})],1)],1)],1)],1)]:t._e()]:[e("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Invalid Parameters. Examples require a valid Body content")))])]],2)])},o=[],s=(a("e9c4"),a("a15b"),a("14d9"),a("99af"),a("4de4"),a("d3b7"),{name:"APIExampleDialog",components:{},watch:{callOptions:{deep:!0,handler:function(t){var e=null;try{e=JSON.parse(this.apiBodyExample)}catch(n){}if(e){for(var a in e.options=e.options||{},t)t[a]===this.DEFAULT_CALL_OPTIONS[a]?delete e.options[a]:e.options[a]=t[a];this.T.isNothing(e.options)&&delete e.options,this.apiBodyExample=JSON.stringify(e,null,2)}}}},methods:{prettyURLForHTML:function(t){if(!t)return"";try{var e=t.split("?");if(!e[1])return t;for(var a=e[1].split("&"),n=0;n<a.length;n++)a[n]=0===n?"?"+a[n]:"&"+a[n];var o=e[0]+"<br>"+a.join("<br>");return o}catch(s){return console.error(s),t}},washAPIBody:function(t){if(t=this.T.jsonCopy(t),this.T.isNothing(t))return t;if(this.T.isNothing(t.kwargs)&&!this.supportCustomKwargs&&delete t.kwargs,this.T.isNothing(t.options)&&delete t.options,this.T.notNothing(t.kwargs))for(var e in t.kwargs)0!==e.indexOf("**")&&"files"!==e||delete t.kwargs[e];return t},update:function(t,e,a){for(var n in e=e||{},e.kwargs=e.kwargs||{},e.options=e.options||{},this.apiKwargs=this.T.jsonCopy(e.kwargs),this.funcKwargs=this.T.jsonCopy(a)||{},this.callOptions)this.callOptions[n]=this.DEFAULT_CALL_OPTIONS[n];e=this.washAPIBody(e);var o="";this.T.notNothing(e)&&(o=JSON.stringify(e,null,2)),this.apiURL=t,this.apiBodyInput=o,this.show=!0},getExample:function(t,e){if(!this.apiBody)return null;t=t||"normal",e=e||{},e.asHTML=e.asHTML||!1,e.decodeURL=e.decodeURL||!1;var a=this.washAPIBody(this.apiBody)||{},n=null,o={};switch(t){case"normal":o=a||o,n=this.T.formatURL(this.apiURL,{query:o});break;case"simplified":o=a.kwargs||o,n=this.T.formatURL(this.apiURL_simplified,{query:o});break}return e.asHTML&&(n=this.prettyURLForHTML(n)),e.decodeURL&&(n=decodeURIComponent(n)),n},postExample:function(t,e){if(!this.apiBody)return null;t=t||"normal",e=e||{},e.oneLine=e.oneLine||!1,e.contentType=e.contentType||"json";var a=this.washAPIBody(this.apiBody)||{},n="\\\n",o=["curl",n,"-X","POST",n];switch(t){case"normal":this.T.notNothing(a)&&(o.push("-H",'"Content-Type: application/json"',n),o.push("-d","'".concat(JSON.stringify(a),"'"),n)),o.push(this.apiURL);break;case"simplified":if(this.T.notNothing(a.kwargs))switch(e.contentType){case"json":o.push("-H",'"Content-Type: application/json"',n),o.push("-d","'".concat(JSON.stringify(a.kwargs),"'"),n);break;case"form":if(this.supportFileUpload)for(var s in o.push("-H",'"Content-Type: multipart/form-data"',n),a.kwargs)o.push("-F","'".concat(s,"=").concat(a.kwargs[s],"'"),n);else o.push("-H",'"Content-Type: application/x-www-form-urlencoded"',n),o.push("-d","'".concat(this.T.formatQuery(a.kwargs),"'"),n);break}this.supportFileUpload&&o.push("-F","files=@UPLOAD_FILE_PATH",n),o.push(this.apiURL_simplified);break}e.oneLine&&(o=o.filter((function(t){return t!==n})));var i=o.join(" ");return i}},computed:{DEFAULT_CALL_OPTIONS:function(){return{execMode:"sync",saveResult:!1,timeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_TIMEOUT"),apiTimeout:this.$store.getters.CONFIG("_FUNC_TASK_DEFAULT_API_TIMEOUT")}},showOptions:function(){return this.showExecModeOption||this.showSaveResultOption||this.showTimeoutOption||this.showAPITimeoutOption},showGet:function(){return this.showGetExample||this.showGetExampleSimplified},showPost:function(){return this.showPostExample||this.showPostExampleSimplified},apiURL_simplified:function(){return"".concat(this.apiURL,"/simplified")},apiBody:function(){if(!this.apiBodyInput)return{};var t=null;try{t=JSON.parse(this.apiBodyInput)}catch(e){return null}return t},onlyStringParameter:function(){if(!this.apiBody)return!1;var t=this.apiBody.kwargs||{};for(var e in t)if("string"!==typeof t[e])return!1;return!0},supportFileUpload:function(){return!(!this.apiKwargs||!this.apiKwargs.files)&&this.common.isFuncArgumentPlaceholder(this.apiKwargs.files)},supportCustomKwargs:function(){if(this.funcKwargs)for(var t in this.funcKwargs)if(0===t.indexOf("**"))return!0;return!1}},props:{title:String,showExecModeOption:{type:Boolean,default:!1},showSaveResultOption:{type:Boolean,default:!1},showTimeoutOption:{type:Boolean,default:!1},showAPITimeoutOption:{type:Boolean,default:!1},showGetExample:{type:Boolean,default:!0},showGetExampleSimplified:{type:Boolean,default:!1},showPostExample:{type:Boolean,default:!0},showPostExampleSimplified:{type:Boolean,default:!1}},data:function(){return{show:!1,apiURL:null,apiBodyInput:null,apiKwargs:null,funcKwargs:null,callOptions:{execMode:null,saveResult:null,timeout:null,apiTimeout:null}}}}),i=s,r=(a("49e8"),a("2877")),l=a("1fe2"),p=a("a2ad"),u=Object(r["a"])(i,n,o,!1,null,"20f8d090",null);"function"===typeof l["default"]&&Object(l["default"])(u),"function"===typeof p["default"]&&Object(p["default"])(u);e["a"]=u.exports},e685:function(t,e,a){"use strict";a.r(e);a("b0c0");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[e("Logo",{staticClass:"doc-logo",attrs:{type:"auto",width:"200px",height:"40px"}}),t._v("\n        "+t._s(t.$t("Auth Link Documents"))+"\n         \n        "),e("small",[t._v(t._s(t.$t("Python functions that can be called externally")))]),t._v(" "),e("span",{staticClass:"text-info title-tip"},[e("i18n",{attrs:{path:"Press {0} to search"}},[e("span",[e("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),e("kbd",[t._v("F")])])])],1)],1)]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data}},[e("el-table-column",{attrs:{label:t.$t("Func")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("FuncInfo",{attrs:{id:a.row.funcId,title:a.row.funcTitle,kwargsJSON:a.row.funcCallKwargsJSON}}),t._v(" "),e("div",[e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(a.row.id))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.id}}),t._v(" "),e("br"),t._v(" "),t.T.notNothing(a.row.funcCategory)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Category")))]),t._v("\n                 "),e("code",[t._v(t._s(a.row.funcCategory))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.funcIntegration)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Integration")))]),t._v("\n                 \n                "),t.C.FUNC_INTEGRATION_MAP.get(a.row.funcIntegration)?e("code",[t._v(t._s(t.C.FUNC_INTEGRATION_MAP.get(a.row.funcIntegration).name))]):e("code",[t._v(t._s(a.row.funcIntegration))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.tagsJSON)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Tags")))]),t._v("\n                 "),t._l(a.row.tagsJSON,(function(a){return e("el-tag",{key:a,attrs:{size:"mini",type:"warning"}},[t._v(t._s(a))])})),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.funcTagsJSON)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Func Tags")))]),t._v("\n                 "),t._l(a.row.funcTagsJSON,(function(a){return e("el-tag",{key:a,attrs:{size:"mini",type:"info"}},[t._v(t._s(a))])})),t._v(" "),e("br")]:t._e()],2)]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Document")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("pre",{staticClass:"func-doc"},[t._v(t._s(a.row.funcDescription))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Config"),width:"220"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Auth"))+t._s(t.$t(":")))]),t._v(" "),e("el-tooltip",{attrs:{content:a.row.apiAuthName,disabled:!a.row.apiAuthName,placement:"right"}},[e("span",{class:{"text-main":!!a.row.apiAuthId}},[t._v(t._s(t.C.API_AUTH_MAP.get(a.row.apiAuthType).name))])]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Expires"))+t._s(t.$t(":")))]),t._v(" "),a.row.expireTime?[e("RelativeDateTime",{class:t.T.isExpired(a.row.expireTime)?"text-bad":"text-good",attrs:{datetime:a.row.expireTime}})]:e("span",[t._v("-")]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Throttling"))+t._s(t.$t(":")))]),t._v(" "),t.T.isNothing(a.row.throttlingJSON)?e("span",[t._v("-")]):e("el-tooltip",{attrs:{placement:"right"}},[e("div",{attrs:{slot:"content"},slot:"content"},[t._l(t.C.AUTH_LINK_THROTTLING,(function(n){return[a.row.throttlingJSON[n.key]?e("span",[t._v(t._s(t.$tc(n.name,a.row.throttlingJSON[n.key]))),e("br")]):t._e()]}))],2),t._v(" "),e("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("ON")))])])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Status"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isDisabled?e("span",{staticClass:"text-bad"},[e("i",{staticClass:"fa fa-fw fa-ban"}),t._v(" "+t._s(t.$t("Disabled")))]):e("span",{staticClass:"text-good"},[e("i",{staticClass:"fa fa-fw fa-check"}),t._v(" "+t._s(t.$t("Enabled")))])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-link",{attrs:{disabled:!a.row.funcId},on:{click:function(e){return t.showAPI(a.row)}}},[t._v(t._s(t.$t("Example")))])]}}])})],1)],1),t._v(" "),e("APIExampleDialog",{ref:"apiExampleDialog",attrs:{showPostExample:!0,showPostExampleSimplified:!0,showGetExample:!0,showGetExampleSimplified:!0}})],1)],1)},o=[],s=a("c7eb"),i=a("1da1"),r=a("b3fd"),l={name:"AuthLinkFuncDoc",components:{APIExampleDialog:r["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(i["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(i["a"])(Object(s["a"])().mark((function e(){var a;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/auth-link-func-list");case 2:if(a=e.sent,a&&a.ok){e.next=5;break}return e.abrupt("return");case 5:t.data=a.data,t.$store.commit("updateLoadStatus",!0);case 7:case"end":return e.stop()}}),e)})))()},showAPI:function(t){var e=this;return Object(i["a"])(Object(s["a"])().mark((function a(){var n,o,i,r,l,p;return Object(s["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,e.T.callAPI_getOne("/api/v1/funcs/do/list",t.funcId);case 2:if(n=a.sent,n&&n.ok){a.next=5;break}return a.abrupt("return");case 5:for(r in o=e.T.formatURL("/api/v1/al/:id",{baseURL:!0,params:{id:t.id}}),i={},t.funcCallKwargsJSON)t.funcCallKwargsJSON.hasOwnProperty(r)&&e.common.isFuncArgumentPlaceholder(t.funcCallKwargsJSON[r])&&(i[r]=t.funcCallKwargsJSON[r]);l={kwargs:i},p=n.data.kwargsJSON,e.$refs.apiExampleDialog.update(o,l,p);case 11:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){return{data:[]}}},p=l,u=(a("5b02"),a("2877")),c=a("8d04"),d=Object(u["a"])(p,n,o,!1,null,"d023d360",null);"function"===typeof c["default"]&&Object(c["default"])(d);e["default"]=d.exports},ebfc:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"API Example":"API 调用示例","Request Options":"请求选项","Async":"异步执行","Save Result":"保留结果","Func Timeout":"函数超时","API Timeout":"API 超时","Input Parameters":"填写参数","Calling Example":"调用示例","Simple GET":"GET 简化形式","Normal GET":"GET 标准形式","Simple POST (JSON)":"POST 简化形式（JSON）","Simple POST (Form)":"POST 简化形式（表单）","Normal POST":"POST 标准形式","The JSON inside \\"kwargs\\" is the call parameter, modify its value and check out the calling example below":"\\"kwargs\\" 内的 JSON 即为调用参数，修改其中的值并在下方查看具体调用示例","This Python function allows additional parameters (**kwargs syntax)":"本 Python 函数支持传递额外的参数（**kwargs 语法）","This Python function allows uploading files, field name of the uploading file is \\"files\\"":"本 Python 函数支持文件上传，文件字段名为\\"files\\"","Invalid Parameters. Examples require a valid Body content":"参数填写存在错误，正确填写后将展示示例","Only string arguments are allowed in this from":"此方式参数值只支持字符串","Parameter \\"kwargs\\" should be URL encoded in HTTP request":"发送请求时，\\"kwargs\\" 参数需要进行 URL encode 编码","Parameter \\"options\\" are not supported in this from":"此方式不支持 \\"options\\" 参数","When posting form data, \\"Content-Type\\" should be \\"multipart/form-data\\" or \\"application/x-www-form-urlencoded\\", and the values of the fields support string value only":"POST 表单数据时，\\"Content-Type\\" 必须指定为 \\"multipart/form-data\\" 或 \\"application/x-www-form-urlencoded\\"，此时 Body 中参数值只支持字符串","When posting JSON data, \\"Content-Type\\" should be \\"application/json\\"":"POST JSON 数据时，\\"Content-Type\\" 必须指定为 \\"application/json\\"","When uploading files, \\"Content-Type\\" should be \\"multipart/form-data\\"":"上传文件时，\\"Content-Type\\" 必须指定为 \\"multipart/form-data\\"","File uploading is not supported in this this form":"此方式不支持文件上传","seconds":"秒"}}'),delete t.options._Ctor}}}]);