/**
 * SOV File Processing Module
 * 
 * This module handles Excel file uploads, parsing, and data extraction from SOV (Statement of Values) files.
 * It processes three main sections: Main Contract Items, Pass-Through Items, and PCO (Project Change Order) Items.
 * 
 * Expected Excel Structure:
 * - Main Items: Rows 7-175 (Columns B, C, D, F, G)
 * - Pass-Throughs: Starting row 177 (Columns A, B, F, G)  
 * - PCO Items: Starting row 205 (Columns B, C, D, E, F, G)
 */

// Global state variables for file processing
let selectedFile = null;
let workbook = null;
let sovItems = [];

// Expose variables globally for cross-module access
window.selectedFile = selectedFile;
window.sovItems = sovItems;

/**
 * Initializes drag and drop file handling functionality
 * Sets up event listeners for file drag operations on the drop zone
 */
function initializeFileHandling() {
    const dropZone = document.getElementById('dropZone');
    
    // Handle drag over events to provide visual feedback
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    // Remove visual feedback when drag leaves the zone
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    // Process dropped files
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
}

/**
 * Handles file selection from the file input element
 * @param {Event} event - File input change event
 */
function handleFileSelect(event) {
    console.log('handleFileSelect called');
    const file = event.target.files[0];
    console.log('File from input:', file);
    if (file) handleFile(file);
}

/**
 * Processes the selected file and initiates Excel parsing
 * Validates file format and sets up file reading operations
 * @param {File} file - The selected Excel file to process
 */
function handleFile(file) {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File selected:', file.name, file.size, 'bytes');
    console.log('File type:', file.type);
    
    // Validate file format - only accept Excel files
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('File is valid Excel format');
        selectedFile = file;
        window.selectedFile = selectedFile; // Update global reference
        
        // Update UI to show file is loaded
        document.getElementById('fileInfo').innerHTML = `<strong>✓ Loaded:</strong> ${file.name}`;
        document.getElementById('dropZone').classList.add('file-selected');
        document.getElementById('nextBtn').disabled = false;
        
        // Begin file reading process
        console.log('Starting file read...');
        const reader = new FileReader();
        
        // Handle successful file read
        reader.onload = function(e) {
            console.log('File read successfully, size:', e.target.result.byteLength);
            const data = new Uint8Array(e.target.result);
            
            try {
                // Parse Excel data using XLSX library
                workbook = XLSX.read(data, {type: 'array', cellDates: true});
                console.log('Workbook created successfully');
                console.log('Sheet names:', workbook.SheetNames);
                
                // Auto-process the file after a brief delay to ensure DOM updates
                setTimeout(() => {
                    console.log('Auto-processing file...');
                    processFile();
                }, 100);
                
            } catch (error) {
                console.error('Error parsing workbook:', error);
                alert('Error reading the Excel file. It might be corrupted or password protected.');
            }
        };
        
        // Handle file reading errors
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
            alert('Error reading the file. Please try again.');
        };
        
        // Read file as ArrayBuffer for XLSX processing
        reader.readAsArrayBuffer(file);
    } else {
        console.log('File is not valid Excel format');
        alert('Please select a valid Excel file (.xlsx or .xls)');
    }
}

/**
 * Checks if a file has been selected for validation purposes
 * @returns {boolean} True if a file is selected, false otherwise
 */
function isFileSelected() {
    return selectedFile !== null;
}

/**
 * Processes the Excel workbook and extracts SOV data according to specific format requirements
 * Parses three main sections: Main Contract Items, Pass-Through Items, and PCO Items
 */
