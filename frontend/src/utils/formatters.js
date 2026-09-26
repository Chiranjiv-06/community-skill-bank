/**
 * UI Formatters & Helper Utilities
 */

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateString;
  }
};

export const getSeverityBadgeVariant = (severity) => {
  const s = String(severity).toLowerCase();
  switch (s) {
    case 'critical':
    case 'high':
      return 'critical';
    case 'moderate':
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    case 'active':
    case 'resolved':
      return 'success';
    default:
      return 'neutral';
  }
};

export const truncate = (str, len = 60) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};
