# 截图功能与 MCP 接入结果

日期：2026-10-07。实际软件：D:/HU/衍图便携版/衍图便携版。

## 结论

截图中的功能已有对应 MCP 入口。此前缺少图片专用编辑、分析、标注、图层与部分节点操作入口，本次补齐 8 个工具；已有裁剪、宫格切分、尺寸调整、锁定、替换和删除沿用原生实现。当前画布已刷新并实际连接新 Runtime。

支持 MCP 的其他 Agent 可以读取本包制作技能，从剧本编排到视频与时间线导出。需要正确连接本软件、加载技能、配置文字/图片/视频渠道，并由 Agent 处理真实任务和验收。接入完成不代表每次上游生成都会成功，也不代表用户只给剧本后任何客户端都会自动加载这些技能。

## 截图逐项核对

| 功能 | MCP 入口 | 本次验证范围 |
| --- | --- | --- |
| 局部重绘 | canvas_preflight_image_edit → canvas_edit_image(mask) | 实际页面预检通过；蒙版参数和提交逻辑测试；未收费实生成 |
| 文字编辑 | canvas_analyze_image(text_detection) → canvas_edit_image(text) | 图像理解能力门槛、真实引用与提交合同已接入；未收费实生成 |
| 全景图 | canvas_create_panorama_viewer，既有 set/capture_panorama_view | 真实原图全景节点、连线和持久化成功；WebGL 视角/捕获未在本轮操作，普通图不等于重建 360 空间 |
| 表情调整 | canvas_edit_image(emotion) | 目标人脸区域、裁切身份输入、原生蒙版/局部融合流程已接入；未收费实生成 |
| 质感调整 | canvas_edit_image(texture) | 使用原生质感提示及真实输入；短提交、幂等重放、保留原图测试通过 |
| 多角度 | canvas_edit_image(angle) | 水平角、俯仰角、距离、广角参数已接入；生成角度不能当作世界尺度测量证据 |
| 打光 | canvas_edit_image(lighting) | 实际页面预检通过，方向/亮度/颜色/轮廓光参数已接入；未收费实生成 |
| 裁剪 | canvas_crop_image | 实际产生 64×32 资源，像素与源图裁切一致 |
| 调整尺寸 | canvas_upscale_image | 实际产生 256×128 资源，nearest 像素与预期一致；这是插值尺寸调整 |
| 标注 | canvas_annotate_image | 真实 PNG/Asset 返回；矩形、箭头像素存在，画幅及源图透明区保留 |
| 标注编辑 | canvas_edit_image(annotation_edit) | 实际标注图作为第二参考、原生绑定与任务接入；未收费实生成 |
| 宫格切分 | canvas_split_image | 实际产生 4 个 64×32 节点/资源，逐格像素顺序正确 |
| 去除背景 | canvas_edit_image(remove_background) | 实际页面预检通过，真实透明输出要求及 alpha 核对接入；未收费实生成 |
| AI 图层拆分 | canvas_decompose_image | 2–6 个明确图层；每层独立任务、幂等 ID 和计费；提交/重放/部分失败测试通过；未收费实生成 |
| 放大预览 | canvas_image_node_action(preview) | 原生预览回调已接入；本轮未打开预览 |
| 下载 | canvas_image_node_action(download) | 原生下载回调已接入；本轮未触发下载，不能宣称磁盘写入成功 |
| 节点信息 | canvas_get_node / canvas_image_node_action(info) | 真实节点/资源读取及原生信息面板动作成功 |
| 锁定宽高比 | canvas_resize_node(freeResize) | 实际 resize 并回读；保留底层原生比例逻辑 |
| 锁定位置与尺寸 | canvas_toggle_node_locked | 实际锁定、恢复并回读成功 |
| 生成设置 | canvas_image_node_action(generation_settings) / canvas_update_node | 原生生成面板回调和真实设置字段可调用；本轮未打开设置 |
| 复制提示词 | canvas_get_node / canvas_image_node_action(copy_prompt) | 读完整原文和 await 剪贴板写入已接入；本轮未覆盖用户剪贴板 |
| 反推提示词 | canvas_analyze_image(reverse_prompt) | 真实图片输入及图像理解模型限制已接入；未收费实生成 |
| 保存到素材库 | canvas_save_node_asset | 实际可靠 Asset 回执、入库和持久化成功 |
| 替换图片 | canvas_replace_node_media / canvas_upload_file(nodeId) | 使用真实测试 Asset 替换成功，保留节点 ID |
| 移除节点 | canvas_delete_nodes | 9 个测试节点已删除并回读确认，不删除采用影片素材 |

