// Utility to determine usage className based on usage and limit
// Returns 'usageDanger', 'usageWarning', or ''

// Percentage of `limit` used, understanding values like "21 K", "820 MB" or "0.25 GB". null if unknown.
export function getUsagePercent(usage, limit) {
  if (!usage || !limit) {
    return null;
  }

  const convertToNumber = (value) => {
    if (typeof value === 'number') {
      return value;
    }
    if (!value) {
      return 0;
    }
    const num = parseFloat(value);
    const unit = value.replace(/[0-9.]/g, '').trim().toUpperCase();
    switch(unit) {
      case 'KB':
        return num * 1024;
      case 'MB':
        return num * 1024 * 1024;
      case 'GB':
        return num * 1024 * 1024 * 1024;
      case 'M':
        return num * 1000000;
      case 'K':
        return num * 1000;
      default:
        return num;
    }
  };

  const usageNum = convertToNumber(usage);
  const limitNum = convertToNumber(limit);
  if (!limitNum || isNaN(usageNum) || isNaN(limitNum)) {
    return null;
  }
  return (usageNum / limitNum) * 100;
}

export function getUsageClassName(usage, limit) {
  const percentage = getUsagePercent(usage, limit);
  if (percentage === null) {
    return '';
  }
  if (percentage > 90) {
    return 'usageDanger';
  }
  if (percentage > 70) {
    return 'usageWarning';
  }
  return '';
}

export const formatDate = (dateString) => {
  try {
    if(dateString && Date.parse(dateString)) {
      const date = new Date(dateString);
      return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
    } else {
      return '(N.A.)';
    }
  } catch (error) {
    return '(N.A.)';
  }
}
