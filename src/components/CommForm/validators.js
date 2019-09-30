export function MobileCheck(rule, value, callback) {
    if (value) {
        var reg = new RegExp(/^1[3|4|5|6|7|8|9]\d{9}$/)
        if (!reg.test(value)) {
            callback(new Error('手机号不正确'));
        } else {
            callback();
        }
    } else {
        callback()
    }
}
export function IntCheck(rule, value, callback) {
    if (!value) {
        callback()
    } else {
        // console.log(Number.isInteger(parseInt(value)));
        if (!Number.isInteger(parseInt(value))) {
            callback(new Error('请输入整数'))
        } else {
            callback()
        }
    }
}

export function PasswordLengthCheck(rule, value, callback) {
    if (!value) {
        callback();
    } else {
        if (value.trim().length < 6) {
            callback(new Error('密码太短，至少为6位'));
        } else {
            callback();
        }
    }
}