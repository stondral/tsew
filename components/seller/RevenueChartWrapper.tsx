"use client";

import nextDynamic from "next/dynamic";
import React from "react";

const RevenueChart = nextDynamic(
  () => import("./RevenueChart").then((mod) => mod.RevenueChart),
  { 
    ssr: false, 
    loading: () => <div className="h-[400px] w-full animate-pulse bg-slate-100 rounded-[2.5rem]" /> 
  }
);

export default RevenueChart;
