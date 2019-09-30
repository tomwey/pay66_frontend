import Vue from 'vue'

import 'normalize.css/normalize.css'

import ElementUI from 'element-ui'

import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/zh-CN'

import moment from 'moment';

import '@/styles/index.scss' // 全局 css

import '@/assets/iconfont/iconfont.css';

import App from './App.vue'
import store from './store'
import router from './router'

import '@/utils/ajax';

import * as filters from '@/filters';

Vue.prototype.$moment = moment;

Vue.prototype.$hasPermission = function (resourceCode, actionCode) {
  if (store.state.user.is_admin) {
    return true;
  }

  return (store.state.user.permissConfigs[resourceCode] || []).indexOf(actionCode) !== -1
}

Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.use(ElementUI, { locale })

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
})
