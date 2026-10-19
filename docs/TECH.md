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
  - 整关通关测试：`electron tools/node/playthrough.cjs <out.json> [大关] [第几步]`，用构建产物离屏自动打（1P 自动、无敌、`PT_SLOW` 倍速，默认 3），每秒记一次走到哪一步 / 哪个停留点 / 第几波 / Boss 血量，打到结算或超时（`PT_TIME` 秒）为止，写出时间线和报错；`PT_TEAM=cat,pink` 换队，`PT_SHOTS=1` 每到新停留点截一张图，`PT_EVERY=<毫秒>` 每隔这么久截一张（看演出），`PT_NOSKIP=1` 漫画和开门特写照常播，`PT_JS=<js>` 每次在页面里执行（自动打不碰机关：要测机关就用它打，例如每次打一个还能打的 `prop`），`PT_STATION=<停留点>` 从长小关的这个停留点开始（例如 `kn2` 只打第 2 话的决战；网页参数 `&station=`）。改了关卡数据或流程后跑一遍（序章约 2 分钟）。
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
  - sounds.json 每种声音可选 `len`（只放前几秒，结尾 150ms 内淡出）、`rate`（变调）；怪物叫声按种类有 `rate` / `vol`。便携版声音也从内嵌表取（window.__NOA_CONTENT）。
  - 解码时 `level()` 量一次：峰值拉到 0.7、从第一声前 50 ms 开始放（只裁比峰值低 50 dB 的真静音）；不同音效库的响度差别不用手调。
  - 挑素材的工具：`tools/node/sfx_scan.cjs`（ART「声音」）。
- **混音**（2026-10-19 用户：70% 应该是正常音量、往上要留够余量让玩家自己平衡；不能只是音效一条总线、音乐一条总线；靠混音此起彼伏，而不是把声音掐头去尾）。查过的做法：分组总线（音乐 / 语音 / 玩家 / 命中 / 怪 / 场景 / 环境 / 界面各一个推子）；语音像侧链一样压低音乐和环境几 dB（快压慢回，不抽动）；每组同时发声数有上限、按优先级让；HDR 音频（DICE、Wwise）：正在响的最大声的东西定一个窗口，比它小的组往后退；推子按 dB 走，静音单独处理。
  - 总线：`master`（总音量）→ 限幅器（-6 dB 起压，只抓峰值）→ 输出；`music`（BGM 推子）← `musDuck`；`sfx`（音效推子）← `ui` / `player`（她的枪、武器音节）/ `hit`（命中）/ `enemy`（怪叫）/ `world`（场景：门、机关、她的脚步；合成音效默认在这）/ `amb`（环境循环：钟、雨、火）；`voice`（语音推子）：两人的台词；混响按场景（set 的 `reverb`，`setRoom`），各组送进去的量不同，送的量跟着推子走。
  - 推子（`sliderGain`）：0.7 = 设计好的混音（0 dB），1 = +6 dB，往下每 0.1 小 4 dB，0 = 关；默认全是 70%。各总线在 70% 时的量 `NOM`：离屏实测（第 1 话的一场战斗）没有音乐的战斗约 -23.5 dB RMS、只有音乐约 -22 dB，一起约 -20.4 dB，全部推到 100% 还能大约 4 dB（限幅器只压峰值）。以前音乐比战斗小 9～10 dB，听着像没有。
  - 每 50 ms 动态平衡（`mixTick`）：有人说话时音乐 -5 dB、环境 -8、场景和怪 -4、命中和她的枪 -3（界面不动）；打得越热闹（刚响过的命中、怪叫、大的碰撞撞高一个窗口，约一秒落下）环境最多 -9 dB、音乐最多 -2.5 dB，安静下来再回来；压得快、回得慢。
  - 从哪来的声音就从哪听（`setListener`，Game 每帧把相机给它）：给了位置（`pos`）的声音用 HRTF 定位——左右、前后、远近（怪叫、机关、她的剪刀声：倒跑时她在背后就听着在背后）；没给位置的照旧左右声像。
  - 不再靠剪短来防止糊成一片：音效挑选时首尾都留得宽（`sfx_pick.py`：-50 dB 前 30 ms 到 -60 dB 后 120 / 250 ms），插话的台词 120 ms 淡出，怪叫最多 4 个同时、被顶掉的 250 ms 淡出，武器音节停时 30 ms 淡出。
- **打上去的声音、所有战斗音效**（2026-10-19 用户：普通击打基本全灭，不要写实，全部换卡通——老虎机、抓娃娃机那种；连射是玩具枪的短音一下一下地放，不是故意编一段来回的旋律；非台词的音效就是清楚、短、和 BGM 台词分得开）：`tools/toy_sfx.py` 从零合成整套（方波 / 正弦的快速滑音、弹簧、软木塞、金币、蜂鸣器、棘轮、滑笛、木鱼……每种几个版本，环境声做成无缝循环），登记成 sounds.json 的 `src: "toy"`；`hitNote(who, crit, kill)`（Game.onHit / onKill）放 `hitPink` / `hitCat` / `crit` / `kill`；每一发都放玩具枪（`gun` 地雷妹的光线枪「啾」、`cannon` 猫娘的软木塞枪「嘭」，`gap` 防止糊在一起）。
- 台词和战斗声音的混编（`src/core/audio.js`，2026-10-18 查过别人的做法：DICE 的 HDR 音频把响度当优先级、只放最重要的几个声音（"播对的声音，不是所有声音"）；CRI ADX 的发声数上限组 + 优先级；常见的台词系统是优先级 + 冷却 + 说话时压低别的声音（ducking））：
  - **说话通道** `talk()`：两人共用一个。有人在说时，新的一句只有优先级高出 2 级才插进来（旧的 50 ms 淡出），否则不播；优先级 4 以下的闲聊离上一句开始至少 `TALK_GAP` 秒，`setIntensity` 超过 0.85（打得最凶）时不说；`voice()` 返回 true / false（没说）/ null（没有语音文件）。优先级在 `src/ui/stickers.js` PRIO（倒地 9、必杀 8……命中 1），没说出口的闲聊气泡也不出；标题页戳她们 3、离开 7。
  - **让开**：见上面「混音」（`mixTick`）；语音走自己的 `voice` 总线（不被压）。
  - **怪叫**最多同时 `CRY_MAX`（4）个，满了只有更重要的（死 > 蓄力 > 攻击 > 挨打）顶掉最不重要的那个（淡出），否则跳过；从怪所在的位置发声；sounds.json 音效写 `gap` 的，两次之间至少隔这么久（命中声）。
  - 离屏测试听不到：`tools/node/playthrough.cjs` 开局就打开声音，结果里 `audio` 是计数（说了 / 没说 / 插嘴的台词、武器音节、她说话时停掉的音节、怪叫播了 / 跳过）。
