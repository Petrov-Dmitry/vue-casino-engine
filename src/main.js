import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./app_modules/cookies";
import "./app_modules/debugLevel";
import "./app_modules/registerServiceWorker";
import { i18n } from "./app_modules/i18n";

Vue.config.productionTip = false;
window.vm = new Vue({
  router,
  store,
  render: h => h(App),
  i18n
}).$mount("#app");
