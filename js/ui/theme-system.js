/* LeLeTV - 主题色系统（设置页「主题」卡片）
 *
 * 组成：
 *   1) 预设色系：12 个主色盘（两行 × 6），最后一个为自定义；
 *   2) Popover ColorPicker：点击色盘弹出气泡，内含该色系的梯度色块 + 二维坐标取色板（S/V 平面）；
 *      自定义额外提供色相条与 RGB 输入框（全色彩）；
 *   3) 原地换色：应用后全屏粒子自四周螺旋凝聚 → 爆开瞬间闪换成新主题色，
 *      不重载页面、不丢当前状态；粒子视觉语言与私密模式切换同源；
 *   4) 按模式各存一套：正常模式 / 私密模式各记自己的主题色，互不干扰；
 *      某模式从未设置过主题时不写入任何覆盖，继续沿用 css 的默认色
 *      （正常 = 霓虹粉 #ec4899，私密 = 铜色 #B87333）。
 *
 * 主题色的落点与 css/variables.css 完全一致：只改写这一组 CSS 变量，
 * 其余派生色（--pink-*、rgba(var(--color-primary-rgb), …)）自动跟随。
 * 刷新时的首帧应用由 index.html / player.html 的 head 内联脚本用同一套算法先行完成
 * （避免先闪默认色再切到目标色），改动派生算法时三处需同步。
 */
