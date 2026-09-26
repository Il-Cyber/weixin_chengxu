/* ===== LeanCloud 免费云数据库配置 =====
 * 1) 注册：https://console.leancloud.cn（免费开发版即可，无需付费）
 * 2) 创建应用 → 进入应用 → 「设置 / 设置」→「应用凭证」
 * 3) 把下面三项复制粘贴进来即可：
 *    - AppID   （形如 xxxxxxxxxxxxxxxxxxxxxx）
 *    - AppKey  （形如 xxxxxxxxxxxxxxxxxxxxxx）
 *    - Server 域名（国内版形如 https://xxxx.api.lc-cn-xxxx.shared.leancloud.cn，
 *                  在“设置→应用凭证→Server 域名”里可复制）
 *
 * 说明：留空 appId 时，网页仍会以“本地存储”模式运行（仅本机可见，不跨设备同步）。
 * 填好 appId 后即自动切换到云端，浏览器与微信打开的数据实时同步。
 */
window.LEAN_CONFIG = {
  appId: '',
  appKey: '',
  serverURL: ''
};
