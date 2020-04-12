import axios from "axios-jsonp-pro";

export default {
  name: "cmsSettings",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/settings",
    batchObjectName: "CmsApiCmsSettings",
    data: null,
    isDataLoaded: new Date("1970/01/02 00:00:00"),
    dataLifetime: 10 * 60 * 1000 // Время жизни загруженных данных - 10 минут в ms
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
    },
    setData(state, payload) {
      if (!payload || typeof payload !== "object") return;
      if (window.debugLevel > 10) {
        console.debug("cmsSettings/setData", state.data, payload);
      }
      const data = {};
      Object.keys(payload).forEach(key => {
        data[key] = JSON.parse(payload[key]) || {};
      });
      state.data = Object.keys(data).length ? data : null;
      if (window.debugLevel > 50) {
        console.debug("cmsSettings/setData data", data);
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("cmsSettings/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("cmsSettings/fetchData already in progress...");
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
              "cmsSettings/fetchData loaded from CACHE",
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
          console.debug("cmsSettings/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("translations/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("cmsSettings/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug(
                "cmsSettings/fetchData loaded from API",
                state.data
              );
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
