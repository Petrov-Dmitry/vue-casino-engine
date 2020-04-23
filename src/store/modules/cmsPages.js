import axios from "axios-jsonp-pro";

export default {
  name: "cmsPages",
  namespaced: true,
  dataPromise: null,
  extendedDataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/pages/%lang%",
    batchObjectName: "CmsApiCmsPages%lang%",
    data: null,
    isDataLoading: false,
    isDataLoaded: new Date("1970/01/02 00:00:00"),
    extendedData: {},
    isExtendedDataLoading: {},
    isExtendedDataLoaded: {},
    dataLifetime: parseInt(process.env.VUE_APP_DATA_LIFETIME)
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
      if (window.debugLevel > 10) {
        console.debug("cmsPages/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (!payload || !payload.data)
        throw new Error("cmsPages/setData needs to payload.data");
      state.data = payload.data;
      if (window.debugLevel > 50) {
        console.debug("cmsPages/setData data", state.data);
      }
    },
    setExtendedDataLoading(state, payload = true) {
      if (!payload.code)
        throw new Error(
          "cmsPages/setExtendedDataLoading needs to payload.code"
        );
      if (!payload.status) payload.status = false;
      state.isExtendedDataLoading[payload.code] = payload.status;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsPages/setExtendedDataLoading",
          payload.code,
          state.isExtendedDataLoading[payload.code]
        );
      }
    },
    setExtendedData(state, payload) {
      if (!payload || !payload.code)
        throw new Error("cmsPages/setExtendedData needs to payload.code");
      state.extendedData[payload.code] = payload;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsPages/setExtendedData",
          payload.code,
          state.extendedData[payload.code]
        );
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      // Устанавливаем язык запросов
      if (!payload.lang) payload.lang = this.getters["api/getLangCode"];
      if (window.debugLevel > 10) {
        console.debug("cmsPages/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("cmsPages/fetchData already in progress...");
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
              "cmsPages/fetchData loaded from CACHE",
              state.isDataLoaded,
              state.data
            );
          }
          return resolve(state.data);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.route.replace("%lang%", payload.lang) +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug("cmsPages/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("cmsPages/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("cmsPages/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug("cmsPages/fetchData loaded from API", state.data);
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
    },
    fetchExtendedData({ commit, state, rootState }, payload = {}) {
      if (!payload.code)
        throw new Error("cmsPages/fetchExtendedData needs to payload.code");
      if (!payload.forced) payload.forced = false;
      // Устанавливаем язык запросов
      if (!payload.lang) payload.lang = this.getters["api/getLangCode"];
      if (window.debugLevel > 10) {
        console.debug(
          "cmsPages/fetchExtendedData",
          payload.code,
          state.extendedData[payload.code]
        );
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isExtendedDataLoading[payload.code]) {
        if (window.debugLevel > 10) {
          console.debug(
            "cmsPages/fetchExtendedData",
            payload.code,
            "already in progress..."
          );
        }
        return this.extendedDataPromise;
      }
      // Создаем промис загрузки данных
      this.extendedDataPromise = new Promise((resolve, reject) => {
        // Пытаемся получить данные из локального кэша
        if (
          state.isExtendedDataLoaded[payload.code] &&
          !(
            Date.now() -
              new Date(state.isExtendedDataLoaded[payload.code]).getTime() >
            state.dataLifetime
          ) &&
          state.extendedData[payload.code] &&
          payload.forced === false
        ) {
          if (window.debugLevel > 10) {
            console.debug(
              "cmsPages/fetchExtendedData loaded from CACHE",
              payload.code,
              state.isExtendedDataLoaded[payload.code],
              state.extendedData[payload.code]
            );
          }
          return resolve(state.extendedData[payload.code]);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.route.replace("%lang%", `${payload.code}/${payload.lang}`) +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug(
            "cmsPages/fetchExtendedData requestUrl",
            payload.code,
            requestUrl
          );
        }
        // Запрашиваем данные из API
        commit("setExtendedDataLoading", { id: payload.code, status: true });
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data.data) {
              throw new Error(
                "cmsPages/fetchExtendedData response has no data",
                payload.code
              );
            }
            if (window.debugLevel > 10) {
              console.debug(
                "cmsPages/fetchExtendedData response",
                payload.code,
                response
              );
            }
            state.isExtendedDataLoaded[payload.code] = new Date();
            commit("setExtendedData", response.data.data);
            if (window.debugLevel > 10) {
              console.debug(
                "cmsPages/fetchExtendedData loaded from API",
                payload.code,
                state.extendedData[payload.code]
              );
            }
            resolve(state.extendedData[payload.code]);
          })
          .catch(error => {
            console.error(error);
            reject(error.response);
          })
          .finally(() => {
            commit("setExtendedDataLoading", {
              code: payload.code,
              status: false
            });
            this.extendedDataPromise = null;
          });
      });
      return this.extendedDataPromise;
    }
  }
};
