"use client";

import nextDynamic from "next/dynamic";
import React from "react";

const AnalyticsDashboard = nextDynamic(
  () => import("./AnalyticsDashboard").then((mod) => mod.AnalyticsDashboard),
  { 
    ssr: false,
    loading: () => <div className="h-[600px] w-full animate-pulse bg-slate-50 rounded-[2.5rem]" />
  }
);

export default AnalyticsDashboard;