- 关卡外的音效：`tools/ui_sfx.py` 从零合成（纸片的拍、滑、翻页、盖章 + 玻璃小铃，48 kHz，一点房间混响，Ogg Opus），写到 `public/content/base/sfx/ui/` 并登记进 sounds.json；每种声音一个函数，改了重跑；`--wav <目录>` 另存 wav 试听。代码里每个界面动作用自己的键（`uiMove` 光标移到、`ui` 确定、`uiBack`、`uiDeny`、`uiPage`、`uiTab`、`uiToggle`、`uiSwap`、`uiStart`、`stamp`、`count`、`item`、`levelUp`、`comicPage`、`panel`、`victory`、`defeat`），合成的替身在 audio.js `sfx`。
- 声音什么时候能响（2026-10-18 用户：刚进去点了常常没声音）：浏览器内核规定第一次点击前不能出声，以前第一次点击后才一口气解码 170 多个文件、界面音效排在后面。现在：桌面版 `electron/main.cjs` 开了 `autoplay-policy=no-user-gesture-required`，开机（读条时）就 `initAudio()`；网页版第一次点击 / 按键时 resume。`preloadSounds()` 先解码界面音效和菜单里说的台词（开机读条等它们，进度条占 15%），其余每次 4 个在后台慢慢解。实测（离屏）：音频一开机就是 running，41 个菜单声音约 0.95 秒解码完，早于片头结束；`playthrough.cjs` 的 `audio.menuReadyMs` 记着。
- 读条片头 `src/ui/intro.js`（`startIntro(box)` 开机整段、`{ loop: true }` 关卡之间只放字形里切漫画）：漫画页从 comics.json 来，每张对准一个格子的中心放大；字形用 `background-clip: text`；时间点 `T`（全屏切到 1.3 秒、字落地 2.1、变红 2.45、logo 停到 2.9）；读完才结束，点击 / 按键跳到 logo。
- 语音生成：`tools/voice_aivis.py`，用 AivisSpeech（免费、在本机跑的日语语音合成，Style-Bert-VITS2）。
  - 引擎和 ffmpeg 不进 git，手动解压：官方 Windows zip 解到 `tools/aivis/app/`（GitHub Aivis-Project/AivisSpeech，官网下载按钮给的那个版本），BtbN 的 ffmpeg Windows 构建解到 `tools/ffmpeg/`。
  - `start`：引擎没开就在后台开（`run.exe --port 10101`，日志 `tools/aivis/engine.log`），并从 AivisHub 装上 sounds.json 写的模型（引擎第一次启动还会自己装官方默认模型 コハク、まお；模型在 `%APPDATA%\AivisSpeech-Engine\Models`）。
  - `read <角色>`：不出声音，列出每句用的风格和引擎实际的读法（假名）。汉字读错就在 `say` 里写假名。
  - `lines <角色> [场合 | 场合_第几句 …]`：读 text/stickers.json 的日语台词（Boss 读 `bosses.<id>`，`voices.<id>.fx` 再加处理），♡ ♪ 不念、空格当停顿、~ 当长音，按 `read` 设好风格、语速、语气浓淡；生成后裁掉首尾静音、峰值拉到 -1 dB，用 ffmpeg 转 Ogg Opus 48k，写到 `public/content/base/voice/<角色>/<场合>_<第几句>.ogg` 并登记进 `lines`。不写场合就整个重做。
  - `say <角色> <风格> <输出> <文本>`：试一句。
  - 解码时 `level()` 裁开头静音只裁到第一个大于 0.003 的采样再往前留 20 ms（以前 0.01 / 4 ms，轻的辅音 ふ し ひ 被裁掉）。
  - 音高（pitchScale）不调：AivisSpeech 一动音高音质就变差。
- 主题曲 `tools/bgm_theme.py <名字> [--only <段>]` → `art/raw/bgm/<名字>.ogg`（游戏用）、`.mp3`（给人听）、`.wav`；语音引擎要开着（`voice_aivis.py start`）；整首渲染要十几分钟，`--only` 只出一段试听。
  - 结构：每段一个 `Sec`（自己的速度、小节数、伴奏 / 人声 / 混响送出三条轨），段落函数往里排东西，`mix()` 各自混（混响、人声频段给伴奏挖 5 dB、人声在时伴奏往下压、`glitches` 切片重复、`stop` 卡带减速），最后按顺序首尾接起来，超出结尾的混响尾巴绕回开头 = 文件本身无缝循环。
  - **人声不能被掐断**（2026-10-18 用户：每句都戛然而止，好难受）：合成出来的片段只剪掉开头的空白，结尾留到真的没声音（包络低于峰值 -58 dB 再多 80 ms），再用 100 ms 的圆滑淡出（`soft`）；唱的音节拉到比音符长一点，压进下一个音，一句的最后一个音节留完整的尾音；`~` 交给引擎读成长音（にゃ / にゃ~ / にゃ~~ 长短不一样），该拖的台词写上 `~`。只有鬼畜段的口吃切片是故意切短的（也有 35 ms 的圆淡出）。
  - 人声的三种用法：`say` 照她自己的语调说一句（放进几拍，长了就压缩）；`speak(..., tune=67)` 平调念、移到某个音上（念经）；`line` 唱：歌词按假名拆成音节（小写假名、ー、っ并进前一个），每个音节单独合成（音符长就带长音），量出音高，重采样移到旋律音上，再用 ffmpeg atempo 拉成音符的长度（「人力ボカロ」的做法）；`fit_notes` 让旋律模板对上音节数（多了拆最长的音、少了并最短的两个）。`crowd` 叠几份 = 一群人，`deep` 叠低八度（不像人），`hop` 每个音节左右跳。
  - 两人平调念出来都在 G4 附近，所以进行曲段落定 G 小调；移调靠重采样（共振峰跟着移），旋律尽量在 G4 上下五个半音内，ffmpeg 没有 rubberband。
  - 伴奏全部 numpy / scipy 合成：太鼓、军鼓、木鱼、锣、铃、钟（下课铃是威斯敏斯特钟声，公有领域）、八音盒、低音、「哦」合唱（锯齿波过 o 的共振峰）、铜管、弦乐、电钢琴（FM）、芯片方波、摇摆低音、低鸣、风、黑胶底噪，以及勺子碰玻璃 / 铅笔 / 纸 / 快门拼的鼓。
