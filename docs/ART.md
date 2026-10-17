# 美术生产

## 来源和出图流程
- 美术全部由 GPT 出（Codex CLI 的出图工具），**只有静态 2D 图**：没有 3D 模型，没有蒙皮动画。动起来靠程序（晃动、浮雕、shader）。
- 一轮出图 = 一个 `tools/job_specsNN.py`：`JOBS = {任务名: [(输出路径, [参考图...], 提示词, "OPAQUE"?)]}`。
  1. `python -I tools/make_jobs.py tools/job_specsNN.py [任务名...]` → 生成 `art/jobs/<任务名>.md`；
  2. `bash tools/run_jobs.sh <并行数> 任务名...`（单个用 `tools/codex_job.sh art/jobs/X.md`）→ 图在 `art/raw/rNN/`；
  3. `python -I tools/rNN_import.py` → 进 `public/content/base/assets/` 和 `manifest.json`。
- 被拒（`*.refused.txt`）的常见原因：
  - 地雷妹设计稿的半透明粉色连衣裙 + "流口水、脸红、踢腿"之类的描述，会触发安全过滤。
  - 改法：去掉设计稿参考，写成"粉色荷叶边校服衬衫 + 薄荷水手领，fully clothed"，语气写 wholesome。
- Codex 有时会把图放大或挪位：用 `tools/fit_cutout.py` 搜缩放和偏移，对回参考图。

## 有参考图时（UI 等），参考图就是标准答案
1. 在参考图上给每个零件画框（如 `art/ref/select_parts/boxes.json`）。
2. 让 Codex 原样单独画出零件：不许改造型、颜色，不许加东西，只去掉指定的字和控件。
3. 底图 = 参考图本身，只在控件盖住的地方用 Codex 补的像素（`tools/plate_mask.py`）。
4. 去掉控件上的文字：文字涂洋红让 Codex 补下面的纹理；平色区直接用周围颜色填（`tools/text_mask.py`）。
5. 文字由程序按实测的位置、字号、角度排（`tools/measure_text.py`，误差约 2px）。字体是打包的 Noto Sans SC 700/900。
6. 人物用参考图里的人物原样抠，不拿别处的立绘顶替。
7. 实机截图和参考图并排对照（`tools/shot.cjs` 截全尺寸），误差 1～2px 内。
- 已按此做完：标题+设置（`art/ref/ui_p5.png`）、选关（`art/ref/select_ref.png`）。

## 人物
- **立绘绝不复用**：
  - 每个画面、每个场景的人物重新画，姿势表情各不相同；
  - 同一张图换裁剪、缩放、重抠都算复用，让 AI 照旧姿势重画也算。
  - 执行：
    - 界面配置里的人物图写 `"char": true` 和 `"pose"`；
    - 出人物图前跑 `python -I tools/check_art_reuse.py --poses`，把已用过的姿势写进提示词"不许重复"；
    - 出图后跑 `--vs <新图>`，接进游戏后跑无参数版，必须通过。
- 角色设定只看 `art/ref/cat_sheet.png`、`art/ref/pink_sheet.png`。
- `art/gpt_sets/set_1..5` 是用户自己用 GPT 出的原始素材（战斗姿势、头像、漫画等），只当素材库，不搬到界面上。
- **战斗里的主角**：用晃动技术验证用的 NIKKE 式静态立绘 `public/jiggle/<cat|pink>_<cover|fire>.png`，加晃动骨架（见 TECH「晃动」）。
  - 不靠堆关键帧：R27 补的一堆姿势帧（`neko/*`、`pink/*` 里的 run、hurt、victory 等）不作为主做法。

## 猫爪咒印
- 标准咒印 = `art/ref/cat_sheet.png` 右侧特写，抠成 `art/ref/cat_seal_decal.png`：
  - 红圈、五芒星；
  - 圈上四个篆字；
  - 左右上三个菱形尖；
  - 下垂的云纹、中国结、尖坠。
