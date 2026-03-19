import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register routes once
let initialized = false;
async function init() {
  if (!initialized) {
    await registerRoutes(httpServer, app);
    initialized = true;
  }
}

// Initialize on cold start
const initPromise = init();

export default async function handler(req: any, res: any) {
  await initPromise;
  app(req, res);
}
