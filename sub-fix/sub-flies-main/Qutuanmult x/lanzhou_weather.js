// ==UserScript==
// @name         兰州天气预报
// @version      1.3
// @description  兰州市未来7天天气预报（手动检测）
// @author       Hermes Agent
// @icon         https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/01d.png
// ==/UserScript==

const WMO = {
  0:  "☀️晴", 1:  "🌤晴", 2:  "⛅多云", 3:  "☁️阴",
  45: "🌫雾", 48: "🌫冻雾",
  51: "🌦毛雨", 53: "🌦毛雨", 55: "🌧毛雨", 56: "🌧冻雨", 57: "🌧冻雨",
  61: "🌦小雨", 63: "🌧中雨", 65: "🌧大雨", 66: "🌧冻雨", 67: "🌧冻雨",
  71: "🌨小雪", 73: "❄️中雪", 75: "❄️大雪", 77: "❄️雪粒",
  80: "🌦阵雨", 81: "🌧阵雨", 82: "🌧阵雨",
  85: "🌨阵雪", 86: "❄️阵雪",
  95: "⛈雷暴", 96: "⛈雷雹", 99: "⛈雷雹",
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

function weatherText(code) {
  return WMO[code] || `❓未知${code}`;
}

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=36.06&longitude=103.79" +
  "&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max" +
  "&timezone=Asia/Shanghai" +
  "&forecast_days=7";

$httpClient.get(URL, function (error, response, data) {
  if (error) {
    $notification.post("❌ 兰州天气", "获取失败", String(error));
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
      const wthr = weatherText(daily.weathercode[i]);
      const precip = daily.precipitation_probability_max[i];
      lines.push(`${date.slice(5)}${wd} ${wthr} ${tMin}~${tMax}℃ 💧${precip}%`);
    }
    const subtitle = lines[0];
    const body = lines.join("\n");
    $notification.post("🏙 兰州 · 7天预报", subtitle, body);
  } catch (e) {
    $notification.post("❌ 兰州天气", "解析失败", e.message || String(e));
  }
  $done();
});
