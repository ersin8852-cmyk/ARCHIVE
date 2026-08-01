const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            if (file === 'firebase.jsx' || file === 'api.jsx' || file === 'hooks.jsx') continue;

            const baseName = path.basename(file, '.jsx');

            // Find all missing imports
            let imports = `import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback, useLayoutEffect } from 'react';\n`;
            imports += `import * as LucideIcons from 'lucide-react';\n`;
            imports += `import ReactDOM from 'react-dom';\n`;
            imports += `import { createRoot } from 'react-dom/client';\n`;
            imports += `import { auth, db } from '../services/firebase.jsx';\n`;
            imports += `import { api } from '../services/api.jsx';\n`;
            imports += `import { useHistoryModal, useFolderUtils } from '../utils/hooks.jsx';\n`;
            // Add custom hooks imports (they will be duplicated but that's fine for now, we'll fix it if needed)

            // Special imports
            if (file === 'context.jsx') {
                 content = content.replace(/const { useState.*? = React;/g, '');
                 content = content.replace(/const { createRoot } = ReactDOM;/g, '');
                 content += '\nexport { ToastContext, useToast, ToastProvider, AuthContext, useAuth, AuthProvider, DataContext, useData, DataProvider, ArchiveProvider };\n';
            } else if (file === 'dndContext.jsx') {
                 imports += `import { useData } from './context.jsx';\n`;
                 content += '\nexport { useDragApi, useDraggedItem, useOverTarget, useDraggableItem, DragDropProvider };\n';
            } else if (file === 'main.jsx') {
                 imports += `import { ArchiveProvider, useAuth, useData } from './context/context.jsx';\n`;
                 imports += `import { DragDropProvider } from './context/dndContext.jsx';\n`;
                 imports += `import AuthModal from './modals/AuthModal.jsx';\n`;
                 imports += `import ProfileModal from './modals/ProfileModal.jsx';\n`;
                 imports += `import ListsView from './views/ListsView.jsx';\n`;
                 imports += `import LibraryView from './views/LibraryView.jsx';\n`;
                 imports += `import StatsView from './views/StatsView.jsx';\n`;
                 imports += `import { AlertCircle, List, Library, BarChart3 } from 'lucide-react';\n`;
            } else if (dir.includes('views') || dir.includes('modals') || dir.includes('components')) {
                 imports += `import { useData, useToast, useAuth } from '../context/context.jsx';\n`;
                 imports += `import { useDragApi, useDraggedItem, useOverTarget, useDraggableItem } from '../context/dndContext.jsx';\n`;
                 
                 // If not main, let's just append export default
                 // find the main const name
                 // In BookDetail it's BookDetailModal
                 // In ListsView it's ListsView
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
            
            // Remove window.
            content = content.replace(/window\.firebaseApp/g, 'auth.app');
            content = content.replace(/window\.firebaseAuth/g, 'auth');
            content = content.replace(/window\.firebaseDb/g, 'db');
            content = content.replace(/window\.firebase/g, 'auth'); // roughly
            content = content.replace(/window\.api/g, 'api');
            content = content.replace(/window\.useHistoryModal/g, 'useHistoryModal');
            content = content.replace(/window\.useFolderUtils/g, 'useFolderUtils');
            content = content.replace(/window\.LucideReact/g, 'LucideIcons');
            content = content.replace(/window\.ReactDOM/g, 'ReactDOM');
            content = content.replace(/window\.AuthModal = AuthModal;/g, '');
            content = content.replace(/window\.ProfileModal = ProfileModal;/g, '');

            fs.writeFileSync(fullPath, imports + content, 'utf8');
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Refactoring complete');
