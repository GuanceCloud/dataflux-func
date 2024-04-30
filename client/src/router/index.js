import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

import * as common from '@/common'

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err);
}

Vue.use(VueRouter)

const routes = [
  // 首页（登录页面）
  {
    path: '/index',
    name: 'index',
    component: () => import('../views/Index.vue'),
  },

  // 登出页面
  {
    path: '/sign-out',
    name: 'sign-out',
    component: () => import('../views/SignOut.vue'),
  },

  // 开发
  {
    path: '/development',
    component: () => import('../views/Development.vue'),
    children: [
      {
        path: 'intro',
        name: 'intro',
        component: () => import('../components/Development/Intro.vue'),
      },
      {
        path: 'code-editor/:id',
        name: 'code-editor',
        component: () => import('../components/Development/CodeEditor.vue'),
      },
      {
        path: 'code-viewer/:id',
        name: 'code-viewer',
        component: () => import('../components/Development/CodeViewer.vue'),
      },
    ]
  },

  // 蓝图
  {
    path: '/blueprint-list',
    name: 'blueprint-list',
    component: () => import('../components/Blueprint/BlueprintList.vue'),
  },
  {
    path: '/blueprint-canvas/:id',
    name: 'blueprint-canvas',
    component: () => import('../components/Blueprint/BlueprintCanvas.vue'),
  },

  // 脚本市场
  {
    path: '/script-market-list',
    name: 'script-market-list',
    component: () => import('../components/ScriptMarket/ScriptMarketList.vue'),
  },

  {
    path: '/script-market-contents/:id',
    name: 'script-market-contents',
    component: () => import('../components/ScriptMarket/ScriptMarketContents.vue'),
  },

  // 管理
  {
    path: '/management',
    name: 'management',
    component: () => import('../views/Management.vue'),
    children: [
      {
        path: 'overview',
        name: 'overview',
        component: () => import('../components/Management/Overview.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('../components/Management/About.vue'),
      },

      {
        path: 'api-auth-list',
        name: 'api-auth-list',
        component: () => import('../components/Management/APIAuthList.vue'),
      },

      {
        path: 'sync-api-list',
        name: 'sync-api-list',
        component: () => import('../components/Management/SyncAPIList.vue'),
      },

      {
        path: 'async-api-list',
        name: 'async-api-list',
        component: () => import('../components/Management/AsyncAPIList.vue'),
      },

      {
        path: 'crontab-schedule-list',
        name: 'crontab-schedule-list',
        component: () => import('../components/Management/CrontabScheduleList.vue'),
      },

      {
        path: 'task-record-func-list',
        name: 'task-record-func-list',
        component: () => import('../components/Management/TaskRecordFuncList.vue'),
      },
      {
        path: 'sub-task-record-func-list/:id',
        name: 'sub-task-record-func-list',
        component: () => import('../components/Management/TaskRecordFuncList.vue'),
      },

      {
        path: 'script-set-export-history-list',
        name: 'script-set-export-history-list',
        component: () => import('../components/Management/ScriptSetExportHistoryList.vue'),
      },
      {
        path: 'script-set-import-history-list',
        name: 'script-set-import-history-list',
        component: () => import('../components/Management/ScriptSetImportHistoryList.vue'),
      },

      {
        path: 'script-recover-point-list',
        name: 'script-recover-point-list',
        component: () => import('../components/Management/ScriptRecoverPointList.vue'),
      },
      {
        path: 'script-recover-point-add',
        name: 'script-recover-point-add',
        component: () => import('../components/Management/ScriptRecoverPointAdd.vue'),
      },

      {
        path: 'user-list',
        name: 'user-list',
        component: () => import('../components/Management/UserList.vue'),
      },

      {
        path: 'operation-record-list',
        name: 'operation-record-list',
        component: () => import('../components/Management/OperationRecordList.vue'),
      },

      {
        path: 'system-setting',
        name: 'system-setting',
        component: () => import('../components/Management/SystemSetting.vue'),
      },

      /* 实验性功能 */
      {
        path: 'experimental-features',
        name: 'experimental-features',
        component: () => import('../components/Management/ExperimentalFeatures.vue'),
      },

      {
        path: 'pip-tool',
        name: 'pip-tool',
        component: () => import('../components/Management/PIPTool.vue'),
      },

      {
        path: 'file-manage',
        name: 'file-manage',
        component: () => import('../components/Management/FileManage.vue'),
      },
      {
        path: 'file-service-list',
        name: 'file-service-list',
        component: () => import('../components/Management/FileServiceList.vue'),
      },
      {
        path: 'func-cache-manage',
        name: 'func-cache-manage',
        component: () => import('../components/Management/FuncCacheManage.vue'),
      },
      {
        path: 'func-store-manage',
        name: 'func-store-manage',
        component: () => import('../components/Management/FuncStoreManage.vue'),
      },

      {
        path: 'system-metrics',
        name: 'system-metrics',
        component: () => import('../components/Management/SystemMetrics.vue'),
      },
      {
        path: 'system-logs',
        name: 'system-logs',
        component: () => import('../components/Management/SystemLogs.vue'),
      },
      {
        path: 'abnormal-request-list',
        name: 'abnormal-request-list',
        component: () => import('../components/Management/AbnormalRequestList.vue'),
      },

      {
        path: 'access-key-add',
        name: 'access-key-add',
        component: () => import('../components/Management/AccessKeySetup.vue'),
      },
      {
        path: 'access-key-list',
        name: 'access-key-list',
        component: () => import('../components/Management/AccessKeyList.vue'),
      },
    ],
  },

  // 设置
  {
    path: '/setting',
    name: 'setting',
    component: () => import('../views/Setting.vue'),
    children: [
      {
        path: 'profile-setup',
        name: 'profile-setup',
        component: () => import('../components/Setting/ProfileSetup.vue'),
      },
      {
        path: 'password-setup',
        name: 'password-setup',
        component: () => import('../components/Setting/PasswordSetup.vue'),
      },
      {
        path: 'clear-cache',
        name: 'clear-cache',
        component: () => import('../components/Setting/ClearCache.vue'),
      },
    ],
  },

  // 函数文档
  {
    path: '/func-doc',
    name: 'func-doc',
    component: () => import('../views/FuncDoc.vue'),
  },

  // 函数 API 文档
  {
    path: '/func-api-doc',
    name: 'func-api-doc',
    component: () => import('../views/FuncAPIDoc.vue'),
  },

  // 梦境
  {
    path: '/dream',
    name: 'dream',
    component: () => import('../views/Dream.vue'),
  },

  // 自动跳转
  {
    path: '/',
    redirect: '/index',
  },
  {
    path: '*',
    redirect: {
      name: 'index',
      query: null,
    }
  }
];

const router = new VueRouter({
  routes,
});

const noAuthRoutes = [
  'index',
  'func-doc',
  'func-api-doc',
  'dream',
];
const adminOnlyRoutes = [
  'access-key-list',
  'system-setting',
];

router.beforeEach((to, from, next) => {
  // 切换路径时，已加载标记置为false，等待加载完再显示
  // 防止屏幕不和谐闪烁
  store.commit('updateLoadStatus', false);

  // 已登录跳转
  if (store.state.xAuthToken && to.name === 'index') {
    return next({ name: 'intro' });
  }

  // 未登录跳转
  if (!store.state.xAuthToken && noAuthRoutes.indexOf(to.name) < 0) {
    return next({ name: 'index' });
  }

  // SA权限控制跳转
  if (adminOnlyRoutes.indexOf(to.name) >= 0 && !store.getters.isAdmin) {
    console.warn('This page is only accessabel by Admin:', to.name);
    return next({ name: 'index' });
  }

  // 设置页面标题
  if (from.name) {
    let siteTitle = 'DataFlux Func';
    if (store.getters.SYSTEM_SETTINGS('CUSTOM_SITE_TITLE_ENABLED')
    && store.getters.SYSTEM_SETTINGS('CUSTOM_SITE_TITLE_TEXT')) {
      siteTitle = store.getters.SYSTEM_SETTINGS('CUSTOM_SITE_TITLE_TEXT');
    }

    if (['code-editor', 'code-viewer'].indexOf(to.name) >= 0) {
      document.title = `[${to.params.id}] - ${siteTitle}`;
    } else {
      document.title = siteTitle;
    }
  }

  return next();
});

router.afterEach((to, from) => {
  if (store.getters.isSignedIn && !store.getters.isScriptMarketCheckUpdatedRecently) {
    common.checkScriptMarketUpdate().then(() => {
      store.commit('updateScriptMarketCheckUpdateDate');
    });
  }
});

export default router
