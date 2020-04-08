/* eslint-disable no-console */
import { register } from "register-service-worker";

if (process.env.VUE_APP_SERVICE_WORKER_ENABLED === "true") {
  if (window.debugLevel >= 5) console.debug("registerServiceWorker");
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      if (window.debugLevel >= 2)
        console.debug(
          "App is being served from cache by a service worker.\n" +
            "For more details, visit https://goo.gl/AFskqB"
        );
    },
    registered() {
      if (window.debugLevel >= 1)
        console.debug("Service worker has been registered.");
    },
    cached() {
      if (window.debugLevel >= 2)
        console.debug("Content has been cached for offline use.");
    },
    updatefound() {
      if (window.debugLevel >= 2) console.debug("New content is downloading.");
    },
    updated() {
      if (window.debugLevel >= 2)
        console.debug("New content is available; please refresh.");
    },
    offline() {
      if (window.debugLevel >= 1)
        console.debug(
          "No internet connection found. App is running in offline mode."
        );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    }
  });
}
