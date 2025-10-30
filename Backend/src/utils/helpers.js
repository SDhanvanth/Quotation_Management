import crypto from 'crypto';
import { format } from 'date-fns';

export const generateRandomString = (length = 10) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date, formatString = 'yyyy-MM-dd') => {
  return format(new Date(date), formatString);
};

export const calculateTax = (amount, taxPercentage) => {
  return (amount * taxPercentage) / 100;
};

export const calculateDiscount = (amount, discountPercentage) => {
  return (amount * discountPercentage) / 100;
};

export const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    const subtotal = item.unit_price * item.quantity;
    const discount = calculateDiscount(subtotal, item.discount_percentage || 0);
    const afterDiscount = subtotal - discount;
    const tax = calculateTax(afterDiscount, item.tax_percentage || 0);
    return total + afterDiscount + tax;
  }, 0);
};

export const paginate = (page, limit) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

export const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

export const generateInvoiceNumber = (prefix = 'INV') => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = generateRandomString(4).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
};

export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
};

export const roundToDecimal = (value, decimals = 2) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

export const removeDuplicates = (array, key) => {
  return array.filter((item, index, self) =>
    index === self.findIndex((t) => t[key] === item[key])
  );
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], pre + key));
    } else {
      acc[pre + key] = obj[key];
    }
    return acc;
  }, {});
};

export const maskSensitiveData = (data, fieldsToMask = ['password', 'token', 'secret']) => {
  const masked = { ...data };
  fieldsToMask.forEach(field => {
    if (masked[field]) {
      masked[field] = '***';
    }
  });
  return masked;
};

export default {
  generateRandomString,
  formatCurrency,
  formatDate,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  paginate,
  sanitizeInput,
  parseBoolean,
  generateInvoiceNumber,
  calculatePercentageChange,
  roundToDecimal,
  isValidDate,
  getDaysBetween,
  groupBy,
  removeDuplicates,
  sleep,
  retry,
  chunk,
  flattenObject,
  maskSensitiveData
};