import axios from "axios-jsonp-pro";
import md5 from "js-md5";

export default {
  name: "api",
  namespaced: true,
  state: {
    apiPath: process.env.VUE_APP_API_PATH,
    batchPath: process.env.VUE_APP_API_PATH_BATCH + "?",
    dataPromise: {},
    dataPromiseLoading: {},
    isDataLoading: {}
  },
  getters: {
    getLangCode(state, getters, rootState) {
      const langCode =
        (rootState.player &&
          rootState.player.data &&
          rootState.player.data.language) ||
        (rootState.cmsLocales.data &&
          rootState.cmsLocales.length &&
          rootState.cmsLocales.find(locale => !!locale.default).code) ||
        window.LANG_CODE ||
        process.env.VUE_APP_DEFAULT_LANGUAGE;
      if (window.debugLevel > 50) {
        console.debug("api/getLangCode", langCode);
      }
      return langCode;
    },
    getCurrencyCode(state, getters, rootState) {
      const currencyCode =
        (rootState.player &&
          rootState.player.data &&
          rootState.player.data.currency) ||
        process.env.VUE_APP_DEFAULT_CURRENCY;
      if (window.debugLevel > 50) {
        console.debug("api/getCurrencyCode", currencyCode);
      }
      return currencyCode;
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
    setPromiseStarted(state, payload) {
      if (!payload || !payload.dataPromise) return;
      if (!payload.value) payload.value = false;
      state.dataPromiseLoading[payload.dataPromise] = payload.value;
      if (window.debugLevel > 10) {
        console.debug(
          "api/setPromiseStarted",
          payload.dataPromise,
          state.dataPromiseLoading[payload.dataPromise]
        );
      }
    },
    setDataLoading(state, payload) {
      if (!payload || !payload.moduleName) return;
      if (!payload.value) payload.value = false;
      state.isDataLoading[payload.moduleName] = payload.value;
      if (window.debugLevel > 10) {
        console.debug(
          "api/setDataLoading",
          payload.moduleName,
          state.isDataLoading[payload.moduleName]
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
      if (!payload.lang) payload.lang = getters.getLangCode;
      // Устанавливаем валюту запросов
      if (!payload.currency) payload.currency = getters.getCurrencyCode;
      // Признак принудительного запроса данных из API
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("api/batchData", payload);
      }

      // Проверяем наличие модулей в isDataLoading
      const modulesList = [];
      payload.modules.forEach(moduleName => {
        if (window.debugLevel > 20) {
          console.debug(
            "api/batchData make module query",
            moduleName,
            !state.isDataLoading[moduleName]
          );
        }
        // Если модуль еще не загружается (отсутствует в isDataLoading)
        if (!state.isDataLoading[moduleName]) {
          // Добавим его в список запросов
          modulesList.push(moduleName);
        }
      });

      // Получаем хэш списка запрашиваемых модулей
      const batchHash = md5(modulesList);
      if (window.debugLevel > 10) {
        console.debug("api/batchData modules list", batchHash, modulesList);
      }

      // Возвращаем промис если данные уже грузятся
      if (
        state.dataPromise[batchHash] &&
        state.dataPromiseLoading[batchHash] &&
        Date.now() - new Date(state.dataPromiseLoading[batchHash]).getTime() <
          parseInt(process.env.VUE_APP_API_TIMEOUT)
      ) {
        if (window.debugLevel > 10) {
          console.debug(
            "api/batchData already in progress...",
            batchHash,
            state.dataPromiseLoading[batchHash]
          );
        }
        return state.dataPromise[batchHash];
      }

      // Создаем промис загрузки данных
      state.dataPromise[batchHash] = new Promise((resolve, reject) => {
        commit("setPromiseStarted", {
          dataPromise: batchHash,
          value: new Date()
        });
        const modulesRequests = [];
        modulesList.forEach(moduleName => {
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
          commit("setDataLoading", {
            moduleName: moduleName,
            value: new Date()
          });
        });
        // Если запрашивать нечего - ресолвим промис
        if (!modulesRequests.length) {
          state.dataPromise[batchHash] = null;
          commit("setPromiseStarted", {
            dataPromise: batchHash
          });
          return resolve(rootState);
        }
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
            modulesList.forEach(moduleName => {
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
              commit("setDataLoading", { moduleName: moduleName });
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
            state.dataPromise[batchHash] = null;
            commit("setPromiseStarted", {
              dataPromise: batchHash
            });
          });
      });
      return state.dataPromise[batchHash];
    }
  }
};
