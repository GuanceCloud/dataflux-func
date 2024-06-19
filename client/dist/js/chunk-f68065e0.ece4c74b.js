(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-f68065e0"],{"15f4":function(e,t,a){"use strict";var s=a("5c6b"),n=a.n(s);t["default"]=n.a},"2ead":function(e,t,a){"use strict";var s=a("f0af"),n=a.n(s);t["default"]=n.a},"5c6b":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add User":"添加用户","Setup User":"配置用户","Username":"登录账号","Password":"密码","Leave blank when not changing":"不修改时请留空","User created":"用户已创建","User saved":"用户已保存","Please input username":"请输入登录账号","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Please input name":"请输入名称","Please input password":"请输入密码"}}'),delete e.options._Ctor}},"69b8":function(e,t,a){"use strict";var s=a("cf2c"),n=a.n(s);t["default"]=n.a},"707d":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"sessionCount":"{n} session | {n} sessions","lastAccess":"Accessed {t}"}}'),delete e.options._Ctor}},9027:function(e,t,a){"use strict";var s=a("e022"),n=a.n(s);t["default"]=n.a},a366:function(e,t,a){"use strict";var s=a("f367"),n=a.n(s);t["default"]=n.a},c657:function(e,t,a){"use strict";var s=a("f412"),n=a.n(s);t["default"]=n.a},cf2c:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Add User":"添加用户","Leave blank when not changing":"不修改時請留空","Only alphabets, numbers and underscore are allowed":"只能包含大小寫英文、數字及下劃線","Password":"密碼","Please input name":"請輸入名稱","Please input password":"請輸入密碼","Please input username":"請輸入登錄賬號","Setup User":"配置用户","User created":"用户已創建","User saved":"用户已保存","Username":"登錄賬號"}}'),delete e.options._Ctor}},dd01:function(e,t,a){"use strict";var s=a("707d"),n=a.n(s);t["default"]=n.a},e022:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Add User":"新增使用者","Leave blank when not changing":"不修改時請留空","Only alphabets, numbers and underscore are allowed":"只能包含大小寫英文、數字及下劃線","Password":"密碼","Please input name":"請輸入名稱","Please input password":"請輸入密碼","Please input username":"請輸入登入賬號","Setup User":"配置使用者","User created":"使用者已建立","User saved":"使用者已儲存","Username":"登入賬號"}}'),delete e.options._Ctor}},f0af:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Session":"会话","User disabled":"用户已禁用","User enabled":"用户已启用","No User has ever been added":"从未添加过任何用户","Are you sure you want to disable the User?":"是否确认禁用此用户？","Add members to allow other users to use the platform":"添加成员，允许其他用户使用本平台","sessionCount":"{n} 个会话","lastAccess":"{t}访问"}}'),delete e.options._Ctor}},f367:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-TW":{"Add members to allow other users to use the platform":"新增成員，允許其他使用者使用本平臺","Are you sure you want to disable the User?":"是否確認禁用此使用者？","No User has ever been added":"從未新增過任何使用者","Session":"會話","User disabled":"使用者已禁用","User enabled":"使用者已啟用","lastAccess":"{t}訪問","sessionCount":"{n} 個會話"}}'),delete e.options._Ctor}},f412:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-HK":{"Add members to allow other users to use the platform":"添加成員，允許其他用户使用本平台","Are you sure you want to disable the User?":"是否確認禁用此用户？","No User has ever been added":"從未添加過任何用户","Session":"會話","User disabled":"用户已禁用","User enabled":"用户已啓用","lastAccess":"{t}訪問","sessionCount":"{n} 個會話"}}'),delete e.options._Ctor}},fbd0:function(e,t,a){"use strict";a.r(t);a("b0c0");var s=function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("div",{staticClass:"common-page-header"},[t("h1",[e._v(e._s(e.$t("User Manage")))]),e._v(" "),t("div",{staticClass:"header-control"},[t("FuzzySearchInput",{attrs:{dataFilter:e.dataFilter}}),e._v(" "),e.$store.getters.isAdmin?t("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(t){return e.openSetup(null,"add")}}},[t("i",{staticClass:"fa fa-fw fa-plus"}),e._v("\n            "+e._s(e.$t("New"))+"\n          ")]):e._e()],1)])]),e._v(" "),t("el-main",{staticClass:"common-table-container"},[e.T.isNothing(e.data)?t("div",{staticClass:"no-data-area"},[e.T.isPageFiltered()?t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-search"}),e._v(e._s(e.$t("No matched data found")))]):t("h1",{staticClass:"no-data-title"},[t("i",{staticClass:"fa fa-fw fa-info-circle"}),e._v(e._s(e.$t("No User has ever been added")))]),e._v(" "),t("p",{staticClass:"no-data-tip"},[e._v("\n          "+e._s(e.$t("Add members to allow other users to use the platform"))+"\n        ")])]):t("el-table",{staticClass:"common-table",attrs:{height:"100%",data:e.data,"row-class-name":e.T.getHighlightRowCSS}},[t("el-table-column",{attrs:{label:e.$t("Username"),width:"300"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("code",{staticClass:"text-main"},[e._v(e._s(a.row.username))]),e._v(" "),t("CopyButton",{attrs:{content:a.row.username}})]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Name"),width:"300"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("span",[e._v(e._s(a.row.name))])]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Email"),width:"300"},scopedSlots:e._u([{key:"default",fn:function(a){return[t("span",[e._v(e._s(a.row.email))])]}}])}),e._v(" "),t("el-table-column"),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Session"),width:"350"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.sessions.length>0?[a.row.sessions[0].idle<900?t("span",{staticClass:"text-good"},[t("i",{staticClass:"fa fa-fw fa-circle"}),e._v(" "+e._s(e.$t("Online")))]):t("span",{staticClass:"text-watch"},[t("i",{staticClass:"fa fa-fw fa-circle"}),e._v(" "+e._s(e.$t("Idle")))]),e._v(" "),a.row.sessions.length>1?t("el-tooltip",{attrs:{effect:"dark",placement:"right"}},[t("div",{attrs:{slot:"content"},slot:"content"},e._l(a.row.sessions,(function(a,s){return t("div",[e._v("\n                    "+e._s(e.$t("Session"))+" "),t("code",{staticClass:"code-font"},[e._v("#"+e._s(s+1))]),e._v(e._s(e.$t(":"))+"\n                    "+e._s(e.$t("lastAccess",{t:e.T.fromNow(1e3*(e.T.getTimestamp()-a.idle))}))+"\n                  ")])})),0),e._v(" "),t("span",{staticClass:"text-info"},[e._v("\n                  "+e._s(e.$t("("))+e._s(e.$tc("sessionCount",a.row.sessions.length))+e._s(e.$t(")"))+"\n                ")])]):e._e(),e._v(" "),t("br"),e._v(" "),t("i",{staticClass:"fa fa-fw fa-mouse-pointer"}),e._v("\n              "+e._s(e.$t("lastAccess",{t:e.T.fromNow(1e3*(e.T.getTimestamp()-a.row.sessions[0].idle))}))+"\n            ")]:[t("span",{staticClass:"text-info"},[t("i",{staticClass:"fa fa-fw fa-circle"}),e._v("\n                "+e._s(e.$t("Offline"))+"\n              ")])]]}}])}),e._v(" "),t("el-table-column",{attrs:{label:e.$t("Status"),width:"100"},scopedSlots:e._u([{key:"default",fn:function(a){return[a.row.isDisabled?t("span",{staticClass:"text-bad"},[t("i",{staticClass:"fa fa-fw fa-ban"}),e._v(" "+e._s(e.$t("Disabled")))]):t("span",{staticClass:"text-good"},[t("i",{staticClass:"fa fa-fw fa-check"}),e._v(" "+e._s(e.$t("Enabled")))])]}}])}),e._v(" "),t("el-table-column",{attrs:{align:"right",width:"200"},scopedSlots:e._u([{key:"default",fn:function(a){return[Array.isArray(a.row.roles)&&a.row.roles.indexOf("sa")>=0?t("span",{staticClass:"text-bad"},[e._v(e._s(e.$t("Administrator")))]):e.$store.getters.isAdmin?[a.row.isDisabled?t("el-link",{on:{click:function(t){return e.quickSubmitData(a.row,"enable")}}},[e._v(e._s(e.$t("Enable")))]):t("el-link",{on:{click:function(t){return e.quickSubmitData(a.row,"disable")}}},[e._v(e._s(e.$t("Disable")))]),e._v(" "),t("el-link",{on:{click:function(t){return e.openSetup(a.row,"setup")}}},[e._v(e._s(e.$t("Setup")))])]:e._e()]}}])})],1)],1),e._v(" "),t("UserSetup",{ref:"setup"})],1)],1)},n=[],r=a("c7eb"),o=a("1da1"),i=(a("130f"),function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"ScriptSetSetup",visible:e.show,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"750px"},on:{"update:visible":function(t){e.show=t}}},[t("template",{slot:"title"},[e._v("\n    "+e._s(e.pageTitle)+" "),t("code",{staticClass:"text-main"},[e._v(e._s(e.data.name||e.data.username))])]),e._v(" "),t("el-container",{attrs:{direction:"vertical"}},[t("el-main",[t("div",{staticClass:"setup-form"},[t("el-form",{ref:"form",attrs:{"label-width":"135px",model:e.form,rules:e.formRules}},[t("el-form-item",{staticStyle:{height:"0",overflow:"hidden"}},[t("input",{attrs:{tabindex:"-1",type:"text",name:"username"}}),e._v(" "),t("input",{attrs:{tabindex:"-1",type:"password",name:"password"}})]),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Username"),prop:"username"}},[t("el-input",{attrs:{disabled:"setup"===e.pageMode,maxlength:"60"},model:{value:e.form.username,callback:function(t){e.$set(e.form,"username",t)},expression:"form.username"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Name"),prop:"name"}},[t("el-input",{attrs:{maxlength:"200"},model:{value:e.form.name,callback:function(t){e.$set(e.form,"name",t)},expression:"form.name"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Email"),prop:"email"}},[t("el-input",{model:{value:e.form.email,callback:function(t){e.$set(e.form,"email",t)},expression:"form.email"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Password"),prop:"password"}},[t("el-input",{attrs:{placeholder:e.passwordPlaceholder,maxlength:"100","show-password":""},model:{value:e.form.password,callback:function(t){e.$set(e.form,"password",t)},expression:"form.password"}})],1),e._v(" "),t("el-form-item",{staticClass:"setup-footer"},[t("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)],1)],1)])],1)],2)}),l=[],u=(a("b64b"),a("d3b7"),a("159b"),{name:"UserSetup",components:{},watch:{show:function(e){e&&this.$refs.form&&this.$refs.form.clearValidate(),e||this.$root.$emit("reload.userList")}},methods:{loadData:function(e){var t=this;return Object(o["a"])(Object(r["a"])().mark((function a(){var s,n;return Object(r["a"])().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(e){a.next=6;break}t.pageMode="add",t.T.jsonClear(t.form),t.data={},a.next=17;break;case 6:return t.pageMode="setup",t.data.id=e,a.next=10,t.T.callAPI_getOne("/api/v1/users/do/list",t.data.id);case 10:if(s=a.sent,s&&s.ok){a.next=13;break}return a.abrupt("return");case 13:t.data=s.data,n={},Object.keys(t.form).forEach((function(e){return n[e]=t.data[e]})),t.form=n;case 17:t.formRules["password"][0].required=!e,t.show=!0;case 19:case"end":return a.stop()}}),a)})))()},submitData:function(){var e=this;return Object(o["a"])(Object(r["a"])().mark((function t(){return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.pageMode,t.next="add"===t.t1?11:"setup"===t.t1?14:17;break;case 11:return t.next=13,e.addData();case 13:return t.abrupt("return",t.sent);case 14:return t.next=16,e.modifyData();case 16:return t.abrupt("return",t.sent);case 17:case"end":return t.stop()}}),t,null,[[0,5]])})))()},addData:function(){var e=this;return Object(o["a"])(Object(r["a"])().mark((function t(){var a,s;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.T.jsonCopy(e.form),a.roles=["user"],t.next=4,e.T.callAPI("post","/api/v1/users/do/add",{body:{data:a},alert:{okMessage:e.$t("User created")}});case 4:if(s=t.sent,s&&s.ok){t.next=7;break}return t.abrupt("return");case 7:e.$store.commit("updateHighlightedTableDataId",s.data.id),e.show=!1;case 9:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(o["a"])(Object(r["a"])().mark((function t(){var a,s;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.T.jsonCopy(e.form),e.T.isNothing(a.password)&&delete a.password,t.next=4,e.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.data.id},body:{data:a},alert:{okMessage:e.$t("User saved")}});case 4:if(s=t.sent,s&&s.ok){t.next=7;break}return t.abrupt("return");case 7:e.$store.commit("updateHighlightedTableDataId",s.data.id),e.show=!1;case 9:case"end":return t.stop()}}),t)})))()}},computed:{pageTitle:function(){var e={setup:this.$t("Setup User"),add:this.$t("Add User")};return e[this.pageMode]},passwordPlaceholder:function(){return"add"===this.pageMode?"":this.$t("Leave blank when not changing")}},props:{},data:function(){return{show:!1,pageMode:null,data:{},form:{username:null,name:null,email:null,password:null},formRules:{username:[{trigger:"blur",message:this.$t("Please input username"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g}],name:[{trigger:"blur",message:this.$t("Please input name"),required:!0}],password:[{trigger:"blur",message:this.$t("Please input password"),required:!1}]}}}}),c=u,d=a("2877"),p=a("15f4"),f=a("69b8"),m=a("9027"),b=Object(d["a"])(c,i,l,!1,null,"b64845a6",null);"function"===typeof p["default"]&&Object(p["default"])(b),"function"===typeof f["default"]&&Object(f["default"])(b),"function"===typeof m["default"]&&Object(m["default"])(b);var h=b.exports,_={name:"UserList",components:{UserSetup:h},watch:{$route:{immediate:!0,handler:function(e,t){var a=this;return Object(o["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.loadData();case 2:case"end":return e.stop()}}),e)})))()}},"$store.state.isLoaded":function(e){var t=this;e&&setImmediate((function(){return t.T.autoScrollTable()}))}},methods:{loadData:function(){var e=this;return Object(o["a"])(Object(r["a"])().mark((function t(){var a,s;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=e.dataFilter=e.T.createListQuery({sort:["isDisabled","-seq"]}),t.next=3,e.T.callAPI_get("/api/v1/users/do/list",{query:a});case 3:if(s=t.sent,s&&s.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=s.data,e.$store.commit("updateLoadStatus",!0);case 8:case"end":return t.stop()}}),t)})))()},quickSubmitData:function(e,t){var a=this;return Object(o["a"])(Object(r["a"])().mark((function s(){var n;return Object(r["a"])().wrap((function(s){while(1)switch(s.prev=s.next){case 0:s.t0=t,s.next="disable"===s.t0?3:8;break;case 3:return s.next=5,a.T.confirm(a.$t("Are you sure you want to disable the User?"));case 5:if(s.sent){s.next=7;break}return s.abrupt("return");case 7:return s.abrupt("break",8);case 8:n=null,s.t1=t,s.next="disable"===s.t1?12:"enable"===s.t1?16:20;break;case 12:return s.next=14,a.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.id},body:{data:{isDisabled:!0}},alert:{okMessage:a.$t("User disabled")}});case 14:return n=s.sent,s.abrupt("break",20);case 16:return s.next=18,a.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.id},body:{data:{isDisabled:!1}},alert:{okMessage:a.$t("User enabled")}});case 18:return n=s.sent,s.abrupt("break",20);case 20:if(n&&n.ok){s.next=22;break}return s.abrupt("return");case 22:return a.$store.commit("updateHighlightedTableDataId",e.id),s.next=25,a.loadData();case 25:case"end":return s.stop()}}),s)})))()},openSetup:function(e,t){switch(t){case"add":this.$refs.setup.loadData();break;case"setup":this.$store.commit("updateHighlightedTableDataId",e.id),this.$refs.setup.loadData(e.id);break}}},computed:{},props:{},data:function(){var e=this.T.createListQuery();return{data:[],dataFilter:{_fuzzySearch:e._fuzzySearch}}},created:function(){this.$root.$on("reload.userList",this.loadData)},destroyed:function(){this.$root.$off("reload.userList")}},v=_,w=a("dd01"),g=a("2ead"),$=a("c657"),k=a("a366"),x=Object(d["a"])(v,s,n,!1,null,"710d6e68",null);"function"===typeof w["default"]&&Object(w["default"])(x),"function"===typeof g["default"]&&Object(g["default"])(x),"function"===typeof $["default"]&&Object($["default"])(x),"function"===typeof k["default"]&&Object(k["default"])(x);t["default"]=x.exports}}]);