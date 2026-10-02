"use client";

import React from "react";

interface EirumiViewLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function EirumiViewLogo({
  className = "",
  size = "md",
  showText = true,
}: EirumiViewLogoProps) {
  const iconSize = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }[size];

  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Geometric EirumiView Icon: Layered Prism / Viewfinder Emblem */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="ev-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="ev-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="ev-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
            <filter id="ev-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#4F46E5" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Rounded Shield / Tile */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="10"
            fill="url(#ev-grad-primary)"
            filter="url(#ev-glow)"
          />

          {/* Stylized 'E' + 'V' (Layered Page fold & View Angle) */}
          {/* Top Bar of E */}
          <path
            d="M10 12C10 10.8954 10.8954 10 12 10H28C29.1046 10 30 10.8954 30 12C30 13.1046 29.1046 14 28 14H14V17H25C26.1046 17 27 17.8954 27 19C27 20.1046 26.1046 21 25 21H14V26C14 27.1046 13.1046 28 12 28C10.8954 28 10 27.1046 10 26V12Z"
            fill="white"
            fillOpacity="0.95"
          />

          {/* Dynamic "V" Viewfinder Aperture Polygon */}
          <path
            d="M18 20L25 31C25.5 31.8 26.7 31.8 27.2 31L32 23C32.6 22 31.8 20.8 30.7 20.8H21C19.8 20.8 19 21.6 19 22.8"
            fill="url(#ev-grad-cyan)"
            fillOpacity="0.9"
          />

          {/* Lens Center Dot / Spark */}
          <circle cx="26" cy="14" r="2" fill="#67E8F9" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center tracking-tight">
          <span className={`font-bold text-foreground ${textSize} tracking-tight`}>
            Eirumi
          </span>
          <span
            className={`font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent ${textSize} ml-0.5`}
          >
            View
          </span>
        </div>
      )}
    </div>
  );
}
