import axios from "axios-jsonp-pro";

export default {
  name: "api",
  namespaced: true,
  dataPromise: {},
  state: {
    apiPath: process.env.VUE_APP_API_PATH,
    batchPath: process.env.VUE_APP_API_PATH_BATCH + "?",
    isDataLoading: false
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
    setIsDataLoading(state, payload) {
      state.isDataLoading = !!payload;
      if (window.debugLevel > 10) {
        console.debug("api/setDataLoading", state.isDataLoading);
      }
    }
  },
  actions: {
    batchData({ rootState, commit }, payload = {}) {
      if (!payload.modules || !payload.modules.length) return;
      if (!payload.lang)
        payload.lang =
          (rootState.player &&
            rootState.player.data &&
            rootState.player.data.language) ||
          window.LANG_CODE ||
          process.env.VUE_APP_DEFAULT_LANGUAGE;
      if (!payload.currency)
        payload.currency =
          (rootState.player &&
            rootState.player.data &&
            rootState.player.data.currency) ||
          process.env.VUE_APP_DEFAULT_CURRENCY;
      if (!payload.forced) payload.forced = false;
      if (window.debugLevel > 10) {
        console.debug("api/batchData", payload);
      }
      // Возвращаем промис если данные уже грузятся
      if (this.isDataLoading) {
        if (window.debugLevel > 10) {
          console.debug("api/batchData already in progress...");
        }
        return this.dataPromise;
      }
      // Создаем промис загрузки данных
      this.dataPromise = new Promise((resolve, reject) => {
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
            return resolve(rootState[moduleName].data);
          }
          // Добавляем запрос в список
          const moduleRoute = module.route.replace("%lang%", payload.lang);
          const moduleBatchName = module.batchObjectName.replace(
            "%lang%",
            payload.lang.charAt(0).toUpperCase() + payload.lang.slice(1)
          );
          if (!moduleRoute || !moduleBatchName) return;
          const moduleQuery = module.api + "[]=" + moduleRoute;
          if (window.debugLevel > 50) {
            console.debug("api/batchData", moduleName, module, moduleQuery);
          }
          modulesRequests.push(moduleQuery);
        });
        if (!modulesRequests.length) return resolve(rootState);
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
        commit("setIsDataLoading", true);
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
              if (!moduleBatchName || !moduleResponse) return;
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
              resolve(rootState[moduleName]);
            });
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