function processFile() {
    console.log('=== PROCESS FILE DEBUG ===');
    
    if (!workbook) {
        console.error('No workbook available');
        return;
    }
    
    // Target the specific sheet containing SOV data
    const targetSheetName = "Unit Breakdown";
    let targetSheet = null;
    
    console.log('Available sheets:', workbook.SheetNames);
    
    // Verify the required sheet exists
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
    
    // Log sample data from first 20 rows to understand structure
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
    
    // Initialize SOV items array
    sovItems = [];
    window.sovItems = sovItems; // Update global reference
    let itemId = 0;
    
    // Debug: Log the sheet data to understand the structure
    console.log('Processing Excel file...');
    console.log('Sheet names:', workbook.SheetNames);
    
    // Process Main Contract Items Section
    // Data structure: Columns A=Prime Key, B=Unit #, C=Description, D=Unit of Measure, E=Unit Cost, F=Estimated Quantity, G=Contract Cost
    console.log('Processing Main Contract Items section...');
    for (let row = 7; row <= 200; row++) { // Check up to row 200 for main items
        const primeKey = getCellValue(targetSheet, 'A', row);
        const unitNumber = getCellValue(targetSheet, 'B', row);
        const description = getCellValue(targetSheet, 'C', row);
        const unitOfMeasure = getCellValue(targetSheet, 'D', row);
        const unitCost = parseFloat(getCellValue(targetSheet, 'E', row) || 0);
        const estimatedQty = parseFloat(getCellValue(targetSheet, 'F', row) || 0);
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0);
        
        // Log any row with meaningful data for debugging
        if (description || unitCost > 0 || contractCost > 0) {
            console.log(`Row ${row} data:`, {
                primeKey, unitNumber, description, unitOfMeasure, 
                unitCost, estimatedQty, contractCost
            });
        }
        
        // Include items that have a description AND either estimated quantity or contract cost
        if (description && (estimatedQty > 0 || contractCost > 0)) {
            // Calculate billing value based on available data
            let thisBillingValue = 0;
            let thisBillingQty = 0;
            
            if (contractCost > 0) {
                // Prefer contract cost if available
                thisBillingValue = contractCost;
                thisBillingQty = estimatedQty > 0 ? estimatedQty : 1;
            } else if (unitCost > 0 && estimatedQty > 0) {
                // Fall back to unit cost × quantity calculation
                thisBillingValue = unitCost * estimatedQty;
                thisBillingQty = estimatedQty;
            }
            
            // Only add items with valid billing values
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
    
    // Process Pass-Through Items Section
    // Data structure: Columns A=Item Number, B=Description, C=Description (same as B), F=Markup, G=Contract Cost
    console.log('Processing Pass-Through Items section...');
    for (let row = 180; row <= 350; row++) { // Expanded range to catch all pass-through items
        const itemNumber = getCellValue(targetSheet, 'A', row);
        const description = getCellValue(targetSheet, 'B', row) || getCellValue(targetSheet, 'C', row);
        const markup = getCellValue(targetSheet, 'F', row);
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0);
        
        // Log all rows with any data to understand the structure
        if (itemNumber || description || markup || contractCost > 0) {
            console.log(`Row ${row} pass-through data:`, {
                itemNumber, description, markup, contractCost
            });
        }
        
        // Process only rows with meaningful content
        if (description) {
            // Skip section headers
            if (typeof description === 'string' && description.toLowerCase().includes('pass-throughs')) {
                console.log(`Found Pass-Throughs header at row ${row}`);
                continue; // Skip the header row
            }
            
            // Stop processing when we hit the PCO section
            if (typeof description === 'string' && description.toLowerCase().includes('change order')) {
                console.log(`Found Change Orders header at row ${row} - stopping pass-through processing`);
                break; // Stop processing pass-throughs when we hit the PCO section
            }
            
            // Pass-through item validation criteria:
            // 1. Must have a valid description (not just a number)
            // 2. Must have a contract cost > 0
            // 3. Must be in the pass-through section (before row 205)
            const hasValidDescription = description && typeof description === 'string' && description.trim().length > 0 && !/^\d+$/.test(description.trim());
            const hasContractCost = contractCost > 0;
            const isInPassThroughSection = row < 205; // PCO section starts at row 205
            
            if (hasValidDescription && hasContractCost && isInPassThroughSection) {
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
                console.log(`Skipping row ${row} - itemNumber: "${itemNumber}", description: "${description}", contractCost: ${contractCost}, isInPassThroughSection: ${isInPassThroughSection}`);
            }
        }
    }
    
    // Process PCO (Project Change Order) Items Section
    // Data structure: Columns B=PCO #, C=Description, D=Unit of Measure, E=Unit Cost, F=Estimated Quantity, G=Contract Cost
    console.log('Processing PCO Items section...');
    console.log('Searching rows 205-300 for PCO data...');
    
    for (let row = 205; row <= 300; row++) { // Correct range based on Excel structure
        const pcoNumber = getCellValue(targetSheet, 'B', row); // PCO # is in column B
        const description = getCellValue(targetSheet, 'C', row); // Description is in column C
        const unitOfMeasure = getCellValue(targetSheet, 'D', row); // Unit of Measure is in column D
        const unitCost = parseFloat(getCellValue(targetSheet, 'E', row) || 0); // Unit Cost is in column E
        const estimatedQty = parseFloat(getCellValue(targetSheet, 'F', row) || 0); // Estimated Quantity is in column F
        const contractCost = parseFloat(getCellValue(targetSheet, 'G', row) || 0); // Contract Cost is in column G
        
        // Log all rows with any data to understand the structure
        if (pcoNumber || description || unitCost > 0 || estimatedQty > 0 || contractCost > 0) {
            console.log(`Row ${row} PCO data:`, {
                pcoNumber, description, unitOfMeasure, unitCost, estimatedQty, contractCost
            });
        }
        
        // Process only rows with meaningful content
        if (description) {
            // Skip section headers
            if (typeof description === 'string' && description.toLowerCase().includes('change order')) {
                console.log(`Found Change Orders header at row ${row}: "${description}"`);
                continue; // Skip the header row
            }
            
            // PCO item validation criteria:
            // Must have a PCO number and description and either contract cost > 0 or (unit cost > 0 and quantity > 0)
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
                
                // Calculate billing value based on available data
                let thisBillingValue = 0;
                let thisBillingQty = 0;
                
                if (contractCost > 0) {
                    // Prefer contract cost if available
                    thisBillingValue = contractCost;
                    thisBillingQty = estimatedQty > 0 ? estimatedQty : 1;
                } else if (unitCost > 0 && estimatedQty > 0) {
                    // Fall back to unit cost × quantity calculation
                    thisBillingValue = unitCost * estimatedQty;
                    thisBillingQty = estimatedQty;
                }
                
                // Only add items with valid billing values
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
    
    // Initialize default activities and display items
    initializeActivities();
    displayItems();
    updateStats();
}

/**
 * Renders the SOV items in the UI with appropriate section grouping and visual indicators
 * Creates draggable item elements organized by section (Main, Pass-Through, PCO)
 */
function displayItems() {
    console.log('displayItems called with', sovItems.length, 'items');
    
    const container = document.getElementById('itemsList');
    if (!container) {
        console.error('Items list container not found');
        return;
    }
    
    container.innerHTML = '';
    
    let currentSection = '';
    
    // Iterate through all SOV items and create UI elements
    sovItems.forEach((item, index) => {
        console.log(`Displaying item ${index + 1}:`, item);
        
        // Add section divider when section changes
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
        
        // Create item element with appropriate styling and drag functionality
        const itemEl = document.createElement('div');
        itemEl.className = `sov-item ${item.assigned ? 'assigned' : ''}`;
        itemEl.draggable = !item.assigned;
        itemEl.dataset.itemId = item.id;
        itemEl.ondragstart = (e) => dragStart(e);
        itemEl.ondragend = (e) => dragEnd(e);
        
        // Generate item content based on section type
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

/**
 * Updates the mapping statistics display with current item counts and financial totals
 * Calculates subtotals for each section and the overall SOV total
 */
function updateStats() {
    const totalItems = window.sovItems.length;
    const mappedItems = window.sovItems.filter(item => item.assigned).length;
    
    // Calculate subtotals for each section
    const mainContractSubtotal = window.sovItems
        .filter(item => item.section === 'Main')
        .reduce((sum, item) => sum + item.thisBillingValue, 0);
    
    const passThroughSubtotal = window.sovItems
        .filter(item => item.section === 'Pass-Through')
        .reduce((sum, item) => sum + item.thisBillingValue, 0);
    
    const pcoSubtotal = window.sovItems
        .filter(item => item.section === 'PCO')
        .reduce((sum, item) => sum + item.thisBillingValue, 0);
    
    // Calculate overall SOV total from all sections
    const totalValue = mainContractSubtotal + passThroughSubtotal + pcoSubtotal;
    
    // Update UI elements with calculated values
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('mappedItemsCount').textContent = mappedItems;
    document.getElementById('mainContractSubtotal').textContent = formatCurrency(mainContractSubtotal);
    document.getElementById('passThroughSubtotal').textContent = formatCurrency(passThroughSubtotal);
    document.getElementById('pcoSubtotal').textContent = formatCurrency(pcoSubtotal);
    document.getElementById('totalValueCount').textContent = formatCurrency(totalValue);
} 