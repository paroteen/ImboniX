/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ProblemStatement from "./components/ProblemStatement";
import FeaturesGrid from "./components/FeaturesGrid";
import HowItWorks from "./components/HowItWorks";
import ImpactMission from "./components/ImpactMission";
import Footer from "./components/Footer";
import { ImbonixProvider } from "./demo/store";
import DemoOverlay from "./demo/DemoOverlay";
import PairPage from "./pair/PairPage";

export default function App() {
  // Phone pairing route: /?session=CODE launches the phone camera view.
  const session = new URLSearchParams(window.location.search).get("session");
  if (session) {
    return (
      <ImbonixProvider>
        <PairPage session={session} />
      </ImbonixProvider>
    );
  }

  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <ImbonixProvider>
      <div className="min-h-screen bg-cyber-dark-1 font-sans selection:bg-neon-cyan/20 selection:text-white">
        <Header onTryDemo={() => setDemoOpen(true)} />

        <main>
          {/* Hero — single CTA opens the full-screen demo experience */}
          <Hero onTryDemo={() => setDemoOpen(true)} />
          <ProblemStatement />
          <FeaturesGrid />
          <HowItWorks />
          <ImpactMission />
        </main>

        <Footer />
      </div>

      {demoOpen && <DemoOverlay onClose={() => setDemoOpen(false)} />}
    </ImbonixProvider>
  );
}
