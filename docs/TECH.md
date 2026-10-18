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
- 调试菜单（`` ` `` 键，`src/core/debug.js`）：每个大关一行（开场、每个小关连同它前面的漫画 / 开门特写、结尾），按 episodes.json 自动生成，选关里还是"制作中"的大关也能进。
- 自检：
  - `NOA_SELFTEST=<png>` + `electron . --page=...` 会离屏跑几秒，写出截图和 `<png>.json`（报错和报错位置、是否进入战斗、主角状态）；这是**交付前必须过的检查**：用的是和用户一样的构建产物（`dist/`），两种队伍顺序都要跑；
  - 整关通关测试：`electron tools/node/playthrough.cjs <out.json> [大关] [第几步]`，用构建产物离屏自动打（1P 自动、无敌、`PT_SLOW` 倍速，默认 3），每秒记一次走到哪一步 / 哪个停留点 / 第几波 / Boss 血量，打到结算或超时（`PT_TIME` 秒）为止，写出时间线和报错；`PT_TEAM=cat,pink` 换队，`PT_SHOTS=1` 每到新停留点截一张图，`PT_EVERY=<毫秒>` 每隔这么久截一张（看演出），`PT_NOSKIP=1` 漫画和开门特写照常播，`PT_JS=<js>` 每次在页面里执行（自动打不碰机关：要测机关就用它打，例如每次打一个还能打的 `prop`）。改了关卡数据或流程后跑一遍（序章约 2 分钟）。
  - 开发服务器：`.claude/launch.json` 的 trigger-poem-rec，端口 5310。
  - `tools/node/shot.cjs`（只给自己检查用）：
    - 用 Electron 截全尺寸图：`electron.exe tools/node/shot.cjs <端口> out.png 宽 高 [等待的选择器]`；
    - 参数不能带冒号，换网址用环境变量 `SHOT_URL`；
    - 其他环境变量：`SHOT_PRE`（先执行的 JS）、`SHOT_WAIT`、`SHOT_SEQ="js|帧数|间隔"`、`SHOT_EVAL`（取页面数据）。

## 声音
- `src/core/audio.js`：所有音效先用 WebAudio 合成（临时）；content `audio/sounds.json`（内容类别 sounds）里填了文件的，就放文件（随机挑一个、每次略微变调），没有的照旧合成。不在清单里的文件一律不去加载。
  - `sfx`：每种音效（when 什么时候响、want 想要的感觉、src 打算从哪来：lib 音效库 / tts 语音合成后期 / synth、files、vol）；
  - `monsters`：怪物叫声（按怪的种类 × windup / attack / hurt / die），`cry(type, act)`，现在挂在蓄力和死亡上；
  - `voices`：角色语音（model 声音模型、read 每个场合的风格和语速、say 改读音、credit 署名），`lines` 登记有文件的台词（键 `<场合>_<第几句>`，对应 text/stickers.json 的同一句）；`voice(who, kind, i)` 在气泡出现时说（stickers.js、标题页气泡）。
  - 文件路径相对内容包（`soundPaths` 在 content.js 里转成网址），所以模组也能换声音。
  - sounds.json 每种声音可选 `len`（只放前几秒，结尾 60ms 内淡出）、`rate`（变调）；怪物叫声按种类有 `rate` / `vol`。便携版声音也从内嵌表取（window.__NOA_CONTENT）。
  - 解码时 `level()` 量一次：峰值拉到 0.7、从第一声（裁掉开头静音）开始放；不同音效库的响度差别不用手调。
  - 挑素材的工具：`tools/node/sfx_scan.cjs`（ART「声音」）。
- 语音生成：`tools/voice_aivis.py`，用 AivisSpeech（免费、在本机跑的日语语音合成，Style-Bert-VITS2）。
  - 引擎和 ffmpeg 不进 git，手动解压：官方 Windows zip 解到 `tools/aivis/app/`（GitHub Aivis-Project/AivisSpeech，官网下载按钮给的那个版本），BtbN 的 ffmpeg Windows 构建解到 `tools/ffmpeg/`。
  - `start`：引擎没开就在后台开（`run.exe --port 10101`，日志 `tools/aivis/engine.log`），并从 AivisHub 装上 sounds.json 写的模型（引擎第一次启动还会自己装官方默认模型 コハク、まお；模型在 `%APPDATA%\AivisSpeech-Engine\Models`）。
  - `read <角色>`：不出声音，列出每句用的风格和引擎实际的读法（假名）。汉字读错就在 `say` 里写假名。
  - `lines <角色> [场合 | 场合_第几句 …]`：读 text/stickers.json 的日语台词，♡ ♪ 不念、空格当停顿、~ 当长音，按 `read` 设好风格、语速、语气浓淡；生成后裁掉首尾静音、峰值拉到 -1 dB，用 ffmpeg 转 Ogg Opus 48k，写到 `public/content/base/voice/<角色>/<场合>_<第几句>.ogg` 并登记进 `lines`。不写场合就整个重做。
  - `say <角色> <风格> <输出> <文本>`：试一句。
  - 音高（pitchScale）不调：AivisSpeech 一动音高音质就变差。
- BGM 仿写的做法（待用户给参考曲、同意装工具）：用 basic-pitch 把参考曲转成 MIDI、librosa 测速度 / 调 / 段落，Claude 保留风格（配器、速度、和声走向、段落结构）重写旋律，渲染成导引音轨，再交给 Suno 的「用上传的音频改编」出成品；不照抄旋律（旋律有版权，和声走向和风格没有）。

## 存档文件（游戏进度，不是下面的 git 存档）
- 桌面版（Electron）：`electron/store.cjs` 把每份存档（`save` 进度、`settings` 设置）写两处：
  - 绝对位置 `%APPDATA%\Trigger Poem\saves\`（一定能写；以后 Steam 云存档同步这个文件夹，Steamworks 后台 Auto-Cloud 根目录选 WinAppDataRoaming、子目录 `Trigger Poem/saves`）；
  - 相对位置 `<游戏 exe 所在文件夹>\saves\`（开发时是项目下的 `saves/`，不进 git）；装在没权限的地方会写失败，跳过不影响。
  - 每次写：先写 `.tmp` 再改名（写到一半崩了也不会留下半个文件）；文件里有递增序号和校验码；每处保留最近 3 份旧版本（`save.bak1..3.json`）。
  - 读：两处的所有份（含旧版本）都读，解析失败或校验不对的丢掉，取序号最大的；都没有就退到 localStorage（以前版本的存档从这里自动搬过来）。localStorage 每次也写一份，作为最后的备份。
  - 页面通过 `electron/preload.cjs` 的 `window.native`（read / write / status / open）调用；游戏这边统一走 `src/core/store.js`；浏览器里只有 localStorage。
  - 自检用自己的临时文件夹（`%TEMP%\trigger-poem-selftest\saves`），报告里 `store: "ok"` = 存档写入再读回成功。
  - 调试菜单（`` ` `` 键）"存档文件"一行：两处各自写成功没有，"打开存档文件夹"。
