<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link>
      |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

<script>
import { mapGetters } from "vuex";

export default {
  name: "App",
  data() {
    return {
      initialDataList: [
        "player",
        "playerIpInfo",
        "playerSettings",
        "cmsTranslations",
        "cmsSettings",
        "cmsCurrencies",
        "cmsLocales",
        "cmsRoutes",
        "cmsPages"
      ],
      profileDataList: ["player", "playerIpInfo", "playerSettings"]
    };
  },
  computed: {
    ...mapGetters("player", { isPlayerAuthorized: "isPlayerAuthorized" })
  },
  created() {
    if (window.debugLevel > 1) {
      console.debug("App created!", new Date(), this);
    }

    // Запросим данные модулей, необходимых для запуска приложения
    this.fetchInitialData();

    // Данные модулей, необходимых для запуска приложения, загружены
    this.$bus.on("app-initial-data-loaded", data => {
      if (window.debugLevel > 1) {
        console.debug("App: initial data loaded", new Date(), data);
      }
      // Если пользователь авторизован, загружаем данные, относящиеся к его профилю
      if (this.isPlayerAuthorized) {
        if (window.debugLevel > 1) {
          console.debug("App: player authorized - try to load profile data");
        }
        this.fetchProfileData();
      }
    });

    // Данные модулей профиля пользователя загружены
    this.$bus.on("app-profile-data-loaded", data => {
      if (window.debugLevel > 1) {
        console.debug("App: profile data loaded", new Date(), data);
      }
    });
  },
  methods: {
    fetchInitialData() {
      if (window.debugLevel > 1) {
        console.debug(
          "App: fetchInitialData",
          new Date(),
          this.initialDataList
        );
      }
      this.$store
        .dispatch("api/batchData", { modules: this.initialDataList })
        .then(data => {
          this.$bus.emit("app-initial-data-loaded", data);
        });
    },
    fetchProfileData() {
      if (window.debugLevel > 1) {
        console.debug(
          "App: fetchProfileData",
          new Date(),
          this.profileDataList
        );
      }
      this.$store
        .dispatch("api/batchData", { modules: this.profileDataList })
        .then(data => {
          this.$bus.emit("app-profile-data-loaded", data);
        });
    }
  }
};
</script>
