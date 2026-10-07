# kid-network「🕊️ 信鸽邮局」一键激活提示词

> 用法：在 harness web 新建一个 **cordis（创造模式）** 会话，把下面整段提示词粘贴发送，
> agent 会自行读取两个 half 文件、`cordis_define`、`cordis_run`。
> 唯一需要手动的是：当 Run 卡出现 **awaiting-approval 授权**时点一次 ✓（建议点双✓，未来版本免批）。

---

请把 kid-network 的前端插件定义并运行起来：

1. 读取这两个文件的源码：
   - `/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-network/cordis/host.js`（作为 code.host）
   - `/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-network/cordis/client.js`（作为 code.client）
2. 调用 `cordis_define` 定义插件：
   - code.host = host.js 的内容
   - code.client = client.js 的内容
   - 插件名建议 `kid-network`（pluginId 会由你返回）
3. 拿到返回的 pluginId / packageId 后，调用 `cordis_run` 运行它。

运行起来后，对话流里应该出现一张「🕊️ 信鸽邮局 · 网络小探险」的可爱卡片：顶部显示这台电脑的局域网门牌号、互联网身份证（公网 IP + 城市）、实测网速（信鸽一秒钟驮多少）、到百度/阿里/腾讯三站的"送信延迟"进度条、以及局域网邻居设备数，每 8 秒自动刷新。如果遇到授权（awaiting-approval），请停在原地等系统提示，让用户点一次授权即可，不要自动重试。

完成后简要告诉我：卡片是否成功渲染，以及网速 / 公网 IP 这两个"出网"字段是否有值（被沙箱拦则显示占位）。