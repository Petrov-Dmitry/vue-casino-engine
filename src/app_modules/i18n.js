import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const messages = {
  en: {},
  ru: {}
};

export const i18n = new VueI18n({
  locale: process.env.VUE_APP_DEFAULT_LANGUAGE,
  messages
});
