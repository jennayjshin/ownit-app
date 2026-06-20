import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "dj-nativefit",
  brand: {
    displayName: "온잇(OwnIt)",
    primaryColor: "#3182f6",
    icon: "https://static.toss.im/appsintoss/37105/e771990a-430e-4edf-ac20-605d740a1705.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
