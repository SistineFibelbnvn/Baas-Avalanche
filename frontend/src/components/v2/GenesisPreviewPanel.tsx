'use client';

import { useState, useEffect, useMemo } from 'react';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    generateGenesisConfig,
    calculateGenesisSize,
    formatBytes,
    GENESIS_SIZE_LIMIT,
    GenesisFormData
} from '@/lib/genesisGenerator';
import { toast } from 'sonner';

interface GenesisPreviewPanelProps {
    formData: GenesisFormData;
    className?: string;
}

export function GenesisPreviewPanel({ formData, className = '' }: GenesisPreviewPanelProps) {
    const [copied, setCopied] = useState(false);

    // Generate genesis config from form data
    const genesisConfig = useMemo(() => {
        return generateGenesisConfig(formData);
    }, [formData]);

    // Format JSON with syntax highlighting
    const formattedJson = useMemo(() => {
        return JSON.stringify(genesisConfig, null, 2);
    }, [genesisConfig]);

    // Calculate size
    const fileSize = useMemo(() => {
        return calculateGenesisSize(genesisConfig);
    }, [genesisConfig]);

    const isWithinLimit = fileSize <= GENESIS_SIZE_LIMIT;
    const sizePercentage = Math.min((fileSize / GENESIS_SIZE_LIMIT) * 100, 100);

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formattedJson);
            setCopied(true);
            toast.success('Genesis configuration copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    // Download as JSON file
    const handleDownload = () => {
        const blob = new Blob([formattedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genesis-${formData.chainId || 'chain'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Genesis file downloaded!');
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h4 className="font-medium text-sm">Genesis Configuration</h4>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(fileSize)} / {formatBytes(GENESIS_SIZE_LIMIT)} •
                        {isWithinLimit ? ' Within safe limits' : ' Exceeds limit!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-3 h-3 mr-1" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Size Progress Bar */}
            <div className="mb-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isWithinLimit ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${sizePercentage}%` }}
                    />
                </div>
            </div>

            {/* Size Warning */}
            {!isWithinLimit && (
                <div className="flex items-center gap-2 p-2 mb-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    Genesis file exceeds 64 KiB limit. Reduce allocations or config.
                </div>
            )}

            {/* JSON Preview with Syntax Highlighting */}
            <div className="flex-1 overflow-hidden rounded-lg border border-border bg-[#1e1e1e] dark:bg-[#0d1117]">
                <div className="h-full overflow-auto p-4">
                    <pre className="text-xs font-mono leading-relaxed">
                        <code>
                            {formattedJson.split('\n').map((line, index) => (
                                <div key={index} className="flex">
                                    <span className="w-8 text-right pr-4 text-gray-500 select-none">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1">
                                        {highlightJsonLine(line)}
                                    </span>
                                </div>
                            ))}
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
}

// Simple JSON syntax highlighting
function highlightJsonLine(line: string): React.ReactNode {
    // Match keys, strings, numbers, booleans, null
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Key pattern: "key":
    const keyPattern = /"([^"]+)":/g;
    // String pattern: "value"
    const stringPattern = /"([^"]*)"/g;
    // Number pattern
    const numberPattern = /\b(\d+\.?\d*)\b/g;
    // Boolean/null pattern
    const boolNullPattern = /\b(true|false|null)\b/g;

    // Simple highlighting - replace patterns with styled spans
    let result = line;

    // Highlight keys (property names)
    result = result.replace(/"([^"]+)":/g, '<key>"$1"</key>:');
    // Highlight string values
    result = result.replace(/"0x[a-fA-F0-9]+"/g, (match) => `<hex>${match}</hex>`);
    result = result.replace(/"([^"]*)"/g, (match, content) => {
        if (match.includes('<hex>') || match.includes('<key>')) return match;
        return `<str>${match}</str>`;
    });
    // Highlight numbers
    result = result.replace(/: (\d+)/g, ': <num>$1</num>');
    // Highlight booleans/null
    result = result.replace(/\b(true|false|null)\b/g, '<bool>$1</bool>');

    // Parse and render with React elements
    const segments = result.split(/(<key>|<\/key>|<str>|<\/str>|<num>|<\/num>|<bool>|<\/bool>|<hex>|<\/hex>)/);

    let currentStyle: string | null = null;

    return segments.map((segment, idx) => {
        if (segment === '<key>') { currentStyle = 'text-[#9cdcfe]'; return null; }
        if (segment === '</key>') { currentStyle = null; return null; }
        if (segment === '<str>') { currentStyle = 'text-[#ce9178]'; return null; }
        if (segment === '</str>') { currentStyle = null; return null; }
        if (segment === '<num>') { currentStyle = 'text-[#b5cea8]'; return null; }
        if (segment === '</num>') { currentStyle = null; return null; }
        if (segment === '<bool>') { currentStyle = 'text-[#569cd6]'; return null; }
        if (segment === '</bool>') { currentStyle = null; return null; }
        if (segment === '<hex>') { currentStyle = 'text-[#4ec9b0]'; return null; }
        if (segment === '</hex>') { currentStyle = null; return null; }

        if (!segment) return null;

        return (
            <span key={idx} className={currentStyle || 'text-gray-300'}>
                {segment}
            </span>
        );
    });
}
