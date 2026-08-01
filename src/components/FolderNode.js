const FolderNode = React.memo(({ folder, allFolders, allBooks, onOpenFolder, onEdit, isLibraryView = false, index }) => {
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();

  const childBooks = allBooks.filter(b => b.folderId === folder.id);
  const childBooksCount = childBooks.length;
  const childFoldersCount = allFolders.filter(f => f.parentId === folder.id).length;

  const isTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;
  const isDropInside = isTarget && overTarget.placement === 'inside';
  const isDropBefore = isTarget && overTarget.placement === 'before';
  const isDropAfter = isTarget && overTarget.placement === 'after';

  const { cardRef, handlePointerDown, handleClick, isBeingDragged } = useDraggableItem(folder, folder.parentId || 'root', () => onOpenFolder(folder.id), 'folder');

  return (
    <div className="relative">
      {isDropBefore && <div className="absolute -top-1 left-4 right-4 h-0.5 bg-orange-600 rounded-full z-10" />}
      <div
        ref={cardRef}
        data-item-target={folder.id}
        data-item-type="folder"
        data-item-folder={folder.parentId || 'root'}
        className={`group flex items-center justify-between py-[5px] pl-[5px] pr-3 rounded-xl transition-all border shadow-sm cursor-pointer relative select-none
            ${isDropInside ? 'bg-orange-600/5 border-orange-600 border-dashed scale-[1.02]' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:shadow-md'}
            ${isBeingDragged ? 'opacity-0' : ''}`}
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
                    <img src={b.cover || 'default-cover.png'} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.parentNode.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            ) : (
              <List size={24} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-zinc-800 text-[15px] truncate">{folder.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{childBooksCount} Kitap</span>
              {childFoldersCount > 0 && <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{childFoldersCount} Alt Liste</span>}
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
