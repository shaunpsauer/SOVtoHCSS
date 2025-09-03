/**
 * Item Mapping and Activity Management Module
 * 
 * This module handles the drag-and-drop functionality for mapping SOV items to HCSS activities,
 * manages activity creation and deletion, and provides bulk item assignment capabilities.
 * It enables users to organize line items into logical activity groups for billing purposes.
 */

// Module state variables
let activityCounter = 0;
let draggedItem = null;

/**
 * Initiates drag operation on an SOV item
 * Adds visual feedback and stores reference to the dragged item
 * @param {Event} e - Drag start event
 */
function dragStart(e) {
    draggedItem = e.target;
    e.target.classList.add('dragging');
}

/**
 * Completes drag operation and removes visual feedback
 * @param {Event} e - Drag end event
 */
function dragEnd(e) {
    e.target.classList.remove('dragging');
}

/**
 * Allows drop operations on activity drop zones
 * Provides visual feedback during drag operations
 * @param {Event} e - Drag over event
 */
function allowDrop(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.add('drag-over');
}

/**
 * Processes item drops into activity drop zones
 * Creates assigned item copies and updates item states
 * @param {Event} e - Drop event
 */
function dropItem(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    if (!draggedItem) return;
    
    // Retrieve the dropped item data
    const itemId = parseInt(draggedItem.dataset.itemId);
    const item = window.sovItems.find(i => i.id === itemId);
    if (!item || item.assigned) return;
    
    // Remove empty state placeholder if it exists
    const emptyState = dropZone.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    // Create a copy of the item for the activity
    const activityItem = draggedItem.cloneNode(true);
    activityItem.classList.add('assigned');
    activityItem.draggable = false;
    
    // Add remove button for item management
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removeFromActivity(itemId, dropZone);
    activityItem.querySelector('.item-header').appendChild(removeBtn);
    
    // Add the item to the activity
    dropZone.appendChild(activityItem);
    
    // Mark the original item as assigned and update UI
    item.assigned = true;
    draggedItem.classList.add('assigned');
    draggedItem.draggable = false;
    
    // Update activity totals and statistics
    updateActivityTotal(dropZone.closest('.activity-group'));
    updateStats();
}

/**
 * Removes an item from an activity and restores its unassigned state
 * Updates both the activity display and the original items list
 * @param {number} itemId - ID of the item to remove
 * @param {HTMLElement} activityItemsDiv - Container of the activity items
 */
function removeFromActivity(itemId, activityItemsDiv) {
    // Restore item's unassigned state
    const item = window.sovItems.find(i => i.id === itemId);
    if (item) {
        item.assigned = false;
        displayItems(); // Refresh the items list to show unassigned state
    }
    
    // Remove item from activity display
    const activityItem = activityItemsDiv.querySelector(`[data-item-id="${itemId}"]`);
    if (activityItem) activityItem.remove();
    
    // Restore empty state placeholder if no items remain
    if (activityItemsDiv.children.length === 0) {
        activityItemsDiv.innerHTML = '<div class="empty-state">Drop items here</div>';
    }
    
    // Update totals and statistics
    updateActivityTotal(activityItemsDiv.closest('.activity-group'));
    updateStats();
}

/**
 * Calculates and updates the total value for a specific activity
 * Sums the billing values of all items assigned to the activity
 * @param {HTMLElement} activityGroup - The activity group element to update
 */
function updateActivityTotal(activityGroup) {
    const activityItems = activityGroup.querySelector('.activity-items');
    const items = activityItems.querySelectorAll('.sov-item');
    let total = 0;
    
    // Sum the billing values of all assigned items
    items.forEach(itemEl => {
        const itemId = parseInt(itemEl.dataset.itemId);
        const item = window.sovItems.find(i => i.id === itemId);
        if (item) total += item.thisBillingValue;
    });
    
    // Update the activity total display
    activityGroup.querySelector('.activity-total').textContent = formatCurrency(total);
}

/**
 * Initializes the activities list with a default activity
 * Clears existing activities and resets the activity counter
 */
function initializeActivities() {
    const activitiesList = document.getElementById('activitiesList');
    activitiesList.innerHTML = '';
    activityCounter = 0;
    
    // Create initial activity for immediate use
    addActivity('Activity 1');
}