- 任何画到猫爪手背的图，都不信 GPT 画的咒印：
  1. `tools/seal_fix.py` 抹掉原咒印，贴标准咒印；
  2. 每张图的位置、大小、角度登记在 `art/seal_placements.json`（`keep_frame` = 不裁画框，`png` = 写到指定路径）。
- 已处理：
  - 标题、选关的猫娘；
  - 光标；
  - 战斗姿势（`bt_*`）；
  - 序章漫画（`cm_*`）。

## 怪物和 Boss
- 方向见 DESIGN「怪物」。
- 小怪：一张 3×2 的六姿势表（`tools/job_specs23.py`），`tools/r23_import.py` 按空白带切开，放进同一画布，存成 `enemy/<id>_<姿势>`。
- Boss：
  1. 先出一张定稿主图（`art/raw/r25/master.png`）；
  2. 以它为参考，每个动起来的部件单独出（头的几种表情、手的几种动作、各阶段的身体），`tools/r25_import.py`；
  3. 弱点位置写在 manifest 的 `weak`。
- 所有站在场景里的东西（怪、掩体、道具），都用 `tools/relief.py` 生成深度浮雕图 `<key>_rd`（见下）。

## 场景（技术路线，2026-10-17 定，走廊验证已过）
- **场景 = 平板拼出来的真 3D 空间**：地板、墙、天花板、门窗都是平板。每块板贴 GPT 画的**正视图**，透视交给 3D。
  - 提示词要点（`tools/job_specs28.py` 的 FLAT）：
    - orthographic、完全正对、没有透视和消失点，画面就是这块表面，铺满到边；
    - 墙按 4.5m × 3m 一段出（3:2），地板 / 天花板 3m × 3m 一张，要能平铺。
  - 窗户玻璃涂纯洋红 `#FF00FF`，导入时抠空（`tools/r28_import.py`）；窗外是单独一张远景全景。
  - 地板、天花板导入时把边缘做成可平铺。
  - 贴花（眼睛符号、横幅、裂纹、散落的考卷、书包、粘液）出成一张 3×2 表，切开后贴在板上。
- **掩体、桌椅、道具、怪物、Boss = 单张 GPT 图 + 深度浮雕**：
  - `python -I tools/relief.py "<key 通配>"`：离线用 Depth Anything V2 Small（`tools/models/`，不进游戏、不进存档）算每个像素的远近，写 `<key>_rd.png` 并在 manifest 里登记 `relief`；
  - 游戏里把画推成凹凸网格，并用它打卡通光。
- 掩体由 Claude 按玩法摆在关卡数据里，尺寸按 DESIGN「掩体尺寸」。
- **作废的路**（不要再走）：
  - 3D 网格 + 平铺照片式贴图；
  - 一张 GPT 场景画 + 深度模型鼓成假 3D（`plates.js`）；
  - 从固定视角把画投影到几何上；
  - GPT 单独画的整幅场景 CG 只能当风格参考（`art/ref/corridor_concept.png` 是风格参考）。

## 关键参考图（`art/ref/`）
| 文件 | 是什么 |
|---|---|
| `cat_sheet.png` / `pink_sheet.png` | 主角设定稿（用户定） |
| `cat_seal_decal.png` | 标准咒印 |
| `ui_p5.png` / `select_ref.png` | 标题、选关的定稿效果图 |
| `monster_ref.webp` | 怪物方向 |
| `corridor_concept.png` | 场景画风参考 |
| `fold_city.png` / `fold_cubes.png` | 盗梦空间式变形参考 |

## 出图轮次索引（`art/raw/rNN`）
- 现用：
  - R15、R17：标题；
  - R19、R20：选关；
  - R22：走廊概念图拆出的掩体；
  - R23：小怪；
  - R25：Boss；
  - R26：序章漫画；
  - R28：走廊平板；
  - R24x：从旧场景画里抠出的掩体，贩卖机、公告板还在用。
- 作废：
  - R11～R14、R16、R18：旧 UI 和旧人物；
  - R21：第一版怪物设计稿，被否；
  - R24：静态场景画；
  - R27：堆关键帧，不作主做法。
