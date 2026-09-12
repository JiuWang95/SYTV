/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './**/*.html',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      // pink 调色板改为引用 CSS 变量：私密模式下由 variables.css 的 html[data-hidden-mode]
      // 覆盖为鸿蒙便签黄，于是 HTML 里所有 bg-pink-* / text-pink-* / focus:border-pink-* 等
      // 工具类都会自动跟随主题切换，无需改动各处的类名
      colors: {
        pink: {
          50: 'rgb(var(--tw-pink-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--tw-pink-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--tw-pink-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--tw-pink-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--tw-pink-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--tw-pink-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--tw-pink-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--tw-pink-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--tw-pink-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--tw-pink-900-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}

// 需要 safelist 的动态类名（在 JS 中通过变量拼接构造，扫描器无法直接匹配）
// - bg-pink-600, text-white, text-gray-300 等用于 toggle 开关
// - opacity-50, cursor-not-allowed 用于翻页禁态
// - bg-gray-700, bg-[#222], hover:bg-[#333] 用于按钮状态
// - translate-x-6 用于 toggle dot
// - border-blue-500 用于拖拽区域
// 以上类名均为完整字符串出现在 JS 中，扫描器可以自动捕获，无需 safelist

