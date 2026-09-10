# LeLeTV Cinephile Design System v1.0

> 高端影院感设计系统 — 为视频平台打造的沉浸式视觉语言

---

## 设计理念

**Cinephile（影迷）** 设计系统以"私人影院"为核心意象，追求：
- **沉浸感** — 深色调背景让内容成为主角
- **高级感** — 暗金点缀替代高饱和色，克制而精致
- **电影感** — 大留白、宽行距、柔和过渡，像电影海报一样呼吸
- **一致性** — 所有组件遵循统一的令牌体系，跨页面无缝衔接

---

## 色彩体系

### 背景层
| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-base` | `#0a0a0f` | 页面底色 |
| `--bg-secondary` | `#12121a` | 次级背景 |
| `--bg-elevated` | `#1c1c28` | 弹层/悬浮 |
| `--bg-overlay` | `rgba(10,10,15,0.85)` | 遮罩层 |

### 主色 — 暗金
| Token | 值 | 用途 |
|-------|-----|------|
| `--primary` | `#c9a96e` | 主按钮、强调、链接 |
| `--primary-light` | `#d4b87a` | Hover 状态 |
| `--primary-dark` | `#a88b50` | 按下状态 |
| `--primary-dim` | `rgba(201,169,110,0.12)` | 背景填充 |

### 文字
| Token | 值 | 用途 |
|-------|-----|------|
| `--text-primary` | `#f5f0e8` | 标题、正文 |
| `--text-secondary` | `#a09c96` | 次要信息 |
| `--text-tertiary` | `#6a6660` | 辅助/占位 |
| `--text-disabled` | `#3a3834` | 禁用状态 |

### 状态色
- 成功 `#4ade80` / 警告 `#fbbf24` / 错误 `#f87171` / 信息 `#60a5fa`

---

## 字体体系

- **字族**: `Inter` → `system-ui` → `PingFang SC` → `Microsoft YaHei`
- **字号**: 11px ~ 56px（clamp 响应式）
- **字重**: 300 / 400 / 500 / 600 / 700 / 800
- **行高**: 标题 1.1 / 正文 1.5 / 放松 1.7

| 级别 | 字号 | 字重 | 用途 |
|------|------|------|------|
| Hero | clamp(36-56px) | 800 | 大横幅标题 |
| Display | clamp(28-42px) | 700 | 页面主标题 |
| H1 | 28px | 700 | 页面标题 |
| H2 | 22px | 700 | 区块标题 |
| H3 | 18px | 600 | 卡片/小组标题 |
| Base | 14px | 400 | 正文 |
| Small | 13px | 400 | 辅助文字 |
| XS | 12px | 500 | 标签/元信息 |

---

## 间距 & 圆角

**间距**: 4px 基准 — 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80px

**圆角**:
- `--radius-xs` 4px — 标签、徽章
- `--radius-sm` 6px — 小按钮、输入框
- `--radius-md` 10px — 表单控件
- `--radius-lg` 14px — 卡片
- `--radius-xl` 20px — Hero 横幅
- `--radius-full` 9999px — 胶囊按钮、头像

---

## 组件清单

| 组件 | 类名 | 变体 |
|------|------|------|
| 导航栏 | `.navbar` | 固定/毛玻璃/滚动变色 |
| 按钮 | `.btn` | primary / secondary / ghost / outline + sm/lg/block/icon |
| 搜索框 | `.nav-search` / `.form-input` | 导航内/表单内 |
| Hero 横幅 | `.hero` | 带渐变遮罩 |
| 视频卡片 | `.card` | 竖版 2:3 / 横版 16:9 |
| 标签筛选 | `.tag` | 默认/激活 |
| 开关 | `.switch` | 开/关 |
| 滑块 | `.range-slider` | 音量/进度/数值 |
| 下拉选择 | `.form-select` | 自定义箭头 |
| 设置项 | `.settings-item` | 带描述+控件 |
| 选集网格 | `.episode-list` | 数字格子 |
| 特性卡片 | `.feature-card` | 图标+标题+描述 |
| 空状态 | `.empty-state` | 无结果/错误 |

---

## 响应式断点

| 断点 | 宽度 | 卡片列数 | 导航 |
|------|------|---------|------|
| 大屏 | ≥1600px | 7 列 | 完整 |
| 桌面 | ≥1280px | 6 列 | 完整 |
| 平板 | ≤1024px | 4 列 | 搜索框缩短 |
| 手机横屏 | ≤768px | 3 列 | 汉堡菜单 |
| 手机竖屏 | ≤480px | 2 列 | 汉堡菜单 |
| 超小屏 | ≤360px | 2 列 | 按钮全宽 |

**横屏优化**: `@media (max-height: 500px) and (orientation: landscape)` — Hero 压缩、卡片 4 列

---

## 动效规范

- **缓动**: `cubic-bezier(0.16, 1, 0.3, 1)`（标准出场）
- **时长**: 快速 150ms / 正常 300ms / 慢速 500ms
- **卡片 Hover**: translateY(-6px) + 封面 scale(1.06) + 播放按钮浮现
- **导航**: 滚动时背景加深 + backdrop-filter blur
- **尊重**: `prefers-reduced-motion` 自动降级

---

## 文件结构

```
cinephile/
├── design-system.css   # 设计系统核心（令牌+组件+响应式）
├── index.html          # 首页
├── search.html         # 搜索结果页
├── player.html         # 播放详情页
├── settings.html       # 设置页
├── about.html          # 关于页
└── README.md           # 本文档
```

---

## 落地到 LeLeTV 项目的映射

| 现有变量 | Cinephile 映射 |
|---------|---------------|
| `--color-primary: #ec4899` | `--primary: #c9a96e`（霓虹粉→暗金） |
| `--color-bg: #000000` | `--bg-base: #0a0a0f`（纯黑→深蓝黑） |
| `--color-text-primary: #e6f2ff` | `--text-primary: #f5f0e8`（冷白→暖白） |
| Geist 字体 | Inter（保持无衬线，更通用） |