- **AI 音效**（2026-10-18）：`tools/sfx_sa3.py`（在 `C:\AI\sa3\venv` 里跑：Stable Audio 3 Small-SFX，CPU 上 4.5 秒一条；模型是 cocktailpeanut 在 Hugging Face 上不设门槛的同一份文件，Stability 社区许可 + Gemma 条款）照 `tools/rounds/sfx_specs62.py` 每种出很多版。**它只会出整秒的长度**：0.4～0.9、1.1、1.2、1.6、1.8、2.2 秒不管什么提示词、什么种子都是满幅白噪声，1.4、1.5、2.4、2.6 秒是没有起音也不衰减的一片噪声（2026-10-18/19 拿同一个提示词试各种长度、再量每种的包络查出来的；反向提示词 `NEG` 没用），能用的长度列在 `SAFE`（1、2、3、4、6、8、10 秒），生成时取不短于要求的最近一个，`sfx_pick` 再修剪；`tools/sfx_look.py` 把每版画成波形 + 频谱（听不到，靠看）；`tools/sfx_pick.py` 按种类打分（hit 起音快、单次、衰减干净；loop 平稳无洞……；一直不衰减的 hit——包络中位数离峰值不到 12 dB——是生成器出的噪声，不挑）挑出最好的几版、修剪 / 做成无缝循环、转 Ogg Opus 进 `sfx/ai/`，登记进 sounds.json。代码里新的声音用 `sound(key)` 播（没有合成替身的），环境声 `bed(key, on)` 开关循环。
- **BGM（2026-10-18 用户装好 ACE-Step 1.5）**：两步。`tools/bgm_guide.py` 把 Claude 写的曲谱（`tools/rounds/bgm_specs.py`：每段的和弦、旋律、鼓型、乐器）用 `bgm_theme.py` 的合成乐器加三味线 / 筝（Karplus-Strong）、尺八、梵钟、钟表滴答合成导引音轨；`tools/bgm_ace.py`（在 `C:\AI\ACE-Step-1.5\venv_cpu` 里跑，CPU + bf16）用 ACE-Step 的 cover 按导引的旋律、和声、结构重新演奏成真乐器（`audio_cover_strength` 越高越贴导引），说明文字只写乐器和情绪，不提别的作品。ACE-Step 会在给它的长度结束前 4～8 小节自己收尾（淡出 / 停），所以导引最后多接一段「尾巴」（循环回去的那一段的前 8 小节），收尾落在尾巴里。第三步 `tools/bgm_pick.py`（游戏的 Python）：听不到，靠量：每版和导引比节拍（起音相关）、每小节的和声（色度相关）、落后多少、哪里断了 / 忽大忽小，挑分最高的（用户听过后可以在 `PICK` 指定），循环从 `loopFrom` 段（默认第二段，第一段是只放一次的前奏）开始到最后一段结束（按这一版自己的落后量对齐），循环末尾 80 毫秒和循环起点之前的 80 毫秒交叉淡化（跳回去听不出接缝），统一响度，转 Ogg Opus 进内容包 `bgm/<曲名>.ogg`，sounds.json `music.<曲名>` 写 `loopStart` / `loopEnd`；`art/raw/bgm_ai/_look/` 有每首的图和分数。
- **声音试听页**（`sound.html`，`开始游戏.bat` [6]，代码 `src/audition.js`）：BGM 每首有「游戏里的循环」「听接缝」（从循环结尾前 6 秒放）和 ACE-Step 出的每一版（整首）、「用这版」；音效每种的每个文件、划掉（✕）、整种重做；两人的台词、标「不好」；每处都能写一句。挑的东西存在 `saves/audition.json`（桌面版的存档文件），`python -I tools/audition_apply.py` 照着改：BGM 写进 `art/raw/bgm_ai/picks.json` 再跑 `bgm_pick.py`，划掉的音效写进 `art/raw/sfx_ai/<种>/rejected.json` 再跑 `sfx_pick.py`（从别的版本补上），要重做的和留言打印出来给 Claude。各版本原文件在 `art/raw`（不进游戏），只有从项目里跑（`electron .` / 开发服务器）时以 `/raw/` 提供。sounds.json 的音效登记了每个文件来自哪一版（`from`）。
- **声音沙盒**（2026-10-19 用户：测试 BGM 和音效要能自定义场景、怪，更形象）：试听页的「沙盒」栏选地方（任何 set）、BGM、上哪些怪各几只、她（剪刀人偶 / 千刃蜘蛛 / 空振袖 / お蚕様）、环境声、AI 替打还是自己打、不会死，存成 `sandbox`，「开始」打开 `index.html?sandbox`（`src/ui/sandbox.js`）：在那个地方第一个有战斗的停留点（它的镜头、视线、掩体）搭一个站点 `__sandbox`，选的怪排在镜头前当一波，大关 `__sandbox`（`debug`：不存档不给钱）；`Game.checkWave` 对 `ep.sandbox` 打完一波就重来，一直刷。右上角调音台：四个玩家推子、各组（音乐、语音、她们的枪、命中、怪叫、场景、环境、界面）在设计量上 ±12 dB（`setGroupGain`）、每种怪的四种叫声、她的声音、打击音、环境声开关、换 BGM、写意见（存进 `audition` 的 `sandboxNotes`，`audition_apply.py` 打出来）、回试听页。
- 曲名：`<大关>_stage` / `<大关>_boss`（`Game.music`，set 的 `music` / `bossMusic` 可以指定别的，`music: null` = 只有钟声），第 2 话她的主题 `ep2_she`、决战 `ep2_final`、民宿 `ep2_inn`；没有录好的就退回合成的 stage / boss。响度：循环部分统一到 -14 dB RMS、`vol` 1.4（2026-10-19 用户说游戏里听不到 BGM：原来 -17 dB、0.9，比合成的旧循环小 3～8 dB，被枪声和台词盖住了；现在比旧循环大 3～5 dB，离屏量过）。录好的曲子解码后每首约 30 MB，不跟着开机预载：开一局时只解这一大关的（`warmMusic`），别的大关的放掉。
- BGM 仿写的做法（旧方案：参考曲转 MIDI + Suno）：用 basic-pitch 把参考曲转成 MIDI、librosa 测速度 / 调 / 段落，Claude 保留风格（配器、速度、和声走向、段落结构）重写旋律，渲染成导引音轨，再交给 Suno 的「用上传的音频改编」出成品；不照抄旋律（旋律有版权，和声走向和风格没有）。

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
- 用户在 `开始游戏.bat` 菜单里：4 存一次并同步，列出最近的存档编号；5 把全部历史打包到 `D:\trigger-poem-backup\`，再把 `art/raw/` 拷一份到 `D:\trigger-poem-backup\raw\`（robocopy，只拷新的和改过的，不删）。
- **原图只在本机**（2026-10-20 用户：raw art 不上传 GitHub，留本地）：`art/raw/`（Codex 出的原图、ACE-Step / Stable Audio / 语音合成出的各版声音、下载的素材包）整个不进 git；游戏只读内容包、不读它（只有开发版的试听页读）。备份靠上面的 5。之前的提交里还留着旧的原图。
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
    - 奖励 `applyRewards`：不评级；通关固定 + 击杀、首通、满级换伍德刀盾、书包倍率（道具等级 `SAVE.itemLv`），记录最短全通关时间，首通给 `reward` 道具（读档时 `initSave` 也会补发已通关大关的 `reward`：奖励道具是后加的，之前通关的存档拿不到）；
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
  - `game.cine(o, then)`（特写，DESIGN「要给玩家看的东西放慢、特写」）：镜头去 `o.cam` 看 `o.at`，或者对着 `o.on`（一个 actor / 一个点；`o.face` 从它朝向的正前方）`o.dist` 米、`o.up`、`o.side`，移动的跟着拍；`o.during()` 到位时调用，`o.hold` 秒数（可以是函数：说完台词才知道多长），`o.lull` 期间谁也不开枪、不受伤；`game.cineOn` 时两人的立绘滑出画面（player.js `cineK`）、HUD 除了台词和警示都藏起来、上下黑边（glhud.js `cineUpdate`）、准星环淡出（fx.js）、镜头不随准星晃、提示和下一波怪等它拍完。站点 `focus: { gimmick, dist, up, v, hold }` 先特写那个机关、让它演完（Gimmick 的 `twitch` / `flicker` / `swap`）。Boss 用 `closeUp(kind, o)`：特写 + 说那一句、按台词长度停。
  - 怪的入场（enemies.json 波次的 `from`，DESIGN「怪要有合理的入场」）：`door`（`way: end | back`，从那个门洞后面的过道走 / 飞出来）、`stairs`（门洞在楼梯顶：先走下楼梯）、`outside`（飞的从栏杆外进来）、`wall` / `ceiling`（破洞，成群的只破第一个）、`drop`、`statue`；`pop`（地上翻起来）不再用在第 2 话。比 `layout.json monster.smallH` 矮的地上怪，终点往后挪到头顶在屏幕 `smallTop` 以上（`PanelWorld.minDepth`）。
  - 场景之间怎么走（第 2 话，`Game.passThrough`，DESIGN 第 2 话「场景之间怎么走」）：`walkOn` 时两人立绘退出、HUD 收起（没有黑边）；`turnTo` 先原地转向出口；站点 `leave: { way, via, steps, exit, hole }`、`arrive: { way, from, hole, at, look, steps }`。PanelWorld：`hall.ways`（门洞后面的过道，`buildWay`；`door: { kind: slide | swing, k }` 门板，`door(id, open)` 开关）、`hall.stairs`（真的台阶 + 扶手，`buildStairs`）、`hall.shafts`（天花板 / 地板上的竖井 + 梯子，`buildShaft`，那一格天花板拆成围着洞的四块 `holeRects`）、`cutWall`（侧墙真的挖穿，`addHole(..., through)`）；`travel(..., { steps })` 上楼梯、爬梯子一步一顿。下一个小关在别的地方时，`nextStep` 不先换场景，让 `passThrough` 走过去换；新小关开始时她先退场（`chase.gone`）。站点 `slam: 'back'` 镜头转过去看那扇门关上；`appear` 的机关到它那一站才倒下来。数据由 `tools/rounds/ep2_level.py` 生成，门洞图片的修整在 `tools/rounds/ep2_ways.py`。
  - `game.lull`：战斗暂停一下（Boss 变身）：玩家不能开火、不受伤，必杀计时停住（player.js），Boss 不吃伤害（thing.js）。
  - 必杀好了：`Heroine.setReady`，立绘网格再画三份剪影（rig 着色器 auraOnly=2），从身体中部放大变淡循环（`tuning/soft.json` jiggle.echo：beat 周期、grow 放大、a 不透明度）；HUD 头像环上方「必杀 OK!」在 `glhud` Panel。
  - 攻击提示在 `fx.lock` → `fx.orbit`（DESIGN「攻击分三种」）：环是 `ORBIT_FRAG` 着色器画在一块方片上（快打红粉圆环一缩一放；快躲紫色斜环带，`side` 只画前半圈 / 后半圈，后半圈的方片和走到后面的卫星放在世界场景里一个面朝镜头、按那里一像素多大缩放的 group，摆在怪中心沿视线往后 0.6，靠透明物体由远到近排序被怪挡住；`flare` 耀斑）；知道世界位置（`wc`）时换成真 3D 的环（`ring3d`，技术验证中，PLAN「提醒环做成真 3D」）：快躲的斜环带是世界里的圆环几何（芯线、颜色、墨边、加色光晕，里面一圈虚线环），绕着怪慢慢转，卫星沿它走、按真的深度决定在怪前还是怪后；快打的红环里多一个陀螺仪式翻转的虚线环；每个环画两遍，近半圈最后画、不被挡，远半圈的网格原点挪到怪身后 0.6（顶点着色器 `shift` 再挪回来），跟纸片一起按远近排序被怪和它前面的东西挡住；爱心和翅膀是 `src/ui/marks.js` 画的画布贴图；`lock.set(x, y, size, p, t, left, box, wc)`，wc 是怪的世界中心；Fever 槽在 `src/ui/feverfx.js`（`FeverGauge`：每格一个按种类的着色器 `SEG_FRAG`、整条槽上一块叠加混合的光晕和火 `AURA_FRAG`（按效果图像素算火高，`FLAME` 平时 / 涨一格 / 升级）、一池 28 个粒子 `PART_FRAG`（火星 / 星光 / 气泡），`EMIT` 管粒子数；glhud Panel 每帧把等级、数值、升级闪光传给它）；闪避 LED 小条在 `glhud` 的 `Dodge`（`src/ui/ledsign.js` 先在一格一像素的小画布上画字和花边、再按格画成发光圆点，位置 `ui/battle.json` center.dodge）；
  - `alerts`（街机式醒目提示：屏幕边缘只剩低血量；RELOAD! / NO AMMO! 半屏闪、被打裂屏 + OUCH!、倒地半屏 CONTINUE? + 倒计时、必须躲时全屏 DANGER!!；装填的 Q 版大头贴纸在她角落不规律叠）；
  - `space`（弹出物找空地：避开 HUD、Boss 条、教程提示、两人当前身形）、`hold`（不能射击时的警示覆盖，文字在 `text/holds.json`）、`stickers`（气泡贴纸，台词在 `text/stickers.json`）；
  - `hud.showBanner` 旧接口：战斗中变成气泡（`stickers.callout`），战斗外变成警示覆盖；
  - 选关的对比色层（`select.js shade`）：用按钮自己的图当遮罩（mask-image），叠一层纯色，悬停 / 按下（`s-press`）/ 选中时显示，字变白；页签和左右箭头的 z-index 在两张立绘之上（立绘透明的边会挡住点击：点不开书包、猫娘当 1P 时右箭头点不动都是这个）。测点击用 `elementFromPoint` 在按钮上撒点看是谁接住，两种队伍顺序都测；Claude 的浏览器面板在后台时不刷新画面、过渡动画不走，量位置用 `shot.cjs`（`SHOT_SEQ` + `SHOT_EVAL`）。中间的大关小卡不是按钮：`peek` = 悬停的箭头方向，`renderCard` 换成那一章的 `cover`（没有就占位 `next.placeholder`）。
  - 书包页 `src/ui/bag.js`（选关的「书包」页签，盖在队伍卡片上；位置 `ui/select.json` bag，照效果图 art/raw/r52/bag_a.png 量的；样式 `select.css` .s-bag，--u = 参考图 1 像素）。右栏在 detail 框里按 --u 绝对定位；`fit()` 把放不下的字（英文长名字、长段落）一点点缩小到放得下；三段说明的小标签是 text/ui.json loreTabs（用 | 分开）。
  - 道具和书包都在 `src/battle/items.js`：`itemFxAt(id, lv)` 按 items.json "grow" 算某级效果（线性、exp 每级同倍数、pow 先慢后快），`itemPrice` / `capPrice` 升级 / 扩容价格（取整到 5 / 50 / 500），`buyItem` / `upgradeItem` / `upgradeCap` / `toggleEquip`（装备超过 cost 上限返回 'full'），`itemDesc` 把描述里的 {键} / {键%} 换成当前等级的数字；`bagFx(bag)` 合计效果给战斗用。
  - `screens`（结算 `showResults`：漫画杂志目录页，版式在 `style.css .res8`，条目按数据重复；数据来自 `Game.applyRewards`：`st.newItems` 只有首通的新道具、`st.unlocked` 只有新开的章节、`st.mulBy` 每个倍率道具一条；插画 `res/cover_<大关>`（没有就 `res/cover`）、`res/face_<角色>`、`res/item_<道具>`，没有就退回 Q 版脸 / 道具图标；全灭时同一个页面（`st.win` false：刊头 DOWN、残局报酬、`onRetry` 从检查点重来），插画在 `res/lose_<n>` 里随机挑一张）、`uifx`（菜单粒子）、`cursor`。
- `src/jiggle/`：晃动技术（见下），`jiggle.html` 验证页和战斗主角（`heroine.js`）共用。
- 服装（DESIGN「服装」）：`characters/<id>.json` 的 `rig` 是制服，`rigs.<服装>` 是同一套姿势换了衣服（同样的 cover / fire、骨架、软肉，只有图和部件权重图是新的）；`SAVE.chars[id].outfit` 是她穿的，`SAVE.outfits` 是已经有的（大关 `reward.outfits`，首通给，读档时补发已通关的）；`heroine.js` 按它挑 rig（图没读到就退回制服）。服装的图叫 `outfit/…`，不算核心，只在穿的时候读（`groups.js outfitKeys`，`main.js picsFor` 和 `Game.nextStep` 把它加进要读的图）。选关的服装牌（`select.js` chip base）：显示她穿的，点一下换下一套，没有别的服装时抖一下、提示怎么拿；结算的特集里新服装和新道具排在一起（`res/outfit_<id>` 图，没有就用衬衫图标）。测试：网址 `?outfit=yk` 两人都穿上。

## 怪怎么逼近、场景破坏（`src/battle/enemies.js`、`src/battle/panels.js`）
- 出场：地上的怪和飞的怪至少站在 `tuning/layout.json monster.spawnMin` 米外（最多 `spawnFar`，波次写 `far` 能更远；2026-10-18 拉近到 5.5～8.5 米），再逼过来；波次写 `near: true` 就按原来的规矩（站在看得清的近处）。
- 波次里单只怪还能写 `hp`（这一只的血量）、`tough: true`（不吃硬直、挨打不后退；怪的定义里也能写）。
- `move`（波次单独写 > 这种怪的 `moves`[第几个造型] > `move` > 按行为模板默认）：
  - 走路怪：`walk` 直走、`hop` 一跳一停、`zigzag` 左右翻滚走 Z 字（图转一整圈）、`charge` 慢慢挪，到 `chargeDist` 米内远远蓄力（红环）再整段扑过来（冲撞，穿过掩体）、`burrow` 钻进地里在几米外钻出来（`from: 'burrow'` 也能从地下出场）；参数 `tuning/behaviors.json walker`；
  - 飞的：`float` 每一秒左右换个点飘，每俯冲一次悬停点往前靠 `homeStep` 米；
  - 扔东西的：`step` 扔完还远（深于 `stopDist`）就往前走几步（会躲的那种缩下去挪过去再冒出来）；蓄力和出手时只吃 `throwArmor` 倍伤害（霸体）；一次扔的个数 `burst`；写了 `summon`（刷怪列表，x / z 相对自己）的改成在身边叫出怪来，场上这些怪已有 `summonMax` 只时照常扔东西；
  - `recharge: true` 的冲撞怪（新娘之影）扑完退开后再蓄力冲一次。
- 怪的花样（DESIGN「怪的行为要多样」，`enemies.json` 每种怪的字段，代码在 `Enemy` 里）：
  - `dashAt: 0.5`：血掉到一半时（下一个能动的时机）`zip` 一下闪到旁边、往前冲一段，带残影（`trail`：当时那一帧的复制品变淡），期间 `invul`（打中只冒白星、不掉血）；
  - `enrage: k`：越掉血越快（速度、跳的间隔 × `rage()`，最多 1 + k），越来越红、冒热气；
  - `evade: { n, rest, react, dist }`：玩家的准星停在它身上 react 秒就横闪 dist 米（无敌），闪 n 次后喘 rest 秒（头上冒星），蓄力时不闪；
  - `phantoms: { n, shuffle, hits }`：出场后站在 n - 1 个幻影（`Phantom`：同一张图、同样的动作、偏一个位置）中间；幻影挨打只闪不掉血，挨 hits 下化掉；真身每掉 shuffle 的血，所有人淡出、重新排位置淡入；真身死了幻影一起化掉；幻影不算这一波的怪（`checkWave`）；
  - `dmg`：它咬 / 撞一下掉多少血（没写就是 combat.enemyHit；成群的蝙蝠只掉 8）。
- 波与波之间不留空：不是最后一波时，场上只剩 `combat.waveCarry`（1）只就开始下一波（这一波还有按击杀数触发的事件时等它们）；最后一波打完才算清场（`Game.checkWave`）。
- 波次条目：`count: n` 一次刷一群（`spread` 米宽里排开，`every` 秒一个，飞的高度略有起伏）；`from: 'statue'` 摆设（灰色、没描边、打不中，`hitMeshes` 为空），`wake` 秒后或波次事件 `{ kills / t, wake: true | 数量 }`（近的先）裂开活过来（`Enemy.wake`）。
- 打击感（2026-10-20，数值都在 `tuning/combat.json feel`）：
  - 怪自己（`Enemy.feel`，`baseUpdate` 里三根阻尼弹簧）：按这一下多重（`weight`：枪轻、加特林更轻、咒重、光束每跳很轻，暴击 ×`critMul`）压扁再弹回（`mesh.scale`）、往后仰（`mesh.rotation.x`，3D 里真的倒）、往打中的另一边歪（叠在 boil 的 `rotation.z` 上），被打的那只原地定住 `freeze` 秒（`Game.update` 只给它 6% 的时间、动画停、贴图抖）；连射时幅度有上限。
  - 整个画面：重的一下（weight ≥ 0.9）和打死时顿帧（`Game.feelStop` → `G.stop`，两次至少隔 `stop.gap`，必杀中不顿），震屏分档；`post.js` 的震屏改成按 trauma² 采几条正弦（平滑，不是每帧随机）并带一点镜头翻滚 `shakeR`（三种镜头都 `rotateZ`）；打死耐打的怪（最大血量 ≥ `impact.hp`，暴击打死门槛减半）插冲击帧 `post.impact()`（前半黑白高反差、后半反相，HUD 不受影响，至少隔 `impact.gap`）。
  - 命中音随连击升调（`Game.comboRate`：每 `comboPitch.per` 下高一个半音，最多 `max` 个；`hitNote` 的 rate）。
- 受伤的样子（`src/core/paper.js` 的 solid 分支，怪和 Boss）：伤害图 R 通道越重的地方越偏淡紫粉、越透明（最多剩 40%，`am`）、透明的边缘发粉光；G 通道（真言 / 镭射的灼烧）偏琥珀色、略透明，不再变黑。
- 伤害：`characters.js buildStats` = 角色的枪 + 熟练度（每级 `economy.json mastery` dmgPerLv / critPerLv / critMulPerLv / reloadPerLv，现在 2% / 0.5% / 0.02 / 1%，满级 +18% 伤害）+ 书包；暴击率 = Fever 准头 + `w.critAdd`，暴击倍率 = Fever + `w.critMulAdd`（`Game.critRate / critMul`）。
- 场景道具能打坏（set 的 `props`，写 `solid: true` 的不坏）：挡子弹（`Game.hitMeshes` 带上 `world.breakableMeshes()`，透明处不挡：道具图在 manifest 标了 `hit` 建了 alpha 遮罩），打了留洞，血量 `tuning/combat.json prop.hp`，没血了往后倒、淡出；怪走路 / 跳 / 冲过去会撞碎（`smashPropsNear`）。

## 第 2 话：她和追逐（`src/battle/chase.js`，数值 `tuning/chase.json`，关卡 `sets/ep2.json` 由 `tools/rounds/ep2_level.py` 生成）
- **她**（`Stalker`，三个形态 a / c / e 的图 `enemy/she_<形态>_<姿势>`，お蚕様 `enemy/kaiko_<姿势>`）：没有血，打她只攒硬直槽（`she.stagger`；张开剪刀蓄力时挨打 ×`windupStagger`；不挨打时慢慢掉），攒满倒地 `down` 秒，每倒一次乘 `downDecay`（最少 `downMin`），爬起来；够到人（`reach`）就蓄力（红色快打环）再扑（穿过掩体），扑中有 `grabChance` 抓住一个人：屏幕中间「狂点射击挣脱」，`mashTime` 秒内打 `mash` 下挣脱（她被推倒），否则一直掉血；身上的伤痕慢慢褪、倒地时清空（她打不死）。お蚕様打满只会退一下，只有灯油 / 蜡烛的机关（`trap.kill`）烧得死。她不算波次里的怪（`a.stalker`，`checkWave` 不等她）。
- **Game 交给 Chase 的站点**：`chase`（镜头沿 `path` 跑到站点，`face` back 朝后看她 / fwd / left / right / down 竖井朝下，`speed` 镜头、`herSpeed` 她每秒几米，`dist` 她开始离多远）；`block`（镜头朝前对着挡路的东西，她从背后 `herSpeed` 走近，近到 `turnAt` 镜头甩过去打倒她再甩回来；`gimmicks` 里 `block: true` 的东西和这一站的怪都清掉才算完；挡路的是お蚕様时它打不倒，打满硬直只会退一下：退到 `turnAt` + 4 米外、镜头甩回前面，`Chase.onFlinch`）；`hide`（躲藏点：镜头在柜子 / 石灯笼后面，两边黑门只留一条缝，她走过来，一波 `stabs` 下捅刺，「争取到的时间」够多的挡掉多少下，结局三档 high / mid / low 决定她怎么走、下一段追逐她离多远）；`she`（她在这一站巡游，`wake` 秒后动，`burst` 从浴桶里扑出来）；`dial`（钟楼表盘决战，见下）。
- **争取到的时间**（`chase.meter`，左上角一只小和時計，十二格）：机关砸中她、关门、引开、清掉路障、打倒她都加（`tuning/chase.json meter`），躲藏点结算后清零。
- **机关**（`gimmick.js` 的 do）：`drop` 吊着的东西掉下来、`trap` 砸她（`r` 米内倒 `down` 秒，否则挡她一下）、`door` 关门拖住她、`lure` 敲响别处引开她、`read` 弹出文字卡（`text/ui.json`）、`node` / `toll` 表盘决战、`free` 放走乌鸦、`collapse` 塌方（仓库的地板暗门同时是 `block: true`：她破门进来时要抢在她前面打穿）；不能打的摆设 `shoot: false` 里，`hand: true` 是表盘中间的铜时针（`Chase.pointHand`：只顺时针转、指着下一块要打亮的刻度），`striker: true` 是钟旁边的钟杵（每敲一声荡过去撞钟）；`on: floor` 平放在地上，`armed: false` 等战斗让它能打。
- **头像的恐慌色**（原作詹妮弗头像的颜色）：她在附近时两人 Q 版头像外圈一圈光环，蓝 → 黄 → 橙 → 红（`tuning/chase.json panic` 的远近），最近时闪；她出现时音乐立刻切到她的主题（`playMusic('she')`），她走了只剩钟声（`bed('clockTick')`），很近时有心跳（`bed('heartbeat')`）。
- **表盘决战**（站点 `dial`，`Chase.dial`）：钟楼顶的地板是一面十二支和時計（`ep2/kane_diala`），十二块刻度（`ep2/zodiac_<名>`，`node` 序号）平放在圆周上；她每倒下一次，下一刻的刻度套红环、能打，打亮了时针走一格、镜头绕圆周走一格；每 `perForm` 刻换下一个形态（a 剪刀人偶 → c 千刃蜘蛛 → e 空振袖：放纸人、蓄力尖叫要躲）；她离得远时每个形态有自己的远程（`Chase.volley`，状态 `cast`，这时打她照样攒硬直）：a 踢木屐（`geta`）、c 扬起身扔一扇剪刀和针（`scissors` / `pins`，五发散开）、e 袖子里放纸鹤（`crane`，弧线飘过来），都是能打掉的飞行物；她总在镜头和表盘中心之间（贴到镜头旁边看不见的地方会被慢慢推回视野里），换形态时从表盘中心冒出来；十二刻全亮，两人必杀充满、钟（`bell: true`）能打，敲响三声把她震下钟楼，这一站结束。
- **一个小关十个地方，不切画面**（`Game.passThrough`）：大关的小关步骤写 `places`（场景按顺序）和 `stations`（所有站点，站点 id 在各场景里不重复）；下一个站点在别的场景时，两人走进这个场景的出口门洞（场景 `exit`，或站点的 `leave: { exit, via, hole }`；`hole` = 她剪开的墙洞先爆开），一眨眼黑（`#ui .blackout`），换场景，从下一个场景的入口（`entry` / 站点的 `arrive: { at, look }`）走出来；门洞是 R63 在尽头墙 / 来路墙上画成洋红、导入时抠空的，`ep2_level.py` 从图里量出位置。重新搭的场景直接显示站点 `state` 说的样子（0 平静 / 1 停电后，翻板一下子翻完）。塌方（`collapse`）在多场景的小关里不结束小关，掉进下一个场景（它的第一个站点写 `enter` 从上面落下来）。
- **关内检查点**：站点写 `cp: true` 就存进 `SAVE.eps[大关].cp = { step, station }`；全灭的「从检查点重来」从这个站点开始，下次从选关进这个小关也接着这里（`main.js startRun`），通关清掉。从中途开始的那个站点按 `state` 摆好场景（`Game.resumed`）。
- 两人这一话的台词（`Chase.say`）：她出现 `sheSeen`、倒跑开始 `runNow`、躲着屏住气 `hush`、机关砸倒她 `trapHit`（别的打倒还是 `stagger`）、被抓 `grabbed`、敲钟 `bell`；台词在 `text/stickers.json`，读法在 sounds.json `voices.<who>.read`，语音照常 `tools/voice_aivis.py lines <who> <种类…>`。
- 场景的音乐：set 写 `music`（null = 没有音乐，只有钟声）/ `bossMusic`；站点写 `music` 当场换；有录好的曲子（sounds.json `music`）放文件，没有就退回合成的 stage / boss。

