(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0e3a0bd6"],{2216:function(e,t,a){},"6f0d":function(e,t,a){},"704e":function(e,t,a){"use strict";var n=a("f077"),r=a.n(n);t["default"]=r.a},"716b":function(e,t,a){"use strict";a("da4c")},"9d4c":function(e,t,a){"use strict";a("6f0d")},d4ab:function(e,t,a){"use strict";var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"captcha-image"},[a("div",{domProps:{innerHTML:e._s(e.captchaImageRaw)}})])},r=[],s=a("1da1"),i=(a("96cf"),{name:"CaptchaImage",components:{},watch:{captchaToken:{immediate:!0,handler:function(e,t){var a=this;return Object(s["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,a.showCaptchaImage();case 2:case"end":return e.stop()}}),e)})))()}}},methods:{showCaptchaImage:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(e.captchaToken){t.next=2;break}return t.abrupt("return");case 2:return a={captchaToken:e.captchaToken},e.captchaCategory&&(a.captchaCategory=e.captchaCategory),t.next=6,e.T.callAPI_get(e.captchaUrl,{respType:"text",query:a});case 6:n=t.sent,e.captchaImageRaw=n||"";case 8:case"end":return t.stop()}}),t)})))()}},computed:{},props:{captchaCategory:String,captchaToken:String,captchaUrl:{type:String,default:"/api/v1/captcha/do/get"}},data:function(){return{captchaImageRaw:""}},created:function(){}}),c=i,o=(a("9d4c"),a("2877")),u=Object(o["a"])(c,n,r,!1,null,"eee2afa2",null);t["a"]=u.exports},d504:function(e,t,a){"use strict";a.r(t);var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"sign-in",on:{click:function(t){return t.stopPropagation(),e.useBuiltinAuth.apply(null,arguments)}}},[a("div",{staticClass:"sign-in-area"},[a("Logo",{staticClass:"logo",attrs:{type:"auto",width:"400px",height:"70px"}}),e._v(" "),a("div",{staticClass:"sign-in-panel"},[a("el-form",{ref:"form",staticClass:"sign-in-form",attrs:{model:e.form,rules:e.formRules}},[e.signInFuncs?a("el-form-item",{attrs:{prop:"funcId"}},[a("el-select",{attrs:{placeholder:e.$t("Please select sign in method")},model:{value:e.form.funcId,callback:function(t){e.$set(e.form,"funcId",t)},expression:"form.funcId"}},[a("i",{staticClass:"fth-man-icon fth-man-icon-integration",attrs:{slot:"prefix"},slot:"prefix"}),e._v(" "),a("el-option",{attrs:{label:e.$t("DataFlux Func builtin user"),value:e.BUILTIN_SIGN_IN_FUNC_ID}}),e._v(" "),e._l(e.signInFuncs,(function(e){return a("el-option",{key:e.id,attrs:{label:e.name,value:e.id}})}))],2)],1):e._e(),e._v(" "),a("el-form-item",{attrs:{prop:"username"}},[a("el-input",{attrs:{tabindex:"1",maxlength:"100",placeholder:e.$t("Username")},model:{value:e.form.username,callback:function(t){e.$set(e.form,"username",t)},expression:"form.username"}},[a("i",{staticClass:"fth-man-icon fth-man-icon-account-number",attrs:{slot:"prefix"},slot:"prefix"})])],1),e._v(" "),a("el-form-item",{attrs:{prop:"password",error:e.respError.password}},[a("el-input",{attrs:{tabindex:"2",maxlength:"100","show-password":"",placeholder:e.$t("Password")},model:{value:e.form.password,callback:function(t){e.$set(e.form,"password",t)},expression:"form.password"}},[a("i",{staticClass:"fth-man-icon fth-man-icon-password",attrs:{slot:"prefix"},slot:"prefix"})])],1),e._v(" "),a("el-form-item",{attrs:{_captcha:"",prop:"captcha",error:e.respError.captcha}},[a("el-input",{attrs:{tabindex:"3",maxlength:4,clearable:!0,placeholder:e.$t("Captcha")},nativeOn:{keyup:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.submitData.apply(null,arguments)}},model:{value:e.form.captcha,callback:function(t){e.$set(e.form,"captcha",t)},expression:"form.captcha"}},[a("i",{staticClass:"fth-man-icon fth-man-icon-verification-code",attrs:{slot:"prefix"},slot:"prefix"})]),e._v(" "),a("CaptchaImage",{attrs:{"captcha-category":"signIn","captcha-token":e.form.captchaToken},nativeOn:{click:function(t){return e.refreshCaptcha(!0)}}})],1),e._v(" "),a("el-button",{attrs:{tabindex:"4",type:"primary"},on:{click:e.submitData}},[e._v(e._s(e.$t("Sign In")))]),e._v(" "),a("el-form-item")],1)],1)],1)])},r=[],s=a("1da1"),i=(a("d3b7"),a("25f0"),a("96cf"),a("d4ab")),c={name:"Index",components:{CaptchaImage:i["a"]},watch:{},methods:{submitData:function(){var e=this;return Object(s["a"])(regeneratorRuntime.mark((function t(){var a,n,r,s,i;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.submitFailed=!1,t.prev=1,t.next=4,e.$refs.form.validate();case 4:t.next=9;break;case 6:return t.prev=6,t.t0=t["catch"](1),t.abrupt("return",console.error(t.t0));case 9:return e.T.jsonClear(e.respError),a=e.T.jsonCopy(e.form),n=null,r={captchaToken:a.captchaToken,captcha:a.captcha,signIn:{username:a.username,password:a.password}},e.isBuiltInSignIn?n="/api/v1/auth/do/sign-in":(n="/api/v1/func/integration/sign-in",r.signIn.funcId=a.funcId),t.next=16,e.T.callAPI("post",n,{body:r,alert:{muteError:!0}});case 16:if(s=t.sent,s.ok){t.next=38;break}e.refreshCaptcha(),t.t1=s.reason,t.next="EUserPassword"===t.t1?22:"EUserCaptcha"===t.t1?24:"EUserDisabled"===t.t1?26:"EFuncResultParsingFailed"===t.t1?28:"EFuncFailed.SignInFuncRaisedException"===t.t1?30:"EFuncFailed.SignInFuncTimeout"===t.t1?32:"EFuncFailed.SignInFuncReturnedFalseOrNothing"===t.t1?34:36;break;case 22:return e.respError.password=e.$t("Invalid username or password"),t.abrupt("break",36);case 24:return e.respError.captcha=e.$t("Invalid captcha"),t.abrupt("break",36);case 26:return e.respError.captcha=e.$t("User has been disabled"),t.abrupt("break",36);case 28:return e.respError.captcha=e.$t("Integration sign-in func returned an unexpected value, please contact admin"),t.abrupt("break",36);case 30:return e.respError.captcha=s.message||e.$t("Sign in failed. Error occured in integration sign-in func, please concat admin"),t.abrupt("break",36);case 32:return e.respError.captcha=e.$t("Sign in failed. Integration sign-in func timeout, please concat admin"),t.abrupt("break",36);case 34:return e.respError.captcha=e.$t("Sign in failed. Integration sign-in func returned `False` or empty value, please concat admin"),t.abrupt("break",36);case 36:return e.submitFailed=!0,t.abrupt("return");case 38:e.$refs.form.resetFields(),i=s.data.xAuthToken,e.$store.commit("updateXAuthToken",i),e.$store.dispatch("reloadUserProfile");case 42:case"end":return t.stop()}}),t,null,[[1,6]])})))()},useBuiltinAuth:function(){this.useBuiltinAuthWish++>20&&this.T._switchToBuiltinAuth()},refreshCaptcha:function(e){this.useBuiltinAuthWish=0,this.form.captchaToken=Math.random().toString(),e&&(this.form.captcha="")}},computed:{BUILTIN_SIGN_IN_FUNC_ID:function(){return"builtIn"},signInFuncs:function(){return this.$store.getters.CONFIG("_INTEGRATED_SIGN_IN_FUNC")},isBuiltInSignIn:function(){return this.T.isNothing(this.signInFuncs)||this.form.funcId===this.BUILTIN_SIGN_IN_FUNC_ID},formRules:function(){return{username:[{trigger:"change",message:this.$t("Please input username"),required:!0}],password:[{trigger:"change",message:this.$t("Please input password"),required:!0}],captcha:[{trigger:"change",message:this.$t("Please input captcha"),required:!0},{trigger:"change",message:this.$t("Captcha should be a 4-digit number"),length:4,pattern:/^\d{4}$/g}]}}},props:{},data:function(){return{useBuiltinAuthWish:0,respError:{password:null,captcha:null},form:{captchaToken:null,captcha:null,funcId:"builtIn",username:null,password:null},submitFailed:!1}},created:function(){this.refreshCaptcha(!0)}},o=c,u=(a("db1f"),a("716b"),a("2877")),p=a("704e"),l=Object(u["a"])(o,n,r,!1,null,"6f393bba",null);"function"===typeof p["default"]&&Object(p["default"])(l);t["default"]=l.exports},da4c:function(e,t,a){},db1f:function(e,t,a){"use strict";a("2216")},f077:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Please select sign in method":"请选择登录方式","DataFlux Func builtin user":"DataFlux Func 内置用户","Username":"请输入账号","Password":"请输入密码","Captcha":"请输入验证码","Sign In":"登录","Please input username":"请输入用户名","Please input password":"请输入密码","Please input captcha":"请输入验证码","Captcha should be a 4-digit number":"验证码为4位数字","Invalid username or password":"用户名或密码错误","Invalid captcha":"验证码错误或无效","User has been disabled":"当前用户已被禁用","Integration sign-in func returned an unexpected value, please contact admin":"集成登录函数返回了未预期的结果，请联系系统管理员","Sign in failed. Error occured in integration sign-in func, please concat admin":"登录失败。集成登录函数抛出异常，请联系系统管理员","Sign in failed. Integration sign-in func timeout, please concat admin":"登录失败，集成登录函数超时，请联系系统管理员","Sign in failed. Integration sign-in func returned `False` or empty value, please concat admin":"登录失败，集成登录函数返回`False`或空内容，请联系系统管理员"}}'),delete e.options._Ctor}}}]);