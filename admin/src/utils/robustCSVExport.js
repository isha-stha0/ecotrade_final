/**
 * Robust CSV Export Utility
 * Handles nested objects, arrays, dates, and special characters
 */

/**
 * Flatten nested object properties into dot notation
 * @param {Object} obj - Object to flatten
 * @param {String} prefix - Prefix for nested keys
 * @returns {Object} Flattened object
 */
const flattenObject = (obj, prefix = '') => {
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = '';
    } else if (value instanceof Date) {
      flattened[newKey] = value.toISOString().split('T')[0]; // YYYY-MM-DD format
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        flattened[newKey] = '';
      } else if (typeof value[0] === 'object') {
        // Array of objects - stringify as JSON
        flattened[newKey] = JSON.stringify(value);
      } else {
        // Array of primitives - join with semicolons
        flattened[newKey] = value.join('; ');
      }
    } else if (typeof value === 'object' && value.constructor === Object) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else if (typeof value === 'boolean') {
      flattened[newKey] = value ? 'Yes' : 'No';
    } else {
      flattened[newKey] = String(value);
    }
  });

  return flattened;
};

/**
 * Escape special characters in CSV values
 * @param {String} value - Value to escape
 * @returns {String} Escaped value
 */
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Get all unique keys from array of objects (including nested)
 * @param {Array} data - Array of objects
 * @returns {Array} Unique keys
 */
const getAllKeys = (data) => {
  const keysSet = new Set();

  data.forEach((item) => {
    const flattened = flattenObject(item);
    Object.keys(flattened).forEach((key) => keysSet.add(key));
  });

  return Array.from(keysSet).sort();
};

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional custom headers (uses data keys if not provided)
 * @returns {String} CSV formatted string
 */
export const arrayToCSV = (data, headers = null) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Flatten all objects in the array
  const flattenedData = data.map((item) => flattenObject(item));

  // Get all unique keys if headers not provided
  const allKeys = headers || getAllKeys(flattenedData);

  // Create header row
  const headerRow = allKeys.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = flattenedData
    .map((item) => allKeys.map((key) => escapeCSVValue(item[key] || '')).join(','))
    .join('\n');

  return `${headerRow}\n${dataRows}`;
};

/**
 * Download CSV file to user's computer
 * @param {String} csvContent - CSV string content
 * @param {String} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  try {
    // Ensure .csv extension
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

    // Create blob with UTF-8 BOM for better Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL object
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return false;
  }
};

/**
 * Export report data to CSV with error handling
 * @param {Object} reportData - Report data object
 * @param {String} reportTitle - Title for the file
 * @returns {Boolean} Success status
 */
export const exportReportToCSV = (reportData, reportTitle = 'report') => {
  try {
    if (!reportData) {
      console.error('No report data provided');
      return false;
    }

    // Extract array data from report
    let dataToExport = [];

    if (Array.isArray(reportData)) {
      dataToExport = reportData;
    } else if (reportData.stats && Array.isArray(reportData.stats)) {
      dataToExport = reportData.stats;
    } else if (reportData.data && Array.isArray(reportData.data)) {
      dataToExport = reportData.data;
    } else if (reportData.records && Array.isArray(reportData.records)) {
      dataToExport = reportData.records;
    } else {
      // If single object, wrap in array
      dataToExport = [reportData];
    }

    if (dataToExport.length === 0) {
      console.error('No data to export');
      return false;
    }

    const csv = arrayToCSV(dataToExport);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportTitle}_${timestamp}`;

    return downloadCSV(csv, filename);
  } catch (error) {
    console.error('Error exporting report to CSV:', error);
    return false;
  }
};

/**
 * Generate formatted table data for display (non-exporting)
 * @param {Object} data - Data object
 * @returns {Array} Array suitable for table display
 */
export const formatTableData = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => flattenObject(item));
  }
  return [flattenObject(data)];
};

/**
 * Validate CSV data for consistency
 * @param {String} csvContent - CSV string content
 * @returns {Object} Validation result
 */
export const validateCSV = (csvContent) => {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        valid: false,
        message: 'CSV must have at least header and one data row',
        lineCount: lines.length,
      };
    }

    const headerCount = lines[0].split(',').length;
    let inconsistencies = 0;

    for (let i = 1; i < lines.length; i++) {
      const columnCount = lines[i].split(',').length;
      if (columnCount !== headerCount) {
        inconsistencies++;
      }
    }

    if (inconsistencies > 0) {
      return {
        valid: false,
        message: `${inconsistencies} rows have inconsistent column counts`,
        headerColumns: headerCount,
        inconsistencies,
      };
    }

    return {
      valid: true,
      message: 'CSV is valid',
      lineCount: lines.length,
      columnCount: headerCount,
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message,
    };
  }
};

/**
 * Convert CSV string to array of objects
 * @param {String} csvContent - CSV string content
 * @returns {Array} Array of objects
 */
export const parseCSV = (csvContent) => {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const values = lines[i].split(',');
      headers.forEach((header, idx) => {
        obj[header] = values[idx] ? values[idx].trim() : '';
      });
      data.push(obj);
    }

    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

export default {
  arrayToCSV,
  downloadCSV,
  exportReportToCSV,
  formatTableData,
  validateCSV,
  parseCSV,
  flattenObject,
  escapeCSVValue,
};