## 图片按小关加载（`src/core/groups.js`、`src/core/assets.js`）
- 为什么：一张图不管文件多小，解码后都是 宽 × 高 × 4 字节（加 mipmap 再多 1/3），全部内容包解码约 6 GB；three.js 的贴图不会被垃圾回收，只有 `dispose()` 才从显卡上释放。所以不能一口气全读，也不能读了不放。
- 分组（运行时从内容算出来，模组的新大关也一样分）：
  - 一个小关的图 `stageKeys(ep, step)`：它的场景（板、掩体、道具、贴花、机关）、波次里的怪（每个造型的每一帧）、它们的飞行物、Boss 的全部图，连同浮雕图和 `_x` 腐化版；
  - 核心 `coreKeys()`：没有任何小关认领的（界面、HUD、特效、两位主角）；`ep1/…`、`cover/ep1_…` 这种带大关名的图即使还没被用到也不算核心；只被旧数据（没有大关用的场景、怪、Boss）用到的也不算核心；
  - 漫画页从来不做成贴图（只用 `<img>` 显示）。
- 时机：启动只读核心（`setManifest` + `loadKeys(coreKeys())`）；开局前读起始小关的（`main.js needPics`，没读完就显示读条）；每个漫画页 / 开门特写一开始，后台读下一个小关的；小关开始时等它的图（没读完显示读条），然后 `releaseExcept(核心 + 这个小关)` 把别的全部释放。任何时候只有核心 + 一到两个小关在内存里，显存不随大关数量增长。
- 一个小关跨好几个地方（第 2 话民宿的十个地方，全部进显卡约 1.9 GB）：只留所在的地方和下一个地方的板、掩体、道具（`stageKeysAt`），怪、飞行物、她的几个形态整关都留着；每进一个地方（`Game.useSet` → `streamPlaces`）放掉身后的、后台读下一个；走得比读得快就先等它读完再走进门洞（`goStation`）。从检查点接着打时从那个地方算起（`placeOf`）。
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
  - 波次里可以夹事件（没有 `type` 的条目不算怪）：`{ t, ... }` 到点发生，`{ kills: n, ... }` 这一波死了 n 只后发生（`Game.waveEvent`）；内容：`turn: {...}` 翻地方、`mutate: true` 场上（和这一波还没刷出来的）带 `mutatesTo` 的怪当场变成完全异化的那种（`Game.mutateAll`，第 1 话店里只翻一次）、`gimmick: id` 触发这个地方的机关；
  - `Game.turn(spec)` → `PanelWorld.turnFrom(from, dir)`：按新的起点重算每块板的远近，翻回现实时从起点往外一块块翻回去（`turnDir` -1）；`hit` 带闪光、震屏、重击声。
