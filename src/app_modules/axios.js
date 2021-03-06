import Axios from "axios-jsonp-pro";

Axios.defaults.timeout = parseInt(process.env.VUE_APP_API_TIMEOUT);
Axios.defaults.headers = {
  Accept: "application/vnd.softswiss.v1+json",
  "Content-Type": "application/json"
};
Axios.defaults.withCredentials = true;

Axios.interceptors.response.use(null, err => {
  const { config, response } = err;
  config.attempts = config.attempts || 1;
  config.timeout = config.timeout * (config.attempts + 1);
  if (
    config &&
    config.method === "get" &&
    config.attempts < parseInt(process.env.VUE_APP_API_QUERY_TRYS) &&
    !(response.status >= 400 && response.status < 500)
  ) {
    if (window.debugLevel >= 2)
      console.debug(
        "Axios retry query",
        config.url,
        "attempt",
        config.attempts,
        "with timeout",
        config.timeout
      );
    config.attempts = config.attempts + 1;
    return Axios.request(config);
  } else {
    return Promise.reject(err);
  }
});
