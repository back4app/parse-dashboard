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
  }
};

export default back4app2;
