import axios from "axios";

const back4app2 = {
  me: async () => {
    const result = await axios.post(
      b4aSettings.CONTAINERS_API_PATH,
      {
        query: `
          query Me {
            me {
              id
              username
              createdAt
              disableSolucxForm
              avatar
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    return result.data.data.me;
  },
  findAppsPlans: async () => {
    const result = await axios.post(
      b4aSettings.CONTAINERS_API_PATH,
      {
        query: `
          query AppsPlans {
            appsPlans {
              status
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    return result.data.data.appsPlans;
  },
  findApps: async () => {
    const result = await axios.post(
      b4aSettings.CONTAINERS_API_PATH,
      {
        query: `
          query Apps {
            apps {
              id
              name
              isFavourite
              mainService {
                mainServiceEnvironment {
                  mainCustomDomain {
                    id
                    name
                    cname
                    redirectTo {
                      id
                      name
                    }
                    status
                    error {
                      code
                      message
                    }
                  }
                  plan {
                    name
                  }
                  isPendingPayment
                  isFreePlanElegible
                  lastDeployment {
                    id
                    branchName
                    deployTask {
                      status
                    }
                    status
                    lastDockerfileChat {
                      id
                    }
                  }
                  activeDeployment {
                    id
                    branchName
                    deployTask {
                      status
                    }
                  }
                }
              }
              status
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    return result.data.data.apps;
  }
};

export default back4app2;
