// ==UserScript==
// @name         兰州天气预报
// @version      1.1
// @description  兰州市未来7天天气预报（手动检测）
// @author       Hermes Agent
// @icon         https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/01d.png
// ==/UserScript==

// WMO 天气代码 → 中文与图标
const WMO = {
  0:  "☀️ 晴",
  1:  "🌤 大部晴",
  2:  "⛅ 多云",
  3:  "☁️ 阴",
  45: "🌫 雾",
  48: "🌫 冻雾",
  51: "🌦 小毛毛雨",
  53: "🌦 毛毛雨",
  55: "🌧 大毛毛雨",
  56: "🌧 冻毛毛雨",
  57: "🌧 冻毛毛雨",
  61: "🌦 小雨",
  63: "🌧 中雨",
  65: "🌧 大雨",
  66: "🌧 冻雨",
  67: "🌧 冻雨",
  71: "🌨 小雪",
  73: "❄️ 中雪",
  75: "❄️ 大雪",
  77: "❄️ 雪粒",
  80: "🌦 阵雨(小)",
  81: "🌧 阵雨(中)",
  82: "🌧 阵雨(大)",
  85: "🌨 阵雪(小)",
  86: "❄️ 阵雪(大)",
  95: "⛈ 雷暴",
  96: "⛈ 雷暴+冰雹",
  99: "⛈ 雷暴+冰雹",
};

// 用日期字符串算星期，避免时区问题
function getWeekday(dateStr) {
  const wd = ["周六","周日","周一","周二","周三","周四","周五"];
  const y = parseInt(dateStr.substring(0,4));
  const m = parseInt(dateStr.substring(5,7));
  const d = parseInt(dateStr.substring(8,10));
  // 蔡勒公式（返回 0=周六,1=周日,...,6=周五）
  const y0 = m < 3 ? y - 1 : y;
  const m0 = m < 3 ? m + 12 : m;
  const c = Math.floor(y0 / 100);
  const yr = y0 % 100;
  let w = (d + Math.floor(13*(m0+1)/5) + yr + Math.floor(yr/4) + Math.floor(c/4) - 2*c) % 7;
  w = ((w + 7) % 7);
  return wd[w];
}

function weatherText(code) {
  return WMO[code] || `❓ 未知(${code})`;
}

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=36.06&longitude=103.79" +
  "&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,wind_speed_10m_max" +
  "&timezone=Asia/Shanghai" +
  "&forecast_days=7";

$httpClient.get(URL, function (error, response, data) {
  if (error) {
    $notification.post("❌ 兰州天气", "获取失败", error);
    $done();
    return;
  }

  try {
    const json = JSON.parse(data);
    const daily = json.daily;
    let lines = [];

    for (let i = 0; i < 7; i++) {
      const date = daily.time[i];
      const wd = getWeekday(date);
      const tMax = Math.round(daily.temperature_2m_max[i]);
      const tMin = Math.round(daily.temperature_2m_min[i]);
      const code = daily.weathercode[i];
      const precip = daily.precipitation_probability_max[i];
      const wind = daily.wind_speed_10m_max[i];
      const wthr = weatherText(code);
      lines.push(`${date.slice(5)} ${wd}  ${tMin}~${tMax}°C  ${wthr}  🌧${precip}%`);
    }

    // 弹窗最多显示三行（完整7天在子标题和正文）
    const subtitle = `今日: ${lines[0]} | 明日: ${lines[1].split("  ").slice(0,3).join(" ")}`;
    const body = lines.join("\n");

    $notification.post("🏙 兰州 · 7天预报", subtitle, body);
  } catch (e) {
    $notification.post("❌ 兰州天气", "解析失败", e.message || e);
  }

  $done();
});
