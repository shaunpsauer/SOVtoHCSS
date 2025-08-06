// Utility Functions
function formatCurrency(value) {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function wrapText(text, maxWidth) {
    const lines = [];
    while (text.length > 0) {
        if (text.length <= maxWidth) {
            lines.push(text);
            break;
        }
        let breakPoint = text.lastIndexOf(' ', maxWidth);
        if (breakPoint === -1) breakPoint = maxWidth;
        lines.push(text.substring(0, breakPoint));
        text = text.substring(breakPoint).trim();
    }
    return lines;
}

function centerText(text, width) {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + text;
}

function getCellValue(sheet, column, row) {
    const cellAddress = column + row;
    const cell = sheet[cellAddress];
    if (!cell) return '';
    
    // Handle different cell types
    if (cell.t === 'n') return cell.v; // Number
    if (cell.t === 's') return cell.v; // String
    if (cell.t === 'd') return cell.v; // Date
    if (cell.w) return cell.w; // Formatted value
    return cell.v || '';
} 