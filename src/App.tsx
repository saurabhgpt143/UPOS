import React, { useEffect } from "react";
import { POSDevice } from "./components/POSDevice";

export default function App() {
  useEffect(() => {
    document.body.classList.add("night-mode");
  }, []);

  return (
    <div className="min-h-[100dvh] sm:p-4 flex flex-col sm:items-center sm:justify-center relative bg-black sm:bg-[#111111] font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <POSDevice />
    </div>
  );
}
