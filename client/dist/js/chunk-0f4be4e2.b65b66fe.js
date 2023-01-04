(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0f4be4e2"],{"0444":function(t,e,a){},3766:function(t,e,a){"use strict";a("0444")},6652:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Config":"配置","Auth":"认证","Expires":"过期","Throttling":"限流","Python functions that can be called externally":"可被外部调用的 Python 函数","Press {0} to search":"按 {0} 开始搜索","Auth Link only supports synchronous calling":"授权链接只支持同步调用"}}'),delete t.options._Ctor}},"8d04":function(t,e,a){"use strict";var n=a("6652"),s=a.n(n);e["default"]=s.a},e685:function(t,e,a){"use strict";a.r(e);a("b0c0");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[e("Logo",{staticClass:"doc-logo",attrs:{type:"auto",width:"200px",height:"40px"}}),t._v("\n        "+t._s(t.$t("Auth Link Documents"))+"\n         \n        "),e("small",[t._v(t._s(t.$t("Python functions that can be called externally")))]),t._v(" "),e("span",{staticClass:"text-info title-tip"},[e("i18n",{attrs:{path:"Press {0} to search"}},[e("span",[e("kbd",[t._v(t._s(t.T.getSuperKeyName()))]),t._v(" + "),e("kbd",[t._v("F")])])])],1)],1)]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data}},[e("el-table-column",{attrs:{label:t.$t("Func")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("FuncInfo",{attrs:{id:a.row.funcId,title:a.row.funcTitle,kwargsJSON:a.row.funcCallKwargsJSON}}),t._v(" "),e("div",[e("span",{staticClass:"text-info"},[t._v("ID")]),t._v("\n               "),e("code",{staticClass:"text-main"},[t._v(t._s(a.row.id))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.id}}),t._v(" "),e("br"),t._v(" "),t.T.notNothing(a.row.funcCategory)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Category")))]),t._v("\n                 "),e("code",[t._v(t._s(a.row.funcCategory))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.funcIntegration)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Integration")))]),t._v("\n                 \n                "),t.C.FUNC_INTEGRATION_MAP.get(a.row.funcIntegration)?e("code",[t._v(t._s(t.C.FUNC_INTEGRATION_MAP.get(a.row.funcIntegration).name))]):e("code",[t._v(t._s(a.row.funcIntegration))]),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.tagsJSON)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Tags")))]),t._v("\n                 "),t._l(a.row.tagsJSON,(function(a){return e("el-tag",{key:a,attrs:{size:"mini",type:"warning"}},[t._v(t._s(a))])})),t._v(" "),e("br")]:t._e(),t._v(" "),t.T.notNothing(a.row.funcTagsJSON)?[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Func Tags")))]),t._v("\n                 "),t._l(a.row.funcTagsJSON,(function(a){return e("el-tag",{key:a,attrs:{size:"mini",type:"info"}},[t._v(t._s(a))])})),t._v(" "),e("br")]:t._e()],2)]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Document")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("pre",{staticClass:"func-doc"},[t._v(t._s(a.row.funcDescription))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Config"),width:"220"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Auth"))+t._s(t.$t(":")))]),t._v(" "),e("el-tooltip",{attrs:{content:a.row.apiAuthName,disabled:!a.row.apiAuthName,placement:"right"}},[e("span",{class:{"text-main":!!a.row.apiAuthId}},[t._v(t._s(t.C.API_AUTH_MAP.get(a.row.apiAuthType).name))])]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Expires"))+t._s(t.$t(":")))]),t._v(" "),a.row.expireTime?[e("RelativeDateTime",{class:t.T.isExpired(a.row.expireTime)?"text-bad":"text-good",attrs:{datetime:a.row.expireTime}})]:e("span",[t._v("-")]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t.$t("Throttling"))+t._s(t.$t(":")))]),t._v(" "),t.T.isNothing(a.row.throttlingJSON)?e("span",[t._v("-")]):e("el-tooltip",{attrs:{placement:"right"}},[e("div",{attrs:{slot:"content"},slot:"content"},[t._l(t.C.AUTH_LINK_THROTTLING,(function(n){return[a.row.throttlingJSON[n.key]?e("span",[t._v(t._s(t.$tc(n.name,a.row.throttlingJSON[n.key]))),e("br")]):t._e()]}))],2),t._v(" "),e("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("ON")))])])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Status"),width:"200"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isDisabled?e("span",{staticClass:"text-bad"},[e("i",{staticClass:"fa fa-fw fa-ban"}),t._v(" "+t._s(t.$t("Disabled")))]):e("span",{staticClass:"text-good"},[e("i",{staticClass:"fa fa-fw fa-check"}),t._v(" "+t._s(t.$t("Enabled")))])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-link",{attrs:{disabled:!a.row.funcId},on:{click:function(e){return t.showAPI(a.row)}}},[t._v(t._s(t.$t("Example")))])]}}])})],1)],1),t._v(" "),e("APIExampleDialog",{ref:"apiExampleDialog",attrs:{description:t.$t("Auth Link only supports synchronous calling"),showPostExample:!0,showPostExampleSimplified:!0,showGetExample:!0,showGetExampleSimplified:!0}})],1)],1)},s=[],o=a("c7eb"),r=a("1da1"),i=a("b3fd"),c={name:"AuthLinkFuncDoc",components:{APIExampleDialog:i["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(r["a"])(Object(o["a"])().mark((function t(){return Object(o["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(r["a"])(Object(o["a"])().mark((function e(){var a;return Object(o["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/auth-link-func-list");case 2:if(a=e.sent,a&&a.ok){e.next=5;break}return e.abrupt("return");case 5:t.data=a.data,t.$store.commit("updateLoadStatus",!0);case 7:case"end":return e.stop()}}),e)})))()},showAPI:function(t){var e=this;return Object(r["a"])(Object(o["a"])().mark((function a(){var n,s,r,i,c,l;return Object(o["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,e.T.callAPI_getOne("/api/v1/funcs/do/list",t.funcId);case 2:if(n=a.sent,n&&n.ok){a.next=5;break}return a.abrupt("return");case 5:for(c in s=n.data.kwargsJSON,r=e.T.formatURL("/api/v1/al/:id",{baseURL:!0,params:{id:t.id}}),i={},t.funcCallKwargsJSON)t.funcCallKwargsJSON.hasOwnProperty(c)&&e.common.isFuncArgumentPlaceholder(t.funcCallKwargsJSON[c])&&(i[c]=t.funcCallKwargsJSON[c]);l={kwargs:i},e.$refs.apiExampleDialog.update(r,l,s);case 11:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){return{data:[]}}},l=c,u=(a("3766"),a("2877")),_=a("8d04"),p=Object(u["a"])(l,n,s,!1,null,"3ddc96c6",null);"function"===typeof _["default"]&&Object(_["default"])(p);e["default"]=p.exports}}]);