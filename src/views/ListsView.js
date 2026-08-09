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

  const filteredFolders = React.useMemo(() => searchTerm
    ? folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [], [folders, searchTerm]);



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

      <div className="flex-1 overflow-y-auto pt-[12.8px] pr-4 pb-64 pl-[10px]" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
          searchTerm.trim() === '' ? (
            <EmptyState icon={Search} title="Aramak istediğiniz kitabın veya listenin adını yazın." />
          ) : (filteredBooks.length > 0 || filteredFolders.length > 0) ? (
            <div className="space-y-[3.6px]">
              {filteredFolders.map(folder => <FolderNode key={folder.id} folder={folder} allFolders={folders} allBooks={books} onOpenFolder={setActiveFolderId} onEdit={handleEditFolder} isLibraryView={false} />)}
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Bu isimde bir kitap veya liste bulunamadı." />
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
           <div className="fixed inset-0 z-40 bg-white/40 backdrop-blur-[2px]" onClick={closeFabMenu} />
        )}
        <div className="relative z-50 flex flex-col items-end gap-3">
          {fabMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <button onClick={() => { setFabMenuOpen(false); openListCreateModal(); }} className="flex items-center gap-3 bg-[#FCFAF8] hover:bg-[#F6F0E9] active:bg-[#EAE0D5] border border-orange-900/10 shadow-sm shadow-orange-900/5 text-stone-800 transition-all rounded-full h-12 pl-5 pr-[18px] group">
                <span className="text-[15px] font-semibold">Liste Oluştur</span>
                <List size={20} className="text-orange-600 group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => { setFabMenuOpen(false); setActiveFolderForAdd(activeFolderId); openSearchModal(); }} className="flex items-center gap-3 bg-[#FCFAF8] hover:bg-[#F6F0E9] active:bg-[#EAE0D5] border border-orange-900/10 shadow-sm shadow-orange-900/5 text-stone-800 transition-all rounded-full h-12 pl-5 pr-[18px] group">
                <span className="text-[15px] font-semibold">Kitap Ekle</span>
                <BookOpen size={20} className="text-orange-600 group-hover:scale-110 transition-transform" />
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
