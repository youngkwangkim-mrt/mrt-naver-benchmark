/**
 * Response Time Monitoring Dashboard JavaScript
 * Handles charts, data fetching, auto-refresh, and user interactions
 */

class ResponseTimeDashboard {
    constructor() {
        this.refreshInterval = null;
        this.currentRefreshRate = 30; // Default 30 seconds
        this.isLoading = false;
        this.charts = {};
        
        // Color scheme for percentiles
        this.colors = {
            p50: '#28a745',
            p90: '#ffc107', 
            p95: '#fd7e14',
            p99: '#dc3545'
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Response Time Dashboard');
        
        this.setupEventListeners();
        this.waitForChartJS();
    }

    waitForChartJS() {
        if (typeof Chart !== 'undefined') {
            console.log('✅ Chart.js is ready, initializing charts...');
            this.initializeCharts();
            this.loadData();
            this.startAutoRefresh();
        } else {
            console.log('⏳ Waiting for Chart.js to load...');
            setTimeout(() => this.waitForChartJS(), 500);
        }
    }

    setupEventListeners() {
        // Refresh interval change
        document.getElementById('refreshInterval').addEventListener('change', (e) => {
            this.currentRefreshRate = parseInt(e.target.value);
            this.restartAutoRefresh();
            console.log(`⏰ Refresh interval changed to ${this.currentRefreshRate} seconds`);
        });

        // Handle window resize for responsive charts
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.updateConnectionStatus('loading');
        
        try {
            console.log('📊 Fetching dashboard data...');
            
            // Fetch all required data in parallel
            const [performanceData, routeAnalysisData, recentCallsData] = await Promise.all([
                this.fetchPerformanceMetrics(),
                this.fetchRouteAnalysis(),
                this.fetchRecentCalls()
            ]);
            
            // Update all dashboard components
            this.updateSummaryCards(performanceData, routeAnalysisData);
            this.updatePercentileCharts(routeAnalysisData);
            this.updateRoutePercentileChart(routeAnalysisData);
            this.updateRouteStatsTable(routeAnalysisData);
            
            this.updateLastUpdated();
            this.updateConnectionStatus('connected');
            this.hideError();
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showError(`데이터 로드 실패: ${error.message}`);
            this.updateConnectionStatus('error');
        } finally {
            this.isLoading = false;
        }
    }

    async fetchPerformanceMetrics() {
        const response = await fetch('/api/data/performance-metrics');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Performance metrics API error');
        }
        return result.data;
    }

