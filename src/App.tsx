import { useRoutes } from "react-router-dom";
import routes from "@/router/routes";

function App() {
  const elements = useRoutes(routes);
  return elements;
}

export default App;
