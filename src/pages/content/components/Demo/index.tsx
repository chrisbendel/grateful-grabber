import { createRoot } from "react-dom/client";
import App from "@src/pages/content/components/Demo/app";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("pages/content");
const root = document.createElement("div");
root.id = "grateful-grabber-root";
const playerWrapper = document.getElementById("theatre-ia-wrap");
playerWrapper.insertAdjacentElement("afterend", root);

createRoot(root).render(<App />);
