import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import * as C from '@/const'
import * as toolkit from '@/toolkit'

const STATE_CONFIG = {
  systemConfig                             : { persist: true,  syncXTab: true  },
  isLoaded                                 : { persist: false, syncXTab: false },
  processingTaskCount                      : { persist: false, syncXTab: false },
  processingTaskUpdateTime                 : { persist: false, syncXTab: false },
  isSocketIOReady                          : { persist: true,  syncXTab: true  },
  conflictedRouteMap                       : { persist: false, syncXTab: false },
  clientId                                 : { persist: true,  syncXTab: true  },
  userProfile                              : { persist: true,  syncXTab: true  },
  xAuthToken                               : { persist: true,  syncXTab: true  },
  uiTheme                                  : { persist: true,  syncXTab: true  },
  codeMirrorSetting                        : { persist: true,  syncXTab: true  },
  asideScript_expandedNodeMap              : { persist: true,  syncXTab: false },
  asideScript_currentNodeKey               : { persist: true,  syncXTab: false },
  asideScript_quickViewWindowPosition      : { persist: true,  syncXTab: false },
  asideDataSource_simpleDebugWindowPosition: { persist: true,  syncXTab: false },
  codeEditor_splitPanePercent              : { persist: true,  syncXTab: true  },
  codeEditor_highlightedLineConfigMap      : { persist: false, syncXTab: false },
  codeEditor_isCodeLoaded                  : { persist: false, syncXTab: false },
  codeViewer_highlightedLineConfigMap      : { persist: false, syncXTab: false },
  codeViewer_isCodeLoaded                  : { persist: false, syncXTab: false },
  Editor_highlightedFuncId                 : { persist: false, syncXTab: false },
  Editor_splitPanePercent                  : { persist: true,  syncXTab: true  },
  AuthLinkList_scrollY                     : { persist: false, syncXTab: false },
  CrontabConfigList_scrollY                : { persist: false, syncXTab: false },
  BatchList_scrollY                        : { persist: false, syncXTab: false },
  scriptListSyncTime                       : { persist: true,  syncXTab: true  },
  scriptSetListSyncTime                    : { persist: true,  syncXTab: true  },
  dataSourceListSyncTime                   : { persist: true,  syncXTab: true  },
  envVariableListSyncTime                  : { persist: true,  syncXTab: true  },
  pageFilterSettings                       : { persist: true,  syncXTab: true  },
  enabledExperimentalFeatureMap            : { persist: true,  syncXTab: true  },
  highlightedTableDataId                   : { persist: false, syncXTab: false },
  shortcutAction                           : { persist: false, syncXTab: false },
};
const MUTATION_CONFIG = {
  updateSystemConfig                             : { persist: true  },
  switchToBuiltinAuth                            : { persist: false },
  updateLoadStatus                               : { persist: false },
  startProcessing                                : { persist: false },
  endProcessing                                  : { persist: false },
  updateSocketIOStatus                           : { persist: false },
  setConflictedRoute                             : { persist: false },
  updateUserProfile                              : { persist: false },
  updateXAuthToken                               : { persist: true  },
  updateUITheme                                  : { persist: true  },
  updateCodeMirrorSetting                        : { persist: true  },
  updateAsideScript_expandedNodeMap              : { persist: true  },
  updateAsideScript_currentNodeKey               : { persist: true  },
  updateAsideScript_quickViewWindowPosition      : { persist: true  },
  updateAsideDataSource_simpleDebugWindowPosition: { persist: true  },
  updateCodeEditor_splitPanePercent              : { persist: true  },
  updateCodeEditor_highlightedLineConfigMap      : { persist: true  },
  updateCodeEditor_isCodeLoaded                  : { persist: false },
  updateCodeViewer_highlightedLineConfigMap      : { persist: true  },
  updateCodeViewer_isCodeLoaded                  : { persist: false },
  updateEditor_highlightedFuncId                 : { persist: true  },
  updateEditor_splitPanePercent                  : { persist: true  },
  updateAuthLinkList_scrollY                     : { persist: false },
  updateCrontabConfigList_scrollY                : { persist: false },
  updateBatchList_scrollY                        : { persist: false },
  updateScriptListSyncTime                       : { persist: false },
  updateDataSourceListSyncTime                   : { persist: false },
  updateEnvVariableListSyncTime                  : { persist: false },
  updatePageFilterSettings                       : { persist: false },
  updateEnabledExperimentalFeatures              : { persist: true  },
  updateHighlightedTableDataId                   : { persist: false },
  updateShortcutAction                           : { persist: false },

  syncState: { persist: false },
}

