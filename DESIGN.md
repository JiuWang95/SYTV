---
name: LeLeTV
description: 开场前的放映厅 —— 熄灯后的黑、一束霓虹粉、一层会反光的玻璃
colors:
  hall-black: "#0A0A0B"
  hall-raised: "#111114"
  screen-surface: "#16161A"
  screen-surface-2: "#1D1D22"
  screen-surface-3: "#25252B"
  neon-pink: "#EC4899"
  neon-pink-high: "#F472B6"
  neon-pink-low: "#DB2777"
  curtain-sakura: "#FFE4F1"
  text-primary: "#F5F5F7"
  text-secondary: "#A8A8B3"
  text-tertiary: "#86868F"
  status-ok: "#62C28E"
  status-warn: "#D8A657"
  status-bad: "#D9716B"
typography:
  display:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(2.25rem, 5.2vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(1.4rem, 2.6vw, 1.85rem)"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    letterSpacing: "0.12em"
rounded:
  xs: "6px"
  s: "10px"
  m: "12px"
  l: "14px"
  xl: "20px"
  xxl: "28px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "20px"
  s6: "24px"
  s7: "32px"
  s8: "48px"
  s9: "72px"
components:
  button-primary:
    backgroundColor: "{colors.neon-pink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.m}"
    height: "44px"
    padding: "0 18px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.screen-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.m}"
    height: "44px"
    padding: "0 18px"
  input:
    backgroundColor: "{colors.hall-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.m}"
    height: "46px"
    padding: "0 14px"
---

# Design System: LeLeTV

## Overview

**Creative North Star: "开场前的放映厅"**

灯已经暗下来，片子还没开始。整个界面就是这个状态：黑是熄灯后的黑，不是纯黑；光只有一束，是放映机的光，也就是主色；玻璃是幕布前那块会反光的东西——字标、主按钮、搜索框都从同一块玻璃上切下来。界面越安静，那一束光才越像光。

主题包的名字（霓虹夜场、私人放映厅、极光穹顶、胶片暗房、魔幻时刻、露天影院、海岸放映、深夜影院、谢幕时分、春日影展）都不是配色名，是**放映场所**：换主题 = 换一个厅，色相跟着厅里的灯走。

密度上是工具，不是海报：一屏能扫到多部片子，靠灰阶分层而不是靠分隔线；装饰一律让位给封面与标题。整套系统只有一个强调色在做事，其余都是黑、灰，和两种透明度的白。

**Key Characteristics:**
- 一个强调色，其余靠五级灰阶
- 平贴为主：靠描边与抬升面色分层，只有面板与浮层浮起
- 玻璃只出现在光会打上去的地方（字标 / 主按钮 / 搜索框）
- 圆角内小外大（6 → 28px），圆润但不糖果化
- 字体只有 Geist 一家，层级靠字号与字重（500 / 600 为主力）

## Colors

熄灯后的黑打底，一束霓虹粉做唯一光源，其余是带冷紫调的灰阶——配色性格是「暗厅里的彩色光源」，不是「深色主题」。

### Primary
- **霓虹灯管粉** (#EC4899)：唯一强调色。主按钮、focus 环、进度、选中态、logo 图形。它跟随设置里的主题包，默认是这一支；派生值 `neon-pink-high` / `neon-pink-low` 只用于悬停与渐变端点。
- **纱幕樱花白** (#FFE4F1)：主色的浅端，出现在渐变字的顶端、聚合区光线的光芯、导航字标。它不是第二个强调色，是同一束光的高光。

### Neutral
- **熄灯后的厅** (#0A0A0B)：页面底色，永不使用纯黑。
- **银幕表面** (#16161A / #1D1D22 / #25252B)：三级抬升，卡片、面板、悬浮层的面色差就是层级本身。
- **文本三级** (#F5F5F7 / #A8A8B3 / #86868F)：主文案、次要信息、辅助标注；辅助色在底色上约 5.4:1。
- **发丝边** (rgba(255,255,255,.07 / .12 / .2))：三层描边，代替阴影做分层。
- **状态色** (#62C28E / #D8A657 / #D9716B)：只以 6px 圆点出现，不做整块背景。

### Named Rules
**The One Light Rule.** 一屏之内，强调色覆盖的面积不超过 10%。它的稀有就是它的力量；第二处强调色永远不加，需要区分时用灰阶级差。
**The Cold Grey Rule.** 灰阶统一带一点冷紫，不用中性灰，也不用纯白（正文最亮只到 #F5F5F7）。

## Typography

**Display Font:** Geist（回退 -apple-system / PingFang SC / Microsoft YaHei，自托管）
**Body Font:** 同一家
**Label/Mono Font:** Geist Mono（只给邀请码这类真正的编码用）

**Character:** 一家无衬线做完全部层级，靠字重（500 / 600 为主力，700 只做极少数强调）与字号区分，不靠换字体。中文回退字体与西文同字号并排时高度接近，不会出现一高一矮。

### Hierarchy
- **Display** (600, `clamp(2.25rem, 5.2vw, 3.75rem)`, 1.1)：首屏标题与页面主标题，一个屏只出现一次。
- **Headline** (600, `clamp(1.4rem, 2.6vw, 1.85rem)`, 1.2)：分区标题，例如「继续观看」。
- **Title** (600, 1.125rem, 1.35)：卡片标题、面板标题。
- **Body** (400, 0.9375rem, 1.6)：正文与描述；长文本控制在 65–75ch。
- **Label** (500, 0.8125rem, 0.01em)：表单标签、元信息、状态文字。
- **Mono** (400, 0.9375rem, 0.12em, 大写)：邀请码、设备指纹这类需要被逐字读的字符串。

### Named Rules
**The No-Kicker Rule.** 标题上方不加小标签 / 眉题；标题自己承载信息。

## Layout

容器最大 1240px（`--v2-max`），左右留白 `clamp(16px, 4vw, 40px)`。间距全用 4 的倍数（`--v2-s1` … `--v2-s9`，4 → 72px）：组内紧（8–12px），组间松（24–32px），标题上方比下方多一档。

响应式断点按内容断：641 / 721 / 861 / 1024 / 1101，另有 1600 与 2400 两档给大屏与超宽屏。手机是主场景，桌面与平板是同一套版式的放大与加列，不是另一套界面。

## Elevation & Depth

**平贴为主，靠描边与面色抬升分层。** 系统不用投影表达层级：卡片、控件、导航栏都是平的，靠 `--v2-line` 三级发丝边和 `--v2-surface` 三档面色区分远近。只有两类东西浮起：模态面板（一次点击后才出现）与需要脱离页面的悬浮层。

### Shadow Vocabulary
- **面板浮起** (`box-shadow: 0 40px 80px -32px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.04)`)：模态与抽屉，带着 1px 描边一起用，避免浮在半空的糊边。
- **玻璃顶光** (`box-shadow: inset 0 0.5px 0 rgba(255,255,255,.28)`)：主按钮、次按钮的顶边高光，是材质不是阴影。
- **focus 光晕** (`box-shadow: 0 0 0 4px rgba(236,72,153,.14)`)：输入框聚焦，唯一允许的彩色光晕。

### Named Rules
**The Flat-By-Default Rule.** 静止状态不投影。投影只响应「浮起来」这件事（模态、悬浮层、聚焦），不做装饰性发光。
**The Hairline Rule.** 需要分层时先加 0.5–1px 的发丝边，再考虑换面色，最后才考虑投影。

## Shapes

圆角内小外大：小控件 10–12px，卡片 14–20px，面板 28px。按钮高 44px、输入框 46px，触控目标不小于 44px。描边一律 0.5px（控件）或 1px（输入框），从不使用粗边框。

没有斜切、没有胶囊（除非是标签这类极小控件）、没有异形裁切。形状语言是「圆润、克制、像设备」而不是「糖果」。

## Motion

动效只为三件事存在：**开场、换场、换色**。其余交互让位——悬停、切页、开合都只用 `dur-fast` / `dur-standard` 的状态过渡。一条动效只讲一个动作，缓动一律指数外衰减（先快后慢），不回弹、不循环、不做装饰性呼吸。

| 场景 | 时长 | 语言 |
|---|---|---|
| **开场** | 250ms 显影 + 1250ms 书写 | 笔画沿字形骨架一笔一笔写完（9 段路径，笔尖带一点光），写完球面光释放一次 |
| **换数据域**（私密 ⇄ 正常） | 420ms 熄灯 → 重载 → 书写 → 380ms 光 → 500ms 淡出 | 压暗收焦到黑，再由同一个字标把灯打开；这趟**不爆光**，因为爆光是「第一次开场」的动作 |
| **换配色** | 460ms 溶合 + 420ms 泛光 | 27 个颜色变量从旧值插到新值，整页一起走过去；新色从被点的那块色盘泛出一小团光，涨到约 0.85 屏就散 |

实现约束：

- **颜色要以颜色的方式变。** 不要用粒子或遮罩去盖住「变量在一帧里换完」——盖住的是闪，不是过渡。换色直接插值变量本身（hex、逗号/空格分隔的三元组、rgba 都要能插，且按原格式写回）。
- **变量的写入要节流。** 换色时按约 33fps 写，和屏幕刷新率解耦：写一次变量就要重算整页颜色，没必要跟着 60fps 重绘。
- **一次只动一层。** 粒子、扫光、缩放不同时出现；同一时刻画面里只有一个焦点。
- **尊重 `prefers-reduced-motion`**（以及设置里的动效开关）：全部退化为瞬时切换，不丢功能。

### Named Rules
**The One-Moment Rule.** 一屏只允许一个 authored moment；两段动效不能争同一次交互。
**The No-Repeat Rule.** 开场那套仪式（粒子 + 字标 + 爆光）不复用到别处。换场只借用它的一部分——写字和开灯——不借用爆光。

## Components

### Buttons
- **Shape:** 高 44px，圆角 12px，左右内边距 18px，字号 15px / 600。
- **Primary:** 主色清玻璃——半透明主色渐变（0.36 → 0.22）+ 0.5px 主色发丝边 + 顶边高光 + `backdrop-filter: blur(12px) saturate(1.4)`；白字。不是实心色块。
- **Hover / Focus:** 悬停把主色透明度提到 0.46 / 0.3；按下 `translateY(1px) scale(.985)`；聚焦环 4px 主色 14% 光晕。
- **Secondary / Ghost / Danger:** 次按钮是无色清玻璃；ghost 无底、悬停加 6% 白；danger 用状态红。

### Inputs / Fields
- **Style:** 高 46px，圆角 12px，1px 发丝边，底色 3.5% 白；placeholder #6B6B74。
- **Focus:** 描边换主色 60%，底色提到 5% 白，加 4px 主色 14% 光晕。
- **Error:** 描边换状态红 70%，不加图标阵列。

### Cards / Containers
- **Corner Style:** 14–20px。
- **Background:** `screen-surface` 三档之一，靠面色差分层。
- **Border:** 0.5px 发丝边，与面色一起使用。
- **Shadow Strategy:** 静止不投影（见 Elevation）。
- **Internal Padding:** 16–20px。

### Navigation
顶部一条 40px 高的粘性栏，底色比页面抬一档，底部一条 0.5px 发丝边。当前项用主色文字 + 主色小圆点，不用下划线。移动端收成图标按钮，保留搜索入口。

### Signature Component — 玻璃字标
LeLeTV 字标是这套系统里唯一「有材质」的东西：一条 `#lele-word` 路径，在 SVG 里用 `feSpecularLighting` 打两次边缘光（azimuth 230 / 50）、叠一层对角 sheen 渐变、再加 1px 白色轮廓。首页 hero 与启动屏共用同一份滤镜，所以启动屏不是「另做一个 logo 动画」，而是同一个材质先对上焦、再让位给页面。

## Do's and Don'ts

### Do:
- **Do** 用五级灰阶 + 三档发丝边表达层级，先加线再换面。
- **Do** 让强调色保持稀有（≤10% 面积），一屏只有一束光。
- **Do** 玻璃只用在光会打上去的地方：字标、主按钮、搜索框。
- **Do** 触控目标 ≥44px，深色底上正文对比度 ≥4.5:1。
- **Do** 圆角跟着元素大小走（小 10–12，大 20–28）。

### Don't:
- **Don't** 加第二处强调色，也不要给强调色加发光投影（零偏移的彩色光晕属于装饰）。
- **Don't** 给静止元素加投影，或用「1px 边框 + 大柔光」的幽灵卡片组合。
- **Don't** 新增渐变文字；强调靠字重与字号（现存 hero 渐变字标是这套系统的既有例外）。
- **Don't** 卡片套卡片，或把同尺寸的「图标 + 标题 + 一段字」当成页面结构。
- **Don't** 用纯黑 #000 或中性灰，灰阶永远带一点冷紫。
