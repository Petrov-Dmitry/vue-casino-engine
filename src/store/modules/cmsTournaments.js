import axios from "axios-jsonp-pro";

export default {
  name: "cmsTournaments",
  namespaced: true,
  dataPromise: null,
  extendedDataPromise: null,
  topPlayersDataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/v2/tournaments/%lang%",
    batchObjectName: "CmsApiCmsV2Tournaments%lang%",
    data: null,
    isDataLoading: false,
    isDataLoaded: new Date("1970/01/02 00:00:00"),
    extendedData: {},
    isExtendedDataLoading: {},
    isExtendedDataLoaded: {},
    routeTopPlayers: "api/tournaments",
    topPlayersData: {},
    isTopPlayersDataLoading: {},
    isTopPlayersDataLoaded: {},
    dataLifetime: parseInt(process.env.VUE_APP_DATA_LIFETIME)
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
      if (window.debugLevel > 10) {
        console.debug("cmsTournaments/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (
        !payload ||
        !payload.data ||
        !Array.isArray(payload.data) ||
        !payload.data.length
      )
        throw new Error("cmsTournaments/setData needs to payload.data array");
      state.data = payload.data;
      if (window.debugLevel > 50) {
        console.debug("cmsTournaments/setData data", state.data);
      }
    },
    setExtendedDataLoading(state, payload = {}) {
      if (!payload.id)
        throw new Error(
          "cmsTournaments/setExtendedDataLoading needs to payload.id"
        );
      if (!payload.status) payload.status = false;
      state.isExtendedDataLoading[payload.id] = payload.status;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTournaments/setExtendedDataLoading",
          payload.id,
          state.isExtendedDataLoading[payload.id]
        );
      }
    },
    setExtendedData(state, payload) {
      if (!payload || !payload.id)
        throw new Error("cmsTournaments/setExtendedData needs to payload.id");
      state.extendedData[payload.id] = payload;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTournaments/setExtendedData",
          payload.id,
          state.extendedData[payload.id]
        );
      }
    },
    setTopPlayersDataLoading(state, payload = true) {
      if (!payload.id)
        throw new Error(
          "cmsTournaments/setTopPlayersDataLoading needs to payload.id"
        );
      if (!payload.status) payload.status = false;
      state.isTopPlayersDataLoading[payload.id] = payload.status;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTournaments/setTopPlayersDataLoading",
          payload.id,
          state.isTopPlayersDataLoading[payload.id]
        );
      }
    },
    setTopPlayersData(state, payload) {
      if (!payload || !payload.id || !payload.top_players)
        throw new Error(
          "cmsTournaments/setTopPlayers needs to payload.id and payload.top_players"
        );
      state.topPlayersData[payload.id] = payload.top_players;
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      // Устанавливаем язык запросов
      if (!payload.lang) payload.lang = this.getters["api/getLangCode"];
      if (window.debugLevel > 10) {
        console.debug("cmsTournaments/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("cmsTournaments/fetchData already in progress...");
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
              "cmsTournaments/fetchData loaded from CACHE",
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
          console.debug("cmsTournaments/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("cmsTournaments/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("cmsTournaments/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTournaments/fetchData loaded from API",
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
    },
    fetchExtendedData({ commit, state, rootState }, payload = {}) {
      if (!payload.id)
        throw new Error("cmsTournaments/fetchExtendedData needs to payload.id");
      if (!payload.forced) payload.forced = false;
      // Устанавливаем язык запросов
      if (!payload.lang) payload.lang = this.getters["api/getLangCode"];
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTournaments/fetchExtendedData",
          payload.id,
          state.extendedData[payload.id]
        );
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isExtendedDataLoading[payload.id]) {
        if (window.debugLevel > 10) {
          console.debug(
            "cmsTournaments/fetchExtendedData",
            payload.id,
            "already in progress..."
          );
        }
        return this.extendedDataPromise;
      }
      // Создаем промис загрузки данных
      this.extendedDataPromise = new Promise((resolve, reject) => {
        // Пытаемся получить данные из локального кэша
        if (
          state.isExtendedDataLoaded[payload.id] &&
          !(
            Date.now() -
              new Date(state.isExtendedDataLoaded[payload.id]).getTime() >
            state.dataLifetime
          ) &&
          state.extendedData[payload.id] &&
          payload.forced === false
        ) {
          if (window.debugLevel > 10) {
            console.debug(
              "cmsTournaments/fetchExtendedData loaded from CACHE",
              payload.id,
              state.isExtendedDataLoaded[payload.id],
              state.extendedData[payload.id]
            );
          }
          return resolve(state.extendedData[payload.id]);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.route.replace("%lang%", `${payload.id}/${payload.lang}`) +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug(
            "cmsTournaments/fetchExtendedData requestUrl",
            payload.id,
            requestUrl
          );
        }
        // Запрашиваем данные из API
        commit("setExtendedDataLoading", { id: payload.id, status: true });
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data.data) {
              throw new Error(
                "cmsTournaments/fetchExtendedData response has no data",
                payload.id
              );
            }
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTournaments/fetchExtendedData response",
                payload.id,
                response
              );
            }
            state.isExtendedDataLoaded[payload.id] = new Date();
            commit("setExtendedData", response.data.data);
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTournaments/fetchExtendedData loaded from API",
                payload.id,
                state.extendedData[payload.id]
              );
            }
            resolve(state.extendedData[payload.id]);
          })
          .catch(error => {
            console.error(error);
            reject(error.response);
          })
          .finally(() => {
            commit("setExtendedDataLoading", {
              id: payload.id,
              status: false
            });
            this.extendedDataPromise = null;
          });
      });
      return this.extendedDataPromise;
    },
    fetchTopPlayersData({ commit, state, rootState }, payload = {}) {
      if (!payload.id)
        throw new Error(
          "cmsTournaments/fetchTopPlayersData needs to payload.id"
        );
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTournaments/fetchTopPlayersData",
          payload.id,
          state.topPlayersData[payload.id]
        );
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isTopPlayersDataLoading[payload.id]) {
        if (window.debugLevel > 10) {
          console.debug(
            "cmsTournaments/fetchTopPlayersData",
            payload.id,
            "already in progress..."
          );
        }
        return this.topPlayersDataPromise;
      }
      // Создаем промис загрузки данных
      this.topPlayersDataPromise = new Promise((resolve, reject) => {
        // Пытаемся получить данные из локального кэша
        if (
          state.isTopPlayersDataLoaded[payload.id] &&
          !(
            Date.now() -
              new Date(state.isTopPlayersDataLoaded[payload.id]).getTime() >
            state.dataLifetime
          ) &&
          state.topPlayersData[payload.id] &&
          payload.forced === false
        ) {
          if (window.debugLevel > 10) {
            console.debug(
              "cmsTournaments/fetchTopPlayersData loaded from CACHE",
              payload.id,
              state.isTopPlayersDataLoaded[payload.id],
              state.topPlayersData[payload.id]
            );
          }
          return resolve(state.topPlayersData[payload.id]);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.routeTopPlayers +
          "/" +
          payload.id +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug(
            "cmsTournaments/fetchTopPlayersData requestUrl",
            payload.id,
            requestUrl
          );
        }
        // Запрашиваем данные из API
        commit("setTopPlayersDataLoading", { id: payload.id, status: true });
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error(
                "cmsTournaments/fetchTopPlayersData response has no data",
                payload.id
              );
            }
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTournaments/fetchTopPlayersData response",
                payload.id,
                response
              );
            }
            state.isTopPlayersDataLoaded[payload.id] = new Date();
            commit("setTopPlayersData", response.data);
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTournaments/fetchTopPlayersData loaded from API",
                payload.id,
                state.topPlayersData[payload.id]
              );
            }
            resolve(state.topPlayersData[payload.id]);
          })
          .catch(error => {
            console.error(error);
            reject(error.response);
          })
          .finally(() => {
            commit("setTopPlayersDataLoading", {
              id: payload.id,
              status: false
            });
            this.topPlayersDataPromise = null;
          });
      });
      return this.topPlayersDataPromise;
    }
  }
};
