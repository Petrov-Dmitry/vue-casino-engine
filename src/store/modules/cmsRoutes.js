import axios from "axios-jsonp-pro";

export default {
  name: "cmsRoutes",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/urls",
    batchObjectName: "CmsApiCmsUrls",
    data: null,
    isDataLoading: false,
    isDataLoaded: new Date("1970/01/02 00:00:00"),
    dataLifetime: parseInt(process.env.VUE_APP_DATA_LIFETIME)
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
      if (window.debugLevel > 10) {
        console.debug("cmsRoutes/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (!payload || !payload.data)
        throw new Error("cmsRoutes/setData needs to payload.data");
      state.data = payload.data;
      if (window.debugLevel > 50) {
        console.debug("cmsRoutes/setData data", state.data);
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("cmsRoutes/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("cmsRoutes/fetchData already in progress...");
        }
        return this.dataPromise;
      }
      // Создаем промис загрузки данных
      this.dataPromise = new Promise((resolve, reject) => {
        // Пытаемся получить данные из локального кэша
        if (
          state.isDataLoaded &&
          !(
            Date.now() - new Date(state.isDataLoaded).getTime() >
            state.dataLifetime
          ) &&
          state.data &&
          payload.forced === false
        ) {
          if (window.debugLevel > 10) {
            console.debug(
              "cmsRoutes/fetchData loaded from CACHE",
              state.isDataLoaded,
              state.data
            );
          }
          return resolve(state.data);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.route +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug("cmsRoutes/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("cmsRoutes/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("cmsRoutes/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug("cmsRoutes/fetchData loaded from API", state.data);
            }
            resolve(state.data);
          })
          .catch(error => {
            console.error(error);
            reject(error.response);
          })
          .finally(() => {
            commit("setIsDataLoading", false);
            this.dataPromise = null;
          });
      });
    }
  }
};
