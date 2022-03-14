(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0aba32ae"],{4304:function(e,t,a){},"5ec0":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Script Market":"脚本市场","Install":"安装","Script Package Detail":"脚本包详情","Description":"描述","Requirements":"依赖","Are you sure you want to install the Script?":"是否确认安装此脚本？","Script installed, new Script is in effect immediately":"脚本已安装，新脚本立即生效","The following Script Set IDs already exists, do you want to overwrite?":"下列脚本集ID已经存在，是否覆盖？","Installed Script Set requires 3rd party packages, do you want to open PIP tool now?":"安装的脚本集需要第三方包，是否现在前往PIP工具"}}'),delete e.options._Ctor}},"8cfd":function(e,t,a){"use strict";a.r(t);var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("transition",{attrs:{name:"fade"}},[a("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[a("el-header",{attrs:{height:"60px"}},[a("h1",[e._v(e._s(e.$t("Script Market")))])]),e._v(" "),a("el-main",e._l(e.packageList,(function(t){return a("a",{key:t.package,staticClass:"package-card-wrap",on:{click:function(a){return e.openDetail(t)}}},[a("el-card",{staticClass:"package-card",attrs:{shadow:"hover"}},[a("i",{staticClass:"fa fa-fw fa-file-code-o package-icon"}),e._v(" "),a("span",{staticClass:"package-name"},[e._v(e._s(t.name))]),e._v(" "),a("code",{staticClass:"package-id"},[e._v("ID: "+e._s(t.package))]),e._v(" "),a("div",{staticClass:"package-release-time"},[a("span",[e._v(e._s(e._f("datetime")(t.releaseTime)))]),e._v(" "),a("br"),e._v(" "),a("span",{staticClass:"text-info"},[e._v(e._s(e._f("fromNow")(t.releaseTime)))])])])],1)})),0),e._v(" "),a("el-dialog",{staticClass:"package-detail",attrs:{title:e.$t("Script Package Detail"),visible:e.showDetail},on:{"update:visible":function(t){e.showDetail=t}}},[a("el-form",{attrs:{"label-width":"100px"}},[a("el-form-item",{attrs:{label:e.$t("Name")}},[a("el-input",{attrs:{readonly:"",value:e.detail.name}})],1),e._v(" "),a("el-form-item",{attrs:{label:"ID"}},[a("el-input",{attrs:{readonly:"",value:e.detail.package}})],1),e._v(" "),e.T.isNothing(e.detail.description)?e._e():a("el-form-item",{attrs:{label:e.$t("Description")}},[a("el-input",{attrs:{readonly:"",type:"textarea",resize:"none",autosize:!0,value:e.detail.description}})],1),e._v(" "),e.T.isNothing(e.detail.requirements)?e._e():a("el-form-item",{attrs:{label:e.$t("Requirements")}},[a("el-input",{attrs:{readonly:"",type:"textarea",resize:"none",autosize:!0,value:e.detail.requirements}})],1)],1),e._v(" "),a("div",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[a("el-button",{attrs:{size:"small"},on:{click:function(t){e.showDetail=!1}}},[e._v(e._s(e.$t("Cancel")))]),e._v(" "),a("el-button",{attrs:{size:"small",type:"primary",loading:e.isInstalling},on:{click:function(t){return e.installPackage(e.detail)}}},[e._v(e._s(e.$t("Install")))])],1)],1)],1)],1)},r=[],i=a("1da1"),s=(a("d3b7"),a("a15b"),a("99af"),a("96cf"),{name:"ScriptMarket",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(i["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var a,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=null,e.T.isNothing(null),t.next=4,e.T.callAPI_get("/api/v1/script-packages/index",{query:a});case 4:if(n=t.sent,n.ok){t.next=7;break}return t.abrupt("return");case 7:e.packageList=n.data,e.$store.commit("updateLoadStatus",!0);case 9:case"end":return t.stop()}}),t)})))()},openDetail:function(e){this.detail=e,this.showDetail=!0},installPackage:function(e){var t=this;return Object(i["a"])(regeneratorRuntime.mark((function a(){var n,r,i,s;return regeneratorRuntime.wrap((function(a){while(1)switch(a.prev=a.next){case 0:return n=e.scriptSets.reduce((function(e,t){return e.push(t.id),e}),[]),a.next=3,t.T.callAPI_getAll("/api/v1/script-sets/do/list",{query:{id:n.join(","),fields:["id"]}});case 3:if(r=a.sent,r.ok){a.next=6;break}return a.abrupt("return");case 6:if(i=[],t.T.isNothing(r.data)||(i=r.data.reduce((function(e,t){return e.push(t.id),e}),[])),!(i.length>0)){a.next=16;break}return a.next=12,t.T.confirm("".concat(t.$t("The following Script Set IDs already exists, do you want to overwrite?"),"<br>").concat(i.join("<br>")));case 12:if(a.sent){a.next=14;break}return a.abrupt("return");case 14:a.next=20;break;case 16:return a.next=18,t.T.confirm(t.$t("Are you sure you want to install the Script?"));case 18:if(a.sent){a.next=20;break}return a.abrupt("return");case 20:return t.isInstalling=!0,a.next=23,t.T.callAPI("post","/api/v1/script-sets/do/import",{body:{packageInstallURL:e.downloadURL,packageInstallId:e.package},alert:{okMessage:t.$t("Script installed, new Script is in effect immediately")}});case 23:if(r=a.sent,t.isInstalling=!1,r.ok){a.next=27;break}return a.abrupt("return",t.alertOnError(r));case 27:if(t.showDetail=!1,!t.T.isNothing(r.data.pkgs)){a.next=31;break}a.next=36;break;case 31:return a.next=33,t.T.confirm(t.$t("Installed Script Set requires 3rd party packages, do you want to open PIP tool now?"));case 33:if(!a.sent){a.next=36;break}s=r.data.pkgs.join(" "),t.$router.push({name:"pip-tool",query:{pkgs:t.T.getBase64(s)}});case 36:case"end":return a.stop()}}),a)})))()}},computed:{},props:{},data:function(){return{detail:{},packageList:[],showDetail:!1,isInstalling:!1}}}),o=s,c=(a("a27a"),a("fd1c"),a("2877")),l=a("f487"),u=Object(c["a"])(o,n,r,!1,null,"1b2f5c24",null);"function"===typeof l["default"]&&Object(l["default"])(u);t["default"]=u.exports},a27a:function(e,t,a){"use strict";a("dd16")},dd16:function(e,t,a){},f487:function(e,t,a){"use strict";var n=a("5ec0"),r=a.n(n);t["default"]=r.a},fd1c:function(e,t,a){"use strict";a("4304")}}]);