- 存档格式版本 `SAVE_VERSION`（`src/core/save.js`）：要改存档结构时加 1，在 `MIGRATE` 里写旧版怎么转；读到旧版本的存档时先原样另存一份 `save.v<旧版本>`，再转换。开发阶段就靠这个，不按阶段分存档。

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
  - `game.js`：一局的流程：漫画 / 开门特写 / 小关 / Boss 步骤，停留点，刷怪波次，射击规则，掩体受击，奖励；
    - 步骤分两类（`content.js isStage`）：小关（`stage` / `boss`，选关里一行一个）和转场（`comic` 漫画页、`door` 开门特写）；选关从某个小关开始时，连同它前面紧挨着的转场一起播；
    - 开门特写（步骤 `door: { frame, leaf, leaves, hinge }`，`src/ui/door.js`）：原作每次进门的第一人称开门画面：黑底上的门框（门洞涂黑，导入时量出 manifest `hole`），门扇按铰链用 CSS 3D 慢慢转开（双开门左右各半张），吱呀声（sounds.json `creak`），再推镜头穿过门洞；点一下跳过；
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
  - 书包页 `src/ui/bag.js`（选关的「书包」页签，盖在队伍卡片上；位置 `ui/select.json` bag；样式 `select.css` .s-bag，--u = 参考图 1 像素）。
  - 道具和书包都在 `src/battle/items.js`：`itemFxAt(id, lv)` 按 items.json "grow" 算某级效果（线性或每级同倍数），`itemPrice` / `capPrice` 升级 / 扩容价格（取整到 5 / 50 / 500），`buyItem` / `upgradeItem` / `upgradeCap` / `toggleEquip`（装备超过 cost 上限返回 'full'），`itemDesc` 把描述里的 {键} / {键%} 换成当前等级的数字；`bagFx(bag)` 合计效果给战斗用。
  - `screens`（结算 `showResults`：漫画杂志目录页，版式在 `style.css .res8`，条目按数据重复；数据来自 `Game.applyRewards`：`st.newItems` 只有首通的新道具、`st.unlocked` 只有新开的章节、`st.mulBy` 每个倍率道具一条；插画 `res/cover`、`res/face_<角色>`、`res/item_<道具>`，没有就退回 Q 版脸 / 道具图标）、`uifx`（菜单粒子）、`cursor`。
