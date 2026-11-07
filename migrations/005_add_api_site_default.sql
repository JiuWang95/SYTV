-- 云端数据源默认选中标记
--
-- 背景：前端原先固定选中 Worker 下发顺序的前 6 个普通源，想调整只能改 sort_order。
-- 改造后由 /admin 面板给任意源标记 is_default，GET /api-sites 会在 defaults 数组里下发，
-- 前端优先按它初始化（未配置时仍回退「前 6 个」）。
--
-- 注意：未执行本迁移时 Worker 会自动降级（不下发 defaults、面板的默认按钮报错），
-- 不会影响现有源列表的读取与下发。
ALTER TABLE api_sites ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
