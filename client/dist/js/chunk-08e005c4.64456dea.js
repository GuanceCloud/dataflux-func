(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-08e005c4"],{"026e":function(t,e,a){"use strict";a("9200")},"13d5":function(t,e,a){"use strict";var i=a("23e7"),n=a("d58f").left,s=a("a640"),r=a("2d00"),o=a("605d"),c=s("reduce"),l=!o&&r>79&&r<83;i({target:"Array",proto:!0,forced:!c||l},{reduce:function(t){var e=arguments.length;return n(this,t,e,e>1?arguments[1]:void 0)}})},5861:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"FoundPackagesCount":"Package not Found | Found {n} package | Found {n} packages"}}'),delete t.options._Ctor}},"5c45":function(t,e,a){},"78c0":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Script Market":"脚本市场","Install":"安装","Script Package Detail":"脚本包详情","Description":"描述","Requirements":"依赖","Are you sure you want to install the Script?":"是否确认安装此脚本？","Script installed, new Script is in effect immediately":"脚本已安装，新脚本立即生效","The following Script Set IDs already exists, do you want to overwrite?":"下列脚本集ID已经存在，是否覆盖？","Installed Script Set requires 3rd party packages, do you want to open PIP tool now?":"安装的脚本集需要第三方包，是否现在前往PIP工具","Unable to access the Script Market":"无法访问脚本市场","Please check if the system can access the Internet properly":"请确认系统是否可以正常访问公网","No Script Package has ever been published":"尚未发布任何脚本包","FoundPackagesCount":"找不到脚本包 | 共找到 {n} 个脚本包 | 共找到 {n} 个脚本包"}}'),delete t.options._Ctor}},"7bfe":function(t,e,a){"use strict";var i=a("5861"),n=a.n(i);e["default"]=n.a},"8cfd":function(t,e,a){"use strict";a.r(e);a("b0c0"),a("a4d3"),a("e01a");var i=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"page-header"},[e("span",[t._v(t._s(t.$t("Script Market")))]),t._v(" "),t.T.isNothing(t.packageList)?t._e():e("div",{staticClass:"header-control"},[e("span",{staticClass:"text-main"},[t._v(t._s(t.$tc("FoundPackagesCount",t.filteredPackageList.length)))]),t._v("\n          　\n          "),e("el-input",{staticClass:"filter-input",attrs:{placeholder:t.$t("Filter"),size:"small"},model:{value:t.filterTEXT,callback:function(e){t.filterTEXT=e},expression:"filterTEXT"}},[t.filterTEXT?e("i",{staticClass:"el-input__icon el-icon-close text-main",attrs:{slot:"prefix"},on:{click:function(e){t.filterTEXT=""}},slot:"prefix"}):t._e()])],1)])]),t._v(" "),e("el-main",[t.indexLoaded?t.T.isNothing(t.packageList)?e("div",{staticClass:"no-data-area"},[e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-inbox"}),t._v(t._s(t.$t("No Script Package has ever been published")))])]):t._l(t.filteredPackageList,(function(a){return e("a",{key:a.package,staticClass:"package-card-wrap",on:{click:function(e){return t.openDetail(a)}}},[e("el-card",{staticClass:"package-card",attrs:{shadow:"hover"}},[e("i",{staticClass:"fa fa-fw fa-folder-open package-icon"}),t._v(" "),e("div",{staticClass:"package-info"},[e("span",{staticClass:"package-name"},[t._v(t._s(a.name))]),t._v(" "),e("code",{staticClass:"package-id"},[t._v("ID: "+t._s(a.package))])]),t._v(" "),e("div",{staticClass:"package-release-time"},[e("span",[t._v(t._s(t._f("datetime")(a.releaseTime)))]),t._v(" "),e("br"),t._v(" "),e("span",{staticClass:"text-info"},[t._v(t._s(t._f("fromNow")(a.releaseTime)))])])])],1)})):e("div",{staticClass:"no-data-area"},[e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-chain-broken"}),t._v("\n          "+t._s(t.$t("Unable to access the Script Market"))+"\n        ")]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          "+t._s(t.$t("Please check if the system can access the Internet properly"))+"\n        ")])])],2),t._v(" "),e("el-dialog",{staticClass:"package-detail",attrs:{title:t.$t("Script Package Detail"),visible:t.showDetail},on:{"update:visible":function(e){t.showDetail=e}}},[e("el-form",{attrs:{"label-width":"100px"}},[e("el-form-item",{attrs:{label:t.$t("Name")}},[e("el-input",{attrs:{readonly:"",value:t.detail.name}})],1),t._v(" "),e("el-form-item",{attrs:{label:"ID"}},[e("el-input",{attrs:{readonly:"",value:t.detail.package}})],1),t._v(" "),t.T.isNothing(t.detail.description)?t._e():e("el-form-item",{attrs:{label:t.$t("Description")}},[e("el-input",{attrs:{readonly:"",type:"textarea",resize:"none",autosize:!0,value:t.detail.description}})],1),t._v(" "),t.T.isNothing(t.detail.requirements)?t._e():e("el-form-item",{attrs:{label:t.$t("Requirements")}},[e("el-input",{attrs:{readonly:"",type:"textarea",resize:"none",autosize:!0,value:t.detail.requirements}})],1)],1),t._v(" "),e("div",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[e("el-button",{attrs:{size:"small"},on:{click:function(e){t.showDetail=!1}}},[t._v(t._s(t.$t("Cancel")))]),t._v(" "),e("el-button",{attrs:{size:"small",type:"primary",loading:t.isInstalling},on:{click:function(e){return t.installPackage(t.detail)}}},[t._v(t._s(t.$t("Install")))])],1)],1)],1)],1)},n=[],s=a("c7eb"),r=a("1da1"),o=(a("13d5"),a("d3b7"),a("a15b"),a("99af"),a("4de4"),{name:"ScriptMarket",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(r["a"])(Object(s["a"])().mark((function t(){return Object(s["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(r["a"])(Object(s["a"])().mark((function e(){var a,i;return Object(s["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=null,t.T.isNothing(null),e.next=4,t.T.callAPI_get("/api/v1/script-packages/index",{query:a});case 4:i=e.sent,i.ok&&(t.packageList=i.data,t.indexLoaded=!0),t.$store.commit("updateLoadStatus",!0);case 7:case"end":return e.stop()}}),e)})))()},openDetail:function(t){this.detail=t,this.showDetail=!0},installPackage:function(t){var e=this;return Object(r["a"])(Object(s["a"])().mark((function a(){var i,n,r,o;return Object(s["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return i=t.scriptSets.reduce((function(t,e){return t.push(e.id),t}),[]),a.next=3,e.T.callAPI_getAll("/api/v1/script-sets/do/list",{query:{id:i.join(","),fields:["id"]}});case 3:if(n=a.sent,n.ok){a.next=6;break}return a.abrupt("return");case 6:if(r=[],e.T.isNothing(n.data)||(r=n.data.reduce((function(t,e){return t.push(e.id),t}),[])),!(r.length>0)){a.next=16;break}return a.next=12,e.T.confirm("".concat(e.$t("The following Script Set IDs already exists, do you want to overwrite?"),"<br>").concat(r.join("<br>")));case 12:if(a.sent){a.next=14;break}return a.abrupt("return");case 14:a.next=20;break;case 16:return a.next=18,e.T.confirm(e.$t("Are you sure you want to install the Script?"));case 18:if(a.sent){a.next=20;break}return a.abrupt("return");case 20:return e.isInstalling=!0,a.next=23,e.T.callAPI("post","/api/v1/script-sets/do/import",{body:{packageInstallURL:t.downloadURL,packageInstallId:t.package},alert:{okMessage:e.$t("Script installed, new Script is in effect immediately")}});case 23:if(n=a.sent,e.isInstalling=!1,n.ok){a.next=27;break}return a.abrupt("return",e.alertOnError(n));case 27:if(e.showDetail=!1,!e.T.isNothing(n.data.pkgs)){a.next=31;break}a.next=36;break;case 31:return a.next=33,e.T.confirm(e.$t("Installed Script Set requires 3rd party packages, do you want to open PIP tool now?"));case 33:if(!a.sent){a.next=36;break}o=n.data.pkgs.join(" "),e.$router.push({name:"pip-tool",query:{pkgs:e.T.getBase64(o)}});case 36:case"end":return a.stop()}}),a)})))()}},computed:{filteredPackageList:function(){var t=this;return this.T.isNothing(this.filterTEXT)?this.packageList:this.packageList.filter((function(e){return e.name.indexOf(t.filterTEXT)>=0||e.package.indexOf(t.filterTEXT)>=0}))}},props:{},data:function(){return{detail:{},filterTEXT:"",packageList:[],showDetail:!1,isInstalling:!1,indexLoaded:!1}}}),c=o,l=(a("c10a"),a("026e"),a("2877")),u=a("7bfe"),d=a("a4b8"),p=Object(l["a"])(c,i,n,!1,null,"0a64bb6b",null);"function"===typeof u["default"]&&Object(u["default"])(p),"function"===typeof d["default"]&&Object(d["default"])(p);e["default"]=p.exports},9200:function(t,e,a){},a4b8:function(t,e,a){"use strict";var i=a("78c0"),n=a.n(i);e["default"]=n.a},c10a:function(t,e,a){"use strict";a("5c45")},d58f:function(t,e,a){var i=a("59ed"),n=a("7b0b"),s=a("44ad"),r=a("07fa"),o=TypeError,c=function(t){return function(e,a,c,l){i(a);var u=n(e),d=s(u),p=r(u),f=t?p-1:0,h=t?-1:1;if(c<2)while(1){if(f in d){l=d[f],f+=h;break}if(f+=h,t?f<0:p<=f)throw o("Reduce of empty array with no initial value")}for(;t?f>=0:p>f;f+=h)f in d&&(l=a(l,d[f],f,u));return l}};t.exports={left:c(!1),right:c(!0)}}}]);