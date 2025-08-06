// File Handling Module
let selectedFile = null;
let workbook = null;
let sovItems = [];

// Make selectedFile and sovItems globally accessible
window.selectedFile = selectedFile;
window.sovItems = sovItems;

// File Handling
function initializeFileHandling() {
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    console.log('File selected:', file.name, file.size, 'bytes');
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        selectedFile = file;
        window.selectedFile = selectedFile; // Update global reference
        document.getElementById('fileInfo').innerHTML = `<strong>✓ Loaded:</strong> ${file.name}`;
        document.getElementById('dropZone').classList.add('file-selected');
        document.getElementById('nextBtn').disabled = false;
        
        // Read file
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File read successfully, size:', e.target.result.byteLength);
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, {type: 'array', cellDates: true});
            console.log('Workbook created, sheets:', workbook.SheetNames);
        };
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
    }
}

// Function to check if file is selected (for validation)
function isFileSelected() {
    return selectedFile !== null;
}

// Process Excel File with specific SOV format
function processFile() {
    if (!workbook) {
        console.error('No workbook available');
        return;
    }
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log('Processing sheet:', workbook.SheetNames[0]);
    
    // Log some sample data to understand the structure
    console.log('Sample cell data:');
    for (let row = 1; row <= 10; row++) {
        const rowData = {};
        for (let col = 'A'; col <= 'G'; col++) {
            const cellValue = getCellValue(firstSheet, col, row);
            if (cellValue) rowData[col] = cellValue;
        }
        if (Object.keys(rowData).length > 0) {
            console.log(`Row ${row}:`, rowData);
        }
    }
    
    sovItems = [];
    window.sovItems = sovItems; // Update global reference
    let itemId = 0;
    
    // Debug: Log the sheet data to understand the structure
    console.log('Processing Excel file...');
    console.log('Sheet names:', workbook.SheetNames);
    
    // Process main section - look for data starting from row 6 (headers) and data from row 7
    // Based on the screenshot, columns are: A=Prime Key, B=Unit #, C=Description, D=Unit of Mea, E=Unit Cost, F=Estimated Quantity, G=Contract Cost
    for (let row = 7; row <= 200; row++) { // Check up to row 200
        const primeKey = getCellValue(firstSheet, 'A', row);
        const unitNumber = getCellValue(firstSheet, 'B', row);
        const description = getCellValue(firstSheet, 'C', row);
        const unitOfMeasure = getCellValue(firstSheet, 'D', row);
        const unitCost = parseFloat(getCellValue(firstSheet, 'E', row) || 0);
        const estimatedQty = parseFloat(getCellValue(firstSheet, 'F', row) || 0);
        const contractCost = parseFloat(getCellValue(firstSheet, 'G', row) || 0);
        
        // Log any row with data
        if (description || unitCost > 0 || contractCost > 0) {
            console.log(`Row ${row} data:`, {
                primeKey, unitNumber, description, unitOfMeasure, 
                unitCost, estimatedQty, contractCost
            });
        }
        
        // Only include if we have a description AND (estimated quantity > 0 OR contract cost > 0)
        if (description && (estimatedQty > 0 || contractCost > 0)) {
            // Calculate this billing value
            let thisBillingValue = 0;
            let thisBillingQty = 0;
            
            if (contractCost > 0) {
                // If contract cost is available, use it
                thisBillingValue = contractCost;
                thisBillingQty = estimatedQty > 0 ? estimatedQty : 1;
            } else if (unitCost > 0 && estimatedQty > 0) {
                // If no contract cost but we have unit cost and quantity
                thisBillingValue = unitCost * estimatedQty;
                thisBillingQty = estimatedQty;
            }
            
            // Only add if we have a valid billing value
            if (thisBillingValue > 0) {
                sovItems.push({
                    id: ++itemId,
                    section: 'Main',
                    lineNumber: row,
                    primeKey: primeKey || '',
                    unit: unitNumber || '',
                    description: description || `Line ${row}`,
                    unitOfMeasure: unitOfMeasure || '',
                    unitCost: unitCost,
                    estimatedQuantity: estimatedQty,
                    contractValue: contractCost,
                    thisBilling: thisBillingQty,
                    thisBillingValue: thisBillingValue,
                    assigned: false
                });
            }
        }
    }
    
    // Process Pass-Throughs section (starting around row 198 based on screenshot)
    // Columns: A=Item Number, B=Description, C=Description (same as B), F=Markup, G=Contract Cost
    console.log('Processing Pass-Throughs section...');
    for (let row = 180; row <= 350; row++) { // Expanded range to catch all pass-through items
        const itemNumber = getCellValue(firstSheet, 'A', row);
        const description = getCellValue(firstSheet, 'B', row) || getCellValue(firstSheet, 'C', row);
        const markup = getCellValue(firstSheet, 'F', row);
        const contractCost = parseFloat(getCellValue(firstSheet, 'G', row) || 0);
        
        // Log all rows with any data to see what we're finding
        if (itemNumber || description || markup || contractCost > 0) {
            console.log(`Row ${row} pass-through data:`, {
                itemNumber, description, markup, contractCost
            });
        }
        
        // Look for the "Pass-Throughs" header or actual pass-through items
        if (description) {
            // Check if this is the "Pass-Throughs" header
            if (description.toLowerCase().includes('pass-throughs')) {
                console.log(`Found Pass-Throughs header at row ${row}`);
                continue; // Skip the header row
            }
            
            // More flexible pass-through detection:
            // 1. Has a numeric item number OR
            // 2. Has a description and contract cost > 0
            const hasNumericItemNumber = itemNumber && !isNaN(parseInt(itemNumber));
            const hasContractCost = contractCost > 0;
            
            if ((hasNumericItemNumber && hasContractCost) || (description && hasContractCost)) {
                console.log(`Found pass-through item at row ${row}:`, {
                    itemNumber, description, markup, contractCost
                });
                
                sovItems.push({
                    id: ++itemId,
                    section: 'Pass-Through',
                    lineNumber: row,
                    primeKey: itemNumber || `PT-${row}`,
                    pcoNumber: itemNumber || `PT-${row}`,
                    description: description || `Pass-Through Item ${itemNumber || row}`,
                    contractValue: contractCost,
                    markup: markup || '',
                    thisBilling: 1, // Pass-throughs are typically billed as 1 unit
                    thisBillingValue: contractCost,
                    assigned: false
                });
            } else {
                console.log(`Skipping row ${row} - itemNumber: "${itemNumber}", contractCost: ${contractCost}`);
            }
        }
    }
    
    // Update global reference after populating
    window.sovItems = sovItems;
    
    console.log('Processed items:', sovItems.length);
    console.log('Sample items:', sovItems.slice(0, 3));
    
    // Initialize default activities based on items found
    initializeActivities();
    
    // Display items
    displayItems();
    updateStats();
}

