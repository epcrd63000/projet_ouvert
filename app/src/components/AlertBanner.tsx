"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AlertBannerData {
  id: string;
  message: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  isActive: boolean;
}

export function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertBannerData[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/alerts");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAlerts(data);
      } catch (error) {
        console.error("Failed to parse alert data", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="w-full z-50 sticky top-0">
      {alerts.map((alert) => {
        let bgColor = "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200";
        let Icon = Info;
        
        if (alert.level === "WARNING") {
          bgColor = "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200";
          Icon = AlertTriangle;
        } else if (alert.level === "CRITICAL") {
          bgColor = "bg-red-100 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-200";
          Icon = AlertCircle;
        }

        return (
          <div
            key={alert.id}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b ${bgColor}`}
          >
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
}
