document.addEventListener('DOMContentLoaded', () => {
    const chartContainer = document.getElementById('chartContainer');
    const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: { background: { color: '#ffffff' }, textColor: '#333' },
        timeScale: { timeVisible: true, secondsVisible: true },
    });
    const lineSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });

    window.addEventListener('resize', () => {
        chart.applyOptions({ width: chartContainer.clientWidth });
    });

    let priceHistory = [];
    const DERIV_APP_ID = 1089;
    const SYMBOL = 'R_75';

    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${DERIV_APP_ID}`);
    
    ws.onopen = () => {
        ws.send(JSON.stringify({ ticks: SYMBOL, subscribe: 1 }));
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.msg_type === 'tick') {
            const tick = { time: data.tick.epoch, value: data.tick.quote };
            lineSeries.update(tick);
            
            priceHistory.push({ time: tick.time, price: tick.value });
            if (priceHistory.length > 1000) priceHistory.shift();
        }
    };

    const analyzeBtn = document.getElementById('analyzeBtn');
    const aiResult = document.getElementById('aiResult');

    analyzeBtn.addEventListener('click', async () => {
        if (priceHistory.length < 10) {
            aiResult.textContent = "Not enough tick data gathered yet. Please wait.";
            return;
        }

        analyzeBtn.textContent = "Analyzing Market Data...";
        aiResult.textContent = "Consulting Gemini AI...";

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset: SYMBOL, priceData: priceHistory })
            });
            const analysis = await res.json();
            aiResult.textContent = JSON.stringify(analysis, null, 2);
        } catch (error) {
            aiResult.textContent = "Error: Could not complete analysis.";
        } finally {
            analyzeBtn.textContent = "Run Gemini AI Analysis";
        }
    });

    const subscribeBtn = document.getElementById('subscribeBtn');
    subscribeBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_123', phoneNumber: '255700000000' })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            alert('Payment initialization failed.');
        }
    });
});
