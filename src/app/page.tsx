"use client";

import { useState } from 'react';

interface Finding {
    file: string;
    line: number;
    snippet: string;
    ruleId: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    fixHint: string;
}

interface ScanResult {
    repoName: string;
    scannerUsed: string;
    score: number;
    label: string;
    color: string;
    summary: { high: number; medium: number; low: number };
    findings: Finding[];
    scannedAt: string;
}

export default function Home() {
    const [repoUrl, setRepoUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError('');

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
        <main className="max-w-5xl mx-auto p-6 md:p-12">
            <div className="flex flex-col items-center mb-12 text-center">
                <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
                    VibeGuard
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    Advanced localized security scanning for secrets and vulnerabilities.
                    Keep your code private and secure before you push.
                </p>
            </div>

            <section className="glass p-8 rounded-3xl mb-12">
                <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="GitHub Repo URL (e.g. https://github.com/user/repo)"
                        className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                        value={repoUrl}
                        onChange={(e) => {
                            setRepoUrl(e.target.value);
                            if (e.target.value) setFile(null);
                        }}
                    />
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500">OR</span>
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
                            className={`cursor-pointer px-4 py-3 rounded-xl border border-dashed text-sm transition-all ${file ? 'border-cyan-500 text-cyan-500' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            {file ? `📎 ${file.name}` : 'Upload ZIP'}
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || (!repoUrl && !file)}
                        className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning...
                            </span>
                        ) : 'Launch Scan'}
                    </button>
                </form>
                {error && <p className="text-red-500 mt-4 text-sm font-medium">⚠️ {error}</p>}
            </section>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="md:col-span-1 glass p-8 rounded-3xl flex flex-col items-center justify-center">
                            <div
                                className={`risk-gauge w-48 h-48 flex items-center justify-center mb-6`}
                                style={{ '--percentage': `${result.score}%`, color: getHexColor(result.color) } as any}
                            >
                                <div className="text-center z-10">
                                    <span className="text-5xl font-black block leading-none">{result.score}</span>
                                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Risk Score</span>
                                </div>
                            </div>
                            <div className={`text-2xl font-black uppercase tracking-tighter ${result.color}`}>
                                {result.label}
                            </div>
                            <div className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Scanner: {result.scannerUsed}</div>
                        </div>

                        <div className="md:col-span-2 glass p-8 rounded-3xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{result.repoName}</h2>
                                    <p className="text-gray-500 text-sm">Scan completed at {new Date(result.scannedAt).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={downloadReport}
                                    className="text-cyan-400 hover:text-cyan-300 text-sm font-bold border border-cyan-400/30 px-4 py-2 rounded-lg hover:bg-cyan-400/10 transition-all uppercase tracking-wide"
                                >
                                    Download Report
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                                    <span className="text-2xl font-black text-red-500 block">{result.summary.high}</span>
                                    <span className="text-[10px] uppercase font-bold text-red-500/70">High Risk</span>
                                </div>
                                <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 text-center">
                                    <span className="text-2xl font-black text-orange-500 block">{result.summary.medium}</span>
                                    <span className="text-[10px] uppercase font-bold text-orange-500/70">Medium Risk</span>
                                </div>
                                <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-center">
                                    <span className="text-2xl font-black text-green-500 block">{result.summary.low}</span>
                                    <span className="text-[10px] uppercase font-bold text-green-500/70">Low Risk</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            Findings <span className="text-sm bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{result.findings.length}</span>
                        </h3>
                        {result.findings.length === 0 ? (
                            <div className="glass p-12 rounded-3xl text-center">
                                <p className="text-gray-500 font-medium">No vulnerabilities detected. Your vibe is secure. ✨</p>
                            </div>
                        ) : (
                            result.findings.map((finding, idx) => (
                                <div key={idx} className={`glass p-6 rounded-2xl security-border ${getBorderColor(finding.severity)}`}>
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                        <div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block ${getBadgeColor(finding.severity)}`}>
                                                {finding.severity} Risk
                                            </span>
                                            <h4 className="font-bold text-gray-200">{finding.file} <span className="text-gray-500 font-normal">Line {finding.line}</span></h4>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">Rule ID: {finding.ruleId}</div>
                                    </div>
                                    <div className="bg-black/50 p-4 rounded-xl mb-4 font-mono text-xs overflow-x-auto whitespace-pre border border-white/5">
                                        {finding.snippet}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-cyan-400 font-black uppercase text-[10px]">Fix Hint:</span>
                                        <span className="text-gray-400">{finding.fixHint}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <footer className="mt-24 text-center text-gray-600 text-xs uppercase tracking-[0.2em] pb-12">
                VibeGuard v0.1.0 Prototype &copy; 2026 Local Execution Only
            </footer>
        </main>
    );
}

function getBadgeColor(severity: string) {
    if (severity === 'HIGH') return 'bg-red-500 text-black';
    if (severity === 'MEDIUM') return 'bg-orange-500 text-black';
    return 'bg-green-500 text-black';
}

function getBorderColor(severity: string) {
    if (severity === 'HIGH') return 'border-red-500/50';
    if (severity === 'MEDIUM') return 'border-orange-500/50';
    return 'border-green-500/50';
}

function getHexColor(colorClass: string) {
    if (colorClass.includes('red-600')) return '#dc2626';
    if (colorClass.includes('red-500')) return '#ef4444';
    if (colorClass.includes('orange-500')) return '#f97316';
    return '#22c55e';
}
