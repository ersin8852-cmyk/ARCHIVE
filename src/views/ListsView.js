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
      <Header onOpenProfile={onOpenProfile} />
      
      <ViewTitleBar
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        breadcrumbs={breadcrumbs}
        rootTitle="Listelerim"
        searchPlaceholder="Kitap veya yazar ara..."
      />

      <div className="flex-1 overflow-y-auto pt-[12.8px] pr-4 pb-24 pl-[10px]" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
          searchTerm.trim() === '' ? (
            <EmptyState icon={Search} title="Aramak istediğiniz kitabın adını yazın." />
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-[3.6px]">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Bu isimde bir kitap bulunamadı." />
          )
        ) : (
          <>
            {currentBooks.length === 0 && currentFolders.length === 0 ? (
              <EmptyState icon={List} title="Bu liste boş. Kitap veya yeni liste ekleyin." />
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
      <BookDetailModal key={activeBookId ? `detail-${activeBookId}` : 'detail-empty'} isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListCreateModal isOpen={listCreateModalOpen} onClose={closeListCreateModal} onCreate={addFolder} parentId={activeFolderId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />

    </div>
  );
};