(function () {
    'use strict';

    // ===================== 常量 =====================

    // 存储键：按数据域分开，正常/私密模式各存一套主题
    var KEY_NORMAL = 'leletv_theme_normal';
    var KEY_HIDDEN = 'leletv_theme_hidden';
    var MODE_ATTR = 'data-hidden-mode';

    // 键名对外暴露一份，供设置项的导入/导出等模块复用（键名在这里是唯一来源，
    // 免得别处再抄一遍字符串、两边不同步）
    window.LeLeThemeStore = {
        KEYS: [KEY_NORMAL, KEY_HIDDEN],
        isKey: function (key) { return key === KEY_NORMAL || key === KEY_HIDDEN; }
    };

    // 默认落点：与 css 的 :root 默认色一致的预设
    var DEFAULT_KEY = 'neon';

    // 12 个主色（两行 × 6，与卡片中的网格顺序一致）
    var PRESETS = [
        { key: 'red', name: '红色系', hex: '#ef4444' },
        { key: 'orange', name: '橙色系', hex: '#f97316' },
        { key: 'yellow', name: '黄色系', hex: '#eab308' },
        { key: 'green', name: '绿色系', hex: '#22c55e' },
        { key: 'blue', name: '蓝色系', hex: '#3b82f6' },
        { key: 'purple', name: '紫色系', hex: '#a855f7' },
        { key: 'pink', name: '粉色系', hex: '#f472b6' },
        { key: 'earth', name: '大地系', hex: '#8a6f47' },
        { key: 'gray', name: '灰色系', hex: '#808080' },
        { key: 'brown', name: '棕褐色系', hex: '#b45309' },
        { key: 'neon', name: '霓虹系', hex: '#ec4899' },
        { key: 'custom', name: '自定义', hex: null }
    ];

    // Tailwind pink 调色板的档位与对应亮度（暗色主题下由深到浅的层次）
    var RAMP_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    var RAMP_L = [96, 93, 87, 80, 70, 60, 51, 43, 35, 26];
    // 无彩色（灰色系、或自定义选到纯灰）另用一套：从白到黑铺满，
    // 让「灰色系」拿到的是一整条黑—灰—白，而不是被压在中间的一小段浅色
    var RAMP_L_MONO = [100, 89, 78, 67, 56, 44, 33, 22, 11, 0];
    var MONO_SAT_THRESHOLD = 5; // 饱和度低于此值视作无彩色

    // 自定义色盘未设置过时的占位：一条彩虹渐变，提示"可自由选色"
    var CUSTOM_PLACEHOLDER =
        'conic-gradient(from 210deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)';

    var RAMP_STOPS_SET = RAMP_STOPS.map(function (n) { return '--tw-pink-' + n + '-rgb'; });
    var BASE_VARS = [
        '--color-primary', '--color-primary-rgb',
        '--color-primary-300', '--color-primary-400', '--color-primary-400-rgb',
        '--color-primary-600', '--color-primary-600-rgb'
    ];

    // ===================== 颜色工具 =====================

    function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }

    /** 十六进制（#rgb / #rrggbb）→ [r, g, b]，非法值返回 null */
    function hexToRgb(hex) {
        var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex == null ? '' : hex).trim());
        if (!m) return null;
        var h = m[1];
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    function rgbToHex(rgb) {
        return '#' + rgb.map(function (v) {
            return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
        }).join('');
    }

    /** [r, g, b] → [h(0-360), s(0-1), v(0-1)] */
    function rgbToHsv(rgb) {
        var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        var h = 0;
        if (d > 1e-6) {
            if (mx === r) h = 60 * (((g - b) / d) % 6);
            else if (mx === g) h = 60 * ((b - r) / d + 2);
            else h = 60 * ((r - g) / d + 4);
        }
        if (h < 0) h += 360;
        return [h, mx <= 0 ? 0 : d / mx, mx];
    }

    /** [h(0-360), s(0-1), v(0-1)] → [r, g, b]（0-255 浮点） */
    function hsvToRgb(h, s, v) {
        h = ((h % 360) + 360) % 360;
        var c = v * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = v - c;
        var r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }

    /** [r, g, b] → [h(0-360), s(0-100), l(0-100)] */
    function rgbToHsl(rgb) {
        var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        var l = (mx + mn) / 2, d = mx - mn;
        var h = 0, s = 0;
        if (d > 1e-6) {
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            if (mx === r) h = 60 * (((g - b) / d) % 6);
            else if (mx === g) h = 60 * ((b - r) / d + 2);
            else h = 60 * ((r - g) / d + 4);
        }
        if (h < 0) h += 360;
        return [h, s * 100, l * 100];
    }

    /** [h(0-360), s(0-100), l(0-100)] → [r, g, b]（0-255 浮点） */
    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s /= 100;
        l /= 100;
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = l - c / 2;
        var r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }

    /**
     * 由主色派生整套主题色。
     * 只调整亮度、保留原色相与饱和度：无彩色主色（灰色系）自然得到灰阶，
     * 彩色主色则得到与霓虹粉同構的明度层次。
     */
    function buildPalette(hex) {
        var rgb = hexToRgb(hex) || hexToRgb(PRESETS[PRESETS.length - 2].hex);
        var hsl = rgbToHsl(rgb);
        var h = hsl[0];
        var s = clamp(hsl[1], 0, 100);
        // 无彩色另走一套明度表：铺满黑→白，含中间各档灰
        var lTable = s < MONO_SAT_THRESHOLD ? RAMP_L_MONO : RAMP_L;
        var ramp = lTable.map(function (l) { return hslToRgb(h, s, l); });
        return {
            hex: rgbToHex(rgb),
            rgb: rgb.map(function (v) { return Math.round(v); }),
            ramp: ramp,
            p300: rgbToHex(ramp[3]),
            p400: rgbToHex(ramp[4]),
            p600: rgbToHex(ramp[6])
        };
    }

    // ===================== 应用 / 清除主题变量 =====================

    /** 把派生色写进 <html> 的行内样式：行内样式优先级高于 css 的 html[data-hidden-mode] 规则 */
    function applyPalette(pal) {
        var st = document.documentElement.style;
        st.setProperty('--color-primary', pal.hex);
        st.setProperty('--color-primary-rgb', pal.rgb.join(', '));
        st.setProperty('--color-primary-300', pal.p300);
        st.setProperty('--color-primary-400', pal.p400);
        st.setProperty('--color-primary-400-rgb', hexToRgb(pal.p400).join(', '));
        st.setProperty('--color-primary-600', pal.p600);
        st.setProperty('--color-primary-600-rgb', hexToRgb(pal.p600).join(', '));
        RAMP_STOPS.forEach(function (stop, i) {
            st.setProperty('--tw-pink-' + stop + '-rgb', pal.ramp[i].map(function (v) {
                return Math.round(v);
            }).join(' '));
        });
    }

    /** 撤掉覆盖，回落到 css 的默认色（正常 = 霓虹粉，私密 = 铜色） */
    function clearPalette() {
        var st = document.documentElement.style;
        BASE_VARS.concat(RAMP_STOPS_SET).forEach(function (name) {
            st.removeProperty(name);
        });
    }

    /** 当前主色（取 CSS 变量的真实值，取不到时回落到霓虹粉） */
    function readPrimaryRgb() {
        try {
            var v = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-rgb').trim();
            var parts = v.split(',').map(function (n) { return parseInt(n, 10); });
            if (parts.length === 3 && parts.every(function (n) { return n >= 0 && n <= 255; })) return parts;
        } catch (e) { /* 忽略 */ }
        return [236, 72, 153];
    }

    // ===================== 持久化（按模式各存一套） =====================

    function isHiddenMode() {
        try { return document.documentElement.hasAttribute(MODE_ATTR); } catch (e) { return false; }
    }

    function storageKey() { return isHiddenMode() ? KEY_HIDDEN : KEY_NORMAL; }

    /** 读取当前模式已保存的主题：{ key, hex }；从未设置过返回 null */
    function loadState() {
        try {
            var raw = localStorage.getItem(storageKey());
            if (!raw) return null;
            var st = JSON.parse(raw);
            var rgb = st && hexToRgb(st.hex);
            if (!rgb) return null;
            return { key: String(st.key || 'custom'), hex: rgbToHex(rgb) };
        } catch (e) { return null; }
    }

    function saveState(state) {
        try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch (e) { /* 隐私模式等场景忽略 */ }
    }

    // ===================== 主色盘卡片 =====================

    function discColorOf(preset) {
        if (preset.key !== 'custom') return preset.hex;
        var saved = loadState();
        return (saved && saved.key === 'custom') ? saved.hex : CUSTOM_PLACEHOLDER;
    }

    function renderCard() {
        var grid = document.getElementById('themeDiscGrid');
        if (!grid) return;
        grid.textContent = ''; // 内容全部由代码生成（无用户输入），先清空避免重复渲染
        var frag = document.createDocumentFragment();
        PRESETS.forEach(function (preset) {
            var item = document.createElement('div');
            item.className = 'theme-disc-item';

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-disc';
            btn.setAttribute('data-theme-key', preset.key);
            btn.setAttribute('aria-label', preset.name);
            btn.title = preset.name;
            btn.style.setProperty('--disc-color', discColorOf(preset));

            var label = document.createElement('span');
            label.className = 'theme-disc-label';
            label.textContent = preset.name;

            item.appendChild(btn);
            item.appendChild(label);
            frag.appendChild(item);
        });
        grid.appendChild(frag);
        syncSelection();
    }

    /** 高亮当前生效的主色盘（从未设置过时，正常模式与默认色一致的霓虹系算作选中） */
    function syncSelection() {
        var grid = document.getElementById('themeDiscGrid');
        if (!grid) return;
        var saved = loadState();
        var activeKey = saved ? saved.key : (isHiddenMode() ? '' : DEFAULT_KEY);
        Array.prototype.forEach.call(grid.querySelectorAll('.theme-disc'), function (btn) {
            var on = btn.getAttribute('data-theme-key') === activeKey;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var custom = grid.querySelector('.theme-disc[data-theme-key="custom"]');
        if (custom) custom.style.setProperty('--disc-color', discColorOf(PRESETS[PRESETS.length - 1]));
    }

    // ===================== 原地换色的粒子过渡 =====================
    // 阶段：粒子自屏幕四周螺旋向中心凝聚（旧主题色）→ 爆开瞬间切入新主题色 → 向外飞散淡出。
    // 换色动作发生在"爆开"那一刻，粒子既是转场也是新色的揭示。

    var BURST_GATHER_MS = 560;
    var BURST_BURST_MS = 430;
    var BURST_FADE_MS = 200;

    function reducedMotion() {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }

    function playThemeBurst(oldRgb, newRgb, switchTheme, onDone) {
        var done = function () { if (onDone) onDone(); };
        if (reducedMotion()) { switchTheme(); done(); return; }

        var w = window.innerWidth, h = window.innerHeight;
        var cv = document.createElement('canvas');
        cv.className = 'theme-burst-canvas';
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, Math.floor(w * dpr));
        cv.height = Math.max(1, Math.floor(h * dpr));
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
        var ctx = cv.getContext('2d');
        if (!ctx) { switchTheme(); done(); return; }
        document.body.appendChild(cv);
        ctx.scale(dpr, dpr);

        var cx = w / 2, cy = h / 2;
        var maxR = Math.sqrt(cx * cx + cy * cy);
        var count = clamp(Math.round((w * h) / 1400), 420, 1400);
        var parts = [];
        for (var i = 0; i < count; i++) {
            var rnd = Math.random();
            parts.push({
                a0: Math.random() * Math.PI * 2,
                r0: maxR * (0.45 + Math.random() * 0.75),   // 凝聚起点半径
                r1: maxR * (0.35 + Math.random() * 0.90),   // 爆开终点半径
                swirl: (0.7 + Math.random() * 0.9) * (rnd < 0.5 ? -1 : 1),
                size: 0.8 + Math.random() * 1.7,
                delay: Math.random() * 0.18
            });
        }

        var total = BURST_GATHER_MS + BURST_BURST_MS + BURST_FADE_MS;
        var start = 0, switched = false;

        function frame(now) {
            if (!start) start = now;
            var t = now - start;
            ctx.clearRect(0, 0, w, h);

            if (t >= BURST_GATHER_MS && !switched) {
                switched = true;
                switchTheme();      // 爆开瞬间换色
            }
            var useRgb = switched ? newRgb : oldRgb;
            // 所有粒子同色：每帧只设一次 fillStyle，爆开换色那一帧自然变成新色
            ctx.fillStyle = 'rgb(' + useRgb[0] + ',' + useRgb[1] + ',' + useRgb[2] + ')';

            var gathering = t < BURST_GATHER_MS;
            var p = gathering
                ? clamp(t / BURST_GATHER_MS, 0, 1)
                : clamp((t - BURST_GATHER_MS) / BURST_BURST_MS, 0, 1);

            for (var i = 0; i < parts.length; i++) {
                var q = parts[i];
                var lp = clamp((p - q.delay) / (1 - q.delay), 0, 1); // 每颗粒子的延迟，避免整齐划一
                var le = 1 - Math.pow(1 - lp, 3);                    // easeOutCubic
                var r, alpha;
                if (gathering) {
                    r = q.r0 * (1 - le);
                    alpha = 0.08 + 0.70 * le;
                } else {
                    r = q.r1 * le;
                    alpha = 0.85 * (1 - lp);
                }
                var a = q.a0 + q.swirl * le * (gathering ? 2.6 : 1.1);
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, q.size, 0, 6.2832);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            if (t >= BURST_GATHER_MS + BURST_BURST_MS) {
                cv.style.opacity = String(1 - clamp((t - BURST_GATHER_MS - BURST_BURST_MS) / BURST_FADE_MS, 0, 1));
            }
            if (t < total) {
                requestAnimationFrame(frame);
            } else {
                if (cv.parentNode) cv.parentNode.removeChild(cv);
                done();
            }
        }

        requestAnimationFrame(frame);
    }

    /** app-routing.js 在模块顶层缓存了主题色；换色后置空，让它的粒子下次重新读取新色 */
    function resetParticleThemeCache() {
        try { if (window._themeRgbCache !== undefined) window._themeRgbCache = null; } catch (e) { /* 忽略 */ }
    }

    // ===================== Popover ColorPicker =====================

    var _picker = null;
    var _dragging = null;
    var _dragCleanup = null;
    var _busy = false; // 换色动画进行中，忽略重复触发

    function currentPickerRgb() { return hsvToRgb(_picker.h, _picker.s, _picker.v); }
    function currentPickerHex() { return rgbToHex(currentPickerRgb()); }

    function ensurePicker() {
        if (_picker) return _picker;

        var el = document.createElement('div');
        el.className = 'theme-picker-popover';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', '主题色选择器');
        el.innerHTML =
            '<div class="theme-picker-head">' +
                '<span class="theme-picker-swatch" data-role="swatch"></span>' +
                '<span class="theme-picker-name" data-role="name"></span>' +
                '<span class="theme-picker-hex" data-role="hex"></span>' +
                '<button type="button" class="theme-picker-close" data-role="close" aria-label="关闭">&times;</button>' +
            '</div>' +
            '<div class="theme-picker-ramp" data-role="ramp"></div>' +
            '<div class="theme-picker-plane" data-role="plane">' +
                '<span class="theme-picker-plane-dot" data-role="planeDot"></span>' +
            '</div>' +
            '<div class="theme-picker-hue" data-role="hue" hidden>' +
                '<span class="theme-picker-hue-dot" data-role="hueDot"></span>' +
            '</div>' +
            '<div class="theme-picker-rgb" data-role="rgbBox" hidden>' +
                '<label>R<input type="number" min="0" max="255" step="1" inputmode="numeric" data-role="r" aria-label="红色分量"></label>' +
                '<label>G<input type="number" min="0" max="255" step="1" inputmode="numeric" data-role="g" aria-label="绿色分量"></label>' +
                '<label>B<input type="number" min="0" max="255" step="1" inputmode="numeric" data-role="b" aria-label="蓝色分量"></label>' +
            '</div>' +
            '<div class="theme-picker-code" data-role="hexBox" hidden>' +
                '<label>HEX<input type="text" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="off" data-role="hexInput" placeholder="#3366FF" aria-label="十六进制色值"></label>' +
            '</div>' +
            '<div class="theme-picker-actions">' +
                '<button type="button" class="dash-btn dash-btn-gray" data-role="cancel">取消</button>' +
                '<button type="button" class="dash-btn dash-btn-green" data-role="apply">应用</button>' +
            '</div>';
        document.body.appendChild(el);

        var q = function (role) { return el.querySelector('[data-role="' + role + '"]'); };
        var p = {
            el: el,
            swatch: q('swatch'), name: q('name'), hexText: q('hex'),
            ramp: q('ramp'), plane: q('plane'), planeDot: q('planeDot'),
            hue: q('hue'), hueDot: q('hueDot'),
            rgbBox: q('rgbBox'), r: q('r'), g: q('g'), b: q('b'),
            hexBox: q('hexBox'), hexInput: q('hexInput'),
            custom: false, presetKey: '', presetName: '',
            h: 330, s: 0.8, v: 0.93
        };
        _picker = p;

        // --- 拖动取色：二维板（饱和度 × 明度）与色相条 ---
        var startDrag = function (kind) {
            return function (e) {
                e.preventDefault();
                _dragging = kind;
                updateFromPointer(kind, e);
                window.addEventListener('pointermove', onDragMove);
                window.addEventListener('pointerup', endDrag);
                window.addEventListener('pointercancel', endDrag);
            };
        };
        function onDragMove(e) { if (_dragging) updateFromPointer(_dragging, e); }
        function endDrag() {
            _dragging = null;
            window.removeEventListener('pointermove', onDragMove);
            window.removeEventListener('pointerup', endDrag);
            window.removeEventListener('pointercancel', endDrag);
        }
        _dragCleanup = endDrag; // 供 closePicker 中途收起时解除拖动监听
        p.plane.addEventListener('pointerdown', startDrag('plane'));
        p.hue.addEventListener('pointerdown', startDrag('hue'));

        // --- 梯度色块：点一下即取该档颜色 ---
        p.ramp.addEventListener('click', function (e) {
            var swatch = e.target.closest ? e.target.closest('[data-ramp-index]') : null;
            if (!swatch) return;
            var idx = parseInt(swatch.getAttribute('data-ramp-index'), 10);
            var rgb = buildPalette(_picker.presetHex).ramp[idx];
            if (!rgb) return;
            var hsv = rgbToHsv(rgb);
            _picker.h = hsv[0];
            _picker.s = hsv[1];
            _picker.v = hsv[2];
            paintPicker(true);
        });

        // --- RGB 输入：手动快速填写 ---
        function onRgbInput() {
            if (!_picker.custom) return;
            var rr = clamp(parseInt(_picker.r.value, 10) || 0, 0, 255);
            var gg = clamp(parseInt(_picker.g.value, 10) || 0, 0, 255);
            var bb = clamp(parseInt(_picker.b.value, 10) || 0, 0, 255);
            var hsv = rgbToHsv([rr, gg, bb]);
            _picker.h = hsv[0];
            _picker.s = hsv[1];
            _picker.v = hsv[2];
            // 回写输入框（会同步 HEX；正在编辑的那一格由 paintPicker 自行跳过）
            paintPicker(true);
        }
        [p.r, p.g, p.b].forEach(function (input) {
            input.addEventListener('input', onRgbInput);
            input.addEventListener('change', onRgbInput);
        });

        // --- HEX 输入：与 RGB 等价的手动填写方式（#RGB / #RRGGBB，可省略 #）---
        function onHexInput() {
            if (!_picker.custom) return;
            var rgb = hexToRgb(_picker.hexInput.value);
            // 输入中途（如刚敲到 "33"）解析不通过就保持现状，不打断输入
            if (!rgb) return;
            var hsv = rgbToHsv(rgb);
            _picker.h = hsv[0];
            _picker.s = hsv[1];
            _picker.v = hsv[2];
            // 回写输入框（会同步 RGB；HEX 自己正在编辑，由 paintPicker 跳过）
            paintPicker(true);
        }
        p.hexInput.addEventListener('input', onHexInput);
        p.hexInput.addEventListener('change', onHexInput);
        // 失焦时把随手输入的 "3366ff" 规范成 "#3366FF"
        p.hexInput.addEventListener('blur', function () {
            p.hexInput.value = currentPickerHex().toUpperCase();
        });

        q('close').addEventListener('click', closePicker);
        q('cancel').addEventListener('click', closePicker);
        q('apply').addEventListener('click', function () {
            var hex = currentPickerHex();
            var key = _picker.custom ? 'custom' : _picker.presetKey;
            closePicker();
            commitTheme(key, hex);
        });

        return p;
    }

    function updateFromPointer(kind, e) {
        var p = _picker;
        if (!p) return;
        if (kind === 'plane') {
            var pr = p.plane.getBoundingClientRect();
            if (!pr.width || !pr.height) return;
            p.s = clamp((e.clientX - pr.left) / pr.width, 0, 1);
            p.v = 1 - clamp((e.clientY - pr.top) / pr.height, 0, 1);
        } else {
            var hr = p.hue.getBoundingClientRect();
            if (!hr.width) return;
            p.h = clamp((e.clientX - hr.left) / hr.width, 0, 1) * 360;
        }
        paintPicker(true);
    }

    /**
     * 重绘选择器内部状态。
     * syncInputs=true 时回写 RGB / HEX 输入框，但跳过当前正在编辑的那一格，
     * 这样 RGB 与 HEX 能互相同步、又不会打断正在敲的输入。
     */
    function paintPicker(syncInputs) {
        var p = _picker;
        if (!p) return;
        var hex = currentPickerHex();
        var rgb = currentPickerRgb().map(function (v) { return Math.round(v); });
        var pure = rgbToHex(hsvToRgb(p.h, 1, 1)); // 当前色相的最饱和色，用作二维板右端

        p.plane.style.background =
            'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ' + pure + ')';
        p.planeDot.style.left = (p.s * 100) + '%';
        p.planeDot.style.top = ((1 - p.v) * 100) + '%';
        p.planeDot.style.background = hex;
        p.hueDot.style.left = (p.h / 360 * 100) + '%';
        p.hueDot.style.background = pure;
        p.swatch.style.background = hex;
        p.hexText.textContent = hex.toUpperCase();

        // 始终同步 RGB / HEX 输入框：即使当前是预设色盘（这两个输入框隐藏），也避免残留上一次的旧值
        if (syncInputs) {
            if (document.activeElement !== p.r) p.r.value = String(rgb[0]);
            if (document.activeElement !== p.g) p.g.value = String(rgb[1]);
            if (document.activeElement !== p.b) p.b.value = String(rgb[2]);
            if (document.activeElement !== p.hexInput) p.hexInput.value = hex.toUpperCase();
        }
    }

    function buildRamp(presetHex) {
        var p = _picker;
        var ramp = buildPalette(presetHex).ramp;
        p.ramp.textContent = '';
        var frag = document.createDocumentFragment();
        ramp.forEach(function (rgb, i) {
            var sw = document.createElement('button');
            sw.type = 'button';
            sw.setAttribute('data-ramp-index', String(i));
            sw.style.background = rgbToHex(rgb);
            sw.title = rgbToHex(rgb).toUpperCase();
            sw.setAttribute('aria-label', '色阶 ' + RAMP_STOPS[i]);
            frag.appendChild(sw);
        });
        p.ramp.appendChild(frag);
    }

    function positionPicker(anchorEl) {
        var p = _picker;
        var el = p.el;
        var rect = anchorEl.getBoundingClientRect();
        var w = el.offsetWidth || 248;
        var h = el.offsetHeight || 260;

        var left = clamp(rect.left + rect.width / 2 - w / 2, 8, Math.max(8, window.innerWidth - w - 8));
        var top = rect.bottom + 8;
        if (top + h > window.innerHeight - 8) {
            var above = rect.top - h - 8;
            top = above >= 8 ? above : clamp(window.innerHeight - h - 8, 8, Math.max(8, window.innerHeight - h - 8));
        }
        el.style.left = left + 'px';
        el.style.top = top + 'px';
    }

    function openPicker(anchorEl, preset) {
        var p = ensurePicker();
        var baseHex;
        if (preset.key === 'custom') {
            var saved = loadState();
            baseHex = (saved && saved.key === 'custom' && saved.hex) ? saved.hex : rgbToHex(readPrimaryRgb());
        } else {
            baseHex = preset.hex;
        }

        p.custom = preset.key === 'custom';
        p.presetKey = preset.key;
        p.presetName = preset.name;
        p.presetHex = baseHex;

        var hsv = rgbToHsv(hexToRgb(baseHex));
        p.h = hsv[0];
        p.s = hsv[1];
        p.v = hsv[2];

        p.name.textContent = p.custom ? '自定义颜色' : preset.name;
        // 预设色盘给出该色系的次级（同色相、不同明度）梯度色块供快速挑选；
        // 自定义是全色彩取色器，用色相条 + RGB / HEX 输入代替梯度块
        p.ramp.hidden = p.custom;
        p.hue.hidden = !p.custom;
        p.rgbBox.hidden = !p.custom;
        p.hexBox.hidden = !p.custom;
        if (!p.custom) buildRamp(baseHex);
        paintPicker(true);

        // 先显示再测量，保证气泡按真实高度决定朝上还是朝下
        p.el.style.visibility = 'hidden';
        p.el.classList.add('is-open');
        positionPicker(anchorEl);
        p.el.style.visibility = '';
    }

    function closePicker() {
        if (!_picker) return;
        if (_dragging && _dragCleanup) _dragCleanup();
        _dragging = null;
        _picker.el.classList.remove('is-open');
    }

    // ===================== 应用主题 =====================

    /** 提交主题：先存档 + 播放原地粒子换色，爆开瞬间替换 CSS 变量 */
    function commitTheme(key, hex) {
        if (_busy) return;
        var pal = buildPalette(hex);
        var oldRgb = readPrimaryRgb();
        _busy = true;
        saveState({ key: key, hex: pal.hex });

        playThemeBurst(oldRgb, pal.rgb, function () {
            applyPalette(pal);
            resetParticleThemeCache();
            syncSelection();
        }, function () {
            _busy = false;
        });
    }

    // ===================== 全局事件 =====================

    function bindGlobalEvents() {
        var grid = document.getElementById('themeDiscGrid');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var btn = e.target.closest ? e.target.closest('.theme-disc') : null;
                if (!btn) return;
                var key = btn.getAttribute('data-theme-key');
                var preset = PRESETS.filter(function (x) { return x.key === key; })[0];
                if (!preset) return;
                openPicker(btn, preset);
            });
        }

        // 点击气泡外部关闭（色盘按钮自身除外，否则会被立即关掉）
        document.addEventListener('pointerdown', function (e) {
            if (!_picker || !_picker.el.classList.contains('is-open')) return;
            if (_picker.el.contains(e.target)) return;
            if (e.target.closest && e.target.closest('.theme-disc')) return;
            closePicker();
        }, true);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && _picker && _picker.el.classList.contains('is-open')) {
                closePicker();
            }
        });

        // 滚动 / 改变窗口尺寸后锚点会错位，直接收起更干净
        window.addEventListener('scroll', function () {
            if (_picker && _picker.el.classList.contains('is-open')) closePicker();
        }, true);
        window.addEventListener('resize', function () {
            if (_picker && _picker.el.classList.contains('is-open')) closePicker();
        });
    }

    // ===================== 初始化 =====================

    function init() {
        // 已保存过主题才写覆盖；否则保持 css 默认（正常霓虹粉 / 私密铜色）
        var saved = loadState();
        if (saved) {
            applyPalette(buildPalette(saved.hex));
        } else {
            clearPalette();
        }
        renderCard();
        bindGlobalEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
