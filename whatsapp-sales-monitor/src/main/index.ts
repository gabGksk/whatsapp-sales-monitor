import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { startHttpServer } from "./api/http-server";
import { createAppServices } from "./services/app-services";

const createWindow = async (): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
};

app.whenReady().then(async () => {
  const services = createAppServices();
  await services.serviceRegistry.startAll();
  const server = startHttpServer(services.db, services.realTimeIntelligenceService);
  await createWindow();

  app.on("before-quit", async () => {
    server.close();
    await services.serviceRegistry.stopAll();
    services.db.close();
  });
});