Vue.use(Vuex)

function getRouteKey(routeInfo) {
  let routeKey = routeInfo.name;

  if (routeInfo.params) {
    let paramsParts = [];
    Object.keys(routeInfo.params).sort().forEach(key => {
      paramsParts.push(`${key}=${routeInfo.params[key]}`);
    });
    routeKey += `#${paramsParts.join('&')}`;
  }

  return routeKey;
}

export default new Vuex.Store({
  state: {
    // 客户端配置
    systemConfig: {},

    // 主要内容加载完毕标识
    isLoaded: false,
    // 处理中数量
    processingTaskCount     : 0,
    processingTaskUpdateTime: 0,

    // Socket.io已认证标示
    isSocketIOAuthed: false,

    // 路由冲突表
    conflictedRouteMap: {},

    // 客户端ID
    clientId: null,
    // 用户信息
    userProfile: null,
    // 认证令牌
    xAuthToken: null,

    // UI主题
    uiTheme: null,
    // CodeMirror配置
    codeMirrorSetting: {
      theme: null,
      style: {
        fontSize  : null,
        lineHeight: null,
      }
    },

    // UI窗体状态
    asideScript_expandedNodeMap: null,
    asideScript_currentNodeKey : null,

    asideScript_quickViewWindowPosition      : null,
    asideDataSource_simpleDebugWindowPosition: null,

    codeEditor_splitPanePercent        : null,
    codeEditor_highlightedLineConfigMap: null,
    codeEditor_isCodeLoaded            : null,

    codeViewer_highlightedLineConfigMap: null,
    codeViewer_isCodeLoaded            : null,

    Editor_highlightedFuncId: null,
    Editor_splitPanePercent : null,

    AuthLinkList_scrollY     : 0,
    CrontabConfigList_scrollY: 0,
    BatchList_scrollY        : 0,

    // 列表同步时间
    scriptListSyncTime     : null,
    scriptSetListSyncTime  : null,
    dataSourceListSyncTime : null,
    envVariableListSyncTime: null,

    // 页面过滤配置
    pageFilterSettings: null,

    // 开启的实验性功能
    enabledExperimentalFeatureMap: null,

    // 高亮表格行数据ID
    highlightedTableDataId: null,

    // 快捷动作
    shortcutAction: null,
  },
  getters: {
    DEFAULT_STATE: state => {
      return {
        codeMirrorStyle: {
          fontSize  : 16,
          lineHeight: 1.5,
        },
        codeEditor_splitPanePercent: 60,
        Editor_splitPanePercent    : 20,
      }
    },
    CONFIG: state => (key, defaultValue) => {
      if (state.systemConfig && (key in state.systemConfig)) {
        return state.systemConfig[key];
      }
      return defaultValue || null;
    },
    SUPER_ADMIN_USER_ID: state => {
      return 'u-admin';
    },
    isProcessing: state => {
      return state.processingTaskCount > 0 && (Date.now() - state.processingTaskUpdateTime) > 3000;
    },
    clientId: state => {
      if (!state.clientId) {
        state.clientId = 'c_ui_' + toolkit.genRandString(8);
      }

      return state.clientId;
    },
    userId: state => {
      if (!state.userProfile) return null;
      return state.userProfile.id || null;
    },
    authType: state => {
      if (!state.xAuthToken) return false;
      if (!state.userProfile || !state.userProfile.roles) {
        return false;
      }

      return state.userProfile.roles.indexOf('ftUser') >= 0 ? 'ftAuth' : 'auth';
    },
    isIntegratedUser: state => {
      if (!state.userProfile || !state.userProfile.roles) {
        return false;
      }

      return !!state.userProfile.isIntegratedUser;
    },
    isSuperAdmin: (state, getters) => {
      return !!(state.userProfile && state.userProfile.roles.indexOf('sa') >= 0 && state.userProfile.id === getters.SUPER_ADMIN_USER_ID);
    },
    isSocketIOReady: state => {
      return state.isSocketIOAuthed && state.xAuthToken;
    },
    getConflictedRoute: state => routeInfo => {
      let routeKey = getRouteKey(routeInfo);
      return !!state.conflictedRouteMap[routeKey];
    },
    uiTheme: (state, getters) => {
      let uiTheme = state.uiTheme;
      if (uiTheme !== 'dark' && uiTheme !== 'light') {
        uiTheme = 'auto';
      }
      return uiTheme;
    },
    codeMirrorSetting: (state, getters) => {
      let theme = state.codeMirrorSetting.theme || C.CODE_MIRROR_DEFAULT_THEME;

      let fontSize = state.codeMirrorSetting.style.fontSize || getters.DEFAULT_STATE.codeMirrorStyle.fontSize;
      fontSize = Math.max(fontSize, 12);
      fontSize = Math.min(fontSize, 24);

      let lineHeight = state.codeMirrorSetting.style.lineHeight || getters.DEFAULT_STATE.codeMirrorStyle.lineHeight;
      lineHeight = Math.max(lineHeight, 1);
      lineHeight = Math.min(lineHeight, 2);

      return {
        theme: theme,
        style: {
          fontSize  : fontSize + 'px',
          lineHeight: lineHeight,
        }
      };
    },
    isExperimentalFeatureEnabled: state => key => {
      return !!(state.enabledExperimentalFeatureMap && state.enabledExperimentalFeatureMap[key]);
    },
  },
  mutations: {
    updateSystemConfig(state, config) {
      state.systemConfig = config || {};
    },
    switchToBuiltinAuth(state) {
      state.xAuthToken  = null;
      state.userProfile = null;

      var nextClientConfig = toolkit.jsonCopy(state.systemConfig);
      nextClientConfig.ftUserAuthEnabled = false;
      state.systemConfig = nextClientConfig;
    },

    updateLoadStatus(state, isLoaded) {
      if (isLoaded === false) {
        state.isLoaded = false;
      } else {
        setImmediate(() => {
          state.isLoaded = true;
        })
      }
    },
    startProcessing(state) {
      state.processingTaskCount++;
      state.processingTaskUpdateTime = Date.now();
    },
    endProcessing(state) {
      state.processingTaskCount--;
      state.processingTaskUpdateTime = Date.now();
    },
    updateSocketIOStatus(state, isAuthed) {
      state.isSocketIOAuthed = isAuthed;
    },

    setConflictedRoute(state, payload) {
      let routeKey = getRouteKey(payload.routeInfo);

      let nextConflictedRouteMap = toolkit.jsonCopy(state.conflictedRouteMap);
      if (payload.isConflicted) {
        nextConflictedRouteMap[routeKey] = true;
      } else {
        delete nextConflictedRouteMap[routeKey];
      }

      state.conflictedRouteMap = nextConflictedRouteMap;
    },

    updateUserProfile(state, value) {
      state.userProfile = value || null;
    },
    updateXAuthToken(state, value) {
      state.xAuthToken = value || null;
    },

    updateUITheme(state, value) {
      state.uiTheme = value || null;
    },
    updateCodeMirrorSetting(state, value) {
      state.codeMirrorSetting = value || {
        theme: C.CODE_MIRROR_DEFAULT_THEME,
        style: {},
      };
    },

    updateAsideScript_expandedNodeMap(state, value) {
      state.asideScript_expandedNodeMap = value || null;
    },
    updateAsideScript_currentNodeKey(state, value) {
      state.asideScript_currentNodeKey = value || null;
    },

    updateAsideScript_quickViewWindowPosition(state, value) {
      state.asideScript_quickViewWindowPosition = value || null;
    },
    updateAsideDataSource_simpleDebugWindowPosition(state, value) {
      state.asideDataSource_simpleDebugWindowPosition = value || null;
    },

    updateCodeEditor_splitPanePercent(state, value) {
      state.codeEditor_splitPanePercent = value || null;
    },
    updateCodeEditor_highlightedLineConfigMap(state, value) {
      state.codeEditor_highlightedLineConfigMap = value || null;
    },
    updateCodeEditor_isCodeLoaded(state, isCodeLoaded) {
      if (isCodeLoaded === false) {
        state.codeEditor_isCodeLoaded = false;
      } else {
        setImmediate(() => {
          state.codeEditor_isCodeLoaded = true;
        })
      }
    },

    updateCodeViewer_highlightedLineConfigMap(state, value) {
      state.codeViewer_highlightedLineConfigMap = value || null;
    },
    updateCodeViewer_isCodeLoaded(state, isCodeLoaded) {
      if (isCodeLoaded === false) {
        state.codeViewer_isCodeLoaded = false;
      } else {
        setImmediate(() => {
          state.codeViewer_isCodeLoaded = true;
        })
      }
    },

    updateEditor_highlightedFuncId(state, value) {
      state.Editor_highlightedFuncId = value || null;
    },
    updateEditor_splitPanePercent(state, value) {
      state.Editor_splitPanePercent = value || null;
    },

    updateAuthLinkList_scrollY(state, value) {
      state.AuthLinkList_scrollY = value || 0;
    },
    updateCrontabConfigList_scrollY(state, value) {
      state.CrontabConfigList_scrollY = value || 0;
    },
    updateBatchList_scrollY(state, value) {
      state.BatchList_scrollY = value || 0;
    },

    updateScriptListSyncTime(state, name) {
      state.scriptListSyncTime = Date.now();
    },
    updateDataSourceListSyncTime(state, name) {
      state.dataSourceListSyncTime = Date.now();
    },
    updateEnvVariableListSyncTime(state, name) {
      state.envVariableListSyncTime = Date.now();
    },

    updatePageFilterSettings(state, value) {
      state.pageFilterSettings = value || null;
    },

    updateEnabledExperimentalFeatures(state, value) {
      state.enabledExperimentalFeatureMap = value || null;
    },

    updateHighlightedTableDataId(state, value) {
      state.highlightedTableDataId = value || null;
    },
    updateShortcutAction(state, value) {
      state.shortcutAction = value;
    },

    syncState(state, nextState) {
      if (!nextState) return;

      for (let key in nextState) {
        if (STATE_CONFIG[key]
            && STATE_CONFIG[key].syncXTab
            && state[key] !== nextState[key]) {
          state[key] = nextState[key];
        }
      }
    },
  },
  actions: {
    async reloadSystemConfig({ commit }) {
      let apiRes = await toolkit.callAPI('/api/v1/func-system-config');
      if (!apiRes.ok) return;

      commit('updateSystemConfig', apiRes.data);
    },
    async reloadUserProfile({ commit, state }) {
      if (!state.xAuthToken) return;

      let apiRes = await toolkit.callAPI('/api/v1/auth/profile/do/get');
      if (!apiRes.ok) return;

      commit('updateUserProfile', apiRes.data);
    },
    async signOut({ commit }) {
      await toolkit.callAPI('/api/v1/auth/do/sign-out');

      commit('updateSocketIOStatus', false);
      commit('updateXAuthToken', null);
    },
  },
  modules: {
  },
  plugins: [
    createPersistedState({
      reducer: (state) => {
        let persistState = {};
        for (let key in STATE_CONFIG) {
          if (STATE_CONFIG[key].persist) {
            persistState[key] = state[key];
          }
        }
        return persistState;
      },
      filter: (mutation) => {
        return MUTATION_CONFIG[mutation.type].persist || false
      },
    }),
  ],
});

