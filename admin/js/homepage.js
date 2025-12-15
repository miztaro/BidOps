document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    fetchDashboardStats();
    initActivityChart(); // <--- Initialize the Graph

});

function updateDate() {
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// 1. Fetch Real KPI Stats
async function fetchDashboardStats() {
    try {
        // Updated to use the Node API path you provided
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            animateValue("pending-count", 0, data.stats.pending_listings, 1000);
            animateValue("report-count", 0, data.stats.open_reports, 1000);
            animateValue("user-count", 0, data.stats.active_users, 1000);
            animateValue("item-count", 0, data.stats.total_items, 1000);
        }
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// 2. Fetch Data & Render Chart
async function initActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();

        if (data.success) {
            // Process data for the last 7 days
            const labels = getLast7Days();
            
            // Map the server data (which might be sparse) to the last 7 days
            const itemData = mapDataToLabels(labels, data.chartData.items);
            const userData = mapDataToLabels(labels, data.chartData.users);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'New Listings',
                            data: itemData,
                            borderColor: '#00306e', // SLU Blue
                            backgroundColor: 'rgba(0, 48, 110, 0.1)',
                            borderWidth: 2,
                            tension: 0.4, // Curvy lines
                            fill: true
                        },
                        {
                            label: 'New Users',
                            data: userData,
                            borderColor: '#f59e0b', // Amber/Yellow
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error loading chart:", error);
    }
}

// Helper: Get array of dates for x-axis (Last 7 Days)
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Format: YYYY-MM-DD for matching, but show MM/DD
        dates.push(d.toISOString().split('T')[0]); 
    }
    return dates;
}

// Helper: Match DB results to the 7-day array
function mapDataToLabels(labels, dbData) {
    // Create a map for fast lookup: "2023-10-01" -> 5
    const dataMap = {};
    dbData.forEach(item => {
        // Ensure date format matches YYYY-MM-DD
        const dateKey = new Date(item.date).toISOString().split('T')[0];
        dataMap[dateKey] = item.count;
    });

    // Return array of counts matching the labels order
    return labels.map(date => dataMap[date] || 0);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
