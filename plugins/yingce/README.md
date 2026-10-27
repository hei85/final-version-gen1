# 衍图 Codex 插件

这个插件把本便携版衍图的 Canvas Agent MCP、画布操作技能和制作工具交给 Codex 使用。MCP 启动器读取安装脚本登记的运行时指针，使用对应便携包中的运行入口和配置，不按 Codex 缓存目录猜测运行路径。

```text
外部 Codex -> 衍图插件 Skill -> yingce MCP -> Runtime / 软件业务服务
```

插件不会启动第二套内置 Agent。旧 `/agent/codex/*` 与 `/agent/claude/turn` 入口只返回明确的 HTTP 410。

## 安装

在本便携版目录双击 `安装到Codex.cmd`，或执行：

```powershell
.\scripts\install-to-codex.ps1
```

脚本会把本地 marketplace 和插件安装来源切换到这个便携版目录，并写入指向此目录的运行时指针。Codex 会缓存插件文件，因此插件 MCP 启动器先读取该指针，再使用便携版内的 Node 和 Canvas Agent；启动器同时校验便携版插件版本，避免连接旧开发仓库。安装脚本把已安装 MCP 的命令设为本包 `runtime/node.exe` 直接启动，以便客户端断开时结束对应进程。插件不依赖开发机上的项目目录。

安装或更新后建议新建 Codex 对话，让静态 Skill 和 MCP 工具重新加载。

## 启动软件

双击本目录的 `启动衍图.cmd`，或执行：

```powershell
.\scripts\portable-start.ps1
```

服务地址：

- 网页：`http://localhost:3000`
- 后端：`http://127.0.0.1:8080`
- Runtime：`http://127.0.0.1:17371`

在首页可用 `project_create_from_script` 从剧本创建短剧项目、首章和画布；创建后页面会进入新画布。画布页面连接到 Runtime 后，Codex 才能读取和修改画布。先用 `canvas_list_open_canvases` 确定目标画布，再调用 `canvas_get_context` 读取写入前置条件。

## 常用提示

完整自动制作的固定启动方式：在 Agent 中 @「衍图」插件，输入 **Agent 全自动制作**，并附上剧本或指明已有剧本。也识别不加空格的 **Agent全自动制作**。

该入口加载原有整片制作规则，沿用本次明确的模型、规格与授权，自主完成资产、分镜、四宫格及切图、自检返修、视频、剪辑声音和真实成片交付，不要求逐镜指导。仅讨论或设置启动口令时不启动制作。当前对话已加载的旧入口不会因文件更新而替换；更新插件后在新对话使用。其他客户端仍需接通本包 MCP、完整读取技能并保持 Agent 运行，不能把关键词当作脱离客户端的后台任务。

```text
@衍图 Agent 全自动制作，按照已有制作规则完成我附上的剧本并交付成片。
打开本便携版衍图并读取当前画布
在当前画布创建分镜，逐镜连接图片和视频节点
检查画布 MCP 已接通的功能和未完成的生成任务
```

## 工具分组

- 画布：读取上下文、查找节点、原生节点创建、结构化分镜、素材引用、批量创作表、画布生成与合片。
- 图片工具：局部重绘、文字、人像、机位、照明、标注、透明背景、独立图层任务及全景查看；[工具对应与限制](skills/canvas-editing/references/image-toolbar-tools.md)。本地操作使用实际资源，AI 操作返回真实任务并继续验收。
- 导演与时间线：对象、镜头、摄影机、灯光、关键帧、真实 CAM 静帧/视频录制，以及视频、音频、字幕、文字、图片轨道和 MP4 成片。
- 项目：从剧本创建项目和画布，以及章节、资产、镜头、版本和工作流输出。
- 技能：`skill_catalog`、`skill_search`、`skill_read`、`skill_prepare`。
- 模型：`film_list_models`、`film_validate_strategy`。
- 整片：`film_create_run`、`film_get_run`、`film_update_plan`、`film_submit_step`、`film_get_tasks`。
- 验收：`film_probe_media`、`film_check_shot`、`film_record_step_result`、`film_render_timeline`、`film_verify_delivery`。

## Skill 职责

- `open-canvas`：连接或打开当前项目的衍图画布。
- `canvas`：通用画布操作路由。
- `canvas-context`：读取语义上下文、项目事实和资源状态。
- `canvas-editing`：可靠写入、批量校验和结果复核。
- `asset-aware-generation`：复用角色、场景、道具、风格和媒体资源。
- `film-production`：整片制作路由，加载本包 `yingce-film-production`；按真实模型能力与持久任务完成制作、恢复和交付。

## 排查

1. 在 Codex 插件页确认「衍图」来源是本便携版目录；插件 MCP 启动器位于 `plugins/yingce/scripts/start-mcp.mjs`。
2. 运行 `runtime_diagnostics`，检查 buildId、Runtime 连接、画布绑定和能力缺口。
3. 确认衍图画布页面已经打开并显示“本地 Canvas Agent 已连接”。
4. 查看本便携版 `logs/` 中的运行日志；不要分享包含渠道 Key 或登录凭据的本地配置。

## 完整打包与其他客户端

插件本体保存在本目录，完整便携包包含它。DeepSeek Harness可重新连接本包MCP并加载技能；当前Codex插件清单需转换注册方式，尚未实测。详细步骤见[DeepSeek迁移说明](DeepSeek迁移说明.md)。

## MCP 控制规则更新（2026-10-07）

上下文支持 `detail=summary` 刷新写入版本；默认 full 保持兼容。长提示词从目标节点的完整 metadata 读取。布局默认只整理明确节点，`ids=[]` 为全图。错误回执包含 code、operationOutcome、nextAction，用于区分本地断连和执行结果不确定；恢复先查原任务，避免重复生成。

规则同步到便携包和本机 Codex 缓存；正在运行的 MCP 和当前对话不会自动刷新工具清单及已读技能，新会话/重新连接后使用更新内容。一般画布编辑与整片制作规则按需加载，绘图、导演和时间线详细规则在编辑技能的参考文件中。

## 图片工具接入更新（2026-10-07）

补齐 8 个图片专用 MCP 入口，覆盖图片预检、编辑、分析、标注、独立图层、全景查看、素材保存及原生面板动作。GUI 去背景与图层拆分复用新的实际任务流程；图层为 2–6 个独立透明输出任务，不把一张合并图叫作拆分成功。透明度和画幅由实际返回像素核对，内容仍需审核。

整片制作技能 1.5.1、画布编辑 1.2.0、画布入口 1.1.3 已包含调用规则。软件网页编译后需要刷新；MCP 客户端需要重新发现工具。支持 MCP 的其他 Agent 可以读取软件技能库后从剧本接管，但仍需配置模型渠道并取得任务授权，不能保证每次生成零失败。
