import { defineConfig } from "orval";

const API_BASE = "https://api.mdrive.mandacode.com";

export default defineConfig({
  api: {
    output: {
      mode: "split",
      target: "src/api/generated/index.ts",
      schemas: "src/api/generated/model",
      client: "react-query",
      baseUrl: API_BASE,
      mock: { generators: [{ type: "msw" }] },
    },
    input: {
      target: "https://api.mdrive.mandacode.com/openapi.json",
    },
  },
});