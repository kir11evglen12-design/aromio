import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/* the visitor's "calm mode" choice survives a reload */
try {
  if (localStorage.getItem("aromioCalm") === "1") document.documentElement.classList.add("calm");
} catch { /* storage can be blocked; the site just animates */ }

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
