import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";
import reactLogo from "./assets/react.svg";

function App() {
  const [profiles, setProfiles] = useState<string[]>([]);

  async function greet() {
    const profiles: string[] = await invoke("get_profiles");
    setProfiles(profiles);
}

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <button type="submit">Greet</button>
      </form>
      {profiles.map((profile) => (
        <p key={profile}>{profile}</p>
      ))}
    </main>
  );
}

export default App;
