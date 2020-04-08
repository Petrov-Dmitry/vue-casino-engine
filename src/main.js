import Vue from "vue";
import VueCookies from "vue-cookies";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./registerServiceWorker";

Vue.config.productionTip = false;

Vue.use(VueCookies);
Vue.$cookies.config("30d");

console.log(process.env);

window.vm = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
