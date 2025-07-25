/**
 * Route Performance Analysis Dashboard JavaScript
 * Handles dual charts, time period filtering, and auto-refresh
 */

class RoutePerformanceAnalysis {
    constructor() {
        this.currentPeriod = '24h';
        this.longHaulChart = null;
        this.shortHaulChart = null;
        this.refreshInterval = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Route Performance Analysis Dashboard');
        
        this.setupEventListeners();
        this.setupAutoRefresh();
        this.loadData();
    }

    setupEventListeners() {
        // Time period button listeners
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePeriodChange(e.target);
            });
        });

        // Refresh button listener
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData(true);
        });
    }

    setupAutoRefresh() {
        // Auto-refresh every 60 seconds
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadData();
            }
        }, 60000);
        
        console.log('⏰ Auto-refresh enabled (60 seconds)');
    }

    handlePeriodChange(button) {
        // Update active period button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update current period and reload data
        this.currentPeriod = button.dataset.period;
        console.log(`🔄 Period changed to: ${this.currentPeriod}`);
        this.loadData(true);
    }

    async loadData(showLoader = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        if (showLoader) {
            this.showLoading();
        }

        try {
            console.log(`📊 Fetching route performance data for ${this.currentPeriod}...`);
            
            const response = await fetch(`/api/data/route-performance-analysis?period=${this.currentPeriod}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown API error');
            }

            this.processData(result.data);
            this.updateLastUpdated(result.timestamp);
            this.hideError();
            
            console.log(`✅ Loaded route performance data for ${this.currentPeriod}`);
            
        } catch (error) {
            console.error('❌ Failed to load route performance data:', error);
            this.showError(`Failed to load data: ${error.message}`);
            this.showNoData();
        } finally {
            this.isLoading = false;
        }
    }

    processData(data) {
        // Update time range info
        this.updateTimeRangeInfo(data);
        
        // Update summary statistics
        this.updateSummaryStats(data);
        
        // Update charts
        this.updateCharts(data);
        
        // Hide loading states
        this.hideLoading();
    }

    updateTimeRangeInfo(data) {
        const timeRangeDiv = document.getElementById('timeRangeInfo');
        const startTime = new Date(data.timeRange.start).toLocaleString();
        const endTime = new Date(data.timeRange.end).toLocaleString();
        
        timeRangeDiv.innerHTML = `
            <i class="fas fa-clock"></i>
            Analyzing data from <strong>${startTime}</strong> to <strong>${endTime}</strong>
            (${data.totalRecords} total records)
            ${data.isRealData ? '' : ' - <em>Showing demo data with realistic patterns</em>'}
        `;
        timeRangeDiv.style.display = 'block';
    }

    updateSummaryStats(data) {
        // Long Haul stats
        const longHaulStats = data.longHaul.stats;
        document.getElementById('longHaulRequests').textContent = longHaulStats.totalRequests;
        document.getElementById('longHaulAvgTime').textContent = `${longHaulStats.averageResponseTime.toFixed(1)}s`;
        document.getElementById('longHaulSuccessRate').textContent = `${longHaulStats.successRate.toFixed(1)}%`;
        document.getElementById('longHaulRange').textContent = 
            `${longHaulStats.fastestResponse.toFixed(1)}s - ${longHaulStats.slowestResponse.toFixed(1)}s`;

        // Short Haul stats
        const shortHaulStats = data.shortHaul.stats;
        document.getElementById('shortHaulRequests').textContent = shortHaulStats.totalRequests;
        document.getElementById('shortHaulAvgTime').textContent = `${shortHaulStats.averageResponseTime.toFixed(1)}s`;
        document.getElementById('shortHaulSuccessRate').textContent = `${shortHaulStats.successRate.toFixed(1)}%`;
        document.getElementById('shortHaulRange').textContent = 
            `${shortHaulStats.fastestResponse.toFixed(1)}s - ${shortHaulStats.slowestResponse.toFixed(1)}s`;
    }

    updateCharts(data) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js not available');
            this.showChartError('Chart.js library not loaded');
            return;
        }

        // Update Long Haul chart
        this.createOrUpdateChart('longHaul', data.longHaul.chart, {
            title: 'Long Haul Routes - Response Time Percentiles',
            color: '#e53e3e'
        });

        // Update Short Haul chart
        this.createOrUpdateChart('shortHaul', data.shortHaul.chart, {
            title: 'Short Haul Routes - Response Time Percentiles',
            color: '#38a169'
        });
    }

    createOrUpdateChart(chartType, chartData, options) {
        const canvasId = `${chartType}Chart`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} not found`);
            return;
        }

        // Destroy existing chart if it exists
        if (chartType === 'longHaul' && this.longHaulChart) {
            this.longHaulChart.destroy();
        } else if (chartType === 'shortHaul' && this.shortHaulChart) {
            this.shortHaulChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        const chartConfig = {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'P50 (Median)',
                        data: chartData.p50,
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'P90',
                        data: chartData.p90,
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'P95',
                        data: chartData.p95,
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: options.title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: options.color
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}s`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Response Time (seconds)'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        };

        // Create the chart
        const chart = new Chart(ctx, chartConfig);
        
        // Store chart reference
        if (chartType === 'longHaul') {
            this.longHaulChart = chart;
        } else if (chartType === 'shortHaul') {
            this.shortHaulChart = chart;
        }
    }

    showLoading() {
        document.getElementById('longHaulLoading').style.display = 'flex';
        document.getElementById('shortHaulLoading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('longHaulLoading').style.display = 'none';
        document.getElementById('shortHaulLoading').style.display = 'none';
    }

    showNoData() {
        this.hideLoading();
        
        // Show no data messages for both charts
        const longHaulContainer = document.querySelector('#longHaulChart').parentNode;
        const shortHaulContainer = document.querySelector('#shortHaulChart').parentNode;
        
        const noDataHTML = `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <div>No performance data available</div>
                <small>Try a different time period or make some API requests</small>
            </div>
        `;
        
        longHaulContainer.innerHTML = `<canvas id="longHaulChart"></canvas>${noDataHTML}`;
        shortHaulContainer.innerHTML = `<canvas id="shortHaulChart"></canvas>${noDataHTML}`;
    }

    showChartError(message) {
        this.hideLoading();
        
        const errorHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Chart Error</div>
                <small>${message}</small>
            </div>
        `;
        
        const longHaulContainer = document.querySelector('#longHaulChart').parentNode;
        const shortHaulContainer = document.querySelector('#shortHaulChart').parentNode;
        
        longHaulContainer.innerHTML = `<canvas id="longHaulChart"></canvas>${errorHTML}`;
        shortHaulContainer.innerHTML = `<canvas id="shortHaulChart"></canvas>${errorHTML}`;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    updateLastUpdated(timestamp) {
        const lastUpdatedSpan = document.getElementById('lastUpdated');
        const date = new Date(timestamp || new Date());
        const timeString = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdatedSpan.textContent = `Last updated: ${timeString}`;
    }

    destroy() {
        // Clean up charts
        if (this.longHaulChart) {
            this.longHaulChart.destroy();
            this.longHaulChart = null;
        }
        
        if (this.shortHaulChart) {
            this.shortHaulChart.destroy();
            this.shortHaulChart = null;
        }
        
        // Clean up auto-refresh
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            console.log('🛑 Auto-refresh disabled');
        }
    }
}

