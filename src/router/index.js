import Vue from 'vue'
import Router from 'vue-router'
import store from "../store";
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { Message } from 'element-ui'
import { getToken } from '@/utils/auth'

Vue.use(Router)

NProgress.configure({ showSpinner: false })

/* Layout */
import Layout from '@/pages/layout/Layout'

export const constantRouterMap = [
    { path: '/login', component: () => import('@/pages/login') },
    { path: '/404', component: () => import('@/pages/404') },
    { path: '/forget_pwd', component: () => import("@/pages/password") },
    { path: '/change_pwd', component: () => import("@/pages/password") },
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/',
        component: Layout,
        children: [
            {
                path: 'dashboard',
                name: 'dashboard',
                component: () => import('@/pages/dashboard/index'),
                meta: { title: '概况' }
            },
            {
                path: '403',
                name: 'not_access',
                component: () => import('@/pages/dashboard/403'),
                meta: { title: '禁止访问' }
            },
            {
                path: 'merchants',
                // name: 'schools',
                component: () => import('@/pages/merchants/index'),
                // meta: { title: '校区管理' },
                children: [
                    {
                        path: '',
                        name: 'merchant-list',
                        component: () => import('@/pages/merchants/list'),
                        meta: { title: '商家列表' },
                    },
                    {
                        path: 'authorizes',
                        name: 'authorizes',
                        component: () => import('@/pages/merchants/authorizes'),
                        meta: { title: '商家授权' }
                    },
                    {
                        path: 'accounts',
                        name: 'accounts',
                        component: () => import('@/pages/merchants/accounts'),
                        meta: { title: '员工账号' }
                    },
                    // {
                    //     path: 'shops',
                    //     name: 'shops',
                    //     component: () => import('@/pages/schools/classrooms'),
                    //     meta: { title: '门店管理' }
                    // },
                ]
            },
            {
                path: 'shops',
                component: () => import('@/pages/shops/index'),
                children: [
                    {
                        path: '',
                        name: 'shop-list',
                        component: () => import('@/pages/shops/list'),
                        meta: { title: '门店列表' },
                    },
                ]
            },
            {
                path: 'agents',
                // name: 'top-agents',
                component: () => import('@/pages/agents/index'),
                // meta: { title: '业务团队' },
                children: [
                    {
                        path: '',
                        name: 'agent-list',
                        meta: { title: '业务团队' },
                        component: () => import('@/pages/agents/list'),
                    },
                    {
                        path: 'configs',
                        name: 'configs',
                        component: () => import('@/pages/agents/configs'),
                        meta: { title: '提成配置' }
                    }
                ]
            },
            {
                path: 'categories',
                component: () => import('@/pages/categories/index'),
                children: [
                    {
                        path: '',
                        name: 'category-list',
                        component: () => import('@/pages/categories/list'),
                        meta: { title: '类别列表' },
                    },
                ]
            },
            {
                path: 'devices',
                name: 'devices',
                component: () => import('@/pages/devices/index'),
                meta: { title: '设备列表' },
                children: [
                    {
                        path: '',
                        // name: 'parents-list',
                        component: () => import('@/pages/devices/list'),
                        // meta: { title: '项目管理' },
                    },
                ]
            },
            {
                path: 'orders',
                name: 'orders',
                component: () => import('@/pages/orders/index'),
                meta: { title: '订单列表' },
                children: [
                    {
                        path: '',
                        component: () => import('@/pages/orders/list'),
                    },
                ]
            },
            {
                path: 'users',
                name: 'users',
                component: () => import('@/pages/users/index'),
                meta: { title: '会员列表' },
                children: [
                    {
                        path: '',
                        component: () => import('@/pages/users/list'),
                    },
                ]
            },
            {
                path: 'stats',
                name: 'stats',
                component: () => import('@/pages/stats/index'),
                meta: { title: '数据中心' },
                children: [
                    {
                        path: '',
                        component: () => import('@/pages/stats/list'),
                    },
                ]
            },
            {
                path: 'messages',
                name: 'messages',
                component: () => import('@/pages/messages/index'),
                meta: { title: '消息中心' },
                children: [
                    {
                        path: '',
                        component: () => import('@/pages/messages/list'),
                    },
                ]
            },
            {
                path: 'configs',
                name: 'configs',
                component: () => import('@/pages/sys_configs/index'),
                meta: { title: '系统设置' },
                children: [
                    {
                        path: '',
                        component: () => import('@/pages/sys_configs/list'),
                    },
                ]
            },
            {
                path: 'accounts',
                component: () => import('@/pages/accounts/index'),
                children: [
                    {
                        path: 'roles',
                        name: 'roles',
                        component: () => import('@/pages/accounts/roles'),
                        meta: { title: '角色管理' },
                    },
                    {
                        path: '',
                        name: 'account-list',
                        component: () => import('@/pages/accounts/list'),
                        meta: { title: '账号列表' }
                    },
                ]
            },
        ]
    },

    { path: '*', redirect: '/404', hidden: true }
]

const router = new Router({
    mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: constantRouterMap
});

const whiteList = ['/login', '/forget_pwd'] // 不重定向白名单

router.beforeEach((to, from, next) => {
    NProgress.start()
    if (getToken()) {
        if (to.path === '/login') {
            next({ path: '/' })
            NProgress.done()
        } else {
            // console.log(store.getters);
            if (!store.getters.is_admin && store.getters.permissions.length === 0) {
                store.dispatch('GetInfo')
                    .then(() => {
                        // console.log(res)
                        next()
                    })
                    .catch(err => {
                        store.dispatch('FedLogOut').then(() => {
                            Message.error(err || '验证失败，请重新登录')
                            next({ path: '/' })
                        })
                    });
            } else {
                next()
            }
        }
    } else {
        if (whiteList.indexOf(to.path) !== -1) { // 不重定向
            next();
        } else {
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            });
            NProgress.done();
        }
    }
})

router.afterEach(() => {
    NProgress.done()
})

export default router 