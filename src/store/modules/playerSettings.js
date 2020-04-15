import axios from "axios-jsonp-pro";

export default {
  name: "playerSettings",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "base",
    route: "api/v2/player/settings",
    batchObjectName: "BaseApiV2PlayerSettings",
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
        console.debug("playerSettings/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (!payload || typeof payload !== "object") return null;
      state.data = Object.freeze(payload);
      if (window.debugLevel > 50) {
        console.debug("playerSettings/setData data", state.data);
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("playerSettings/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("playerSettings/fetchData already in progress...");
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
              "playerSettings/fetchData loaded from CACHE",
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
          console.debug("playerSettings/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("playerSettings/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("playerSettings/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug(
                "playerSettings/fetchData loaded from API",
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
