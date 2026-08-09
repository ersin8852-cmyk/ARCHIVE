const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
    <Icon size={48} className="opacity-20" />
    <p className="text-center text-sm font-medium px-4">
      {title}
      {subtitle && <><br/><span className="text-xs font-normal">{subtitle}</span></>}
    </p>
  </div>
);
