const { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback } = React;
const { createRoot } = ReactDOM;

const FallbackIcon = ({ size = 24, ...props }) => (
  <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);
function pickIcon(name) {
  const icon = window.LucideReact && window.LucideReact[name];
  if (!icon) console.warn(`Lucide ikonu bulunamadı, yedek gösteriliyor: ${name}`);
  return icon || FallbackIcon;
}
const Library = pickIcon('Library');
const List = pickIcon('List');
const BarChart3 = pickIcon('BarChart3');
const Plus = pickIcon('Plus');
const Search = pickIcon('Search');
const ChevronDown = pickIcon('ChevronDown');
const ChevronRight = pickIcon('ChevronRight');
const ArrowUp = pickIcon('ArrowUp');
const ArrowDown = pickIcon('ArrowDown');
const BookOpen = pickIcon('BookOpen');
const Edit2 = pickIcon('Edit2');
const Check = pickIcon('Check');
const X = pickIcon('X');
const FolderPlus = pickIcon('FolderPlus');
const FileText = pickIcon('FileText');
const MoveRight = pickIcon('MoveRight');
const Camera = pickIcon('Camera');
const Info = pickIcon('Info');
const GripVertical = pickIcon('GripVertical');
const Trash2 = pickIcon('Trash2');
const AlertCircle = pickIcon('AlertCircle');
const WifiOff = pickIcon('WifiOff');
const Folder = pickIcon('Folder');
const Download = pickIcon('Download');
const Upload = pickIcon('Upload');
const CornerDownRight = pickIcon('CornerDownRight');
const Settings = pickIcon('Settings');
const RefreshCw = pickIcon('RefreshCw');
const MoreVertical = pickIcon('MoreVertical');
const LogOut = pickIcon('LogOut');
const User = pickIcon('User');
const Mail = pickIcon('Mail');
const Lock = pickIcon('Lock');
const LogIn = pickIcon('LogIn');
const UserPlus = pickIcon('UserPlus');
const Calendar = pickIcon('Calendar');
const CheckSquare = pickIcon('CheckSquare');
const Square = pickIcon('Square');
const ArrowLeft = pickIcon('ArrowLeft');
const Sparkles = pickIcon('Sparkles');



const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalize = (str = '') =>
  str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '');

const initialState = {
  books: [],
  folders: [],
  profile: {
    fullName: '',
    username: '',
    gender: '',
    dob: ''
  }
};

const processImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir resim dosyası seçin.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Resim yüklenemedi.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
};


