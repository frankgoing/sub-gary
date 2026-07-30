// ==UserScript==
// @name         兰州天气预报
// @version      2.2
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
  return `${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function precipColor(p) {
  if (p >= 60) return "#2563EB";
  if (p >= 25) return "#60A5FA";
  return "#94A3B8";
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
        rows.push({ dateShort: date.slice(5), weekday: wd, text: wi.text, icon: wi.icon, tMax, tMin, precip, precipColor: precipColor(precip) });
      }

      const today = rows[0];
      const headerLine =
        `<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:2px">${today.icon} ${today.tMin}~${today.tMax}° · ${today.text} · 💧${today.precip}%</div>` +
        `<div style="font-size:10px;color:#94A3B8;margin-bottom:6px">更新 ${nowStamp()}</div>`;

      const dayLines = rows.map((r, i) => {
        const bg = i === 0 ? "background:#F0F9FF;" : "";
        return `<div style="${bg}padding:3px 4px;font-size:12.5px;color:#0F172A">` +
          `${r.dateShort} ${r.weekday}　${r.icon}${r.text}　${r.tMin}~${r.tMax}°　` +
          `<span style="color:${r.precipColor};font-weight:600">💧${r.precip}%</span>` +
          `</div>`;
      }).join("");

      const html =
        `<div style="font-family:-apple-system,BlinkMacSystemFont">` +
        headerLine +
        dayLines +
        `<div style="font-size:9px;color:#CBD5E1;margin-top:5px">Open-Meteo · 兰州</div>` +
        `</div>`;

      $done({ title: "🏙 兰州 · 7天预报", htmlMessage: html });
    } catch (e) {
      $done({ title: "❌ 兰州天气", content: `解析失败: ${e.message || String(e)}` });
    }
  },
  (reason) => {
    $done({ title: "❌ 兰州天气", content: `获取失败: ${reason && reason.error ? String(reason.error) : String(reason)}` });
  }
);
