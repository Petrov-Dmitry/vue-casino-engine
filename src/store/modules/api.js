import axios from "axios-jsonp-pro";

export default {
  name: "api",
  namespaced: true,
  state: {
    apiPath: process.env.VUE_APP_API_PATH,
    batchPath: process.env.VUE_APP_API_PATH_BATCH + "?",
    dataPromise: {},
    isDataLoading: {}
  },
  getters: {
    defaultLocaleCode(state, getters, rootState) {
      return (
        (rootState.player &&
          rootState.player.data &&
          rootState.player.data.language) ||
        (rootState.cmsLocales.data &&
          rootState.cmsLocales.length &&
          rootState.cmsLocales.find(locale => !!locale.default).code) ||
        window.LANG_CODE ||
        process.env.VUE_APP_DEFAULT_LANGUAGE
      );
    },
    defaultCurrencyCode(state, getters, rootState) {
      return (
        (rootState.player &&
          rootState.player.data &&
          rootState.player.data.currency) ||
        process.env.VUE_APP_DEFAULT_CURRENCY
      );
    }
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
    setDataLoading(state, payload = {}) {
      if (!payload || !payload.queryName) return;
      if (!payload.loading) payload.loading = false;
      state.isDataLoading[payload.queryName] = payload.loading;
      if (window.debugLevel > 10) {
        console.debug(
          "api/setDataLoading",
          payload.queryName,
          state.isDataLoading[payload.queryName]
        );
      }
    }
  },
  actions: {
    batchData({ state, rootState, getters, commit }, payload = {}) {
      // Проверяем наличие списка модулей
      if (
        !payload ||
        !payload.modules ||
        !Array.isArray(payload.modules) ||
        !payload.modules.length
      ) {
        throw new Error(
          "List of modules should be passed to create batch query"
        );
      }
      // Устанавливаем язык запросов
      if (!payload.lang) payload.lang = getters.defaultLocaleCode;
      // Устанавливаем валюту запросов
      if (!payload.currency) payload.currency = getters.defaultCurrencyCode;
      // Признак принудительного запроса данных из API
      if (!payload.forced) payload.forced = false;
      // Хэш запроса
      if (window.debugLevel > 10) {
        console.debug("api/batchData", payload, payload.modules);
      }
      // Возвращаем промис если данные уже грузятся
      if (
        state.isDataLoading[payload.modules] &&
        state.dataPromise[payload.modules] &&
        Date.now() - new Date(state.isDataLoading[payload.modules]).getTime() <
          parseInt(process.env.VUE_APP_API_TIMEOUT)
      ) {
        if (window.debugLevel > 10) {
          console.debug(
            "api/batchData already in progress...",
            state.isDataLoading[payload.modules]
          );
        }
        return state.dataPromise[payload.modules];
      }
      // Создаем промис загрузки данных
      state.dataPromise[payload.modules] = new Promise((resolve, reject) => {
        const modulesRequests = [];
        payload.modules.forEach(moduleName => {
          const module = rootState[moduleName] || false;
          if (!module) return;
          // Пытаемся получить данные из локального кэша
          if (
            rootState[moduleName] &&
            rootState[moduleName].isDataLoaded &&
            !(
              Date.now() -
                new Date(rootState[moduleName].isDataLoaded).getTime() >
              rootState[moduleName].dataLifetime
            ) &&
            rootState[moduleName].data &&
            payload.forced === false
          ) {
            if (window.debugLevel > 50) {
              console.debug(
                "api/batchData",
                moduleName,
                "loaded from CACHE",
                rootState[moduleName].isDataLoaded,
                rootState[moduleName].data
              );
            }
            return rootState;
          }
          // Добавляем запрос в список
          const moduleRoute = module.route.replace("%lang%", payload.lang);
          const moduleBatchName = module.batchObjectName.replace(
            "%lang%",
            payload.lang.charAt(0).toUpperCase() + payload.lang.slice(1)
          );
          if (!moduleRoute || !moduleBatchName) return rootState;
          const moduleQuery = module.api + "[]=" + moduleRoute;
          if (window.debugLevel > 50) {
            console.debug("api/batchData", moduleName, module, moduleQuery);
          }
          modulesRequests.push(moduleQuery);
        });
        if (!modulesRequests.length) return rootState;
        if (window.debugLevel > 10) {
          console.debug("api/batchData modulesRequests", modulesRequests);
        }
        // Строим запрос к API
        let requestUrl =
          rootState.api.apiPath +
          rootState.api.batchPath +
          modulesRequests.join("&") +
          "&requestUUID=" +
          this._vm.$uuid.v1();
        if (window.debugLevel > 10) {
          console.debug("api/batchData requestUrl", requestUrl);
        }
        // Запрашиваем данные из API
        commit("setDataLoading", {
          queryName: payload.modules,
          loading: new Date()
        });
        state.isDataLoading[payload.modules] = true;
        axios
          .get(requestUrl)
          .then(response => {
            if (!response.data) {
              throw new Error("api/batchData response has no data");
            }
            if (window.debugLevel > 10) {
              console.debug("api/batchData response", response);
            }
            // Получаем данные модулей
            payload.modules.forEach(moduleName => {
              const module = rootState[moduleName] || false;
              if (!module) return;
              const moduleBatchName = module.batchObjectName.replace(
                "%lang%",
                payload.lang.charAt(0).toUpperCase() + payload.lang.slice(1)
              );
              const moduleResponse = response.data[moduleBatchName] || false;
              if (!moduleBatchName || !moduleResponse) return rootState;
              if (window.debugLevel > 10) {
                console.debug(
                  "api/batchData response",
                  moduleName,
                  moduleResponse
                );
              }
              rootState[moduleName].isDataLoaded = new Date();
              commit(moduleName + "/setData", moduleResponse, { root: true });
              if (window.debugLevel > 10) {
                console.debug(
                  "api/batchData",
                  moduleName,
                  "loaded from API",
                  rootState[moduleName]
                );
              }
            });
            resolve(rootState);
          })
          .catch(error => {
            console.error(error);
            reject(error.response);
          })
          .finally(() => {
            commit("setDataLoading", {
              queryName: payload.modules,
              loading: false
            });
            state.dataPromise[payload.modules] = null;
          });
      });
      return state.dataPromise[payload.modules];
    }
  }
};
