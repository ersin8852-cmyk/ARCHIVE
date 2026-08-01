const fs = require('fs');
const path = require('path');

// 1. Rename files
function renameToJsx(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            renameToJsx(fullPath);
        } else if (fullPath.endsWith('.js') && file !== 'refactor.cjs' && file !== 'clean-context.cjs' && file !== 'fix-icons.cjs') {
            const newPath = fullPath.replace(/\.js$/, '.jsx');
            fs.renameSync(fullPath, newPath);
        }
    }
}

if (fs.existsSync(path.join(__dirname, 'src'))) {
    renameToJsx(path.join(__dirname, 'src'));
}

// Ensure lucide-react is installed, if not we just use a static list
const lucideIcons = [
    'AlertCircle', 'Book', 'Check', 'ChevronLeft', 'ChevronRight', 
    'CornerDownRight', 'Edit2', 'FileText', 'Folder', 'GripVertical', 
    'Library', 'List', 'LogOut', 'MoreVertical', 'Plus', 'Search', 
    'Settings', 'Trash2', 'User', 'X', 'WifiOff', 'ArrowLeft', 
    'Download', 'Upload', 'Menu', 'Camera', 'Image', 'Info',
    'BarChart3', 'Star', 'Grid'
];

function getJsxTags(content) {
    const tags = new Set();
    const regex = /<([A-Z][a-zA-Z0-9]*)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        tags.add(match[1]);
    }
    return Array.from(tags);
}

