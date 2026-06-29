import { defineConfig } from "orval";

export default defineConfig({
  api: {
    output: {
      mode: "split",
      target: "src/api/generated/index.ts",
      schemas: "src/api/generated/model",
      client: "react-query",
      baseUrl: "/api",
    },
    input: {
      target: "https://api.mdrive.mandacode.com/openapi.json",
    },
  },
});
