const CopyButton = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-2 p-1.5 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-800 transition-colors" title="Kopyala">
      {copied ? <window.LucideReact.Check size={14} className="text-green-600" /> : <window.LucideReact.Copy size={14} />}
    </button>
  );
};

const formatMessage = (text) => {
  // Extract ISBNs and basic markdown (bold, italic)
  const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|\b\d{10,13}\b)/g);
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
      {parts.map((part, i) => {
        if (!part) return null;
        if (/^\d{10,13}$/.test(part)) {
          return (
            <span key={i} className="inline-flex items-center bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-sm mx-0.5">
              {part}
              <CopyButton text={part} />
            </span>
          );
        } else if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return <strong key={i} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return <em key={i} className="italic text-zinc-800">{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const AiAssistantModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = React.useState([{ role: 'model', text: 'Merhaba! Hangi kitabın ISBN numarasını veya bilgilerini bulmak istersin?' }]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);
  const { showToast } = window.React.useContext(window.ToastContext || React.createContext({ showToast: () => {} })); // Fallback
  
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      if (!window.geminiAPI) {
        throw new Error("Gemini API servisi yüklenemedi.");
      }
      const response = await window.geminiAPI.generateContent(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      showToast(err.message, 'error');
      setMessages(prev => [...prev, { role: 'model', text: 'Üzgünüm, bir hata oluştu: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return window.ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-[100]">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              <window.LucideReact.Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Kitap Asistanı</h2>
              <p className="text-[11px] font-medium text-zinc-500">Gemini AI tarafından desteklenmektedir</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200/50 rounded-full transition-colors text-zinc-600">
            <window.LucideReact.X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-sm'}`}>
                {msg.role === 'model' ? formatMessage(msg.text) : <div className="whitespace-pre-wrap text-[15px]">{msg.text}</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white border border-zinc-100 rounded-tl-sm flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-zinc-100 shrink-0">
          <div className="flex items-end gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Kitap sor veya ISBN iste..."
              className="flex-1 bg-transparent border-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 focus:outline-none text-sm text-zinc-800"
              rows={1}
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || loading}
              className="w-11 h-11 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-0.5"
            >
              <window.LucideReact.Send size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

window.AiAssistantModal = AiAssistantModal;
