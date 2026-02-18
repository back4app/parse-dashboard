export const ALWAYS_ALLOWED_ROUTES = ['overview', 'web-deployment', 'Overview', 'Web Deployment', 'settings', 'App Settings', 'server-settings', 'plan-usage', 'Plan Usage', 'Logs', 'logs', 'analytics', 'reports', 'Slow Requests', 'App Security Report', 'Advisors', 'security', 'domain-settings', 'Domain Settings', 'Advanced Options', 'advanced-options'];

export const canAccess = (serverInfo, route) => {
  if (ALWAYS_ALLOWED_ROUTES.includes(route)) {
    return true;
  }
  return serverInfo.status === 'SUCCESS';
}
