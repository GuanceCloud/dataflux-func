(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-e0536486"],{"1d5a":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Add Blueprint":"新增藍圖","Are you sure you want to delete the Blueprint?":"是否確認刪除此藍圖？","Blueprint ID will be used as Script Set ID after deployment":"藍圖 ID 在部署後將作為指令碼集 ID","Blueprint created":"藍圖已建立","Blueprint deleted":"藍圖已刪除","Blueprint saved":"藍圖已儲存","Cannot not starts with a number":"不得以數字開頭","ID cannot contains double underscore \\"__\\"":"不能包含雙下劃線 \\"__\\"","Only alphabets, numbers and underscore are allowed":"只能包含大小寫英文、數字及下劃線","Please input ID":"請輸入 ID","Setup Blueprint":"配置藍圖"}}'),delete t.options._Ctor}},"274e":function(t,e,a){"use strict";var n=a("5d9a"),r=a.n(n);e["default"]=r.a},"39dd":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Add Blueprint":"添加蓝图","Setup Blueprint":"配置蓝图","Blueprint ID will be used as Script Set ID after deployment":"蓝图 ID 在部署后将作为脚本集 ID","Please input ID":"请输入 ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","ID cannot contains double underscore \\"__\\"":"不能包含双下划线 \\"__\\"","Blueprint created":"蓝图已创建","Blueprint saved":"蓝图已保存","Blueprint deleted":"蓝图已删除","Are you sure you want to delete the Blueprint?":"是否确认删除此蓝图？"}}'),delete t.options._Ctor}},"4c1b":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-CN":{"Blueprint deleted":"蓝图已删除","No Blueprint has ever been added":"从未添加过任何蓝图","Are you sure you want to delete the Blueprint?":"是否确认删除此蓝图？","Add Blueprint to deploy data processing flow in a visualization way":"添加蓝图，使用可视化方式部署数据处理流程"}}'),delete t.options._Ctor}},"5d9a":function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-TW":{"Add Blueprint to deploy data processing flow in a visualization way":"新增藍圖，使用視覺化方式部署資料處理流程","Are you sure you want to delete the Blueprint?":"是否確認刪除此藍圖？","Blueprint deleted":"藍圖已刪除","No Blueprint has ever been added":"從未新增過任何藍圖"}}'),delete t.options._Ctor}},"8d07":function(t,e,a){"use strict";a.r(e);var n=function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"fade"}},[e("el-container",{directives:[{name:"show",rawName:"v-show",value:t.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[e("el-header",{attrs:{height:"60px"}},[e("div",{staticClass:"common-page-header"},[e("h1",[t._v(t._s(t.$t("Blueprint")))]),t._v(" "),e("div",{staticClass:"header-control"},[e("FuzzySearchInput",{attrs:{dataFilter:t.dataFilter}}),t._v(" "),e("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(e){return t.openSetup(null,"add")}}},[e("i",{staticClass:"fa fa-fw fa-plus"}),t._v("\n            "+t._s(t.$t("New"))+"\n          ")])],1)])]),t._v(" "),e("el-main",{staticClass:"common-table-container"},[t.T.isNothing(t.data)?e("div",{staticClass:"no-data-area"},[t.T.isPageFiltered()?e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-search"}),t._v(t._s(t.$t("No matched data found")))]):e("h1",{staticClass:"no-data-title"},[e("i",{staticClass:"fa fa-fw fa-info-circle"}),t._v(t._s(t.$t("No Blueprint has ever been added")))]),t._v(" "),e("p",{staticClass:"no-data-tip"},[t._v("\n          "+t._s(t.$t("Add Blueprint to deploy data processing flow in a visualization way"))+"\n        ")])]):e("el-table",{staticClass:"common-table",attrs:{height:"100%",data:t.data,"row-class-name":t.T.getHighlightRowCSS}},[e("el-table-column",{attrs:{label:"ID",width:"220"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("code",{staticClass:"text-main text-small"},[t._v(t._s(a.row.id))]),t._v(" "),e("CopyButton",{attrs:{content:a.row.id}})]}}])}),t._v(" "),e("el-table-column",{attrs:{label:t.$t("Title")},scopedSlots:t._u([{key:"default",fn:function(a){return[e("span",[t._v(t._s(a.row.title))])]}}])}),t._v(" "),e("el-table-column",{attrs:{width:"135"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-button",{staticStyle:{width:"100px"},attrs:{type:"primary",size:"small",plain:""},on:{click:function(e){return t.openContents(a.row)}}},[e("i",{staticClass:"fa fa-fw fa-th-large"}),t._v("\n              "+t._s(t.$t("Enter"))+"\n            ")])]}}])}),t._v(" "),e("el-table-column",{attrs:{align:"right",width:"200"},scopedSlots:t._u([{key:"default",fn:function(a){return[e("el-link",{on:{click:function(e){return t.openSetup(a.row,"setup")}}},[t._v(t._s(t.$t("Setup")))]),t._v(" "),e("el-link",{on:{click:function(e){return t.quickSubmitData(a.row,"delete")}}},[t._v(t._s(t.$t("Delete")))])]}}])})],1)],1),t._v(" "),e("Pager",{attrs:{pageInfo:t.pageInfo}}),t._v(" "),e("BlueprintSetup",{ref:"setup"})],1)],1)},r=[],i=a("c7eb"),s=a("1da1"),o=(a("14d9"),a("a4d3"),a("e01a"),function(){var t=this,e=t._self._c;return e("el-dialog",{attrs:{id:"ScriptSetSetup",visible:t.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"750px"},on:{"update:visible":function(e){t.show=e}}},[e("template",{slot:"title"},[t._v("\n    "+t._s(t.pageTitle)+" "),"setup"===t.pageMode?e("code",{staticClass:"text-main"},[t._v(t._s(t.data.title||t.data.id))]):t._e()]),t._v(" "),e("el-container",{attrs:{direction:"vertical"}},[e("el-main",[e("div",{staticClass:"setup-form"},[e("el-form",{ref:"form",attrs:{"label-width":"135px",model:t.form,rules:t.formRules}},[e("el-form-item",{attrs:{label:"ID",prop:"id"}},[e("el-input",{attrs:{disabled:"setup"===t.pageMode,maxlength:"60"},model:{value:t.form.id,callback:function(e){t.$set(t.form,"id",e)},expression:"form.id"}}),t._v(" "),e("InfoBlock",{attrs:{title:t.$t("Blueprint ID will be used as Script Set ID after deployment")}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Title")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),maxlength:"200"},model:{value:t.form.title,callback:function(e){t.$set(t.form,"title",e)},expression:"form.title"}})],1),t._v(" "),e("el-form-item",{attrs:{label:t.$t("Description")}},[e("el-input",{attrs:{placeholder:t.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000"},model:{value:t.form.description,callback:function(e){t.$set(t.form,"description",e)},expression:"form.description"}})],1),t._v(" "),e("el-form-item",{staticClass:"setup-footer"},["setup"===t.pageMode?e("el-button",{staticClass:"danger-button",on:{click:t.deleteData}},[t._v(t._s(t.$t("Delete")))]):t._e(),t._v(" "),e("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:t.submitData}},[t._v(t._s(t.$t("Save")))])],1)],1)],1)])],1)],2)}),u=[],l=(a("d9e2"),a("b64b"),a("d3b7"),a("159b"),{name:"BlueprintSetup",components:{},watch:{show:function(t){t||this.$root.$emit("reload.blueprintList")}},methods:{loadData:function(t){var e=this;return Object(s["a"])(Object(i["a"])().mark((function a(){var n,r;return Object(i["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(t){a.next=6;break}e.pageMode="add",e.T.jsonClear(e.form),e.data={},a.next=17;break;case 6:return e.pageMode="setup",e.data.id=t,a.next=10,e.T.callAPI_getOne("/api/v1/blueprints/do/list",e.data.id);case 10:if(n=a.sent,n&&n.ok){a.next=13;break}return a.abrupt("return");case 13:e.data=n.data,r={},Object.keys(e.form).forEach((function(t){return r[t]=e.data[t]})),e.form=r;case 17:e.show=!0;case 18:case"end":return a.stop()}}),a)})))()},submitData:function(){var t=this;return Object(s["a"])(Object(i["a"])().mark((function e(){return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,t.$refs.form.validate();case 3:e.next=8;break;case 5:return e.prev=5,e.t0=e["catch"](0),e.abrupt("return",console.error(e.t0));case 8:e.t1=t.pageMode,e.next="add"===e.t1?11:"setup"===e.t1?14:17;break;case 11:return e.next=13,t.addData();case 13:return e.abrupt("return",e.sent);case 14:return e.next=16,t.modifyData();case 16:return e.abrupt("return",e.sent);case 17:case"end":return e.stop()}}),e,null,[[0,5]])})))()},addData:function(){var t=this;return Object(s["a"])(Object(i["a"])().mark((function e(){var a,n;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.callAPI("post","/api/v1/blueprints/do/add",{body:{data:t.T.jsonCopy(t.form)},alert:{okMessage:t.$t("Blueprint created")}});case 2:if(a=e.sent,a&&a.ok){e.next=5;break}return e.abrupt("return");case 5:n=t.T.packRouteQuery(),t.$store.commit("updateHighlightedTableDataId",a.data.id),t.show=!1,t.$router.push({name:"blueprint-canvas",params:{id:a.data.id},query:n});case 9:case"end":return e.stop()}}),e)})))()},modifyData:function(){var t=this;return Object(s["a"])(Object(i["a"])().mark((function e(){var a,n;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.T.jsonCopy(t.form),delete a.id,e.next=4,t.T.callAPI("post","/api/v1/blueprints/:id/do/modify",{params:{id:t.data.id},body:{data:a},alert:{okMessage:t.$t("Blueprint saved")}});case 4:if(n=e.sent,n&&n.ok){e.next=7;break}return e.abrupt("return");case 7:t.$store.commit("updateHighlightedTableDataId",n.data.id),t.show=!1;case 9:case"end":return e.stop()}}),e)})))()},deleteData:function(){var t=this;return Object(s["a"])(Object(i["a"])().mark((function e(){var a;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.T.confirm(t.$t("Are you sure you want to delete the Blueprint?"));case 2:if(e.sent){e.next=4;break}return e.abrupt("return");case 4:return e.next=6,t.T.callAPI("/api/v1/blueprints/:id/do/delete",{params:{id:t.data.id},alert:{okMessage:t.$t("Blueprint deleted")}});case 6:if(a=e.sent,a&&a.ok){e.next=9;break}return e.abrupt("return");case 9:t.show=!1;case 10:case"end":return e.stop()}}),e)})))()}},computed:{pageTitle:function(){var t={setup:this.$t("Setup Blueprint"),add:this.$t("Add Blueprint")};return t[this.pageMode]}},data:function(){var t=this;return{show:!1,pageMode:null,data:{},form:{id:null,title:null,description:null},formRules:{id:[{trigger:"blur",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g},{trigger:"change",validator:function(e,a,n){if(a&&a.indexOf("__")>=0){var r=t.$t('ID cannot contains double underscore "__"');return n(new Error(r))}return n()}}]}}}}),d=l,c=a("2877"),p=a("9a2e"),f=a("fd23"),b=a("afa3"),h=Object(c["a"])(d,o,u,!1,null,"d37cbda6",null);"function"===typeof p["default"]&&Object(p["default"])(h),"function"===typeof f["default"]&&Object(f["default"])(h),"function"===typeof b["default"]&&Object(b["default"])(h);var m=h.exports,_={name:"BlueprintList",components:{BlueprintSetup:m},watch:{$route:{immediate:!0,handler:function(t,e){var a=this;return Object(s["a"])(Object(i["a"])().mark((function t(){return Object(i["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,a.loadData();case 2:case"end":return t.stop()}}),t)})))()}}},methods:{loadData:function(){var t=this;return Object(s["a"])(Object(i["a"])().mark((function e(){var a,n;return Object(i["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return a=t.dataFilter=t.T.createListQuery({fields:["id","title","createTime"],sort:["-seq"]}),e.next=3,t.T.callAPI_get("/api/v1/blueprints/do/list",{query:a});case 3:if(n=e.sent,n&&n.ok){e.next=6;break}return e.abrupt("return");case 6:t.data=n.data,t.pageInfo=n.pageInfo,t.$store.commit("updateLoadStatus",!0);case 9:case"end":return e.stop()}}),e)})))()},quickSubmitData:function(t,e){var a=this;return Object(s["a"])(Object(i["a"])().mark((function n(){var r;return Object(i["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:n.t0=e,n.next="delete"===n.t0?3:8;break;case 3:return n.next=5,a.T.confirm(a.$t("Are you sure you want to delete the Blueprint?"));case 5:if(n.sent){n.next=7;break}return n.abrupt("return");case 7:return n.abrupt("break",8);case 8:r=null,n.t1=e,n.next="delete"===n.t1?12:16;break;case 12:return n.next=14,a.T.callAPI("/api/v1/blueprints/:id/do/delete",{params:{id:t.id},alert:{okMessage:a.$t("Blueprint deleted")}});case 14:return r=n.sent,n.abrupt("break",16);case 16:if(r&&r.ok){n.next=18;break}return n.abrupt("return");case 18:return a.$store.commit("updateHighlightedTableDataId",t.id),n.next=21,a.loadData();case 21:case"end":return n.stop()}}),n)})))()},openSetup:function(t,e){switch(e){case"add":this.$refs.setup.loadData();break;case"setup":this.$store.commit("updateHighlightedTableDataId",t.id),this.$refs.setup.loadData(t.id);break}},openContents:function(t){var e=this.T.packRouteQuery();this.$store.commit("updateHighlightedTableDataId",t.id),this.$router.push({name:"blueprint-canvas",params:{id:t.id},query:e})}},computed:{},props:{},data:function(){var t=this.T.createPageInfo(),e=this.T.createListQuery();return{data:[],pageInfo:t,dataFilter:{_fuzzySearch:e._fuzzySearch}}},created:function(){this.$root.$on("reload.blueprintList",this.loadData)},destroyed:function(){this.$root.$off("reload.blueprintList")}},v=_,w=a("9fbd"),y=a("b9e3"),g=a("274e"),k=Object(c["a"])(v,n,r,!1,null,"38408cde",null);"function"===typeof w["default"]&&Object(w["default"])(k),"function"===typeof y["default"]&&Object(y["default"])(k),"function"===typeof g["default"]&&Object(g["default"])(k);e["default"]=k.exports},"9a2e":function(t,e,a){"use strict";var n=a("39dd"),r=a.n(n);e["default"]=r.a},"9fbd":function(t,e,a){"use strict";var n=a("4c1b"),r=a.n(n);e["default"]=r.a},a7d5:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Add Blueprint":"添加藍圖","Are you sure you want to delete the Blueprint?":"是否確認刪除此藍圖？","Blueprint ID will be used as Script Set ID after deployment":"藍圖 ID 在部署後將作為腳本集 ID","Blueprint created":"藍圖已創建","Blueprint deleted":"藍圖已刪除","Blueprint saved":"藍圖已保存","Cannot not starts with a number":"不得以數字開頭","ID cannot contains double underscore \\"__\\"":"不能包含雙下劃線 \\"__\\"","Only alphabets, numbers and underscore are allowed":"只能包含大小寫英文、數字及下劃線","Please input ID":"請輸入 ID","Setup Blueprint":"配置藍圖"}}'),delete t.options._Ctor}},afa3:function(t,e,a){"use strict";var n=a("1d5a"),r=a.n(n);e["default"]=r.a},b9e3:function(t,e,a){"use strict";var n=a("e661"),r=a.n(n);e["default"]=r.a},e661:function(t,e){t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"zh-HK":{"Add Blueprint to deploy data processing flow in a visualization way":"添加藍圖，使用可視化方式部署數據處理流程","Are you sure you want to delete the Blueprint?":"是否確認刪除此藍圖？","Blueprint deleted":"藍圖已刪除","No Blueprint has ever been added":"從未添加過任何藍圖"}}'),delete t.options._Ctor}},fd23:function(t,e,a){"use strict";var n=a("a7d5"),r=a.n(n);e["default"]=r.a}}]);