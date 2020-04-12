export default {
  name: "api",
  namespaced: true,
  state: {
    apiPath: process.env.VUE_APP_API_PATH,
    batchPath: process.env.VUE_APP_API_PATH_BATCH + "?",
    isDataLoading: false
  },
  mutations: {
    setApiPath(state, payload) {
      state.apiPath = payload || "/";
      if (window.debugLevel > 10) {
        console.debug("api/setApiPath", state.apiPath);
      }
    },
    setLang(state, payload) {
      if (!payload) payload = process.env.VUE_APP_DEFAULT_LANGUAGE;
      state.lang = payload;
      if (window.debugLevel > 10) {
        console.debug("api/setLang", state.lang);
      }
    },
    setDataLoading(state, payload) {
      state.isDataLoading = !!payload;
      if (window.debugLevel > 10) {
        console.debug("api/setDataLoading", state.isDataLoading);
      }
    }
  }
};
