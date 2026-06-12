// 1. Clock & Date (Dubai Timezone)
function updateTime() {
    const now = new Date();
    // Enforce Dubai Time
    const optionsTime = { timeZone: 'Asia/Dubai', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const optionsDate = { timeZone: 'Asia/Dubai', weekday: 'short', month: 'short', day: 'numeric' };
    
    document.getElementById('clock-time').innerText = now.toLocaleTimeString('en-US', optionsTime);
    document.getElementById('clock-date').innerText = now.toLocaleDateString('en-US', optionsDate).toUpperCase();
}
setInterval(updateTime, 1000);
updateTime();

// 2. Dubai Layer - Environmental Data via Open-Meteo (Free, No Auth required)
async function fetchDubaiEnvironment() {
    try {
        // Lat/Lon for Dubai
        const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=25.2048&longitude=55.2708&current=temperature_2m,relative_humidity_2m&daily=uv_index_max&timezone=auto';
        const aqiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.2048&longitude=55.2708&current=european_aqi,pm2_5&timezone=auto';

        const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
        const weatherData = await weatherRes.json();
        const aqiData = await aqiRes.json();

        // Update DOM
        document.getElementById('dxb-temp').innerText = `${weatherData.current.temperature_2m}°C`;
        document.getElementById('dxb-hum').innerText = `${weatherData.current.relative_humidity_2m}%`;
        document.getElementById('dxb-uv').innerText = weatherData.daily.uv_index_max[0];
        
        const aqi = aqiData.current.european_aqi;
        const aqiEl = document.getElementById('dxb-aqi');
        aqiEl.innerText = aqi;
        // Color code AQI
        aqiEl.style.color = aqi < 50 ? '#00E676' : aqi < 100 ? '#FFA726' : '#FF5252';
        
        document.getElementById('dxb-pm25').innerText = aqiData.current.pm2_5;
    } catch (error) {
        console.error("Failed to fetch Dubai environment data:", error);
    }
}
// Fetch immediately, then every 30 minutes
fetchDubaiEnvironment();
setInterval(fetchDubaiEnvironment, 30 * 60 * 1000);

// 3. Intelligent News Filtering 
function fetchFilteredNews() {
    const newsList = document.getElementById('news-list');
    
    const mockNews = [
        { time: '10 MIN AGO', title: 'Fed Chair Powell signals rates to remain steady through Q3.', tag: 'FED' },
        { time: '1 HR AGO', title: 'Nvidia (NVDA) announces new Blackwell architecture chips ahead of schedule.', tag: 'AI/SEMI' },
        { time: '2 HRS AGO', title: 'OPEC+ holds firm on production cuts; Brent stabilizes above $80.', tag: 'OPEC' },
        { time: '4 HRS AGO', title: 'TSMC reports record revenue on AI server demand.', tag: 'SEMI' },
    ];

    newsList.innerHTML = '';
    mockNews.forEach(news => {
        const li = document.createElement('li');
        li.className = 'news-item';
        li.innerHTML = `<span class="news-time">[${news.tag}] ${news.time}</span> ${news.title}`;
        newsList.appendChild(li);
    });
}
fetchFilteredNews();
setInterval(fetchFilteredNews, 15 * 60 * 1000);