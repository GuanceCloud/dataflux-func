(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-f731142c"],{"03fb":function(e,t,i){"use strict";i("aa55")},"0d62":function(e,t,i){"use strict";i.r(t);var o=function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("transition",{attrs:{name:"fade"}},[i("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}]},[i("el-header",{staticClass:"code-viewer",staticStyle:{height:"unset !important"}},[i("div",{staticClass:"code-viewer-action-left"},[i("code",{staticClass:"code-viewer-action-title"},[i("i",{staticClass:"fa fa-file-code-o"}),e._v("\n          "+e._s(e.data.id)+"\n          "),i("el-tooltip",{attrs:{content:e.$t("Script Setup"),placement:"bottom",enterable:!1}},[i("el-button",{attrs:{type:"text"},on:{click:function(t){return t.stopPropagation(),e.$router.push({name:"script-setup",params:{id:e.data.id}})}}},[i("i",{staticClass:"fa fa-fw fa-wrench"})])],1)],1)]),e._v(" "),i("div",{staticClass:"code-viewer-action-breaker hidden-lg-and-up"}),e._v(" "),i("div",{staticClass:"code-viewer-action-right"},[i("el-form",{attrs:{inline:!0}},[i("el-form-item",{directives:[{name:"show",rawName:"v-show",value:e.conflictStatus,expression:"conflictStatus"}]},["otherTab"===e.conflictStatus?i("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Script is under editing mode in other browser tab, please wait...")))]):"otherClient"===e.conflictStatus?i("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Script is under editing mode in other client, please wait...")))]):e._e(),e._v("\n            　\n            　\n          ")]),e._v(" "),e.conflictStatus?e._e():i("el-form-item",[i("el-tooltip",{attrs:{placement:"bottom",enterable:!1}},[i("div",{attrs:{slot:"content"},slot:"content"},[e._v("\n                "+e._s(e.$t("Shortcut"))+e._s(e.$t(":"))+" "),i("code",[e._v(e._s(e.T.getSuperKeyName())+" + E")])]),e._v(" "),i("el-button",{attrs:{type:"primary",plain:"",size:"mini"},on:{click:e.startEdit}},[i("i",{staticClass:"fa fa-fw",class:[e.C.CODE_VIEWR_USER_OPERATION_MAP.get(e.userOperation).icon]}),e._v(" "+e._s(e.C.CODE_VIEWR_USER_OPERATION_MAP.get(e.userOperation).name))])],1)],1),e._v(" "),i("el-form-item",[i("el-select",{staticStyle:{width:"150px"},attrs:{size:"mini",filterable:"",placeholder:e.$t("Select Item")},model:{value:e.selectedItemId,callback:function(t){e.selectedItemId=t},expression:"selectedItemId"}},e._l(e.selectableItems,(function(t){return i("el-option",{key:t.id,attrs:{label:t.name,value:t.id}},[i("el-tag",{staticClass:"quick-select-tag",attrs:{type:"info",size:"mini"}},[e._v(e._s(t.type))]),e._v("\n                "+e._s(t.name)+"\n              ")],1)})),1)],1),e._v(" "),i("el-form-item",[i("el-radio-group",{attrs:{size:"mini",plain:""},model:{value:e.showMode,callback:function(t){e.showMode=t},expression:"showMode"}},e._l(e.C.CODE_VIEWER_SHOW_MODE,(function(t,o){return i("el-tooltip",{key:t.key,attrs:{placement:"bottom",enterable:!1}},[i("div",{attrs:{slot:"content"},slot:"content"},[e._v("\n                  "+e._s(e.$t("Shortcut"))+e._s(e.$t(":"))+" "),i("code",[e._v(e._s(e.T.getSuperKeyName())+" + "+e._s(o+1))])]),e._v(" "),i("el-radio-button",{attrs:{label:t.key}},[e._v(e._s(t.name))])],1)})),1)],1),e._v(" "),i("el-form-item",[i("el-tooltip",{attrs:{content:e.$t("Download"),placement:"bottom",enterable:!1}},[i("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{plain:"",size:"mini"},on:{click:e.download}},[e._v(e._s(e.$t("Download {type}",{type:e.C.CODE_VIEWER_SHOW_MODE_MAP.get(e.showMode).name})))])],1)],1)],1)],1),e._v(" "),e.isLockedByOther?i("InfoBlock",{attrs:{type:e.isEditable?"warning":"error",title:e.$t("This Script is locked by other user({user})",{user:e.lockedByUser})}}):e.data.isBuiltin?i("InfoBlock",{attrs:{type:"warning",title:e.$t("This is a builtin Script, code will be reset when the system restarts")}}):i("InfoBlock",{attrs:{type:"warning",title:e.$t("Currently in view mode, click Edit button to enter edit mode")}})],1),e._v(" "),i("el-main",{style:e.$store.getters.codeMirrorSetting.style,attrs:{id:"editorContainer_CodeViewer"}},[i("textarea",{attrs:{id:"editor_CodeViewer"}}),e._v(" "),i("h1",{attrs:{id:"viewModeHint"}},[e._v(e._s(e.$t("View Mode")))])])],1)],1)},r=[],n=i("c7eb"),s=i("1da1"),a=(i("130f"),i("99af"),i("d3b7"),i("159b"),i("ac1f"),i("1276"),i("fb6a"),i("13d5"),i("498a"),i("bf68")),c=i("21a6"),d=i.n(c),l={name:"CodeViewer",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var i=this;return Object(s["a"])(Object(n["a"])().mark((function e(){return Object(n["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,i.loadData();case 2:case"end":return e.stop()}}),e)})))()}},showMode:function(e){this.loadData()},codeMirrorTheme:function(e){this.codeMirror.setOption("theme",e)},selectedItemId:function(e){this.$store.commit("updateEditor_selectedItemId",e),this.highlightQuickSelectItem()},"$store.state.Editor_selectedItemId":function(e){this.selectedItemId!==e&&(this.selectedItemId=e)},"$store.state.shortcutAction":function(e){switch(e.action){case"codeViewer.showDraft":this.showMode="draft";break;case"codeViewer.showPublished":this.showMode="published";break;case"codeViewer.showDiff":this.showMode="diff";break;case"codeViewer.enterEditor":this.conflictStatus||this.startEdit();break}},"$store.state.uiLocale":function(e){this.T.resetCodeMirrorPhrases(this.codeMirror)}},methods:{loadData:function(){var e=this;return Object(s["a"])(Object(n["a"])().mark((function t(){var i,o;return Object(n["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI_getOne("/api/v1/scripts/do/list",e.$route.params.id,{query:{_withCode:!0,_withCodeDraft:!0}});case 2:if(i=t.sent,i.ok){t.next=6;break}return e.$router.push({name:"intro"}),t.abrupt("return");case 6:e.data=i.data,o=e.T.getDiffInfo(e.data.code,e.data.codeDraft),e.diffAddedCount=o.addedCount,e.diffRemovedCount=o.removedCount,e.$store.commit("updateLoadStatus",!0),setImmediate((function(){switch(e.codeMirror.setValue(""),e.showMode){case"draft":case"published":var t=e.C.CODE_VIEWER_SHOW_MODE_MAP.get(e.showMode).codeField;e.codeMirror.setValue(e.data[t]||""),e.T.setCodeMirrorMode(e.codeMirror,"python");break;case"diff":var i=e.data.title?" (".concat(e.data.title,")"):"",o="".concat(e.scriptId).concat(i),r=e.data.code||"",n=e.data.codeDraft||"",s=e.$t("Published Code"),c=e.$t("Saved Draft Code"),d=Object(a["createPatch"])(o,r,n,s,c);e.codeMirror.setValue(d),e.T.setCodeMirrorMode(e.codeMirror,"diff");break}e.codeMirror.refresh(),e.codeMirror.focus(),e.updateSelectableItems(),e.$store.state.Editor_selectedItemId&&(e.selectedItemId=e.$store.state.Editor_selectedItemId,e.highlightQuickSelectItem())}));case 13:case"end":return t.stop()}}),t)})))()},startEdit:function(){this.$router.push({name:"code-editor",params:{id:this.data.id}})},updateSelectableItems:function(){var e=this;if(this.data.codeDraft){var t=[];this.data.codeDraft.split("\n").forEach((function(i,o){if(0===i.indexOf("def ")&&i.indexOf("def _")<0){var r=i.slice(4).split("("),n=r[0],s="".concat(e.scriptId,".").concat(n),a=r[1].slice(0,-2).split(",").reduce((function(e,t){var i=t.trim().split("=")[0];return i&&i.indexOf("*")<0&&(e[i]="".concat(i.toUpperCase())),e}),{});t.push({id:s,type:"def",name:n,kwargs:a,line:o})}else if(0===i.indexOf("class ")&&i.indexOf("class _")<0){var c=i.slice(6).split("("),d=c[0],l="".concat(e.scriptId,".").concat(d);t.push({id:l,type:"class",name:d,line:o})}})),this.selectableItems=t}},_clearLineHighlight:function(e){try{this.codeMirror.removeLineClass(e,"text"),this.codeMirror.removeLineClass(e,"background"),this.codeMirror.removeLineClass(e,"wrap");var t=this.codeMirror.lineInfo(e).widgets;Array.isArray(t)&&t.forEach((function(e){e.clear()}))}catch(i){}},_setLineHighlight:function(e){if(!this.codeMirror)return null;e=e||{};var t=e.line+(e.scroll||0);if(t=Math.min(Math.max(t,0),this.codeMirror.lineCount()-1),"next"===e.marginType?(this.codeMirror.setCursor({line:this.codeMirror.lineCount()-1}),this.codeMirror.setCursor({line:t})):"prev"===e.marginType&&(this.codeMirror.setCursor({line:0}),this.codeMirror.setCursor({line:t})),this.codeMirror.setCursor({line:e.line}),e.textClass&&this.codeMirror.addLineClass(e.line,"text",e.textClass),e.backgroundClass&&this.codeMirror.addLineClass(e.line,"background",e.backgroundClass),e.wrapClass&&this.codeMirror.addLineClass(e.line,"wrap",e.wrapClass),e.lineWidgetConfig){var i=e.lineWidgetConfig,o=null;switch(i.type){}o&&this.codeMirror.addLineWidget(e.line,o)}return this.codeMirror.lineInfo(e.line)},updateHighlightLineConfig:function(e,t){var i=this.T.jsonCopy(this.$store.state.codeViewer_highlightedLineConfigMap)||{};if(null===t?i[this.scriptId]&&delete i[this.scriptId][e]:(i[this.scriptId]||(i[this.scriptId]={}),i[this.scriptId][e]=t),this.codeMirror){for(var o in this.highlightedLineInfoMap)if(this.highlightedLineInfoMap.hasOwnProperty(o)){var r=this.highlightedLineInfoMap[o];for(var n in r)if(r.hasOwnProperty(n)){var s=r[n];this._clearLineHighlight(s.handle.lineNo())}}var a={},c=i[this.scriptId]||{};for(var d in c)if(c.hasOwnProperty(d)){var l=c[d],u=this._setLineHighlight(l);u&&(a[this.scriptId]||(a[this.scriptId]={}),a[this.scriptId][d]=u)}this.highlightedLineInfoMap=a,this.$store.commit("updateCodeViewer_highlightedLineConfigMap",i)}},highlightQuickSelectItem:function(){this.$store.state.isLoaded&&this.codeMirror&&this.selectedItem&&(this.updateHighlightLineConfig("selectedFuncLine",null),this.updateHighlightLineConfig("selectedFuncLine",null),this.updateHighlightLineConfig("selectedFuncLine",{line:this.selectedItem.line,marginType:"next",scroll:-1,textClass:"highlight-text",backgroundClass:"current-func-background highlight-code-line-blink"}))},download:function(){var e=new Blob([this.codeMirror.getValue()],{type:"text/plain"}),t=null;switch(this.showMode){case"draft":t=this.data.id+".draft.py";break;case"published":t=this.data.id+".py";break;case"diff":t=this.data.id+".py.diff";break}d.a.saveAs(e,t)}},computed:{codeMirrorTheme:function(){return this.T.getCodeMirrorThemeName()},scriptId:function(){return this.$route.params.id},scriptSetId:function(){return this.scriptId.split("__")[0]},conflictStatus:function(){return this.$store.getters.getConflictStatus(this.$route)},lockedByUserId:function(){return this.data.sset_lockedByUserId||this.data.lockedByUserId},lockedByUser:function(){return this.data.sset_lockedByUserId?"".concat(this.data.sset_lockedByUserName||this.data.sset_lockedByUsername):this.data.lockedByUserId?"".concat(this.data.lockedByUserName||this.data.lockedByUsername):void 0},isLockedByMe:function(){return this.lockedByUserId===this.$store.getters.userId},isLockedByOther:function(){return this.lockedByUserId&&!this.isLockedByMe},isEditable:function(){return!!this.$store.getters.isAdmin||!this.isLockedByOther},userOperation:function(){return this.isEditable?"edit":"debug"},codeLines:function(){return(this.data.code||"").split("\n").length},codeDraftLines:function(){return(this.data.codeDraft||"").split("\n").length},selectedItem:function(){if(!this.selectedItemId)return null;for(var e=0;e<this.selectableItems.length;e++){var t=this.selectableItems[e];if(t.id===this.selectedItemId)return t}}},props:{},data:function(){return{codeMirror:null,highlightedLineInfoMap:{},data:{},selectableItems:[],selectedItemId:"",showMode:"draft",diffAddedCount:0,diffRemovedCount:0}},mounted:function(){var e=this;setImmediate((function(){e.codeMirror=e.T.initCodeMirror("editor_CodeViewer"),e.codeMirror.setOption("theme",e.codeMirrorTheme),e.T.setCodeMirrorReadOnly(e.codeMirror,!0)}))},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},u=l,h=(i("685a"),i("03fb"),i("2877")),f=i("7f09"),p=i("2383"),m=Object(h["a"])(u,o,r,!1,null,"6208b279",null);"function"===typeof f["default"]&&Object(f["default"])(m),"function"===typeof p["default"]&&Object(p["default"])(m);t["default"]=m.exports},"13d5":function(e,t,i){"use strict";var o=i("23e7"),r=i("d58f").left,n=i("a640"),s=i("2d00"),a=i("605d"),c=n("reduce"),d=!a&&s>79&&s<83;o({target:"Array",proto:!0,forced:!c||d},{reduce:function(e){var t=arguments.length;return r(this,e,t,t>1?arguments[1]:void 0)}})},"21a6":function(e,t,i){(function(i){var o,r,n;(function(i,s){r=[],o=s,n="function"===typeof o?o.apply(t,r):o,void 0===n||(e.exports=n)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function o(e,t,i){var o=new XMLHttpRequest;o.open("GET",e),o.responseType="blob",o.onload=function(){a(o.response,t,i)},o.onerror=function(){console.error("could not download file")},o.send()}function r(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function n(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(o){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var s="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof i&&i.global===i?i:void 0,a=s.saveAs||("object"!=typeof window||window!==s?function(){}:"download"in HTMLAnchorElement.prototype?function(e,t,i){var a=s.URL||s.webkitURL,c=document.createElement("a");t=t||e.name||"download",c.download=t,c.rel="noopener","string"==typeof e?(c.href=e,c.origin===location.origin?n(c):r(c.href)?o(e,t,i):n(c,c.target="_blank")):(c.href=a.createObjectURL(e),setTimeout((function(){a.revokeObjectURL(c.href)}),4e4),setTimeout((function(){n(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,i,s){if(i=i||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,s),i);else if(r(e))o(e,i,s);else{var a=document.createElement("a");a.href=e,a.target="_blank",setTimeout((function(){n(a)}))}}:function(e,t,i,r){if(r=r||open("","_blank"),r&&(r.document.title=r.document.body.innerText="downloading..."),"string"==typeof e)return o(e,t,i);var n="application/octet-stream"===e.type,a=/constructor/i.test(s.HTMLElement)||s.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||n&&a)&&"object"==typeof FileReader){var d=new FileReader;d.onloadend=function(){var e=d.result;e=c?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),r?r.location.href=e:location=e,r=null},d.readAsDataURL(e)}else{var l=s.URL||s.webkitURL,u=l.createObjectURL(e);r?r.location=u:location.href=u,r=null,setTimeout((function(){l.revokeObjectURL(u)}),4e4)}});s.saveAs=a.saveAs=a,e.exports=a}))}).call(this,i("c8ba"))},2383:function(e,t,i){"use strict";var o=i("25c2"),r=i.n(o);t["default"]=r.a},"25c2":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Script Setup":"脚本设置","Script is under editing mode in other browser tab, please wait...":"其他标签页或窗口正在编辑此脚本，请稍后...","Script is under editing mode in other client, please wait...":"其他客户端正在编辑此脚本，请稍后...","Shortcut":"快捷键","Select Item":"选择聚焦项目","Download {type}":"下载{type}","Setup Code Editor":"调整编辑器显示样式","This is a builtin Script, code will be reset when the system restarts":"这是一个内置脚本，代码会在系统重启后复位","This Script is locked by other user({user})":"当前脚本被其他用户（{user}）锁定","Currently in view mode, click Edit button to enter edit mode":"当前为查看模式，点击「编辑」按钮进入编辑模式","View Mode":"查看模式","Published Code":"已发布的代码","Saved Draft Code":"已保存的草稿代码"}}'),delete e.options._Ctor}},"685a":function(e,t,i){"use strict";i("8a32")},"7e33":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"codeLines":"{n} line | {n} lines"}}'),delete e.options._Ctor}},"7f09":function(e,t,i){"use strict";var o=i("7e33"),r=i.n(o);t["default"]=r.a},"8a32":function(e,t,i){},aa55:function(e,t,i){},d58f:function(e,t,i){var o=i("da84"),r=i("59ed"),n=i("7b0b"),s=i("44ad"),a=i("07fa"),c=o.TypeError,d=function(e){return function(t,i,o,d){r(i);var l=n(t),u=s(l),h=a(l),f=e?h-1:0,p=e?-1:1;if(o<2)while(1){if(f in u){d=u[f],f+=p;break}if(f+=p,e?f<0:h<=f)throw c("Reduce of empty array with no initial value")}for(;e?f>=0:h>f;f+=p)f in u&&(d=i(d,u[f],f,l));return d}};e.exports={left:d(!1),right:d(!0)}}}]);