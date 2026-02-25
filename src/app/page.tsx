"use client";

import { useState, useMemo } from 'react';
import ScanProgress from '@/components/ScanProgress';

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
                // Switch tab to code if possible or just show the result
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
        <main className="min-h-screen p-4 md:p-12 lg:p-24 selection:bg-cyan-500/30">
            {/* Header Area */}
            <header className="max-w-6xl mx-auto flex flex-col items-center mb-16 text-center animate-slide-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    System Online
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
                    VIBEGUARD
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                    The next-gen local security sentinel. Zero-trust scanning for your most sensitive codebases.
                </p>
            </header>

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Scan Input Section */}
                <section className="glass rounded-[2rem] p-1 shadow-2xl animate-slide-up [animation-delay:100ms]">
                    <div className="bg-[#0f1425]/50 rounded-[1.8rem] p-8">
                        <form onSubmit={handleScan} className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    placeholder="Enter Repository Gateway URL..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-lg font-medium"
                                    value={repoUrl}
                                    onChange={(e) => {
                                        setRepoUrl(e.target.value);
                                        if (e.target.value) setFile(null);
                                    }}
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                                    <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="h-full flex items-center">
                                    <span className="text-gray-700 font-black text-xs uppercase tracking-widest">OR</span>
                                </div>
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
                                    className={`group cursor-pointer px-6 py-4 rounded-2xl border-2 border-dashed transition-all flex items-center gap-3 font-bold text-sm ${file ? 'border-cyan-500/50 bg-cyan-500/5 text-cyan-400' : 'border-white/5 text-gray-500 hover:border-gray-700'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {file ? file.name : 'Upload Archive'}
                                </label>
                                <button
                                    type="submit"
                                    disabled={loading || (!repoUrl && !file)}
                                    className="relative overflow-hidden group bg-white text-black font-black px-10 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing
                                            </>
                                        ) : 'INITIALIZE SCAN'}
                                    </span>
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 animate-slide-up">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </div>
                </section>

                <ScanProgress isScanning={isScanning} />

                {result && (
                    <div className="space-y-12 animate-slide-up [animation-delay:200ms]">
                        {/* Results Hero */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Gauge Card */}
                            <div className="lg:col-span-4 glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                                <div
                                    className="risk-gauge w-56 h-56 flex items-center justify-center mb-8 transition-transform duration-700 group-hover:scale-105"
                                    style={{
                                        '--percentage': `${result.score}%`,
                                        color: getHexColor(result.color),
                                        '--gauge-color-rgb': getRGBColor(result.color)
                                    } as any}
                                >
                                    <div className="relative z-10">
                                        <div className="text-7xl font-black italic tracking-tighter leading-none mb-1">{result.score}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">RISK INDEX</div>
                                    </div>
                                </div>
                                <h3 className={`text-4xl font-black tracking-tighter uppercase mb-2 ${result.color}`}>
                                    {result.label}
                                </h3>
                                <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Verified by {result.scannerUsed}</p>
                            </div>

                            {/* Repo Info Card */}
                            <div className="lg:col-span-8 glass rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                    </svg>
                                </div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h2 className="text-5xl font-black italic tracking-tighter mb-2">{result.repoName}</h2>
                                        <div className="flex items-center gap-4 text-gray-500 text-sm font-bold tracking-wide">
                                            <span>SENTINEL REPORT</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                                            <span>{new Date(result.scannedAt).toLocaleTimeString()}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                                            <span className="text-cyan-500/50 italic font-medium uppercase text-[10px] tracking-widest">{result.findings.length} Finding(s) Detected</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={downloadReport}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black px-6 py-3 rounded-2xl transition-all text-xs tracking-widest uppercase active:scale-95"
                                    >
                                        Export JSON
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6 relative z-10">
                                    <SummaryCard value={result.summary.high} label="CRITICAL VIBE" color="from-red-600 to-rose-600" textColor="text-white" />
                                    <SummaryCard value={result.summary.medium} label="MODERATE" color="from-orange-500 to-amber-500" textColor="text-white" />
                                    <SummaryCard value={result.logicFindingsCount || 0} label="LOGIC FLAWS" color="from-cyan-600 to-blue-600" textColor="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* AI Executive Summary Card */}
                        {result.aiSummary && (
                            <section className="glass rounded-[2.5rem] p-1 ai-glow">
                                <div className="bg-[#0f1425]/80 rounded-[2.35rem] p-10 flex flex-col md:flex-row gap-10 items-center">
                                    <div className="shrink-0 w-24 h-24 rounded-3xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                                        <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500 mb-4 flex items-center gap-3">
                                            <span className="w-8 h-[1px] bg-cyan-500/50"></span>
                                            Sentinel AI Insight
                                        </h3>
                                        <p className="text-2xl text-gray-200 leading-snug font-medium italic opacity-90">
                                            "{result.aiSummary}"
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Findings List */}
                        <section className="space-y-8 pb-24">
                            <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-4">
                                VULNERABILITY LOG
                                <span className="h-[2px] w-24 bg-gray-800"></span>
                                <span className="text-sm font-black text-gray-600 uppercase tracking-widest not-italic">{result.findings.length} Entry</span>
                            </h3>

                            {result.findings.length === 0 ? (
                                <div className="glass rounded-[2rem] p-20 text-center">
                                    <div className="text-5xl mb-6">✨</div>
                                    <h4 className="text-2xl font-black italic mb-2">IMMACULATE REPOSITORY</h4>
                                    <p className="text-gray-500 font-medium">No algorithmic flags raised. The vibe is secure.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-8">
                                    {result.findings.map((finding, idx) => (
                                        <FindingCard
                                            key={idx}
                                            finding={finding}
                                            idx={idx}
                                            activeTab={activeFindingTab[idx] || 'explanation'}
                                            onTabChange={(tab) => setActiveFindingTab(prev => ({ ...prev, [idx]: tab }))}
                                            onRewrite={() => handleRewrite(idx)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Logic Vulnerabilities Section */}
                        {result.findings.some(f => f.ruleId.includes('-') || f.ruleId === 'plaintext-password') && (
                            <section className="mt-20">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-[1px] bg-cyan-500/50"></div>
                                            <span className="text-cyan-500 text-xs font-black tracking-[0.4em] uppercase">Architecture Logic</span>
                                        </div>
                                        <h3 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter">
                                            LOGIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">VULNERABILITIES</span>
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {result.findings.filter(f => f.ruleId.includes('-') || f.ruleId === 'plaintext-password').map((finding, idx) => (
                                        <div key={`logic-${idx}`} className="glass rounded-[2rem] p-8 border border-cyan-500/20 bg-cyan-500/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black bg-cyan-500 text-black px-3 py-1 rounded-lg uppercase tracking-widest">
                                                    LOGIC FLAG
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    {finding.ruleId}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-bold text-white mb-2 break-all">{finding.file}</h4>
                                            <div className="bg-black/40 p-4 rounded-xl font-mono text-sm text-cyan-400/80 mb-4 whitespace-pre-wrap">
                                                {finding.snippet}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            <footer className="mt-12 text-center text-gray-700 text-[10px] font-black uppercase tracking-[0.3em] pb-12 opacity-50">
                VIBEGUARD PROTOCOL v1.0.4 &copy; 2026 INTERNAL USE ONLY
            </footer>
        </main>
    );
}

function SummaryCard({ value, label, color, textColor }: { value: number, label: string, color: string, textColor: string }) {
    return (
        <div className={`bg-gradient-to-br ${color} p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center`}>
            <span className={`text-4xl font-black mb-1 ${textColor}`}>{value}</span>
            <span className={`text-[10px] font-black tracking-widest opacity-60 uppercase ${textColor}`}>{label}</span>
        </div>
    );
}

function FindingCard({
    finding,
    idx,
    activeTab,
    onTabChange,
    onRewrite
}: {
    finding: Finding,
    idx: number,
    activeTab: 'explanation' | 'fix' | 'code',
    onTabChange: (tab: 'explanation' | 'fix' | 'code') => void,
    onRewrite: () => void
}) {
    return (
        <div className="glass rounded-[2.5rem] p-1 group animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="bg-[#0f1425]/60 rounded-[2.35rem] p-8 md:p-10">
                {/* Finding Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${getBadgeColor(finding.severity)}`}>
                                {finding.severity} RISK
                            </span>
                            <span className="text-[10px] bg-white/5 text-gray-500 font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5">
                                {finding.ruleId}
                            </span>
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight break-all">
                            {finding.file}
                            <span className="ml-3 text-gray-600 font-medium">L{finding.line}</span>
                        </h4>
                    </div>
                    <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5 text-[10px] font-bold text-gray-500 tracking-widest uppercase italic flex flex-col items-end gap-2">
                        <span>HASH: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                        {!finding.rewriteExplanation && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRewrite(); }}
                                disabled={finding.isRewriting}
                                className="text-cyan-400 hover:text-cyan-300 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group/btn"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full bg-cyan-500 ${finding.isRewriting ? 'animate-ping' : ''}`}></div>
                                {finding.isRewriting ? 'Analyzing...' : 'PROPOSE SOLUTION'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Code Snippet */}
                <div className="mb-10 group/code relative">
                    <div className="absolute -inset-4 bg-cyan-500/5 rounded-[2rem] opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
                    <div className="relative bg-[#05080f] rounded-2xl border border-white/5 p-6 font-mono text-sm overflow-x-auto whitespace-pre selection:bg-cyan-500/50">
                        <CodeLine content={finding.snippet} />
                    </div>
                </div>

                {/* AI Remediation Section */}
                {finding.aiExplanation && (
                    <div className="space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                            <TabButton active={activeTab === 'explanation'} label="EXPLANATION" onClick={() => onTabChange('explanation')} />
                            <TabButton active={activeTab === 'fix'} label="FIX STEPS" onClick={() => onTabChange('fix')} />
                            <TabButton active={activeTab === 'code'} label="SECURE CODE" onClick={() => onTabChange('code')} />
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[160px] animate-in fade-in slide-in-from-top-2 duration-300">
                            {activeTab === 'explanation' && (
                                <div className="space-y-4">
                                    <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                        {finding.aiExplanation}
                                    </p>
                                    <div className="flex items-center gap-3 opacity-40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                        <span className="text-[10px] font-black tracking-widest uppercase">Sentinel Confidence: {(finding.confidence || 0.95) * 100}%</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'fix' && (
                                <div className="space-y-4 text-gray-300 text-lg leading-relaxed font-medium whitespace-pre-wrap italic">
                                    {finding.aiFixSteps}
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="space-y-4">
                                    <div className="relative group/secure">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-50"></div>
                                        <div className="relative bg-[#02050a] rounded-xl border border-green-500/30 p-6 font-mono text-sm overflow-x-auto text-green-400/90 whitespace-pre shadow-2xl">
                                            <CodeLine content={finding.secureCode || ''} isSecure />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-green-500/50 uppercase tracking-[0.2em] italic">Recommendation: Replace vulnerable segment with the logic above.</p>
                                </div>
                            )}
                        </div>

                        {/* Secure Code Solution Display */}
                        {finding.rewriteExplanation && (
                            <div className="mt-12 pt-8 border-t border-white/5 animate-slide-up">
                                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-cyan-500/50"></span>
                                    Autonomous Solution Suite
                                </h5>
                                <div className="space-y-6">
                                    <div className="bg-[#02050a] rounded-2xl border border-cyan-500/20 p-8 shadow-2xl shadow-cyan-500/5">
                                        <div className="text-[10px] font-black text-cyan-500/50 uppercase tracking-widest mb-4">RECOMMENDED FIX STEPS</div>
                                        <div className="space-y-4">
                                            {finding.rewriteExplanation.split('\n').filter(line => line.trim()).map((point, pIdx) => (
                                                <div key={pIdx} className="flex items-start gap-4 text-gray-300 leading-relaxed font-medium">
                                                    <span className="text-cyan-500 mt-1.5">•</span>
                                                    <span>{point.replace(/^- /, '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-cyan-500/30 uppercase tracking-[0.2em] italic text-center">Implementation Recommended via Secure Secret Management Protocol.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-[0.1em] transition-all ${active ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
        >
            {label}
        </button>
    );
}

function CodeLine({ content, isSecure = false }: { content: string, isSecure?: boolean }) {
    // Basic syntax highlighting sim
    const parts = content.split(/(\".*?\"|const|let|var|function|return|AWS_SECRET|API_KEY)/g);

    return (
        <code>
            {parts.map((part, i) => {
                const isKeyword = /^(const|let|var|function|return)$/.test(part);
                const isString = /^\".*?\"$/.test(part);
                const isVar = /^(AWS_SECRET|API_KEY)$/.test(part);

                if (isKeyword) return <span key={i} className="code-token-keyword">{part}</span>;
                if (isString) return <span key={i} className="code-token-string">{part}</span>;
                if (isVar) return <span key={i} className={isSecure ? 'text-green-500' : 'text-red-500'}>{part}</span>;
                return <span key={i}>{part}</span>;
            })}
        </code>
    );
}

function getBadgeColor(severity: string) {
    if (severity === 'HIGH') return 'bg-red-600 text-white shadow-lg shadow-red-600/20';
    if (severity === 'MEDIUM') return 'bg-orange-500 text-black shadow-lg shadow-orange-500/20';
    return 'bg-green-500 text-black shadow-lg shadow-green-500/10';
}

function getHexColor(colorClass: string) {
    if (colorClass.includes('red-600')) return '#dc2626';
    if (colorClass.includes('red-500')) return '#ef4444';
    if (colorClass.includes('orange-500')) return '#f97316';
    return '#22c55e';
}

function getRGBColor(colorClass: string) {
    if (colorClass.includes('red-600')) return '220, 38, 38';
    if (colorClass.includes('red-500')) return '239, 68, 68';
    if (colorClass.includes('orange-500')) return '249, 115, 22';
    return '34, 197, 94';
}
