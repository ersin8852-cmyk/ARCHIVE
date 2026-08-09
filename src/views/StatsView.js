const StatRow = ({ label, value, isLast }) => (
  <div className={`flex justify-between items-center py-2.5 ${!isLast ? 'border-b border-zinc-100' : ''}`}>
    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-bold text-zinc-900">{value}</span>
  </div>
);

const StatsView = ({ onOpenProfile }) => {
  const { books, profile } = useData();

  const stats = useMemo(() => {
    const deduplicate = (arr) => {
      const sorted = [...arr].sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? -1 : 1;
        if (a.inLibrary !== b.inLibrary) return a.inLibrary ? -1 : 1;
        return 0;
      });
      const seenIsbns = new Set();
      return sorted.filter(b => {
        if (!b.isbn) return true;
        if (seenIsbns.has(b.isbn)) return false;
        seenIsbns.add(b.isbn);
        return true;
      });
    };

    const uniqueBooks = deduplicate(books);
    const libBooks = uniqueBooks.filter(b => b.inLibrary);
    const calc = (arr) => {
      if (arr.length === 0) return null;
      let totalPages = 0, totalPrice = 0, longest = arr[0], shortest = arr[0];
      const authors = {};
      arr.forEach(b => {
        const p = parseInt(b.pageCount) || 0;
        totalPages += p; totalPrice += parseFloat(b.price) || 0;
        if (p > (parseInt(longest.pageCount) || 0)) longest = b;
        if (p > 0 && (parseInt(shortest.pageCount) || 0) === 0) shortest = b;
        else if (p > 0 && p < (parseInt(shortest.pageCount) || Infinity)) shortest = b;
        if (b.author) authors[b.author] = (authors[b.author] || 0) + 1;
      });
      let favAuth = '-', max = 0;
      Object.entries(authors).forEach(([a, c]) => { if (c > max) { max = c; favAuth = a; } });
      
      const isShortestValid = (parseInt(shortest.pageCount) || 0) > 0;
      
      return { 
        total: arr.length, 
        pages: totalPages, 
        avg: Math.round(totalPages/arr.length)||0, 
        long: longest.title||'-', 
        short: isShortestValid ? shortest.title : '-', 
        fav: favAuth, 
        price: totalPrice 
      };
    };
    
    const listS = calc(uniqueBooks) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const libS = calc(libBooks) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const read = libBooks.filter(b => b.isRead);
    const unread = libBooks.filter(b => !b.isRead);
    const rPages = read.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    const uPages = unread.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    const pct = libBooks.length > 0 ? Math.round((read.length / libBooks.length) * 100) : 0;
    return { list: listS, lib: libS, read: { rCount: read.length, rPages, uCount: unread.length, uPages, pct } };
  }, [books]);

  return (
    <div className="h-full flex flex-col bg-zinc-50 relative">
      <div className="sticky top-0 bg-[#3d3430] backdrop-blur-md z-20 shadow-sm flex flex-col">
        <div className="h-[50px] px-4 flex items-center border-b border-white/5 relative z-20">
          <button onClick={onOpenProfile} className="shrink-0 p-1.5 -ml-1 text-stone-300 hover:bg-stone-800 rounded-full transition-colors flex items-center justify-center relative z-10">
            {profile?.photo ? (
              <img src={profile.photo} alt="Profil" className="w-9 h-9 rounded-full object-cover border border-stone-500 shadow-sm" />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-700/50 shadow-sm">
                <User size={20} />
              </div>
            )}
          </button>
          
          <img 
            src="./logo.png" 
            alt="Logo" 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] max-w-none object-contain drop-shadow-sm pointer-events-none" 
          />
        </div>
      </div>
      
      <div className="sticky top-[50px] bg-white/95 backdrop-blur-sm z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
        <div className="pl-[10px] pr-4 flex flex-col justify-center" style={{ minHeight: '32px' }}>
          <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
             <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Verilerim</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[12.8px] pr-4 pb-24 pl-[10px] space-y-4">
        
        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-2">
            <List size={16} className="text-orange-600" />
            <h2 className="text-sm font-bold text-zinc-800">Tüm Listelerim</h2>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Toplam Kitap" value={stats.list.total} />
            <StatRow label="Toplam Sayfa" value={stats.list.pages.toLocaleString()} />
            <StatRow label="Toplam Değer" value={'₺' + stats.list.price.toLocaleString()} />
            <StatRow label="Favori Yazar" value={stats.list.fav} isLast={true} />
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-2">
            <Library size={16} className="text-orange-600" />
            <h2 className="text-sm font-bold text-zinc-800">Kütüphanem</h2>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Toplam Kitap" value={stats.lib.total} />
            <StatRow label="Toplam Sayfa" value={stats.lib.pages.toLocaleString()} />
            <StatRow label="Toplam Değer" value={'₺' + stats.lib.price.toLocaleString()} />
            <StatRow label="Favori Yazar" value={stats.lib.fav} />
            <StatRow label="En Uzun Kitap" value={stats.lib.long} isLast={true} />
          </div>
        </section>

        <section className="bg-[#2a2421] border border-[#3d3430] rounded-2xl shadow-md overflow-hidden">
          <div className="bg-[#3d3430] border-b border-white/5 px-4 py-2.5 flex items-center gap-2">
            <BookOpen size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-stone-100">Okuma Durumu</h2>
          </div>
          <div className="px-4 py-1">
            <div className={`flex justify-between items-center py-2.5 border-b border-[#3d3430]`}>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Okunan Kitap</span>
              <span className="text-sm font-bold text-orange-500">{stats.read.rCount}</span>
            </div>
            <div className={`flex justify-between items-center py-2.5 border-b border-[#3d3430]`}>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Okunan Sayfa</span>
              <span className="text-sm font-bold text-orange-500">{stats.read.rPages.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between items-center py-2.5 border-b border-[#3d3430]`}>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Okunmayan Kitap</span>
              <span className="text-sm font-bold text-stone-100">{stats.read.uCount}</span>
            </div>
            <div className={`flex justify-between items-center py-2.5 border-b border-[#3d3430]`}>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Okunmayan Sayfa</span>
              <span className="text-sm font-bold text-stone-100">{stats.read.uPages.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between items-center py-2.5`}>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Okunma Oranı</span>
              <span className="text-sm font-bold text-stone-100">%{stats.read.pct}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
