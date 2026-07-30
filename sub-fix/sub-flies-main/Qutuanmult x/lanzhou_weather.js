// ==UserScript==
// @name         兰州天气预报
// @version      2.0
// @description  兰州市未来7天天气预报（手动检测）
// @author       Hermes Agent
// @icon         https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/01d.png
// ==/UserScript==

const WMO = {
  0:  { text: "晴",   icon: "☀️" },
  1:  { text: "晴",   icon: "🌤" },
  2:  { text: "多云", icon: "⛅" },
  3:  { text: "阴",   icon: "☁️" },
  45: { text: "雾",   icon: "🌫" },
  48: { text: "冻雾", icon: "🌫" },
  51: { text: "毛雨", icon: "🌦" },
  53: { text: "毛雨", icon: "🌦" },
  55: { text: "毛雨", icon: "🌧" },
  56: { text: "冻雨", icon: "🌧" },
  57: { text: "冻雨", icon: "🌧" },
  61: { text: "小雨", icon: "🌦" },
  63: { text: "中雨", icon: "🌧" },
  65: { text: "大雨", icon: "🌧" },
  66: { text: "冻雨", icon: "🌧" },
  67: { text: "冻雨", icon: "🌧" },
  71: { text: "小雪", icon: "🌨" },
  73: { text: "中雪", icon: "❄️" },
  75: { text: "大雪", icon: "❄️" },
  77: { text: "雪粒", icon: "❄️" },
  80: { text: "阵雨", icon: "🌦" },
  81: { text: "阵雨", icon: "🌧" },
  82: { text: "阵雨", icon: "🌧" },
  85: { text: "阵雪", icon: "🌨" },
  86: { text: "阵雪", icon: "❄️" },
  95: { text: "雷暴", icon: "⛈" },
  96: { text: "雷雹", icon: "⛈" },
  99: { text: "雷雹", icon: "⛈" },
};

function getWeekday(dateStr) {
  const wd = ["周六","周日","周一","周二","周三","周四","周五"];
  const y = parseInt(dateStr.substring(0,4));
  const m = parseInt(dateStr.substring(5,7));
  const d = parseInt(dateStr.substring(8,10));
  const y0 = m < 3 ? y - 1 : y;
  const m0 = m < 3 ? m + 12 : m;
  const c = Math.floor(y0 / 100);
  const yr = y0 % 100;
  let w = (d + Math.floor(13*(m0+1)/5) + yr + Math.floor(yr/4) + Math.floor(c/4) - 2*c) % 7;
  w = ((w + 7) % 7);
  return wd[w];
}

function weatherInfo(code) {
  return WMO[code] || { text: `未知${code}`, icon: "❓" };
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function precipColor(p) {
  if (p >= 60) return "#2563EB"; // 高概率，深蓝
  if (p >= 25) return "#60A5FA"; // 中等，浅蓝
  return "#94A3B8"; // 低概率，灰蓝
}

function renderRow(row, isToday) {
  const bg = isToday ? "background:#F0F9FF;border-radius:10px;" : "";
  const border = isToday ? "" : "border-bottom:1px solid #F1F5F9;";
  return `
    <div style="display:flex;align-items:center;padding:8px 6px;${bg}${border}">
      <div style="width:34px;font-size:20px;text-align:center">${row.icon}</div>
      <div style="width:70px">
        <div style="font-size:13px;font-weight:700;color:#0F172A">${row.dateShort}</div>
        <div style="font-size:11px;color:#94A3B8">${row.weekday}${isToday ? " · 今天" : ""}</div>
      </div>
      <div style="flex:1;font-size:13px;color:#334155">${row.text}</div>
      <div style="width:70px;text-align:right;font-size:13px;font-weight:600;color:#0F172A">
        ${row.tMin}~${row.tMax}°
      </div>
      <div style="width:44px;text-align:right;font-size:12px;font-weight:600;color:${row.precipColor}">
        💧${row.precip}%
      </div>
    </div>`;
}

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=36.06&longitude=103.79" +
  "&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max" +
  "&timezone=Asia/Shanghai" +
  "&forecast_days=7";

$task.fetch({ url: URL, method: "GET" }).then(
  (response) => {
    try {
      const json = JSON.parse(response.body);
      const daily = json.daily;
      const rows = [];
      for (let i = 0; i < 7; i++) {
        const date = daily.time[i];
        const wd = getWeekday(date);
        const tMax = Math.round(daily.temperature_2m_max[i]);
        const tMin = Math.round(daily.temperature_2m_min[i]);
        const wi = weatherInfo(daily.weathercode[i]);
        const precip = daily.precipitation_probability_max[i];
        rows.push({
          dateShort: date.slice(5),
          weekday: wd,
          text: wi.text,
          icon: wi.icon,
          tMax, tMin, precip,
          precipColor: precipColor(precip),
        });
      }

      const today = rows[0];
      const headerHtml = `
        <div style="padding:14px 4px 10px 4px">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:34px">${today.icon}</span>
            <span style="font-size:28px;font-weight:700;color:#0F172A">${today.tMin}~${today.tMax}°</span>
            <span style="font-size:14px;color:#64748B">${today.text} · 💧${today.precip}%</span>
          </div>
          <div style="font-size:12px;color:#94A3B8;margin-top:4px">更新时间 · ${nowStamp()}</div>
        </div>`;

      const listHtml = rows.map((r, i) => renderRow(r, i === 0)).join("");

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont;overflow-wrap:anywhere">
          ${headerHtml}
          <div style="height:1px;background:#E2E8F0;margin:4px 0 6px 0"></div>
          ${listHtml}
          <div style="font-size:10px;color:#CBD5E1;margin-top:8px;text-align:center">数据来自 Open-Meteo · 兰州（36.06, 103.79）</div>
        </div>`;

      $done({ title: "🏙 兰州 · 7天预报", htmlMessage: html });
    } catch (e) {
      $done({ title: "❌ 兰州天气", content: `解析失败: ${e.message || String(e)}` });
    }
  },
  (reason) => {
    $done({ title: "❌ 兰州天气", content: `获取失败: ${reason && reason.error ? String(reason.error) : String(reason)}` });
  }
);
