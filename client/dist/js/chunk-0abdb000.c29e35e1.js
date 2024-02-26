(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0abdb000"],{"284f":function(e,t,o){"use strict";o("875f")},"3ac4":function(e,t,o){"use strict";o.r(t);var i=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("h1",[e._v("\n        "+e._s(e.$t("Clear Cache"))+"\n      ")])]),e._v(" "),t("el-main",[t("el-row",{attrs:{gutter:20}},[t("el-col",{attrs:{span:15}},[t("div",{staticClass:"setup-form"},[t("el-form",{ref:"form",attrs:{model:e.form,"label-width":"0px"}},[t("el-form-item",[t("InfoBlock",{attrs:{type:"info",title:e.$t("If you got trouble with UI or Code Editor, please try to clear cache")}})],1),e._v(" "),t("el-form-item",[t("el-checkbox",{model:{value:e.form.clear_codeMirrorSettings,callback:function(t){e.$set(e.form,"clear_codeMirrorSettings",t)},expression:"form.clear_codeMirrorSettings"}},[t("strong",[e._v(e._s(e.$t("Code Editor Setting")))])]),e._v(" "),t("div",{staticClass:"text-small form-item-tip"},[e._v(e._s(e.$t("Including"))+e._s(e.$t(":"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Selected UI theme"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Font size, line height"))+"\n                ")])],1),e._v(" "),t("el-form-item",[t("el-checkbox",{model:{value:e.form.clear_UIStatus,callback:function(t){e.$set(e.form,"clear_UIStatus",t)},expression:"form.clear_UIStatus"}},[t("strong",[e._v(e._s(e.$t("UI Status")))])]),e._v(" "),t("div",{staticClass:"text-small form-item-tip"},[e._v(e._s(e.$t("Including"))+e._s(e.$t(":"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Expanded items in Code Editor Aside"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Position of Aside separator, output box"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Position of Simple Debug Panel"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Position of Quick View Panel"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Selected Func, Highlighted line or error line"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Position of scroll in Management"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Notice messages or dialogs"))+"\n                  "),t("br"),e._v(" "+e._s(e.$t("Search history"))+"\n                ")])],1),e._v(" "),t("el-form-item",[t("el-checkbox",{model:{value:e.form.clear_systemInfo,callback:function(t){e.$set(e.form,"clear_systemInfo",t)},expression:"form.clear_systemInfo"}},[t("strong",[e._v(e._s(e.$t("System Info loaded from server")))])]),e._v(" "),t("div",{staticClass:"text-small form-item-tip"},[e._v(e._s(e.$t("Page will refresh after clearing this content")))])],1),e._v(" "),t("el-form-item",[t("el-button",{staticClass:"clear-cache-button",attrs:{tabindex:"5",type:"primary"},on:{click:e.clearCache}},[e._v(e._s(e.$t("Clear")))])],1)],1)],1)]),e._v(" "),t("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},r=[],n=o("c7eb"),s=o("1da1"),a={name:"ClearCache",components:{},watch:{},methods:{clearCache:function(){var e=this;return Object(s["a"])(Object(n["a"])().mark((function t(){var o;return Object(n["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:e.form.clear_codeMirrorSettings&&e.$store.commit("updateCodeMirrorSettings",null),e.form.clear_UIStatus&&(e.$store.commit("updateAsideScript_expandedNodeMap",null),e.$store.commit("updateAsideScript_quickViewWindowPosition",null),e.$store.commit("updateAsideConnector_simpleDebugWindowPosition",null),e.$store.commit("updateCodeEditor_splitPanePercent",null),e.$store.commit("updateCodeEditor_highlightedLineConfigMap",null),e.$store.commit("updateCodeViewer_highlightedLineConfigMap",null),e.$store.commit("updateEditor_selectedItemId",null),e.$store.commit("updateEditor_splitPanePercent",null),e.$store.commit("updateTableList_scrollY",null),e.$store.commit("resetFeatureNotice"),e.$store.commit("clearFuzzySearchHistory")),o=e.$t("Cache is cleared"),e.form.clear_systemInfo&&(o+='<br><span class="text-bad">'.concat(e.$t("Page will be refreshed, and config will reload from server"),"</span>")),e.T.notify(o),e.form.clear_systemInfo&&setTimeout((function(){location.reload()}),3e3);case 6:case"end":return t.stop()}}),t)})))()}},computed:{},props:{},data:function(){return{form:{clear_UIStatus:!0,clear_codeMirrorSettings:!0,clear_systemInfo:!1}}},created:function(){this.$store.commit("updateLoadStatus",!0)}},l=a,c=(o("284f"),o("2877")),d=o("c0ff"),f=o("3c97"),u=o("3c8e"),m=Object(c["a"])(l,i,r,!1,null,null,null);"function"===typeof d["default"]&&Object(d["default"])(m),"function"===typeof f["default"]&&Object(f["default"])(m),"function"===typeof u["default"]&&Object(u["default"])(m);t["default"]=m.exports},"3c8e":function(e,t,o){"use strict";var i=o("4517"),r=o.n(i);t["default"]=r.a},"3c97":function(e,t,o){"use strict";var i=o("cf94"),r=o.n(i);t["default"]=r.a},4517:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Cache is cleared":"快取已清除","Clear":"清除","Clear Cache":"清除快取","Code Editor Setting":"程式碼編輯器配置","Expanded items in Code Editor Aside":"編輯器側欄中當前已展開的欄目","Font size, line height":"文字大小、行距","If you got trouble with UI or Code Editor, please try to clear cache":"如果介面、程式碼編輯器等存在問題，可嘗試清除快取來解決","Including":"包括","Notice messages or dialogs":"提示資訊及對話方塊","Page will be refreshed, and config will reload from server":"即將重新整理頁面，並從伺服器重新載入系統配置","Page will refresh after clearing this content":"清除本專案會重新整理頁面","Position of Aside separator, output box":"編輯器當前拖動的的編輯器側欄、指令碼輸出欄位置","Position of Quick View Panel":"快速檢視面板當前位置","Position of Simple Debug Panel":"簡易除錯面板當前位置","Position of scroll in Management":"管理介面列表當前滾動所處位置","Search history":"搜尋歷史","Selected Func, Highlighted line or error line":"編輯器當前選擇的函式、高亮已選擇函式所在行、高亮錯誤行","Selected UI theme":"已選擇的主題","System Info loaded from server":"從伺服器載入的系統資訊","UI Status":"頁面狀態"}}'),delete e.options._Ctor}},"6e48":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Clear Cache":"清除缓存","If you got trouble with UI or Code Editor, please try to clear cache":"如果界面、代码编辑器等存在问题，可尝试清除缓存来解决","Code Editor Setting":"代码编辑器配置","Including":"包括","Selected UI theme":"已选择的主题","Font size, line height":"文字大小、行距","UI Status":"页面状态","Expanded items in Code Editor Aside":"编辑器侧栏中当前已展开的栏目","Position of Aside separator, output box":"编辑器当前拖动的的编辑器侧栏、脚本输出栏位置","Position of Simple Debug Panel":"简易调试面板当前位置","Position of Quick View Panel":"快速查看面板当前位置","Selected Func, Highlighted line or error line":"编辑器当前选择的函数、高亮已选择函数所在行、高亮错误行","Position of scroll in Management":"管理界面列表当前滚动所处位置","Notice messages or dialogs":"提示信息及对话框","Search history":"搜索历史","System Info loaded from server":"从服务器加载的系统信息","Page will refresh after clearing this content":"清除本项目会刷新页面","Clear":"清除","Cache is cleared":"缓存已清除","Page will be refreshed, and config will reload from server":"即将刷新页面，并从服务器重新加载系统配置"}}'),delete e.options._Ctor}},"875f":function(e,t,o){},c0ff:function(e,t,o){"use strict";var i=o("6e48"),r=o.n(i);t["default"]=r.a},cf94:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Cache is cleared":"緩存已清除","Clear":"清除","Clear Cache":"清除緩存","Code Editor Setting":"代碼編輯器配置","Expanded items in Code Editor Aside":"編輯器側欄中當前已展開的欄目","Font size, line height":"文字大小、行距","If you got trouble with UI or Code Editor, please try to clear cache":"如果界面、代碼編輯器等存在問題，可嘗試清除緩存來解決","Including":"包括","Notice messages or dialogs":"提示信息及對話框","Page will be refreshed, and config will reload from server":"即將刷新頁面，並從服務器重新加載系統配置","Page will refresh after clearing this content":"清除本項目會刷新頁面","Position of Aside separator, output box":"編輯器當前拖動的的編輯器側欄、腳本輸出欄位置","Position of Quick View Panel":"快速查看面板當前位置","Position of Simple Debug Panel":"簡易調試面板當前位置","Position of scroll in Management":"管理界面列表當前滾動所處位置","Search history":"搜索歷史","Selected Func, Highlighted line or error line":"編輯器當前選擇的函數、高亮已選擇函數所在行、高亮錯誤行","Selected UI theme":"已選擇的主題","System Info loaded from server":"從服務器加載的系統信息","UI Status":"頁面狀態"}}'),delete e.options._Ctor}}}]);