import { createRoot } from "react-dom/client";
import App from "./App.tsx";
//antd
import { ConfigProvider } from "antd";
import "dayjs/locale/zh-cn";
import antd_zh from "antd/locale/zh_CN";
import antdTheme from "./config/antdTheme";
import "@/assets/css/global.less";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider locale={antd_zh} theme={antdTheme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
);
