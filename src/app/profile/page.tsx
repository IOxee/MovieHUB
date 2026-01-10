'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';

type UserStats = {
    totalRatings: number;
    moviesWatched: number;
    seriesWatched: number;
    averageScore: number;
    topGenre?: string;
    favoritePlatform?: string;
    ratingsDistribution: Record<string, number>;
    recentRatings: any[];
};

export default function ProfilePage() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabaseBrowser();

    useEffect(() => {
        async function loadStats() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: ratings, error } = await supabase
                .from('user_ratings')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error || !ratings) {
                setLoading(false);
                return;
            }

            const total = ratings.length;
            const movies = ratings.filter(r => r.media_type === 'movie').length;
            const series = ratings.filter(r => r.media_type === 'tv').length;
            const avg = total > 0 ? ratings.reduce((acc, r) => acc + r.score, 0) / total : 0;

            const dist = {
                superLike: ratings.filter(r => r.score === 5).length,
                like: ratings.filter(r => r.score === 2).length,
                dislike: ratings.filter(r => r.score === -2).length,
                odio: ratings.filter(r => r.score === -5).length,
            };

            setStats({
                totalRatings: total,
                moviesWatched: movies,
                seriesWatched: series,
                averageScore: avg,
                ratingsDistribution: dist,
                recentRatings: ratings.slice(0, 10),
                favoritePlatform: 'N/A'
            });
            setLoading(false);
        }
        loadStats();
    }, [supabase]);

    if (loading) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500"></i>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black text-white pb-20">
            <div className="fixed top-0 left-0 w-full bg-gray-950/95 backdrop-blur z-40 border-b border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-extrabold tracking-tight cursor-pointer">
                        MEDIA<span className="text-blue-500">HUB</span>
                    </Link>
                    <AuthButton />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-20 md:pt-32">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <i className="fas fa-user-astronaut text-blue-500"></i> Tu Perfil
                </h1>

                {!stats ? (
                    <div className="text-center py-20 text-gray-500">Inicia sesión para ver tus estadísticas.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase text-xs tracking-wider">Resumen</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-950 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-white">{stats.totalRatings}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Votos Totales</div>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl text-center relative group cursor-help">
                                    <i className="fas fa-info-circle absolute top-2 right-2 text-gray-700 hover:text-white transition"></i>
                                    <div className="absolute top-8 right-2 w-48 bg-gray-800 text-xs text-left p-3 rounded-lg shadow-xl border border-gray-700 hidden group-hover:block z-50">
                                        Suma de puntuaciones<br />(Odio, Dislike, Like, Me Encanta) / total.
                                    </div>
                                    <div className="text-3xl font-bold text-yellow-500">{stats.averageScore.toFixed(1)}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Nota Media</div>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-blue-500">{stats.moviesWatched}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Películas</div>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-purple-500">{stats.seriesWatched}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Series</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase text-xs tracking-wider">Distribución</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-green-600 font-bold"><i className="fas fa-heart mr-1"></i> Me Encanta</span>
                                        <span>{stats.ratingsDistribution.superLike}</span>
                                    </div>
                                    <div className="w-full bg-gray-950 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.totalRatings > 0 ? (stats.ratingsDistribution.superLike / stats.totalRatings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-green-400 font-bold"><i className="fas fa-thumbs-up mr-1"></i> Like</span>
                                        <span>{stats.ratingsDistribution.like}</span>
                                    </div>
                                    <div className="w-full bg-gray-950 rounded-full h-2">
                                        <div className="bg-green-400 h-2 rounded-full" style={{ width: `${stats.totalRatings > 0 ? (stats.ratingsDistribution.like / stats.totalRatings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-red-400 font-bold"><i className="fas fa-thumbs-down mr-1"></i> Dislike</span>
                                        <span>{stats.ratingsDistribution.dislike}</span>
                                    </div>
                                    <div className="w-full bg-gray-950 rounded-full h-2">
                                        <div className="bg-red-400 h-2 rounded-full" style={{ width: `${stats.totalRatings > 0 ? (stats.ratingsDistribution.dislike / stats.totalRatings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-red-600 font-bold"><i className="fas fa-skull mr-1"></i> Odio</span>
                                        <span>{stats.ratingsDistribution.odio}</span>
                                    </div>
                                    <div className="w-full bg-gray-950 rounded-full h-2">
                                        <div className="bg-red-600 h-2 rounded-full" style={{ width: `${stats.totalRatings > 0 ? (stats.ratingsDistribution.odio / stats.totalRatings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase text-xs tracking-wider">Últimas Valoraciones</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-950">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Título</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3 rounded-r-lg text-right">Nota</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentRatings.map((r, i) => (
                                            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                                <td className="px-4 py-3 font-medium text-white">{r.title}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.media_type === 'tv' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                                        {r.media_type === 'tv' ? 'SERIE' : 'PELÍCULA'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {r.score === 5 && <i className="fas fa-heart text-green-500"></i>}
                                                    {r.score === 2 && <i className="fas fa-thumbs-up text-green-400"></i>}
                                                    {r.score === -2 && <i className="fas fa-thumbs-down text-red-400"></i>}
                                                    {r.score === -5 && <i className="fas fa-skull text-red-600"></i>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}