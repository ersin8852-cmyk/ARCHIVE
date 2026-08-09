const Header = ({ onOpenProfile }) => {
  const { profile } = useData();
  
  return (
    <div className="sticky top-0 bg-[#3d3430] backdrop-blur-md z-20 shadow-sm flex flex-col">
      <div className="h-[50px] px-4 flex items-center border-b border-white/5 relative z-20">
        <button onClick={onOpenProfile} className="shrink-0 p-1.5 -ml-1 text-stone-300 hover:bg-stone-800 rounded-full transition-colors flex items-center justify-center relative z-10">
          {profile?.photo ? (
            <img src={profile.photo} alt="Profil" className="w-9 h-9 rounded-full object-cover border border-stone-500 shadow-sm" />
          ) : (
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-700/50 shadow-sm">
              <User size={20} />
            </div>
          )}
        </button>
        
        <img 
          src="./logo.png" 
          alt="Logo" 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] max-w-none object-contain drop-shadow-sm pointer-events-none" 
        />
      </div>
    </div>
  );
};
