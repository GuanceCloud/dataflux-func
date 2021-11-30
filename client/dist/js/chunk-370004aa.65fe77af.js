(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-370004aa"],{"0797":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Download as text file":"作为文本文件下载"}}'),delete t.options._Ctor}},"0a17":function(t,e,a){"use strict";a("3e04")},"21a6":function(t,e,a){t.exports=a("407a")(1579)},"3e04":function(t,e,a){},"53e0":function(t,e,a){"use strict";a.r(e);var n=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"fade"}},[t.$store.state.isLoaded?a("el-container",{attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[t._v("\n        近期脚本日志\n        "),a("div",{staticClass:"header-control"},[a("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}})],1)])]),t._v(" "),a("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?a("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?a("h1",{staticClass:"no-data-title"},[t._v("当前过滤条件无匹配数据")]):a("h1",{staticClass:"no-data-title"},[t._v("尚无任何近期脚本日志")]),t._v(" "),a("p",{staticClass:"no-data-tip"},[t._v("\n          在脚本中可以使用"),a("code",[t._v("print()")]),t._v("输出日志\n          "),a("br"),t._v("输出的日志会被系统搜集，并展示在此\n        ")])]):a("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[a("el-table-column",{attrs:{label:"执行方式",width:"150"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{class:t.C.FUNC_EXEC_MODE_MAP.get(e.row.execMode).textClass},[t._v("\n              "+t._s(t.C.FUNC_EXEC_MODE_MAP.get(e.row.execMode).name)+"\n            ")])]}}],null,!1,3264725356)}),t._v(" "),a("el-table-column",{attrs:{label:"时间",width:"200"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",[t._v(t._s(t._f("datetime")(e.row.createTime)))]),t._v(" "),a("br"),t._v(" "),a("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(e.row.createTime)))])]}}],null,!1,273918412)}),t._v(" "),a("el-table-column",{attrs:{label:"函数"},scopedSlots:t._u([{key:"default",fn:function(e){return[e.row.func_id?[a("strong",{staticClass:"func-title"},[t._v(t._s(e.row.func_title||e.row.func_name))]),t._v(" "),a("br"),t._v(" "),a("el-tag",{attrs:{type:"info",size:"mini"}},[a("code",[t._v("def")])]),t._v(" "),a("code",{staticClass:"text-main text-small"},[t._v(t._s(e.row.func_id+"("+(t.T.isNothing(e.row.func_kwargsJSON)?"":"...")+")"))])]:[a("div",{staticClass:"text-bad"},[t._v("函数已不存在")]),t._v(" "),a("br")]]}}],null,!1,4203247007)}),t._v(" "),a("el-table-column",{attrs:{label:"日志内容"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("pre",{staticClass:"text-data"},[t._v(t._s(e.row.messageSample))]),t._v(" "),a("el-button",{attrs:{type:"text"},on:{click:function(a){return t.showDetail(e.row)}}},[t._v("显示日志详情")])]}}],null,!1,2571959936)})],1)],1),t._v(" "),a("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),a("LongTextDialog",{ref:"longTextDialog",attrs:{title:"完整日志输出如下"}})],1):t._e()],1)},o=[],r=a("1da1"),i=(a("d3b7"),a("159b"),a("99af"),a("96cf"),a("b76c")),s={name:"ScriptLogList",components:{LongTextDialog:i["a"]},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(r["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function e(){var a,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery(),e.next=3,t.T.callAPI_get("/api/v1/script-logs/do/list",{query:a});case 3:if(n=e.sent,n.ok){e.next=6;break}return e.abrupt("return");case 6:n.data.forEach((function(e){e.messageSample=t.T.limitLines(e.messageTEXT,-3,100)})),t.data=n.data,t.pageInfo=n.pageInfo,t.$store.commit("updateLoadStatus",!0);case 10:case"end":return e.stop()}}),e)})))()},showDetail:function(t){this.$store.commit("updateHighlightedTableDataId",t.id);var e=this.M(t.createTime).utcOffset(8).format("YYYYMMDD_HHmmss"),a="".concat(t.funcId,".log.").concat(e);this.$refs.longTextDialog.update(t.messageTEXT,a)}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch}}}},l=s,c=(a("0a17"),a("2877")),u=Object(c["a"])(l,n,o,!1,null,"18f99a6c",null);e["default"]=u.exports},"7b0b":function(t,e,a){"use strict";var n=a("0797"),o=a.n(n);e["default"]=o.a},a7e8:function(t,e,a){"use strict";a("b217")},b217:function(t,e,a){},b76c:function(t,e,a){"use strict";var n=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("el-dialog",{attrs:{id:"LongTextDialog",visible:t.show,width:"70%"},on:{"update:visible":function(e){t.show=e}}},[a("template",{slot:"title"},[t.showDownload&&t.fileName&&t.content?a("el-link",{attrs:{type:"primary"},on:{click:t.download}},[t._v("\n      "+t._s(t.$t("Download as text file"))+"\n      "),a("i",{staticClass:"fa fa-fw fa-download"})]):t._e()],1),t._v(" "),a("div",[a("p",[t._v(t._s(t.title))]),t._v(" "),a("textarea",{attrs:{id:"longTextDialogContent"}})])],2)},o=[],r=(a("130f"),a("21a6")),i=a.n(r),s={name:"LongTextDialog",components:{},watch:{},methods:{update:function(t,e){var a=this;this.codeMirror&&this.codeMirror.setValue(""),this.content=t,this.fileName=(e||"dump")+".txt",this.show=!0,setImmediate((function(){a.codeMirror||(a.codeMirror=a.T.initCodeMirror("longTextDialogContent",a.mode||"text"),a.codeMirror.setOption("theme",a.T.getCodeMirrorThemeName()),a.T.setCodeMirrorReadOnly(a.codeMirror,!0)),a.codeMirror.setValue(a.content||""),a.codeMirror.refresh()}))},download:function(){var t=new Blob([this.content],{type:"text/plain"}),e=this.fileName;i.a.saveAs(t,e)}},computed:{},props:{title:String,mode:Boolean,showDownload:Boolean},data:function(){return{show:!1,fileName:null,content:null,codeMirror:null}},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},l=s,c=(a("a7e8"),a("2877")),u=a("7b0b"),d=Object(c["a"])(l,n,o,!1,null,"ece94f2e",null);"function"===typeof u["default"]&&Object(u["default"])(d);e["a"]=d.exports}}]);