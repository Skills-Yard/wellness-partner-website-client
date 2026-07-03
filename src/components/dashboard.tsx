'use client';

import React, { useState } from "react";
import LoginForm from "./loginOnboarding/loginForm";
import PartnerHomescreen from "./home/PartnerHomescreen";
import ServiceUnavailable from "./home/ServiceUnavailable";
import {
  isServiceAvailable,
  DEFAULT_CITY,
  DEFAULT_PROFESSION,
} from "@/src/utils/data/serviceAvailability";

type AppScreen = "STEP6_AVAILABLE" | "STEP7_UNAVAILABLE";
interface UserData { city: string; profession: string; }

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardContent() {
  const [screen, setScreen] = useState<AppScreen>(
    isServiceAvailable(DEFAULT_CITY, DEFAULT_PROFESSION) ? "STEP6_AVAILABLE" : "STEP7_UNAVAILABLE"
  );
  const [showLogin, setShowLogin] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    city: DEFAULT_CITY,
    profession: DEFAULT_PROFESSION,
  });

  const handleLoginComplete = (data: { city: string; profession: string }) => {
    setUserData(data);
    setShowLogin(false);
    setScreen(isServiceAvailable(data.city, data.profession) ? "STEP6_AVAILABLE" : "STEP7_UNAVAILABLE");
  };

  const handleLogout = () => {
    setUserData({ city: DEFAULT_CITY, profession: DEFAULT_PROFESSION });
    setScreen(isServiceAvailable(DEFAULT_CITY, DEFAULT_PROFESSION) ? "STEP6_AVAILABLE" : "STEP7_UNAVAILABLE");
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* ── LOGIN FLOW (STEPS 1–5) ────────────────────────────────────
          When login is active, only show the login form — no BottomNav behind */}
      {showLogin ? (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onComplete={handleLoginComplete}
        />
      ) : (
        <>
          {/* ── STEP 6: SERVICE AVAILABLE ─────────────────────────────────── */}
          {screen === "STEP6_AVAILABLE" && (
            <PartnerHomescreen
              city={userData.city}
              profession={userData.profession}
              onLogout={handleLogout}
            />
          )}

          {/* ── STEP 7: SERVICE UNAVAILABLE ───────────────────────────────── */}
          {screen === "STEP7_UNAVAILABLE" && (
            <ServiceUnavailable
              city={userData.city}
              profession={userData.profession}
              onLogout={handleLogout}
              onCityChange={(city) => {
                setUserData({ ...userData, city });
                setScreen("STEP6_AVAILABLE");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}