- 道具（`props`）站在某个停留点的掩体位置上时不画（`clearProps`，掩体按主角站位算，事先不知道在哪）。
- 和旧 World 接口相同（`place`、`travel`、`setCovers`、`covers`、`project`、`lightAt`……），Game 不用分支。多了：
  - `fold()`：走廊弯起、地板翘成棱；
  - `render()`：先渲到带深度的目标，再做描边和纸纹，然后 Game 画前景主角和 HUD；
  - `fit(p, h, w, fly)`：怪物看得清（DESIGN「战斗画面布局」）：出场时挪到离镜头不太远（至少占屏幕高 `minShare`）、不比掩体近、脚在 HUD 带之上、左右在画面中间、飞的在上半屏；跟着停留点的朝向算；停留点的 `monsterFar` 能再拉近（走廊折叠后地板翘起的棱在后面）；数值 `tuning/layout.json` monster；
  - `dispose()`：换场景时释放。
- 怪物位置：波次里写场景坐标 `x` / `z`（米），浮空的写 `y`；只是大概位置，出场时 `fit` 会挪。
- 序章三个场景在 `sets/ep0.json`：教室（平静 → 异变翻板；第二个停留点镜头转身看后墙）、走廊（沿用走廊验证，站点间转弯、折叠）、操场（Boss）。
- 第 1 话在 `sets/ep1.json`，一条路线：店内 → 画廊 → 玻璃温室 / 骑士厅 → 冷库 → 儿童房 → 烤炉厨房 → 坑道（`ep1_pit`，三个点）→ 画室（四个影子，然后 Boss 在同一个地方的 `boss` 点）。只有店写 `turns`；其余一直是腐化的（有 `_x` 的板显示 `_x`，儿童房、画室只画了腐化版）。冥界、大舞厅不用了（图还在内容包里）。
- 房间打完走到门前：小关最后一个站点写 `exit: { via, to, look }`，清场后两人收起掩体、走到 `to`，再进下一步（开门特写）。
- 房间里的门（DESIGN「门和小关的衔接」）：set `hall.door = { frame, leaf, w, x }` 在尽头墙上立着这一关结束时要开的那扇门（从一开始就看得见）：`frame` 是 `tools/rounds/door_room.py` 从开门特写的门框图裁出来的一块（门洞透明、左右上三边淡出、`soft` 混合），`leaf` 门扇立在门洞后面；开门特写用同一扇门的 frame / leaf，`exit.to` 对准它。尽头墙原来画着别的门的，`hall.end` 只留不和它打架的那张。
- 机关（DESIGN「地形和机关」）：
  - 黑屋子：set 写 `dark`（0..1）→ 描线后期（`INK_FRAG`）把整个场景压暗成夜蓝色，最多 4 盏灯（`inkU.lamps`：屏幕位置、半径、亮度）周围留出暖光；机关事件 `{ light: 步长 }` 把它换成 `kx`（`ep1/nb_candle_out` → `nb_candle`，`tools/rounds/candle_out.py` 去掉火苗做的灭蜡烛）、点亮这盏灯、整间亮一截（`PanelWorld.lamp / light`）；没点的蜡烛有个小光点，找得到；
  - 刷怪源：波次事件 `{ spawner: { id, type, from: 'wall' | 'burrow', side, z, spreadZ, every, faster, min, first, until: 'gate', sealAfter, hint, remind } }`（`Game.updateSpawners`）：从侧墙的洞（洞由 set `hall.holes: [{ on, z, y, size }]` 一开始就画好）或从地里（`burrow`，房间里随机）不停出怪，每 `every` 秒一只、每次乘 `faster` 越来越快（最快 `min`），开着时这一波不结束；`until: 'gate'` 吊桥放下就停；否则机关 `{ topple: 弧度, seal: id }`（立着的东西顺着墙倒下去盖住洞）关掉它，这种机关写 `needs: id`，要等刷怪源 `sealAfter` 只被杀后才能打（那时出提示 `hint`；之前没有描边，免得提前打倒卡关）；`remind` 秒重复一次提示；
  - 机关写 `mark: true`：能打的时候套着快打的红环（`fx.lock('kill')`），一眼看得到；
  - 吊桥：`hall.bridge = { z0, z1, seals }`：两者之间的地砖拿掉（露出底下的虚空），程序画的木板吊桥（`plankTex`）立在 z1，两根铁链拉到墙上；墙上的封印机关 `{ gate: true }` 全打掉后桥落下来（`PanelWorld.gateHit`）；桥没放下时最后一站打完也不结束（`checkWave`）；
  - 提示：站点 `hint` / 波次事件 `hint` / 吊桥没放下 → `Game.hint`：顶部正中半透明小标签（`holds.json hint`，`dur` 秒后自己消失），文字在 `text/ui.json`（`lampHint`、`sealHint`、`gateHint`）。
