export const ALWAYS_ALLOWED_ROUTES = ['overview', 'web-deployment', 'Overview', 'Web Deployment'];

export const canAccess = (serverInfo, route) => {
  if (ALWAYS_ALLOWED_ROUTES.includes(route)) {
    return true;
  }
  return serverInfo.status === 'SUCCESS';
}
