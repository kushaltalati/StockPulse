async function fetchStockData() {
    const symbol = document.getElementById('symbol').value;
    const interval = parseInt(document.getElementById('interval').value);
    const apiKey = "VzMLwmjYRgYDIogzqL5IcXIH7ZNizpbN";
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;

    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.navbar-links li a');
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
    
        let currentSection = '';
    
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navbarHeight;
            const sectionHeight = section.clientHeight;
    
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
    
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    try {
        const [historyResponse, quoteResponse] = await Promise.all([
            fetch(url),
            fetch(quoteUrl)
        ]);
        
        const historyData = await historyResponse.json();
        const quoteData = await quoteResponse.json();

        if (!historyData.historical || !quoteData.length) {
            alert("Invalid symbol or no data available");
            return;
        }

        const dates = historyData.historical.slice(0, interval).map(entry => entry.date).reverse();
        const prices = historyData.historical.slice(0, interval).map(entry => entry.close).reverse();
        
        document.getElementById('emptyChart').classList.add('hidden');
        document.getElementById('stockChart').classList.remove('hidden');
        document.getElementById('emptyDetails').classList.add('hidden');
        document.getElementById('stockInfo').classList.remove('hidden');

        renderChart(dates, prices, symbol);
        renderStockDetails(quoteData[0]);
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data");
    }
}

function renderChart(labels, data, symbol) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (window.stockChartInstance) {
        window.stockChartInstance.destroy();
    }
    window.stockChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Stock Price`,
                data: data,
                borderColor: '#2962ff',
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#2962ff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e6f1ff'
                    }
                }
            },
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Date',
                        color: '#e6f1ff'
                    },
                    grid: {
                        color: '#233554'
                    },
                    ticks: {
                        color: '#e6f1ff'
                    }
                },
                y: { 
                    title: { 
                        display: true, 
                        text: 'Closing Price (USD)',
                        color: '#e6f1ff'
                    },
                    grid: {
                        color: '#233554'
                    },
                    ticks: {
                        color: '#e6f1ff'
                    }
                }
            }
        }
    });
}

function renderStockDetails(quote) {
    const stockInfo = document.getElementById('stockInfo');
    stockInfo.innerHTML = `
        <div class="metric-card">
            <div class="metric-title">Current Price</div>
            <div class="metric-value">$${quote.price.toFixed(2)}</div>
            <div class="metric-change ${quote.change >= 0 ? 'positive' : 'negative'}">
                ${quote.change >= 0 ? '▲' : '▼'} ${Math.abs(quote.change).toFixed(2)} (${quote.changesPercentage.toFixed(2)}%)
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Market Cap</div>
            <div class="metric-value">$${(quote.marketCap / 1e9).toFixed(2)}B</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Trading Volume</div>
            <div class="metric-value">${(quote.volume / 1e6).toFixed(2)}M</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">52-Week Range</div>
            <div class="metric-value">$${quote.yearLow.toFixed(2)} - $${quote.yearHigh.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">P/E Ratio</div>
            <div class="metric-value">${quote.pe ? quote.pe.toFixed(2) : 'N/A'}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">EPS</div>
            <div class="metric-value">$${quote.eps ? quote.eps.toFixed(2) : 'N/A'}</div>
        </div>
    `;
}