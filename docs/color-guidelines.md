# 全局配色使用指南

基于黑/白与巴黎奥运紫色 (#E8DFF5) 构建的配色体系，旨在提供简约、柔和且在明暗双主题下表现一致的体验。下文描述基础色板、语义令牌以及在组件中的使用规范。

## 基础色板

### 品牌紫色等级

| Token | Hex |
| --- | --- |
| brand-100 | #f3effa |
| brand-200 | #ede4f7 |
| brand-300 | #d7c8ee |
| brand-400 (主品牌色) | #E8DFF5 |
| brand-500 | #b699df |
| brand-600 | #9a72d3 |

### 灰阶系统

| Token | Hex |
| --- | --- |
| neutral-50 | #f9fafb |
| neutral-100 | #f3f4f6 |
| neutral-200 | #e5e7eb |
| neutral-300 | #d1d5db |
| neutral-400 | #9ca3af |
| neutral-500 | #6b7280 |
| neutral-600 | #4b5563 |
| neutral-700 | #374151 |
| neutral-800 | #1f2937 |
| neutral-900 | #111827 |

### 功能状态色

| 状态 | 主色 | 浅色背景 |
| --- | --- | --- |
| Success | #2f8f60 | #e8f6ee |
| Warning | #d97706 | #fff3e6 |
| Error | #dc2626 | #feeceb |
| Info | #2563eb | #e7f2ff |

## 语义化颜色令牌

Tailwind 通过 `theme.extend.colors` 抽象为语义化令牌，搭配 CSS 自定义属性支持明暗模式：

- `surface.DEFAULT` → `rgb(var(--color-surface) / <alpha-value>)`
- `surface.muted` → 卡片、弹窗背景
- `surface.inverted` → 深色场景下的对比背景
- `text.DEFAULT` / `text.subtle` / `text.inverted` → 主、副文本与反色文本
- `border.DEFAULT` / `border.strong` → 细/粗边框
- `focus` → `rgb(var(--color-focus-ring) / <alpha-value>)`
- 状态色：`brand-*`, `success`, `warning`, `error`, `info`

> 使用 Tailwind 时优先选用语义令牌，例如 `bg-surface-muted`, `text-text-subtle`, `border-border`，保持明暗模式与品牌色一致。

## CSS 变量

全局定义位于 `src/assets/main.css`，以 RGB 数值形式声明并在明暗主题下切换：

- 背景：`--color-surface`, `--color-surface-muted`, `--color-surface-overlay`
- 文本：`--color-text-primary`, `--color-text-secondary`, `--color-text-inverted`
- 边框：`--color-border`, `--color-border-strong`，派生的 `--border-color-subtle` / `--border-color-strong`
- 按钮：`--color-button-primary-bg`, `--color-button-primary-fg`
- 状态：`--color-success`, `--color-warning`, `--color-error`, `--color-info` 及各自背景
- 焦点：`--color-focus-ring`

> **最佳实践**：在组件中直接引用语义变量 (`rgb(var(--color-text-primary))`) 而非硬编码色值，确保 DRY 与统一的明暗模式表现。

## 组件与 Naive UI 主题

- `src/App.vue` 通过 `ThemePalette` 映射轻/暗主题的品牌、文本、状态色到 Naive UI 的 `common` 与 `Button` 令牌。
- Naive UI `primary` 按钮使用品牌紫色背景与深色文字，保证对比度。
- 成功/警告/错误/信息类组件将继承功能色，无需额外样式即可匹配品牌体系。

## 使用建议

1. **主动作调用品牌紫色**：用于关键按钮、链接、高亮背景，可搭配 `brand-100`~`brand-500` 形成层次。
2. **文本层级**：正文 `text.DEFAULT`、辅助文案 `text.subtle`，反转背景使用 `text.inverted`。
3. **表面层级**：页面背景使用 `surface.DEFAULT`，卡片/弹窗使用 `surface.muted`，悬浮层可以 `surface.overlay` 搭配模糊或阴影。
4. **边框与分割线**：细线选 `border.DEFAULT`，强调或选中态使用 `border.strong`。
5. **状态反馈**：成功/警告/错误/信息类提示统一调用对应功能色与淡色背景，保持识别度并满足可访问性。
6. **明暗模式**：所有组件应依赖语义令牌，无需手动区分主题；若需额外差异化，优先通过变量扩展而非硬编码。

遵循以上规范即可在不同页面和模块间保持一致的品牌体验，并简化后续扩展与维护成本。