- `src/jiggle/`：晃动技术（见下），`jiggle.html` 验证页和战斗主角（`heroine.js`）共用。

## 怪怎么逼近、场景破坏（`src/battle/enemies.js`、`src/battle/panels.js`）
- 出场：地上的怪和飞的怪至少站在 `tuning/layout.json monster.spawnMin` 米外（最多 `spawnFar`），再逼过来；波次写 `near: true` 就按原来的规矩（站在看得清的近处）。
- `move`（波次单独写 > 这种怪的 `moves`[第几个造型] > `move` > 按行为模板默认）：
  - 走路怪：`walk` 直走、`hop` 一跳一停、`zigzag` 左右翻滚走 Z 字（图转一整圈）、`charge` 慢慢挪，到 `chargeDist` 米内远远蓄力（红环）再整段扑过来（冲撞，穿过掩体）、`burrow` 钻进地里在几米外钻出来（`from: 'burrow'` 也能从地下出场）；参数 `tuning/behaviors.json walker`；
  - 飞的：`float` 每一秒左右换个点飘，每俯冲一次悬停点往前靠 `homeStep` 米；
  - 扔东西的：`step` 扔完还远（深于 `stopDist`）就往前走几步（会躲的那种缩下去挪过去再冒出来）；蓄力和出手时只吃 `throwArmor` 倍伤害（霸体）；一次扔的个数 `burst`。
- 场景道具能打坏（set 的 `props`，写 `solid: true` 的不坏）：挡子弹（`Game.hitMeshes` 带上 `world.breakableMeshes()`，透明处不挡：道具图在 manifest 标了 `hit` 建了 alpha 遮罩），打了留洞，血量 `tuning/combat.json prop.hp`，没血了往后倒、淡出；怪走路 / 跳 / 冲过去会撞碎（`smashPropsNear`）。

## 图片按小关加载（`src/core/groups.js`、`src/core/assets.js`）
- 为什么：一张图不管文件多小，解码后都是 宽 × 高 × 4 字节（加 mipmap 再多 1/3），全部内容包解码约 6 GB；three.js 的贴图不会被垃圾回收，只有 `dispose()` 才从显卡上释放。所以不能一口气全读，也不能读了不放。
- 分组（运行时从内容算出来，模组的新大关也一样分）：
  - 一个小关的图 `stageKeys(ep, step)`：它的场景（板、掩体、道具、贴花、机关）、波次里的怪（每个造型的每一帧）、它们的飞行物、Boss 的全部图，连同浮雕图和 `_x` 腐化版；
  - 核心 `coreKeys()`：没有任何小关认领的（界面、HUD、特效、两位主角）；`ep1/…`、`cover/ep1_…` 这种带大关名的图即使还没被用到也不算核心；只被旧数据（没有大关用的场景、怪、Boss）用到的也不算核心；
  - 漫画页从来不做成贴图（只用 `<img>` 显示）。
- 时机：启动只读核心（`setManifest` + `loadKeys(coreKeys())`）；开局前读起始小关的（`main.js needPics`，没读完就显示读条）；每个漫画页 / 开门特写一开始，后台读下一个小关的；小关开始时等它的图（没读完显示读条），然后 `releaseExcept(核心 + 这个小关)` 把别的全部释放。任何时候只有核心 + 一到两个小关在内存里，显存不随大关数量增长。
- 实测（2026-10-18，`playthrough.cjs` 的 mem）：第 1 话通关时显卡上的贴图 94 → 894 张一路涨（改之前）→ 一直在 380～580 张（改之后），估算显存 350～760 MB；启动后页面内存 942 → 413 MB。页面内存还会每关慢慢涨约 40 MB（可能是 Chromium 的图片缓存），待长时间连续玩验证会不会封顶。
- 以后要再省：显卡压缩贴图（KTX2 / Basis，显存约减到 1/4～1/8，要下载编码工具）；内容包里删掉不用的旧图（tsubaki / kagura 已删）。

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
- 现实 ↔ 腐化来回翻（第 1 话，DESIGN「第 1 话」）：set 写 `turns: true`（`start` = 开场是 0 现实还是 1 腐化），Game 就不再按序章的规矩强制异变（`settleAnomaly`）；
  - 站点写 `turn: { to, from, dur, hit, wait }`：到站、蹲好后先翻再开打；
  - 波次里可以夹事件 `{ t, turn: {...} }`（没有 `type` 的条目不算怪）；
  - `Game.turn(spec)` → `PanelWorld.turnFrom(from, dir)`：按新的起点重算每块板的远近，翻回现实时从起点往外一块块翻回去（`turnDir` -1）；`hit` 带闪光、震屏、重击声。
