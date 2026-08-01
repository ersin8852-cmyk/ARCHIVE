import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback, useLayoutEffect } from 'react';
const useHistoryModal = (modalId) => {
  const [isOpen, React_setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handlePopState = (e) => {
      const stateModal = e.state?.modal;
      if (isOpen && stateModal !== modalId) React_setIsOpen(false);
      if (!isOpen && stateModal === modalId) React_setIsOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, modalId]);

  const openModal = React.useCallback(() => {
    React_setIsOpen(prev => {
      if (!prev) {
        const s = window.history.state || {};
        if (s.modal) {
          window.history.replaceState({ ...s, modal: modalId }, '');
        } else {
          window.history.pushState({ ...s, modal: modalId }, '');
        }
      }
      return true;
    });
  }, [modalId]);

  const closeModal = React.useCallback(() => {
    React_setIsOpen(prev => {
      if (prev) {
        if (window.history.state?.modal === modalId) {
          window.history.back();
        } else {
          // React_setIsOpen is handled by return false
        }
      }
      return false;
    });
  }, [modalId]);

  return [isOpen, openModal, closeModal, React_setIsOpen];
};

export { useHistoryModal };

export const useFolderUtils = (folders, activeFolderId, setActiveFolderId, setIsSearching, setSearchTerm) => {
  const breadcrumbs = React.useMemo(() => {
    const bcs = [];
    const visitedBc = new Set();
    let curr = folders.find(f => f.id === activeFolderId);
    while (curr && !visitedBc.has(curr.id)) {
      visitedBc.add(curr.id);
      bcs.unshift(curr);
      curr = folders.find(f => f.id === curr.parentId);
    }
    return bcs;
  }, [folders, activeFolderId]);

  const getFolderPath = React.useCallback((folderId) => {
    if (!folderId) return 'Ana Dizin';
    let current = folders.find(f => f.id === folderId);
    let path = [];
    const visitedPath = new Set();
    while(current && !visitedPath.has(current.id)) {
        visitedPath.add(current.id);
        path.unshift(current.name);
        current = folders.find(f => f.id === current.parentId);
    }
    return path.join(' / ') || 'Ana Dizin';
  }, [folders]);

  const handleNavigate = React.useCallback((book) => {
      setIsSearching(false);
      setSearchTerm('');
      
      let currentFolder = folders.find(f => f.id === book.folderId);
      if (currentFolder) {
          setActiveFolderId(currentFolder.id);
      } else {
          setActiveFolderId(null);
      }

      setTimeout(() => {
          const el = document.getElementById(`book-node-${book.id}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
          }
      }, 150);
  }, [folders, setIsSearching, setSearchTerm, setActiveFolderId]);

  return { breadcrumbs, getFolderPath, handleNavigate };
};
