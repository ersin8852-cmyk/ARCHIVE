const AppLayout = () => {
  const { user, loadingAuth } = useAuth();
  const { loadingData } = useData();
  const [activeTab, setActiveTab] = useState('lists');
  const [listsFolderId, setListsFolderId] = useState(null);
  const [libraryFolderId, setLibraryFolderId] = useState(null);

  const [profileModalOpen, openProfileModal, closeProfileModal] = window.useHistoryModal('profile');

  React.useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'lists', listsId: null, libraryId: null }, '');
    } else {
      const s = window.history.state;
      if (s.tab) setActiveTab(s.tab);
      if (s.listsId !== undefined) setListsFolderId(s.listsId);
      if (s.libraryId !== undefined) setLibraryFolderId(s.libraryId);
    }

    const handlePopState = (e) => {
      if (e.state) {
        setActiveTab(e.state.tab);
        setListsFolderId(e.state.listsId);
        setLibraryFolderId(e.state.libraryId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabClick = (tabId) => {
    if (activeTab === tabId) {
      if (tabId === 'lists' && listsFolderId !== null) {
        setListsFolderId(null);
        window.history.pushState({ tab: tabId, listsId: null, libraryId: libraryFolderId }, '');
      }
      if (tabId === 'library' && libraryFolderId !== null) {
        setLibraryFolderId(null);
        window.history.pushState({ tab: tabId, listsId: listsFolderId, libraryId: null }, '');
      }
    } else {
      setActiveTab(tabId);
      window.history.pushState({ tab: tabId, listsId: listsFolderId, libraryId: libraryFolderId }, '');
    }
  };

  const changeListsFolder = (newId) => {
    setListsFolderId(newId);
    window.history.pushState({ tab: activeTab, listsId: newId, libraryId: libraryFolderId }, '');
  };

  const changeLibraryFolder = (newId) => {
    setLibraryFolderId(newId);
    window.history.pushState({ tab: activeTab, listsId: listsFolderId, libraryId: newId }, '');
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-white">
         <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-white sm:bg-zinc-100 min-h-[100dvh]">
      <AuthModal isVisible={!user} />
      <ProfileModal isOpen={profileModalOpen} onClose={closeProfileModal} />
      {user && (
        <div className="w-full sm:max-w-md bg-white h-[100dvh] flex flex-col relative sm:shadow-xl overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'lists' && <ListsView activeFolderId={listsFolderId} setActiveFolderId={changeListsFolder} onOpenProfile={openProfileModal} />}
            {activeTab === 'library' && <LibraryView activeFolderId={libraryFolderId} setActiveFolderId={changeLibraryFolder} onOpenProfile={openProfileModal} />}
            {activeTab === 'stats' && <StatsView onOpenProfile={openProfileModal} />}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-[#2a2421] backdrop-blur-xl border-t border-white/5 pb-safe z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex justify-around items-center px-4 py-1.5">
              {[
                { id: 'lists', icon: List },
                { id: 'library', icon: Library },
                { id: 'stats', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id} onClick={() => handleTabClick(tab.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'text-orange-500 bg-stone-700/50' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/30'}`}
                >
                  <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('Uygulama hatası:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-white text-center p-6 gap-3">
          <AlertCircle size={40} className="text-red-500" />
          <h2 className="font-bold text-zinc-800">Bir şeyler ters gitti</h2>
          <p className="text-sm text-zinc-500">Sayfayı yenilemeyi deneyin. Verileriniz tarayıcınızda saklı kalmaya devam eder.</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium">Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayoutWithDnd = () => {
  const { moveItemToPosition } = useData();
  return (
    <DragDropProvider onDrop={moveItemToPosition}>
      <AppLayout />
    </DragDropProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ArchiveProvider><AppLayoutWithDnd /></ArchiveProvider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
