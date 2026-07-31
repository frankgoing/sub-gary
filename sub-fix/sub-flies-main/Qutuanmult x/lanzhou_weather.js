// ==UserScript==
// @name         兰州天气预报
// @version      3.0
// @description  兰州市天气预报（手动检测，mxnzp.com 数据源）
// @author       Hermes Agent
// @icon         https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/01d.png
// ==/UserScript==

const APP_ID = "crsxppoxhoofitcg";
const APP_SECRET = "yYjHmojNVBVjPTvATB5aUdolKGKqgX5p";

// 天气文字 -> 图标（长词优先）
const WEATHER_ICON = [
  ["雷阵雨", "⛈"], ["雷雨", "⛈"], ["暴雨", "🌧"], ["大雨", "🌧"],
  ["中雨", "🌧"], ["小雨", "🌦"], ["雨夹雪", "🌧"], ["大雪", "❄️"],
  ["中雪", "❄️"], ["小雪", "🌨"], ["沙尘", "🌪"], ["雾", "🌫"],
  ["霾", "🌫"], ["晴", "☀️"], ["多云", "⛅"], ["阴", "☁️"]
];

function weatherIcon(text) {
  for (const [k, icon] of WEATHER_ICON) {
    if (text.includes(k)) return icon;
  }
  return "❓";
}

function getWeekday(dateStr) {
  const wd = ["周六", "周日", "周一", "周二", "周三", "周四", "周五"];
  const y = parseInt(dateStr.substring(0, 4));
  const m = parseInt(dateStr.substring(5, 7));
  const d = parseInt(dateStr.substring(8, 10));
  const y0 = m < 3 ? y - 1 : y;
  const m0 = m < 3 ? m + 12 : m;
  const c = Math.floor(y0 / 100);
  const yr = y0 % 100;
  let w = (d + Math.floor(13 * (m0 + 1) / 5) + yr + Math.floor(yr / 4) + Math.floor(c / 4) - 2 * c) % 7;
  return wd[((w + 7) % 7)];
}

function weekdayName(f) {
  // dayOfWeek: 1=周一 ... 7=周日；异常时用日期推算
  const n = parseInt(f.dayOfWeek);
  if (n >= 1 && n <= 7) return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][n - 1];
  return getWeekday(f.date);
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const URL =
  "https://www.mxnzp.com/api/weather/forecast/" +
  encodeURIComponent("兰州市") +
  "?app_id=" + APP_ID +
  "&app_secret=" + APP_SECRET;

$task.fetch({ url: URL, method: "GET" }).then(
  (response) => {
    try {
      const json = JSON.parse(response.body);
      if (json.code !== 1) {
        $done({ title: "❌ 兰州天气", content: `接口错误: ${json.msg || "未知错误"}` });
        return;
      }
      const data = json.data;
      const rows = [];
      for (const f of data.forecasts) {
        const tMax = parseInt(f.dayTemp);
        const tMin = parseInt(f.nightTemp);
        const text = f.dayWeather;
        let wind = f.dayWindDirection + f.dayWindPower;
        if (!wind.includes("级")) wind += "级";
        rows.push({
          dateShort: f.date.slice(5),
          weekday: weekdayName(f),
          text,
          icon: weatherIcon(text),
          tMax,
          tMin,
          wind
        });
      }

      const today = rows[0];
      const headerLine =
        `<div style="font-size:18px;font-weight:700;color:#0F172A;margin-bottom:3px">${today.icon} ${today.tMin}~${today.tMax}° · ${today.text} · ${today.wind}</div>` +
        `<div style="font-size:11px;color:#94A3B8;margin-bottom:8px">更新 ${nowStamp()}</div>`;

      const dayLines = rows.map((r, i) => {
        const bg = i === 0 ? "background:#F0F9FF;" : "";
        return `<div style="${bg}padding:5px 4px;font-size:14px;color:#0F172A">` +
          `${r.dateShort} ${r.weekday}　${r.icon}${r.text}　${r.tMin}~${r.tMax}°　` +
          `<span style="color:#94A3B8;font-size:12px">${r.wind}</span>` +
          `</div>`;
      }).join("");

      const html =
        `<div style="font-family:-apple-system,BlinkMacSystemFont">` +
        headerLine +
        dayLines +
        `<div style="font-size:10px;color:#CBD5E1;margin-top:6px">mxnzp.com · ${data.address} · ${data.reportTime}</div>` +
        `</div>`;

      $done({ title: `🏙 兰州 · ${rows.length}天预报`, htmlMessage: html });
    } catch (e) {
      $done({ title: "❌ 兰州天气", content: `解析失败: ${e.message || String(e)}` });
    }
  },
  (reason) => {
    $done({ title: "❌ 兰州天气", content: `获取失败: ${reason && reason.error ? String(reason.error) : String(reason)}` });
  }
);
