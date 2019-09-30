const getters = {
    sidebar: state => state.app.sidebar,
    device: state => state.app.device,
    token: state => state.user.token,
    avatar: state => state.user.avatar,
    name: state => state.user.name,
    permissions: state => state.user.permissions,
    permissionConfigs: state => state.user.permissionConfigs,
    is_admin: state => state.user.is_admin,
    company: state => state.user.company,
    mobile: state => state.user.mobile,
    configs: state => state.user.configs,
}

export default getters