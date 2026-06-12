// ===================================
// STATE MANAGEMENT
// ===================================
const STATE = {
    autoRefreshInterval: null,
    newsItems: [],
    currentNewsIndex: 0,
    lastRefresh: new Date(),
    connectionStatus: true
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatChange(value) {
    if (!value || isNaN(value)) return '--';
    const symbol = value >= 0 ? '+' : '';
    return `${symbol}${value.toFixed(2)}%`;
}

function setConnectionStatus(online) {
    STATE.connectionStatus = online;
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        if (online) {
            statusEl.textContent = '●';
            statusEl.classList.remove('offline');
        } else {
            statusEl.textContent = '●';
            statusEl.classList.add('offline');
        }
    }
}

function setLoading(elementId, loading) {
    const spinner = document.getElementById(elementId);
    if (spinner) {
        if (loading) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Fetch error: ${error.message}`);
        setConnectionStatus(false);
        return null;
    }
}

// ===================================
// DATE & TIME UPDATES
// ===================================

function updateDateTime() {
    const now = new Date();
    const dateTimeEl = document.getElementById('dateTime');
    if (!dateTimeEl) return;
    
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    dateTimeEl.textContent = now.toLocaleDateString('en-US', options);
}

function updateWorldClocks() {
    const timezones = {
        'dubai': 'Asia/Dubai',
        'istanbul': 'Europe/Istanbul',
        'sofia': 'Europe/Sofia',
        'london': 'Europe/London',
        'newyork': 'America/New_York'
    };

    for (const [city, tz] of Object.entries(timezones)) {
        const now = new Date().toLocaleString('en-US', { timeZone: tz });
        const time = new Date(now).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        const element = document.getElementById(`time-${city}`);
        if (element) element.textContent = time;
    }
}

// ===================================
// CRYPTOCURRENCY (CoinGecko Free API)
// ===================================

async function updateCryptoPrices() {
    setLoading('cryptoLoading', true);
    
    try {
        const cryptoData = await fetchWithTimeout(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,cardano&vs_currencies=usd&include_24hr_change=true'
        );

        if (cryptoData) {
            const cryptos = {
                'btc': cryptoData.bitcoin,
                'eth': cryptoData.ethereum,
                'xrp': cryptoData.ripple,
                'ada': cryptoData.cardano
            };

            for (const [symbol, data] of Object.entries(cryptos)) {
                if (data) {
                    const price = data.usd;
                    const change = data.usd_24h_change;
                    
                    const priceEl = document.getElementById(`${symbol}-price`);
                    const changeEl = document.getElementById(`${symbol}-change`);
                    
                    if (priceEl) priceEl.textContent = `$${formatNumber(price, 0)}`;
                    if (changeEl) {
                        changeEl.textContent = formatChange(change);
                        changeEl.classList.remove('positive', 'negative');
                        changeEl.classList.add(change >= 0 ? 'positive' : 'negative');
                    }
                }
            }

            setConnectionStatus(true);
        }
    } catch (error) {
        console.error('Failed to fetch crypto data:', error);
    }
    
    setLoading('cryptoLoading', false);
}

// ===================================
// NEWS FEED (RSS via Free Parser)
// ===================================

async function updateNews() {
    setLoading('newsLoading', true);
    
    STATE.newsItems = [];
    
    // Financial news feeds (RSS)
    const feeds = [
        'https://feeds.bloomberg.com/markets/news.rss',
        'https://feeds.cnbc.com/id/100003114/feed',
        'https://feeds.reuters.com/finance/markets'
    ];
    
    for (const feedUrl of feeds) {
        try {
            // Use RSS to JSON converter (free, no key required)
            const corsUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=3`;
            const data = await fetchWithTimeout(corsUrl);
            
            if (data && data.items && Array.isArray(data.items)) {
                STATE.newsItems.push(...data.items);
            }
        } catch (error) {
            console.error(`Failed to fetch ${feedUrl}:`, error);
        }
    }
    
    if (STATE.newsItems.length === 0) {
        STATE.newsItems = [
            { title: 'Loading financial news...' },
            { title: 'Markets remain active with global updates' },
            { title: 'Follow financial markets in real-time' }
        ];
    }
    
    STATE.currentNewsIndex = 0;
    rotateNews();
    setLoading('newsLoading', false);
}

function rotateNews() {
    const newsContent = document.getElementById('newsContent');
    if (!newsContent || STATE.newsItems.length === 0) return;
    
    const currentNews = STATE.newsItems[STATE.currentNewsIndex];
    const title = typeof currentNews === 'string' ? currentNews : (currentNews.title || 'No title');
    
    newsContent.textContent = title;
    STATE.currentNewsIndex = (STATE.currentNewsIndex + 1) % STATE.newsItems.length;
}

// Rotate news every 8 seconds
setInterval(rotateNews, 8000);

// ===================================
// PRAYER TIMES (Aladhan Free API)
// ===================================

