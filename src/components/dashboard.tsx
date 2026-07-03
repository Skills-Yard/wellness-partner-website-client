'use client'

import React, { useState } from "react";
import { DollarSign, Users, Activity } from "lucide-react";
import LoginForm from "./loginOnboarding/loginForm";
import Navbar from "./home/navbar";

// ==========================================
// --- 3. DASHBOARD CONTENT COMPONENT ---
// ==========================================
export default function DashboardContent() {
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = () => {
    setShowLogin(true);
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans max-w-7xl mx-auto w-full">
      <Navbar onLogout={handleLogout} />
      <main>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here is your latest performance data.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Earnings",
              value: "$12,450",
              Icon: DollarSign, // Capitalized 'Icon'
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              title: "Active Users",
              value: "842",
              Icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              title: "Conversion Rate",
              value: "4.6%",
              Icon: Activity,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                {/* Render with capital 'Icon' */}
                <stat.Icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm min-h-[400px] flex items-center justify-center p-6">
          <p className="text-gray-400 font-medium">
            Dashboard widgets and charts will go here...
          </p>
        </div>
      </main>
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
    </div>
  );
}