import Vue from 'vue';
import axios from 'axios';
import md5 from 'js-md5';
import { Message } from 'element-ui';
import store from '../store';
import router from '../router';

import { getToken } from './auth';

import { MGR_API_KEY, COMM_API_KEY, API_HOST } from './api_configs';

axios.defaults.timeout = 30000;
axios.defaults.baseURL = API_HOST;

export function get(uri, params, callback) {
    // let payload = JSON.stringify(params);
    var url = '/' + uri;

    var i = generateUUID();
    var ak = genAccessKey(i, uri);

    params = params || {};
    params['i'] = i;
    params['ak'] = ak;

    if (getToken()) {
        params['token'] = getToken();
    }

    axios.get(url, {
        params: params
    })
        .then(response => {
            // console.log(response);
            handleResponse('get', response, callback);
        })
        .catch((error) => {
            console.log(error);
            handleError(500, '服务器超时，请重试', callback);
        });
}

Vue.prototype.$get = get;

export function post(uri, params, callback) {
    var url = '/' + uri;

    var i = generateUUID();
    var ak = genAccessKey(i, uri);

    params = params || {};
    params['i'] = i;
    params['ak'] = ak;

    if (getToken()) {
        params['token'] = getToken();
    }

    axios.post(url, params)
        .then(resp => {
            handleResponse('post', resp, callback);
        })
        .catch(() => {
            handleError(500, "服务器超时，请重试", callback);
        });
}

Vue.prototype.$post = post;

function handleError(code, errmsg, callback) {
    // console.info(code, errmsg);
    if (Array.isArray(errmsg)) {
        let temp = [];
        errmsg.forEach(msg => {
            temp.push(`<li>${msg}</li>`);
        });
        Message({
            dangerouslyUseHTMLString: true,
            message: `<ul>${temp.join('')}</ul>`,
            type: 'error',
            duration: 5 * 1000
        });
    } else {
        Message({
            message: errmsg,
            type: 'error',
            duration: 5 * 1000
        });
    }


    if (callback) {
        callback({ code: code, message: errmsg });
    }
}

function handleResponse(method, resp, callback) {
    let data = resp.data;
    if (data.code === 0) {
        if (callback) {
            callback(data);
        }
    } else {
        if (method !== 'get' || data.code !== -20) {
            handleError(data.code, data.message, callback);
        }

        if (data.code === 401) {
            store.dispatch('FedLogOut').then(() => {
                location.reload();
            });
        } else if (data.code === -20) {
            // router.push({ path: '/403' });
        }
    }
}

function genAccessKey(i, uri) {
    var api_key = uri === "auth_codes" ? COMM_API_KEY : MGR_API_KEY;
    return md5(api_key + i.toString());
}

export function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

