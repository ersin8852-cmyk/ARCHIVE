const ViewTitleBar = ({
  isSearching,
  setIsSearching,
  searchTerm,
  setSearchTerm,
  activeFolderId,
  setActiveFolderId,
  breadcrumbs,
  rootTitle,
  searchPlaceholder
}) => {
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();

  return (
    <div className="sticky top-14 bg-white/95 backdrop-blur-sm z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
      <div className="px-5 py-1 min-h-[25px] flex flex-col justify-center">
        {isSearching ? (
          <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
              <input 
                autoFocus 
                type="text" 
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors shrink-0">
              İptal
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex flex-col flex-1 min-w-0 py-0.5">
              {!activeFolderId ? (
                 <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">{rootTitle}</h1>
              ) : (
                <>
                  <div className="flex items-center w-full">
                    <button 
                      onClick={() => setActiveFolderId(null)} 
                      className={`flex-1 text-left flex items-center transition-all px-2 py-[1px] rounded-lg border ${(activeFolderId === null) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'relative z-10 ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} 
                      data-breadcrumb-target="root"
                    >
                       <span className="truncate inline-block">{rootTitle}</span>
                    </button>
                  </div>
                  <div className="flex flex-col">
                    {breadcrumbs.map((bc, idx) => (
                      <div key={bc.id} className="flex items-center w-full" style={{ paddingLeft: `${(idx + 1) * 8}px` }}>
                        <CornerDownRight size={14} className="text-zinc-400 shrink-0 mr-1" />
                        <button 
                          onClick={() => setActiveFolderId(bc.id)} 
                          className={`flex-1 text-left flex items-center transition-all px-2 py-[1px] rounded-lg border ${(activeFolderId === bc.id) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === bc.id && overTarget.source === 'breadcrumb') ? 'relative z-10 ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} 
                          data-breadcrumb-target={bc.id}
                        >
                          <span className="truncate inline-block">{bc.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {!activeFolderId && (
              <button onClick={() => setIsSearching(true)} className="p-2 -mr-2 ml-4 text-zinc-600 hover:bg-zinc-100 hover:text-orange-600 rounded-full transition-colors shrink-0">
                <Search size={22} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