- 只走不打的一段：站点没有 `waves`（也不写掩体）就是赶路段：到了不蹲、不打，`say` 一句、`sfx` 一声，`pause` 秒后接着走（`walkSpeed` 米 / 秒，默认 2.6，比平时慢）；画廊开头从门口慢慢走进去（`ga0`）。
- 演出（DESIGN「演出」）：
  - 破洞 `PanelWorld.addHole(on, p, size)`：程序画的破洞（几种参差的黑洞 + 浅色碎边 + 裂纹，`holeTex`），贴在左 / 右墙、尽头墙、后墙、天花板或地板上，弹出来；
  - 怪破墙 / 破天花板闯进来：波次条目 `from: 'wall' | 'ceiling'`（`side` 可选，默认按它在镜头哪边），墙上 / 天花板上开洞、碎屑、震屏，它跳下来落到 `fit` 给的位置；
  - 背后出怪：站点写 `whip: true`（镜头位置不动，`look` 朝后），清完上一站不走路，低吼 + 震屏 + 一个人说「后面…?」+ 提示 `holds.json behind`，0.9 秒后镜头甩过去（`Game.whip`）；朝后的那面墙是 set `hall.back`（true = 尽头墙的另一个版本）；这个站点自己的掩体朝后摆；
  - 塌方：波次事件 `{ kills / t, collapse: true }` → `Game.collapse`：怪和两人一起掉下去（`PanelWorld.collapse`：她们周围的地砖从近到远掉落、镜头往下坠），这一小关到此结束，下一步如果是开门就跳过（`skipDoor`），下一小关的第一个站点用 `enter` 从上面掉进来；
  - 破墙逃走：波次条目写 `breakout: 0.45`，血掉到这个比例就无敌、冲向尽头墙撞出大洞、消失（不算击杀，`Enemy.breakOut`）；这里打完后两人走进洞里（`Game.breakoutAt` 换掉 `exit`），跳过下一步的开门，下一小关的波次里它带着剩下的血（`hp`）再出现。
