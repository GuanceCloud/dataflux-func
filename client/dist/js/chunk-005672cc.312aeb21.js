(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-005672cc"],{"0797":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete e.options._Ctor}},"21a6":function(e,t,n){(function(n){var o,a,r;(function(n,i){a=[],o=i,r="function"===typeof o?o.apply(t,a):o,void 0===r||(e.exports=r)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function o(e,t,n){var o=new XMLHttpRequest;o.open("GET",e),o.responseType="blob",o.onload=function(){s(o.response,t,n)},o.onerror=function(){console.error("could not download file")},o.send()}function a(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function r(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(o){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var i="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof n&&n.global===n?n:void 0,s=i.saveAs||("object"!=typeof window||window!==i?function(){}:"download"in HTMLAnchorElement.prototype?function(e,t,n){var s=i.URL||i.webkitURL,c=document.createElement("a");t=t||e.name||"download",c.download=t,c.rel="noopener","string"==typeof e?(c.href=e,c.origin===location.origin?r(c):a(c.href)?o(e,t,n):r(c,c.target="_blank")):(c.href=s.createObjectURL(e),setTimeout((function(){s.revokeObjectURL(c.href)}),4e4),setTimeout((function(){r(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,n,i){if(n=n||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,i),n);else if(a(e))o(e,n,i);else{var s=document.createElement("a");s.href=e,s.target="_blank",setTimeout((function(){r(s)}))}}:function(e,t,n,a){if(a=a||open("","_blank"),a&&(a.document.title=a.document.body.innerText="downloading..."),"string"==typeof e)return o(e,t,n);var r="application/octet-stream"===e.type,s=/constructor/i.test(i.HTMLElement)||i.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||r&&s)&&"object"==typeof FileReader){var l=new FileReader;l.onloadend=function(){var e=l.result;e=c?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),a?a.location.href=e:location=e,a=null},l.readAsDataURL(e)}else{var u=i.URL||i.webkitURL,d=u.createObjectURL(e);a?a.location=d:location.href=d,a=null,setTimeout((function(){u.revokeObjectURL(d)}),4e4)}});i.saveAs=s.saveAs=s,e.exports=s}))}).call(this,n("c8ba"))},"7b0b4":function(e,t,n){"use strict";var o=n("0797"),a=n.n(o);t["default"]=a.a},a7e8:function(e,t,n){"use strict";n("b217")},b217:function(e,t,n){},b76c:function(e,t,n){"use strict";var o=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("el-dialog",{attrs:{id:"LongTextDialog",visible:e.show,"close-on-click-modal":!1,width:"70%"},on:{"update:visible":function(t){e.show=t}}},[n("template",{slot:"title"},[e.showDownload&&e.fileName&&e.content?n("el-link",{attrs:{type:"primary"},on:{click:e.download}},[e._v("\n      "+e._s(e.$t("Download as text file"))+"\n      "),n("i",{staticClass:"fa fa-fw fa-download"})]):e._e()],1),e._v(" "),n("div",[n("p",[e._v(e._s(e.title))]),e._v(" "),n("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},a=[],r=(n("130f"),n("21a6")),i=n.n(r),s={name:"LongTextDialog",components:{},watch:{},methods:{update:function(e,t){var n=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=e,this.fileName=(t||"dump")+".txt",this.show=!0,setImmediate((function(){n.codeMirror||(n.codeMirror=n.T.initCodeMirror("longTextDialogContent",n.mode||"text"),n.codeMirror.setOption("theme",n.T.getCodeMirrorThemeName()),n.T.setCodeMirrorReadOnly(n.codeMirror,!0)),n.codeMirror.setValue(n.content||""),n.codeMirror.refresh()}))},download:function(){var e=new Blob([this.content],{type:"text/plain"}),t=this.fileName;i.a.saveAs(e,t)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},c=s,l=(n("a7e8"),n("2877")),u=n("7b0b4"),d=Object(l["a"])(c,o,a,!1,null,"6cd179f4",null);"function"===typeof u["default"]&&Object(u["default"])(d);t["a"]=d.exports},d74d:function(e,t,n){"use strict";n.r(t);var o=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("transition",{attrs:{name:"fade"}},[n("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[n("el-header",{attrs:{height:"60px"}},[n("h1",[e._v("\n        "+e._s(e.$t("Func Store Manager"))+"\n        "),n("div",{staticClass:"header-control"},[n("FuzzySearchInput",{attrs:{dataFilter:e.dataFilter}})],1)])]),e._v(" "),n("el-main",{staticClass:"common-table-container"},[e.T.isNothing(e.data)?n("div",{staticClass:"no-data-area"},[e.T.isPageFiltered()?n("h1",{staticClass:"no-data-title"},[e._v(e._s(e.$t("No matched data found")))]):n("h1",{staticClass:"no-data-title"},[e._v(e._s(e.$t("No Func Store data has ever been added")))]),e._v(" "),n("p",{staticClass:"no-data-tip"},[e._v("\n          可以使用"),n("code",[e._v("DFF.STORE.set('key', 'value', scope='scope', expire=3600)")]),e._v("和"),n("code",[e._v("DFF.STORE('key', scope='scope')")]),e._v("来存取函数存储数据\n          "),n("br"),n("code",[e._v("scope")]),e._v("参数为可选。未指定时则默认为代码所在的脚本ID\n        ")])]):n("el-table",{staticClass:"common-table",attrs:{height:"100%",data:e.data}},[n("el-table-column",{attrs:{label:e.$t("Type"),width:"120"},scopedSlots:e._u([{key:"default",fn:function(t){return[n("code",[e._v(e._s(t.row.type.toLowerCase()))])]}}])}),e._v(" "),n("el-table-column",{attrs:{label:"Key"},scopedSlots:e._u([{key:"default",fn:function(t){return[n("code",{staticClass:"text-code"},[e._v(e._s(t.row.key))]),n("CopyButton",{attrs:{content:t.row.key}})]}}])}),e._v(" "),n("el-table-column",{attrs:{label:"Scope"},scopedSlots:e._u([{key:"default",fn:function(t){return[n("code",{staticClass:"text-code"},[e._v(e._s(t.row.scope))]),n("CopyButton",{attrs:{content:t.row.scope}})]}}])}),e._v(" "),n("el-table-column",{attrs:{label:e.$t("Expires"),width:"160"},scopedSlots:e._u([{key:"default",fn:function(t){return[t.row.expireAtMs?[n("span",{class:e.T.isExpired(t.row.expireAtMs)?"text-info":"text-good"},[e._v(e._s(e._f("datetime")(t.row.expireAtMs)))]),e._v(" "),n("br"),e._v(" "),n("span",{staticClass:"text-info"},[e._v(e._s(e._f("fromNow")(t.row.expireAtMs)))])]:n("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Never")))])]}}])}),e._v(" "),n("el-table-column",{attrs:{label:e.$t("Data Size"),sortable:"","sort-by":"dataSize",align:"right",width:"120"},scopedSlots:e._u([{key:"default",fn:function(t){return[n("code",{class:{"text-bad":t.row.isOverSized}},[e._v(e._s(t.row.dataSizeHuman))])]}}])}),e._v(" "),n("el-table-column",{attrs:{align:"right",width:"260"},scopedSlots:e._u([{key:"default",fn:function(t){return[t.row.isOverSized?e._e():n("el-link",{on:{click:function(n){return e.showDetail(t.row)}}},[e._v(e._s(e.$t("Show content")))]),e._v(" "),n("el-link",{on:{click:function(n){return e.quickSubmitData(t.row,"delete")}}},[e._v(e._s(e.$t("Delete")))])]}}])})],1)],1),e._v(" "),n("Pager",{attrs:{pageInfo:e.pageInfo}}),e._v(" "),n("LongTextDialog",{ref:"longTextDialog",attrs:{title:"内容如下",showDownload:!0}})],1)],1)},a=[],r=n("1da1"),i=(n("d3b7"),n("159b"),n("99af"),n("e9c4"),n("96cf"),n("b76c")),s={name:"FuncStoreManager",components:{LongTextDialog:i["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var n=this;return Object(r["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,n.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(r["a"])(regeneratorRuntime.mark((function t(){var n,o;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return n=e.dataFilter=e.T.createListQuery(),t.next=3,e.T.callAPI_get("/api/v1/func-stores/do/list",{query:n});case 3:if(o=t.sent,o.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=o.data,e.pageInfo=o.pageInfo,e.data.forEach((function(t){t.expireAt&&(t.expireAtMs=1e3*t.expireAt),t.dataSize&&(t.dataSizeHuman=e.T.byteSizeHuman(t.dataSize),t.isOverSized=t.dataSize>20480)})),e.$store.commit("updateLoadStatus",!0);case 10:case"end":return t.stop()}}),t)})))()},quickSubmitData:function(e,t){var n=this;return Object(r["a"])(regeneratorRuntime.mark((function o(){var a,r;return regeneratorRuntime.wrap((function(o){while(1)switch(o.prev=o.next){case 0:a='<small>\n          <br>Key: <code class="text-code">'.concat(e.key,'</code>\n          <br>Scope: <code class="text-code">').concat(e.scope,"</code>\n        <small>"),o.t0=t,o.next="delete"===o.t0?4:9;break;case 4:return o.next=6,n.T.confirm(n.$t("Are you sure you want to delete the Func Store data?")+a);case 6:if(o.sent){o.next=8;break}return o.abrupt("return");case 8:return o.abrupt("break",9);case 9:r=null,o.t1=t,o.next="delete"===o.t1?13:17;break;case 13:return o.next=15,n.T.callAPI("/api/v1/func-stores/:id/do/delete",{params:{id:e.id},alert:{okMessage:n.$t("Func Store data deleted")}});case 15:return r=o.sent,o.abrupt("break",17);case 17:if(r&&r.ok){o.next=19;break}return o.abrupt("return");case 19:return o.next=21,n.loadData();case 21:case"end":return o.stop()}}),o)})))()},showDetail:function(e){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function n(){var o,a,r,i;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.next=2,t.T.callAPI_get("/api/v1/func-stores/:id/do/get",{params:{id:e.id}});case 2:if(o=n.sent,o.ok){n.next=5;break}return n.abrupt("return");case 5:a=o.data.valueJSON,"string"!==typeof a&&(a=JSON.stringify(a,null,2)),r=t.M(e.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),i="".concat(e.scope,".").concat(e.key,".").concat(r),t.$refs.longTextDialog.update(a,i);case 10:case"end":return n.stop()}}),n)})))()}},computed:{},props:{},data:function(){var e=this.T.createPageInfo(),t=this.T.createListQuery();return{data:[],pageInfo:e,dataFilter:{_fuzzySearch:t._fuzzySearch}}}},c=s,l=n("2877"),u=n("f8d8"),d=Object(l["a"])(c,o,a,!1,null,"99faef00",null);"function"===typeof u["default"]&&Object(u["default"])(d);t["default"]=d.exports},f8d8:function(e,t,n){"use strict";var o=n("fe04"),a=n.n(o);t["default"]=a.a},fe04:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Type":"类型","Expires":"有效期","Never":"永不过期","Data Size":"数据大小","Show content":"显示内容","Func Store data deleted":"函数缓存数据已删除","No Func Store data has ever been added":"从未添加过任何函数存储数据","Are you sure you want to delete the Func Store data?":"是否确认删除此函数存储数据？"}}'),delete e.options._Ctor}}}]);