// Wait for Chart.js to load before initializing dashboard
let chartLoadAttempts = 0;
const maxAttempts = 50; // 5 seconds timeout

function checkChartJsLoaded() {
    chartLoadAttempts++;
    
    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js loaded successfully');
        // Initialize dashboard when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.routePerformanceDashboard = new RoutePerformanceAnalysis();
            });
        } else {
            window.routePerformanceDashboard = new RoutePerformanceAnalysis();
        }
    } else if (chartLoadAttempts < maxAttempts) {
        // Chart.js not loaded yet, wait and try again
        setTimeout(checkChartJsLoaded, 100);
    } else {
        console.error('❌ Chart.js failed to load after 5 seconds');
        // Show charts unavailable message
        document.addEventListener('DOMContentLoaded', () => {
            const longHaulContainer = document.querySelector('#longHaulChart').parentNode;
            const shortHaulContainer = document.querySelector('#shortHaulChart').parentNode;
            
            const errorHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Chart.js library unavailable</div>
                    <small>Please check your internet connection</small>
                </div>
            `;
            
            longHaulContainer.innerHTML = errorHTML;
            shortHaulContainer.innerHTML = errorHTML;
        });
    }
}

// Start checking for Chart.js
checkChartJsLoaded();

// Clean up when leaving page
window.addEventListener('beforeunload', () => {
    if (window.routePerformanceDashboard) {
        window.routePerformanceDashboard.destroy();
    }
});

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoutePerformanceAnalysis;
} 