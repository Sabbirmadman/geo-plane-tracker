import "./App.css";
import AboutPage from "./pages/AboutPage";
import SolarSystem from "./pages/SolarSystem";
import HomePage from "./pages/HomePage";
import { Routes, Route } from "react-router-dom";
import RocketEditorPage from "./pages/RocketEditorPage";

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<SolarSystem />} />
                <Route path="/rocket-editor" element={<RocketEditorPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </div>
    );
}

export default App;