    async fetchRouteAnalysis() {
        const response = await fetch('/api/data/route-performance-analysis?period=72h');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Route analysis API error');
        }
        return result.data;
    }

    async fetchRecentCalls() {
        const response = await fetch('/api/data/recent-calls?limit=100');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Recent calls API error');
        }
        return result.data;
    }

    initializeCharts() {
        // Initialize Long Haul Chart
        this.charts.longHaul = new Chart(document.getElementById('longHaulChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'P50',
                        data: [],
                        borderColor: this.colors.p50,
                        backgroundColor: this.colors.p50 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P90',
                        data: [],
                        borderColor: this.colors.p90,
                        backgroundColor: this.colors.p90 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P95',
                        data: [],
                        borderColor: this.colors.p95,
                        backgroundColor: this.colors.p95 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P99',
                        data: [],
                        borderColor: this.colors.p99,
                        backgroundColor: this.colors.p99 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: this.getTimeSeriesChartOptions('장거리 노선 응답시간 추이')
        });

        // Initialize Short Haul Chart
        this.charts.shortHaul = new Chart(document.getElementById('shortHaulChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'P50',
                        data: [],
                        borderColor: this.colors.p50,
                        backgroundColor: this.colors.p50 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P90',
                        data: [],
                        borderColor: this.colors.p90,
                        backgroundColor: this.colors.p90 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P95',
                        data: [],
                        borderColor: this.colors.p95,
                        backgroundColor: this.colors.p95 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'P99',
                        data: [],
                        borderColor: this.colors.p99,
                        backgroundColor: this.colors.p99 + '20',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: this.getTimeSeriesChartOptions('단거리 노선 응답시간 추이')
        });

        // Initialize Route Percentile Chart
        this.charts.routePercentile = new Chart(document.getElementById('routePercentileChart'), {
            type: 'line',
            data: {
                labels: ['ICN-NRT', 'ICN-BKK', 'ICN-LHR', 'ICN-CDG', 'ICN-SFO', 'ICN-JFK', 'ICN-LAX'],
                datasets: [
                    {
                        label: 'P50',
                        data: [],
                        borderColor: this.colors.p50,
                        backgroundColor: this.colors.p50 + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'P90',
                        data: [],
                        borderColor: this.colors.p90,
                        backgroundColor: this.colors.p90 + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'P95',
                        data: [],
                        borderColor: this.colors.p95,
                        backgroundColor: this.colors.p95 + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'P99',
                        data: [],
                        borderColor: this.colors.p99,
                        backgroundColor: this.colors.p99 + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: this.getLineChartOptions('노선별 Percentile 비교')
        });
    }

    getBarChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(1)}초`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '응답시간 (초)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '초';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Percentile'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        };
    }

    getGroupedBarChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}초`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '응답시간 (초)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '초';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '노선'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        };
    }

    getLineChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}초`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '응답시간 (초)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '초';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '노선'
                    }
                }
            },
            elements: {
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        };
    }

    getTimeSeriesChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}초`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '응답시간 (초)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '초';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '시간 (최근 72시간, 1시간 간격)'
                    }
                }
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        };
    }

    updateSummaryCards(performanceData, routeAnalysisData) {
        // Calculate individual averages
        const longHaulAvg = this.calculateLongHaulAverage(routeAnalysisData);
        const shortHaulAvg = this.calculateShortHaulAverage(routeAnalysisData);
        
        // Calculate overall average as weighted average of long haul and short haul
        const totalRequests = longHaulAvg.count + shortHaulAvg.count;
        const overallAvg = {
            value: totalRequests > 0 ? 
                ((longHaulAvg.value * longHaulAvg.count) + (shortHaulAvg.value * shortHaulAvg.count)) / totalRequests :
                0,
            count: totalRequests
        };

        // Update summary cards
        document.getElementById('overallAvgResponse').textContent = `${overallAvg.value.toFixed(1)}초`;
        document.getElementById('overallRequestCount').textContent = `${overallAvg.count}건 요청`;

        document.getElementById('longHaulAvgResponse').textContent = `${longHaulAvg.value.toFixed(1)}초`;
        document.getElementById('longHaulRequestCount').textContent = `${longHaulAvg.count}건 요청`;

        document.getElementById('shortHaulAvgResponse').textContent = `${shortHaulAvg.value.toFixed(1)}초`;
        document.getElementById('shortHaulRequestCount').textContent = `${shortHaulAvg.count}건 요청`;
    }

    calculateOverallAverage(performanceData) {
        // Use performance data or generate demo data
        if (performanceData && performanceData.all) {
            const p50Values = performanceData.all.p50.filter(v => v > 0);
            const avg = p50Values.length > 0 ? 
                p50Values.reduce((a, b) => a + b, 0) / p50Values.length : 1500;
            return { value: avg, count: p50Values.length * 12 };
        }
        return { value: 1500, count: 150 };
    }

    calculateLongHaulAverage(routeAnalysisData) {
        if (routeAnalysisData && routeAnalysisData.longHaul && routeAnalysisData.longHaul.stats) {
            return {
                value: routeAnalysisData.longHaul.stats.averageResponseTime,
                count: routeAnalysisData.longHaul.stats.totalRequests
            };
        }
        return { value: 2.97, count: 75 };
    }

    calculateShortHaulAverage(routeAnalysisData) {
        if (routeAnalysisData && routeAnalysisData.shortHaul && routeAnalysisData.shortHaul.stats) {
            return {
                value: routeAnalysisData.shortHaul.stats.averageResponseTime,
                count: routeAnalysisData.shortHaul.stats.totalRequests
            };
        }
        return { value: 1.43, count: 75 };
    }

    updatePercentileCharts(routeAnalysisData) {
        // Update Long Haul Chart - use chart data from route analysis
        if (routeAnalysisData && routeAnalysisData.longHaul && routeAnalysisData.longHaul.chart) {
            this.updateTimeSeriesChart(this.charts.longHaul, routeAnalysisData.longHaul.chart);
        } else {
            // Demo data for long haul (convert to seconds)
            this.updateTimeSeriesChartWithDemo(this.charts.longHaul, 'longHaul');
        }

        // Update Short Haul Chart - use chart data from route analysis
        if (routeAnalysisData && routeAnalysisData.shortHaul && routeAnalysisData.shortHaul.chart) {
            this.updateTimeSeriesChart(this.charts.shortHaul, routeAnalysisData.shortHaul.chart);
        } else {
            // Demo data for short haul (convert to seconds)
            this.updateTimeSeriesChartWithDemo(this.charts.shortHaul, 'shortHaul');
        }

        this.charts.longHaul.update('none');
        this.charts.shortHaul.update('none');
    }

    updateTimeSeriesChart(chart, data) {
        if (!data || !data.labels) return;
        
        // Update labels (time)
        chart.data.labels = data.labels;
        
        // Update datasets (P50, P90, P95, P99)
        chart.data.datasets[0].data = data.p50 || [];
        chart.data.datasets[1].data = data.p90 || [];
        chart.data.datasets[2].data = data.p95 || [];
        chart.data.datasets[3].data = data.p99 || [];
    }

    updateTimeSeriesChartWithDemo(chart, type) {
        // Generate demo time labels (12 time points)
        const labels = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
            labels.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
        }
        
        chart.data.labels = labels;
        
        if (type === 'longHaul') {
            // Demo data for long haul (varying over time)
            chart.data.datasets[0].data = [2.0, 2.1, 2.3, 2.2, 2.4, 2.1, 2.0, 1.9, 2.2, 2.3, 2.1, 2.2]; // P50
            chart.data.datasets[1].data = [3.2, 3.4, 3.7, 3.5, 3.8, 3.4, 3.2, 3.0, 3.5, 3.7, 3.4, 3.5]; // P90
            chart.data.datasets[2].data = [4.0, 4.2, 4.6, 4.4, 4.7, 4.2, 4.0, 3.8, 4.4, 4.6, 4.2, 4.4]; // P95
            chart.data.datasets[3].data = [5.5, 5.8, 6.3, 6.0, 6.5, 5.8, 5.5, 5.2, 6.0, 6.3, 5.8, 6.0]; // P99
        } else {
            // Demo data for short haul (varying over time)
            chart.data.datasets[0].data = [0.7, 0.8, 0.9, 0.8, 0.9, 0.8, 0.7, 0.6, 0.8, 0.9, 0.8, 0.8]; // P50
            chart.data.datasets[1].data = [1.1, 1.2, 1.4, 1.3, 1.4, 1.2, 1.1, 1.0, 1.3, 1.4, 1.2, 1.3]; // P90
            chart.data.datasets[2].data = [1.4, 1.5, 1.7, 1.6, 1.8, 1.5, 1.4, 1.3, 1.6, 1.7, 1.5, 1.6]; // P95
            chart.data.datasets[3].data = [2.1, 2.3, 2.6, 2.4, 2.7, 2.3, 2.1, 1.9, 2.4, 2.6, 2.3, 2.4]; // P99
        }
    }

    extractPercentileData(data) {
        if (!data) return [0, 0, 0, 0];
        
        // Get latest values from each percentile array and convert to seconds
        const p50 = data.p50 && data.p50.length > 0 ? data.p50[data.p50.length - 1] : 0;
        const p90 = data.p90 && data.p90.length > 0 ? data.p90[data.p90.length - 1] : 0;
        const p95 = data.p95 && data.p95.length > 0 ? data.p95[data.p95.length - 1] : 0;
        const p99 = data.p99 && data.p99.length > 0 ? data.p99[data.p99.length - 1] : 0;
        
        return [p50, p90, p95, p99];
    }

    updateRoutePercentileChart(routeAnalysisData) {
        // Fixed routes as requested by user
        const targetRoutes = ['ICN-NRT', 'ICN-BKK', 'ICN-LHR', 'ICN-CDG', 'ICN-SFO', 'ICN-JFK', 'ICN-LAX'];
        let chartData;
        
        if (routeAnalysisData && routeAnalysisData.routeStats) {
            // Use real individual route statistics for target routes
            const routeStats = routeAnalysisData.routeStats;
            
            // Extract percentile data for specific routes
            chartData = {
                p50: targetRoutes.map(route => {
                    if (routeStats[route]) {
                        return Math.round(routeStats[route].medianResponseTime * 100) / 100;
                    } else {
                        // Fallback if route not found (shouldn't happen now)
                        return route.includes('NRT') || route.includes('BKK') ? 1.8 : 4.5;
                    }
                }),
                p90: targetRoutes.map(route => {
                    if (routeStats[route]) {
                        return Math.round(routeStats[route].p90ResponseTime * 100) / 100;
                    } else {
                        return route.includes('NRT') || route.includes('BKK') ? 2.8 : 6.8;
                    }
                }),
                p95: targetRoutes.map(route => {
                    if (routeStats[route]) {
                        return Math.round(routeStats[route].p95ResponseTime * 100) / 100;
                    } else {
                        return route.includes('NRT') || route.includes('BKK') ? 3.5 : 8.2;
                    }
                }),
                p99: targetRoutes.map(route => {
                    if (routeStats[route]) {
                        return Math.round(routeStats[route].p99ResponseTime * 100) / 100;
                    } else {
                        return route.includes('NRT') || route.includes('BKK') ? 5.0 : 11.0;
                    }
                })
            };
            
            const realRoutes = targetRoutes.filter(route => routeStats[route]);
            console.log(`📊 Updated route percentile chart with real data for routes: ${realRoutes.join(', ')} (${routeAnalysisData.totalRecords} total records)`);
        } else {
            // Fallback to demo data
            chartData = {
                p50: [0.85, 2.1, 4.2, 4.1, 4.8, 4.6, 4.7],
                p90: [1.2, 3.2, 6.8, 6.5, 7.2, 7.0, 7.1],
                p95: [1.5, 3.8, 8.2, 7.8, 8.6, 8.4, 8.5],
                p99: [2.2, 5.5, 11.0, 10.5, 12.0, 11.8, 11.9]
            };
            console.log('📊 Using demo data for route percentile chart');
        }

        // Update chart labels and data with fixed routes
        this.charts.routePercentile.data.labels = targetRoutes;
        this.charts.routePercentile.data.datasets[0].data = chartData.p50;
        this.charts.routePercentile.data.datasets[1].data = chartData.p90;
        this.charts.routePercentile.data.datasets[2].data = chartData.p95;
        this.charts.routePercentile.data.datasets[3].data = chartData.p99;
        
        this.charts.routePercentile.update('none');
    }

    updateRouteStatsTable(routeAnalysisData) {
        // Fixed routes as requested by user
        const targetRoutes = ['ICN-NRT', 'ICN-BKK', 'ICN-LHR', 'ICN-CDG', 'ICN-SFO', 'ICN-JFK', 'ICN-LAX'];
        let routes;
        
        if (routeAnalysisData && routeAnalysisData.routeStats) {
            // Use real individual route statistics for target routes
            const routeStats = routeAnalysisData.routeStats;
            
            // Convert route stats to table format for specific routes
            routes = targetRoutes.map(routeCode => {
                if (routeStats[routeCode]) {
                    const stats = routeStats[routeCode];
                    return {
                        code: routeCode,
                        type: stats.routeType,
                        median: Math.round(stats.medianResponseTime * 100) / 100,
                        avg: Math.round(stats.averageResponseTime * 100) / 100,
                        min: stats.fastestResponse,
                        max: stats.slowestResponse,
                        requests: stats.totalRequests
                    };
                } else {
                    // Fallback if route not found (shouldn't happen now)
                    const isShortHaul = routeCode.includes('NRT') || routeCode.includes('BKK');
                    return {
                        code: routeCode,
                        type: isShortHaul ? '단거리' : '장거리',
                        median: isShortHaul ? 1.8 : 4.5,
                        avg: isShortHaul ? 2.0 : 4.8,
                        min: 1,
                        max: isShortHaul ? 4 : 12,
                        requests: 0
                    };
                }
            });
            
            const realRoutes = targetRoutes.filter(route => routeStats[route]);
            console.log(`📊 Updated route stats table with real data for routes: ${realRoutes.join(', ')} (${routeAnalysisData.totalRecords} total records)`);
        } else {
            // Fallback to demo data
            routes = [
                { code: 'ICN-NRT', type: '단거리', median: 0.85, avg: 0.95, min: 0.62, max: 2.2, requests: 45 },
                { code: 'ICN-BKK', type: '단거리', median: 2.1, avg: 2.3, min: 1.8, max: 5.5, requests: 38 },
                { code: 'ICN-LHR', type: '장거리', median: 4.2, avg: 4.6, min: 3.2, max: 11.0, requests: 32 },
                { code: 'ICN-CDG', type: '장거리', median: 4.1, avg: 4.4, min: 3.1, max: 10.5, requests: 29 },
                { code: 'ICN-SFO', type: '장거리', median: 4.8, avg: 5.2, min: 3.6, max: 12.0, requests: 35 },
                { code: 'ICN-JFK', type: '장거리', median: 4.6, avg: 5.0, min: 3.4, max: 11.8, requests: 31 },
                { code: 'ICN-LAX', type: '장거리', median: 4.7, avg: 5.1, min: 3.5, max: 11.9, requests: 33 }
            ];
            console.log('📊 Using demo data for route stats table');
        }

        const tbody = document.getElementById('route-stats-table');
        tbody.innerHTML = routes.map(route => `
            <tr>
                <td><strong>${route.code}</strong> <small class="text-muted">(${route.type})</small></td>
                <td>${route.median}초</td>
                <td>${route.avg}초</td>
                <td>${route.min}초</td>
                <td>${route.max}초</td>
                <td>${route.requests.toLocaleString()}건</td>
            </tr>
        `).join('');
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadData();
            }
        }, this.currentRefreshRate * 1000);
        
        console.log(`⏰ Auto-refresh started (${this.currentRefreshRate} seconds)`);
    }

    restartAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.startAutoRefresh();
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = `마지막 업데이트: ${timeString}`;
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        indicator.className = 'status-indicator';
        
        switch (status) {
            case 'connected':
                indicator.classList.add('status-connected');
                break;
            case 'error':
                indicator.classList.add('status-error');
                break;
            case 'loading':
                // Keep current status while loading
                break;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    destroy() {
        // Clean up auto-refresh when leaving page
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            console.log('🛑 Auto-refresh disabled');
        }
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.responseTimeDashboard = new ResponseTimeDashboard();
});

// Clean up when leaving page
window.addEventListener('beforeunload', () => {
    if (window.responseTimeDashboard) {
        window.responseTimeDashboard.destroy();
    }
});

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseTimeDashboard;
} 