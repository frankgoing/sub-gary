// ==UserScript==
// @name         兰州天气预报
// @version      4.0
// @description  兰州市7天天气预报（手动检测，中国天气网数据源）
// @author       Hermes Agent
// @icon         https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/01d.png
// ==/UserScript==

const CITY_ID = "101160101"; // 兰州
const URL = "https://www.weather.com.cn/weather/" + CITY_ID + ".shtml";

// 天气文字 -> 图标（长词优先，取"转"后主天气）
const WEATHER_ICON = [
  ["雷阵雨", "⛈"], ["雷雨", "⛈"], ["暴雨", "🌧"], ["大雨", "🌧"],
  ["中雨", "🌧"], ["小雨", "🌦"], ["雨夹雪", "🌧"], ["大雪", "❄️"],
  ["中雪", "❄️"], ["小雪", "🌨"], ["沙尘", "🌪"], ["雾", "🌫"],
  ["霾", "🌫"], ["晴", "☀️"], ["多云", "⛅"], ["阴", "☁️"]
];

function weatherIcon(text) {
  const iconOf = (w) => {
    for (const [k, icon] of WEATHER_ICON) {
      if (w.includes(k)) return icon;
    }
    return "❓";
  };
  const parts = String(text).split("转").filter(Boolean);
  if (parts.length > 1) return iconOf(parts[0]) + "→" + iconOf(parts[parts.length - 1]); // 阴转晴 -> ☁️→☀️
  return iconOf(parts[0]);
}

function weekdayCN(i) {
  if (i === 0) return "今天";
  const d = new Date();
  d.setDate(d.getDate() + i);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
}

function dateStr(i) {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

$task.fetch({
  url: URL,
  method: "GET",
  headers: {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    "Referer": "https://www.weather.com.cn/"
  }
}).then(
  (response) => {
    try {
      const html = response.body;
      const lis = html.match(/<li class="sky[\s\S]*?<\/li>/g) || [];
      if (lis.length < 7) throw new Error(`只解析到 ${lis.length} 天`);

      // 今天只有低温，高温在 hidden_title 里："07月31日20时 周五  阴转小雨  19/25°C"
      let todayMax = null;
      const ht = html.match(/id="hidden_title" value="([^"]+)"/);
      if (ht) {
        const m = ht[1].match(/(\d+)\/(\d+)°C/);
        if (m) todayMax = parseInt(m[2]);
      }

      const rows = lis.slice(0, 7).map((li, i) => {
        const h1 = (li.match(/<h1>(.*?)<\/h1>/) || [, ""])[1].trim(); // 31日（今天）
        const wd = weekdayCN(i); // 今天/周六/周日/周一...
        const text = (li.match(/<p title="(.*?)" class="wea">/) || [, ""])[1];
        const temSpan = (li.match(/<span>(\d+)℃<\/span>/) || [])[1];
        const temI = (li.match(/<i>(\d+)℃<\/i>/) || [])[1];
        const win = ((li.match(/<p class="win">[\s\S]*?<i>(.*?)<\/i>/) || [, ""])[1] || "").replace(/<[^>]*>/g, "").trim();
        const tMax = i === 0 && temSpan === undefined ? todayMax : parseInt(temSpan);
        const tMin = parseInt(temI);
        return { dateShort: dateStr(i), weekday: wd, text, icon: weatherIcon(text), tMax, tMin, wind: win };
      });

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

      const htmlOut =
        `<div style="font-family:-apple-system,BlinkMacSystemFont">` +
        headerLine +
        dayLines +
        `<div style="font-size:10px;color:#CBD5E1;margin-top:6px">中国天气网 · 兰州</div>` +
        `</div>`;

      $done({ title: "🏙 兰州 · 7天预报", htmlMessage: htmlOut });
    } catch (e) {
      $done({ title: "❌ 兰州天气", content: `解析失败: ${e.message || String(e)}` });
    }
  },
  (reason) => {
    $done({ title: "❌ 兰州天气", content: `获取失败: ${reason && reason.error ? String(reason.error) : String(reason)}` });
  }
);
