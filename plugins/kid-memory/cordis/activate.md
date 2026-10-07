# kid-memory「🧠 记忆小管家」一键激活提示词

> 用法：在 harness web 新建一个 **cordis（创造模式）** 会话，把下面整段提示词粘贴发送，
> agent 会自行读取两个 half 文件、`cordis_define`、`cordis_run`。
> 唯一需要手动的是：当 Run 卡出现 **awaiting-approval 授权**时点一次 ✓（建议点双✓，未来版本免批）。

---

请把 kid-memory 的前端插件定义并运行起来：

1. 读取这两个文件的源码：
   - `/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-memory/cordis/host.js`（作为 code.host）
   - `/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-memory/cordis/client.js`（作为 code.client）
2. 调用 `cordis_define` 定义插件：
   - code.host = host.js 的内容
   - code.client = client.js 的内容
   - 插件名建议 `kid-memory`（pluginId 会由你返回）
3. 拿到返回的 pluginId / packageId 后，调用 `cordis_run` 运行它。

运行起来后，对话流里应该出现一张「🧠 记忆小管家 · 电脑的工作台」的可爱卡片（蓝色系，小动物🦉猫头鹰做吉祥物，和 kid-storage 的橙色大仓库区分）：顶部显示工作台已用百分比（仪表条 + 已用/空闲/总数），下面是「工作台挤不挤」的内存压力状态（宽裕/有点挤/很紧张 + 空闲率），再往下是"谁在占着工作台"的占用榜（App 名 + 占用条 + 大小），每 8 秒自动刷新。卡片默认折叠成一行摘要，点击标题可展开/收起详情。

完成后简要告诉我：卡片是否成功渲染，以及「工作台已用百分比」「内存空闲率」和「占用榜第一名」这三个字段是否有值（被沙箱拦或读取失败则显示占位）。