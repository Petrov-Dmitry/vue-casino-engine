module.exports = {
  pwa: {
    workboxPluginMode: "GenerateSW",
    name: "vue-casino-engine",
    themeColor: "#4c4c4c",
    msTileColor: "#1c1e1a",
    manifestCrossorigin: "use-credentials",
    manifestOptions: {
      background_color: "#1c1e1a"
    }
  },

  assetsDir: "assets",
  runtimeCompiler: true,

  css: {
    sourceMap: true
  }
};
