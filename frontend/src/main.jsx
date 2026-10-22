import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthProvider from "./auth/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(console.error));
}