// 2. Refactor files
function refactorDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            refactorDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            const baseName = path.basename(file, '.jsx');
            
            // Skip if already processed (contains import React)
            if (content.includes('import React')) continue;

            const tags = getJsxTags(content);
            const usedIcons = tags.filter(tag => lucideIcons.includes(tag) && tag !== 'List'); 

            let imports = `import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback, useLayoutEffect } from 'react';\n`;
            if (usedIcons.length > 0) {
                imports += `import { ${usedIcons.join(', ')} } from 'lucide-react';\n`;
            }

            if (baseName === 'context') {
                content = content.replace(/const FallbackIcon[\s\S]*?const pickIcon[^\n]*\n[^\n]*\n[^\n]*;/g, '');
                content = content.replace(/const\s+[A-Z][a-zA-Z0-9]*\s*=\s*pickIcon\(['"].*?['"]\);/g, '');
                content = content.replace(/const { useState.*? = React;/g, '');
                content = content.replace(/const { createRoot } = ReactDOM;/g, '');
                content += '\nexport { ToastContext, useToast, ToastProvider, AuthContext, useAuth, AuthProvider, DataContext, useData, DataProvider, ArchiveProvider };\n';
            } else if (baseName === 'dndContext') {
                imports += `import { useData } from './context.jsx';\n`;
                content += '\nexport { useDragApi, useDraggedItem, useOverTarget, useDraggableItem, DragDropProvider };\n';
            } else if (baseName === 'main') {
                imports += `import { createRoot } from 'react-dom/client';\n`;
                imports += `import { ArchiveProvider, useAuth, useData } from './context/context.jsx';\n`;
                imports += `import { DragDropProvider } from './context/dndContext.jsx';\n`;
                imports += `import AuthModal from './modals/AuthModal.jsx';\n`;
                imports += `import ProfileModal from './modals/ProfileModal.jsx';\n`;
                imports += `import ListsView from './views/ListsView.jsx';\n`;
                imports += `import LibraryView from './views/LibraryView.jsx';\n`;
                imports += `import StatsView from './views/StatsView.jsx';\n`;
                imports += `import { AlertCircle, List, Library, BarChart3 } from 'lucide-react';\n`;
            } else if (baseName === 'firebase') {
                imports = `import firebase from 'firebase/app';\nimport 'firebase/auth';\nimport 'firebase/firestore';\n`;
                content = content.replace(/const firebaseConfig = {[\s\S]*?};/, `const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmlUeEg0Ln1eYtWZOeyKBGY5BHyiah8hQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "archive-984e6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "archive-984e6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "archive-984e6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "508847264735",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:508847264735:web:108a98e09d4d430412ea6a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NC766EDJGX"
};`);
                content = content.replace(/const app =.*?;\n/g, '');
                content = content.replace(/export const auth.*?\n/g, '');
                content = content.replace(/export const db.*?\n/g, '');
                content += `\nconst app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();\nexport const auth = app.auth();\nexport const db = app.firestore();\ndb.enablePersistence({ synchronizeTabs: true }).catch(err => { console.warn(err); });\n`;
            } else if (baseName === 'api') {
                imports = ``;
                // already mostly okay but we just overwrite to ensure safety
                content = `export const api = {
  fetchByIsbn: async (isbn) => {
    const res = await fetch(\`https://openlibrary.org/api/books?bibkeys=ISBN:\${isbn}&format=json&jscmd=data\`);
    if (!res.ok) throw new Error('API Hatası');
    const json = await res.json();
    const data = json[\`ISBN:\${isbn}\`];
    if (!data) return [];
    return [{
      isbn, title: data.title || 'Bilinmeyen Kitap',
      author: (data.authors || []).map(a => a.name).join(', ') || 'Bilinmeyen Yazar',
      publisher: (data.publishers || []).map(p => p.name).join(', ') || 'Yayınevi Belirtilmemiş',
      pageCount: data.number_of_pages || 0,
      year: (data.publish_date && data.publish_date.match(/\\d{4}/)?.[0]) || '',
      price: '', cover: data.cover ? (data.cover.medium || data.cover.large || data.cover.small || '') : ''
    }];
  },
  fetchByTitle: async (q) => {
    let searchQ = q || '';
    const res = await fetch(\`https://openlibrary.org/search.json?q=\${encodeURIComponent(searchQ)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,cover_edition_key,edition_key,isbn,publisher\`);
    if (!res.ok) throw new Error('API Hatası');
    const json = await res.json();
    const docs = json.docs || [];
    return await Promise.all(docs.map(async (doc) => {
      const cover = doc.cover_i ? \`https://covers.openlibrary.org/b/id/\${doc.cover_i}-M.jpg\` : '';
      const isbnCandidate = doc.isbn && doc.isbn[0];
      if (isbnCandidate) {
        try {
          const enriched = await api.fetchByIsbn(isbnCandidate);
          if (enriched.length && (enriched[0].publisher !== 'Yayınevi Belirtilmemiş' || enriched[0].pageCount)) {
            return { ...enriched[0], title: enriched[0].title || doc.title, author: enriched[0].author || doc.author_name?.join(', '), cover: enriched[0].cover || cover, year: enriched[0].year || doc.first_publish_year };
          }
        } catch (e) { console.error(e); }
      }
      return { isbn: '', title: doc.title, author: doc.author_name?.join(', '), publisher: (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: 0, year: doc.first_publish_year || '', price: '', cover };
    }));
  }
};\n`;
            } else if (baseName === 'hooks') {
                imports = `import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback, useLayoutEffect } from 'react';\n`;
                content = content.replace(/window\.useHistoryModal\s*=\s*/, 'export const useHistoryModal = ');
                content = content.replace(/window\.useFolderUtils\s*=\s*/, 'export const useFolderUtils = ');
            } else {
                imports += `import { useData, useToast, useAuth } from '../context/context.jsx';\n`;
                imports += `import { useDragApi, useDraggedItem, useOverTarget, useDraggableItem } from '../context/dndContext.jsx';\n`;
                imports += `import { auth, db } from '../services/firebase.jsx';\n`;
                imports += `import { api } from '../services/api.jsx';\n`;
                imports += `import { useHistoryModal, useFolderUtils } from '../utils/hooks.jsx';\n`;
                
                // Add components imports
                if (content.includes('<BookCard')) imports += `import BookCard from '../components/BookCard.jsx';\n`;
                if (content.includes('<ItemList')) imports += `import ItemList from '../components/ItemList.jsx';\n`;
                if (content.includes('<FolderNode')) imports += `import FolderNode from '../components/FolderNode.jsx';\n`;
                if (content.includes('<AuthModal')) imports += `import AuthModal from '../modals/AuthModal.jsx';\n`;
                if (content.includes('<ProfileModal')) imports += `import ProfileModal from '../modals/ProfileModal.jsx';\n`;
                if (content.includes('<SearchModal')) imports += `import SearchModal from '../modals/SearchModal.jsx';\n`;
                if (content.includes('<ManualAddModal')) imports += `import ManualAddModal from '../modals/ManualAddModal.jsx';\n`;
                if (content.includes('<BookDetailModal')) imports += `import BookDetailModal from '../modals/BookDetail.jsx';\n`;
                if (content.includes('<ListEditModal')) imports += `import { ListEditModal } from '../modals/FolderModals.jsx';\n`;
                if (content.includes('<ListCreateModal')) imports += `import { ListCreateModal } from '../modals/FolderModals.jsx';\n`;
                
                let exportName = baseName;
                if (baseName === 'BookDetail') exportName = 'BookDetailModal';
                if (baseName === 'FolderModals') exportName = '{ ListCreateModal, ListEditModal }';
                if (baseName === 'FolderNode') exportName = 'FolderNode';

                if (baseName !== 'FolderModals') {
                    content += `\nexport default ${exportName};\n`;
                } else {
                    content += `\nexport ${exportName};\n`;
                }
            }
            
            // Clean global window calls
            content = content.replace(/window\.firebaseApp/g, 'auth.app');
            content = content.replace(/window\.firebaseAuth/g, 'auth');
            content = content.replace(/window\.firebaseDb/g, 'db');
            content = content.replace(/window\.firebase/g, 'auth'); 
            content = content.replace(/window\.api/g, 'api');
            content = content.replace(/window\.useHistoryModal/g, 'useHistoryModal');
            content = content.replace(/window\.useFolderUtils/g, 'useFolderUtils');
            content = content.replace(/window\.AuthModal\s*=\s*AuthModal;/g, '');
            content = content.replace(/window\.ProfileModal\s*=\s*ProfileModal;/g, '');

            fs.writeFileSync(fullPath, imports + content, 'utf8');
        }
    }
}

if (fs.existsSync(path.join(__dirname, 'src'))) {
    refactorDir(path.join(__dirname, 'src'));
}
console.log('Refactoring complete');
