/* ===== 腾讯云开发 CloudBase 配置 =====
 * 1) 打开 https://cloud.tencent.com/product/tcb 开通云开发（有免费额度）
 *    （如果你已在微信开发者工具开通了云开发，同一环境在腾讯云控制台也能看到）
 * 2) 进入你的「云开发环境」→ 复制「环境 ID」（形如 your-env-id-xxxxx）
 * 3) 在环境里开启「Web 端访问」并配置「安全域名」（详见 README）
 * 4) 把下面 envId 填进去即可。
 *
 * 说明：envId 留空时，网页以“本地存储”模式运行（仅本机可见）；
 *       填好后自动切换到云端，浏览器与微信打开的数据实时同步。
 */
window.TCB_CONFIG = {
  envId: '',       // ← 填你的云开发环境 ID
  region: 'ap-shanghai' // ← 你的环境所在区域（腾讯云控制台可见，通常 ap-shanghai / ap-guangzhou）
};
