// 公网演示模式：部署到线上时由平台环境变量 EP_PUBLIC_MODE=1 打开。
// 打开后模型配置由管理员在平台侧预设，页面不再允许访客改写 .env ——
// 否则任何拿到链接的人都能把 baseURL 指向自己的服务器，劫持 API Key。
export function isPublicMode(): boolean {
  const v = process.env.EP_PUBLIC_MODE;
  return v === "1" || v === "true";
}
