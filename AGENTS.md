# Repository Guidelines（仓库贡献指南）

## 项目结构与模块组织
本仓库是一个基于微信小程序 + 腾讯云函数的课程预约系统。

- `miniprogram/`：小程序前端主代码。  
- `miniprogram/projects/A00/`：用户端页面（`*.js`、`*.wxml`、`*.wxss`、`*.json`）。  
- `miniprogram/pages/admin/`：后台管理页面。  
- `miniprogram/biz/`、`miniprogram/behavior/`、`miniprogram/helper/`：业务逻辑、行为复用与工具方法。  
- `miniprogram/cmpts/`：通用/业务组件。  
- `cloudfunctions/cloud/`：云函数后端（controller/service/model/framework）。  
- `demo/`：界面截图示例；`project.config.json`：微信开发者工具项目配置。  

## 构建、测试与本地开发命令
仓库根目录没有统一的 Node 构建脚本，主要通过微信开发者工具完成编译与调试。

- `cd cloudfunctions/cloud && npm install`：安装云函数依赖。  
- `cd cloudfunctions/cloud && npm test`：当前为占位脚本，默认会报错。  
- 微信开发者工具：导入仓库根目录后进行编译，并上传/部署云函数 `cloud`。  
- 可选联调：部署后调用 `cloudfunctions/cloud/config/route.js` 中测试路由（如 `test/test`）。  

## 编码风格与命名规范
- 保持现有 JS 风格：`tab` 缩进、单引号、与现有文件一致的分号习惯。  
- 文件命名沿用 snake_case 与页面后缀风格，如 `meet_index.js`、`admin_meet_list.wxml`。  
- 一个页面的 `js/wxml/wxss/json` 应保持同名前缀。  
- 公共逻辑优先沉淀到 `biz/`、`behavior/`、`helper/`，避免页面内重复实现。  

## 测试指南
当前未配置完整自动化测试，提交前至少完成：

- 微信开发者工具中的页面流程验证（含用户端与管理端）。  
- 云函数相关路由的冒烟测试。  
- 预约、签到/核销、导出等关键流程回归验证。  

## 提交与 PR 规范
现有提交历史以简短祈使句为主（如 `Initial Commit`、`Update README.md`），建议延续该风格。

- Commit：一次提交只做一类改动，标题简洁明确。  
- PR：需说明目的、主要改动路径、配置影响、手工测试步骤。  
- 涉及界面变更时附截图；有任务/Issue 时附关联链接。  

## 安全与配置建议
- 不要提交真实密钥、生产环境账号或敏感配置。  
- 发布前重点检查 `miniprogram/setting/setting.js` 与 `cloudfunctions/cloud/config/config.js`（Cloud ID、管理员账号、演示开关等）。  
- 确认 `TEST_MODE`、`IS_DEMO` 与目标环境一致。  
