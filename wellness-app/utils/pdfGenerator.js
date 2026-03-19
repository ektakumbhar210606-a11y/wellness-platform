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
    // Check if we have selectedFields array or direct data
    const reportData = data.selectedFields || data;
    
    let html = `
        <h2>Overview Statistics</h2>
        <div class="stat-grid">
            ${reportData.totalServices !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Total Services</div>
                <div class="stat-value">${reportData.totalServices || 0}</div>
            </div>
            ` : ''}
            
            ${reportData.totalTherapists !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Total Therapists</div>
                <div class="stat-value">${reportData.totalTherapists || 0}</div>
            </div>
            ` : ''}
            
            ${reportData.totalBookings !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${reportData.totalBookings || 0}</div>
            </div>
            ` : ''}
            
            ${reportData.completedBookings !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Completed Bookings</div>
                <div class="stat-value">${reportData.completedBookings || 0}</div>
            </div>
            ` : ''}
            
            ${reportData.cancelledBookings !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Cancelled Bookings</div>
                <div class="stat-value">${reportData.cancelledBookings || 0}</div>
            </div>
            ` : ''}
            
            ${reportData.totalRevenue !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">₹${(reportData.totalRevenue || 0).toFixed(2)}</div>
            </div>
            ` : ''}
            
            ${reportData.mostBookedService !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Most Booked Service</div>
                <div class="stat-value">${reportData.mostBookedService || 'N/A'}</div>
            </div>
            ` : ''}
            
            ${reportData.topTherapist !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">Top Therapist</div>
                <div class="stat-value">${reportData.topTherapist?.name || 'N/A'} (${reportData.topTherapist?.bookings || 0} bookings)</div>
            </div>
            ` : ''}
        </div>
    `;

    // Detailed Services Report
    if (reportData.services && reportData.services.length > 0) {
        html += `
            <h2>Detailed Services Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service Name</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.services.map(service => `
                        <tr>
                            <td>${service.name || 'N/A'}</td>
                            <td>₹${(service.price || 0).toFixed(2)}</td>
                            <td>${service.duration ? service.duration + ' mins' : 'N/A'}</td>
                            <td>${service.description || 'No description'}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                        <th>₹${reportData.services.reduce((sum, s) => sum + (s.price || 0), 0).toFixed(2)}</th>
                        <th></th>
                        <th></th>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    // Detailed Therapists Report
    if (reportData.therapists && reportData.therapists.length > 0) {
        html += `
            <h2>Detailed Therapists Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Therapist Name</th>
                        <th>Specialization</th>
                        <th>Total Bookings</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.therapists.map(therapist => `
                        <tr>
                            <td>${therapist.name || 'N/A'}</td>
                            <td>${therapist.specialization || 'Not specified'}</td>
                            <td>${therapist.totalBookings || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                        <th></th>
                        <th>${reportData.therapists.reduce((sum, t) => sum + (t.totalBookings || 0), 0)}</th>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    // Detailed Bookings Report
    if (reportData.bookings && reportData.bookings.length > 0) {
        const completedCount = reportData.bookings.filter(b => b.status === 'completed').length;
        const cancelledCount = reportData.bookings.filter(b => b.status === 'cancelled').length;
        const totalPrice = reportData.bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        html += `
            <h2>Detailed Bookings Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Therapist</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.bookings.slice(0, 50).map(booking => {
                        const statusColor = booking.status === 'completed' ? '#27ae60' : 
                                          booking.status === 'cancelled' ? '#e74c3c' : 
                                          booking.status === 'confirmed' ? '#2980b9' : '#f39c12';
                        return `
                            <tr>
                                <td>${booking.serviceName || 'N/A'}</td>
                                <td>${booking.customerName || 'N/A'}</td>
                                <td>${booking.therapistName || 'N/A'}</td>
                                <td>${new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td style="color: ${statusColor}; font-weight: bold;">${(booking.status || 'pending').toUpperCase()}</td>
                                <td>₹${(booking.finalPrice || 0).toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="3">Summary</th>
                        <th>${reportData.bookings.length} bookings</th>
                        <th>✓ ${completedCount} | ✗ ${cancelledCount}</th>
                        <th>₹${totalPrice.toFixed(2)}</th>
                    </tr>
                </tfoot>
            </table>
            ${reportData.bookings.length > 50 ? '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Showing first 50 bookings only</p>' : ''}
        `;
    }

    // Revenue by Service Analysis
    if (reportData.revenueByService && reportData.revenueByService.length > 0) {
        const totalBookings = reportData.revenueByService.reduce((sum, item) => sum + item.bookings, 0);
        const totalRevenue = reportData.revenueByService.reduce((sum, item) => sum + item.revenue, 0);
        
        html += `
            <h2>Revenue by Service Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service Name</th>
                        <th>Total Bookings</th>
                        <th>Total Revenue</th>
                        <th>Average per Booking</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.revenueByService.map(item => `
                        <tr>
                            <td>${item.serviceName || 'N/A'}</td>
                            <td>${item.bookings || 0}</td>
                            <td>₹${(item.revenue || 0).toFixed(2)}</td>
                            <td>₹${(item.bookings > 0 ? (item.revenue / item.bookings) : 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                        <th>${totalBookings}</th>
                        <th>₹${totalRevenue.toFixed(2)}</th>
                        <th>₹${(totalRevenue / totalBookings || 0).toFixed(2)}</th>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    // Monthly Revenue
    if (reportData.monthlyRevenue && reportData.monthlyRevenue.length > 0) {
        html += `
            <h2>Monthly Revenue Trend</h2>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.monthlyRevenue.slice(0, 12).map(month => `
                        <tr>
                            <td>${new Date(month.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</td>
                            <td>₹${(month.revenue || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    return html;
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
