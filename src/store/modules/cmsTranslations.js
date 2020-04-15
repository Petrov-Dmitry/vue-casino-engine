import axios from "axios-jsonp-pro";

export default {
  name: "cmsTranslations",
  namespaced: true,
  dataPromise: null,
  state: {
    api: "cms",
    route: "api/cms/strings/%lang%",
    batchObjectName: "CmsApiCmsStrings%lang%",
    lang: window.LANG_CODE || process.env.VUE_APP_DEFAULT_LANGUAGE,
    data: null,
    isDataLoading: false,
    isDataLoaded: {},
    dataLifetime: parseInt(process.env.VUE_APP_DATA_LIFETIME)
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
      if (window.debugLevel > 10) {
        console.debug("cmscmsTranslations/setDataLoading", state.isDataLoading);
      }
    },
    setData(state, payload) {
      if (!payload || typeof payload !== "object") return null;
      const data = {};
      data[state.lang] = payload;
      state.data = {
        ...state.data,
        ...data
      };
      if (window.debugLevel > 10) {
        console.debug("cmsTranslations/setData", state.data);
      }
      this.commit("cmsTranslations/setTranslations");
    },
    setTranslations(state, payload = {}) {
      if (!payload || !payload.lang) payload.lang = state.lang;
      if (this._vm.$i18n.localeExists(payload.lang)) {
        this._vm.$i18n.replace(
          payload.lang,
          this.getters["cmsTranslations/currentLocaleTranslations"]
        );
      } else {
        this._vm.$i18n.add(
          payload.lang,
          this.getters["cmsTranslations/currentLocaleTranslations"]
        );
      }
      this._vm.$i18n.set(payload.lang);
      if (window.debugLevel > 10) {
        console.debug(
          "cmsTranslations/setTranslations",
          payload.lang,
          this.getters["cmsTranslations/currentLocaleTranslations"]
        );
      }
    }
  },
  actions: {
    fetchData({ state, rootState, commit }, payload = {}) {
      if (!payload.forced) payload.forced = false;
      if (!payload.lang) payload.lang = state.lang;
      if (window.debugLevel > 10) {
        console.debug("cmsTranslations/fetchData", payload, state.data);
      }
      // Возвращаем промис если данные уже грузятся
      if (state.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("cmsTranslations/fetchData already in progress...");
        }
        return this.dataPromise;
      }
      // Создаем промис загрузки данных
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
          if (window.debugLevel > 10) {
            console.debug(
              "cmsTranslations/fetchData loaded from CACHE",
              state.isDataLoaded[payload.lang],
              state.data
            );
          }
          commit("setTranslations", { lang: payload.lang });
          return resolve(state.data);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          state.route.replace("%lang%", payload.lang) +
          "?requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug("cmsTranslations/fetchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setIsDataLoading", true);
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("cmsTranslations/fetchData response has no data");
            }
            const data = {};
            data[payload.lang] = response.data;
            if (window.debugLevel > 10) {
              console.debug("cmsTranslations/fetchData response", response);
            }
            state.isDataLoaded[payload.lang] = new Date();
            commit("setData", data);
            commit("setTranslations", { lang: payload.lang });
            if (window.debugLevel > 10) {
              console.debug(
                "cmsTranslations/fetchData loaded from API",
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
