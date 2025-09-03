/**
 * Output Generation and Export Module
 * 
 * This module handles the creation of formatted HCSS notes from mapped SOV items and activities.
 * It generates both visual summaries and text-based outputs suitable for billing and documentation.
 * Supports multiple export formats including clipboard copy and file download.
 */

/**
 * Main output generation function that creates both activity summary and formatted text output
 * Processes all mapped activities and generates comprehensive billing documentation
 */
function generateOutput() {
    const contractor = document.getElementById('contractorSelect').value;
    const date = document.getElementById('dateInput').value;
    
    // Generate visual activity summary for user review
    generateActivitySummary();
    
    // Generate formatted text output for HCSS system
    const output = formatOutput(contractor, date);
    document.getElementById('outputText').value = output;
}

/**
 * Creates a visual summary of all activities and their assigned items
 * Displays activity names, totals, and item descriptions for user verification
 */
function generateActivitySummary() {
    const summaryDiv = document.getElementById('activitySummary');
    summaryDiv.innerHTML = '';
    
    let grandTotal = 0;
    
    // Process each activity group to build summary
    document.querySelectorAll('.activity-group').forEach(activityGroup => {
        const activityName = activityGroup.querySelector('.activity-name-input').value || 'Unnamed Activity';
        const activityItems = activityGroup.querySelector('.activity-items');
        const items = activityItems.querySelectorAll('.sov-item');
        
        if (items.length === 0) return; // Skip empty activities
        
        let activityTotal = 0;
        let itemsList = [];
        
        // Process each item in the activity
        items.forEach(itemEl => {
            const itemId = parseInt(itemEl.dataset.itemId);
            const item = window.sovItems.find(i => i.id === itemId);
            if (item) {
                // Include all items in activity total (including PCO items)
                activityTotal += item.thisBillingValue;
                
                // Generate descriptive text for each item based on section type
                let itemDesc = '';
                if (item.section === 'Pass-Through' && item.pcoNumber) {
                    itemDesc = `Pass-Through #${item.pcoNumber}`;
                } else if (item.section === 'PCO' && item.pcoNumber) {
                    itemDesc = `PCO #${item.pcoNumber}`;
                } else {
                    // Use Unit # instead of line number for main contract items
                    itemDesc = item.unit || `Line ${item.lineNumber}`;
                }
                itemsList.push(`• ${itemDesc}: ${item.description.substring(0, 30)}`);
            }
        });
        
        grandTotal += activityTotal;
        
        // Create activity summary element
        const summaryEl = document.createElement('div');
        summaryEl.className = 'activity-summary';
        summaryEl.innerHTML = `
            <div class="activity-summary-header">
                <span class="activity-summary-name">${activityName}</span>
                <span class="activity-summary-total">${formatCurrency(activityTotal)}</span>
            </div>
            <div class="activity-summary-items">
                ${itemsList.join('<br>')}
            </div>
        `;
        summaryDiv.appendChild(summaryEl);
    });
    
    // Add grand total summary at the bottom
    const totalEl = document.createElement('div');
    totalEl.style.marginTop = '15px';
    totalEl.style.paddingTop = '15px';
    totalEl.style.borderTop = '2px solid #e0e0e0';
    totalEl.style.fontWeight = 'bold';
    totalEl.style.fontSize = '16px';
    totalEl.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <span>SOV Total:</span>
            <span style="color: #0090DA;">${formatCurrency(grandTotal)}</span>
        </div>
    `;
    summaryDiv.appendChild(totalEl);
}

/**
 * Generates formatted text output suitable for HCSS billing system
 * Creates structured notes with proper formatting and line wrapping
 * @param {string} contractor - Selected contractor name
 * @param {string} date - Selected note date
 * @returns {string} Formatted text output
 */
function formatOutput(contractor, date) {
    const maxWidth = 95; // Maximum line width for HCSS compatibility
    let output = [];
    
    // Format date according to HCSS requirements
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-us", {
        timeZone: 'UTC',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
    
    // Generate document header with title and separator lines
    output.push('='.repeat(maxWidth));
    output.push(centerText('STATEMENT OF VALUES - ACTIVITY SUMMARY', maxWidth));
    output.push('='.repeat(maxWidth));
    output.push('');
    
    // Use default values for output configuration
    const separateActivities = true; // Always separate activities for clarity
    const includeGrandTotal = true; // Always include grand total for billing accuracy
    
    let grandTotal = 0;
    
    // Process each activity to generate formatted output
    document.querySelectorAll('.activity-group').forEach(activityGroup => {
        const activityName = activityGroup.querySelector('.activity-name-input').value || 'Unnamed Activity';
        const activityItems = activityGroup.querySelector('.activity-items');
        const items = activityItems.querySelectorAll('.sov-item');
        
        if (items.length === 0) return; // Skip empty activities
        
        let activityTotal = 0;
        
        // Activity header section
        output.push('');
        output.push(`ACTIVITY: ${activityName} HCSS Note`);
        output.push('-'.repeat(40));
        output.push('');
        output.push(`Date: ${formattedDate}`);
        output.push('='.repeat(maxWidth));
        output.push(`Per ${contractor} SOV:`);
        
        // Process each item in the activity
        items.forEach(itemEl => {
            const itemId = parseInt(itemEl.dataset.itemId);
            const item = window.sovItems.find(i => i.id === itemId);
            if (item) {
                // Include all items in activity total (including PCO items)
                activityTotal += item.thisBillingValue;
                
                // Generate formatted line based on item section type
                let line = '';
                if (item.section === 'Pass-Through') {
                    line = item.pcoNumber 
                        ? `Pass-Through #${item.pcoNumber}: ${item.description}`
                        : `PT Line ${item.lineNumber}: ${item.description}`;
                    line += ` | ${formatCurrency(item.thisBillingValue)}`;
                } else if (item.section === 'PCO') {
                    line = item.pcoNumber 
                        ? `PCO #${item.pcoNumber}: ${item.description}`
                        : `PCO Line ${item.lineNumber}: ${item.description}`;
                    line += ` | Qty: ${item.thisBilling} ${item.unitOfMeasure || 'EA'}`;
                    line += ` | ${formatCurrency(item.thisBillingValue)}`;
                } else {
                    // Format main contract items with unit information
                    const unitNumber = item.unit || `Line ${item.lineNumber}`;
                    line = `${unitNumber}: ${item.description}`;
                    line += ` | Qty: ${item.thisBilling} ${item.unitOfMeasure || 'EA'}`;
                    line += ` | ${formatCurrency(item.thisBillingValue)}`;
                }
                
                // Handle line wrapping with proper indentation for readability
                const lines = wrapText(line, maxWidth);
                if (lines.length > 1) {
                    // First line is fine, but subsequent lines need proper indentation
                    output.push(lines[0]);
                    for (let i = 1; i < lines.length; i++) {
                        // Find the position where the description starts and indent to that position
                        const firstLine = lines[0];
                        const colonIndex = firstLine.indexOf(':');
                        if (colonIndex !== -1) {
                            const indentSpaces = colonIndex + 2; // +2 for ": "
                            output.push(' '.repeat(indentSpaces) + lines[i]);
                        } else {
                            output.push('  ' + lines[i]); // Fallback indentation
                        }
                    }
                } else {
                    output.push(...lines);
                }
            }
        });
        
        // Activity total section
        output.push('='.repeat(40));
        output.push(`Total: ${formatCurrency(activityTotal)}`);
        
        grandTotal += activityTotal;
        
        if (separateActivities) {
            output.push('');
        }
    });
    
    // Grand total section for overall billing summary
    if (includeGrandTotal) {
        output.push('');
        output.push('='.repeat(maxWidth));
        output.push(`SOV TOTAL: ${formatCurrency(grandTotal)}`);
        output.push('='.repeat(maxWidth));
    }
    
    return output.join('\n');
}

/**
 * Regenerates the output when called
 * Useful for refreshing output after activity or item changes
 */
function regenerateOutput() {
    generateOutput();
}

/**
 * Copies the formatted output to the system clipboard
 * Provides user feedback with success message
 */
function copyToClipboard() {
    const outputText = document.getElementById('outputText');
    outputText.select();
    document.execCommand('copy');
    
    // Show success message
    const successMsg = document.getElementById('copySuccess');
    successMsg.style.display = 'inline';
    setTimeout(() => successMsg.style.display = 'none', 2000);
}

/**
 * Downloads the formatted output as a text file
 * Creates a file with contractor and date information in the filename
 */
function downloadNote() {
    const text = document.getElementById('outputText').value;
    const contractor = document.getElementById('contractorSelect').value;
    const date = document.getElementById('dateInput').value;
    
    // Create downloadable blob with formatted text
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOV_Activities_${contractor}_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}