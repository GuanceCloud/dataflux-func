(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-09154b5f"],{"03fb":function(t,e,i){"use strict";i("aa55")},"0d62":function(t,e,i){"use strict";i.r(e);var r=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("transition",{attrs:{name:"fade"}},[i("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}]},[i("el-header",{staticClass:"code-viewer",staticStyle:{height:"unset !important"}},[i("div",{staticClass:"code-viewer-action-left"},[i("code",{staticClass:"code-viewer-action-title"},[i("i",{staticClass:"fa fa-file-code-o"}),t._v("\n          "+t._s(t.data.id)+"\n          "),i("el-tooltip",{attrs:{content:t.$t("Script Setup"),placement:"bottom",enterable:!1}},[i("el-button",{attrs:{type:"text"},on:{click:function(e){return e.stopPropagation(),t.$router.push({name:"script-setup",params:{id:t.data.id}})}}},[t.isLockedByOther?i("i",{staticClass:"fa fa-fw fa-search"}):i("i",{staticClass:"fa fa-fw fa-wrench"})])],1)],1)]),t._v(" "),i("div",{staticClass:"code-viewer-action-breaker hidden-lg-and-up"}),t._v(" "),i("div",{staticClass:"code-viewer-action-right"},[i("el-form",{attrs:{inline:!0}},[i("el-form-item",{directives:[{name:"show",rawName:"v-show",value:t.conflictStatus,expression:"conflictStatus"}]},["otherTab"===t.conflictStatus?i("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Script is under editing mode in other browser tab, please wait...")))]):"otherClient"===t.conflictStatus?i("span",{staticClass:"text-bad"},[t._v(t._s(t.$t("Script is under editing mode in other client, please wait...")))]):t._e(),t._v("\n            　\n            　\n          ")]),t._v(" "),t.conflictStatus?t._e():i("el-form-item",[i("el-tooltip",{attrs:{placement:"bottom",enterable:!1}},[i("div",{attrs:{slot:"content"},slot:"content"},[t._v("\n                "+t._s(t.$t("Shortcut"))+t._s(t.$t(":"))+" "),i("code",[t._v(t._s(t.T.getSuperKeyName())+" + E")])]),t._v(" "),i("el-button",{attrs:{type:"primary",plain:"",size:"mini"},on:{click:t.startEdit}},[i("i",{staticClass:"fa fa-fw",class:[t.C.CODE_VIEWR_USER_OPERATION_MAP.get(t.userOperation).icon]}),t._v(" "+t._s(t.C.CODE_VIEWR_USER_OPERATION_MAP.get(t.userOperation).name))])],1)],1),t._v(" "),i("el-form-item",[i("el-select",{staticStyle:{width:"150px"},attrs:{size:"mini",filterable:"",placeholder:t.$t("Select Func")},model:{value:t.selectedFuncId,callback:function(e){t.selectedFuncId=e},expression:"selectedFuncId"}},t._l(t.draftFuncs,(function(t){return i("el-option",{key:t.id,attrs:{label:t.name,value:t.id}})})),1)],1),t._v(" "),t.isLockedByOther?t._e():i("el-form-item",[i("el-radio-group",{attrs:{size:"mini"},model:{value:t.showMode,callback:function(e){t.showMode=e},expression:"showMode"}},t._l(t.C.CODE_VIEWER_SHOW_MODE,(function(e,r){return i("el-tooltip",{key:e.key,attrs:{placement:"bottom",enterable:!1}},[i("div",{attrs:{slot:"content"},slot:"content"},[t._v("\n                  "+t._s(t.$t("Shortcut"))+t._s(t.$t(":"))+" "),i("code",[t._v(t._s(t.T.getSuperKeyName())+" + "+t._s(r+1))])]),t._v(" "),i("el-radio-button",{attrs:{label:e.key}},[t._v(t._s(e.name))])],1)})),1)],1),t._v(" "),t.isLockedByOther?t._e():i("el-form-item",[i("el-tooltip",{attrs:{content:t.$t("Download"),placement:"bottom",enterable:!1}},[i("el-button",{attrs:{plain:"",size:"mini"},on:{click:t.download}},[t._v(t._s(t.$t("Download {type}",{type:t.C.CODE_VIEWER_SHOW_MODE_MAP.get(t.showMode).name})))])],1)],1)],1)],1),t._v(" "),t.scriptSet.isBuiltin?i("InfoBlock",{attrs:{type:"warning",title:t.$t("This is a builtin Script, code will be reset when the system restarts")}}):t.isLockedByOther?i("InfoBlock",{attrs:{type:"error",title:t.$t("This Script has been locked by other, editing is disabled")}}):i("InfoBlock",{attrs:{type:"warning",title:t.$t("Currently in view mode, click Edit button to enter edit mode")}})],1),t._v(" "),i("el-main",{style:t.$store.getters.codeMirrorSetting.style,attrs:{id:"editorContainer_CodeViewer"}},[i("textarea",{attrs:{id:"editor_CodeViewer"}}),t._v(" "),i("h1",{attrs:{id:"viewModeHint"}},[t._v(t._s(t.$t("View Mode")))])])],1)],1)},o=[],n=i("1da1"),s=(i("130f"),i("99af"),i("a630"),i("3ca3"),i("ac1f"),i("a1f0"),i("d3b7"),i("1276"),i("5319"),i("498a"),i("159b"),i("96cf"),i("bf68")),a=i("21a6"),d=i.n(a),c={name:"CodeViewer",components:{},watch:{$route:{immediate:!0,handler:function(t,e){var i=this;return Object(n["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,i.loadData();case 2:case"end":return t.stop()}}),t)})))()}},showMode:function(t){this.loadData()},selectedFuncId:function(t){this.$store.commit("updateEditor_highlightedFuncId",t),this.highlightFunc(t)},highlightedFuncId:function(t){this.selectedFuncId=t},codeMirrorTheme:function(t){this.codeMirror.setOption("theme",t)},"$store.state.shortcutAction":function(t){switch(t.action){case"codeViewer.showDraft":this.showMode="draft";break;case"codeViewer.showPublished":this.showMode="published";break;case"codeViewer.showDiff":this.showMode="diff";break;case"codeViewer.enterEditor":this.conflictStatus||this.startEdit();break}}},methods:{loadData:function(){var t=this;return Object(n["a"])(regeneratorRuntime.mark((function e(){var i,r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI_get("/api/v1/scripts/:id/do/get",{params:{id:t.$route.params.id}});case 2:if(i=e.sent,i.ok){e.next=6;break}return t.$router.push({name:"intro"}),e.abrupt("return");case 6:return t.data=i.data,r=t.T.getDiffInfo(t.data.code,t.data.codeDraft),t.diffAddedCount=r.addedCount,t.diffRemovedCount=r.removedCount,e.next=13,t.T.callAPI_getOne("/api/v1/script-sets/do/list",t.scriptSetId);case 13:if(i=e.sent,i.ok){e.next=16;break}return e.abrupt("return");case 16:t.scriptSet=i.data,t.$store.commit("updateLoadStatus",!0),setImmediate((function(){switch(t.codeMirror.setValue(""),t.showMode){case"draft":case"published":var e=t.C.CODE_VIEWER_SHOW_MODE_MAP.get(t.showMode).codeField;t.codeMirror.setValue(t.data[e]||""),t.T.setCodeMirrorMode(t.codeMirror,"python");break;case"diff":var i=t.data.title?" (".concat(t.data.title,")"):"",r="".concat(t.scriptId).concat(i),o=t.data.code||"",n=t.data.codeDraft||"",a=t.$t("Published Code"),d=t.$t("Saved Draft Code"),c=Object(s["createPatch"])(r,o,n,a,d);t.codeMirror.setValue(c),t.T.setCodeMirrorMode(t.codeMirror,"diff");break}t.codeMirror.refresh(),t.updateFuncList(),t.selectedFuncId=t.highlightedFuncId,t.$store.commit("updateCodeViewer_isCodeLoaded",!0)}));case 19:case"end":return e.stop()}}),e)})))()},startEdit:function(){this.$router.push({name:"code-editor",params:{id:this.data.id}})},updateFuncList:function(){var t=this;if(this.data.codeDraft){var e=/^def ([a-zA-Z][a-zA-Z0-9_]+)\((.*)\)\:/gm,i=Array.from(this.data.codeDraft.matchAll(e),(function(e){var i=e[1],r="".concat(t.scriptId,".").concat(i),o=e[2].replace(/\n/g," ").split(",").reduce((function(t,e){var i=e.trim().split("=")[0];return i&&(t[i]="".concat(i.toUpperCase())),t}),{});return{id:r,name:i,kwargs:o}})),r=[],o={};i.forEach((function(t){o[t.id]||(r.push(t),o[t.id]=!0)})),this.draftFuncs=r}},_clearLineHighlight:function(t){try{this.codeMirror.removeLineClass(t,"text"),this.codeMirror.removeLineClass(t,"background"),this.codeMirror.removeLineClass(t,"wrap");var e=this.codeMirror.lineInfo(t).widgets;Array.isArray(e)&&e.forEach((function(t){t.clear()}))}catch(i){}},_setLineHighlight:function(t){if(!this.codeMirror)return null;t=t||{};var e=t.line+(t.scroll||0);if(e=Math.min(Math.max(e,0),this.codeMirror.lineCount()-1),"next"===t.marginType?(this.codeMirror.setCursor({line:this.codeMirror.lineCount()-1}),this.codeMirror.setCursor({line:e})):"prev"===t.marginType&&(this.codeMirror.setCursor({line:0}),this.codeMirror.setCursor({line:e})),this.codeMirror.setCursor({line:t.line}),t.textClass&&this.codeMirror.addLineClass(t.line,"text",t.textClass),t.backgroundClass&&this.codeMirror.addLineClass(t.line,"background",t.backgroundClass),t.wrapClass&&this.codeMirror.addLineClass(t.line,"wrap",t.wrapClass),t.lineWidgetConfig){var i=t.lineWidgetConfig,r=null;switch(i.type){}r&&this.codeMirror.addLineWidget(t.line,r)}return this.codeMirror.lineInfo(t.line)},updateHighlightLineConfig:function(t,e){var i=this.T.jsonCopy(this.$store.state.codeViewer_highlightedLineConfigMap)||{};if(null===e?i[this.scriptId]&&delete i[this.scriptId][t]:(i[this.scriptId]||(i[this.scriptId]={}),i[this.scriptId][t]=e),this.codeMirror){for(var r in this.highlightedLineInfoMap)if(this.highlightedLineInfoMap.hasOwnProperty(r)){var o=this.highlightedLineInfoMap[r];for(var n in o)if(o.hasOwnProperty(n)){var s=o[n];this._clearLineHighlight(s.handle.lineNo())}}var a={},d=i[this.scriptId]||{};for(var c in d)if(d.hasOwnProperty(c)){var l=d[c],h=this._setLineHighlight(l);h&&(a[this.scriptId]||(a[this.scriptId]={}),a[this.scriptId][c]=h)}this.highlightedLineInfoMap=a,this.$store.commit("updateCodeViewer_highlightedLineConfigMap",i)}},highlightFunc:function(t){if(this.codeMirror&&t){var e=t.split(".")[1];this.updateHighlightLineConfig("selectedFuncLine",null);var i="def ".concat(e,"("),r=this.codeMirror.getSearchCursor(i);if(r.findNext()){var o=r.from().line;this.updateHighlightLineConfig("selectedFuncLine",{line:o,marginType:"next",scroll:-1,textClass:"highlight-text",backgroundClass:"current-func-background highlight-code-line-blink"})}}},download:function(){var t=new Blob([this.codeMirror.getValue()],{type:"text/plain"}),e=null;switch(this.showMode){case"draft":e=this.data.id+".draft.py";break;case"published":e=this.data.id+".py";break;case"diff":e=this.data.id+".py.diff";break}d.a.saveAs(t,e)}},computed:{codeMirrorTheme:function(){return this.T.getCodeMirrorThemeName()},scriptId:function(){return this.$route.params.id},scriptSetId:function(){return this.scriptId.split("__")[0]},conflictStatus:function(){return this.$store.getters.getConflictStatus(this.$route)},isLockedByOther:function(){return this.data.lockedByUserId&&this.data.lockedByUserId!==this.$store.getters.userId||this.scriptSet.lockedByUserId&&this.scriptSet.lockedByUserId!==this.$store.getters.userId},userOperation:function(){return this.isLockedByOther?"debug":"edit"},highlightedFuncId:function(){return this.$store.state.Editor_highlightedFuncId},codeLines:function(){return(this.data.code||"").split("\n").length},codeDraftLines:function(){return(this.data.codeDraft||"").split("\n").length}},props:{},data:function(){return{codeMirror:null,highlightedLineInfoMap:{},data:{},scriptSet:{},draftFuncs:[],selectedFuncId:"",showMode:"draft",diffAddedCount:0,diffRemovedCount:0}},mounted:function(){var t=this;setImmediate((function(){t.codeMirror=t.T.initCodeMirror("editor_CodeViewer"),t.codeMirror.setOption("theme",t.codeMirrorTheme),t.T.setCodeMirrorReadOnly(t.codeMirror,!0)}))},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},l=c,h=(i("7a1b"),i("03fb"),i("2877")),u=i("7f09"),f=i("2383"),p=Object(h["a"])(l,r,o,!1,null,"49c10c9a",null);"function"===typeof u["default"]&&Object(u["default"])(p),"function"===typeof f["default"]&&Object(f["default"])(p);e["default"]=p.exports},"21a6":function(t,e,i){t.exports=i("407a")(1579)},2383:function(t,e,i){"use strict";var r=i("25c2"),o=i.n(r);e["default"]=o.a},"25c2":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Script Setup":"脚本设置","Script is under editing mode in other browser tab, please wait...":"其他标签页或窗口正在编辑此脚本，请稍后...","Script is under editing mode in other client, please wait...":"其他客户端正在编辑此脚本，请稍后...","Shortcut":"快捷键","Select Func":"选择聚焦函数","Download {type}":"下载{type}","Setup Code Editor":"调整编辑器显示样式","This is a builtin Script, code will be reset when the system restarts":"这是一个内置脚本，代码会在系统重启后复位","This Script has been locked by other, editing is disabled":"当前脚本被其他用户锁定，无法修改","Currently in view mode, click Edit button to enter edit mode":"当前为查看模式，点击「编辑」按钮进入编辑模式","View Mode":"查看模式","Published Code":"已发布的代码","Saved Draft Code":"已保存的草稿代码"}}'),delete t.options._Ctor}},"64e9":function(t,e,i){},"7a1b":function(t,e,i){"use strict";i("64e9")},"7e33":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"codeLines":"{n} line | {n} lines"}}'),delete t.options._Ctor}},"7f09":function(t,e,i){"use strict";var r=i("7e33"),o=i.n(r);e["default"]=o.a},a1f0:function(t,e,i){t.exports=i("7ab4")(549)},a630:function(t,e,i){t.exports=i("7ab4")(1153)},aa55:function(t,e,i){}}]);