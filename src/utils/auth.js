import Cookies from 'js-cookie'

export function getMerchID() {
  const host = window.location.hostname;
  let arr = host.split('.');
  if (arr.length > 0) {
    let temp = arr[0].split("-");
    if (temp.length > 1) {
      return temp[1];
    }
  }
  return '928440';
}

export function getToken() {
  return Cookies.get(getTokenKey())
}

export function setToken(token) {
  return Cookies.set(getTokenKey(), token, { expires: 3 }) // 默认保存3天
}

export function removeToken() {
  return Cookies.remove(getTokenKey())
}

function getTokenKey() {
  return 'tgs' + '_' + getMerchID() + '_token';
}
