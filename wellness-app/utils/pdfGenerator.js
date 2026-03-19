import puppeteer from 'puppeteer';

/**
 * Generate PDF report using Puppeteer
 * @param {object} data - Report data
 * @param {string} type - Report type (customer, business, therapist)
 * @param {string} title - Report title
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDF = async (data, type, title) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();

        // Create clean HTML template based on report type
        let contentHTML = '';

        if (type === 'customer') {
            contentHTML = generateCustomerHTML(data);
        } else if (type === 'business') {
            contentHTML = generateBusinessHTML(data);
        } else if (type === 'therapist') {
            contentHTML = generateTherapistHTML(data);
        }

        const html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 30px;
                        color: #333;
                    }
                    h1 { 
                        color: #2c3e50;
                        border-bottom: 3px solid #3498db;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #34495e;
                        margin-top: 30px;
                    }
                    .card { 
                        margin: 12px 0; 
                        padding: 15px; 
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .stat-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-item {
                        padding: 12px;
                        background-color: #ecf0f1;
                        border-radius: 5px;
                    }
                    .stat-label {
                        font-size: 12px;
                        color: #7f8c8d;
                        margin-bottom: 5px;
                    }
                    .stat-value {
                        font-size: 18px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 12px;
                        text-align: left;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #ddd;
                    }
                    tr:nth-child(even) {
                        background-color: #f5f5f5;
                    }
                    .no-data {
                        text-align: center;
                        color: #95a5a6;
                        font-style: italic;
                        padding: 20px;
                    }
                    .header-date {
                        color: #7f8c8d;
                        font-size: 14px;
                        margin-bottom: 30px;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="header-date">Generated on: ${new Date().toLocaleString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                })}</div>
                
                ${contentHTML}
            </body>
            </html>
        `;

        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
};

/**
 * Generate customer HTML content
 */
const generateCustomerHTML = (data) => {
    return `
        <h2>Overview</h2>
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${data.totalBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Completed Bookings</div>
                <div class="stat-value">${data.completedBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Cancelled Bookings</div>
                <div class="stat-value">${data.cancelledBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Spent</div>
                <div class="stat-value">₹${(data.totalSpent || 0).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Discount Used</div>
                <div class="stat-value">₹${(data.totalDiscountUsed || 0).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Most Booked Service</div>
                <div class="stat-value">${data.mostBookedService || 'N/A'}</div>
            </div>
        </div>

        <h2>Recent Bookings</h2>
        ${data.recentBookings && data.recentBookings.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Therapist</th>
                        <th>Date</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.recentBookings.map(booking => `
                        <tr>
                            <td>${booking.serviceName || 'N/A'}</td>
                            <td>${booking.therapistName || 'N/A'}</td>
                            <td>${new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>₹${(booking.finalPrice || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<div class="no-data">No recent bookings found.</div>'}
    `;
};

/**
 * Generate business HTML content
 */
const generateBusinessHTML = (data) => {
    return `
        <h2>Overview</h2>
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-label">Total Services</div>
                <div class="stat-value">${data.totalServices || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Therapists</div>
                <div class="stat-value">${data.totalTherapists || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${data.totalBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Completed Bookings</div>
                <div class="stat-value">${data.completedBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Cancelled Bookings</div>
                <div class="stat-value">${data.cancelledBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">₹${(data.totalRevenue || 0).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Most Booked Service</div>
                <div class="stat-value">${data.mostBookedService || 'N/A'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Top Therapist</div>
                <div class="stat-value">${data.topTherapist?.name || 'N/A'}</div>
            </div>
        </div>

        <h2>Monthly Revenue</h2>
        ${data.monthlyRevenue && data.monthlyRevenue.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.monthlyRevenue.slice(0, 12).map(month => `
                        <tr>
                            <td>${new Date(month.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</td>
                            <td>₹${(month.revenue || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<div class="no-data">No revenue data available.</div>'}
    `;
};

/**
 * Generate therapist HTML content
 */
const generateTherapistHTML = (data) => {
    return `
        <h2>Overview</h2>
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${data.totalBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Completed Bookings</div>
                <div class="stat-value">${data.completedBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Cancelled Bookings</div>
                <div class="stat-value">${data.cancelledBookings || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Earnings</div>
                <div class="stat-value">₹${(data.totalEarnings || 0).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Services Performed</div>
                <div class="stat-value">${data.totalServicesDone || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Monthly Cancellations</div>
                <div class="stat-value">${data.monthlyCancelCount || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Bonus/Penalty</div>
                <div class="stat-value">${data.bonusPenaltyPercentage >= 0 ? '+' : ''}${data.bonusPenaltyPercentage || 0}%</div>
            </div>
        </div>

        <h2>Recent Bookings</h2>
        ${data.recentBookings && data.recentBookings.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Earnings</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.recentBookings.map(booking => `
                        <tr>
                            <td>${booking.serviceName || 'N/A'}</td>
                            <td>${booking.customerName || 'N/A'}</td>
                            <td>${new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>₹${(booking.earnings || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<div class="no-data">No recent bookings found.</div>'}
    `;
};

export { generatePDF };
