(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-1b299fd8"],{"129f":function(e,t){e.exports=Object.is||function(e,t){return e===t?0!==e||1/e===1/t:e!=e&&t!=t}},"1dec":function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Add Connector":"添加连接器","Setup Connector":"配置连接器","Compatibility":"兼容性","Guance Node":"观测云节点","Name in Guance":"观测云中名称","OpenAPI URL":"OpenAPI 地址","WebSocket URL":"WebSocket 地址","OpenWay URL":"OpenWay 地址","API Key ID":"API Key ID","API Key":"API Key","Host":"主机","Port":"端口","Servers":"服务器列表","Protocol":"协议","Source":"源","Database":"数据库","User":"用户","Password":"密码","Charset":"编码","Client ID":"客户端 ID","Group ID":"分组 ID","Security Protocol":"安全协议","SASL Mechanisms":"SASL 机制","Multi Sub":"多订阅器","Sub Offset":"订阅 Offset","Topic/Handler":"主题 / 处理函数","Topic":"主题","Handler Func":"处理函数","No Recent Message":"无近期消息","Recent Message:":"近期消息：","Add Topic / Handler":"添加主题 / 处理函数","Test connection":"测试连通性","Save without connection test":"保存（忽略连通性测试）","For distinguishing the different DataFlux Func":"在观测云中展示的名称，用于区分不同的 DataFlux Func","Servers to connect (e.g. host1:80,host2:81)":"连接地址列表，如：host1:80,host2:81","Password here is always required when the Connector requires password to connect":"如连接器需要密码，则每次修改都必须重新输入密码","API Key here is always required":"每次修改都必须重新输入 API Key","1. $share/GROUP/TOPIC in MQTTv5":"1. MQTTv5 的 $share/GROUP/TOPIC","2. $queue/TOPIC in EMQX":"2. EMQX 的 $queue/TOPIC","Please input ID":"请输入ID","Only alphabets, numbers and underscore are allowed":"只能包含大小写英文、数字及下划线","Cannot not starts with a number":"不得以数字开头","Please input Connector type":"请选择连接器类型","Please select Guance Node":"请选择观测云节点","Please input the name of this DataFlux Func in Guance":"请输入本 DataFlux Func 在观测云中的名称","Please input OpenAPI URL":"请输入 OpenAPI 地址","Please input Websocket URL":"请输入 WebSocket 地址","Please input OpenWay URL":"请输入 OpenWay 地址","Please input API Key ID":"请输入 API Key ID","Please input API Key":"请输入 API Key","Should start with http:// or https://":"必须以 http:// 或 https:// 开头","Please input host":"请输入主机地址","Please input port":"请输入主机端口","Only integer between 1 and 65535 are allowed":"主机端口范围为 1-65535","Please input servers":"请输入服务器列表","Please select HTTP protocol":"请选择HTTP协议","Only HTTP and HTTPS are allowed":"协议只能为HTTP或HTTPS","Please input source":"请输入连接器名称","Please input database":"请输入数据库名","Please input user":"请输入用户名","Please input password":"请输入密码","Please input charset":"请输入字符集","Please input Access Key":"请输入Access Key","Please input Secret Key":"请输入Secret Key","Please input client ID":"请输入客户端ID","Please input topic":"请输入订阅主题","Please select handler Func":"请选择处理函数","Connector created":"连接器已创建","Connector saved":"连接器已保存","Connector deleted":"连接器已删除","Are you sure you want to delete the Connector?":"是否确认删除此连接器？","This is a built-in Connector, please contact the admin to change the config":"当前连接器为内置连接器，请联系管理员调整集群配置"}}'),delete e.options._Ctor}},"1ff2":function(e,t,n){"use strict";n("5721")},"22d3":function(e,t,n){"use strict";n.r(t);var a=n("ade3"),o=(n("a4d3"),n("e01a"),n("b0c0"),n("99af"),function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"fade"}},[t("el-container",{directives:[{name:"show",rawName:"v-show",value:e.$store.state.isLoaded,expression:"$store.state.isLoaded"}],attrs:{direction:"vertical"}},[t("el-header",{attrs:{height:"60px"}},[t("h1",[e._v(e._s(e.pageTitle)+" "),t("code",{staticClass:"text-main"},[e._v(e._s(e.data.title||e.data.id))])])]),e._v(" "),t("el-main",[t("el-row",{attrs:{gutter:20}},[t("el-col",{attrs:{span:15}},[t("div",{staticClass:"common-form"},[t("el-form",{ref:"form",attrs:{"label-width":"135px",model:e.form,disabled:e.data.isBuiltin,rules:e.formRules}},[t("el-form-item",{staticStyle:{height:"0",overflow:"hidden"}},[t("input",{attrs:{tabindex:"-1",type:"text",name:"username"}}),e._v(" "),t("input",{attrs:{tabindex:"-1",type:"password",name:"password"}})]),e._v(" "),e.data.isBuiltin?t("el-form-item",[t("InfoBlock",{attrs:{type:"error",title:e.$t("This is a built-in Connector, please contact the admin to change the config")}})],1):e._e(),e._v(" "),"add"===e.T.setupPageMode()?t("el-form-item",{attrs:{label:e.$t("Type"),prop:"type"}},[t("el-select",{attrs:{filterable:"","filter-method":e.T.debounce(e.doFilter)},on:{change:e.switchType},model:{value:e.form.type,callback:function(t){e.$set(e.form,"type",t)},expression:"form.type"}},e._l(e.selectShowOptions,(function(e){return t("el-option",{key:e.key,attrs:{label:e.fullName,value:e.key}})})),1)],1):t("el-form-item",{attrs:{label:e.$t("Type")}},[t("el-select",{attrs:{disabled:!0},model:{value:e.selectedType,callback:function(t){e.selectedType=t},expression:"selectedType"}},[t("el-option",{attrs:{label:e.C.CONNECTOR_MAP.get(e.selectedType).fullName,value:e.selectedType}})],1)],1),e._v(" "),e.selectedType?[e.C.CONNECTOR_MAP.get(e.selectedType).logo?t("el-form-item",[t("el-image",{staticClass:"connector-logo",class:["logo-".concat(e.selectedType)],attrs:{src:e.C.CONNECTOR_MAP.get(e.selectedType).logo}})],1):e._e(),e._v(" "),e.C.CONNECTOR_MAP.get(e.selectedType).tips?t("el-form-item",[t("InfoBlock",{attrs:{type:"info",title:e.C.CONNECTOR_MAP.get(e.selectedType).tips}})],1):e._e(),e._v(" "),e.T.notNothing(e.C.CONNECTOR_MAP.get(e.selectedType).compatibleDBs)?t("el-form-item",{attrs:{label:e.$t("Compatibility")}},e._l(e.C.CONNECTOR_MAP.get(e.selectedType).compatibleDBs,(function(n){return t("el-tag",{key:n,attrs:{type:"info",size:"medium","disable-transitions":!0}},[e._v(e._s(n))])})),1):e._e(),e._v(" "),t("el-form-item",{attrs:{label:"ID",prop:"id"}},[t("el-input",{attrs:{disabled:"setup"===e.T.setupPageMode(),maxlength:"40"},model:{value:e.form.id,callback:function(t){e.$set(e.form,"id",t)},expression:"form.id"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Title")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),maxlength:"50"},model:{value:e.form.title,callback:function(t){e.$set(e.form,"title",t)},expression:"form.title"}})],1),e._v(" "),t("el-form-item",{attrs:{label:e.$t("Description")}},[t("el-input",{attrs:{placeholder:e.$t("Optional"),type:"textarea",resize:"none",autosize:{minRows:2},maxlength:"5000"},model:{value:e.form.description,callback:function(t){e.$set(e.form,"description",t)},expression:"form.description"}})],1),e._v(" "),e.hasConfigField(e.selectedType,"guanceNode")?t("el-form-item",{attrs:{label:e.$t("Guance Node"),prop:"configJSON.guanceNode"}},[t("el-select",{on:{change:e.switchGuanceNode},model:{value:e.form.configJSON.guanceNode,callback:function(t){e.$set(e.form.configJSON,"guanceNode",t)},expression:"form.configJSON.guanceNode"}},e._l(e.guanceNodes,(function(n){return t("el-option",{key:n.key,attrs:{label:n["name_".concat(e.$i18n.locale)]||n.name,value:n.key}})})),1)],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"nameInGuance")?t("el-form-item",{attrs:{label:e.$t("Name in Guance"),prop:"configJSON.nameInGuance"}},[t("el-input",{model:{value:e.form.configJSON.nameInGuance,callback:function(t){e.$set(e.form.configJSON,"nameInGuance",t)},expression:"form.configJSON.nameInGuance"}}),e._v(" "),t("InfoBlock",{attrs:{type:"info",title:e.$t("For distinguishing the different DataFlux Func")}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"guanceOpenAPIURL")?t("el-form-item",{directives:[{name:"show",rawName:"v-show",value:"private"===e.form.configJSON.guanceNode,expression:"form.configJSON.guanceNode === 'private'"}],attrs:{label:e.$t("OpenAPI URL"),prop:"configJSON.guanceOpenAPIURL"}},[t("el-input",{model:{value:e.form.configJSON.guanceOpenAPIURL,callback:function(t){e.$set(e.form.configJSON,"guanceOpenAPIURL",t)},expression:"form.configJSON.guanceOpenAPIURL"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"guanceWebSocketURL")?t("el-form-item",{directives:[{name:"show",rawName:"v-show",value:"private"===e.form.configJSON.guanceNode,expression:"form.configJSON.guanceNode === 'private'"}],attrs:{label:e.$t("WebSocket URL"),prop:"configJSON.guanceWebSocketURL"}},[t("el-input",{model:{value:e.form.configJSON.guanceWebSocketURL,callback:function(t){e.$set(e.form.configJSON,"guanceWebSocketURL",t)},expression:"form.configJSON.guanceWebSocketURL"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"guanceOpenWayURL")?t("el-form-item",{directives:[{name:"show",rawName:"v-show",value:"private"===e.form.configJSON.guanceNode,expression:"form.configJSON.guanceNode === 'private'"}],attrs:{label:e.$t("OpenWay URL"),prop:"configJSON.guanceOpenWayURL"}},[t("el-input",{model:{value:e.form.configJSON.guanceOpenWayURL,callback:function(t){e.$set(e.form.configJSON,"guanceOpenWayURL",t)},expression:"form.configJSON.guanceOpenWayURL"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"guanceAPIKeyId")?t("el-form-item",{attrs:{label:e.$t("API Key ID"),prop:"configJSON.guanceAPIKeyId"}},[t("el-input",{model:{value:e.form.configJSON.guanceAPIKeyId,callback:function(t){e.$set(e.form.configJSON,"guanceAPIKeyId",t)},expression:"form.configJSON.guanceAPIKeyId"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"guanceAPIKey")?t("el-form-item",{attrs:{label:e.$t("API Key"),prop:"configJSON.guanceAPIKey"}},[t("el-input",{attrs:{"show-password":""},model:{value:e.form.configJSON.guanceAPIKey,callback:function(t){e.$set(e.form.configJSON,"guanceAPIKey",t)},expression:"form.configJSON.guanceAPIKey"}}),e._v(" "),"setup"===e.T.setupPageMode()?t("InfoBlock",{attrs:{type:"info",title:e.$t("API Key here is always required")}}):e._e()],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"host")?t("el-form-item",{attrs:{label:e.$t("Host"),prop:"configJSON.host"}},[t("el-input",{on:{blur:e.unpackURL},model:{value:e.form.configJSON.host,callback:function(t){e.$set(e.form.configJSON,"host",t)},expression:"form.configJSON.host"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"port")?t("el-form-item",{attrs:{label:e.$t("Port"),prop:"configJSON.port"}},[t("el-input",{attrs:{min:"0",max:"65535"},model:{value:e.form.configJSON.port,callback:function(t){e.$set(e.form.configJSON,"port",e._n(t))},expression:"form.configJSON.port"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"servers")?t("el-form-item",{attrs:{label:e.$t("Servers"),prop:"configJSON.servers"}},[t("el-input",{attrs:{type:"textarea",resize:"none",autosize:{minRows:2}},model:{value:e.form.configJSON.servers,callback:function(t){e.$set(e.form.configJSON,"servers",t)},expression:"form.configJSON.servers"}}),e._v(" "),t("InfoBlock",{attrs:{type:"info",title:e.$t("Servers to connect (e.g. host1:80,host2:81)")}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"protocol")?t("el-form-item",{attrs:{label:e.$t("Protocol"),prop:"configJSON.protocol"}},[t("el-select",{model:{value:e.form.configJSON.protocol,callback:function(t){e.$set(e.form.configJSON,"protocol",t)},expression:"form.configJSON.protocol"}},[t("el-option",{key:"http",attrs:{label:"HTTP",value:"http"}}),e._v(" "),t("el-option",{key:"https",attrs:{label:"HTTPS",value:"https"}})],1)],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"securityProtocol")?t("el-form-item",{attrs:{label:e.$t("Security Protocol"),prop:"configJSON.securityProtocol"}},[t("el-input",{model:{value:e.form.configJSON.securityProtocol,callback:function(t){e.$set(e.form.configJSON,"securityProtocol",t)},expression:"form.configJSON.securityProtocol"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"saslMechanisms")?t("el-form-item",{attrs:{label:e.$t("SASL Mechanisms"),prop:"configJSON.saslMechanisms"}},[t("el-input",{model:{value:e.form.configJSON.saslMechanisms,callback:function(t){e.$set(e.form.configJSON,"saslMechanisms",t)},expression:"form.configJSON.saslMechanisms"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"source")?t("el-form-item",{attrs:{label:e.$t("Source"),prop:"configJSON.source"}},[t("el-input",{model:{value:e.form.configJSON.source,callback:function(t){e.$set(e.form.configJSON,"source",t)},expression:"form.configJSON.source"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"database")?t("el-form-item",{attrs:{label:e.$t("Database"),prop:"configJSON.database"}},[t("el-input",{model:{value:e.form.configJSON.database,callback:function(t){e.$set(e.form.configJSON,"database",t)},expression:"form.configJSON.database"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"user")?t("el-form-item",{attrs:{label:e.$t("User"),prop:"configJSON.user"}},[t("el-input",{model:{value:e.form.configJSON.user,callback:function(t){e.$set(e.form.configJSON,"user",t)},expression:"form.configJSON.user"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"password")?t("el-form-item",{attrs:{label:e.$t("Password"),prop:"configJSON.password"}},[t("el-input",{attrs:{"show-password":""},model:{value:e.form.configJSON.password,callback:function(t){e.$set(e.form.configJSON,"password",t)},expression:"form.configJSON.password"}}),e._v(" "),e.data.isBuiltin||"setup"!==e.T.setupPageMode()?e._e():t("InfoBlock",{attrs:{type:"info",title:e.$t("Password here is always required when the Connector requires password to connect")}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"charset")?t("el-form-item",{attrs:{label:e.$t("Charset"),prop:"configJSON.charset"}},[t("el-input",{model:{value:e.form.configJSON.charset,callback:function(t){e.$set(e.form.configJSON,"charset",t)},expression:"form.configJSON.charset"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"token")?t("el-form-item",{attrs:{label:"Token",prop:"configJSON.token"}},[t("el-input",{model:{value:e.form.configJSON.token,callback:function(t){e.$set(e.form.configJSON,"token",t)},expression:"form.configJSON.token"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"accessKey")?t("el-form-item",{attrs:{label:"Access Key",prop:"configJSON.accessKey"}},[t("el-input",{model:{value:e.form.configJSON.accessKey,callback:function(t){e.$set(e.form.configJSON,"accessKey",t)},expression:"form.configJSON.accessKey"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"secretKey")?t("el-form-item",{attrs:{label:"Secret Key",prop:"configJSON.secretKey"}},[t("el-input",{attrs:{"show-password":""},model:{value:e.form.configJSON.secretKey,callback:function(t){e.$set(e.form.configJSON,"secretKey",t)},expression:"form.configJSON.secretKey"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"clientId")?t("el-form-item",{attrs:{label:e.$t("Client ID"),prop:"configJSON.clientId"}},[t("el-input",{model:{value:e.form.configJSON.clientId,callback:function(t){e.$set(e.form.configJSON,"clientId",t)},expression:"form.configJSON.clientId"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"groupId")?t("el-form-item",{attrs:{label:e.$t("Group ID"),prop:"configJSON.groupId"}},[t("el-input",{model:{value:e.form.configJSON.groupId,callback:function(t){e.$set(e.form.configJSON,"groupId",t)},expression:"form.configJSON.groupId"}})],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"multiSubClient")?t("el-form-item",{attrs:{label:e.$t("Multi Sub"),prop:"configJSON.multiSubClient"}},[t("el-select",{model:{value:e.form.configJSON.multiSubClient,callback:function(t){e.$set(e.form.configJSON,"multiSubClient",t)},expression:"form.configJSON.multiSubClient"}},[t("el-option",{key:"enabled",attrs:{label:e.$t("Enabled"),value:!0}}),e._v(" "),t("el-option",{key:"disabled",attrs:{label:e.$t("Disabled"),value:!1}})],1)],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"kafkaSubOffset")?t("el-form-item",{attrs:{label:e.$t("Sub Offset"),prop:"configJSON.kafkaSubOffset"}},[t("el-select",{model:{value:e.form.configJSON.kafkaSubOffset,callback:function(t){e.$set(e.form.configJSON,"kafkaSubOffset",t)},expression:"form.configJSON.kafkaSubOffset"}},[t("el-option",{key:"smallest",attrs:{label:"smallest",value:"smallest"}}),e._v(" "),t("el-option",{key:"earliest",attrs:{label:"earliest",value:"earliest"}}),e._v(" "),t("el-option",{key:"beginning",attrs:{label:"beginning",value:"beginning"}}),e._v(" "),t("el-option",{key:"largest",attrs:{label:"largest",value:"largest"}}),e._v(" "),t("el-option",{key:"latest",attrs:{label:"latest",value:"latest"}}),e._v(" "),t("el-option",{key:"end",attrs:{label:"end",value:"end"}})],1)],1):e._e(),e._v(" "),e.hasConfigField(e.selectedType,"topicHandlers")?[t("el-form-item",{staticClass:"config-divider",attrs:{label:e.$t("Topic/Handler")}},[t("el-divider")],1),e._v(" "),e._l(e.form.configJSON.topicHandlers||[],(function(n,o){var s;return[t("el-form-item",{key:"topic-".concat(o),staticClass:"topic-handler",attrs:{label:"#".concat(o+1),prop:"configJSON.topicHandlers.".concat(o,".topic"),rules:e.formRules_topic}},[t("el-input",{attrs:{placeholder:e.$t("Topic")},model:{value:n.topic,callback:function(t){e.$set(n,"topic",t)},expression:"topicHandler.topic"}}),e._v(" "),t("el-link",{attrs:{type:"primary"},on:{click:function(t){return t.preventDefault(),e.removeTopicHandler(o)}}},[e._v(e._s(e.$t("Delete")))])],1),e._v(" "),t("el-form-item",{key:"handler-".concat(o),staticClass:"func-cascader-input",attrs:{prop:"configJSON.topicHandlers.".concat(o,".funcId"),rules:e.formRules_topicHandler}},[t("el-cascader",{ref:"funcCascader",refInFor:!0,attrs:(s={"popper-class":"code-font",placeholder:"--",filterable:"","filter-method":e.common.funcCascaderFilter},Object(a["a"])(s,"placeholder",e.$t("Handler Func")),Object(a["a"])(s,"options",e.funcCascader),Object(a["a"])(s,"props",{expandTrigger:"hover",emitPath:!1,multiple:!1}),s),model:{value:n.funcId,callback:function(t){e.$set(n,"funcId",t)},expression:"topicHandler.funcId"}})],1),e._v(" "),t("el-form-item",{staticClass:"recent-message"},[e.subInfoMap[n.topic]?t("InfoBlock",{attrs:{type:"success",title:"".concat(e.$t("Recent Message:")," ").concat(e.T.getDateTimeString(e.subInfoMap[n.topic].timestampMs,"MM-DD HH:mm:ss")," ","(").concat(e.T.fromNow(e.subInfoMap[n.topic].timestampMs),")")}}):t("InfoBlock",{attrs:{type:"warning",title:e.$t("No Recent Message")}})],1),e._v(" "),t("el-form-item",{staticClass:"config-divider"},[t("el-divider")],1)]})),e._v(" "),t("el-form-item",[t("el-link",{attrs:{type:"primary"},on:{click:e.addTopicHandler}},[t("i",{staticClass:"fa fa-fw fa-plus"}),e._v("\n                      "+e._s(e.$t("Add Topic / Handler"))+"\n                    ")]),e._v(" "),t("br"),e._v(" "),t("el-link",{attrs:{href:"https://func.guance.com/doc/development-guide-connector-subscribe/",target:"_blank"}},[t("i",{staticClass:"fa fa-fw fa-external-link"}),e._v("\n                      "+e._s(e.$t("点击此处了解连接器订阅"))+"\n                    ")])],1)]:e._e()]:e._e()],2),e._v(" "),e.selectedType?t("el-form",{attrs:{"label-width":"120px"}},[t("el-form-item",["setup"!==e.T.setupPageMode()||e.data.isBuiltin?e._e():t("el-button",{on:{click:e.deleteData}},[e._v(e._s(e.$t("Delete")))]),e._v(" "),t("div",{staticClass:"setup-right"},["setup"===e.T.setupPageMode()?t("el-button",{attrs:{disabled:"running"===e.testConnectorResult},on:{click:e.testConnector}},["ok"===e.testConnectorResult?t("i",{staticClass:"fa fa-fw fa-check text-good"}):e._e(),e._v(" "),"ng"===e.testConnectorResult?t("i",{staticClass:"fa fa-fw fa-times text-bad"}):e._e(),e._v(" "),"running"===e.testConnectorResult?t("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}):e._e(),e._v("\n                    "+e._s(e.$t("Test connection"))+"\n                  ")]):e._e(),e._v("\n\n                   \n                  "),e.data.isBuiltin?e._e():t("el-dropdown",{attrs:{"split-button":"",type:"primary",disabled:e.isSaving},on:{click:e.submitData,command:e.submitData}},[e.isSaving?t("i",{staticClass:"fa fa-fw fa-circle-o-notch fa-spin"}):e._e(),e._v("\n                    "+e._s(e.$t("Save"))+"\n                    "),t("el-dropdown-menu",{attrs:{slot:"dropdown"},slot:"dropdown"},[t("el-dropdown-item",{attrs:{command:{skipTest:!0}}},[e._v(e._s(e.$t("Save without connection test")))])],1)],1)],1)],1)],1):e._e()],1)]),e._v(" "),t("el-col",{staticClass:"hidden-md-and-down",attrs:{span:9}})],1)],1),e._v(" "),t("FeatureNoticeDialog",{attrs:{featureKey:"connector.funcIsJustPythonWarpper",description:e.$t("FeatureNotice_funcIsJustPythonWarpper"),icon:"fa-warning",image:e.img_noticeFuncIsJustPythonWrapper}})],1)],1)}),s=[],r=n("c7eb"),i=n("1da1"),c=(n("14d9"),n("13d5"),n("d3b7"),n("498a"),n("3ca3"),n("ddb0"),n("2b3d"),n("9861"),n("ac1f"),n("841c"),n("159b"),n("b64b"),n("d81d"),n("5319"),n("a434"),n("4de4"),n("bc3a")),l=n.n(c),u=n("5a45"),f=n("932a"),p=n.n(f),d={name:"ConnectorSetup",components:{FeatureNoticeDialog:u["a"]},watch:{$route:{immediate:!0,handler:function(e,t){var n=this;return Object(i["a"])(Object(r["a"])().mark((function e(){return Object(r["a"])().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,n.loadData();case 2:e.t0=n.T.setupPageMode(),e.next="add"===e.t0?5:"setup"===e.t0?9:10;break;case 5:return n.T.jsonClear(n.form),n.form.configJSON={},n.data={},e.abrupt("break",10);case 9:return e.abrupt("break",10);case 10:case"end":return e.stop()}}),e)})))()}},selectedType:{immediate:!0,handler:function(e){var t=this;return Object(i["a"])(Object(r["a"])().mark((function n(){var a,o,s;return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:if("guance"!==e){n.next=18;break}return a={headers:{"Cache-Control":"no-cache"}},o=[],n.prev=3,n.next=6,l.a.get("https://func.guance.com/guance-endpoints.json",a);case 6:s=n.sent,o=s.data.endpoints,n.next=12;break;case 10:n.prev=10,n.t0=n["catch"](3);case 12:return n.prev=12,o.push(t.C.GUANCE_PRIVATE_ENDPOINT),"0.0.0"===t.$store.getters.CONFIG("VERSION")&&o.push(t.C.GUANCE_TESTING_ENDPOINT),n.finish(12);case 16:t.guanceNodes=o,t.guanceNodeMap=o.reduce((function(e,t){return e[t.key]=t,e}),{});case 18:case"end":return n.stop()}}),n,null,[[3,10,12,16]])})))()}}},methods:{doFilter:function(e){e=(e||"").toLowerCase().trim(),this.selectShowOptions=e?this.T.filterByKeywords(e,this.SUPPORTED_CONNECTORS):this.SUPPORTED_CONNECTORS},updateValidator:function(e){this.$refs.form&&this.$refs.form.clearValidate();var t=this.C.CONNECTOR_MAP.get(e).configFields;if(t)for(var n in t)if(t.hasOwnProperty(n)){var a=t[n];if(!a)continue;var o=this.formRules["configJSON.".concat(n)];o&&(o[0].required=!!a.isRequired)}},fillDefault:function(e){var t=this.C.CONNECTOR_MAP.get(e).configFields;if(t){var n={};for(var a in t)if(t.hasOwnProperty(a)){var o=t[a];if(!o)continue;this.T.notNothing(o.default)&&(n[a]=o.default)}this.form.configJSON=n}},switchType:function(e){this.fillDefault(e),this.updateValidator(e)},switchGuanceNode:function(e){var t=this.T.jsonCopy(this.form.configJSON),n=this.T.jsonCopy(this.guanceNodeMap[e]);t.guanceOpenAPIURL=n.openapi,t.guanceWebSocketURL=n.websocket,t.guanceOpenWayURL=n.openway,this.form.configJSON=t},unpackURL:function(){if(this.form&&this.form.configJSON&&this.form.configJSON.host){var e=null;try{e=new URL(this.form.configJSON.host)}catch(o){}if(e&&e.hostname!=this.form.configJSON.host){var t=this.C.CONNECTOR_MAP.get(this.selectedType).configFields;if(t){var n=this.T.jsonCopy(this.form.configJSON);t.host&&e.hostname&&(n.host=e.hostname),t.port&&(e.port?n.port=parseInt(e.port):t.protocol&&e.protocol&&(n.port="https"===e.protocol.split(":")[0]?443:80)),t.protocol&&e.protocol&&(n.protocol=e.protocol.split(":")[0]),t.database&&e.pathname&&(n.database=e.pathname.split("/")[0]),t.user&&e.username&&(n.user=e.username),t.password&&e.password&&(n.password=e.password);var a=this.T.getQuery(e.search);switch(this.selectedType){case"df_dataway":t.token&&a.token&&(n.token=a.token);break}this.form.configJSON=n}}}},loadData:function(){var e=this;return Object(i["a"])(Object(r["a"])().mark((function t(){var n,a,o;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:if("setup"!==e.T.setupPageMode()){t.next=14;break}return t.next=3,e.T.callAPI_getOne("/api/v1/connectors/do/list",e.$route.params.id);case 3:if(n=t.sent,n&&n.ok){t.next=6;break}return t.abrupt("return");case 6:return e.data=n.data,a={},Object.keys(e.form).forEach((function(t){return a[t]=e.data[t]})),e.form=a,e.testConnectorResult=null,e.updateValidator(e.data.type),t.next=14,e.updateSubInfo();case 14:return t.next=16,e.common.getFuncList();case 16:o=t.sent,e.funcMap=o.map,e.funcCascader=o.cascader,e.selectShowOptions=e.SUPPORTED_CONNECTORS,e.$store.commit("updateLoadStatus",!0);case 21:case"end":return t.stop()}}),t)})))()},updateSubInfo:function(){var e=this;return Object(i["a"])(Object(r["a"])().mark((function t(){var n,a,o;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(e.$route.params.id){t.next=2;break}return t.abrupt("return");case 2:n=!1;try{n=e.T.notNothing(e.form.configJSON.topicHandlers)}catch(s){}if(n){t.next=6;break}return t.abrupt("return");case 6:return t.next=8,e.T.callAPI_get("/api/v1/connector-sub-info/do/list",{query:{connectorId:e.$route.params.id}});case 8:if(a=t.sent,a&&a.ok){t.next=11;break}return t.abrupt("return");case 11:o=a.data.reduce((function(e,t){return e[t.topic]=t.consumeInfo,e}),{}),e.subInfoMap=o;case 13:case"end":return t.stop()}}),t)})))()},submitData:function(e){var t=this;return Object(i["a"])(Object(r["a"])().mark((function n(){return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.prev=0,n.next=3,t.$refs.form.validate();case 3:n.next=8;break;case 5:return n.prev=5,n.t0=n["catch"](0),n.abrupt("return",console.error(n.t0));case 8:t.isSaving=!0,n.t1=t.T.setupPageMode(),n.next="add"===n.t1?12:"setup"===n.t1?15:18;break;case 12:return n.next=14,t.addData(e);case 14:return n.abrupt("break",18);case 15:return n.next=17,t.modifyData(e);case 17:return n.abrupt("break",18);case 18:setTimeout((function(){t.isSaving=!1}),500);case 19:case"end":return n.stop()}}),n,null,[[0,5]])})))()},_getFromData:function(){var e=this.T.jsonCopy(this.form);if(e.configJSON)for(var t in e.configJSON)this.T.isNothing(e.configJSON[t])&&(e.configJSON[t]=null);return e},addData:function(e){var t=this;return Object(i["a"])(Object(r["a"])().mark((function n(){var a,o;return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return e=e||{},a=t._getFromData(),"string"===typeof a.configJSON.servers&&(a.configJSON.servers=a.configJSON.servers.replace(/\n/g,",").replace(/\s/g,"")),n.next=5,t.T.callAPI("post","/api/v1/connectors/do/add",{body:{data:a,skipTest:!!e.skipTest},alert:{okMessage:t.$t("Connector created")}});case 5:if(o=n.sent,o&&o.ok){n.next=8;break}return n.abrupt("return");case 8:t.$router.push({name:"intro"}),t.$store.commit("updateConnectorListSyncTime");case 10:case"end":return n.stop()}}),n)})))()},modifyData:function(e){var t=this;return Object(i["a"])(Object(r["a"])().mark((function n(){var a,o;return Object(r["a"])().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return e=e||{},a=t._getFromData(),delete a.id,delete a.type,n.next=6,t.T.callAPI("post","/api/v1/connectors/:id/do/modify",{params:{id:t.$route.params.id},body:{data:a,skipTest:!!e.skipTest},alert:{okMessage:t.$t("Connector saved")}});case 6:if(o=n.sent,o&&o.ok){n.next=9;break}return n.abrupt("return");case 9:t.$store.commit("updateConnectorListSyncTime");case 10:case"end":return n.stop()}}),n)})))()},deleteData:function(){var e=this;return Object(i["a"])(Object(r["a"])().mark((function t(){var n;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.T.confirm(e.$t("Are you sure you want to delete the Connector?"));case 2:if(t.sent){t.next=4;break}return t.abrupt("return");case 4:return t.next=6,e.T.callAPI("/api/v1/connectors/:id/do/delete",{params:{id:e.$route.params.id},alert:{okMessage:e.$t("Connector deleted")}});case 6:if(n=t.sent,n&&n.ok){t.next=9;break}return t.abrupt("return");case 9:e.$router.push({name:"intro"}),e.$store.commit("updateConnectorListSyncTime");case 11:case"end":return t.stop()}}),t)})))()},testConnector:function(){var e=this;return Object(i["a"])(Object(r["a"])().mark((function t(){var n;return Object(r["a"])().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.testConnectorResult="running",t.next=3,e.T.callAPI_get("/api/v1/connectors/:id/do/test",{params:{id:e.$route.params.id}});case 3:n=t.sent,n.ok?e.testConnectorResult="ok":e.testConnectorResult="ng";case 5:case"end":return t.stop()}}),t)})))()},hasConfigField:function(e,t){return!(!this.C.CONNECTOR_MAP.get(e)||!this.C.CONNECTOR_MAP.get(e).configFields)&&t in this.C.CONNECTOR_MAP.get(e).configFields},addTopicHandler:function(){this.T.isNothing(this.form.configJSON.topicHandlers)&&this.$set(this.form.configJSON,"topicHandlers",[]),this.form.configJSON.topicHandlers.push({topic:"",funcId:""})},removeTopicHandler:function(e){this.form.configJSON.topicHandlers.splice(e,1)}},computed:{SUPPORTED_CONNECTORS:function(){var e=this,t=this.C.CONNECTOR.filter((function(t){switch(t.key){case"guance":return e.$store.getters.isExperimentalFeatureEnabled("ConnectorForGuance");case"sqlserver":return"x64"===e.$store.getters.CONFIG("_ARCH");default:return!0}}));return t.forEach((function(t){e.T.appendSearchFields(t,["key","name","fullName"])})),t},pageTitle:function(){var e={setup:this.$t("Setup Connector"),add:this.$t("Add Connector")};return e[this.T.setupPageMode()]},selectedType:function(){switch(this.T.setupPageMode()){case"add":return this.form.type;case"setup":return this.data.type}}},props:{},data:function(){return{data:{},subInfoMap:{},funcMap:{},funcCascader:[],selectShowOptions:[],guanceNodes:[],guanceNodeMap:{},form:{id:null,title:null,type:null,description:null,configJSON:{}},formRules:{id:[{trigger:"change",message:this.$t("Please input ID"),required:!0},{trigger:"change",message:this.$t("Only alphabets, numbers and underscore are allowed"),pattern:/^[a-zA-Z0-9_]*$/g},{trigger:"change",message:this.$t("Cannot not starts with a number"),pattern:/^[^0-9]/g}],type:[{trigger:"change",message:this.$t("Please input Connector type"),required:!0}],"configJSON.guanceNode":[{trigger:"change",message:this.$t("Please select Guance Node"),required:!0}],"configJSON.nameInGuance":[{trigger:"change",message:this.$t("Please input the name of this DataFlux Func in Guance"),required:!1}],"configJSON.guanceOpenAPIURL":[{trigger:"change",message:this.$t("Please input OpenAPI URL"),required:!0},{trigger:"change",message:this.$t("Should start with http:// or https://"),pattern:this.C.RE_PATTERN.httpURL}],"configJSON.guanceWebSocketURL":[{trigger:"change",message:this.$t("Please input Websocket URL"),required:!0},{trigger:"change",message:this.$t("Should start with http:// or https://"),pattern:this.C.RE_PATTERN.httpURL}],"configJSON.guanceOpenWayURL":[{trigger:"change",message:this.$t("Please input OpenWay URL"),required:!0},{trigger:"change",message:this.$t("Should start with http:// or https://"),pattern:this.C.RE_PATTERN.httpURL}],"configJSON.guanceAPIKeyId":[{trigger:"change",message:this.$t("Please input API Key ID"),required:!0}],"configJSON.guanceAPIKey":[{trigger:"change",message:this.$t("Please input API Key"),required:!0}],"configJSON.host":[{trigger:"change",message:this.$t("Please input host"),required:!0}],"configJSON.port":[{trigger:"change",message:this.$t("Please input port"),required:!0},Object(a["a"])({trigger:"change",message:this.$t("Only integer between 1 and 65535 are allowed"),type:"integer",min:1,max:65535},"trigger","change")],"configJSON.servers":[{trigger:"change",message:this.$t("Please input servers"),required:!0}],"configJSON.protocol":[{trigger:"change",message:this.$t("Please select HTTP protocol"),required:!0},{trigger:"change",message:this.$t("Only HTTP and HTTPS are allowed"),type:"enum",enum:["http","https"]}],"configJSON.source":[{trigger:"change",message:this.$t("Please input source"),required:!1}],"configJSON.database":[{trigger:"change",message:this.$t("Please input database"),required:!1}],"configJSON.user":[{trigger:"change",message:this.$t("Please input user"),required:!1}],"configJSON.password":[{trigger:"change",message:this.$t("Please input password"),required:!1}],"configJSON.charset":[{trigger:"change",message:this.$t("Please input charset"),required:!1}],"configJSON.token":[{trigger:"change",message:this.$t("Please input token"),required:!1}],"configJSON.accessKey":[{trigger:"change",message:this.$t("Please input Access Key"),required:!1}],"configJSON.secretKey":[{trigger:"change",message:this.$t("Please input Secret Key"),required:!1}],"configJSON.clientId":[{trigger:"change",message:this.$t("Please input client ID"),required:!1}],"configJSON.groupId":[{trigger:"change",message:this.$t("Please input group ID"),required:!1}],"configJSON.securityProtocol":[{trigger:"change",message:this.$t("Please input security protocol"),required:!1}],"configJSON.saslMechanisms":[{trigger:"change",message:this.$t("Please input SASL Mechanisms"),required:!1}],"configJSON.multiSubClient":[{trigger:"change",message:this.$t("Please select if Multi Sub allowed"),required:!1}],"configJSON.kafkaSubOffset":[{trigger:"change",message:this.$t("Please input Sub Offset"),required:!1}]},formRules_topic:{trigger:"change",message:this.$t("Please input topic"),required:!0},formRules_topicHandler:{trigger:"change",message:this.$t("Please select handler Func"),required:!0},isSaving:!1,testConnectorResult:null,img_noticeFuncIsJustPythonWrapper:p.a}},mounted:function(){var e=this;this.autoRefreshTimer=setInterval((function(){e.updateSubInfo()}),5e3)},beforeDestroy:function(){this.autoRefreshTimer&&clearInterval(this.autoRefreshTimer)}},g=d,m=(n("498e"),n("63ea"),n("2877")),h=n("7d45"),O=Object(m["a"])(g,o,s,!1,null,"ecdbacc8",null);"function"===typeof h["default"]&&Object(h["default"])(O);t["default"]=O.exports},"364f":function(e,t,n){"use strict";n("842a")},"498e":function(e,t,n){"use strict";n("6fbd")},5721:function(e,t,n){},"5a45":function(e,t,n){"use strict";n("a4d3"),n("e01a");var a=function(){var e=this,t=e._self._c;return t("el-dialog",{attrs:{id:"FeatureNotice",visible:e.show&&!e.disabled,"show-close":!1,"close-on-click-modal":!1,"close-on-press-escape":!1,width:"850px"}},[t("div",{staticClass:"notice-feature-container"},[t("el-image",{attrs:{src:e.image}}),e._v(" "),t("el-card",{staticClass:"notice-feature-content"},[t("i",{staticClass:"fa fa-fw notice-feature-icon",class:e.icon}),e._v(" "),t("p",{domProps:{innerHTML:e._s(e.description)}})]),e._v(" "),t("div",{staticClass:"notice-feature-buttons"},[t("el-button",{attrs:{type:"text"},on:{click:function(t){return e.close(!0)}}},[e._v(e._s(e.$t("Don't prompt again")))]),e._v(" "),t("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(t){return e.close()}}},[e._v(e._s(e.$t("OK")))])],1)],1)])},o=[],s=n("a92d"),r=n.n(s),i={name:"FeatureNoticeDialog",components:{},watch:{},methods:{close:function(e){this.show=!1,this.$store.commit("dismissFeatureNotice",this.featureKey),e&&this.$store.commit("disableFeatureNotice",this.featureKey)}},computed:{},props:{featureKey:String,description:String,icon:{type:String,default:"fa-lightbulb-o"},image:{type:Object,default:r.a},disabled:{type:Boolean,default:!1}},data:function(){return{show:!1}},mounted:function(){var e=this;setTimeout((function(){e.$store.getters.showFeatureNotice(e.featureKey)&&(e.show=!0)}),500)}},c=i,l=(n("364f"),n("1ff2"),n("2877")),u=n("928e"),f=Object(l["a"])(c,a,o,!1,null,"57f7fbfa",null);"function"===typeof u["default"]&&Object(u["default"])(f);t["a"]=f.exports},"63ea":function(e,t,n){"use strict";n("f3fc")},"6fbd":function(e,t,n){},"7d45":function(e,t,n){"use strict";var a=n("1dec"),o=n.n(a);t["default"]=o.a},"841c":function(e,t,n){"use strict";var a=n("c65b"),o=n("d784"),s=n("825a"),r=n("1d80"),i=n("129f"),c=n("577e"),l=n("dc4a"),u=n("14c3");o("search",(function(e,t,n){return[function(t){var n=r(this),o=void 0==t?void 0:l(t,e);return o?a(o,t,n):new RegExp(t)[e](c(n))},function(e){var a=s(this),o=c(e),r=n(t,a,o);if(r.done)return r.value;var l=a.lastIndex;i(l,0)||(a.lastIndex=0);var f=u(a,o);return i(a.lastIndex,l)||(a.lastIndex=l),null===f?-1:f.index}]}))},"842a":function(e,t,n){},"928e":function(e,t,n){"use strict";var a=n("a5bc"),o=n.n(a);t["default"]=o.a},"932a":function(e,t,n){e.exports=n.p+"img/notice-func-is-just-python-wrapper.9f3618dc.png"},a434:function(e,t,n){"use strict";var a=n("23e7"),o=n("7b0b"),s=n("23cb"),r=n("5926"),i=n("07fa"),c=n("3511"),l=n("65f0"),u=n("8418"),f=n("083a"),p=n("1dde"),d=p("splice"),g=Math.max,m=Math.min;a({target:"Array",proto:!0,forced:!d},{splice:function(e,t){var n,a,p,d,h,O,b=o(this),v=i(b),N=s(e,v),S=arguments.length;for(0===S?n=a=0:1===S?(n=0,a=v-N):(n=S-2,a=m(g(r(t),0),v-N)),c(v+n-a),p=l(b,a),d=0;d<a;d++)h=N+d,h in b&&u(p,d,b[h]);if(p.length=a,n<a){for(d=N;d<v-a;d++)h=d+a,O=d+n,h in b?b[O]=b[h]:f(b,O);for(d=v;d>v-a+n;d--)f(b,d-1)}else if(n>a)for(d=v-a;d>N;d--)h=d+a-1,O=d+n-1,h in b?b[O]=b[h]:f(b,O);for(d=0;d<n;d++)b[d+N]=arguments[d+2];return b.length=v-a+n,p}})},a5bc:function(e,t){e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"zh-CN":{"Don\'t prompt again":"不再提示"}}'),delete e.options._Ctor}},a92d:function(e,t,n){e.exports=n.p+"img/notice-feature.a3847dd5.png"},f3fc:function(e,t,n){}}]);