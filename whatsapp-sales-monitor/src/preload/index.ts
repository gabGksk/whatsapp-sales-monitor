import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("appBridge", {
  appName: "whatsapp-sales-monitor",
});