function displayItems() {
    console.log('displayItems called with', sovItems.length, 'items');
    
    const container = document.getElementById('itemsList');
    if (!container) {
        console.error('Items list container not found');
        return;
    }
    
    container.innerHTML = '';
    
    let currentSection = '';
    
    sovItems.forEach((item, index) => {
        console.log(`Displaying item ${index + 1}:`, item);
        
        // Add section divider if section changes
        if (item.section !== currentSection) {
            currentSection = item.section;
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            divider.textContent = currentSection === 'Pass-Through' ? 'Pass-Through Items' : 'Main Contract Items';
            container.appendChild(divider);
        }
        
        const itemEl = document.createElement('div');
        itemEl.className = `sov-item ${item.assigned ? 'assigned' : ''}`;
        itemEl.draggable = !item.assigned;
        itemEl.dataset.itemId = item.id;
        itemEl.ondragstart = (e) => dragStart(e);
        itemEl.ondragend = (e) => dragEnd(e);
        
        let itemHeader = '';
        if (item.section === 'Pass-Through') {
            itemHeader = `
                <div class="item-header">
                    <span class="item-number">
                        ${item.pcoNumber ? `PT #${item.pcoNumber}` : `Line ${item.lineNumber}`}
                        <span class="pass-through-badge">PT</span>
                    </span>
                    <span class="item-amount">${formatCurrency(item.thisBillingValue)}</span>
                </div>
                <div class="item-description">${item.description}</div>
                <div class="item-details">
                    <span>Contract: ${formatCurrency(item.contractValue)}</span>
                    <span>Markup: ${item.markup || 'N/A'}</span>
                </div>
            `;
        } else {
            itemHeader = `
                <div class="item-header">
                    <span class="item-number">${item.unit || `Line ${item.lineNumber}`}</span>
                    <span class="item-amount">${formatCurrency(item.thisBillingValue)}</span>
                </div>
                <div class="item-description">${item.description}</div>
                <div class="item-details">
                    <span>Unit: ${item.unitOfMeasure || 'EA'}</span>
                    <span>Qty: ${item.thisBilling}</span>
                    <span>Rate: ${formatCurrency(item.unitCost)}</span>
                </div>
            `;
        }
        
        itemEl.innerHTML = itemHeader;
        container.appendChild(itemEl);
    });
    
    console.log('Finished displaying items. Container now has', container.children.length, 'children');
}

function updateStats() {
    const totalItems = window.sovItems.length;
    const mappedItems = window.sovItems.filter(item => item.assigned).length;
    const totalValue = window.sovItems.reduce((sum, item) => sum + item.thisBillingValue, 0);
    
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('mappedItemsCount').textContent = mappedItems;
    document.getElementById('totalValueCount').textContent = formatCurrency(totalValue);
} 