async function updatePrayerTimes() {
    setLoading('prayerLoading', true);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Dubai&country=UAE&method=4&date=${date}-${month}-${year}`;
    const data = await fetchWithTimeout(url);
    
    if (data && data.data && data.data.timings) {
        const timings = data.data.timings;
        
        document.getElementById('prayer-fajr').textContent = timings.Fajr?.split(' ')[0] || '--:--';
        document.getElementById('prayer-sunrise').textContent = timings.Sunrise?.split(' ')[0] || '--:--';
        document.getElementById('prayer-dhuhr').textContent = timings.Dhuhr?.split(' ')[0] || '--:--';
        document.getElementById('prayer-asr').textContent = timings.Asr?.split(' ')[0] || '--:--';
        document.getElementById('prayer-maghrib').textContent = timings.Maghrib?.split(' ')[0] || '--:--';
        document.getElementById('prayer-isha').textContent = timings.Isha?.split(' ')[0] || '--:--';
        
        updateNextPrayerCountdown(timings);
        setConnectionStatus(true);
    } else {
        console.error('Failed to fetch prayer times');
    }
    
    setLoading('prayerLoading', false);
}

function updateNextPrayerCountdown(timings) {
    const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayer = null;
    let minDiff = Infinity;
    
    for (const prayer of prayerNames) {
        const timeStr = document.getElementById(`prayer-${prayer.toLowerCase()}`)?.textContent || '';
        if (!timeStr || timeStr === '--:--') continue;
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        const diff = prayerTime - currentTime;
        
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = prayer;
        }
    }
    
    const nextEl = document.getElementById('nextPrayer');
    if (nextEl && nextPrayer && minDiff !== Infinity) {
        nextEl.textContent = `Next: ${nextPrayer} in ${Math.floor(minDiff)} minutes`;
    }
}

// ===================================
// FLIGHT INFORMATION (Demo Data)
// ===================================

function updateFlights() {
    const mockFlights = {
        departures: [
            { airline: 'EK', time: '14:30', destination: 'London LHR', status: 'On Time' },
            { airline: 'FZ', time: '15:45', destination: 'Istanbul IST', status: 'On Time' },
            { airline: 'EK', time: '16:20', destination: 'New York JFK', status: 'Delayed' },
            { airline: 'WY', time: '17:00', destination: 'Sofia SOF', status: 'On Time' },
            { airline: 'EK', time: '18:15', destination: 'Paris CDG', status: 'On Time' },
            { airline: 'BA', time: '19:30', destination: 'Mumbai BOM', status: 'On Time' }
        ],
        arrivals: [
            { airline: 'BA', time: '12:45', destination: 'London LHR', status: 'Landed' },
            { airline: 'TK', time: '13:20', destination: 'Istanbul IST', status: 'Landed' },
            { airline: 'AA', time: '14:00', destination: 'New York JFK', status: 'In Flight' },
            { airline: 'LH', time: '14:45', destination: 'Frankfurt FRA', status: 'In Flight' },
            { airline: 'AF', time: '15:30', destination: 'Paris CDG', status: 'Landed' },
            { airline: 'SQ', time: '16:15', destination: 'Singapore SIN', status: 'In Flight' }
        ]
    };
    
    displayFlights(mockFlights.departures);
    
    document.getElementById('depTab').addEventListener('click', () => {
        displayFlights(mockFlights.departures);
        document.getElementById('depTab').classList.add('active');
        document.getElementById('arrTab').classList.remove('active');
    });
    
    document.getElementById('arrTab').addEventListener('click', () => {
        displayFlights(mockFlights.arrivals);
        document.getElementById('arrTab').classList.add('active');
        document.getElementById('depTab').classList.remove('active');
    });
}

function displayFlights(flights) {
    const flightsList = document.getElementById('flightsList');
    flightsList.innerHTML = '';
    
    flights.forEach(flight => {
        const flightEl = document.createElement('div');
        flightEl.className = 'flight-item';
        const statusClass = flight.status.includes('Delayed') ? 'delayed' : '';
        
        flightEl.innerHTML = `
            <span class="airline">${flight.airline}</span>
            <span class="time">${flight.time}</span>
            <span class="destination">${flight.destination}</span>
            <span class="status ${statusClass}">${flight.status}</span>
        `;
        
        flightsList.appendChild(flightEl);
    });
}

// ===================================
// FULLSCREEN FUNCTIONALITY
// ===================================

function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

const fsBtn = document.getElementById('fullscreenBtn');
if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
    }
});

// ===================================
// AUTO REFRESH
// ===================================

function refreshAllData() {
    console.log('Dashboard refreshing...');
    updateDateTime();
    updateWorldClocks();
    updateCryptoPrices();
    updateNews();
    updatePrayerTimes();
    updateFlights();
    STATE.lastRefresh = new Date();
}

function startAutoRefresh() {
    // Refresh every 5 minutes (300,000 ms)
    STATE.autoRefreshInterval = setInterval(refreshAllData, 5 * 60 * 1000);
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    
    // Update clocks every second
    updateDateTime();
    updateWorldClocks();
    setInterval(updateDateTime, 1000);
    setInterval(updateWorldClocks, 1000);
    
    // Initial data fetch
    refreshAllData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Online/offline handlers
    window.addEventListener('online', () => {
        setConnectionStatus(true);
        refreshAllData();
    });
    
    window.addEventListener('offline', () => {
        setConnectionStatus(false);
    });
});

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

document.addEventListener('keydown', (e) => {
    // R to refresh
    if (e.key === 'r' || e.key === 'R') {
        refreshAllData();
    }
    
    // ESC to exit fullscreen
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

// ===================================
// ERROR HANDLING
// ===================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
});

// Monitor connection every 30 seconds
setInterval(() => {
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
        .then(() => setConnectionStatus(true))
        .catch(() => setConnectionStatus(false));
}, 30000);