import axios from "axios-jsonp-pro";

export default {
  name: "player",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "base",
    route: "api/player",
    batchObjectName: "BaseApiPlayer",
    data: null,
    isDataLoading: false,
    isDataLoaded: new Date("1970/01/02 00:00:00"),
    dataLifetime: parseInt(process.env.VUE_APP_PLAYER_DATA_LIFETIME)
  },
  getters: {
    isPlayerAuthorized(state) {
      return state.data && !!state.data.id;
    },
    isMissedEmail(state) {
      return (
        state.data &&
        state.data.authFieldsMissed &&
        state.data.authFieldsMissed.length &&
        state.data.authFieldsMissed.includes("email")
      );
    },
    isMissedCurrency(state) {
      return (
        state.data &&
        state.data.authFieldsMissed &&
        state.data.authFieldsMissed.length &&
        state.data.authFieldsMissed.includes("currency")
      );
    },
    isAccountFilled(state) {
      return Boolean(
        state.data &&
          state.data.mobilePhone &&
          state.data.nickname &&
          state.data.email &&
          state.data.currency &&
          state.data.firstName &&
          state.data.lastName &&
          state.data.country &&
          state.data.dateOfBirth &&
          state.data.gender
      );
    },
    isTrustedUser(state) {
      return (
        state.data &&
        state.data.statuses &&
        state.data.statuses.length &&
        state.data.statuses.find(item => item.id === "trusted_users")
      );
    }
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
      if (window.debugLevel > 10) {
        console.debug("player/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (!payload || typeof payload !== "object") return null;
      state.data = Object.freeze(payload);
      if (window.debugLevel > 50) {
        console.debug("player/setData data", state.data);
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("player/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("player/fetchData already in progress...");
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
              "player/fetchData loaded from CACHE",
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
          console.debug("player/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("player/fetchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("player/fetchData response", response);
            }
            state.isDataLoaded = new Date();
            commit("setData", response.data);
            if (window.debugLevel > 10) {
              console.debug("player/fetchData loaded from API", state.data);
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
