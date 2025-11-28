"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function AnalysisModal({ isOpen, progress = 0 }) {
    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setDisplayProgress(0);
            const timer = setInterval(() => {
                setDisplayProgress((prev) => {
                    if (prev >= progress) return prev;
                    return Math.min(prev + 2, progress);
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [isOpen, progress]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center space-y-6">
                    {/* Animated Icon */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                            <svg
                                className="w-10 h-10 text-white animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        </div>
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 blur-xl animate-pulse"></div>
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Analyzing Your Resume
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Please wait while we match your resume with the job description...
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                        <Progress value={displayProgress} className="h-3" />
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Processing</span>
                            <span>{Math.round(displayProgress)}%</span>
                        </div>
                    </div>

                    {/* Status Messages */}
                    <div className="text-sm text-center text-gray-500 dark:text-gray-400 animate-pulse">
                        {displayProgress < 30 && "Extracting keywords..."}
                        {displayProgress >= 30 && displayProgress < 60 && "Analyzing skills..."}
                        {displayProgress >= 60 && displayProgress < 90 && "Calculating match score..."}
                        {displayProgress >= 90 && "Finalizing results..."}
                    </div>
                </div>
            </div>
        </div>
    );
}
