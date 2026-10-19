// Plan usage for the sidebar badge. Every dashboard page renders its own sidebar, so
// without this each navigation would refetch the plan; one request per app every 5 minutes.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map();

export const getCachedPlanData = app => {
  const key = app.applicationId;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.promise;
  }
  const promise = Promise.resolve()
    .then(() => app.getAppPlanData())
    .catch(error => {
      cache.delete(key);
      throw error;
    });
  cache.set(key, { promise, at: Date.now() });
  return promise;
};

export const clearPlanDataCache = () => cache.clear();
