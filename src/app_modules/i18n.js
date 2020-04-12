import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const messages = {};

export const i18n = new VueI18n({
  locale: window.LANG_CODE || process.env.VUE_APP_DEFAULT_LANGUAGE,
  messages
});
