(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-daf2476a"],{"14ce":function(e,t,a){"use strict";a.r(t);var n=function(){var e=this,t=e._self._c;return t("el-container",{attrs:{direction:"horizontal"}},[t("el-aside",{attrs:{width:"auto"}},[t("div",{staticClass:"aside"},[t("div",{staticClass:"aside-content"},[t("el-menu",{attrs:{mode:"vertical","unique-opened":!0,"default-active":e.$route.path},on:{select:e.onNaviMenuSelect}},[t("el-menu-item",{attrs:{index:"/management/overview"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-dashboard"}),e._v("\n              "+e._s(e.$t("Overview"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/about"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-info-circle"}),e._v("\n              "+e._s(e.$t("About"))+"\n            ")])]),e._v(" "),e.$store.getters.isAdmin?t("el-menu-item",{attrs:{index:"/management/system-setting"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cog"}),e._v("\n              "+e._s(e.$t("System Setting"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isAdmin?t("el-menu-item",{attrs:{index:"/management/user-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-users"}),e._v("\n              "+e._s(e.$t("User Manage"))+"\n            ")])]):e._e(),e._v(" "),t("el-menu-item",{attrs:{index:"/management/api-auth-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-lock"}),e._v("\n              "+e._s(e.$t("API Auth"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/auth-link-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-link"}),e._v("\n              "+e._s(e.$t("Auth Link"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/crontab-config-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-clock-o"}),e._v("\n              "+e._s(e.$t("Crontab Config"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/batch-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-tasks"}),e._v("\n              "+e._s(e.$t("Batch"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-set-export"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cloud-download"}),e._v("\n              "+e._s(e.$t("Script Set Export"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-set-import"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cloud-upload"}),e._v("\n              "+e._s(e.$t("Script Sets Import"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-recover-point-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-history"}),e._v("\n              "+e._s(e.$t("Script Lib Recover"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/operation-record-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-keyboard-o"}),e._v("\n              "+e._s(e.$t("Operation Records"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/indent-menus"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-flask"}),e._v("\n              "+e._s(e.$t("Experimental Features"))+"\n            ")])]),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("PIPTool")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/pip-tool"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cubes"}),e._v("\n              "+e._s(e.$t("PIP Tool"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FileManage")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/file-manage"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-file"}),e._v("\n              "+e._s(e.$t("File Manage"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FileService")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/file-service-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-folder-open"}),e._v("\n              "+e._s(e.$t("File Service"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncCacheManage")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/func-cache-manage"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-dot-circle-o"}),e._v("\n              "+e._s(e.$t("Func Cache Manage"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncStoreManage")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/func-store-manage"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-database"}),e._v("\n              "+e._s(e.$t("Func Store Manage"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncDoc")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"".concat(e.T.getBaseURL(),"/#/func-doc")}},[t("span",[t("i",{staticClass:"fa fa-fw fa-book"}),e._v("\n              "+e._s(e.$t("Func Docs"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncDoc")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"".concat(e.T.getBaseURL(),"/#/auth-link-func-doc")}},[t("span",[t("i",{staticClass:"fa fa-fw fa-link"}),e._v("\n              "+e._s(e.$t("Auth Link Doc"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("OpenAPIDoc")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"".concat(e.T.getBaseURL(),"/doc")}},[t("span",[t("i",{staticClass:"fa fa-fw fa-book"}),e._v("\n              "+e._s(e.$t("Open API Doc"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isAdmin&&e.$store.getters.isExperimentalFeatureEnabled("AccessKeys")?t("el-menu-item",{staticClass:"indent-menu",attrs:{index:"/management/access-key-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-key"}),e._v("\n              "+e._s(e.$t("Access Keys"))+"\n            ")])]):e._e()],1)],1)])]),e._v(" "),t("router-view")],1)},s=[],i=(a("2ca0"),a("14d9"),{name:"Management",components:{},watch:{},methods:{onNaviMenuSelect:function(e){e&&(this.T.startsWith(e,"/")?this.$router.push({path:e}):this.T.openURL(e))}},computed:{},props:{},data:function(){return{}},created:function(){}}),r=i,c=(a("6e62"),a("2877")),l=Object(c["a"])(r,n,s,!1,null,"0565731f",null);t["default"]=l.exports},"1b52":function(e,t,a){},"6e62":function(e,t,a){"use strict";a("1b52")}}]);