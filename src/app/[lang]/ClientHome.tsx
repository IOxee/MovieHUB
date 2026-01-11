'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AuthButton from '@/components/AuthButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Item = {
  id: number;
  title: string;
  media_type: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  status: string;
  my_score: number;
  score?: number;
  type?: string;
};

type Provider = {
  name: string;
  logo: string;
  type: string;
};

type RatingType = 'SuperLike' | 'Like' | 'Dislike' | 'Odio';

const RATING_MAP: Record<RatingType, number> = {
  'SuperLike': 5,
  'Like': 2,
  'Dislike': -2,
  'Odio': -5
};

const ICON_MAP: Record<RatingType, string> = {
  'SuperLike': 'fa-heart',
  'Like': 'fa-thumbs-up',
  'Dislike': 'fa-thumbs-down',
  'Odio': 'fa-skull'
};

export default function Home({ dict, lang }: { dict: any, lang: string }) { 
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [mediaType, setMediaType] = useState('all');
  const [minYear, setMinYear] = useState(1989);
  const [maxYear, setMaxYear] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statsCount, setStatsCount] = useState(0);
  const [viewMode, setViewMode] = useState<'catalog' | 'recommendations'>('catalog');

  const minSliderRef = useRef<HTMLInputElement>(null);
  const maxSliderRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>(null);
  const prevMediaType = useRef(mediaType);
  
  const [supabase] = useState(() => getSupabaseBrowser());

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => { sub.subscription?.unsubscribe?.(); };
  }, [supabase]);


  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stats');
      if (error) console.error(error);
      if (data) setStatsCount(data.count);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCatalog = useCallback(async (reset = false) => {
    // Prevent catalog load if we are in recommendations mode and not resetting
    if (!reset && viewMode === 'recommendations') return;

    setLoading(true);
    if (reset) setViewMode('catalog'); 
    
    const p = reset ? 1 : page;
    
    try {
      let resData;
      if (searchQuery) {
        const { data, error } = await supabase.functions.invoke('search_manual', {
            body: { q: searchQuery }
        });
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await supabase.functions.invoke('catalog', {
            body: { page: p, type: mediaType, min_year: minYear, max_year: maxYear }
        });
        if (error) throw error;
        resData = data;
      }
      
      const data = resData || [];

      if (reset) {
        setCatalog(data);
      } else {
        setCatalog(prev => {
          const ids = new Set(prev.map(i => i.id));
          const newData = data.filter((i: Item) => !ids.has(i.id));
          return [...prev, ...newData];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, mediaType, minYear, maxYear, supabase, viewMode]);

  useEffect(() => {
    fetchStats();
    loadCatalog(false);
  }, [loadCatalog]);

  useEffect(() => {
    if (page > 1 && viewMode === 'catalog') {
      loadCatalog(false);
    }
  }, [page, viewMode, loadCatalog]);

  const loadMore = () => {
    if (viewMode === 'recommendations') {
      getRecommendations(true);
    } else {
      setPage(prev => prev + 1);
    }
  };

  const bringToFront = (type: 'min' | 'max') => {
    if (minSliderRef.current) minSliderRef.current.classList.remove('z-high');
    if (maxSliderRef.current) maxSliderRef.current.classList.remove('z-high');
    const ref = type === 'min' ? minSliderRef : maxSliderRef;
    if (ref.current) ref.current.classList.add('z-high');
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    let val = parseInt(e.target.value);
    if (type === 'min') {
      if (val > maxYear) val = maxYear;
      setMinYear(val);
    } else {
      if (val < minYear) val = minYear;
      setMaxYear(val);
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery('');
      loadCatalog(true);
    }, 1000);
  };

  const getSliderFillStyle = () => {
    const min = 1950;
    const max = 2026;
    const range = max - min;
    const percentMin = ((minYear - min) / range) * 100;
    const percentMax = ((maxYear - min) / range) * 100;
    return {
      left: `${percentMin}%`,
      width: `${percentMax - percentMin}%`
    };
  };

  const setFilter = (type: string) => {
    setMediaType(type);
    setSearchQuery('');
  };

  useEffect(() => {
    if (prevMediaType.current !== mediaType) {
        prevMediaType.current = mediaType;
        if (viewMode === 'recommendations') {
            getRecommendations();
        } else {
            loadCatalog(true);
        }
    }
  }, [mediaType, loadCatalog, viewMode]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadCatalog(true);
    }
  };

  const openModal = async (item: Item) => {
    setSelectedItem(item);
    setLoadingProviders(true);
    setProviders([]);
    try {
      const { data, error } = await supabase.functions.invoke('providers', {
        body: { id: item.id, type: item.media_type, lang }
      });
      if (!error && data) {
         setProviders(data);
      } else {
         setProviders([]);
      }
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const vote = async (ratingType: RatingType) => {
    if (!selectedItem) return;
    if (!isLoggedIn) {
      alert(dict.alerts.loginToVote); 
      return;
    }
    
    const newScore = RATING_MAP[ratingType];
    
    setSelectedItem(prev => prev ? ({ ...prev, my_score: newScore }) : null);

    setCatalog(prev => prev.map(item => 
      item.id === selectedItem.id ? { ...item, my_score: newScore, status: 'seen' } : item
    ));

    await supabase.functions.invoke('rate', {
      body: {
        id: selectedItem.id,
        title: selectedItem.title,
        media_type: selectedItem.media_type,
        rating_type: ratingType
      }
    });
    
    fetchStats();
    setSelectedItem(null);
  };

  const getRecommendations = async (append = false) => {
    setLoading(true);
    if (!append) setSearchQuery('');
    setViewMode('recommendations');
    
    try {
      const { data, error } = await supabase.functions.invoke('recommend', {
        body: { type: mediaType }
      });
      if (error) throw error;
      
      const newItems = (data || []).map((item: Item) => ({ ...item, media_type: item.media_type || 'movie' }));
      
      if (append) {
        setCatalog((prev) => {
           const existingIds = new Set(prev.map(p => p.id));
           const uniqueNew = newItems.filter((i: Item) => !existingIds.has(i.id));
           return [...prev, ...uniqueNew];
        });
      } else {
        setCatalog(newItems);
      }
    } catch {
      alert(dict.alerts.rateMore); 
    } finally {
      setLoading(false);
    }
  };

  const getBadgeRight = (item: Item) => {
    if (item.my_score && item.my_score !== 0) {
      let icon = '', color = '';
      if (item.my_score === 5) { icon = 'fa-heart'; color = 'bg-green-600'; }
      else if (item.my_score === 2) { icon = 'fa-thumbs-up'; color = 'bg-green-500'; }
      else if (item.my_score === -2) { icon = 'fa-thumbs-down'; color = 'bg-red-500'; }
      else { icon = 'fa-skull'; color = 'bg-red-600'; }
      return (
        <div className={`absolute top-2 right-2 ${color} text-white px-2 py-1 rounded text-[10px] font-bold shadow z-10 border border-white/20`}>
          <i className={`fas ${icon}`}></i>
        </div>
      );
    } else if (isLoggedIn) {
      const score = item.score !== undefined ? item.score : Math.round(item.vote_average * 10);
      const colorClass = score >= 70 ? 'bg-green-500' : (score >= 50 ? 'bg-yellow-500' : 'bg-red-500');
      return (
        <div className={`absolute top-2 right-2 ${colorClass} text-black px-2 py-0.5 rounded text-[10px] font-bold shadow z-10 border border-white/20`}>
          {score}%
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-gray-950/95 backdrop-blur z-40 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-4">
            {/* Header Mobile & Desktop */}
            <div className="flex items-center justify-between w-full relative z-[60]">
              <h1 className="text-2xl font-extrabold tracking-tight cursor-pointer" onClick={() => window.location.reload()}>
                MEDIA<span className="text-blue-500">HUB</span>
              </h1>
              <div className="flex items-center gap-3 md:hidden relative z-[60]">
                 <div className="text-right">
                    <div className="text-sm font-bold text-blue-500 leading-none">{statsCount}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{dict.stats.ratings}</div>
                 </div>
                 <div className="relative z-50 flex items-center gap-2">
                    <LanguageSwitcher />
                    <AuthButton dict={dict} lang={lang} />
                 </div>
              </div>
            </div>

            <div className={`flex flex-col md:flex-row gap-4 items-center justify-between w-full relative z-40 transition-all duration-500 ease-in-out`}>
               <div className={`relative w-full md:w-64 order-1 ${viewMode === 'recommendations' ? 'hidden' : 'block'}`}>
                <input type="text" placeholder={dict.searchPlaceholder} 
                  className="w-full bg-gray-900 border border-gray-800 text-sm rounded-full py-2 px-4 pl-10 focus:outline-none focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  />
                <button onClick={() => loadCatalog(true)} className="absolute left-3 top-2 text-gray-400 text-sm"><i className="fas fa-search"></i></button>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 sm:gap-4 items-center w-full md:w-auto justify-center md:justify-end order-2">
                <div className={`flex bg-gray-900 p-1 rounded-lg border border-gray-800 h-9 items-center justify-center w-full sm:w-auto relative z-30 ${viewMode === 'recommendations' ? 'hidden' : 'flex'}`}>
                    <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-4 py-1 text-xs font-bold rounded h-full flex items-center justify-center transition-all ${mediaType === 'all' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{dict.filters.all}</button>
                    <button onClick={() => setFilter('movie')} className={`flex-1 sm:flex-none px-4 py-1 text-xs font-bold rounded h-full flex items-center justify-center transition-all ${mediaType === 'movie' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{dict.filters.movies}</button>
                    <button onClick={() => setFilter('tv')} className={`flex-1 sm:flex-none px-4 py-1 text-xs font-bold rounded h-full flex items-center justify-center transition-all ${mediaType === 'tv' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{dict.filters.series}</button>
                </div>

                <div className={`w-full sm:w-48 md:w-64 relative px-2 h-10 flex items-center z-20 ${viewMode === 'recommendations' ? 'hidden' : 'block'}`}>
                    <div className="timeline-container mt-0">
                    <div className="date-label start">{minYear}</div>
                    <div className="date-label end">{maxYear}</div>
                    
                    <div className="timeline-track"></div>
                    <div className="timeline-fill" style={getSliderFillStyle()}></div>
                    
                    <input type="range" className="range-input" min="1950" max="2026" value={minYear} 
                        ref={minSliderRef} onChange={(e) => handleSliderChange(e, 'min')} 
                        onMouseDown={() => bringToFront('min')} onTouchStart={() => bringToFront('min')} />
                    <input type="range" className="range-input" min="1950" max="2026" value={maxYear}
                        ref={maxSliderRef} onChange={(e) => handleSliderChange(e, 'max')} 
                        onMouseDown={() => bringToFront('max')} onTouchStart={() => bringToFront('max')} />
                    </div>
                </div>
              </div>

              <div className="hidden md:flex gap-3 items-center order-3">
                <LanguageSwitcher />
                <AuthButton dict={dict} lang={lang} />
                {viewMode === 'recommendations' ? (
                 <>
                   <button onClick={() => loadCatalog(true)} className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-lg text-sm font-bold shadow-lg transition transform hover:scale-105 flex items-center justify-center">
                      <i className="fas fa-arrow-left"></i>
                   </button>
                   <button onClick={() => getRecommendations()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition transform hover:scale-105 whitespace-nowrap">
                      <i className="fas fa-magic mr-1"></i> {dict.buttons.again}
                   </button>
                 </>
                ) : (
                 <button onClick={() => getRecommendations()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition transform hover:scale-105 whitespace-nowrap">
                    <i className="fas fa-magic mr-1"></i> {dict.buttons.aiRecommendations}
                 </button>
                )}
                <div className="text-right ml-2">
                    <div className="text-xl font-bold text-blue-500 leading-none">{statsCount}</div>
                    <div className="text-[8px] uppercase tracking-widest text-gray-500">{dict.stats.votes}</div>
                </div>
              </div>

              <div className="md:hidden w-full order-4 flex gap-2">
                  {viewMode === 'recommendations' ? (
                     <>
                        <button onClick={() => loadCatalog(true)} className="bg-gray-700 hover:bg-gray-600 text-white w-12 h-10 rounded-lg text-sm font-bold shadow-lg transition flex items-center justify-center">
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <button onClick={() => getRecommendations()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition">
                          <i className="fas fa-magic mr-1"></i> {dict.buttons.again}
                        </button>
                     </>
                  ) : (
                     <button onClick={() => getRecommendations()} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition">
                       <i className="fas fa-magic mr-1"></i> {dict.buttons.aiRecommendations}
                     </button>
                  )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className={`pt-32 md:pt-32 pb-12 max-w-7xl mx-auto px-4 min-h-screen transition-all duration-300 ${viewMode === 'recommendations' ? 'pt-36' : 'pt-72'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          {catalog.map(item => (
            <div key={item.id} onClick={() => openModal(item)} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 relative group cursor-pointer hover:scale-105 transition duration-300">
              <div className="aspect-[2/3] bg-gray-800 relative">
                <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} className="w-full h-full object-cover" alt={item.title} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <i className="fas fa-info-circle text-3xl text-white"></i>
                </div>
                <div className={`absolute top-2 left-2 ${item.media_type === 'tv' ? 'bg-purple-600' : 'bg-blue-600'} text-white px-2 py-0.5 rounded text-[10px] font-bold shadow z-10 border border-white/20`}>
                  {item.media_type === 'tv' ? dict.badges.series : dict.badges.movie}
                </div>
                {getBadgeRight(item)}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white text-sm truncate">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.release_date ? item.release_date.split('-')[0] : 'N/A'}</p>
              </div>
            </div>
          ))}
          {catalog.length === 0 && !loading && (
            <p className="col-span-full text-center text-gray-500 mt-10">{dict.alerts.noResults}</p>
          )}
        </div>
        
        {catalog.length > 0 && !searchQuery && (
          <div className="text-center mt-12">
            <button onClick={loadMore} className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-bold transition border border-gray-700 shadow-lg">{dict.buttons.loadMore}</button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500"></i>
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col md:flex-row relative fade-in max-h-[90vh]">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-white hover:text-red-500 z-10 text-2xl transition"><i className="fas fa-times"></i></button>
            <div className="md:w-5/12 h-64 md:h-auto bg-black relative">
              <img src={`https://image.tmdb.org/t/p/w780${selectedItem.poster_path}`} className="w-full h-full object-cover opacity-80" alt={selectedItem.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            <div className="md:w-7/12 p-8 flex flex-col overflow-y-auto">
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{selectedItem.title}</h2>
              <div className="flex items-center gap-3 mb-6 text-sm text-gray-400">
                <span className="border border-gray-700 px-2 rounded">{selectedItem.release_date ? selectedItem.release_date.split('-')[0] : 'N/A'}</span>
                <span className="uppercase font-bold text-blue-400">{selectedItem.media_type === 'tv' ? dict.modal.tvSeries : dict.modal.movie}</span>
                <span className="text-yellow-500"><i className="fas fa-star"></i> {selectedItem.vote_average?.toFixed(1)}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{selectedItem.overview || dict.modal.noDescription}</p>
              
              <div className="mb-8 p-4 bg-gray-950/50 rounded-xl border border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg" className="w-4 h-3 rounded-sm" alt="ES" /> {dict.modal.availableIn}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {loadingProviders ? <i className="fas fa-spinner fa-spin text-blue-500"></i> : (
                    providers.length > 0 ? providers.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 w-12">
                        <img src={`https://image.tmdb.org/t/p/original${p.logo}`} className="w-10 h-10 rounded-lg shadow provider-logo" title={p.name} alt={p.name} />
                        <span className="text-[8px] text-gray-400 truncate w-full text-center">{p.type}</span>
                      </div>
                    )) : <span className="text-xs text-gray-500">{dict.modal.noStreaming}</span>
                  )}
                </div>
              </div>

              <div className="mt-auto">
                {isLoggedIn ? (
                  <>
                    <p className="text-center text-xs text-gray-500 uppercase mb-2">{dict.modal.yourRating}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Odio', 'Dislike', 'Like', 'SuperLike'] as const).map((type) => {
                        const isSelected = selectedItem.my_score === RATING_MAP[type];
                        return (
                          <button
                            key={type}
                            onClick={() => vote(type)}
                            className={`p-3 rounded-lg text-gray-400 transition flex flex-col items-center border border-transparent ${isSelected ? 'vote-selected' : 'bg-gray-800'} hover:bg-gray-700`}
                          >
                            <i className={`fas ${ICON_MAP[type]} text-xl`}></i>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-950/50 p-6 rounded-xl border border-gray-800 text-center">
                     <p className="text-gray-400 text-sm mb-3">{dict.modal.guestMessage}</p>
                     <AuthButton dict={dict} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
