(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-6d220524"],{1445:function(e,t,i){"use strict";var o=i("7a7f"),n=i.n(o);t["default"]=n.a},"1f30":function(e,t,i){"use strict";i("e7da")},"21a6":function(e,t,i){(function(i){var o,n,r;(function(i,s){n=[],o=s,r="function"===typeof o?o.apply(t,n):o,void 0===r||(e.exports=r)})(0,(function(){"use strict";function t(e,t){return"undefined"==typeof t?t={autoBom:!1}:"object"!=typeof t&&(console.warn("Deprecated: Expected third argument to be a object"),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e}function o(e,t,i){var o=new XMLHttpRequest;o.open("GET",e),o.responseType="blob",o.onload=function(){d(o.response,t,i)},o.onerror=function(){console.error("could not download file")},o.send()}function n(e){var t=new XMLHttpRequest;t.open("HEAD",e,!1);try{t.send()}catch(e){}return 200<=t.status&&299>=t.status}function r(e){try{e.dispatchEvent(new MouseEvent("click"))}catch(o){var t=document.createEvent("MouseEvents");t.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var s="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof i&&i.global===i?i:void 0,a=s.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),d=s.saveAs||("object"!=typeof window||window!==s?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(e,t,i){var a=s.URL||s.webkitURL,d=document.createElement("a");t=t||e.name||"download",d.download=t,d.rel="noopener","string"==typeof e?(d.href=e,d.origin===location.origin?r(d):n(d.href)?o(e,t,i):r(d,d.target="_blank")):(d.href=a.createObjectURL(e),setTimeout((function(){a.revokeObjectURL(d.href)}),4e4),setTimeout((function(){r(d)}),0))}:"msSaveOrOpenBlob"in navigator?function(e,i,s){if(i=i||e.name||"download","string"!=typeof e)navigator.msSaveOrOpenBlob(t(e,s),i);else if(n(e))o(e,i,s);else{var a=document.createElement("a");a.href=e,a.target="_blank",setTimeout((function(){r(a)}))}}:function(e,t,i,n){if(n=n||open("","_blank"),n&&(n.document.title=n.document.body.innerText="downloading..."),"string"==typeof e)return o(e,t,i);var r="application/octet-stream"===e.type,d=/constructor/i.test(s.HTMLElement)||s.safari,c=/CriOS\/[\d]+/.test(navigator.userAgent);if((c||r&&d||a)&&"undefined"!=typeof FileReader){var l=new FileReader;l.onloadend=function(){var e=l.result;e=c?e:e.replace(/^data:[^;]*;/,"data:attachment/file;"),n?n.location.href=e:location=e,n=null},l.readAsDataURL(e)}else{var u=s.URL||s.webkitURL,f=u.createObjectURL(e);n?n.location=f:location.href=f,n=null,setTimeout((function(){u.revokeObjectURL(f)}),4e4)}});s.saveAs=d.saveAs=d,e.exports=d}))}).call(this,i("c8ba"))},"40bd":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"codeLines":"{n} line | {n} lines"}}'),delete e.options._Ctor}},4550:function(e,t,i){"use strict";i("7c09")},"5f19":function(e,t,i){"use strict";var o=i("9110"),n=i.n(o);t["default"]=n.a},"5fdb":function(e,t,i){"use strict";var o=i("cdb3"),n=i.n(o);t["default"]=n.a},6386:function(e,t,i){},6928:function(e,t,i){"use strict";var o=i("9fb4"),n=i.n(o);t["default"]=n.a},"7a7f":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Code Editor setting":"代碼編輯器設置","Currently in view mode, click Edit button to enter edit mode":"當前為查看模式，點擊「編輯」按鈕進入編輯模式","Download {type}":"下載{type}","Published Code":"已發佈的代碼","Saved Draft Code":"已保存的草稿代碼","Script Setup":"腳本設置","Script is under editing in other client, please wait...":"其他客户端正在編輯此腳本，請稍後...","Script is under editing in other tab, please wait...":"其他標籤頁或窗口正在編輯此腳本，請稍後...","Select Target":"選擇跳轉目標","Shortcut":"快捷鍵","This Script is locked by other user ({user})":"當前腳本被其他用户（{user}）鎖定","This is a built-in Script, code will be reset when the system restarts":"這是一個內置腳本，代碼會在系統重啓後復位","View Mode":"查看模式"}}'),delete e.options._Ctor}},"7abf":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Code Editor setting":"代码编辑器设置","Setting of Code Editor only effect current browser":"代码编辑器配置仅保存在当前浏览器，更换浏览器或电脑后需要重新配置","Theme":"主题","Font Size":"文字大小","Line Height":"行高","Reset to default":"恢复默认设置","Please input font size":"请输入文字大小","Font size should be a integer between 12 and 36":"文字大小设置范围为 12-36 px","Please input line height":"请输入行高","Line height should be a number between 1 and 2":"行高设置范围为 1-2 倍"}}'),delete e.options._Ctor}},"7c09":function(e,t,i){},"8b10":function(e,t,i){"use strict";i("6386")},9110:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Code Editor setting":"程式碼編輯器設定","Font Size":"文字大小","Font size should be a integer between 12 and 36":"文字大小設定範圍為 12-36 px","Line Height":"行高","Line height should be a number between 1 and 2":"行高設定範圍為 1-2 倍","Please input font size":"請輸入文字大小","Please input line height":"請輸入行高","Reset to default":"恢復預設設定","Setting of Code Editor only effect current browser":"程式碼編輯器配置僅儲存在當前瀏覽器，更換瀏覽器或電腦後需要重新配置","Theme":"主題"}}'),delete e.options._Ctor}},9189:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Code Editor setting":"代碼編輯器設置","Font Size":"文字大小","Font size should be a integer between 12 and 36":"文字大小設置範圍為 12-36 px","Line Height":"行高","Line height should be a number between 1 and 2":"行高設置範圍為 1-2 倍","Please input font size":"請輸入文字大小","Please input line height":"請輸入行高","Reset to default":"恢復默認設置","Setting of Code Editor only effect current browser":"代碼編輯器配置僅保存在當前瀏覽器，更換瀏覽器或電腦後需要重新配置","Theme":"主題"}}'),delete e.options._Ctor}},"9fb4":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Code Editor setting":"程式碼編輯器設定","Currently in view mode, click Edit button to enter edit mode":"當前為檢視模式，點選「編輯」按鈕進入編輯模式","Download {type}":"下載{type}","Published Code":"已釋出的程式碼","Saved Draft Code":"已儲存的草稿程式碼","Script Setup":"指令碼設定","Script is under editing in other client, please wait...":"其他客戶端正在編輯此指令碼，請稍後...","Script is under editing in other tab, please wait...":"其他標籤頁或視窗正在編輯此指令碼，請稍後...","Select Target":"選擇跳轉目標","Shortcut":"快捷鍵","This Script is locked by other user ({user})":"當前指令碼被其他使用者（{user}）鎖定","This is a built-in Script, code will be reset when the system restarts":"這是一個內建指令碼，程式碼會在系統重啟後復位","View Mode":"檢視模式"}}'),delete e.options._Ctor}},a70b:function(e,t,i){},b951:function(e,t,i){"use strict";i("b0c0");var o=function(){var e=this,t=e._self._c;return t("el-drawer",{attrs:{modal:!1,visible:e.show,direction:"rtl"},on:{"update:visible":function(t){e.show=t}}},[t("div",{attrs:{slot:"title"},slot:"title"},[t("i",{staticClass:"fa fa-fw fa-cog"}),e._v(" "+e._s(e.$t("Code Editor setting"))+"\n  ")]),e._v(" "),t("div",{staticClass:"code-editor-setting"},[t("InfoBlock",{attrs:{type:"warning",title:e.$t("Setting of Code Editor only effect current browser")}}),e._v(" "),t("br"),e._v(" "),t("el-form",{ref:"form",attrs:{"label-width":"100px",model:e.form,rules:e.formRules}},[t("el-form-item",{attrs:{label:e.$t("Theme")}},[t("el-select",{model:{value:e.form.theme,callback:function(t){e.$set(e.form,"theme",t)},expression:"form.theme"}},e._l(e.C.CODE_MIRROR_THEME,(function(i){return t("el-option",{key:i.key,attrs:{label:e.$t(i.name),value:i.key}})})),1)],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Font Size"),prop:"style.fontSize"}},[t("el-slider",{attrs:{min:12,max:36,step:1,"show-input":!0,"show-input-controls":!1,"show-tooltip":!1},model:{value:e.form.style.fontSize,callback:function(t){e.$set(e.form.style,"fontSize",e._n(t))},expression:"form.style.fontSize"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Line Height"),prop:"style.lineHeight"}},[t("el-slider",{attrs:{min:1,max:2,step:.1,"show-input":!0,"show-input-controls":!1,"show-tooltip":!1},model:{value:e.form.style.lineHeight,callback:function(t){e.$set(e.form.style,"lineHeight",e._n(t))},expression:"form.style.lineHeight"}})],1),e._v(" "),t("el-form-item",[t("div",{staticClass:"setup-right"},[t("el-button",{on:{click:e.resetDefault}},[e._v(e._s(e.$t("Reset to default")))])],1)])],1)],1)])},n=[],r=(i("130f"),{name:"CodeEditorSetting",components:{},watch:{form:{deep:!0,handler:function(e,t){var i=this,o=this.T.jsonCopy(this.form);this.$store.commit("updateCodeMirrorSettings",o),setImmediate((function(){i.codeMirror&&i.codeMirror.refresh()}))}}},methods:{open:function(){this.show=!0},resetDefault:function(){this.form=this.T.jsonCopy({theme:this.C.CODE_MIRROR_THEME_DEFAULT.key,style:this.$store.getters.DEFAULT_STATE.codeMirrorStyle})}},props:{codeMirror:Object},data:function(){var e=this.T.jsonCopy({theme:this.$store.getters.codeMirrorSettings.theme,style:{fontSize:parseInt(this.$store.getters.codeMirrorSettings.style.fontSize),lineHeight:this.$store.getters.codeMirrorSettings.style.lineHeight}});return{show:!1,form:e,formRules:{"style.fontSize":[{trigger:"change",message:this.$t("Please input font size"),required:!0},{trigger:"change",message:this.$t("Font size should be a integer between 12 and 36"),type:"integer",min:12,max:36}],"style.lineHeight":[{trigger:"change",message:this.$t("Please input line height"),required:!0},{trigger:"change",message:this.$t("Line height should be a number between 1 and 2"),type:"number",min:1,max:2}]}}}}),s=r,a=(i("8b10"),i("1f30"),i("2877")),d=i("f9af"),c=i("c18f"),l=i("5f19"),u=Object(a["a"])(s,o,n,!1,null,"b7c5cc92",null);"function"===typeof d["default"]&&Object(d["default"])(u),"function"===typeof c["default"]&&Object(c["default"])(u),"function"===typeof l["default"]&&Object(l["default"])(u);t["a"]=u.exports},be9a:function(e,t,i){"use strict";i("a70b")},c18f:function(e,t,i){"use strict";var o=i("9189"),n=i.n(o);t["default"]=n.a},cdb3:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Fold Code":"折叠代码","Fold Level 2":"折叠层级 2","Fold Level 3":"折叠层级 3","Unfold All":"全部展开","Script is under editing in other tab, please wait...":"其他标签页或窗口正在编辑此脚本，请稍后...","Script is under editing in other client, please wait...":"其他客户端正在编辑此脚本，请稍后...","Shortcut":"快捷键","Select Target":"选择跳转目标","Download {type}":"下载{type}","Code Editor setting":"代码编辑器设置","This is a built-in Script, code will be reset when the system restarts":"这是一个内置脚本，代码会在系统重启后复位","This Script is locked by other user ({user})":"当前脚本被其他用户（{user}）锁定","Currently in view mode, click Edit button to enter edit mode":"当前为查看模式，点击「编辑」按钮进入编辑模式","View Mode":"查看模式","Published Code":"已发布的代码","Saved Draft Code":"已保存的草稿代码"}}'),delete e.options._Ctor}},de39:function(e,t,i){"use strict";var o=i("40bd"),n=i.n(o);t["default"]=n.a},dfa3:function(e,t,i){"use strict";i.r(t);i("b0c0");var o=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade-s"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}]},[t("el-header",{staticClass:"code-viewer",staticStyle:{height:"unset !important"}},[t("div",{staticClass:"code-viewer-action-left"},[t("code",{staticClass:"code-viewer-action-title"},[t("i",{staticClass:"fa fa-file-code-o"}),e._v("\n          "+e._s(e.data.id)+"\n        ")])]),e._v(" "),t("div",{staticClass:"code-viewer-action-breaker hidden-lg-and-up"}),e._v(" "),t("div",{staticClass:"code-viewer-action-right"},[t("div",{directives:[{name:"show",rawName:"v-show",value:e.conflictStatus,expression:"conflictStatus"}],staticClass:"conflict-info"},[t("i",{staticClass:"fa fa-fw fa-exclamation-triangle"}),e._v(" "),"otherTab"===e.conflictStatus?t("span",[e._v(e._s(e.$t("Script is under editing in other tab, please wait...")))]):"otherClient"===e.conflictStatus?t("span",[e._v(e._s(e.$t("Script is under editing in other client, please wait...")))]):e._e()]),e._v(" "),t("div",[t("el-dropdown",{attrs:{"split-button":"",size:"mini"},on:{click:function(t){return e.foldCode(1)},command:e.foldCode}},[e._v("\n            "+e._s(e.$t("Fold Code"))+"\n            "),t("el-dropdown-menu",{attrs:{slot:"dropdown"},slot:"dropdown"},[t("el-dropdown-item",{attrs:{command:2}},[e._v(e._s(e.$t("Fold Level 2")))]),e._v(" "),t("el-dropdown-item",{attrs:{command:3}},[e._v(e._s(e.$t("Fold Level 3")))]),e._v(" "),t("el-dropdown-item",{attrs:{command:-1,divided:""}},[e._v(e._s(e.$t("Unfold All")))])],1)],1)],1),e._v(" "),t("div",[t("el-select",{staticStyle:{width:"150px"},attrs:{"popper-class":"code-font",size:"mini",filterable:"",placeholder:e.$t("Select Target")},model:{value:e.selectedItemId,callback:function(t){e.selectedItemId=t},expression:"selectedItemId"}},e._l(e.selectableItems,(function(i){return t("el-option",{key:i.id,attrs:{label:i.name,value:i.id}},["todo"===i.type?t("el-tag",{staticClass:"select-todo-tag",attrs:{size:"mini",type:e.C.TODO_TYPE_MAP.get(i.todoType).tagType}},[t("i",{staticClass:"fa fa-fw",class:e.C.TODO_TYPE_MAP.get(i.todoType).icon}),e._v("\n                "+e._s(i.todoType)+"\n              ")]):t("el-tag",{staticClass:"select-item-tag",attrs:{type:"info",size:"mini"}},[e._v(e._s(i.type))]),e._v("\n              "+e._s(i.name)+"\n            ")],1)})),1)],1),e._v(" "),e.conflictStatus?e._e():t("div",[t("el-tooltip",{attrs:{placement:"bottom",enterable:!1}},[t("div",{attrs:{slot:"content"},slot:"content"},[e._v("\n              "+e._s(e.$t("Shortcut"))+e._s(e.$t(":"))),t("kbd",[e._v(e._s(e.T.getSuperKeyName()))]),e._v(" + "),t("kbd",[e._v("E")])]),e._v(" "),t("el-button",{attrs:{type:"primary",plain:"",size:"mini"},on:{click:e.startEdit}},[t("i",{staticClass:"fa fa-fw",class:[e.C.CODE_VIEWR_USER_OPERATION_MAP.get(e.userOperation).icon]}),e._v(" "+e._s(e.C.CODE_VIEWR_USER_OPERATION_MAP.get(e.userOperation).name))])],1)],1),e._v(" "),t("div",[t("el-radio-group",{attrs:{size:"mini"},model:{value:e.showMode,callback:function(t){e.showMode=t},expression:"showMode"}},e._l(e.C.CODE_VIEWER_SHOW_MODE,(function(i,o){return t("el-tooltip",{key:i.key,attrs:{placement:"bottom",enterable:!1}},[t("div",{attrs:{slot:"content"},slot:"content"},[e._v("\n                "+e._s(e.$t("Shortcut"))+e._s(e.$t(":"))),t("kbd",[e._v(e._s(e.T.getSuperKeyName()))]),e._v(" + "),t("kbd",[e._v(e._s(o+1))])]),e._v(" "),t("el-radio-button",{attrs:{label:i.key}},[e._v(e._s(i.name))])],1)})),1)],1),e._v(" "),t("div",[t("el-tooltip",{attrs:{content:e.$t("Download"),placement:"bottom",enterable:!1}},[t("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{plain:"",size:"mini"},on:{click:e.download}},[e._v(e._s(e.$t("Download {type}",{type:e.C.CODE_VIEWER_SHOW_MODE_MAP.get(e.showMode).name})))])],1)],1),e._v(" "),t("div",[t("el-tooltip",{attrs:{content:e.$t("Code Editor setting"),placement:"bottom",enterable:!1}},[t("el-button",{attrs:{plain:"",size:"mini"},on:{click:function(t){return e.$refs.codeEditorSetting.open()}}},[t("i",{staticClass:"fa fa-fw fa-cog"})])],1)],1)]),e._v(" "),e.isLockedByOther?t("InfoBlock",{attrs:{type:e.isEditable?"warning":"error",title:e.$t("This Script is locked by other user ({user})",{user:e.lockedByUser})}}):"builtin"===e.data.sset_origin?t("InfoBlock",{attrs:{type:"warning",title:e.$t("This is a built-in Script, code will be reset when the system restarts")}}):t("InfoBlock",{attrs:{type:"warning",title:e.$t("Currently in view mode, click Edit button to enter edit mode")}})],1),e._v(" "),t("el-main",{style:e.$store.getters.codeMirrorSettings.style,attrs:{id:"editorContainer_CodeViewer"}},[t("textarea",{attrs:{id:"editor_CodeViewer"}}),e._v(" "),t("h1",{attrs:{id:"viewModeHint"}},[e._v(e._s(e.$t("View Mode")))])]),e._v(" "),t("CodeEditorSetting",{ref:"codeEditorSetting",attrs:{codeMirror:e.codeMirror}})],1)],1)},n=[],r=i("c7eb"),s=i("1da1"),a=(i("99af"),i("14d9"),i("d3b7"),i("159b"),i("130f"),i("b951")),d=i("bf68"),c=i("21a6"),l=i.n(c),u={name:"CodeViewer",components:{CodeEditorSetting:a["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var i=this;return Object(s["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,i.loadData();case 2:case"end":return e.stop()}}),e)})))()}},showMode:function(e){this.loadData()},codeMirrorTheme:function(e){this.codeMirror.setOption("theme",e)},selectedItemId:function(e){this.$store.commit("updateEditor_selectedItemId",e),this.highlightQuickSelectItem()},"$store.state.Editor_selectedItemId":function(e){this.selectedItemId!==e&&(this.selectedItemId=e)},"$store.state.shortcutAction":function(e){switch(e.action){case"codeViewer.showDraft":this.showMode="draft";break;case"codeViewer.showPublished":this.showMode="published";break;case"codeViewer.showDiff":this.showMode="diff";break;case"codeViewer.enterEditor":this.conflictStatus||this.startEdit();break}}},methods:{loadData:function(){var e=this;return Object(s["a"])(Object(r["a"])().mark((function t(){var i,o;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.callAPI_getOne("/api/v1/scripts/do/list",e.$route.params.id,{query:{_withCode:!0,_withCodeDraft:!0}});case 2:if(i=t.sent,i.ok&&i.data){t.next=6;break}return e.$router.push({name:"intro"}),t.abrupt("return");case 6:e.data=i.data,o=e.T.getDiffInfo(e.data.code,e.data.codeDraft),e.diffAddedCount=o.addedCount,e.diffRemovedCount=o.removedCount,e.$store.commit("updateLoadStatus",!0),setImmediate((function(){switch(e.codeMirror.setValue(""),e.showMode){case"draft":case"published":var t=e.C.CODE_VIEWER_SHOW_MODE_MAP.get(e.showMode).codeField;e.codeMirror.setValue(e.data[t]||""),e.T.setCodeMirrorMode(e.codeMirror,"python");break;case"diff":var i=e.data.title?" (".concat(e.data.title,")"):"",o="".concat(e.scriptId).concat(i),n=e.data.code||"",r=e.data.codeDraft||"",s=e.$t("Published Code"),a=e.$t("Saved Draft Code"),c=Object(d["createPatch"])(o,n,r,s,a);e.codeMirror.setValue(c),e.T.setCodeMirrorMode(e.codeMirror,"diff");break}if(e.codeMirror.refresh(),e.codeMirror.focus(),e.updateSelectableItems(),e.$store.state.Editor_selectedItemId)e.selectedItemId=e.$store.state.Editor_selectedItemId,e.highlightQuickSelectItem();else{var l=e.$store.state.Editor_scriptCursorMap[e.scriptId];e.T.jumpToCodeMirrorLine(e.codeMirror,l)}e.isReady=!0}));case 13:case"end":return t.stop()}}),t)})))()},foldCode:function(e){this.T.foldCode(this.codeMirror,e)},startEdit:function(){this.$router.push({name:"code-editor",params:{id:this.data.id}})},updateSelectableItems:function(){this.selectableItems=this.common.getPythonCodeItems(this.data.codeDraft,this.scriptId)},_clearLineHighlight:function(e){try{this.codeMirror.removeLineClass(e,"text"),this.codeMirror.removeLineClass(e,"background"),this.codeMirror.removeLineClass(e,"wrap");var t=this.codeMirror.lineInfo(e).widgets;Array.isArray(t)&&t.forEach((function(e){e.clear()}))}catch(i){}},_setLineHighlight:function(e){if(!this.codeMirror)return null;if(e=e||{},e.textClass&&this.codeMirror.addLineClass(e.line,"text",e.textClass),e.backgroundClass&&this.codeMirror.addLineClass(e.line,"background",e.backgroundClass),e.wrapClass&&this.codeMirror.addLineClass(e.line,"wrap",e.wrapClass),e.lineWidgetConfig){var t=e.lineWidgetConfig,i=null;switch(t.type){}i&&this.codeMirror.addLineWidget(e.line,i)}return this.T.jumpToCodeMirrorLine(this.codeMirror,e.line),this.codeMirror.lineInfo(e.line)},updateHighlightLineConfig:function(e,t){var i=this.T.jsonCopy(this.$store.state.codeViewer_highlightedLineConfigMap)||{};if(null===t?i[this.scriptId]&&delete i[this.scriptId][e]:(i[this.scriptId]||(i[this.scriptId]={}),i[this.scriptId][e]=t),this.codeMirror){for(var o in this.highlightedLineInfoMap)if(this.highlightedLineInfoMap.hasOwnProperty(o)){var n=this.highlightedLineInfoMap[o];for(var r in n)if(n.hasOwnProperty(r)){var s=n[r];this._clearLineHighlight(s.handle.lineNo())}}var a={},d=i[this.scriptId]||{};for(var c in d)if(d.hasOwnProperty(c)){var l=d[c],u=this._setLineHighlight(l);u&&(a[this.scriptId]||(a[this.scriptId]={}),a[this.scriptId][c]=u)}this.highlightedLineInfoMap=a,this.$store.commit("updateCodeViewer_highlightedLineConfigMap",i)}},highlightQuickSelectItem:function(){this.$store.state.isLoaded&&this.codeMirror&&this.selectedItem&&(this.updateHighlightLineConfig("selectedFuncLine",null),this.updateHighlightLineConfig("selectedFuncLine",{line:this.selectedItem.line,marginType:"next",textClass:"highlight-text",backgroundClass:"current-func-background highlight-code-line-blink"}))},download:function(){var e=new Blob([this.codeMirror.getValue()],{type:"text/plain"}),t=null;switch(this.showMode){case"draft":t=this.data.id+".draft.py";break;case"published":t=this.data.id+".py";break;case"diff":t=this.data.id+".py.diff";break}l.a.saveAs(e,t)}},computed:{codeMirrorTheme:function(){return this.T.getCodeMirrorThemeName()},scriptId:function(){return this.$route.params.id},scriptSetId:function(){return this.scriptId.split("__")[0]},conflictStatus:function(){return this.$store.getters.getConflictStatus(this.$route)},lockedByUserId:function(){return this.data.sset_lockedByUserId||this.data.lockedByUserId},lockedByUser:function(){return this.data.sset_lockedByUserId?"".concat(this.data.sset_lockedByUserName||this.data.sset_lockedByUsername):this.data.lockedByUserId?"".concat(this.data.lockedByUserName||this.data.lockedByUsername):void 0},isLockedByMe:function(){return this.lockedByUserId===this.$store.getters.userId},isLockedByOther:function(){return this.lockedByUserId&&!this.isLockedByMe},isEditable:function(){return!!this.$store.getters.isAdmin||!this.isLockedByOther},userOperation:function(){return this.isEditable?"edit":"debug"},codeLines:function(){return(this.data.code||"").split("\n").length},codeDraftLines:function(){return(this.data.codeDraft||"").split("\n").length},selectedItem:function(){if(!this.selectedItemId)return null;for(var e=0;e<this.selectableItems.length;e++){var t=this.selectableItems[e];if(t.id===this.selectedItemId)return t}}},props:{},data:function(){return{isReady:!1,codeMirror:null,highlightedLineInfoMap:{},data:{},selectableItems:[],selectedItemId:"",showMode:"draft",diffAddedCount:0,diffRemovedCount:0}},mounted:function(){var e=this;setImmediate((function(){e.codeMirror=e.T.initCodeMirror("editor_CodeViewer"),e.codeMirror.setOption("theme",e.codeMirrorTheme),e.codeMirror.on("cursorActivity",(function(){if(e.isReady){var t={scriptId:e.scriptId,cursor:e.codeMirror.getCursor()};e.$store.commit("updateEditor_scriptCursorMap",t)}})),e.T.setCodeMirrorReadOnly(e.codeMirror,!0),window.cm=e.codeMirror}))},beforeDestroy:function(){this.T.destoryCodeMirror(this.codeMirror)}},f=u,h=(i("be9a"),i("4550"),i("2877")),p=i("de39"),m=i("5fdb"),g=i("1445"),b=i("6928"),_=Object(h["a"])(f,o,n,!1,null,"35e287fb",null);"function"===typeof p["default"]&&Object(p["default"])(_),"function"===typeof m["default"]&&Object(m["default"])(_),"function"===typeof g["default"]&&Object(g["default"])(_),"function"===typeof b["default"]&&Object(b["default"])(_);t["default"]=_.exports},e7da:function(e,t,i){},f9af:function(e,t,i){"use strict";var o=i("7abf"),n=i.n(o);t["default"]=n.a}}]);