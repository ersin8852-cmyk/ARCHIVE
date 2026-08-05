const ListCreateModal = ({ isOpen, onClose, onCreate, parentId }) => {
  const [name, setName] = useState('Liste A');
  const [color, setColor] = useState('#71717a');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('Liste A');
      setColor('#71717a');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), parentId, color);
      onClose();
    }
  };

  const colors = ['#71717a', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[5vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center py-2.5 px-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Yeni Liste Oluştur</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Liste Adı</label>
            <input 
              ref={inputRef}
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 font-medium"
              
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Renk Seçimi</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors">
            Oluştur
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

const ListEditModal = ({ isOpen, onClose, folderId }) => {
  const { folders, updateFolder, deleteFolder, processImageFile, bulkUpdateBooksInFolder } = useData();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#71717a');
  const [customCover, setCustomCover] = useState(null);
  const [showDelConfirm, setShowDelConfirm] = useState(false);
  const [bulkAuthor, setBulkAuthor] = useState('');
  const [bulkPublisher, setBulkPublisher] = useState('');
  const [bulkConfirmField, setBulkConfirmField] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const folder = folders.find(f => f.id === folderId);

  useEffect(() => {
    if (isOpen && folder) {
      setName(folder.name || '');
      setColor(folder.color || '#71717a');
      setCustomCover(folder.customCover || null);
      setShowDelConfirm(false);
      setBulkConfirmField(null);
      setBulkAuthor('');
      setBulkPublisher('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.select();
      }, 100);
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      updateFolder(folder.id, name.trim(), color, customCover);
      onClose();
    }
  };

  const handleDelete = () => {
    deleteFolder(folder.id);
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setCustomCover(dataUrl);
    } catch (err) {
      alert(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const colors = ['#71717a', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[5vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center py-2.5 px-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Liste Ayarları</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        {bulkConfirmField ? (
          <div className="p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Toplu Güncelleme Onayı</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bu listedeki tüm kitapların {bulkConfirmField === 'author' ? 'yazar' : 'yayınevi'} bilgisini <br/>
              <span className="font-bold text-zinc-900 text-base">"{bulkConfirmField === 'author' ? bulkAuthor : bulkPublisher}"</span> <br/>
              olarak değiştirmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setBulkConfirmField(null)} className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors">İptal</button>
              <button onClick={() => {
                if (bulkConfirmField === 'author') bulkUpdateBooksInFolder(folder.id, { author: bulkAuthor });
                else bulkUpdateBooksInFolder(folder.id, { publisher: bulkPublisher });
                setBulkConfirmField(null);
                if (bulkConfirmField === 'author') setBulkAuthor('');
                else setBulkPublisher('');
              }} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors">Evet, Güncelle</button>
            </div>
          </div>
        ) : showDelConfirm ? (
          <div className="p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Listeyi Sil</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bu listeyi silmek istediğinize emin misiniz? <br/>İçindeki kitaplar silinmeyecek, ana dizine taşınacaktır.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDelConfirm(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors">İptal</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Evet, Sil</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Liste Adı</label>
              <input 
                ref={inputRef}
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 font-medium"
                
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Renk Seçimi</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Liste Kapağı (İsteğe Bağlı)</label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 flex items-center justify-center bg-zinc-50 overflow-hidden cursor-pointer hover:bg-zinc-100 transition-colors shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customCover ? (
                     <img src={customCover} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                     <Camera size={24} className="text-zinc-400" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 text-left">Görsel Yükle</button>
                  {customCover && (
                    <button type="button" onClick={() => setCustomCover(null)} className="text-xs font-medium text-red-500 hover:text-red-600 text-left">Görseli Kaldır</button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="mb-6 pt-4 border-t border-zinc-100">
              <label className="block text-base font-bold text-zinc-900 mb-4">Listenizde toplu değişiklik yapın:</label>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">Yazar</label>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      placeholder="Listedeki tüm kitaplara uygulanacak.." 
                      value={bulkAuthor}
                      onChange={e => setBulkAuthor(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm placeholder:text-zinc-300"
                    />
                    <button 
                      type="button"
                      disabled={!bulkAuthor.trim()}
                      onClick={() => setBulkConfirmField('author')}
                      className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg transition-colors ${bulkAuthor.trim() ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-zinc-100 text-zinc-300 disabled:cursor-not-allowed'}`}
                      title="Uygula"
                    >
                      <Check size={16} strokeWidth={bulkAuthor.trim() ? 3 : 2} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">Yayınevi</label>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      placeholder="Listedeki tüm kitaplara uygulanacak.." 
                      value={bulkPublisher}
                      onChange={e => setBulkPublisher(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm placeholder:text-zinc-300"
                    />
                    <button 
                      type="button"
                      disabled={!bulkPublisher.trim()}
                      onClick={() => setBulkConfirmField('publisher')}
                      className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg transition-colors ${bulkPublisher.trim() ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-zinc-100 text-zinc-300 disabled:cursor-not-allowed'}`}
                      title="Uygula"
                    >
                      <Check size={16} strokeWidth={bulkPublisher.trim() ? 3 : 2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDelConfirm(true)} className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center">
                <Trash2 size={20} />
              </button>
              <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors">
                Kaydet
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
