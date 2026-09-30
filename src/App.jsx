import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import ScrollScene from "./components/ScrollScene";
import ScrollReveal from "./components/ScrollReveal";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollScene />
      <ScrollReveal />
      <ScrollToTop />
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
