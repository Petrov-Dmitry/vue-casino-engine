import Vue from "vue";
import Vuex from "vuex";
// @see https://github.com/robinvdvleuten/vuex-persistedstate#createpersistedstateoptions
import createPersistedState from "vuex-persistedstate";
// @see https://github.com/dkfbasel/vuex-i18n
import vuexI18n from "vuex-i18n";
// @see https://medium.com/devschacht/%D0%BF%D1%8F%D1%82%D1%8C-%D0%BF%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD%D0%BE%D0%B2-vuex-f0ba8370b0d5

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {},
  plugins: [createPersistedState()],
  mutations: {},
  actions: {},
  modules: {}
});

// initialize the internationalization plugin on the vue instance
Vue.use(vuexI18n.plugin, store);
// add some translations (could also be loaded from a separate file or from API-request)
const translationsEn = {
  content: "This is some {type} content"
};
const translationsDe = {
  "My nice title": "Ein schöner Titel",
  content: "Dies ist ein {type} Inhalt"
};
// add translations directly to the application
Vue.i18n.add("en", translationsEn);
Vue.i18n.add("de", translationsDe);
// set the start locale to use
Vue.i18n.set("en");
