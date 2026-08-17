import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import Language from "./context/Language";
import LanguageSelector from "./components/LanguageSelector";

console.log("🚀 Index.jsx loaded");

// Create root and render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Language>
    {/* <App /> */}
    <div className="text-black w-100 h-100">
      <LanguageSelector />
    </div>
  </Language>,
);

console.log("✅ React app rendered");
