(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0231f91a"],{"09a6":function(e,t,a){"use strict";a("222f")},"14ce":function(e,t,a){"use strict";a.r(t);var s=function(){var e=this,t=e._self._c;return t("el-container",{attrs:{direction:"horizontal"}},[t("el-aside",{attrs:{width:"200px"}},[t("div",{staticClass:"aside"},[t("div",{staticClass:"aside-content"},[t("el-menu",{attrs:{mode:"vertical","unique-opened":!0,"default-active":e.$route.path},on:{select:e.onNaviMenuSelect}},[t("el-menu-item",{attrs:{index:"/management/overview"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-dashboard"}),e._v("\n              "+e._s(e.$t("Overview"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/about"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-info-circle"}),e._v("\n              "+e._s(e.$t("About"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/api-auth-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-lock"}),e._v("\n              "+e._s(e.$t("API Auth"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/auth-link-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-link"}),e._v("\n              "+e._s(e.$t("Auth Link"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/crontab-config-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-clock-o"}),e._v("\n              "+e._s(e.$t("Crontab Config"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/batch-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-tasks"}),e._v("\n              "+e._s(e.$t("Batch"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-set-export"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cloud-download"}),e._v("\n              "+e._s(e.$t("Export Script Sets"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-set-import"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cloud-upload"}),e._v("\n              "+e._s(e.$t("Import Script Sets"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/script-recover-point-add"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-history"}),e._v("\n              "+e._s(e.$t("Recover Script Lib"))+"\n            ")])]),e._v(" "),e.$store.getters.isAdmin?t("el-menu-item",{attrs:{index:"/management/user-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-users"}),e._v("\n              "+e._s(e.$t("User Manager"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isAdmin?t("el-menu-item",{attrs:{index:"/management/system-config"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cog"}),e._v("\n              "+e._s(e.$t("System Config"))+"\n            ")])]):e._e(),e._v(" "),t("el-menu-item",{attrs:{index:"/management/operation-record-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-keyboard-o"}),e._v("\n              "+e._s(e.$t("Access Log"))+"\n            ")])]),e._v(" "),t("el-menu-item",{attrs:{index:"/management/experimental-features"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-flask"}),e._v("\n              "+e._s(e.$t("Experimental"))+"\n            ")])]),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("PIPTool")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/pip-tool"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-cubes"}),e._v("\n              "+e._s(e.$t("PIP Tool"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FileManager")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/file-manager"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-file"}),e._v("\n              "+e._s(e.$t("File Manager"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FileService")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/file-service-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-folder-open"}),e._v("\n              "+e._s(e.$t("File Service"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncCacheManager")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/func-cache-manager"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-dot-circle-o"}),e._v("\n              "+e._s(e.$t("Func Cache Manager"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncStoreManager")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/func-store-manager"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-database"}),e._v("\n              "+e._s(e.$t("Func Store Manager"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncDoc")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"".concat(e.T.getBaseURL(),"/#/func-doc")}},[t("span",[t("i",{staticClass:"fa fa-fw fa-book"}),e._v("\n              "+e._s(e.$t("Func Doc"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("FuncDoc")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"".concat(e.T.getBaseURL(),"/#/auth-link-func-doc")}},[t("span",[t("i",{staticClass:"fa fa-fw fa-link"}),e._v("\n              "+e._s(e.$t("Auth Link Doc"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("SysStat")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/sys-stats"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-line-chart"}),e._v("\n              "+e._s(e.$t("System Metric"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("SystemLogs")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/system-logs"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-file-text-o"}),e._v("\n              "+e._s(e.$t("System Logs"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isExperimentalFeatureEnabled("AbnormalReqs")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/abnormal-request-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-exclamation-triangle"}),e._v("\n              "+e._s(e.$t("Abnormal Reqs"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.CONFIG("_INTERNAL_KEEP_SCRIPT_LOG")&&e.$store.getters.isExperimentalFeatureEnabled("ScriptLog")?t("el-menu-item",{attrs:{index:"/management/script-log-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-terminal"}),e._v("\n              "+e._s(e.$t("Script Log"))+"\n              "),t("i",{staticClass:"fa fa-fw fa-flask"})])]):e._e(),e._v(" "),e.$store.getters.CONFIG("_INTERNAL_KEEP_SCRIPT_FAILURE")&&e.$store.getters.isExperimentalFeatureEnabled("ScriptFailure")?t("el-menu-item",{attrs:{index:"/management/script-failure-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-bug"}),e._v("\n              "+e._s(e.$t("Script Failure"))+"\n              "),t("i",{staticClass:"fa fa-fw fa-flask"})])]):e._e(),e._v(" "),e.$store.getters.isAdmin&&e.$store.getters.isExperimentalFeatureEnabled("AccessKey")?t("el-menu-item",{staticClass:"experimental-feature",attrs:{index:"/management/access-key-list"}},[t("span",[t("i",{staticClass:"fa fa-fw fa-key"}),e._v("\n              "+e._s(e.$t("Access Key"))+"\n            ")])]):e._e()],1)],1)])]),e._v(" "),t("router-view")],1)},n=[],i=(a("2ca0"),{name:"Management",components:{},watch:{},methods:{onNaviMenuSelect:function(e){e&&(this.T.startsWith(e,"/")?this.$router.push({path:e}):window.open(e))}},computed:{},props:{},data:function(){return{}},created:function(){}}),r=i,l=(a("09a6"),a("2877")),f=Object(l["a"])(r,s,n,!1,null,"2a50dae2",null);t["default"]=f.exports},"222f":function(e,t,a){}}]);