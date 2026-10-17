# 技术

## 运行、交付、自检
- 技术栈：Three.js r169 + Vite 5 + Electron 33。
- 给用户的入口都是双击就能用的 .bat（先构建 `npm run build`，再 `npx electron . --page=<页面>`）：

| 文件 | 打开什么 |
|---|---|
| `开始游戏.bat` | 整个游戏 |
| `走廊验证.bat` | 隐藏关卡 `corridor_test`（`index.html?ep=corridor_test`） |
| `晃动技术验证.bat` | `jiggle.html` |
| `打包exe.bat` | 打包到 `release/` |

- **.bat 必须是 CRLF 换行**（LF 换行时 cmd 会解析错，双击打不开）。用 Python 写文件时 `newline=''` 加 `\r\n`。
- URL 参数（`src/main.js`）：
  - `?ep=<id>&step=<n>`：直接开打；
  - `&auto`：1P 自动打；
  - `&skip`：跳过漫画；
  - `?select`：直接进选关。
- 自检：
  - `NOA_SELFTEST=<png>` + `electron . --page=...` 会离屏跑几秒，写出截图和 `<png>.json`（报错、是否进入战斗、主角状态）；
  - 开发服务器：`.claude/launch.json` 的 trigger-poem-rec，端口 5310。
  - `tools/shot.cjs`（只给自己检查用）：
    - 用 Electron 截全尺寸图：`electron.exe tools/shot.cjs <端口> out.png 宽 高 [等待的选择器]`；
    - 参数不能带冒号，换网址用环境变量 `SHOT_URL`；
    - 其他环境变量：`SHOT_PRE`（先执行的 JS）、`SHOT_WAIT`、`SHOT_SEQ="js|帧数|间隔"`、`SHOT_EVAL`（取页面数据）。

