"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `HTTP ${res.status}`);
            }
            // Redirect to login after successful registration
            router.push('/login?registered=1');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L18 17H2L10 2Z" fill="white" fillOpacity="0.9" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">Avalanche L1 Console</span>
                    </div>
                    <p className="text-gray-400 text-sm">Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-white text-2xl font-semibold mb-6">Create account</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Nguyen Van A"
                                className="w-full px-4 py-3 rounded-lg bg-[#1a2235] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-lg bg-[#1a2235] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                className="w-full px-4 py-3 rounded-lg bg-[#1a2235] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold hover:from-red-500 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
