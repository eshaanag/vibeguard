"use client";

import { useState } from 'react';
import ScanProgress from '@/components/ScanProgress';
import GlowButton from '@/components/GlowButton';
import PanelCard from '@/components/PanelCard';
import SectionTitle from '@/components/SectionTitle';

interface Finding {
    file: string;
    line: number;
    snippet: string;
    ruleId: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    fixHint: string;
    aiExplanation?: string;
    aiFixSteps?: string;
    secureCode?: string;
    confidence?: number;
    secureRewrite?: string;
    rewriteExplanation?: string;
    isRewriting?: boolean;
}

interface ScanResult {
    repoName: string;
    scannerUsed: string;
    score: number;
    label: string;
    color: string;
    summary: { high: number; medium: number; low: number };
    findings: Finding[];
    logicFindingsCount?: number;
    aiSummary?: string;
    scannedAt: string;
}

export default function Home() {
    const [repoUrl, setRepoUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');
    const [activeFindingTab, setActiveFindingTab] = useState<Record<number, 'explanation' | 'fix' | 'code'>>({});
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setIsScanning(true);
        setResult(null);
        setError('');
        setActiveFindingTab({});

        try {
            const formData = new FormData();
            if (repoUrl) formData.append('repoUrl', repoUrl);
            if (file) formData.append('file', file);

            const res = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data);
                setTimeout(() => {
                    const resultsElement = document.getElementById('scan-results');
                    if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                setError(data.error || 'Scan failed');
            }
        } catch (err) {
            setError('An unexpected error occurred during the scan.');
        } finally {
            setLoading(false);
            setIsScanning(false);
        }
    };

    const handleRewrite = async (index: number) => {
        if (!result) return;
        const newFindings = [...result.findings];
        const finding = newFindings[index];
        finding.isRewriting = true;
        setResult({ ...result, findings: newFindings });

        try {
            const res = await fetch('/api/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finding),
            });
            const data = await res.json();
            if (res.ok) {
                finding.secureRewrite = data.secureRewrite;
                finding.rewriteExplanation = data.rewriteExplanation;
            }
        } catch (err) {
            console.error("Rewrite failed:", err);
        } finally {
            finding.isRewriting = false;
            setResult({ ...result, findings: [...newFindings] });
        }
    };

    const downloadReport = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibeguard-report-${result.repoName}.json`;
        a.click();
    };

    return (
        <main className="min-h-screen flex flex-col bg-deep-black text-white">
            {/* MINIMAL INITIAL STATE */}
            <section className={`transition-all duration-1000 ease-in-out ${result ? 'pt-12' : 'min-h-screen flex flex-col items-center justify-center'}`}>
                <div className="max-w-4xl w-full px-6 flex flex-col items-center">

                    {/* 1. Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                        </span>
                        System Online
                    </div>

                    {/* 2. Product Name */}
                    <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter mb-4 text-glow animate-slide-up">
                        VIBE<span className="text-soft-cyan">GUARD</span>
                    </h1>

                    {/* 3. One-line Description */}
                    <p className="text-gray-400 text-lg md:text-xl font-medium mb-12 animate-fade-in [animation-delay:0.2s]">
                        Zero-trust security sentinel for sensitive codebases.
                    </p>

                    {/* 4, 5, 6. Input, Upload, Action */}
                    <form onSubmit={handleScan} className="w-full space-y-6 animate-fade-in [animation-delay:0.4s]">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    placeholder="Repository Gateway URL..."
                                    className="w-full bg-white/5 border border-white/10 rounded-none px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50 transition-all text-lg font-medium"
                                    value={repoUrl}
                                    onChange={(e) => {
                                        setRepoUrl(e.target.value);
                                        if (e.target.value) setFile(null);
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    accept=".zip"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => {
                                        setFile(e.target.files?.[0] || null);
                                        if (e.target.files?.[0]) setRepoUrl('');
                                    }}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`cursor-pointer h-full px-6 flex items-center border border-white/10 transition-all font-bold text-xs uppercase tracking-widest ${file ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 'text-gray-500 hover:text-white hover:border-white/30'}`}
                                >
                                    {file ? 'Selected' : 'Upload ZIP'}
                                </label>
                                <GlowButton
                                    type="submit"
                                    disabled={loading || (!repoUrl && !file)}
                                    className="px-10 py-5 h-full"
                                >
                                    {loading ? 'Analyzing...' : 'Initialize Scan'}
                                </GlowButton>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-8 w-full p-4 border border-red-500/30 bg-red-500/5 text-red-500 text-xs font-bold uppercase tracking-widest animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="w-full">
                        <ScanProgress isScanning={isScanning} />
                    </div>

                    {!result && !isScanning && (
                        /* 7. Footer */
                        <footer className="mt-24 text-[10px] font-black tracking-[0.4em] text-gray-700 uppercase animate-fade-in [animation-delay:1s]">
                            VGuard Protocol &bull; 2026 Internal Utility
                        </footer>
                    )}
                </div>
            </section>

            {/* RESULTS VIEW */}
            {result && (
                <div id="scan-results" className="max-w-7xl mx-auto px-6 py-24 w-full space-y-16 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-8 border-b border-white/5">
                        <SectionTitle
                            title="Security Report"
                            subtitle={`Audit of ${result.repoName} complete. ${result.findings.length} findings identified.`}
                        />
                        <GlowButton variant="outline" onClick={downloadReport}>
                            Export Report
                        </GlowButton>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 space-y-8">
                            <PanelCard className="flex flex-col items-center justify-center py-12">
                                <div
                                    className="risk-gauge w-48 h-48 flex items-center justify-center mb-8"
                                    style={{
                                        '--percentage': `${result.score}%`,
                                        color: result.color.includes('red') ? '#dc2626' : result.color.includes('orange') ? '#f97316' : '#22c55e',
                                        '--gauge-color-rgb': result.color.includes('red') ? '220, 38, 38' : result.color.includes('orange') ? '249, 115, 22' : '34, 197, 94'
                                    } as any}
                                >
                                    <div className="relative z-10">
                                        <div className="text-6xl font-black italic tracking-tighter">{result.score}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Risk</div>
                                    </div>
                                </div>
                                <h3 className={`text-4xl font-black italic ${result.color} mb-2`}>{result.label}</h3>
                                <div className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Protocol Integrity Check</div>
                            </PanelCard>

                            <div className="grid grid-cols-3 gap-4">
                                <SummaryBox value={result.summary.high} label="High" color="from-red-600 to-rose-600" />
                                <SummaryBox value={result.summary.medium} label="Med" color="from-orange-500 to-amber-500" />
                                <SummaryBox value={result.logicFindingsCount || 0} label="Logic" color="from-cyan-600 to-blue-600" />
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-8">
                            {result.aiSummary && (
                                <PanelCard className="bg-neon-green/5 border-neon-green/20">
                                    <div className="flex gap-6">
                                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-neon-green text-black font-black text-xs">AI</div>
                                        <div>
                                            <div className="text-[10px] font-black text-neon-green uppercase tracking-widest mb-2">Synthetic Briefing</div>
                                            <p className="text-lg text-gray-300 italic leading-relaxed">"{result.aiSummary}"</p>
                                        </div>
                                    </div>
                                </PanelCard>
                            )}

                            <div className="space-y-4">
                                {result.findings.map((finding, idx) => (
                                    <FindingItem
                                        key={idx}
                                        finding={finding}
                                        idx={idx}
                                        activeTab={activeFindingTab[idx] || 'explanation'}
                                        onTabChange={(tab: any) => setActiveFindingTab(prev => ({ ...prev, [idx]: tab }))}
                                        onRewrite={() => handleRewrite(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-24 pb-12">
                        <GlowButton variant="outline" onClick={() => {
                            setResult(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                            Start New Audit
                        </GlowButton>
                    </div>
                </div>
            )}
        </main>
    );
}

function SummaryBox({ value, label, color }: any) {
    return (
        <div className={`bg-gradient-to-br ${color} p-4 text-center border border-white/5`}>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-white/70">{label}</div>
        </div>
    );
}

function FindingItem({ finding, idx, activeTab, onTabChange, onRewrite }: any) {
    return (
        <PanelCard className={`border-l-4 ${finding.severity === 'HIGH' ? 'border-l-red-600' : finding.severity === 'MEDIUM' ? 'border-l-orange-500' : 'border-l-neon-green'}`}>
            <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <span className="text-[8px] font-black bg-white/10 px-2 py-0.5 uppercase tracking-widest">{finding.ruleId}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 uppercase tracking-widest ${finding.severity === 'HIGH' ? 'text-red-500' : 'text-neon-green'}`}>
                                {finding.severity}
                            </span>
                        </div>
                        <h4 className="font-bold text-white break-all">{finding.file} <span className="text-gray-600">L{finding.line}</span></h4>
                    </div>
                    {!finding.rewriteExplanation && (
                        <button onClick={onRewrite} className="text-[9px] font-black text-neon-green hover:underline uppercase tracking-widest">
                            {finding.isRewriting ? 'Analyzing...' : 'AI Remedy'}
                        </button>
                    )}
                </div>

                <div className="bg-black p-4 font-mono text-[11px] text-neon-green/80 overflow-x-auto border border-white/5">
                    {finding.snippet}
                </div>

                {finding.aiExplanation && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                            {['explanation', 'fix', 'code'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => onTabChange(tab)}
                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 ${activeTab === tab ? 'bg-neon-green text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="text-xs text-gray-400 leading-relaxed min-h-[40px]">
                            {activeTab === 'explanation' && <p className="italic">"{finding.aiExplanation}"</p>}
                            {activeTab === 'fix' && <p className="whitespace-pre-wrap">{finding.aiFixSteps}</p>}
                            {activeTab === 'code' && (
                                <div className="bg-deep-black p-3 border border-neon-green/20 font-mono text-soft-cyan">
                                    {finding.secureCode}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PanelCard>
    );
}
