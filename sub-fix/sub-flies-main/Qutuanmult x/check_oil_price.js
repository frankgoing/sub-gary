// =====================================================
//  Quantumult X — ⛽ 三省油价查询脚本
//  甘肃 · 宁夏 · 陕西
//  数据来源: 66mz8 公开油价 API
//  使用方式: 配置 [task] 定时任务即可自动推送
// =====================================================

const VERSION = '1.2.0';

// ====================== 配置区 =======================

/** 要查询的省份（可增删改，支持全国所有省份） */
const PROVINCES = ['甘肃', '宁夏', '陕西'];

/** 主用油价 API */
const OIL_API = 'https://api.66mz8.com/api/price.php';

/** 备用油价 API（主用失败时自动切换） */
const FALLBACK_API = 'https://apis.juhe.cn/oil/cn?key=';

// =====================================================

const ALL_PROVINCES = [
  '北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江',
  '上海','江苏','浙江','安徽','福建','江西','山东','河南',
  '湖北','湖南','广东','广西','海南','重庆','四川','贵州',
  '云南','西藏','陕西','甘肃','青海','宁夏','新疆'
];

// =================== 工具函数 ========================

/**
 * 尝试不同 key 匹配省份数据
 */
function matchProvince(data, province) {
  const candidates = [
    province,
    province + '省',
    province + '市',
  ];
  for (const key of candidates) {
    if (data[key]) return key;
  }
  // 如果原始 key 带了 省/市 后缀，去掉再试
  const stripped = province.replace('省', '').replace('市', '');
  if (stripped !== province && data[stripped]) return stripped;
  return null;
}

/**
 * 统一提取油价字段
 */
function extractFields(raw) {
  const get = (aliases, defaultVal = '--') => {
    for (const a of aliases) {
      const v = raw[a];
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return defaultVal;
  };

  return {
    '92#':  get(['92', '92h', 'E92', '92#', '92号', '92汽油']),
    '95#':  get(['95', '95h', 'E95', '95#', '95号', '95汽油']),
    '98#':  get(['98', '98h', 'E98', '98#', '98号', '98汽油']),
    '0#':   get(['0', 'diesel', '0#', '0号', '柴油']),
    time:   get(['time', 'update_time', 'date', 'updatetime', 'gx_time']),
  };
}

/**
 * 格式化价格为两位小数
 */
function fmtPrice(val) {
  if (!val || val === '--') return '  --  ';
  const num = parseFloat(val);
  if (!isNaN(num)) return num.toFixed(2).padStart(6);
  return val.padStart(6);
}

/**
 * 省份 emoji
 */
function provEmoji(name) {
  const map = {
    '甘肃': '🏜️', '宁夏': '🌾', '陕西': '🏛️',
    '北京': '🏛️', '上海': '🌃', '广东': '🌊',
    '山西': '⛰️', '山东': '⛰️', '四川': '🐼',
    '湖南': '🏞️', '湖北': '🏞️', '新疆': '🏜️',
    '西藏': '🗻', '内蒙古': '🌿',
  };
  return map[name] || '📍';
}

// =================== 主逻辑 ==========================

(async () => {
  // --- 1. 获取数据 ---
  let data;
  try {
    const resp = await new Promise((resolve, reject) => {
      $task.fetch({ url: OIL_API, method: 'GET', timeout: 10000 })
        .then(r => resolve(r))
        .catch(reject);
    });
    data = JSON.parse(resp.body);
  } catch (e) {
    // 主 API 失败 → 尝试备用 API
    try {
      const resp = await new Promise((resolve, reject) => {
        $task.fetch({ url: FALLBACK_API, method: 'GET', timeout: 10000 })
          .then(r => resolve(r))
          .catch(reject);
      });
      data = JSON.parse(resp.body);
    } catch (e2) {
      const msg = `⚠️ 油价查询失败\n${e.message || e2.message}`;
      $notification?.post('⛽ 油价查询', '', msg);
      console.log(msg);
      $done?.();
      return;
    }
  }

  // --- 2. 提取各省数据 ---
  const results = [];
  let globalTime = '';

  for (const prov of PROVINCES) {
    const key = matchProvince(data, prov);
    if (key) {
      const fields = extractFields(data[key]);
      results.push({ province: prov, ...fields });
      if (!globalTime && fields.time !== '--') globalTime = fields.time;
    } else {
      results.push({
        province: prov, '92#': '--', '95#': '--', '98#': '--', '0#': '--', time: '--'
      });
    }
  }

  // --- 3. 构建输出 ---
  const lines = [];

  // 标题
  lines.push('┏━━━━━ ⛽ 三省油价 ━━━━━┓');
  lines.push('');

  for (const r of results) {
    const emoji = provEmoji(r.province);
    lines.push(` ${emoji}  ${r.province}`);
    lines.push(`    92#  ${fmtPrice(r['92#'])}   95#  ${fmtPrice(r['95#'])}`);

    if (r['98#'] !== '--') {
      lines.push(`    98#  ${fmtPrice(r['98#'])}   0#   ${fmtPrice(r['0#'])}`);
    } else {
      lines.push(`    0#   ${fmtPrice(r['0#'])}`);
    }
    lines.push('');
  }

  if (globalTime) {
    lines.push(` 📅 ${globalTime}`);
  }
  lines.push('┗━━━━━━━━━━━━━━━━━━━┛');

  const output = lines.join('\n');

  // --- 4. 推送通知 + 日志 ---
  $notification?.post(
    '⛽ 三省油价',
    `${PROVINCES.join(' · ')}`,
    output
  );
  console.log(output);

  $done?.();
})();
