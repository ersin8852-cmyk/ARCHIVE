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
    if (!user) {
      setData(initialState);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const userDocRef = window.firebaseDb.collection('users').doc(user.uid);
    const booksRef = userDocRef.collection('books');
    const foldersRef = userDocRef.collection('folders');

    let unsubProfile = () => {};
    let unsubBooks = () => {};
    let unsubFolders = () => {};

    // 1. Profile and Migration Check
    unsubProfile = userDocRef.onSnapshot(async (doc) => {
      if (doc.exists) {
        const docData = doc.data();
        
        // --- MIGRATION LOGIC ---
        if (docData.books || docData.folders) {
          console.log("Migration started...");
          const batch = window.firebaseDb.batch();
          
          if (docData.books && Array.isArray(docData.books)) {
            docData.books.forEach(b => {
              const cleanBook = Object.entries(b).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v;
                return acc;
              }, {});
              batch.set(booksRef.doc(b.id || generateId()), cleanBook);
            });
          }
          
          if (docData.folders && Array.isArray(docData.folders)) {
            docData.folders.forEach(f => {
              const cleanFolder = Object.entries(f).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v;
                return acc;
              }, {});
              batch.set(foldersRef.doc(f.id || generateId()), cleanFolder);
            });
          }
          
          batch.update(userDocRef, {
            books: window.firebase.firestore.FieldValue.delete(),
            folders: window.firebase.firestore.FieldValue.delete()
          });
          
          try {
            await batch.commit();
            console.log("Migration completed!");
            showToast('Verileriniz yeni güvenli sisteme aktarıldı.', 'success');
          } catch (e) {
            console.error("Migration failed:", e);
          }
        }
        // --- MIGRATION LOGIC END ---

        setData(prev => ({ ...prev, profile: docData.profile || initialState.profile }));
      } else {
        setData(prev => ({ ...prev, profile: initialState.profile }));
      }
    });

    // 2. Books Listener
    unsubBooks = booksRef.onSnapshot(snapshot => {
      const books = [];
      snapshot.forEach(doc => {
        books.push({ id: doc.id, ...doc.data() });
      });
      setData(prev => ({ ...prev, books }));
    });

    // 3. Folders Listener
    unsubFolders = foldersRef.onSnapshot(snapshot => {
      const folders = [];
      snapshot.forEach(doc => {
        folders.push({ id: doc.id, ...doc.data() });
      });
      setData(prev => ({ ...prev, folders }));
      setLoadingData(false);
    });

    return () => {
      unsubProfile();
      unsubBooks();
      unsubFolders();
    };
  }, [user]);

  const updateProfileData = useCallback((profileUpdates) => {
    if (!user) return;
    window.firebaseDb.collection('users').doc(user.uid)
      .set({ profile: profileUpdates }, { merge: true })
      .catch(console.error);
  }, [user]);

  const addFolder = useCallback((name, parentId = null, color = '#71717a', customCover = null) => {
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    const siblings = data.folders.filter(f => f.parentId === parentId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
    const newFolderId = generateId();
    window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(newFolderId)
      .set({ name: trimmed, parentId, order, color, customCover }).catch(console.error);
  }, [data.folders, user]);

  const updateFolder = useCallback((id, name, color, customCover = null) => {
    if (!user || !name.trim()) return;
    window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(id)
      .update({ name: name.trim(), color, customCover }).catch(console.error);
  }, [user]);

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
    if (!user) return;
    const folderIdsToDelete = [id, ...getDescendantFolderIds(data.folders, id)];
    const batch = window.firebaseDb.batch();
    
    folderIdsToDelete.forEach(fid => {
      batch.delete(window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(fid));
    });
    
    data.books.filter(b => folderIdsToDelete.includes(b.folderId)).forEach(b => {
      batch.delete(window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(b.id));
    });
    
    batch.commit().catch(console.error);
  }, [data.folders, data.books, user]);

  const deleteAllData = useCallback(async () => {
    if (!user) return;
    showToast('Tüm verileriniz siliniyor...', 'info');
    const batch = window.firebaseDb.batch();
    
    data.books.forEach(b => {
      batch.delete(window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(b.id));
    });
    data.folders.forEach(f => {
      batch.delete(window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(f.id));
    });
    
    try {
      await batch.commit();
      showToast('Tüm verileriniz başarıyla silindi.');
    } catch (e) {
      console.error(e);
      showToast('Silme işlemi başarısız!', 'error');
    }
  }, [data.books, data.folders, user, showToast]);

  const reorderFolder = useCallback((id, direction) => {
    if (!user) return;
    const folder = data.folders.find(f => f.id === id);
    if (!folder) return;
    const siblings = data.folders.filter(f => f.parentId === folder.parentId).sort((a, b) => a.order - b.order);
    const index = siblings.findIndex(f => f.id === id);
    
    let targetSibling = null;
    if (direction === 'up' && index > 0) targetSibling = siblings[index - 1];
    else if (direction === 'down' && index < siblings.length - 1) targetSibling = siblings[index + 1];
    
    if (targetSibling) {
      const batch = window.firebaseDb.batch();
      const fRef = window.firebaseDb.collection('users').doc(user.uid).collection('folders');
      batch.update(fRef.doc(id), { order: targetSibling.order });
      batch.update(fRef.doc(targetSibling.id), { order: folder.order });
      batch.commit().catch(console.error);
    }
  }, [data.folders, user]);

  const addBook = useCallback((bookData, folderId = null) => {
    if (!bookData.title || !bookData.title.trim() || !user) {
      showToast('Kitap başlığı boş olamaz.', 'error');
      return false;
    }

    const isDuplicate = data.books.some(b => {
      if (bookData.isbn && b.isbn && b.isbn === bookData.isbn) return true;
      return normalize(b.title) === normalize(bookData.title) &&
             normalize(b.author) === normalize(bookData.author);
    });

    if (isDuplicate) {
      showToast('Bu kitap zaten arşivinizde mevcut!', 'error');
      return false;
    }

    const siblings = data.books.filter(b => b.folderId === folderId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
    const newBookId = generateId();
    
    const newBook = {
      ...bookData,
      folderId,
      order,
      inLibrary: false,
      isRead: false,
      priceFetchPending: !!bookData.isbn,
      priceFetchAttempts: 0
    };
    
    window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(newBookId)
      .set(newBook).then(() => showToast('Kitap başarıyla eklendi.')).catch(console.error);

    return true;
  }, [data.books, user, showToast]);

  const updateBook = useCallback((id, updates) => {
    if (!user) return;
    window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(id)
      .update(updates).catch(console.error);
  }, [user]);

  const bulkUpdateBooksInFolder = useCallback((folderId, updates) => {
    if (!user) return;
    const batch = window.firebaseDb.batch();
    const booksInFolder = data.books.filter(b => b.folderId === folderId);
    
    booksInFolder.forEach(b => {
      batch.update(window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(b.id), updates);
    });
    
    batch.commit().catch(console.error);
  }, [data.books, user]);

  const deleteBook = useCallback((id) => {
    if (!user) return;
    window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(id)
      .delete().catch(console.error);
  }, [user]);

  const moveItemToPosition = useCallback((itemId, itemType, targetFolderId, anchorId = null, placement = 'end') => {
    if (!user) return;
    const item = itemType === 'folder' 
      ? data.folders.find(f => f.id === itemId)
      : data.books.find(b => b.id === itemId);
      
    if (!item) return;

    const siblings = [
      ...data.folders
        .filter(f => f.parentId === targetFolderId && !(itemType === 'folder' && f.id === itemId))
        .map(f => ({ ...f, _type: 'folder' })),
      ...data.books
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

    const batch = window.firebaseDb.batch();
    
    siblings.forEach((s, i) => {
      if (s._type === 'folder') {
        batch.update(window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(s.id), { order: i, parentId: s.id === itemId ? targetFolderId : s.parentId });
      } else if (s._type === 'book') {
        batch.update(window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(s.id), { order: i, folderId: s.id === itemId ? targetFolderId : s.folderId });
      }
    });

    batch.commit().catch(console.error);
  }, [data.books, data.folders, user]);

  const importData = useCallback(async (importedData) => {
    if (!user || !importedData || !Array.isArray(importedData.books) || !Array.isArray(importedData.folders)) {
      showToast('Geçersiz yedekleme dosyası formatı!', 'error');
      return false;
    }
    
    showToast('Veriler içe aktarılıyor, lütfen bekleyin...', 'info');
    try {
      const batch = window.firebaseDb.batch();
      
      importedData.books.forEach(b => {
        const bookId = b.id || generateId();
        const cleanBook = { ...b };
        delete cleanBook.id;
        batch.set(window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(bookId), cleanBook);
      });
      
      importedData.folders.forEach(f => {
        const folderId = f.id || generateId();
        const cleanFolder = { ...f };
        delete cleanFolder.id;
        batch.set(window.firebaseDb.collection('users').doc(user.uid).collection('folders').doc(folderId), cleanFolder);
      });
      
      if (importedData.profile) {
        batch.set(window.firebaseDb.collection('users').doc(user.uid), { profile: importedData.profile }, { merge: true });
      }
      
      await batch.commit();
      showToast('Veriler başarıyla cihaza yüklendi!');
      return true;
    } catch (e) {
      console.error(e);
      showToast('İçe aktarma başarısız oldu.', 'error');
      return false;
    }
  }, [user, showToast]);

  // Arka plan fiyat sorgulama kuyruğu (Background Queue)
  useEffect(() => {
    if (loadingData || !data.books || !user) return;

    const pendingBook = data.books.find(b => b.priceFetchPending && (b.priceFetchAttempts || 0) < 3);

    if (pendingBook) {
      console.log(`[Kuyruk] Fiyat sorgusu bekleniyor: ${pendingBook.title} (Deneme: ${(pendingBook.priceFetchAttempts || 0) + 1}/3)`);
      
      const timer = setTimeout(() => {
        fetch(`/api/scrape-price?isbn=${pendingBook.isbn}`)
          .then(async (res) => {
            if (res.status === 429) throw new Error('ScraperAPI Kotası Doldu (429)');
            if (!res.ok) throw new Error('API Hatası');
            return res.json();
          })
          .then(result => {
            if (result && result.cheapest) {
              if (pendingBook.isManual) {
                showToast(`"${pendingBook.title}" başarıyla güncellendi.`, 'success');
              }
              const updates = { price: result.cheapest.price, priceFetchPending: false };
              
              if (pendingBook.isManual) {
                if (!pendingBook.cover || pendingBook.cover === 'default-cover.png') {
                  const foundCover = result.cheapest.cover || (result.all_results && result.all_results.find(r => r.cover)?.cover);
                  if (foundCover && foundCover !== pendingBook.cover) updates.cover = foundCover;
                }
                
                if (result.all_results) {
                  const bestMeta = result.all_results.map(r => r.metadata).reduce((acc, curr) => {
                    if (curr && curr.title && (!acc.title || acc.title.length < curr.title.length)) {
                      acc.title = curr.title;
                    }
                    return acc;
                  }, {});
                  
                  if (bestMeta.title) updates.title = bestMeta.title;
                }
              }
              
              window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(pendingBook.id).update(updates).catch(console.error);
              
            } else if (result && result.notFound) {
              if (pendingBook.isManual) {
                showToast(`"${pendingBook.title}" mağazalarda bulunamadı (Stok yok).`, 'warning');
              }
              console.log(`[Kuyruk] Kitap hiçbir sitede bulunamadı (${pendingBook.title}).`);
              window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(pendingBook.id).update({ priceFetchPending: false, priceFetchAttempts: 3 }).catch(console.error);
            } else {
              throw new Error('Fiyat verisi boş');
            }
          })
          .catch(err => {
            console.log(`[Kuyruk] Fiyat bulunamadı (${pendingBook.title}):`, err.message);
            const newAttempts = (pendingBook.priceFetchAttempts || 0) + 1;
            window.firebaseDb.collection('users').doc(user.uid).collection('books').doc(pendingBook.id).update({ priceFetchAttempts: newAttempts, priceFetchPending: newAttempts < 3 }).catch(console.error);
          });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [data.books, loadingData, user, showToast]);

  const contextValue = useMemo(() => ({
    loadingData,
    books: data.books,
    folders: data.folders,
    profile: data.profile || initialState.profile,
    addFolder, updateFolder, deleteFolder, reorderFolder, deleteAllData,
    addBook, updateBook, deleteBook, moveItemToPosition, bulkUpdateBooksInFolder,
    importData, updateProfileData, processImageFile
  }), [data, loadingData, addFolder, updateFolder, deleteFolder, reorderFolder, deleteAllData, addBook, updateBook, deleteBook, moveItemToPosition, bulkUpdateBooksInFolder, importData, updateProfileData]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};\n\n// Kombine Provider (Geriye Dönük Uyumluluk ve Root Sarımı İçin)
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