## 存档
- git 存档，同步到用户 GitHub 私有仓库 `paperl2026-alt/trigger-poem`。登录走 Git Credential Manager，Claude 不碰密码。
- 用户双击：
  - `存档.bat`：存一次并同步，列出最近的存档编号；
  - `备份到D盘.bat`：把全部历史打包到 `D:\trigger-poem-backup\`。
- 不进存档（都能重新生成）：
  - `node_modules/`、`dist/`、`release/`；
  - `art/_shots/`；
  - `art/jiggle_test/`；
  - `tools/models/`（深度模型）。

## 内容包（DLC / 创意工坊同格式）
- 本体也是一个内容包：`public/content/base/`。
  - `pack.json` 列出各类数据文件；
  - 每个 JSON 开头的 `_doc` 用中文写了每个字段。
- 模组在 `mods/<id>/pack.json`（开发时在项目根，打包后在 exe 旁边）。同 id 深合并，新 id 新增。
- 数据分类：
  - `characters/`、`enemies.json`、`projectiles.json`、`bosses.json`、`items.json`；
  - `episodes.json`（`hidden: true` 不在选关里显示；`debug: true` 不发奖励）、`comics.json`、`sets/*.json`（关卡）；
  - `tuning/*.json`：combat、fever、economy、behaviors、layout、settings、soft；
  - `text/ui.json`、`theme.json`；
  - `ui/*.json`：title、select、manga、cursors；
  - `assets/` + `assets/manifest.json`（每张图的尺寸和标记）：
    - `hit`：做命中判定用的透明度遮罩；
    - `dom`：只在网页层用；
    - `relief`：深度浮雕图；
    - `weak`：Boss 弱点。
- 代码用到时才读 `C.*` / `T.*`（`T = C.tuning`），模组改值会生效。`content.js` 有每类数据的默认值，出错记在 `C.errors`。
- 加载顺序：`main.js` boot → `loadContent()` → initSettings / initSave / initLang / initTheme → 加载图片。

## 代码地图
- `src/core/`：
  - `content`（内容包加载）、`assets`、`audio`（程序合成音效，占位）；
  - `paper`（纸片 / 浮雕 shader）、`particles`、`post`（全屏后期）；
  - `tween`、`input`、`i18n`（`setLang` 会广播 `langchange`）、`save`、`settings`、`debug`。
- `src/battle/`：
  - `game.js`：一局的流程：漫画 / 小关 / Boss 步骤，停留点，刷怪波次，射击规则，掩体受击，奖励；
  - 场景：
    - **`panels.js`（PanelWorld，现行）**：平板拼搭的场景；
    - `world.js`、`level.js`：旧的 3D 房间；
    - `plates.js`：作废的静态画假 3D，序章暂时还挂着；
  - `player.js`：前景主角的状态、射击、受伤、Fever；有 `rig` 的角色用 `heroine.js`（晃动技术画的两张立绘 cover / fire），没有的退回旧纸片 + `soft.js`；
    - 主角在第 1 层（layers），`Game.render` 先画场景（含描边），再单独画主角，场景和描边永远压不到她；
  - `muzzle.js`：射击特效（火光图 shader + 光晕 + 冲击环 / 符咒环 + 粒子，随 Fever 分级）；
  - `enemies.js`：Actor 纸片 + 浮雕、行为模板（walker / flyer / thrower / crawler）、飞行物、`blast`（必须躲的攻击）；
  - `boss.js`、`giant.js`：Boss（旧花车；巨大化风纪委员）；
  - `fx.js`：粒子、弹道、预警圈、拟声字、怪物蓄力光（`charge`）、声波（`soundWave`）；`fever.js`、`characters.js`、`items.js`、`soft.js`。
- `src/ui/`：
  - `title`（标题+设置）、`select`（选关，类名一律加 `s-` 前缀）；
  - `manga`（翻页转场）、`comic`（漫画播放）；
  - `hud`（战斗 HUD 外壳：教程提示、开场横幅、伤害数字仍是 DOM）+ **`glhud`（战斗 HUD 本体，WebGL）**：效果图拆出的图层 + 程序画的文字（画布文字贴图）、条、环、格、弹药、Q 版头像、准星、装填图、倒计时、Boss 条；位置数据在 `ui/battle.json`（效果图像素，按屏幕高度换算，四角锚定）；
  - `screens`（旧结算等）、`uifx`（菜单粒子）、`cursor`。
- `src/jiggle/`：晃动技术（见下），`jiggle.html` 验证页和战斗主角（`heroine.js`）共用。

## 场景：PanelWorld（`src/battle/panels.js`）
- 关卡数据：`sets/<id>.json`，写 `"panels": true`。字段见文件里的 `_doc`。
- 结构：
  - `hall`：尺寸，两侧墙一段段的立面图，地板 / 天花板平铺图；
  - 地板切成小块，能折起来；
  - `foldZ` 之后挂在铰链上，能整体往上弯；
  - 窗户抠空，外面是远景板；
  - `decals`：贴花；
  - `stations`：停留点，有镜头 `cam`、看向 `look`、来路 `via`、掩体 `covers`、怪物波次 `waves`、`fold`。
- 掩体（规矩见 DESIGN「掩体」）：
  - 关卡数据里只写每个停留点两人各用哪张图（`k`、`side`、`flip`），开局就立在走廊里；
  - `placeCovers(players)`：按主角在这个停留点的站位算出位置和大小（立在她身后一点、顶边约在她跪姿 72% 高），布局变了重算；数值在 `tuning/layout.json` cover；
  - 有耐久（`tuning/combat.json` cover），打烂向后倒；离站时 `dropCovers` 向后折倒压平（返回用时，Game 等它倒完才让人起身）。
- 多版本：墙、天花板、尽头墙可以写一组图，按 `seed` 打乱、相邻不重复；地板按 3m 块随机（各版本边缘统一，拼不出缝）。
- 和旧 World 接口相同（`place`、`travel`、`setCovers`、`covers`、`project`、`lightAt`……），Game 不用分支。多了：
  - `fold()`：走廊弯起、地板翘成棱；
  - `render()`：先渲到带深度的目标，再做描边和纸纹，然后 Game 画前景主角和 HUD。
- 怪物位置：波次里写走廊坐标 `x` / `z`（米），浮空的写 `y`。

## 浮雕和卡通光（`src/core/paper.js`）
- 纸片网格有 `relief` 贴图时，顶点按远近往镜头方向推出（`reliefAmt`），片元用浮雕算法线，打两段卡通光，并写深度。
- Actor 用 manifest 里的 `relief` 自动开启；换帧时浮雕图跟着换。

## 晃动技术（`src/jiggle/`，入口 `jiggle.html`）
- 单张 NIKKE 式立绘做出动画，不用 Spine。每个角色两张：`<cat|pink>_cover`、`<cat|pink>_fire`。
- 分层（`rig.js`）：
  1. 身体层：重心在两胯间移动（脚钉地）、上身绕腰摆、呼吸、屁股下沉；
  2. 部件层：裙摆、飘带、袖子下垂；头发、尾巴是链条，有行波；耳朵、头会转；
  3. 肉层（`flesh.js`）：22×34 软体网格，每点的软硬场决定弹簧参数；力会传导（屁股 → 大腿，到膝盖为止）；竖向压缩时横向鼓。
- 其他文件：
  - `sweat.js`：汗；
  - `atmo.js`：快门运动模糊、鼻尖白气（环境氛围默认关）。
- 数据在 `public/jiggle/`：
  - `<pose>.png`；
  - `<pose>_w0..w3.png`：12 通道权重，由 `tools/jiggle_masks.py` 生成；
  - `<pose>_rig.json`：线和枢轴；
  - `flesh.json`：软肉团、四肢、钉住点、呼吸区、鼻尖；
  - `meta.json`；
  - 预览软硬场：`tools/flesh_preview.py`。
- 参数：强度 0.35、射击节奏 1.6Hz、汗 0.8（`main.js` 的 SET）。
- 每张新立绘目前要人工标区域。

## 已知的坑
- 预览面板隐藏时截图不刷新；后台标签页会冻结 CSS 动画。
- 不要用 `panel` 当类名（旧全局 `.panel` 黑底）；选关页类名一律 `s-` 前缀（旧全局有 `.swap .card .go .best`）。
- Windows 下 Electron 参数里带冒号会直接退出。
- `src/style.css` 里有旧界面的全局样式，新界面要避开撞名。
- 便携版（`npm run portable`）能构建，没实际运行验证过。
- 序章（ep0）现在还挂在作废的 `plates.js` 场景上，等教室 / 玄关 / 操场按 PanelWorld 重做后切换。
