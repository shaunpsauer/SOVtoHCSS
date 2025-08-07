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
    console.log('handleFileSelect called');
    const file = event.target.files[0];
    console.log('File from input:', file);
    if (file) handleFile(file);
}

function handleFile(file) {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File selected:', file.name, file.size, 'bytes');
    console.log('File type:', file.type);
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('File is valid Excel format');
        selectedFile = file;
        window.selectedFile = selectedFile; // Update global reference
        document.getElementById('fileInfo').innerHTML = `<strong>✓ Loaded:</strong> ${file.name}`;
        document.getElementById('dropZone').classList.add('file-selected');
        document.getElementById('nextBtn').disabled = false;
        
        // Read file
        console.log('Starting file read...');
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File read successfully, size:', e.target.result.byteLength);
            const data = new Uint8Array(e.target.result);
            try {
                workbook = XLSX.read(data, {type: 'array', cellDates: true});
                console.log('Workbook created successfully');
                console.log('Sheet names:', workbook.SheetNames);
                
                // Auto-process the file
                setTimeout(() => {
                    console.log('Auto-processing file...');
                    processFile();
                }, 100);
                
            } catch (error) {
                console.error('Error parsing workbook:', error);
                alert('Error reading the Excel file. It might be corrupted or password protected.');
            }
        };
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
            alert('Error reading the file. Please try again.');
        };
        reader.readAsArrayBuffer(file);
    } else {
        console.log('File is not valid Excel format');
        alert('Please select a valid Excel file (.xlsx or .xls)');
    }
}

// Function to check if file is selected (for validation)
function isFileSelected() {
    return selectedFile !== null;
}

