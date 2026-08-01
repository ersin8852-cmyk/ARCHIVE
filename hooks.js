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

window.useHistoryModal = useHistoryModal;
