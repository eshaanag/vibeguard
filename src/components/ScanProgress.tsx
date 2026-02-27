"use client"

import { useEffect, useState } from "react"
import { FaSpinner, FaCheckCircle, FaCircle } from "react-icons/fa"

const steps = [
    "Initializing scan engine",
    "Cloning repository contents",
    "Performing secret sequence detection",
    "Analyzing semantic vulnerabilities",
    "Generating autonomous AI remediations",
    "Calculating neural risk telemetry",
    "Finalizing security audit report"
]

export default function ScanProgress({ isScanning }: { isScanning: boolean }) {
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (!isScanning) {
            const timer = setTimeout(() => setCurrentStep(0), 1000);
            return () => clearTimeout(timer);
        }

        setCurrentStep(0)
        let i = 0
        const interval = setInterval(() => {
            i++
            if (i < steps.length) {
                setCurrentStep(i)
            } else {
                clearInterval(interval)
            }
        }, 1200)

        return () => clearInterval(interval)
    }, [isScanning])

    if (!isScanning && currentStep === 0) return null

    return (
        <div className="tech-panel p-6 md:p-10 border-neon-green/30 bg-neon-green/5 animate-fade-in mt-12 mb-12">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-neon-green flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-neon-green/50"></span>
                    Live Analysis Stream
                </h3>
                {currentStep < steps.length - 1 ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-soft-cyan uppercase tracking-widest italic animate-pulse">
                        <FaSpinner className="animate-spin" />
                        In Progress
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neon-green uppercase tracking-widest italic">
                        <FaCheckCircle />
                        Sequence Complete
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-4 transition-all duration-500 ${index === currentStep ? "opacity-100 scale-105 origin-left" :
                            index < currentStep ? "opacity-40" : "opacity-20"
                            }`}
                    >
                        <div className="flex-shrink-0 w-8 flex justify-center">
                            {index < currentStep ? (
                                <FaCheckCircle className="text-neon-green text-xs" />
                            ) : index === currentStep ? (
                                <FaSpinner className="text-soft-cyan animate-spin text-xs" />
                            ) : (
                                <FaCircle className="text-gray-600 text-[6px]" />
                            )}
                        </div>

                        <div className={`text-[11px] font-black tracking-widest uppercase flex-1 ${index === currentStep ? "text-white" : "text-gray-400"
                            }`}>
                            {step}
                            {index === currentStep && (
                                <span className="ml-2 inline-flex gap-0.5">
                                    <span className="animate-bounce">.</span>
                                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                                    <span className="animate-bounce [animation-delay:0.4s]">.</span>
                                </span>
                            )}
                        </div>

                        {index < currentStep && (
                            <div className="text-[9px] font-mono text-neon-green/40">100%</div>
                        )}
                        {index === currentStep && (
                            <div className="text-[9px] font-mono text-soft-cyan animate-pulse">PROCESSING</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-2">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-neon-green via-soft-cyan to-neon-green transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                    <span>Subsystem: Core Analysis</span>
                    <span>Status: {Math.floor(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
            </div>
        </div>
    )
}
