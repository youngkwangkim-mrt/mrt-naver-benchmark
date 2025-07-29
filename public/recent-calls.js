/**
 * Recent API Calls Dashboard JavaScript
 * Handles filtering, sorting, auto-refresh, and table interactions
 */

class RecentCallsDashboard {
    constructor() {
        this.currentLimit = 50;
        this.currentData = [];
        this.sortColumn = 'created_at';
        this.sortDirection = 'desc';
        this.refreshInterval = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Recent API Calls Dashboard');
        
        this.setupEventListeners();
        this.setupAutoRefresh();
        this.loadData();
    }

    setupEventListeners() {
        // Filter button listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target);
            });
        });

        // Refresh button listener
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData(true);
        });

        // Random search button listener
        document.getElementById('randomSearchBtn').addEventListener('click', () => {
            this.triggerRandomSearch();
        });

        // Table sorting listeners
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                this.handleSort(e.target.dataset.sort);
            });
        });

        // Error tooltip listeners (will be added dynamically)
        this.setupErrorTooltips();
    }

    setupAutoRefresh() {
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadData();
            }
        }, 30000);
        
        console.log('⏰ Auto-refresh enabled (30 seconds)');
    }

    handleFilterChange(button) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update current limit and reload data
        this.currentLimit = parseInt(button.dataset.limit);
        console.log(`🔄 Filter changed to: Last ${this.currentLimit} calls`);
        this.loadData(true);
    }

    async loadData(showLoader = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        if (showLoader) {
            this.showLoading();
        }

        try {
            console.log(`📊 Fetching last ${this.currentLimit} API calls...`);
            
            const response = await fetch(`/api/data/recent-calls?limit=${this.currentLimit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown API error');
            }

            this.currentData = result.data;
            this.renderTable();
            this.updateLastUpdated(result.timestamp);
            this.hideError();
            
            console.log(`✅ Loaded ${result.count} API calls`);
            
        } catch (error) {
            console.error('❌ Failed to load API calls:', error);
            this.showError(`Failed to load data: ${error.message}`);
            this.showNoData();
        } finally {
            this.isLoading = false;
        }
    }

    renderTable() {
        const tbody = document.getElementById('callsTableBody');
        
        if (!this.currentData || this.currentData.length === 0) {
            this.showNoData();
            return;
        }

        // Sort data if needed
        const sortedData = this.sortData(this.currentData);
        
        tbody.innerHTML = sortedData.map(call => this.createTableRow(call)).join('');
        
        // Re-setup error tooltips for new content
        this.setupErrorTooltips();
    }

    createTableRow(call) {
        return `
            <tr>
                <td>${call.call_time}</td>
                <td class="route-display">${call.route}</td>
                <td>${call.dates}</td>
                <td>
                    <span class="trip-type ${call.is_round_trip ? 'round-trip' : 'one-way'}">
                        <i class="fas ${call.is_round_trip ? 'fa-exchange-alt' : 'fa-arrow-right'}"></i>
                        ${call.trip_type}
                    </span>
                </td>
                <td>
                    <span class="route-type ${call.is_long_haul_route ? 'long-haul' : 'short-haul'}">
                        <i class="fas ${call.is_long_haul_route ? 'fa-globe' : 'fa-map-marker-alt'}"></i>
                        ${call.route_type}
                    </span>
                </td>
                <td>
                    <span class="flight-type ${(call.is_direct === null || call.is_direct === true) ? 'direct' : 'non-direct'}">
                        <i class="fas ${(call.is_direct === null || call.is_direct === true) ? 'fa-plane' : 'fa-route'}"></i>
                        ${call.flight_type}
                    </span>
                </td>
                <td>${call.duration}</td>
                <td>
                    <span class="${call.status_display.class}">
                        ${call.status_display.code}
                    </span>
                </td>
                <td class="error-cell" title="${call.error_message || 'No error'}">
                    ${call.error_display}
                </td>
            </tr>
        `;
    }

    sortData(data) {
        return [...data].sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            
            // Handle different data types
            if (this.sortColumn === 'created_at') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (this.sortColumn === 'duration') {
                aVal = parseFloat(a.elapsed_seconds) || 0;
                bVal = parseFloat(b.elapsed_seconds) || 0;
            } else if (this.sortColumn === 'status') {
                aVal = a.http_status || 0;
                bVal = b.http_status || 0;
            } else if (this.sortColumn === 'flight_type') {
                aVal = (a.is_direct === null || a.is_direct === true) ? 'direct' : 'non-direct';
                bVal = (b.is_direct === null || b.is_direct === true) ? 'direct' : 'non-direct';
            } else {
                // String comparison
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            // Toggle direction if same column
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Update sort icons
        this.updateSortIcons();
        
        // Re-render table with new sort
        this.renderTable();
        
        console.log(`🔄 Sorted by ${column} (${this.sortDirection})`);
    }

    updateSortIcons() {
        // Reset all sort icons
        document.querySelectorAll('th i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        // Update active sort icon
        const activeHeader = document.querySelector(`th[data-sort="${this.sortColumn}"] i`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
        }
    }

    setupErrorTooltips() {
        // Add enhanced tooltips for error cells
        document.querySelectorAll('.error-cell').forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const fullError = e.target.title;
                if (fullError && fullError !== 'No error' && fullError.length > 50) {
                    // Could implement a custom tooltip here for longer error messages
                    console.log('Full error:', fullError);
                }
            });
        });
    }

    showLoading() {
        const tbody = document.getElementById('callsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    <i class="fas fa-spinner"></i>
                    <div>Loading recent API calls...</div>
                </td>
            </tr>
        `;
    }

    showNoData() {
        const tbody = document.getElementById('callsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    <i class="fas fa-inbox"></i>
                    <div>No API calls found</div>
                    <small>Try making some flight monitoring requests</small>
                </td>
            </tr>
        `;
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

    async triggerRandomSearch() {
        const button = document.getElementById('randomSearchBtn');
        const originalText = button.innerHTML;
        
        try {
            // Disable button and show loading state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            
            console.log('🎲 Triggering random flight search...');
            
            const response = await fetch('/api/flights/monitor/random', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Random search failed');
            }
            
            console.log('✅ Random search completed:', result.data);
            
            // Show success state briefly
            button.innerHTML = '<i class="fas fa-check"></i> Success!';
            
            // Refresh the data to show the new record
            setTimeout(() => {
                this.loadData(true);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Random search failed:', error);
            
            // Show error state
            button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            
            // Show error message
            this.showError(`Random search failed: ${error.message}`);
            
        } finally {
            // Restore button after 2 seconds
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalText;
            }, 2000);
        }
    }

    destroy() {
        // Clean up auto-refresh when leaving page
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            console.log('🛑 Auto-refresh disabled');
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new RecentCallsDashboard();
});

// Clean up when leaving page
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecentCallsDashboard;
} 