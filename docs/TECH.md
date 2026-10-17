# 技术

## 运行、交付、自检
- 技术栈：Three.js r169 + Vite 5 + Electron 33。
- 给用户的入口只有根目录的 `开始游戏.bat`，一个菜单（每项都先 `npm run build`，再 `npx electron . --page=<页面>`）：

| 选 | 打开什么 |
|---|---|
| 回车 | 整个游戏（`npm run app`） |
| 1 | 隐藏关卡 `corridor_test`（`index.html?ep=corridor_test`），当前在做的关卡验证 |
| 2 | `jiggle.html` 晃动技术验证 |
| 3 | 打包到 `release/`（`npm run exe`） |
| 4 / 5 | 存档并同步 GitHub / 全部历史备份到 `D:\trigger-poem-backup\` |

- 新的验证页加成菜单里的一项，不再加新的 bat。

- **.bat 必须是 CRLF 换行**（LF 换行时 cmd 会解析错，双击打不开）。用 Python 写文件时 `newline=''` 加 `\r\n`。
- URL 参数（`src/main.js`）：
  - `?ep=<id>&step=<n>`：直接开打；
  - `&auto`：1P 自动打；
  - `&skip`：跳过漫画；
  - `&team=cat,pink`：指定 1P、2P（测换队）；
  - `?select`：直接进选关。
- 自检：
  - `NOA_SELFTEST=<png>` + `electron . --page=...` 会离屏跑几秒，写出截图和 `<png>.json`（报错和报错位置、是否进入战斗、主角状态）；这是**交付前必须过的检查**：用的是和用户一样的构建产物（`dist/`），两种队伍顺序都要跑；
  - 开发服务器：`.claude/launch.json` 的 trigger-poem-rec，端口 5310。
  - `tools/node/shot.cjs`（只给自己检查用）：
    - 用 Electron 截全尺寸图：`electron.exe tools/node/shot.cjs <端口> out.png 宽 高 [等待的选择器]`；
    - 参数不能带冒号，换网址用环境变量 `SHOT_URL`；
    - 其他环境变量：`SHOT_PRE`（先执行的 JS）、`SHOT_WAIT`、`SHOT_SEQ="js|帧数|间隔"`、`SHOT_EVAL`（取页面数据）。

## 存档
- git 存档，同步到用户 GitHub 私有仓库 `paperl2026-alt/trigger-poem`。登录走 Git Credential Manager，Claude 不碰密码。
- 用户在 `开始游戏.bat` 菜单里：4 存一次并同步，列出最近的存档编号；5 把全部历史打包到 `D:\trigger-poem-backup\`。
- 不进存档（都能重新生成）：
  - `node_modules/`、`dist/`、`release/`；
  - `art/_shots/`；
  - `art/jiggle_test/`；
  - `tools/models/`（深度模型）；
  - `art/jobs/`（Codex 任务文件，由 `tools/make_jobs.py` 从 `tools/rounds/job_specsNN.py` 生成）。
- 目录：`tools/` 通用脚本（出图流水线、浮雕、咒印、测量、拆解），`tools/rounds/` 每轮出图的提示词和导入，`tools/node/` 构建 / 打包 / 截图。

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
    - 敌方时钟 `etw`：怪物、Boss、飞行物、刷怪按 `tuning/combat.json` pace 慢放（画面动画仍是实时）；
    - 教学卡 `teach`：停留点写 `lesson` 的先弹卡（`text/lessons.json`，`hud.lesson`），只第一次；
    - 飞行物自带准星：子弹打在准星圈里就算击落（`targetsAt`，`tuning/combat.json` sightMin / sightK）；
    - 奖励 `applyRewards`：不评级；通关固定 + 击杀、首通、满级换伍德刀盾、书包倍率（道具等级 `SAVE.itemLv`），记录最短全通关时间，首通给 `reward` 道具；
    - 每个小关可以有自己的场景（`episodes.json` 步骤写 `set`）：`useSet` 换场景时把两位主角、粒子挂到新场景上，旧场景 `dispose`；从中途开始（选关选了后面的小关）直接建那一关的场景；
    - `interlude(id, then)`：战斗中插一页漫画（Boss 变身），停火、播完让两人回掩体，再交给 `then`；
    - 射击会被挡：场景里标了 `occlude` 的板（操场的教学楼）挡在怪 / Boss 前面时打不到后面（`targetsAt`）；
  - 场景：
    - **`panels.js`（PanelWorld，现行）**：平板拼搭的场景；
    - `world.js`、`level.js`：旧的 3D 房间；
    - `plates.js`：作废的静态画假 3D（已没有关卡用它）；
  - `player.js`：前景主角的状态、射击、受伤、Fever；有 `rig` 的角色用 `heroine.js`（晃动技术画的两张立绘 cover / fire），没有的退回旧纸片 + `soft.js`；
    - 主角在第 1 层（layers），`Game.render` 先画场景（含描边），再单独画主角，场景和描边永远压不到她；
  - `muzzle.js`：射击特效（火光图 shader + 光晕 + 冲击环 / 符咒环 + 粒子，随 Fever 分级）；
  - `enemies.js`：Actor 纸片 + 浮雕、行为模板（walker / flyer / thrower / crawler）、飞行物、`blast`（必须躲的攻击）；
  - `boss.js`、`giant.js`：Boss（旧花车；巨大化风纪委员，见下面「Boss」）；
  - `fx.js`：粒子、弹道、预警圈、拟声字、怪物蓄力光（`charge`）、声波（`soundWave`）；`fever.js`、`characters.js`、`items.js`、`soft.js`。
- `src/ui/`：
  - `title`（标题+设置）、`select`（选关，类名一律加 `s-` 前缀）；
  - `manga`（翻页转场）、`comic`（漫画播放）；
  - `hud`（战斗 HUD 外壳：教程提示、开场横幅、伤害数字仍是 DOM）+ **`glhud`（战斗 HUD 本体，WebGL）**：效果图拆出的图层 + 程序画的文字（画布文字贴图）、条、环、格、弹药、Q 版头像、准星、装填图、倒计时、Boss 条；位置数据在 `ui/battle.json`（效果图像素，按屏幕高度换算，四角锚定）；
  - `game.lull`：战斗暂停一下（Boss 变身）：玩家不能开火、不受伤，必杀计时停住（player.js），Boss 不吃伤害（thing.js）。
  - 必杀好了：`Heroine.setReady`，立绘网格再画三份剪影（rig 着色器 auraOnly=2），从身体中部放大变淡循环（`tuning/soft.json` jiggle.echo：beat 周期、grow 放大、a 不透明度）；HUD 头像环上方「必杀 OK!」在 `glhud` Panel。
  - 攻击提示在 `fx.lock` → `fx.orbit`（DESIGN「攻击分三种」）：环是 `ORBIT_FRAG` 着色器画在一块方片上（快打红粉圆环一缩一放；快躲紫色斜环带，`side` 只画前半圈 / 后半圈，后半圈的方片和走到后面的卫星放在世界场景里一个面朝镜头、按那里一像素多大缩放的 group，摆在怪中心沿视线往后 0.6，靠透明物体由远到近排序被怪挡住；`flare` 耀斑）；爱心和翅膀是 `src/ui/marks.js` 画的画布贴图；`lock.set(x, y, size, p, t, left, box, wc)`，wc 是怪的世界中心；闪避 LED 小条在 `glhud` 的 `Dodge`（`src/ui/ledsign.js` 先在一格一像素的小画布上画字和花边、再按格画成发光圆点，位置 `ui/battle.json` center.dodge）；
  - `alerts`（街机式醒目提示：屏幕边缘只剩低血量；RELOAD! / NO AMMO! 半屏闪、被打裂屏 + OUCH!、倒地半屏 CONTINUE? + 倒计时、必须躲时全屏 DANGER!!；装填的 Q 版大头贴纸在她角落不规律叠）；
  - `space`（弹出物找空地：避开 HUD、Boss 条、教程提示、两人当前身形）、`hold`（不能射击时的警示覆盖，文字在 `text/holds.json`）、`stickers`（气泡贴纸，台词在 `text/stickers.json`）；
  - `hud.showBanner` 旧接口：战斗中变成气泡（`stickers.callout`），战斗外变成警示覆盖；
  - 道具和书包都在 `src/battle/items.js`：`itemFxAt(id, lv)` 按 items.json "grow" 算某级效果（线性或每级同倍数），`itemPrice` / `capPrice` 升级 / 扩容价格（取整到 5 / 50 / 500），`buyItem` / `upgradeItem` / `upgradeCap` / `toggleEquip`（装备超过 cost 上限返回 'full'），`itemDesc` 把描述里的 {键} / {键%} 换成当前等级的数字；`bagFx(bag)` 合计效果给战斗用。
  - `screens`（结算 `showResults`：漫画杂志目录页，版式在 `style.css .res8`，条目按数据重复；数据来自 `Game.applyRewards`：`st.newItems` 只有首通的新道具、`st.unlocked` 只有新开的章节、`st.mulBy` 每个倍率道具一条；插画 `res/cover`、`res/face_<角色>`、`res/item_<道具>`，没有就退回 Q 版脸 / 道具图标）、`uifx`（菜单粒子）、`cursor`。
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
- `hall` 里天花板、尽头墙、窗外远景都可以不写（操场露天）；墙图在 manifest 标了 `keyed`（抠空）就透明；`outsideAt` 摆窗外远景板，`outsideX` 是异变后的远景。
- `boards`：自由摆放的板（教学楼正面、天空、教室后墙），`name` 给代码用（`world.named`，Boss 找教学楼），`occlude` 挡子弹，`sky` 不受雾影响。
- 异变（`updateAnomaly`，Game 的 `invade` 把 `world.anomaly` 从 0 补间到 1）：每块有 `<图>_x` 版本的板从 `anomalyFrom` 那一点开始按距离一块接一块翻过去（压扁到一条线、离开表面、换图、再展开）；灯光 / 雾 / 天空跟着过渡到 `anomalyLit` / `anomalyFog` / `anomalySky`；`anomaly: true` 的贴花异变后才长出来。
- 道具（`props`）站在某个停留点的掩体位置上时不画（`clearProps`，掩体按主角站位算，事先不知道在哪）。
- 和旧 World 接口相同（`place`、`travel`、`setCovers`、`covers`、`project`、`lightAt`……），Game 不用分支。多了：
  - `fold()`：走廊弯起、地板翘成棱；
  - `render()`：先渲到带深度的目标，再做描边和纸纹，然后 Game 画前景主角和 HUD；
  - `fit(p, h, w, fly)`：怪物看得清（DESIGN「战斗画面布局」）：出场时挪到离镜头不太远（至少占屏幕高 `minShare`）、不比掩体近、脚在 HUD 带之上、左右在画面中间、飞的在上半屏；跟着停留点的朝向算；停留点的 `monsterFar` 能再拉近（走廊折叠后地板翘起的棱在后面）；数值 `tuning/layout.json` monster；
  - `dispose()`：换场景时释放。
- 怪物位置：波次里写场景坐标 `x` / `z`（米），浮空的写 `y`；只是大概位置，出场时 `fit` 会挪。
- 序章三个场景在 `sets/ep0.json`：教室（平静 → 异变翻板；第二个停留点镜头转身看后墙）、走廊（沿用走廊验证，站点间转弯、折叠）、操场（Boss）。

## Boss：「？？？」（`src/battle/thing.js`，数据 `bosses.json` qq）
- 一整张图按动作分帧（R43 `boss/qq_s<n>_<idle0|idle1|move|windup|attack|hurt>`），五个阶段换一套帧、换大小（`setStage` 重建网格），后两阶段浮空；在 `zone` 里来回移动。
- 招式一次一个（`stages[].pattern`）：drift（换位置、喘口气）、volley（飞行物，红环）、lunge（蓄力扑过来，快打红环，能打断）、burst（长蓄力大招，快躲紫色环带）、summon（一种杂鱼）。
- 蓄力和出招时弱点张开（描边变粉、伤害 ×weakMul），最后的核心阶段一直是弱点；血量到 `at` 时变异（抽搐、溅黏液、长成下一阶段，wreckAt 那一阶段把教学楼换成被压坏的那张），不插漫画。
- 时间都走敌方时钟（`game.etw`）。

## （旧）巨大化风纪委员（已删，2026-10-17 用户第七批推翻）
- 曾经的做法，代码和素材已从内容包删掉（原图在 `art/raw/r42`），这里只留作历史：在操场打，她太大，屏幕里只有局部；三个形态各有自己的一套部件（`Part`：一个挂在锚点上的组，能显示不同样子，每种样子的几个版本出场时随机挑，受伤痕迹跨样子保留；画多宽、锚点在 `parts`）。
  - 一形态：头在教学楼屋顶后面（按镜头到屋檐的视线算高度，屋檐挡住眼睛以下）、双手扒屋檐、头发垂在楼前；招式：扔手机 / 漫画、抬手拍掩体（抬着的时候打手能打断）、吹哨（必须躲），之后第三只眼睁开（弱点）；平时会眨眼，挨打多了会生气；
  - 二形态：在楼后站起来，教学楼换成被压坏的那张，镜头上仰；手臂垂在楼前；招式由一只「动作手臂」顶替那边垂着的手臂：举尺（臂章是弱点，打够了打断）、甩胶带（连射）、指人（单打一个人，要躲）、交叉手臂防御（减伤）+ 召怪；
  - 三形态：俯身压到操场上空，脸占满天空，头发帘垂在两边，双手从上面伸下来；第三只眼是单独一块盖在额头上（`eyeAt` 按每张脸对齐），一直是弱点；招式：喇叭尖叫（躲）、连射、抓掩体（打手能打断）、召怪。
- 形态之间：旧形态沉下去 → `game.interlude` 播变身漫画页（`comics`）→ 新形态登场，镜头转到 `look`（掩体按新镜头重摆）→ 再开打。
- 判定：每块部件的网格就是判定（按透明度），弱点是 `weak` 里的圆（按画出来的部分算）；受伤只变色不打洞（paper.js solid）。

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
