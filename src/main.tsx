import React from "react";
import { createRoot } from "react-dom/client";
import { insertCoin } from "playroomkit";
import "./index.css";
import { App } from "./App";

// Вход в Playroom
insertCoin({
  skipLobby: false,
  gameId: "bank-xmas-party",
  discord: false,
  reconnectGracePeriod: 0,
}).then(() => {
  // Правильный рендер для React 18
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
