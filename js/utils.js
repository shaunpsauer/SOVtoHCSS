/**
 * Utility Functions Module
 * 
 * This module provides common utility functions used throughout the application
 * including currency formatting, text manipulation, and Excel cell value extraction.
 */

/**
 * Formats a numeric value as currency with proper formatting
 * Adds dollar sign, thousands separators, and ensures two decimal places
 * @param {number|string} value - The value to format as currency
 * @returns {string} Formatted currency string (e.g., "$1,234.56")
 */
function formatCurrency(value) {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Wraps text to fit within a specified maximum width
 * Breaks text at word boundaries to maintain readability
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - Maximum characters per line
 * @returns {string[]} Array of wrapped text lines
 */
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

/**
 * Centers text within a specified width by adding appropriate padding
 * Useful for creating formatted headers and titles
 * @param {string} text - The text to center
 * @param {number} width - The total width to center within
 * @returns {string} Centered text with leading spaces
 */
function centerText(text, width) {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + text;
}

/**
 * Extracts the value from an Excel worksheet cell
 * Handles different cell types (numbers, strings, dates) and returns formatted values when available
 * @param {Object} sheet - Excel worksheet object
 * @param {string} column - Column letter (A, B, C, etc.)
 * @param {number} row - Row number
 * @returns {string|number|Date} The cell value or empty string if cell is empty
 */
function getCellValue(sheet, column, row) {
    const cellAddress = column + row;
    const cell = sheet[cellAddress];
    if (!cell) return '';
    
    // Handle different Excel cell types
    if (cell.t === 'n') return cell.v; // Number
    if (cell.t === 's') return cell.v; // String
    if (cell.t === 'd') return cell.v; // Date
    if (cell.w) return cell.w; // Formatted value (preferred for display)
    return cell.v || ''; // Fallback to raw value
} 