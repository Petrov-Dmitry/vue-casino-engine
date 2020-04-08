import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./cookies";
import "./debugLevel";
import "./registerServiceWorker";

Vue.config.productionTip = false;
window.vm = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
