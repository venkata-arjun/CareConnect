import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2600,
          style: {
            maxWidth: "320px",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
          },
        }}
      />
    </>
  );
}

export default App;