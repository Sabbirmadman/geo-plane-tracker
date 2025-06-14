import "./App.css";
import AboutPage from "./pages/AboutPage";
import EarthView from "./pages/EarthView";
import HomePage from "./pages/HomePage";
import { Routes, Route } from "react-router-dom";

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<EarthView />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </div>
    );
}

export default App;
