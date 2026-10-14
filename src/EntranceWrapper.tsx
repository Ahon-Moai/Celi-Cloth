import React, { useState, useEffect } from "react";
import App from "./App";
import { EntrancePage } from "./EntrancePage";

export const EntranceWrapper: React.FC = () => {
  // Check if query param ?skip=true is present for direct admin preview bypass if needed
  const [hasEntered, setHasEntered] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("skip") === "true";
    } catch {
      return false;
    }
  });

  return (
    <div className="relative min-h-screen bg-black">
      {/* 
        The main site (App.tsx) is rendered without any modifications. 
        Pre-mounting it beneath the entrance overlay guarantees that all initial 
        state, fonts, products, and scripts initialize cleanly in the background.
      */}
      <App />

      {/* Streetwear Entrance Page Overlay */}
      {!hasEntered && (
        <EntrancePage onEnter={() => setHasEntered(true)} />
      )}
    </div>
  );
};

export default EntranceWrapper;
