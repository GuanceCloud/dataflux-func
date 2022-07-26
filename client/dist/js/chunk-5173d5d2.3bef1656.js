(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-5173d5d2"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"135b":function(t,e,a){"use strict";a.r(e);var o=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("div",{staticClass:"page-header"},[a("span",[t._v("近期脚本故障")]),t._v(" "),a("div",{staticClass:"header-control"},[a("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}})],1)])]),t._v(" "),a("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?a("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?a("h1",{staticClass:"no-data-title"},[a("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):a("h1",{staticClass:"no-data-title"},[a("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v("尚无任何近期脚本故障")]),t._v(" "),a("p",{staticClass:"no-data-tip"},[t._v("\n          脚本运行时可能产生各种问题，如未在函数内部处理，则会抛出到系统层\n          "),a("br"),t._v("抛出的错误会被系统搜集，并展示在此\n        ")])]):a("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[a("el-table-column",{attrs:{label:"执行方式",width:"150"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{class:t.C.FUNC_EXEC_MODE_MAP.get(e.row.execMode).textClass},[t._v("\n              "+t._s(t.C.FUNC_EXEC_MODE_MAP.get(e.row.execMode).name)+"\n            ")])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:"时间",width:"200"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",[t._v(t._s(t._f("datetime")(e.row.createTime)))]),t._v(" "),a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(e.row.createTime)))])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:"函数"},scopedSlots:t._u([{key:"default",fn:function(e){return[e.row.func_id?[a("strong",{staticClass:"func-title"},[t._v(t._s(e.row.func_title||e.row.func_name))]),t._v(" "),a("br"),t._v(" "),a("el-tag",{attrs:{type:"info",size:"mini"}},[a("code",[t._v("def")])]),t._v(" "),a("code",{staticClass:"text-main text-small"},[t._v(t._s(e.row.func_id+"("+(t.T.isNothing(e.row.func_kwargsJSON)?"":"...")+")"))])]:[a("div",{staticClass:"text-bad"},[t._v("函数已不存在")]),t._v(" "),a("br")]]}}])}),t._v(" "),a("el-table-column",{attrs:{label:"故障内容"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("pre",{staticClass:"text-data"},[t._v(t._s(e.row.einfoSample))]),t._v(" "),a("el-button",{attrs:{type:"text"},on:{click:function(a){return t.showDetail(e.row)}}},[t._v("显示故障详情")])]}}])})],1)],1),t._v(" "),a("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),a("LongTextDialog",{ref:"longTextDialog",attrs:{title:"调用栈如下"}})],1)],1)},n=[],i=a("c7eb"),r=a("1da1"),s=(a("d3b7"),a("159b"),a("99af"),a("b76c")),c={name:"ScriptFailureList",components:{LongTextDialog:s["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(r["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(r["a"])(Object(i["a"])().mark((function e(){var a,o;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery(),e.next=3,t.T.callAPI_get("/api/v1/script-failures/do/list",{query:a});case 3:if(o=e.sent,o.ok){e.next=6;break}return e.abrupt("return");case 6:o.data.forEach((function(e){e.einfoSample=t.T.limitLines(e.einfoTEXT,-3,100)})),t.data=o.data,t.pageInfo=o.pageInfo,t.$store.commit("updateLoadStatus",!0);case 10:case"end":return e.stop()}}),e)})))()},showDetail:function(t){this.$store.commit("updateHighlightedTableDataId",t.id);var e=this.M(t.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),a="".concat(t.funcId,".error.").concat(e);this.$refs.longTextDialog.update(t.einfoTEXT,a)}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch}}}},l=c,d=(a("81da"),a("2877")),u=Object(d["a"])(l,o,n,!1,null,"429dea6f",null);e["default"]=u.exports},"21a6":function(t,e,a){(function(a){var o,n,i;(function(a,r){n=[],o=r,i="function"===typeof o?o.apply(e,n):o,void 0===i||(t.exports=i)})(0,(function(){"use strict";function e(t,e){return"undefined"==typeof e?e={autoBom:!1}:"object"!=typeof e&&(console.warn("Deprecated: Expected third argument to be a object"),e={autoBom:!e}),e.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob(["\ufeff",t],{type:t.type}):t}function o(t,e,a){var o=new XMLHttpRequest;o.open("GET",t),o.responseType="blob",o.onload=function(){s(o.response,e,a)},o.onerror=function(){console.error("could not download file")},o.send()}function n(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return 200<=e.status&&299>=e.status}function i(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(o){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var r="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof a&&a.global===a?a:void 0,s=r.saveAs||("object"!=typeof window||window!==r?function(){}:"download"in HTMLAnchorElement.prototype?function(t,e,a){var s=r.URL||r.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin===location.origin?i(c):n(c.href)?o(t,e,a):i(c,c.target="_blank")):(c.href=s.createObjectURL(t),setTimeout((function(){s.revokeObjectURL(c.href)}),4e4),setTimeout((function(){i(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,a,r){if(a=a||t.name||"download","string"!=typeof t)navigator.msSaveOrOpenBlob(e(t,r),a);else if(n(t))o(t,a,r);else{var s=document.createElement("a");s.href=t,s.target="_blank",setTimeout((function(){i(s)}))}}:function(t,e,a,n){if(n=n||open("","_blank"),n&&(n.document.title=n.document.body.innerText="downloading..."),"string"==typeof t)return o(t,e,a);var i="application/octet-stream"===t.type,s=/constructor/i.test(r.HTMLElement)||r.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||i&&s)&&"object"==typeof FileReader){var l=new FileReader;l.onloadend=function(){var t=l.result;t=c?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),n?n.location.href=t:location=t,n=null},l.readAsDataURL(t)}else{var d=r.URL||r.webkitURL,u=d.createObjectURL(t);n?n.location=u:location.href=u,n=null,setTimeout((function(){d.revokeObjectURL(u)}),4e4)}});r.saveAs=s.saveAs=s,t.exports=s}))}).call(this,a("c8ba"))},"391c":function(t,e,a){},"7b0b4":function(t,e,a){"use strict";var o=a("0797"),n=a.n(o);e["default"]=n.a},"81da":function(t,e,a){"use strict";a("391c")},a7e8:function(t,e,a){"use strict";a("b217")},b217:function(t,e,a){},b76c:function(t,e,a){"use strict";var o=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[a("template",{slot:"title"},[t.showDownload&&t.fileName&&t.content?a("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n      "+t._s(t.$t("Download as text file"))+"\n      "),a("i",{staticClass:"fa fa-fw fa-download"})]):t._e()],1),t._v(" "),a("div",[a("p",[t._v(t._s(t.title))]),t._v(" "),a("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},n=[],i=(a("130f"),a("21a6")),r=a.n(i),s={name:"LongTextDialog",components:{},watch:{"$store.state.uiLocale":function(t){this.T.resetCodeMirrorPhrases(this.codeMirror)}},methods:{update:function(t,e){var a=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){a.codeMirror||(a.codeMirror=a.T.initCodeMirror("longTextDialogContent",a.mode||"text"),a.codeMirror.setOption("theme",a.T.getCodeMirrorThemeName()),a.T.setCodeMirrorReadOnly(a.codeMirror,!0)),a.codeMirror.setValue(a.content||""),a.codeMirror.refresh()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;r.a.saveAs(t,e)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=s,l=(a("a7e8"),a("2877")),d=a("7b0b4"),u=Object(l["a"])(c,o,n,!1,null,"2682a737",null);"function"===typeof d["default"]&&Object(d["default"])(u);e["a"]=u.exports}}]);