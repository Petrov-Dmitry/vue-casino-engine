import Vue from "vue";
import Vuex from "vuex";
// @see https://github.com/robinvdvleuten/vuex-persistedstate#createpersistedstateoptions
import createPersistedState from "vuex-persistedstate";
// @see https://github.com/dkfbasel/vuex-i18n
import vuexI18n from "vuex-i18n";
// @see ^ https://medium.com/devschacht/%D0%BF%D1%8F%D1%82%D1%8C-%D0%BF%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD%D0%BE%D0%B2-vuex-f0ba8370b0d5

// Импортируем модули store
import api from "./modules/api";
import player from "./modules/player";
import playerIpInfo from "./modules/playerIpInfo";
import playerSettings from "./modules/playerSettings";
import cmsTranslations from "./modules/cmsTranslations";
import cmsSettings from "./modules/cmsSettings";
import cmsCurrencies from "./modules/cmsCurrencies";
import cmsRoutes from "./modules/cmsRoutes";
// Загружаем модули в store
const modules = {
  api,
  player,
  playerIpInfo,
  playerSettings,
  cmsTranslations,
  cmsSettings,
  cmsCurrencies,
  cmsRoutes
};
// Загружаем плагины vuex
const plugins = [];
plugins.push(createPersistedState());

// Создаем экземпляр store
Vue.use(Vuex);
export const store = new Vuex.Store({
  state: {},
  plugins: plugins,
  mutations: {},
  actions: {},
  modules: modules
});

// initialize the internationalization plugin on the vue instance
Vue.use(vuexI18n.plugin, store);