/**
 * Creates a new activity with predefined SPSI code options
 * Each activity can be customized with a name and contains a drop zone for items
 * @param {string} name - Optional name for the activity (defaults to "Activity X")
 */
function addActivity(name = null) {
    activityCounter++;
    const activitiesList = document.getElementById('activitiesList');
    const newActivity = document.createElement('div');
    newActivity.className = 'activity-group';
    newActivity.dataset.activityId = activityCounter;
    
    const activityName = name || `Activity ${activityCounter}`;
    
    // Create activity HTML structure with SPSI code dropdown and drop zone
    newActivity.innerHTML = `
        <div class="activity-header">
            <select class="activity-name-input" placeholder="Activity Name">
                <option value="">-- Select SPSI Code --</option>
                <option value="5010: ENVIRONMENTAL MONITORING">5010: ENVIRONMENTAL MONITORING</option>
                <option value="5020: IMPLEMENT SWPPP">5020: IMPLEMENT SWPPP</option>
                <option value="5030: VEGETATION MANAGEMENT">5030: VEGETATION MANAGEMENT</option>
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
                <option value="7100: CONTROL PIPING+">7100: CONTROL PIPING+</option>
                <option value="7200: SCADA INSTRUMENTATION+">7200: SCADA INSTRUMENTATION+</option>
                <option value="7300: ELECTRICAL+">7300: ELECTRICAL+</option>
                <option value="7400: BACKFILL+">7400: BACKFILL+</option>
                <option value="7500: SITE DEWATERING+">7500: SITE DEWATERING+</option>
                <option value="7700: DEMOBILIZATION+">7700: DEMOBILIZATION+</option>
                <option value="7800: PERFORM INSPECTION">7800: PERFORM INSPECTION</option>
                <option value="8000: PERFORM NDE">8000: PERFORM NDE</option>
                <option value="8400: CONSTRUCTION MANAGEMENT & OVERSIGHT">8400: CONSTRUCTION MANAGEMENT & OVERSIGHT</option>
                <option value="8600: SAFETY+">8600: SAFETY+</option>
                <option value="8700: HARD SITE RESTORATION+">8700: HARD SITE RESTORATION+</option>
                <option value="8800: SOFT SITE RESTORATION+">8800: SOFT SITE RESTORATION+</option>
            </select>
            <span class="activity-total">$0.00</span>
        </div>
        <div class="activity-items" ondrop="dropItem(event)" ondragover="allowDrop(event)" ondragleave="event.currentTarget.classList.remove('drag-over')">
            <div class="empty-state">Drop items here</div>
        </div>
    `;
    
    // Add the new activity to the activities list
    activitiesList.appendChild(newActivity);
}

/**
 * Bulk assignment function that adds all unassigned SOV items to the first activity
 * Useful for quickly organizing all items when a single activity is sufficient
 */
function addAllLineItems() {
    // Get the first available activity group
    const firstActivity = document.querySelector('.activity-group');
    if (!firstActivity) {
        alert('No activity available. Please add an activity first.');
        return;
    }
    
    // Get the activity items container for the first activity
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
    
    // Process each unassigned item
    unassignedItems.forEach(item => {
        // Mark item as assigned
        item.assigned = true;
        
        // Create activity item element with appropriate styling
        const activityItem = document.createElement('div');
        activityItem.className = 'sov-item assigned';
        activityItem.draggable = false;
        activityItem.dataset.itemId = item.id;
        
        // Generate item content based on section type
        let itemHeader = '';
        if (item.section === 'Pass-Through') {
            itemHeader = `
                <div class="item-header">
                    <span class="item-number">
                        ${item.ptNumber ? `PT #${item.ptNumber}` : `Line ${item.lineNumber}`}
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
    
    // Update the original items list to show assigned state
    displayItems();
    
    // Update activity totals and statistics
    updateActivityTotal(firstActivity);
    updateStats();
    
    alert(`Added ${unassignedItems.length} items to the activity.`);
}

/**
 * Placeholder function for future activity template functionality
 * Will allow users to save and reuse common activity structures
 */
function loadActivityTemplate() {
    alert('Activity template loading will be implemented to save and reuse common activity structures.');
} 