- 道具（`props`）站在某个停留点的掩体位置上时不画（`clearProps`，掩体按主角站位算，事先不知道在哪）。
- 和旧 World 接口相同（`place`、`travel`、`setCovers`、`covers`、`project`、`lightAt`……），Game 不用分支。多了：
  - `fold()`：走廊弯起、地板翘成棱；
  - `render()`：先渲到带深度的目标，再做描边和纸纹，然后 Game 画前景主角和 HUD；
  - `fit(p, h, w, fly)`：怪物看得清（DESIGN「战斗画面布局」）：出场时挪到离镜头不太远（至少占屏幕高 `minShare`）、不比掩体近、脚在 HUD 带之上、左右在画面中间、飞的在上半屏；跟着停留点的朝向算；停留点的 `monsterFar` 能再拉近（走廊折叠后地板翘起的棱在后面）；数值 `tuning/layout.json` monster；
  - `dispose()`：换场景时释放。
- 怪物位置：波次里写场景坐标 `x` / `z`（米），浮空的写 `y`；只是大概位置，出场时 `fit` 会挪。
- 序章三个场景在 `sets/ep0.json`：教室（平静 → 异变翻板；第二个停留点镜头转身看后墙）、走廊（沿用走廊验证，站点间转弯、折叠）、操场（Boss）。
- 第 1 话七个地方在 `sets/ep1.json`（店内、画廊、玻璃温室、冷库、烤炉厨房、冥界、大舞厅）。`hall` 的墙、天花板、尽头墙都可以不写（冥界四面是空的）。
- 名场面用到的东西（DESIGN「第 1 话」）：
  - **回头杀**（站点 `scare: { type, sprite, x, z, who, zoom }`，`Game.scare`）：怪以 `from: 'scare'` 出场，状态 `scripted`（不动、不打），镜头用 `fovKick` 慢慢推近、停音乐，`who` 那个女孩冒 `scare` 台词，`Enemy.turnAround` 按 `frames.scare` 六帧慢慢回头，露脸那一下闪白、震屏、两人吓到，然后照常开打；
  - **机关**（set `gimmicks`，`src/battle/gimmick.js`）：挂在墙上 / 站在地上 / 尽头墙上能打的画、铠甲、封印、棺材盖；带白描边，只在自己的站点能打，打够 `hp` 下就按顺序执行 `do`（`flash` 闪光、`flip` 翻成 `kx`、`turn` 翻地方、`spawn` 刷怪、`say` 台词、`sfx`、`gone` 消失）。`prop: true`：波次不等它，AI 队友不打它（`input.js`）；
  - **鬼魂抓走**（站点 `grab`，`Game.grabbed`）：赶到这个站点的路上，一双鬼手扑满屏幕（`#ui .grab`），镜头被拖着晃过去；
  - **木板桥**（站点 `bridge`）：赶路走到一半咔嚓一声，震屏、两人吓到、冒 `bridge` 台词；
  - **从别处进来**（小关第一个站点的 `enter: { from, dur, shake, overlay, sfx }`，`Game.enterFrom`）：镜头从偏移 `from` 的地方移到站点（掉进坑：从上面落下来、震屏；被拽出坑：从下面升上来，`overlay` 的图（猫爪）同时从屏幕上方伸下来再拉走，`#ui .haul`）。
- 怪物 `rush: true`（走路怪）：扑上来是冲撞（穿过掩体），带快打环、蓄力能被打断（半截丧尸）。

## Boss：「？？？」（`src/battle/thing.js`，数据 `bosses.json` qq）
- 只有核心吃伤害（每个形态 `core: [u, v, 半径]`，图上从左、从下的比例，半径按身高算；`markCore` 用小的快打环圈住它），别处打中只冒火花（`glance`）；出招（`attack` 状态）时什么都打不进；蓄力时打核心能打断冲撞。AI 队友瞄核心（`aimAt`）。腐蜜夫人（madame）同一套。
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
