const LibraryView = ({ activeFolderId, setActiveFolderId, onOpenProfile }) => {
  const { folders, books, profile } = useData();
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

  const filteredFolders = React.useMemo(() => searchTerm
    ? visibleFolders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [], [visibleFolders, searchTerm]);



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
        <Header onOpenProfile={onOpenProfile} />
        
        <ViewTitleBar
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFolderId={activeFolderId}
          setActiveFolderId={setActiveFolderId}
          breadcrumbs={breadcrumbs}
          rootTitle="Kütüphanem"
          searchPlaceholder="Kütüphanede ara..."
        />

     <div className="flex-1 overflow-y-auto pt-[12.8px] pr-4 pb-64 pl-[10px]" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
           searchTerm.trim() === '' ? (
            <EmptyState icon={Search} title="Aramak istediğiniz kitabın veya listenin adını yazın." />
          ) : (filteredBooks.length > 0 || filteredFolders.length > 0) ? (
            <div className="space-y-[3.6px]">
              {filteredFolders.map(folder => <FolderNode key={folder.id} folder={folder} allFolders={visibleFolders} allBooks={libraryBooks} onOpenFolder={setActiveFolderId} onEdit={handleEditFolder} isLibraryView={true} />)}
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} isLibraryView={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Kütüphanenizde bu isimde kitap veya liste yok." />
          )
        ) : libraryBooks.length === 0 ? (
          <EmptyState 
            icon={Library} 
            title="Kütüphanenizde kitap yok." 
            subtitle='Listelerinizdeki kitapları "Kütüphanemde" olarak işaretleyin.'
          />
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
      <BookDetailModal key={activeBookId ? `detail-${activeBookId}` : 'detail-empty'} isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />
    </div>
  );
};
