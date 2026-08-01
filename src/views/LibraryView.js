const LibraryView = ({ activeFolderId, setActiveFolderId, onOpenProfile }) => {
  const { folders, books } = useData();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [detailModalOpen, openDetailModal, closeDetailModal] = window.useHistoryModal('detail-library');
  const [listEditModalOpen, openListEditModal, closeListEditModal] = window.useHistoryModal('list-edit-library');
  const [activeFolderForEdit, setActiveFolderForEdit] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const libraryBooks = useMemo(() => books.filter(b => b.inLibrary), [books]);
  const visibleFolderIds = useMemo(() => {
    const ids = new Set();
    const addFolderAndAncestors = (folderId) => {
      if (!folderId || ids.has(folderId)) return;
      ids.add(folderId);
      const folder = folders.find(f => f.id === folderId);
      if (folder && folder.parentId) addFolderAndAncestors(folder.parentId);
    };
    libraryBooks.forEach(book => { if (book.folderId) addFolderAndAncestors(book.folderId); });
    return ids;
  }, [libraryBooks, folders]);

  const visibleFolders = useMemo(() => folders.filter(f => visibleFolderIds.has(f.id)), [folders, visibleFolderIds]);

  const currentFolders = React.useMemo(() => visibleFolders.filter(f => f.parentId === activeFolderId), [visibleFolders, activeFolderId]);
  const currentBooks = React.useMemo(() => libraryBooks.filter(b => b.folderId === activeFolderId), [libraryBooks, activeFolderId]);

  const currentItems = React.useMemo(() => [
    ...currentFolders.map(f => ({ ...f, _type: 'folder' })),
    ...currentBooks.map(b => ({ ...b, _type: 'book' }))
  ].sort((a, b) => a.order - b.order), [currentFolders, currentBooks]);

  const { breadcrumbs, getFolderPath, handleNavigate } = window.useFolderUtils(folders, activeFolderId, setActiveFolderId, setIsSearching, setSearchTerm);

  const filteredBooks = React.useMemo(() => searchTerm 
    ? libraryBooks.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())))
    : [], [libraryBooks, searchTerm]);



  const handleOpenBook = React.useCallback((id) => {
    setActiveBookId(id);
    openDetailModal();
  }, [openDetailModal]);

  const handleEditFolder = React.useCallback((fid) => {
    setActiveFolderForEdit(fid);
    openListEditModal();
  }, [openListEditModal]);

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="sticky top-0 bg-[#3d3430] backdrop-blur-md z-20 shadow-sm flex flex-col">
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
            <button onClick={onOpenProfile} className="p-2 -ml-2 text-stone-300 hover:bg-stone-800 rounded-full transition-colors">
              <User size={22} />
            </button>
            <div className="flex items-end justify-center text-stone-50">
              <img src="./logo.png" alt="Logo" className="w-[84px] h-[84px] object-contain drop-shadow-sm" />
              <span className="font-mono text-xl font-bold tracking-[0.25em] ml-2 mb-3">ARCHIVE</span>
            </div>
            <div className="w-[38px]"></div>
          </div>
        </div>
        
        <div className="sticky top-14 bg-white/95 backdrop-blur-sm z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
          <div className="px-5 py-1 min-h-[25px] flex flex-col justify-center">
            {isSearching ? (
              <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                  <input autoFocus type="text" placeholder="Kütüphanede ara..." className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors shrink-0">
                  İptal
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex flex-col flex-1 min-w-0 py-1">
                  {!activeFolderId ? (
                     <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Kütüphanem</h1>
                  ) : (
                    <>
                    <div className="flex items-center mt-1 w-full">
                      <button onClick={() => setActiveFolderId(null)} className={`flex-1 text-left flex items-center transition-all px-2 py-0.5 rounded-lg border ${(activeFolderId === null) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target="root">
                         <span className="truncate inline-block">Kütüphanem</span>
                      </button>
                    </div>
                    <div className="flex flex-col mt-1">
                      {breadcrumbs.map((bc, idx) => (
                        <div key={bc.id} className="flex items-center mt-1 w-full" style={{ paddingLeft: `${(idx + 1) * 16}px` }}>
                          <CornerDownRight size={14} className="text-zinc-400 shrink-0 mr-1.5" />
                          <button onClick={() => setActiveFolderId(bc.id)} className={`flex-1 text-left flex items-center transition-all px-2 py-0.5 rounded-lg border ${(activeFolderId === bc.id) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === bc.id && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target={bc.id}>
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

     <div className="flex-1 overflow-y-auto pt-[12.8px] pr-4 pb-24 pl-[10px]" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
           searchTerm.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <Search size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Aramak istediğiniz kitabın adını yazın.</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-[3.6px]">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} isLibraryView={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <FileText size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Kütüphanenizde bu isimde kitap yok.</p>
            </div>
          )
        ) : libraryBooks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
            <Library size={48} className="opacity-20" />
            <p className="text-center text-sm font-medium px-4">Kütüphanenizde kitap yok.<br/><span className="text-xs font-normal">Listelerinizdeki kitapları "Kütüphanemde" olarak işaretleyin.</span></p>
          </div>
        ) : (
          <div className="space-y-[3.6px] min-h-[60px] rounded-xl transition-colors" data-folder-target={activeFolderId || "root"}>
             <ItemList 
               ids={currentItems.map(i => i.id)} 
               items={currentItems} 
               folders={visibleFolders} 
               books={libraryBooks} 
               folderKey={activeFolderId || "root"} 
               onOpenBook={handleOpenBook} 
               onOpenFolder={setActiveFolderId} 
               onEditFolder={handleEditFolder}
               isLibraryView={true} 
             />
          </div>
        )}
      </div>
      <BookDetailModal isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />
    </div>
  );
};
