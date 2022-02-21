(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-66da6a6d"],{"15f4":function(e,t,r){"use strict";var a=r("5c6b"),n=r.n(a);t["default"]=n.a},"55d9":function(e,t,r){"use strict";r.r(t);var a=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("transition",{attrs:{name:"fade"}},[r("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[r("el-header",{attrs:{height:"60px"}},[r("h1",[e._v(e._s(e.pageTitle)+" "),r("code",{staticClass:"text-main"},[e._v(e._s(e.data.name||e.data.username))])])]),e._v(" "),r("el-main",[r("el-row",{attrs:{gutter:20}},[r("el-col",{attrs:{span:15}},[r("div",{staticClass:"common-form"},[r("el-form",{ref:"form",attrs:{"label-width":"120px",model:e.form,rules:e.formRules}},[r("el-form-item",{attrs:{label:e.$t("Username"),prop:"username"}},[r("el-input",{attrs:{maxlength:"20","show-word-limit":""},model:{value:e.form.username,callback:function(t){e.$set(e.form,"username",t)},expression:"form.username"}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Name"),prop:"name"}},[r("el-input",{attrs:{maxlength:"40","show-word-limit":""},model:{value:e.form.name,callback:function(t){e.$set(e.form,"name",t)},expression:"form.name"}})],1),e._v(" "),r("el-form-item",{attrs:{label:e.$t("Password"),prop:"password"}},[r("el-input",{attrs:{placeholder:e.passwordPlaceholder,maxlength:"100","show-password":""},model:{value:e.form.password,callback:function(t){e.$set(e.form,"password",t)},expression:"form.password"}})],1),e._v(" "),r("el-form-item",[r("div",{staticClass:"setup-right"},[r("el-button",{directives:[{name:"prevent-re-click",rawName:"v-prevent-re-click"}],attrs:{type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Save")))])],1)])],1)],1)]),e._v(" "),r("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1)],1)],1)},n=[],s=r("1da1"),o=(r("d3b7"),r("159b"),r("b64b"),r("96cf"),{name:"UserSetup",components:{},watch:{$route:{immediate:!0,handler:function(e,t){var r=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.loadData();case 2:e.t0=r.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?8:9;break;case 5:return r.T.jsonClear(r.form),r.data={},e.abrupt("break",9);case 8:return e.abrupt("break",9);case 9:case"end":return e.stop()}}),e)})))()}}},methods:{loadData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=10;break}return t.next=3,e.T.callAPI_getOne("/api/v1/users/do/list",e.$route.params.id);case 3:if(r=t.sent,r.ok){t.next=6;break}return t.abrupt("return");case 6:e.data=r.data,a={},Object.keys(e.form).forEach((function(t){return a[t]=e.data[t]})),e.form=a;case 10:"add"===e.T.setupPageMode()&&(e.formRules["password"][0].required=!0),e.$store.commit("updateLoadStatus",!0);case 12:case"end":return t.stop()}}),t)})))()},submitData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.$refs.form.validate();case 3:t.next=8;break;case 5:return t.prev=5,t.t0=t["catch"](0),t.abrupt("return",console.error(t.t0));case 8:t.t1=e.T.setupPageMode(),t.next="add"===t.t1?11:"setup"===t.t1?14:17;break;case 11:return t.next=13,e.addData();case 13:return t.abrupt("return",t.sent);case 14:return t.next=16,e.modifyData();case 16:return t.abrupt("return",t.sent);case 17:case"end":return t.stop()}}),t,null,[[0,5]])})))()},addData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return r=e.T.jsonCopy(e.form),r.roles=["user"],t.next=4,e.T.callAPI("post","/api/v1/users/do/add",{body:{data:r},alert:{okMessage:e.$t("User created")}});case 4:if(a=t.sent,a.ok){t.next=7;break}return t.abrupt("return");case 7:e.$router.push({name:"user-list",query:e.T.getPrevQuery()});case 8:case"end":return t.stop()}}),t)})))()},modifyData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var r,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return r=e.T.jsonCopy(e.form),e.T.isNothing(r.password)&&delete r.password,t.next=4,e.T.callAPI("post","/api/v1/users/:id/do/modify",{params:{id:e.$route.params.id},body:{data:r},alert:{okMessage:e.$t("User saved")}});case 4:if(a=t.sent,a.ok){t.next=7;break}return t.abrupt("return");case 7:e.$router.push({name:"user-list",query:e.T.getPrevQuery()});case 8:case"end":return t.stop()}}),t)})))()}},computed:{formRules:function(){return{username:[{trigger:"change",message:this.$t("Please input username"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g}],name:[{trigger:"change",message:this.$t("Please input name"),required:!0}],password:[{trigger:"change",message:this.$t("Please input password"),required:!1}]}},pageTitle:function(){var e={setup:this.$t("Setup User"),add:this.$t("Add User")};return e[this.T.setupPageMode()]},passwordPlaceholder:function(){return"add"===this.T.setupPageMode()?"":this.$t("Leave blank when not changing")}},props:{},data:function(){return{data:{},form:{username:null,name:null,password:null}}}}),u=o,i=r("2877"),c=r("15f4"),d=Object(i["a"])(u,a,n,!1,null,"eae2a374",null);"function"===typeof c["default"]&&Object(c["default"])(d);t["default"]=d.exports},"5c6b":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add User":"添加用户","Setup User":"配置用户","Username":"登录账号","Password":"密码","Leave blank when not changing":"不修改时请留空","User created":"用户已创建","User saved":"用户已保存","Please input username":"请输入登录账号","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Please input name":"请输入名称","Please input password":"请输入密码"}}'),delete e.options._Ctor}}}]);