(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-69824b26"],{"06c5":function(t,e,a){"use strict";a.d(e,"a",(function(){return r}));a("fb6a"),a("d3b7"),a("b0c0"),a("a630"),a("3ca3"),a("ac1f"),a("00b4");var n=a("6b75");function r(t,e){if(t){if("string"===typeof t)return Object(n["a"])(t,e);var a=Object.prototype.toString.call(t).slice(8,-1);return"Object"===a&&t.constructor&&(a=t.constructor.name),"Map"===a||"Set"===a?Array.from(t):"Arguments"===a||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a)?Object(n["a"])(t,e):void 0}}},"0dfd":function(t,e,a){},"3b3a":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"PIP Tool":"PIP工具","Mirror":"镜像源","Install Package":"安装包","Installed Packages":"已安装的包","Package":"包","Version":"版本","Built-in":"内置","Installed":"已安装","Exactly match":"完全匹配","Install":"安装","Installing":"正在安装","Package installed: {pkg}":"包已安装：{pkg}","[object Object]":"任意一个容器ID","You can also install the package by following command":"您也可以使用以下命令来安装","Previous installing may still running":"之前的安装似乎仍然在运行","Are you sure you want to install the package now?":"是否确定现在就安装？"}}'),delete t.options._Ctor}},"6b75":function(t,e,a){"use strict";function n(t,e){(null==e||e>t.length)&&(e=t.length);for(var a=0,n=new Array(e);a<e;a++)n[a]=t[a];return n}a.d(e,"a",(function(){return n}))},"833f":function(t,e,a){"use strict";a("0dfd")},a434:function(t,e,a){"use strict";var n=a("23e7"),r=a("7b0b"),i=a("23cb"),s=a("5926"),o=a("07fa"),l=a("3511"),c=a("65f0"),u=a("8418"),p=a("083a"),f=a("1dde"),d=f("splice"),b=Math.max,h=Math.min;n({target:"Array",proto:!0,forced:!d},{splice:function(t,e){var a,n,f,d,g,v,k=r(this),y=o(k),_=i(t,y),m=arguments.length;for(0===m?a=n=0:1===m?(a=0,n=y-_):(a=m-2,n=h(b(s(e),0),y-_)),l(y+a-n),f=c(k,n),d=0;d<n;d++)g=_+d,g in k&&u(f,d,k[g]);if(f.length=n,a<n){for(d=_;d<y-n;d++)g=d+n,v=d+a,g in k?k[v]=k[g]:p(k,v);for(d=y;d>y-n+a;d--)p(k,d-1)}else if(a>n)for(d=y-n;d>_;d--)g=d+n-1,v=d+a-1,g in k?k[v]=k[g]:p(k,v);for(d=0;d<a;d++)k[d+_]=arguments[d+2];return k.length=y-n+a,f}})},a630:function(t,e,a){var n=a("23e7"),r=a("4df4"),i=a("1c7e"),s=!i((function(t){Array.from(t)}));n({target:"Array",stat:!0,forced:s},{from:r})},c3bb:function(t,e,a){"use strict";a.r(e);a("b0c0");var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[t.$store.state.isLoaded?t._e():e("PageLoading"),t._v(" "),e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("h1",[t._v(t._s(t.$t("PIP Tool")))])]),t._v(" "),e("el-main",[e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Install Package")))])]),t._v(" "),e("el-select",{staticStyle:{width:"235px"},model:{value:t.pypiMirror,callback:function(e){t.pypiMirror=e},expression:"pypiMirror"}},t._l(t.C.PIP_MIRROR,(function(t){return e("el-option",{key:t.key,attrs:{label:t.name,value:t.value}})})),1),t._v(" "),e("el-input",{staticStyle:{width:"500px"},attrs:{placeholder:"package or package==1.2.3"},model:{value:t.packageToInstall,callback:function(e){t.packageToInstall=e},expression:"packageToInstall"}}),t._v(" "),e("el-button",{attrs:{type:"primary",disabled:!t.isInstallable||t.isInstalling},on:{click:t.installPackage}},[t.isInstalling?e("span",[e("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}),t._v("\n          "+t._s(t.$t("Installing"))+"\n        ")]):e("span",[t._v(t._s(t.$t("Install")))])]),t._v(" "),e("p",{staticClass:"pip-install-tips"},[t.pipShell?[t._v("\n          "+t._s(t.$t("You can also install the package by following command"))+t._s(t.$t(":"))+"\n          "),e("br"),t._v("\n          　\n          "),e("code",{staticClass:"text-main"},[t._v(t._s(t.pipShell))]),t._v(" "),e("CopyButton",{attrs:{content:t.pipShell}})]:t._e()],2),t._v(" "),e("el-divider",{attrs:{"content-position":"left"}},[e("h1",[t._v(t._s(t.$t("Installed Packages")))])]),t._v(" "),e("el-table",{staticClass:"common-table",attrs:{data:t.installedPackages}},[e("el-table-column",{attrs:{label:t.$t("Package"),sortable:"","sort-by":"name"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("code",[t._v(t._s(a.row.name))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Version")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("code",[t._v(t._s(a.row.version))])]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Built-in"),align:"center",sortable:"","sort-by":"isBuiltin",width:"100"},scopedSlots:t._u([{key:"default",fn:function(a){return[a.row.isBuiltin?e("span",{staticClass:"text-good"},[t._v(t._s(t.$t("Yes")))]):t._e()]}}])})],1)],1)],1)],1)},r=[],i=(a("a4d3"),a("e01a"),a("d3b7"),a("d28b"),a("3ca3"),a("ddb0"),a("d9e2"),a("06c5"));function s(t,e){var a="undefined"!==typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!a){if(Array.isArray(t)||(a=Object(i["a"])(t))||e&&t&&"number"===typeof t.length){a&&(t=a);var n=0,r=function(){};return{s:r,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:r}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,o=!0,l=!1;return{s:function(){a=a.call(t)},n:function(){var t=a.next();return o=t.done,t},e:function(t){l=!0,s=t},f:function(){try{o||null==a["return"]||a["return"]()}finally{if(l)throw s}}}}var o=a("c7eb"),l=a("1da1"),c=(a("99af"),a("ac1f"),a("1276"),a("498a"),a("a434"),a("a15b"),{name:"PIPTool",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(l["a"])(Object(o["a"])().mark((function t(){return Object(o["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(t){var e=this;return Object(l["a"])(Object(o["a"])().mark((function a(){var n;return Object(o["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:return t=t||{},a.next=3,e.T.callAPI_get("/api/v1/python-packages/installed");case 3:if(n=a.sent,n&&n.ok){a.next=6;break}return a.abrupt("return");case 6:e.installedPackages=n.data,t.isReload||(e.pypiMirror=e.C.PIP_MIRROR_DEFAULT.value),e.$store.commit("updateLoadStatus",!0);case 9:case"end":return a.stop()}}),a)})))()},installPackage:function(){var t=this;return Object(l["a"])(Object(o["a"])().mark((function e(){var a,n,r,i,l,c;return Object(o["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/python-packages/install-status");case 2:if(a=e.sent,a&&a.ok){e.next=5;break}return e.abrupt("return");case 5:if(!a.data||"RUNNING"!==a.data.status){e.next=10;break}return e.next=8,t.T.confirm("".concat(t.$t("Previous installing may still running"),'\n              <hr class="br">').concat(t.$t("Are you sure you want to install the package now?")));case 8:if(e.sent){e.next=10;break}return e.abrupt("return");case 10:t.isInstalling=!0,n=t.packageToInstall.trim().split(/\s+/),r=t.T.jsonCopy(n),i=s(n),e.prev=14,i.s();case 16:if((l=i.n()).done){e.next=25;break}return c=l.value,e.next=20,t.T.callAPI("post","/api/v1/python-packages/install",{body:{mirror:t.pypiMirror,pkg:c},alert:{okMessage:t.$t("Package installed: {pkg}",{pkg:c})}});case 20:a=e.sent,a.ok&&r.splice(r.indexOf(c),1),t.packageToInstall=r.join(" ");case 23:e.next=16;break;case 25:e.next=30;break;case 27:e.prev=27,e.t0=e["catch"](14),i.e(e.t0);case 30:return e.prev=30,i.f(),e.finish(30);case 33:t.isInstalling=!1,t.loadData({isReload:!0});case 35:case"end":return e.stop()}}),e,null,[[14,27,30,33]])})))()}},computed:{pipShell:function(){if(!this.isInstallable)return null;var t=this.$store.getters.CONFIG("_HOSTNAME")||this.$t("{Any container ID}"),e="-t ".concat(this.$store.getters.CONFIG("_PIP_INSTALL_DIR")),a=this.pypiMirror?"-i ".concat(this.pypiMirror):"",n="sudo docker exec ".concat(t," pip install ").concat(e," ").concat(a," ").concat(this.packageToInstall.trim());return n},isInstallable:function(){if(this.T.isNothing(this.packageToInstall))return!1;var t,e=s(this.packageToInstall.trim().split(/\s+/));try{for(e.s();!(t=e.n()).done;){var a=t.value,n=a.split("==");if(n.length>2)return!1;if(this.T.isNothing(n[0]))return!1;if(n.length>1&&this.T.isNothing(n[1]))return!1}}catch(r){e.e(r)}finally{e.f()}return!0}},props:{},data:function(){return{pypiMirror:"",packageToInstall:"",queriedPackageMap:{},installedPackages:[],isInstalling:!1}},mounted:function(){var t=this.$route.query.requirements;t&&(this.packageToInstall=this.T.fromBase64(t))}}),u=c,p=(a("833f"),a("2877")),f=a("f47c"),d=Object(p["a"])(u,n,r,!1,null,"6effa836",null);"function"===typeof f["default"]&&Object(f["default"])(d);e["default"]=d.exports},f47c:function(t,e,a){"use strict";var n=a("3b3a"),r=a.n(n);e["default"]=r.a}}]);