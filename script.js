let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

// myportfolim ma add karvanu function
async function addToPortfolio() {
    const symbol = document.getElementById('portfolioSymbol').value.toUpperCase();
    const qty = parseInt(document.getElementById('portfolioQty').value);
    const apiKey = "VzMLwmjYRgYDIogzqL5IcXIH7ZNizpbN";
    
    if (!symbol || !qty) {
        alert("Please fill in both fields");
        return;
    }

    try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`);
        const data = await response.json();
        
        if (!data.length) {
            alert("Invalid stock symbol");
            return;
        }

        const stock = data[0];
        const existingIndex = portfolio.findIndex(item => item.symbol === symbol);

        if (existingIndex > -1) {
            portfolio[existingIndex].qty += qty;
        } else {
            portfolio.push({
                symbol: symbol,
                qty: qty,
                price: stock.price
            });
        }

        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        updatePortfolioDisplay();
        document.getElementById('portfolioSymbol').value = '';
        document.getElementById('portfolioQty').value = '';
    } catch (error) {
        console.error("Error adding to portfolio:", error);
        alert("Failed to add stock to portfolio");
    }
}

async function updatePortfolioDisplay() {
    const apiKey = "VzMLwmjYRgYDIogzqL5IcXIH7ZNizpbN";
    const portfolioItems = document.getElementById('portfolioItems');
    let totalValue = 0;
    
    for (const item of portfolio) {
        try {
            const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${item.symbol}?apikey=${apiKey}`);
            const data = await response.json();
            if (data.length) {
                item.price = data[0].price;
            }
        } catch (error) {
            console.error("Error updating price:", error);
        }
    }

    portfolioItems.innerHTML = '';
    
    portfolio.forEach((item, index) => {
        const value = item.price * item.qty;
        totalValue += value;
        
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.innerHTML = `
            <span>${item.symbol}</span>
            <span>$${item.price.toFixed(2)}</span>
            <span>${item.qty}</span>
            <span>$${value.toFixed(2)}</span>
            <button class="remove-btn" onclick="removeFromPortfolio(${index})">×</button>
        `;
        portfolioItems.appendChild(portfolioItem);
    });

    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
}

function removeFromPortfolio(index) {
    portfolio.splice(index, 1);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    updatePortfolioDisplay();
}

async function fetchStockData() {
    const symbol = document.getElementById('symbol').value;
    const interval = parseInt(document.getElementById('interval').value);
    const apiKey = "VzMLwmjYRgYDIogzqL5IcXIH7ZNizpbN";
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;

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

        // Toggle visibility
        document.getElementById('emptyChart').classList.add('hidden');
        document.getElementById('stockChart').classList.remove('hidden');
        document.getElementById('emptyDetails').classList.add('hidden');
        document.getElementById('stockInfo').classList.remove('hidden');

        const dates = historyData.historical.slice(0, interval).map(entry => entry.date).reverse();
        const prices = historyData.historical.slice(0, interval).map(entry => entry.close).reverse();
        
        renderChart(dates, prices, symbol);
        renderStockDetails(quoteData[0]);
        // window.scrollBy(0, 290);
        let stockChart = document.querySelector('#scrollForGraph');
        window.scrollBy(0, 10);
        stockChart.scrollIntoView();
        // setTimeout(() => {
        //     window.scrollBy(0, 10)
        // }, 100);
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data");
        document.getElementById('emptyChart').classList.remove('hidden');
        document.getElementById('stockChart').classList.add('hidden');
    }
}

function renderChart(labels, data, symbol) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // pehla nu chart nikado
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
                pointBackgroundColor: '#2962ff',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e6f1ff',
                        font: {
                            size: 14
                        }
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
                        color: '#e6f1ff',
                        maxRotation: 45,
                        minRotation: 45
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
                        color: '#e6f1ff',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
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

// portfolio display update karva
window.addEventListener('load', updatePortfolioDisplay);


let addStock = document.querySelector('.myPortfolioAdd');
addStock.addEventListener('click', ()=>{
    addToPortfolio();
});
let entAddStock = document.querySelector('.portfolio-controls');
entAddStock.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
        addToPortfolio();
    }
});

let generateChart = document.querySelector('#generateChart');
generateChart.addEventListener('click', ()=>{
    fetchStockData();
});
let entGenerateChart = document.querySelector('.controls');
entGenerateChart.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
        fetchStockData();
    }
});