// Process Excel File with specific SOV format
function processFile() {
    console.log('=== PROCESS FILE DEBUG ===');
    
    if (!workbook) {
        console.error('No workbook available');
        return;
    }
    
    // Look for the "Unit Breakdown" sheet specifically
    const targetSheetName = "Unit Breakdown";
    let targetSheet = null;
    
    console.log('Available sheets:', workbook.SheetNames);
    
    // Check if "Unit Breakdown" sheet exists
    if (workbook.SheetNames.includes(targetSheetName)) {
        targetSheet = workbook.Sheets[targetSheetName];
        console.log(`Found target sheet: "${targetSheetName}"`);
    } else {
        console.error(`Sheet "${targetSheetName}" not found. Available sheets:`, workbook.SheetNames);
        alert(`Sheet "${targetSheetName}" not found in the workbook. Please ensure your SOV file contains a sheet named "Unit Breakdown".`);
        return;
    }
    
    console.log('Processing sheet:', targetSheetName);
    console.log('Sheet range:', targetSheet['!ref']);
    console.log('Total cells in sheet:', Object.keys(targetSheet).filter(key => key !== '!ref').length);
    
    // Log sample data from different rows to understand structure
    console.log('Sample data from first 20 rows:');
    for (let row = 1; row <= 20; row++) {
        const rowData = {};
        for (let col = 'A'; col <= 'G'; col++) {
            const cellValue = getCellValue(targetSheet, col, row);
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                rowData[col] = cellValue;
            }
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
        const primeKey = getCellValue(targetSheet, 'A', row);
        const unitNumber = getCellValue(targetSheet, 'B', row);
        const description = getCellValue(targetSheet, 'C', row);
        const unitOfMeasure = getCellValue(targetSheet, 'D', row);
        const unitCost = parseFloat(getCellValue(targetSheet, 'E', row) || 0);
        const estimatedQty = parseFloat(getCellValue(targetSheet, 'F', row) || 0);
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0);
        
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
        const itemNumber = getCellValue(targetSheet, 'A', row);
        const description = getCellValue(targetSheet, 'B', row) || getCellValue(targetSheet, 'C', row);
        const markup = getCellValue(targetSheet, 'F', row);
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0);
        
        // Log all rows with any data to see what we're finding
        if (itemNumber || description || markup || contractCost > 0) {
            console.log(`Row ${row} pass-through data:`, {
                itemNumber, description, markup, contractCost
            });
        }
        
        // Look for the "Pass-Throughs" header or actual pass-through items
        if (description) {
            // Check if this is the "Pass-Throughs" header
            if (typeof description === 'string' && description.toLowerCase().includes('pass-throughs')) {
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
                    description: String(description) || `Pass-Through Item ${itemNumber || row}`,
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
    
    // Process PCOs section (Project Change Orders)
    console.log('Processing PCOs section...');
    console.log('Searching rows 205-300 for PCO data...');
    
    for (let row = 205; row <= 300; row++) { // Correct range based on Excel structure
        const pcoNumber = getCellValue(targetSheet, 'B', row); // PCO # is in column B
        const description = getCellValue(targetSheet, 'C', row); // Description is in column C
        const unitOfMeasure = getCellValue(targetSheet, 'D', row); // Unit of Mea is in column D
        const unitCost = parseFloat(getCellValue(targetSheet, 'E', row) || 0); // Unit Cost is in column E
        const estimatedQty = parseFloat(getCellValue(targetSheet, 'F', row) || 0); // Estimated Quantity is in column F
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0); // Contract Cost is in column G
        
        // Log all rows with any data to see what we're finding
        if (pcoNumber || description || unitCost > 0 || estimatedQty > 0 || contractCost > 0) {
            console.log(`Row ${row} PCO data:`, {
                pcoNumber, description, unitOfMeasure, unitCost, estimatedQty, contractCost
            });
        }
        
        // Look for the "Change Orders" header or actual PCO items
        if (description) {
            // Check if this is the "Change Orders" header
            if (typeof description === 'string' && description.toLowerCase().includes('change order')) {
                console.log(`Found Change Orders header at row ${row}: "${description}"`);
                continue; // Skip the header row
            }
            
            // PCO detection: Has a PCO number and description and either contract cost > 0 or (unit cost > 0 and quantity > 0)
            const hasPcoNumber = pcoNumber && !isNaN(parseInt(pcoNumber));
            const hasContractCost = contractCost > 0;
            const hasUnitCostAndQty = unitCost > 0 && estimatedQty > 0;
            
            console.log(`Row ${row} PCO check:`, {
                description: description,
                pcoNumber: pcoNumber,
                hasPcoNumber: hasPcoNumber,
                hasContractCost: hasContractCost,
                hasUnitCostAndQty: hasUnitCostAndQty,
                contractCost: contractCost,
                unitCost: unitCost,
                estimatedQty: estimatedQty
            });
            
            if (description && hasPcoNumber && (hasContractCost || hasUnitCostAndQty)) {
                console.log(`Found PCO item at row ${row}:`, {
                    pcoNumber, description, unitOfMeasure, unitCost, estimatedQty, contractCost
                });
                
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
                    console.log(`Adding PCO item with billing value: ${thisBillingValue}`);
                    sovItems.push({
                        id: ++itemId,
                        section: 'PCO',
                        lineNumber: row,
                        primeKey: pcoNumber || `PCO-${row}`,
                        pcoNumber: pcoNumber || `PCO-${row}`,
                        description: String(description) || `PCO Item ${pcoNumber || row}`,
                        unitOfMeasure: unitOfMeasure || '',
                        unitCost: unitCost,
                        estimatedQuantity: estimatedQty,
                        contractValue: contractCost,
                        thisBilling: thisBillingQty,
                        thisBillingValue: thisBillingValue,
                        assigned: false
                    });
                } else {
                    console.log(`Skipping PCO row ${row} - no valid billing value calculated`);
                }
            } else {
                console.log(`Skipping PCO row ${row} - description: "${description}", pcoNumber: "${pcoNumber}", contractCost: ${contractCost}, unitCost: ${unitCost}, qty: ${estimatedQty}`);
            }
        }
    }
    
    console.log(`PCO processing complete. Found ${sovItems.filter(item => item.section === 'PCO').length} PCO items.`);
    
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
            
            // Set appropriate section title based on section type
            let sectionTitle = '';
            switch (item.section) {
                case 'Pass-Through':
                    sectionTitle = 'Pass-Through Items';
                    break;
                case 'PCO':
                    sectionTitle = 'PCO Items';
                    break;
                default:
                    sectionTitle = 'Main Contract Items';
                    break;
            }
            
            divider.textContent = sectionTitle;
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
        } else if (item.section === 'PCO') {
            itemHeader = `
                <div class="item-header">
                    <span class="item-number">
                        ${item.pcoNumber ? `PCO #${item.pcoNumber}` : `Line ${item.lineNumber}`}
                        <span class="pco-badge">PCO</span>
                    </span>
                    <span class="item-amount">${formatCurrency(item.thisBillingValue)}</span>
                </div>
                <div class="item-description">${item.description}</div>
                <div class="item-details">
                    <span>Unit: ${item.unitOfMeasure || 'EA'}</span>
                    <span>Qty: ${item.thisBilling}</span>
                    <span>Rate: ${formatCurrency(item.unitCost)}</span>
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
    // Exclude PCO items from the total value calculation
    const totalValue = window.sovItems
        .filter(item => item.section !== 'PCO') // Exclude PCO items from grand total
        .reduce((sum, item) => sum + item.thisBillingValue, 0);
    
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('mappedItemsCount').textContent = mappedItems;
    document.getElementById('totalValueCount').textContent = formatCurrency(totalValue);
} 