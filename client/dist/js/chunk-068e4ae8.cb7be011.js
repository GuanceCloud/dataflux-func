(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-068e4ae8"],{"0797":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete e.options._Ctor}},"21a6":function(e,t,a){(function(a){var n,o,r;(function(a,i){o=[],n=i,r="function"===typeof n?n.apply(t,o):n,void 0===r||(e.exports=r)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function n(e,t,a){var n=new XMLHttpRequest;n.open("GET",e),n.responseType="blob",n.onload=function(){c(n.response,t,a)},n.onerror=function(){console.error("could not download file")},n.send()}function o(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function r(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(n){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var i="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof a&&a.global===a?a:void 0,s=i.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),c=i.saveAs||("object"!=typeof window||window!==i?function(){}:"download"in HTMLAnchorElement.prototype&&!s?function(e,t,a){var s=i.URL||i.webkitURL,c=document.createElement("a");t=t||e.name||"download",c.download=t,c.rel="noopener","string"==typeof e?(c.href=e,c.origin===location.origin?r(c):o(c.href)?n(e,t,a):r(c,c.target="_blank")):(c.href=s.createObjectURL(e),setTimeout((function(){s.revokeObjectURL(c.href)}),4e4),setTimeout((function(){r(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,a,i){if(a=a||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,i),a);else if(o(e))n(e,a,i);else{var s=document.createElement("a");s.href=e,s.target="_blank",setTimeout((function(){r(s)}))}}:function(e,t,a,o){if(o=o||open("","_blank"),o&&(o.document.title=o.document.body.innerText="downloading..."),"string"==typeof e)return n(e,t,a);var r="application/octet-stream"===e.type,c=/constructor/i.test(i.HTMLElement)||i.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||r&&c||s)&&"undefined"!=typeof FileReader){var u=new FileReader;u.onloadend=function(){var e=u.result;e=l?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),o?o.location.href=e:location=e,o=null},u.readAsDataURL(e)}else{var d=i.URL||i.webkitURL,f=d.createObjectURL(e);o?o.location=f:location.href=f,o=null,setTimeout((function(){d.revokeObjectURL(f)}),4e4)}});i.saveAs=c.saveAs=c,e.exports=c}))}).call(this,a("c8ba"))},"788f":function(e,t,a){},"7b0b4":function(e,t,a){"use strict";var n=a("0797"),o=a.n(n);t["default"]=o.a},b76c:function(e,t,a){"use strict";var n=function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"LongTextDialog",visible:e.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(t){e.show=t}}},[t("template",{slot:"title"},[e.showDownload&&e.fileName&&e.content?t("el-link",{attrs:{type:"primary"},on:{click:e.download}},[e._v("\n      "+e._s(e.$t("Download as text file"))+"\n      "),t("i",{staticClass:"fa fa-fw fa-download"})]):e._e()],1),e._v(" "),t("div",[t("p",[e._v(e._s(e.title))]),e._v(" "),t("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},o=[],r=(a("130f"),a("21a6")),i=a.n(r),s={name:"LongTextDialog",components:{},watch:{"$store.state.uiLocale":function(e){this.T.resetCodeMirrorPhrases(this.codeMirror)}},methods:{update:function(e,t){var a=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=e,this.fileName=(t||"dump")+".txt",this.show=!0,setImmediate((function(){a.codeMirror||(a.codeMirror=a.T.initCodeMirror("longTextDialogContent",a.mode||"text"),a.codeMirror.setOption("theme",a.T.getCodeMirrorThemeName()),a.T.setCodeMirrorReadOnly(a.codeMirror,!0)),a.codeMirror.setValue(a.content||""),a.codeMirror.refresh()}))},download:function(){var e=new Blob([this.content],{type:"text/plain"}),t=this.fileName;i.a.saveAs(e,t)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=s,l=(a("ca37"),a("2877")),u=a("7b0b4"),d=Object(l["a"])(c,n,o,!1,null,"4c1c9c37",null);"function"===typeof u["default"]&&Object(u["default"])(d);t["a"]=d.exports},ca37:function(e,t,a){"use strict";a("788f")},d74d:function(e,t,a){"use strict";a.r(t);var n=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("div",{staticClass:"page-header"},[t("span",[e._v(e._s(e.$t("Func Store Managment")))]),e._v(" "),t("div",{staticClass:"header-control"},[t("FuzzySearchInput",{attrs:{dataFilter:e.dataFilter}})],1)])]),e._v(" "),t("el-main",{staticClass:"common-table-container"},[e.T.isNothing(e.data)?t("div",{staticClass:"no-data-area"},[e.T.isPageFiltered()?t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-search"}),e._v(e._s(e.$t("No matched data found")))]):t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-info-circle"}),e._v(e._s(e.$t("No Func Store data has ever been added")))]),e._v(" "),t("p",{staticClass:"no-data-tip"},[e._v("\n          可以使用"),t("code",[e._v("DFF.STORE.set('key', 'value', scope='scope', expire=3600)")]),e._v("和"),t("code",[e._v("DFF.STORE('key', scope='scope')")]),e._v("来存取函数存储数据\n          "),t("br"),t("code",[e._v("scope")]),e._v("参数为可选。未指定时则默认为代码所在的脚本ID\n        ")])]):t("el-table",{staticClass:"common-table",attrs:{height:"100%",data:e.data}},[t("el-table-column",{attrs:{label:e.$t("Type"),width:"120"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("code",[e._v(e._s(a.row.type.toLowerCase()))])]}}])}),e._v(" "),t("el-table-column",{attrs:{label:"Key"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("code",{staticClass:"text-main"},[e._v(e._s(a.row.key))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.key}})]}}])}),e._v(" "),t("el-table-column",{attrs:{label:"Scope"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("code",{staticClass:"text-main"},[e._v(e._s(a.row.scope))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.scope}})]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Expires"),width:"120"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.expireAtMs?[t("span",{class:e.T.isExpired(a.row.expireAtMs)?"text-info":"text-good"},[e._v(e._s(e._f("datetime")(a.row.expireAtMs)))]),e._v(" "),t("br"),e._v(" "),t("span",{staticClass:"text-info"},[e._v(e._s(e._f("fromNow")(a.row.expireAtMs)))])]:t("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Never")))])]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Data Size"),sortable:"","sort-by":"dataSize",align:"right",width:"150"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("code",{class:{"text-bad":a.row.isOverSized}},[e._v(e._s(a.row.dataSizeHuman))])]}}])}),e._v(" "),t("el-table-column",{attrs:{align:"right",width:"200"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.isOverSized?e._e():t("el-link",{on:{click:function(t){return e.showDetail(a.row)}}},[e._v(e._s(e.$t("Show content")))]),e._v(" "),t("el-link",{on:{click:function(t){return e.quickSubmitData(a.row,"delete")}}},[e._v(e._s(e.$t("Delete")))])]}}])})],1)],1),e._v(" "),t("Pager",{attrs:{pageInfo:e.pageInfo}}),e._v(" "),t("LongTextDialog",{ref:"longTextDialog",attrs:{title:"内容如下",showDownload:!0}})],1)],1)},o=[],r=a("c7eb"),i=a("1da1"),s=(a("d3b7"),a("159b"),a("99af"),a("e9c4"),a("b76c")),c={name:"FuncStoreManager",components:{LongTextDialog:s["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(i["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(i["a"])(Object(r["a"])().mark((function t(){var a,n;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.dataFilter=e.T.createListQuery(),t.next=3,e.T.callAPI_get("/api/v1/func-stores/do/list",{query:a});case 3:if(n=t.sent,n&&n.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=n.data,e.pageInfo=n.pageInfo,e.data.forEach((function(t){t.expireAt&&(t.expireAtMs=1e3*t.expireAt),t.dataSize&&(t.dataSizeHuman=e.T.byteSizeHuman(t.dataSize),t.isOverSized=t.dataSize>102400)})),e.$store.commit("updateLoadStatus",!0);case 10:case"end":return t.stop()}}),t)})))()},quickSubmitData:function(e,t){var a=this;return Object(i["a"])(Object(r["a"])().mark((function n(){var o,i;return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:o='<small>\n          <br>Key: <code class="text-main">'.concat(e.key,'</code>\n          <br>Scope: <code class="text-main">').concat(e.scope,"</code>\n        <small>"),n.t0=t,n.next="delete"===n.t0?4:9;break;case 4:return n.next=6,a.T.confirm(a.$t("Are you sure you want to delete the Func Store data?")+o);case 6:if(n.sent){n.next=8;break}return n.abrupt("return");case 8:return n.abrupt("break",9);case 9:i=null,n.t1=t,n.next="delete"===n.t1?13:17;break;case 13:return n.next=15,a.T.callAPI("/api/v1/func-stores/:id/do/delete",{params:{id:e.id},alert:{okMessage:a.$t("Func Store data deleted")}});case 15:return i=n.sent,n.abrupt("break",17);case 17:if(i&&i.ok){n.next=19;break}return n.abrupt("return");case 19:return n.next=21,a.loadData();case 21:case"end":return n.stop()}}),n)})))()},showDetail:function(e){var t=this;return Object(i["a"])(Object(r["a"])().mark((function a(){var n,o,i,s;return Object(r["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return a.next=2,t.T.callAPI_get("/api/v1/func-stores/:id/do/get",{params:{id:e.id}});case 2:if(n=a.sent,n.ok){a.next=5;break}return a.abrupt("return");case 5:o=n.data.valueJSON,"string"!==typeof o&&(o=JSON.stringify(o,null,2)),i=t.M(e.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),s="".concat(e.scope,".").concat(e.key,".").concat(i),t.$refs.longTextDialog.update(o,s);case 10:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){var e=this.T.createPageInfo(),t=this.T.createListQuery();return{data:[],pageInfo:e,dataFilter:{_fuzzySearch:t._fuzzySearch}}}},l=c,u=a("2877"),d=a("f8d8"),f=Object(u["a"])(l,n,o,!1,null,"3398393e",null);"function"===typeof d["default"]&&Object(d["default"])(f);t["default"]=f.exports},f8d8:function(e,t,a){"use strict";var n=a("fe04"),o=a.n(n);t["default"]=o.a},fe04:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Type":"类型","Expires":"有效期","Never":"永不过期","Data Size":"数据大小","Show content":"显示内容","Func Store data deleted":"函数缓存数据已删除","No Func Store data has ever been added":"从未添加过任何函数存储数据","Are you sure you want to delete the Func Store data?":"是否确认删除此函数存储数据？"}}'),delete e.options._Ctor}}}]);