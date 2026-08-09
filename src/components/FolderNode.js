const FolderNode = React.memo(({ folder, allFolders, allBooks, onOpenFolder, onEdit, isLibraryView = false, index }) => {
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();

  const childBooks = allBooks.filter(b => b.folderId === folder.id);

  const { totalBooksCount, totalFoldersCount, totalPageCount } = React.useMemo(() => {
    const getDescendantFolderIds = (parentId) => {
      let ids = [];
      const children = allFolders.filter(f => f.parentId === parentId);
      for (const child of children) {
        ids.push(child.id);
        ids = ids.concat(getDescendantFolderIds(child.id));
      }
      return ids;
    };
    const descIds = getDescendantFolderIds(folder.id);
    const allFolderIds = [folder.id, ...descIds];
    
    const folderBooks = allBooks.filter(b => allFolderIds.includes(b.folderId));
    const tBooksCount = folderBooks.length;
    const tFoldersCount = descIds.length;
    const tPageCount = folderBooks.reduce((sum, b) => sum + (parseInt(b.pageCount) || 0), 0);
    return { totalBooksCount: tBooksCount, totalFoldersCount: tFoldersCount, totalPageCount: tPageCount };
  }, [allFolders, allBooks, folder.id]);

  const isTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;
  const isDropInside = isTarget && overTarget.placement === 'inside';
  const isDropBefore = isTarget && overTarget.placement === 'before';
  const isDropAfter = isTarget && overTarget.placement === 'after';

  const { cardRef, handlePointerDown, handleClick, isBeingDragged } = useDraggableItem(folder, folder.parentId || 'root', () => onOpenFolder(folder.id), 'folder');

  const hexToRgba = (hex, alpha) => {
    if (!hex) return '';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const customStyle = (!isDropInside && folder.color) ? {
    backgroundColor: hexToRgba(folder.color, 0.08),
    borderColor: hexToRgba(folder.color, 0.3)
  } : undefined;

  return (
    <div className="relative">
      {isDropBefore && <div className="absolute -top-1 left-4 right-4 h-0.5 bg-orange-600 rounded-full z-10" />}
      <div
        ref={cardRef}
        data-item-target={folder.id}
        data-item-type="folder"
        data-item-folder={folder.parentId || 'root'}
        className={`group flex items-center justify-between py-[5px] pl-[5px] pr-3 rounded-xl transition-all border shadow-sm cursor-pointer relative select-none
            ${isDropInside ? 'bg-orange-600/5 border-orange-600 border-dashed scale-[1.02]' : 'hover:shadow-md'}
            ${!isDropInside && !folder.color ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300' : ''}
            ${isBeingDragged ? 'opacity-0' : ''}`}
        style={customStyle}
        onPointerDown={isLibraryView ? undefined : handlePointerDown}
        onClick={handleClick}
      >

        <div className="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
          {index != null && (
            <span className="text-zinc-400 font-semibold text-sm w-5 text-right shrink-0">{index}.</span>
          )}
          <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white overflow-hidden relative" style={{ backgroundColor: folder.color || '#71717a' }}>
            {folder.customCover ? (
              <img src={folder.customCover} alt="Folder Cover" className="w-full h-full object-cover" />
            ) : childBooks.length > 0 ? (
              <div className={`w-full h-full grid gap-[1px] ${childBooks.length >= 3 ? 'grid-cols-2 grid-rows-2' : childBooks.length === 2 ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 grid-rows-1'}`}>
                {childBooks.slice(0, 4).map((b) => (
                  <div key={b.id} className="relative w-full h-full overflow-hidden bg-white flex items-center justify-center">
                    <img src={b.cover || 'default-cover.png'} alt="" className="w-full h-full object-fill" onError={(e) => { e.target.parentNode.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            ) : (
              <List size={24} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-zinc-800 text-[15px] truncate">{folder.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
              <span className="text-[clamp(9px,3vw,11px)] whitespace-nowrap truncate font-medium text-zinc-500 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-full">{totalBooksCount} Kitap</span>
              {totalPageCount > 0 && <span className="text-[clamp(9px,3vw,11px)] whitespace-nowrap truncate font-medium text-zinc-500 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-full">{totalPageCount.toLocaleString()} Sayfa</span>}
              {totalFoldersCount > 0 && <span className="text-[clamp(9px,3vw,11px)] whitespace-nowrap truncate font-medium text-zinc-500 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-full">{totalFoldersCount} Alt Liste</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 relative z-30">
          {!isLibraryView && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(folder.id); }} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors pointer-events-auto" title="Ayarlar"><MoreVertical size={16} /></button>
          )}
        </div>
      </div>
      {isDropAfter && <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-orange-600 rounded-full z-10" />}
    </div>
  );
});
