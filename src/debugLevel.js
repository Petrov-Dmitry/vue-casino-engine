import VueCookies from "vue-cookies";
window.debugLevel = parseInt(process.env.VUE_APP_DEFAULT_DEBUG_LEVEL);
if (window.debugLevel >= 1)
  console.debug("debugLevel default", window.debugLevel);
const cookieDebugLevel = parseInt(VueCookies.get("debugLevel"));
if (cookieDebugLevel) {
  window.debugLevel = cookieDebugLevel;
  if (window.debugLevel >= 2)
    console.debug("debugLevel cookie", window.debugLevel);
}
