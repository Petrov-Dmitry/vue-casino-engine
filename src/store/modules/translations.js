import axios from "axios-jsonp-pro";

export default {
  name: "translations",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/strings/%lang%",
    batchObjectName: "CmsApiCmsStrings%lang%",
    lang: window.LANG_CODE || process.env.VUE_APP_DEFAULT_LANGUAGE,
    data: {},
    isDataLoading: false,
    isDataLoaded: {},
    dataLifetime: 10 * 60 * 1000 // Время жизни загруженных данных - 10 минут в ms
  },
  getters: {
    currentLocaleTranslations(state) {
      return state.data[state.lang] || {};
    }
  },
  mutations: {
    setIsDataLoading(state, payload = false) {
      payload = !!payload;
      state.isDataLoading = payload;
    },
    setData(state, payload) {
      if (!payload) return;
      state.data = {
        ...state.data,
        ...payload
      };
      if (window.debugLevel > 10) {
        console.debug("translations/setData", state.data);
      }
      if (this._vm.$i18n.localeExists(state.lang)) {
        this._vm.$i18n.replace(
          state.lang,
          this.getters["translations/currentLocaleTranslations"]
        );
      } else {
        this._vm.$i18n.add(
          state.lang,
          this.getters["translations/currentLocaleTranslations"]
        );
      }
      this._vm.$i18n.set(state.lang);
      if (window.debugLevel > 10) {
        console.debug(
          "translations/setData $i18n.translations updated",
          state.lang,
          this.getters["translations/currentLocaleTranslations"]
        );
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (!payload.lang) payload.lang = state.lang;
      if (window.debugLevel > 10) {
        console.debug("translations/fetchData", payload, state.isDataLoading);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("translations/fetchData already in progress...");
        }
        return this.dataPromise;
      }

      this.dataPromise = new Promise((resolve, reject) => {
        // Пытаемся получить данные из локального кэша
        if (
          state.isDataLoaded[payload.lang] &&
          !(
            Date.now() - new Date(state.isDataLoaded[payload.lang]).getTime() >
            state.dataLifetime
          ) &&
          state.data[payload.lang] &&
          payload.forced === false
        ) {
          const data = {};
          data[payload.lang] = state.data[payload.lang];
          commit("setData", data);
          if (window.debugLevel > 10) {
            console.debug(
              "translations/fetchData loaded from CACHE",
              state.isDataLoaded[payload.lang],
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
          console.debug("translations/fetchData requestUrl", requestUrl);
        }

        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("translations/fetchData response has no data");
            }
            const data = {};
            data[payload.lang] = response.data;
            if (window.debugLevel > 10) {
              console.debug("translations/fetchData response", response);
            }
            commit("setData", data);
            state.isDataLoaded[payload.lang] = new Date();
            if (window.debugLevel > 10) {
              console.debug(
                "translations/fetchData loaded from API",
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
      return this.dataPromise;
    }
  }
};