- 名场面用到的东西（DESIGN「第 1 话」）：
  - **回头杀**（站点 `scare: { type, sprite, x, z, who, zoom }`，`Game.scare`；第 1 话现在改用单独一页漫画，这个演出留着备用）：怪以 `from: 'scare'` 出场，状态 `scripted`（不动、不打），镜头用 `fovKick` 慢慢推近、停音乐，`who` 那个女孩冒 `scare` 台词，`Enemy.turnAround` 按 `frames.scare` 六帧慢慢回头，露脸那一下闪白、震屏、两人吓到，然后照常开打；
  - **机关**（set `gimmicks`，`src/battle/gimmick.js`）：挂在墙上 / 站在地上 / 尽头墙上能打的画、铠甲、封印、棺材盖；带白描边，只在自己的站点能打，打够 `hp` 下就按顺序执行 `do`（`flash` 闪光、`flip` 翻成 `kx`、`turn` 翻地方、`spawn` 刷怪、`say` 台词、`sfx`、`gone` 消失）。`prop: true`：波次不等它，AI 队友不打它（`input.js`）。`shoot: false` 的不能打，由波次事件 `gimmick` 触发（画室的画像一幅幅走空）；从 Boss 点直接开局时，别的站点的这种机关当作已经触发过（`settle`，画像是空的）；
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
- 腐蜜夫人最后一个形态的三样东西（`ritual` + `Keepsake`，数据 `bosses.json` madame.ritual，打法见 DESIGN 第 1 话 10）：
  - `Keepsake` 是 Gimmick 的子类，挂在她身前（`near`），8 字形来回晃；`keepTick` 隔一阵派一样去挡核心（`guard`）。
  - 每样有自己的倒计时 `fuse`，速度每一秒多变一次（`pace`）。走完 `strike`：抖一下，飞到那个人面前打 `playerAttacked kind: 'shot'`（躲没用），再飞回去。打中它 `knock`：重新倒计时，正在飞的一击也被打断。
  - 血打空时有这三样就 `grieve`：她跪下、叫出来的杂鱼一起没了、她本身不再是目标（`hitMeshes` 空）；三样停成一排，`offer` 按顺序收。最后一样 `rest`：光飘进怀里，`die(true)` 安静地消散。
- Boss 的台词：`stickers.boss(a, kind)`，文字在 text/stickers.json `bosses.<id>.<kind>`（id 是 bosses.json 的键）。语音是 sounds.json `voices.<id>`，`voice_aivis.py lines <id>` 生成（`fx: "ghost"` 加幽灵处理）。字幕框比两人的大，挂在她头边，语音多长就留多久。

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