// 1. Toast Context
const ToastContext = createContext();
const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = useCallback((msg, type = 'info', stackable = false) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      if (!stackable) {
        return [{ id, msg, type }];
      }
      const newToasts = [...prev, { id, msg, type }];
      return newToasts.length > 2 ? newToasts.slice(newToasts.length - 2) : newToasts;
    });
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && window.ReactDOM.createPortal(
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end z-[9999] pointer-events-none" style={{ width: '300px', height: '60px' }}>
          <style>{`
            @keyframes toast-slide-up {
              0% { transform: translateY(30px) scale(0.9); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .toast-enter {
              animation: toast-slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
          `}</style>
          <div className="relative w-full h-full flex justify-center">
            {toasts.map((toast, index) => {
              const distance = toasts.length - 1 - index;
              if (distance > 1) return null;
              return (
                <div 
                  key={toast.id} 
                  className="absolute bottom-0 transition-all duration-400 ease-out w-full flex justify-center"
                  style={{
                    transform: `translateY(-${distance * 60}px)`,
                    opacity: 1 - (distance * 0.25),
                    zIndex: 100 - distance
                  }}
                >
                  <div className={`px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center justify-center text-center gap-2 max-w-[90vw] w-max whitespace-nowrap toast-enter ${
                    toast.type === 'error' ? 'bg-red-600 text-white' : 
                    toast.type === 'warning' ? 'bg-amber-400 text-amber-950' : 
                    'bg-zinc-800 text-white'
                  }`}>
                    {toast.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
                    {toast.type === 'warning' && <AlertCircle size={16} className="shrink-0" />}
                    {toast.type === 'info' && <Check size={16} className="shrink-0" />}
                    <span className="leading-tight truncate">{toast.msg}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// 2. Auth Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = window.firebaseAuth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Data Context
const DataContext = createContext();
const useData = () => useContext(DataContext);

const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [data, setData] = useState(initialState);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      const docRef = window.firebaseDb.collection('users').doc(user.uid);
      const unsubscribeDb = docRef.onSnapshot(doc => {
        if (doc.exists) {
          setData({ ...initialState, ...doc.data() });
        } else {
          // KRİTİK HATA DÜZELTİLDİ: Artık boş veriyi zorla Firestore'a yazmıyoruz. Sadece lokal state'i temizliyoruz.
          setData(initialState);
        }
        setLoadingData(false);
      }, (err) => {
        console.error("Firestore onSnapshot error:", err);
        setLoadingData(false);
      });
      return () => unsubscribeDb();
    } else {
      setData(initialState);
      setLoadingData(false);
    }
  }, [user]);

  const pendingSaveRef = useRef(null);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      if (newData !== prev) {
        pendingSaveRef.current = newData;
      }
      return newData;
    });
    // Firestore'a kaydetme işlemi setState dışında yapılıyor (React best practice)
    if (user && pendingSaveRef.current !== null) {
      const dataToSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      window.firebaseDb.collection('users').doc(user.uid)
        .set(dataToSave, { merge: true })
        .catch(err => {
          console.error(err);
          showToast('Veri buluta kaydedilemedi!', 'error');
        });
    }
  }, [user, showToast]);

  const addFolder = useCallback((name, parentId = null, color = '#71717a', customCover = null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData(prev => {
      const siblings = prev.folders.filter(f => f.parentId === parentId);
      const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
      const newFolder = { id: generateId(), name: trimmed, parentId, order, color, customCover };
      return { ...prev, folders: [...prev.folders, newFolder] };
    });
  }, [updateData]);

  const updateFolder = useCallback((id, name, color, customCover = null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === id ? { ...f, name: trimmed, color, customCover } : f)
    }));
  }, [updateData]);

  const getDescendantFolderIds = (folders, parentId) => {
    let ids = [];
    const children = folders.filter(f => f.parentId === parentId);
    for (const child of children) {
      ids.push(child.id);
      ids = ids.concat(getDescendantFolderIds(folders, child.id));
    }
    return ids;
  };

  const deleteFolder = useCallback((id) => {
    updateData(prev => {
      const folderIdsToDelete = [id, ...getDescendantFolderIds(prev.folders, id)];
      const updatedBooks = prev.books.filter(b => !folderIdsToDelete.includes(b.folderId));
      const updatedFolders = prev.folders.filter(f => !folderIdsToDelete.includes(f.id));
      return { ...prev, books: updatedBooks, folders: updatedFolders };
    });
  }, [updateData]);

  const deleteAllData = useCallback(() => {
    updateData(prev => ({ ...prev, books: [], folders: [] }));
    showToast('Tüm verileriniz başarıyla silindi.');
  }, [updateData, showToast]);

  const reorderFolder = useCallback((id, direction) => {
    updateData(prev => {
      const folder = prev.folders.find(f => f.id === id);
      if (!folder) return prev;
      const siblings = prev.folders.filter(f => f.parentId === folder.parentId).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex(f => f.id === id);
      if (direction === 'up' && index > 0) {
        const prevSibling = siblings[index - 1];
        const newFolders = prev.folders.map(f => {
          if (f.id === id) return { ...f, order: prevSibling.order };
          if (f.id === prevSibling.id) return { ...f, order: folder.order };
          return f;
        });
        return { ...prev, folders: newFolders };
      }
      if (direction === 'down' && index < siblings.length - 1) {
        const nextSibling = siblings[index + 1];
        const newFolders = prev.folders.map(f => {
          if (f.id === id) return { ...f, order: nextSibling.order };
          if (f.id === nextSibling.id) return { ...f, order: folder.order };
          return f;
        });
        return { ...prev, folders: newFolders };
      }
      return prev;
    });
  }, [updateData]);

  const addBook = useCallback((bookData, folderId = null) => {
    if (!bookData.title || !bookData.title.trim()) {
      showToast('Kitap başlığı boş olamaz.', 'error');
      return false;
    }

    let wasDuplicate = false;
    let newBookId = generateId();

    updateData(prev => {
      // Duplicate kontrolü en güncel veri üzerinden yapılıyor
      const isDuplicate = prev.books.some(b => {
        if (bookData.isbn && b.isbn && b.isbn === bookData.isbn) return true;
        return normalize(b.title) === normalize(bookData.title) &&
               normalize(b.author) === normalize(bookData.author);
      });

      if (isDuplicate) {
        wasDuplicate = true;
        return prev;
      }

      const siblings = prev.books.filter(b => b.folderId === folderId);
      const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
      const newBook = {
        ...bookData,
        id: newBookId,
        folderId,
        order,
        inLibrary: false,
        isRead: false,
        priceFetchPending: !!bookData.isbn,
        priceFetchAttempts: 0
      };
      return { ...prev, books: [...prev.books, newBook] };
    });

    if (wasDuplicate) {
      showToast('Bu kitap zaten arşivinizde mevcut!', 'error');
      return false;
    }

    showToast('Kitap başarıyla eklendi.');



    return true;
  }, [updateData, showToast]);

  const updateBook = useCallback((id, updates) => {
    updateData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  }, [updateData]);

  const deleteBook = useCallback((id) => {
    updateData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== id) }));
  }, [updateData]);

  const moveItemToPosition = useCallback((itemId, itemType, targetFolderId, anchorId = null, placement = 'end') => {
    updateData(prev => {
      const item = itemType === 'folder' 
        ? prev.folders.find(f => f.id === itemId)
        : prev.books.find(b => b.id === itemId);
        
      if (!item) return prev;

      const siblings = [
        ...prev.folders
          .filter(f => f.parentId === targetFolderId && !(itemType === 'folder' && f.id === itemId))
          .map(f => ({ ...f, _type: 'folder' })),
        ...prev.books
          .filter(b => b.folderId === targetFolderId && !(itemType === 'book' && b.id === itemId))
          .map(b => ({ ...b, _type: 'book' }))
      ].sort((a, b) => a.order - b.order);

      let insertIndex = siblings.length;
      if (anchorId) {
        const idx = siblings.findIndex(s => s.id === anchorId);
        if (idx !== -1) insertIndex = placement === 'after' ? idx + 1 : idx;
      }

      const updatedItem = itemType === 'folder' 
        ? { ...item, parentId: targetFolderId, _type: 'folder' }
        : { ...item, folderId: targetFolderId, _type: 'book' };

      siblings.splice(insertIndex, 0, updatedItem);

      const reorderedFolders = new Map();
      const reorderedBooks = new Map();
      
      siblings.forEach((s, i) => {
        if (s._type === 'folder') reorderedFolders.set(s.id, { ...s, order: i });
        if (s._type === 'book') reorderedBooks.set(s.id, { ...s, order: i });
      });

      return {
        ...prev,
        folders: prev.folders.map(f => {
          if (reorderedFolders.has(f.id)) {
            const newF = { ...reorderedFolders.get(f.id) };
            delete newF._type;
            return newF;
          }
          return f;
        }),
        books: prev.books.map(b => {
          if (reorderedBooks.has(b.id)) {
            const newB = { ...reorderedBooks.get(b.id) };
            delete newB._type;
            return newB;
          }
          return b;
        })
      };
    });
  }, [updateData]);

  const importData = useCallback((importedData) => {
    if (!importedData || !Array.isArray(importedData.books) || !Array.isArray(importedData.folders)) {
      showToast('Geçersiz yedekleme dosyası formatı!', 'error');
      return false;
    }
    updateData(importedData);
    showToast('Veriler başarıyla cihaza yüklendi!');
    return true;
  }, [updateData, showToast]);

  const updateProfileData = useCallback((profileUpdates) => {
    updateData(prev => ({
      ...prev,
      profile: { ...(prev.profile || initialState.profile), ...profileUpdates }
    }));
  }, [updateData]);



  // Arka plan fiyat sorgulama kuyruğu (Background Queue)
  useEffect(() => {
    if (loadingData || !data.books) return;

    // Beklemede olan ve deneme sayısı 3'ü geçmeyen ilk kitabı bul
    const pendingBook = data.books.find(b => b.priceFetchPending && (b.priceFetchAttempts || 0) < 3);

    if (pendingBook) {
      console.log(`[Kuyruk] Fiyat sorgusu bekleniyor: ${pendingBook.title} (Deneme: ${(pendingBook.priceFetchAttempts || 0) + 1}/3)`);
      
      const timer = setTimeout(() => {
        fetch(`/api/scrape-price?isbn=${pendingBook.isbn}`)
          .then(async (res) => {
            if (!res.ok) throw new Error('API Hatası');
            return res.json();
          })
          .then(result => {
            if (result && result.cheapest) {
              updateData(prev => ({
                ...prev,
                books: prev.books.map(b => 
                  b.id === pendingBook.id 
                    ? { ...b, price: result.cheapest.price, priceFetchPending: false } 
                    : b
                )
              }));
            } else {
              throw new Error('Fiyat verisi boş');
            }
          })
          .catch(err => {
            console.log(`[Kuyruk] Fiyat bulunamadı (${pendingBook.title}):`, err.message);
            const newAttempts = (pendingBook.priceFetchAttempts || 0) + 1;
            updateData(prev => ({
              ...prev,
              books: prev.books.map(b => 
                b.id === pendingBook.id 
                  ? { ...b, priceFetchAttempts: newAttempts, priceFetchPending: newAttempts < 3 } 
                  : b
              )
            }));
          });
      }, 5000); // ScraperAPI kotasını korumak için 5 saniye bekle

      return () => clearTimeout(timer);
    }
  }, [data.books, loadingData, updateData]);

  const contextValue = useMemo(() => ({
    loadingData,
    books: data.books,
    folders: data.folders,
    profile: data.profile || initialState.profile,
    addFolder, updateFolder, deleteFolder, reorderFolder, deleteAllData,
    addBook, updateBook, deleteBook, moveItemToPosition,
    importData, updateProfileData, processImageFile
  }), [data, loadingData, addFolder, updateFolder, deleteFolder, reorderFolder, deleteAllData, addBook, updateBook, deleteBook, moveItemToPosition, importData, updateProfileData]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Kombine Provider (Geriye Dönük Uyumluluk ve Root Sarımı İçin)
const ArchiveProvider = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
