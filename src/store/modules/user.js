import { login, getAccountInfo, getAppConfigs } from '@/api/login'
import { getToken, setToken, removeToken, getMerchID } from '@/utils/auth'

const user = {
  state: {
    token: getToken(),
    merchID: getMerchID(),
    name: '',
    avatar: '',
    permissions: [],
    permissConfigs: {},
    company: null,
    mobile: '',
    is_admin: false,
    configs: {},
    role: null,
    role_name: null,
    parent: null,
    // roles: []
  },

  mutations: {
    SET_APP_CONFIGS: (state, data) => {
      // 修改favicon
      var link = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = data.logo;
      }

      // 修改标题
      document.title = `${data.brand} - 后台管理系统`;

      state.configs = data;
    },
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions
      const configs = {};
      permissions.forEach(per => {
        configs[per.resource_code] = per.action_codes;
      });
      state.permissConfigs = configs;
      // console.log(state.permissConfigs);
    },
    SET_IS_ADMIN: (state, isAdmin) => {
      state.is_admin = isAdmin
    },
    SET_COMPANY: (state, company) => {
      state.company = company
    },
    SET_MOBILE: (state, mobile) => {
      state.mobile = mobile;
    },
    SET_ROLE: (state, role) => {
      state.role = role;
    },
    SET_ID: (state, id) => {
      state.id = id;
    },
    SET_OTHER_INFO: (state, data) => {
      state.role = data.role;
      state.role_name = data.role_name;
      state.parent = data.parent;
    }
  },

  actions: {
    // 获取配置
    GetAppConfigs({ commit }) {
      return new Promise((resolve, reject) => {
        getAppConfigs(getMerchID(), (resp) => {
          if (resp.code == 0) {
            const data = resp.data
            commit('SET_APP_CONFIGS', data)
            resolve(data);
          } else {
            reject(resp.message);
          }
        });
      });
    },
    // 登录
    Login({ commit }, accountInfo) {
      const username = accountInfo.login.trim()
      return new Promise((resolve, reject) => {
        login(username, accountInfo.password, getMerchID(), (response) => {
          console.log(response);
          if (response.code == 0) {
            const data = response.data
            setToken(data.token)
            commit('SET_TOKEN', data.token)
            resolve();
          } else {
            reject(response.message);
          }
        });
      });
    },

    // 获取用户信息
    GetInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getAccountInfo(getToken(), (resp) => {
          if (resp.code === 0) {
            const data = resp.data;
            commit('SET_NAME', data.name)
            commit('SET_AVATAR', data.avatar)
            commit('SET_PERMISSIONS', data.permissions || [])
            commit('SET_IS_ADMIN', data.is_admin)
            commit('SET_COMPANY', data.company)
            commit('SET_MOBILE', data.mobile)
            commit('SET_ROLE', data.role)
            commit('SET_ID', data.id)
            commit('SET_OTHER_INFO', data);
            resolve(resp)
          } else {
            reject(resp.message);
          }
        });
      });
    },

    // 登出
    // LogOut({ commit, state }) {
    //   return new Promise((resolve, reject) => {
    //     logout(state.token).then(() => {
    //       commit('SET_TOKEN', '')
    //       commit('SET_ROLES', [])
    //       removeToken()
    //       resolve()
    //     }).catch(error => {
    //       reject(error)
    //     })
    //   })
    // },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_AVATAR', '')
        commit('SET_PERMISSIONS', [])
        commit('SET_IS_ADMIN', false)
        commit('SET_COMPANY', null)
        commit('SET_MOBILE', '')
        removeToken()
        resolve()
      })
    }
  }
}

export default user
