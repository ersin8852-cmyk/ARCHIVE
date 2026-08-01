const ListsView = ({ activeFolderId, setActiveFolderId, onOpenProfile }) => {
  const { folders, books, addFolder, profile } = useData();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [searchModalOpen, openSearchModal, closeSearchModal, setSearchModalOpen] = window.useHistoryModal('search');
  const [activeFolderForAdd, setActiveFolderForAdd] = useState(null);
  const [detailModalOpen, openDetailModal, closeDetailModal] = window.useHistoryModal('detail-lists');
  const [activeBookId, setActiveBookId] = useState(null);
  const [listEditModalOpen, openListEditModal, closeListEditModal] = window.useHistoryModal('list-edit');
  const [activeFolderForEdit, setActiveFolderForEdit] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fabMenuOpen, openFabMenu, closeFabMenu, setFabMenuOpen] = window.useHistoryModal('fab');
  const [listCreateModalOpen, openListCreateModal, closeListCreateModal] = window.useHistoryModal('list-create');
  const [manualAddModalOpen, openManualAddModal, closeManualAddModal] = window.useHistoryModal('manual-add');


  const currentFolders = React.useMemo(() => folders.filter(f => f.parentId === activeFolderId), [folders, activeFolderId]);
  const currentBooks = React.useMemo(() => books.filter(b => b.folderId === activeFolderId), [books, activeFolderId]);

  const currentItems = React.useMemo(() => [
    ...currentFolders.map(f => ({ ...f, _type: 'folder' })),
    ...currentBooks.map(b => ({ ...b, _type: 'book' }))
  ].sort((a, b) => a.order - b.order), [currentFolders, currentBooks]);

  const { breadcrumbs, getFolderPath, handleNavigate } = window.useFolderUtils(folders, activeFolderId, setActiveFolderId, setIsSearching, setSearchTerm);

  const filteredBooks = React.useMemo(() => searchTerm 
    ? books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())))
    : [], [books, searchTerm]);



  const handleOpenBook = React.useCallback((id) => {
    setActiveBookId(id);
    openDetailModal();
  }, [openDetailModal]);

  const handleAddBook = React.useCallback((fid) => {
    setActiveFolderForAdd(fid);
    openSearchModal();
  }, [openSearchModal]);

  const handleEditFolder = React.useCallback((fid) => {
    setActiveFolderForEdit(fid);
    openListEditModal();
  }, [openListEditModal]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="sticky top-0 bg-[#3d3430] backdrop-blur-md z-20 shadow-sm flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
          <button onClick={onOpenProfile} className="p-1.5 -ml-1 text-stone-300 hover:bg-stone-800 rounded-full transition-colors flex items-center justify-center">
            {profile?.photo ? (
              <img src={profile.photo} alt="Profil" className="w-9 h-9 rounded-full object-cover border border-stone-500 shadow-sm" />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-700/50 shadow-sm">
                <User size={20} />
              </div>
            )}
          </button>
          <div className="flex items-end justify-center text-stone-50">
            <img src="./logo.png" alt="Logo" className="w-[84px] h-[84px] object-contain drop-shadow-sm" />
            <span className="font-mono text-xl font-bold tracking-[0.25em] ml-2 mb-4">ARCHIVE</span>
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
                <input autoFocus type="text" placeholder="Kitap veya yazar ara..." className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors shrink-0">
                İptal
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex flex-col flex-1 min-w-0 py-1">
                {!activeFolderId ? (
                   <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Listelerim</h1>
                ) : (
                  <>
                    <div className="flex items-center mt-1 w-full">
                      <button onClick={() => setActiveFolderId(null)} className={`flex-1 text-left flex items-center transition-all px-2 py-0.5 rounded-lg border ${(activeFolderId === null) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target="root">
                         <span className="truncate inline-block">Listelerim</span>
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
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <FileText size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Bu isimde bir kitap bulunamadı.</p>
            </div>
          )
        ) : (
          <>
            {currentBooks.length === 0 && currentFolders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
                <List size={48} className="opacity-20" />
                <p className="text-center text-sm font-medium">Bu liste boş. Kitap veya yeni liste ekleyin.</p>
              </div>
            ) : (
              <div className="space-y-[3.6px] min-h-[60px] rounded-xl transition-colors" data-folder-target={activeFolderId || "root"}>
                  <ItemList 
                    ids={currentItems.map(i => i.id)}
                    folderKey={activeFolderId || 'root'}
                    items={currentItems}
                    folders={folders}
                    books={books}
                    onOpenFolder={setActiveFolderId}
                    onOpenBook={handleOpenBook}
                    onEditFolder={handleEditFolder}
                  />
              </div>
            )}
          </>
        )}
      </div>
      <div className="absolute right-6 z-50" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {fabMenuOpen && (
           <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm" onClick={closeFabMenu} />
        )}
        <div className="relative z-50 flex flex-col items-end gap-3">
          {fabMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <button onClick={() => { setFabMenuOpen(false); openListCreateModal(); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-2 rounded-xl shadow-md text-[15px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Liste Oluştur</span>
                <div className="w-12 h-12 bg-white text-zinc-600 rounded-full shadow-md flex items-center justify-center group-hover:bg-zinc-50 group-hover:text-zinc-900 transition-colors">
                  <List size={20} />
                </div>
              </button>
              <button onClick={() => { setFabMenuOpen(false); setActiveFolderForAdd(activeFolderId); openSearchModal(); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-2 rounded-xl shadow-md text-[15px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Kitap Ekle</span>
                <div className="w-12 h-12 bg-white text-zinc-600 rounded-full shadow-md flex items-center justify-center group-hover:bg-zinc-50 group-hover:text-zinc-900 transition-colors">
                  <BookOpen size={20} />
                </div>
              </button>
            </div>
          )}
          


          <button
            onClick={() => fabMenuOpen ? closeFabMenu() : openFabMenu()}
            className={`w-14 h-14 text-white rounded-full shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 transition-all duration-200 flex items-center justify-center active:scale-95 ${fabMenuOpen ? 'rotate-45 bg-zinc-700' : 'bg-orange-600 hover:bg-orange-700'}`}
            title="Ekle"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <SearchAddModal isOpen={searchModalOpen} onClose={closeSearchModal} folderId={activeFolderForAdd} onOpenManualAdd={() => { setSearchModalOpen(false); openManualAddModal(); }} />
      <ManualAddModal isOpen={manualAddModalOpen} onClose={closeManualAddModal} folderId={activeFolderForAdd} />
      <BookDetailModal isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListCreateModal isOpen={listCreateModalOpen} onClose={closeListCreateModal} onCreate={addFolder} parentId={activeFolderId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />

    </div>
  );
};
