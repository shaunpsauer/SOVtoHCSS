// Mapping Module
let activityCounter = 0;
let draggedItem = null;

// Drag and Drop Functions
function dragStart(e) {
    draggedItem = e.target;
    e.target.classList.add('dragging');
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function allowDrop(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.add('drag-over');
}

function dropItem(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    if (!draggedItem) return;
    
    const itemId = parseInt(draggedItem.dataset.itemId);
    const item = window.sovItems.find(i => i.id === itemId);
    if (!item || item.assigned) return;
    
    // Remove empty state if exists
    const emptyState = dropZone.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    // Clone the item for the activity
    const activityItem = draggedItem.cloneNode(true);
    activityItem.classList.add('assigned');
    activityItem.draggable = false;
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removeFromActivity(itemId, dropZone);
    activityItem.querySelector('.item-header').appendChild(removeBtn);
    
    dropZone.appendChild(activityItem);
    
    // Mark original item as assigned
    item.assigned = true;
    draggedItem.classList.add('assigned');
    draggedItem.draggable = false;
    
    // Update activity total
    updateActivityTotal(dropZone.closest('.activity-group'));
    updateStats();
}

function removeFromActivity(itemId, activityItemsDiv) {
    const item = window.sovItems.find(i => i.id === itemId);
    if (item) {
        item.assigned = false;
        displayItems(); // Refresh the items list
    }
    
    // Remove from activity
    const activityItem = activityItemsDiv.querySelector(`[data-item-id="${itemId}"]`);
    if (activityItem) activityItem.remove();
    
    // Add empty state if no items left
    if (activityItemsDiv.children.length === 0) {
        activityItemsDiv.innerHTML = '<div class="empty-state">Drop items here</div>';
    }
    
    updateActivityTotal(activityItemsDiv.closest('.activity-group'));
    updateStats();
}

function updateActivityTotal(activityGroup) {
    const activityItems = activityGroup.querySelector('.activity-items');
    const items = activityItems.querySelectorAll('.sov-item');
    let total = 0;
    
    items.forEach(itemEl => {
        const itemId = parseInt(itemEl.dataset.itemId);
        const item = window.sovItems.find(i => i.id === itemId);
        if (item) total += item.thisBillingValue;
    });
    
    activityGroup.querySelector('.activity-total').textContent = formatCurrency(total);
}

// Activity Management
function initializeActivities() {
    const activitiesList = document.getElementById('activitiesList');
    activitiesList.innerHTML = '';
    activityCounter = 0;
    
    // Start with just one activity
    addActivity('Activity 1');
}

function addActivity(name = null) {
    activityCounter++;
    const activitiesList = document.getElementById('activitiesList');
    const newActivity = document.createElement('div');
    newActivity.className = 'activity-group';
    newActivity.dataset.activityId = activityCounter;
    
    const activityName = name || `Activity ${activityCounter}`;
    
    newActivity.innerHTML = `
        <div class="activity-header">
            <select class="activity-name-input" placeholder="Activity Name">
                <option value="">-- Select SPSI Code --</option>
                <option value="401: DESIGN">401: DESIGN</option>
                <option value="500: EXECUTE/CONSTRUCT">500: EXECUTE/CONSTRUCT</option>
                <option value="501: ENVIRONMENTAL COMPLIANCE">501: ENVIRONMENTAL COMPLIANCE</option>
                <option value="502: NATURAL RESOURCE MGMNT">502: NATURAL RESOURCE MGMNT</option>
                <option value="503: MOBILIZATION">503: MOBILIZATION</option>
                <option value="504: EXECUTION">504: EXECUTION</option>
                <option value="505: INSPECTION">505: INSPECTION</option>
                <option value="506: TEST/COMMISSION">506: TEST/COMMISSION</option>
                <option value="507: CONSTRUCTION SUPPORT">507: CONSTRUCTION SUPPORT</option>
                <option value="508: SITE RESTORATION">508: SITE RESTORATION</option>
                <option value="600: CLOSE">600: CLOSE</option>
                <option value="5010: ENVIRONMENTAL MONITORING">5010: ENVIRONMENTAL MONITORING</option>
                <option value="5020: IMPLEMENT SWPPP">5020: IMPLEMENT SWPPP</option>
                <option value="5030: VEGETATION MANAGEMENT">5030: VEGETATION MANAGEMENT</option>
                <option value="5040: BID PROCESS+">5040: BID PROCESS+</option>
                <option value="5050: CLEARANCE PLANNING">5050: CLEARANCE PLANNING</option>
                <option value="5060: MOBILIZATION+">5060: MOBILIZATION+</option>
                <option value="5070: SURVEY+">5070: SURVEY+</option>
                <option value="5080: SITE MANAGEMENT+">5080: SITE MANAGEMENT+</option>
                <option value="5085: TRAFFIC CONTROL+">5085: TRAFFIC CONTROL+</option>
                <option value="5090: SITE PREP+">5090: SITE PREP+</option>
                <option value="6000: EXCAVATION & SHORING+">6000: EXCAVATION & SHORING+</option>
                <option value="6050: MATERIALS">6050: MATERIALS</option>
                <option value="6100: REMOVAL (Settlement)+">6100: REMOVAL (Settlement)+</option>
                <option value="6200: FABRICATION AND INSTALL OF PIPING & VALVES+">6200: FABRICATION AND INSTALL OF PIPING & VALVES+</option>
                <option value="6300: POTHOLE SITE+">6300: POTHOLE SITE+</option>
                <option value="6400: CONCRETE (Civil)+">6400: CONCRETE (Civil)+</option>
                <option value="6500: BORING+">6500: BORING+</option>
                <option value="6600: COATING+">6600: COATING+</option>
                <option value="6700: CORROSION CONTROL / CATHODIC PROTECTION+">6700: CORROSION CONTROL / CATHODIC PROTECTION+</option>
                <option value="6800: ILI TOOL RUN AND SUPPORT+">6800: ILI TOOL RUN AND SUPPORT+</option>
                <option value="6900: PERFORM STRENGTH TEST+">6900: PERFORM STRENGTH TEST+</option>
                <option value="7000: FACILITIES AND PLANT CONSTRUCTION+">7000: FACILITIES AND PLANT CONSTRUCTION+</option>
                <option value="7100: CONTROL PIPING+">7100: CONTROL PIPING+</option>
                <option value="7200: SCADA INSTRUMENTATION+">7200: SCADA INSTRUMENTATION+</option>
                <option value="7300: ELECTRICAL+">7300: ELECTRICAL+</option>
                <option value="7400: BACKFILL+">7400: BACKFILL+</option>
                <option value="7500: SITE DEWATERING+">7500: SITE DEWATERING+</option>
                <option value="7600: DATA ANALYSIS">7600: DATA ANALYSIS</option>
                <option value="7700: DEMOBILIZATION+">7700: DEMOBILIZATION+</option>
                <option value="7800: PERFORM INSPECTION">7800: PERFORM INSPECTION</option>
                <option value="7900: PERFORM QA/QC">7900: PERFORM QA/QC</option>
                <option value="8000: PERFORM NDE">8000: PERFORM NDE</option>
                <option value="8100: PERFORM STANDBY">8100: PERFORM STANDBY</option>
                <option value="8200: COMMISSION & TEST">8200: COMMISSION & TEST</option>
                <option value="8300: CLEARANCE EXECUTION+">8300: CLEARANCE EXECUTION+</option>
                <option value="8400: CONSTRUCTION MANAGEMENT & OVERSIGHT">8400: CONSTRUCTION MANAGEMENT & OVERSIGHT</option>
                <option value="8500: FIELD ENGINEERING">8500: FIELD ENGINEERING</option>
                <option value="8600: SAFETY+">8600: SAFETY+</option>
                <option value="8700: HARD SITE RESTORATION+">8700: HARD SITE RESTORATION+</option>
                <option value="8800: SOFT SITE RESTORATION+">8800: SOFT SITE RESTORATION+</option>
                <option value="9999: DAILY BURN RATE">9999: DAILY BURN RATE</option>
            </select>
            <span class="activity-total">$0.00</span>
        </div>
        <div class="activity-items" ondrop="dropItem(event)" ondragover="allowDrop(event)" ondragleave="event.currentTarget.classList.remove('drag-over')">
            <div class="empty-state">Drop items here</div>
        </div>
    `;
    
    // Simply append the new activity to the activities list
    activitiesList.appendChild(newActivity);
}

function addAllLineItems() {
    // Get the first activity group
    const firstActivity = document.querySelector('.activity-group');
    if (!firstActivity) {
        alert('No activity available. Please add an activity first.');
        return;
    }
    
    // Get the activity items container
    const activityItems = firstActivity.querySelector('.activity-items');
    if (!activityItems) {
        alert('Activity items container not found.');
        return;
    }
    
    // Clear any existing items in the activity
    activityItems.innerHTML = '';
    
    // Get all unassigned SOV items
    const unassignedItems = window.sovItems.filter(item => !item.assigned);
    
    if (unassignedItems.length === 0) {
        alert('No unassigned items available.');
        return;
    }
    
    // Add all unassigned items to the first activity
    unassignedItems.forEach(item => {
        // Mark item as assigned
        item.assigned = true;
        
        // Create activity item element
        const activityItem = document.createElement('div');
        activityItem.className = 'sov-item assigned';
        activityItem.draggable = false;
        activityItem.dataset.itemId = item.id;
        
        // Create item content based on section
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
        
        activityItem.innerHTML = itemHeader;
        activityItems.appendChild(activityItem);
    });
    
    // Update the original items list to show them as assigned
    displayItems();
    
    // Update activity total
    updateActivityTotal(firstActivity);
    
    // Update stats
    updateStats();
    
    alert(`Added ${unassignedItems.length} items to the activity.`);
}

function loadActivityTemplate() {
    alert('Activity template loading will be implemented to save and reuse common activity structures.');
} 