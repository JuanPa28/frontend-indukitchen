import { defineConfig } from "cypress";
const webpackPreprocessor = require("@cypress/webpack-preprocessor");

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Configurar webpack para procesar TypeScript
      const options = {
        webpackOptions: require("./cypress/webpack.config.js"),
      };
      on("file:preprocessor", webpackPreprocessor(options));

      // Implementar plugins de cobertura
      require("@cypress/code-coverage/task")(on, config);

      return config;
    },
  },

  env: {
    codeCoverage: {
      url: "/api/__coverage__",
      exclude: [
        "cypress/**/*.*",
        "**/*.spec.ts",
        "**/*.e2e.js",
        "**/node_modules/**",
        "**/environments/**",
      ],
    },
  },

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
});
