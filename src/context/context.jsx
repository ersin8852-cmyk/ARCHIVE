import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import * as LucideIcons from 'lucide-react';




const FallbackIcon = ({ size = 24, ...props }) => (
  <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);
function pickIcon(name) {
  const icon = window.LucideReact && window.LucideReact[name];
  if (!icon) console.warn(`Lucide ikonu bulunamadÃ„Â±, yedek gÃƒÂ¶steriliyor: ${name}`);
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
const GripVertical = pickIcon('GripVertical');
const Trash2 = pickIcon('Trash2');
const AlertCircle = pickIcon('AlertCircle');
const WifiOff = pickIcon('WifiOff');
const Folder = pickIcon('Folder');
const Download = pickIcon('Download');
const Upload = pickIcon('Upload');
const CornerDownRight = pickIcon('CornerDownRight');
const Settings = pickIcon('Settings');
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

const STORAGE_KEY = 'archive_app_data_v3';

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
      reject(new Error('LÃƒÂ¼tfen geÃƒÂ§erli bir resim dosyasÃ„Â± seÃƒÂ§in.'));
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
      img.onerror = () => reject(new Error('Resim yÃƒÂ¼klenemedi.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadÃ„Â±.'));
    reader.readAsDataURL(file);
  });
};


// 1. Toast Context
const ToastContext = createContext();
const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  
  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && window.ReactDOM.createPortal(
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl z-[9999] text-sm font-medium flex items-center justify-center text-center gap-2 max-w-[90vw] w-max break-words ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-amber-400 text-amber-950' : 'bg-orange-600 text-white'}`}>
          {toast.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
          {toast.type === 'warning' && <AlertCircle size={16} className="shrink-0" />}
          <span className="leading-tight">{toast.msg}</span>
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
          // KRÃ„Â°TÃ„Â°K HATA DÃƒÅ“ZELTÃ„Â°LDÃ„Â°: ArtÃ„Â±k boÃ…Å¸ veriyi zorla Firestore'a yazmÃ„Â±yoruz. Sadece lokal state'i temizliyoruz.
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

  const updateData = useCallback((updater) => {
    setData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      if (user) {
        window.firebaseDb.collection('users').doc(user.uid).set(newData).catch(err => {
          console.error(err);
          showToast('Veri buluta kaydedilemedi!', 'error');
        });
      }
      return newData;
    });
  }, [user, showToast]);

  const addFolder = useCallback((name, parentId = null, color = '#71717a') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData(prev => {
      const siblings = prev.folders.filter(f => f.parentId === parentId);
      const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
      const newFolder = { id: generateId(), name: trimmed, parentId, order, color };
      return { ...prev, folders: [...prev.folders, newFolder] };
    });
  }, [updateData]);

  const updateFolder = useCallback((id, name, color) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === id ? { ...f, name: trimmed, color } : f)
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
    showToast('TÃƒÂ¼m verileriniz baÃ…Å¸arÃ„Â±yla silindi.');
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
      showToast('Kitap baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â± boÃ…Å¸ olamaz.', 'error');
      return false;
    }
    let isDuplicate = false;
    let newBookId = generateId();
    let newBook = null;
    
    updateData(prev => {
      isDuplicate = prev.books.some(b => {
        if (bookData.isbn && b.isbn && b.isbn === bookData.isbn) return true;
        return normalize(b.title) === normalize(bookData.title) &&
               normalize(b.author) === normalize(bookData.author);
      });
      if (isDuplicate) return prev;
      
      const siblings = prev.books.filter(b => b.folderId === folderId);
      const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
      newBook = {
        ...bookData,
        id: newBookId,
        folderId,
        order,
        inLibrary: false,
        isRead: false,
      };
      return { ...prev, books: [...prev.books, newBook] };
    });

    if (isDuplicate) {
      showToast('Bu kitap zaten arÃ…Å¸ivinizde mevcut!', 'error');
      return false;
    }

    showToast('Kitap baÃ…Å¸arÃ„Â±yla eklendi.');

    if (newBook && newBook.isbn) {
      fetch(`/api/scrape-price?isbn=${newBook.isbn}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('API HatasÃ„Â±');
          return res.json();
        })
        .then(result => {
          if (result && result.cheapest) {
            updateData(prev => ({
              ...prev,
              books: prev.books.map(b => b.id === newBook.id ? { ...b, price: result.cheapest.price } : b)
            }));
          }
        })
        .catch(err => {
          console.log('Arka plan fiyat taramasÃ„Â± baÃ…Å¸arÃ„Â±sÃ„Â±z:', err.message);
        });
    }

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
      showToast('GeÃƒÂ§ersiz yedekleme dosyasÃ„Â± formatÃ„Â±!', 'error');
      return false;
    }
    updateData(importedData);
    showToast('Veriler baÃ…Å¸arÃ„Â±yla cihaza yÃƒÂ¼klendi!');
    return true;
  }, [updateData, showToast]);

  const updateProfileData = useCallback((profileUpdates) => {
    updateData(prev => ({
      ...prev,
      profile: { ...(prev.profile || initialState.profile), ...profileUpdates }
    }));
  }, [updateData]);

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

// Kombine Provider (Geriye DÃƒÂ¶nÃƒÂ¼k Uyumluluk ve Root SarÃ„Â±mÃ„Â± Ã„Â°ÃƒÂ§in)
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


export { ToastProvider, useToast, AuthProvider, useAuth, DataProvider, useData, ArchiveProvider };



