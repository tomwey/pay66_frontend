// import request from '@/utils/request'
import { get, post } from '@/utils/ajax'

export function login(login, password, merchID, callback) {
  post('admin/u/login', {
    mobile: login,
    password: password,
    cid: merchID
  }, callback);
}

export function getAccountInfo(token, callback) {
  get('admin/u/home', { token: token }, callback);
}

export function getAppConfigs(cid, callback) {
  get('app/configs', { cid: cid }, callback);
}

// export function logout() {
//   return request({
//     url: '/user/logout',
//     method: 'post'
//   })
// }