## 修正内容

- GUI 图层拆分原来可把单张返回图当作成功；现逐层提交真实任务，并检查实际透明度和相同画幅。透明通道合格后内容仍保持待审核。
- GUI 去背景共用透明输出及质量检查流程。模型不支持会在提交前阻止，不用白底或棋盘格冒充透明。
- 编辑会生成新节点、保留原图，参考节点 ID、连线、内联引用和实发图片顺序一致。普通可编辑容器内结果局部排开；关联素材库文件夹仍按其原生归档流程处理。
- 稳定 clientOperationId 校验原资源和请求参数；不确定回执先查原请求，图层可按具体层 retryOf 继续。收费提交返回真实 taskId，由原生任务生命周期回填。

## 证据与版本

- 24 项合同/提交/回归测试通过，共 89 个断言；使用隔离提交桩，没有请求收费渠道。
- MCP 和网页 TypeScript 检查通过；网页生产编译完成。
- 标准 MCP stdio 客户端发现全部 8 个新工具。刷新后 3 项真实预检通过，均没有收费提交。
- 真实页面本地操作通过，8 个实际 PNG 输出已按像素核对；测试节点清理后剩余 0。
- 插件更新至 0.1.15，并通过正常安装脚本把本机注册由 D:/1234 改为当前便携版。
- 制作技能 1.5.1 已更新软件技能库，并用 MCP 目录及完整读取核对；编辑技能 1.2.0、画布入口 1.1.3 随插件带入。

原始证据在本目录的 native-preflight-results.json、native-local-verification-results.json、native-pixel-checks.json、mcp-image-tool-registration.json 与 software-skill-update.json。AI 新入口尚未在收费渠道逐项实生成，不能承诺所有模型都支持或所有输出自动合格。

## 其他用户调用

完整打包本便携版目录会包含 plugins/yingce、canvas-agent/dist 和 web/dist。对方在自己的电脑启动软件、配置自己的渠道，再按客户端方式连接 MCP；Codex 使用本包的“安装到Codex.cmd”，其他 MCP 客户端重新配置 stdio 程序路径及技能读取。

连接后先读取 runtime_diagnostics、canvas_list_open_canvases、canvas_get_capabilities，再用 skill_catalog / skill_prepare 读取制作技能。封闭场景仍按房型图 → 共用模型和固定机位 → 关键帧/视频执行；已有合格图片复用，首帧使用独立切图，真实任务完成后才剪辑与验收。

本轮没有重新制作影片，也没有新收费图片或视频请求。

## 旧版本清理

按用户追加授权，D:/1234 内全部 35 项顶层内容（含旧插件）已删除，目录回读为 0 项。检查了新旧目录的链接关系，最新版未指向旧目录；仅关闭旧目录所属进程 33088。D:/HU 保留，5 个重要运行/插件文件哈希未变，最新版的网页、后端与 MCP 三项服务仍运行。

清理后使用 Codex 实际已安装插件 0.1.15 的启动配置重新连接 MCP，8 个新增工具可发现，目标画布连接正常。真实记录见 old-version-deletion-result.json 和 installed-plugin-after-delete-readback.json。
