import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "dj-nativefit",
  brand: {
    displayName: "온잇(OwnIt)",
    primaryColor: "#3182f6",
    icon: "https://static.toss.im/appsintoss/37105/35d9c35c-5c5b-4356-8877-a2af82c463ef.png",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
