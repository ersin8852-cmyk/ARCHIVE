const isValidISBN13 = (isbn) => {
  if (!/^\d{13}$/.test(isbn)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = 10 - (sum % 10);
  const calculatedCheck = checkDigit === 10 ? 0 : checkDigit;
  return calculatedCheck === parseInt(isbn[12]);
};

const BulkAddModal = ({ isOpen, onClose, folderId }) => {
  const { addBook } = useData();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [parsedResults, setParsedResults] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showError, setShowError] = useState(false);
  const [parseErrors, setParseErrors] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setParsedResults([]);
      setShowInfo(false);
      setShowError(false);
      setParseErrors([]);
    }
  }, [isOpen]);

  const handleParse = () => {
    if (!text.trim()) return;
    setIsParsing(true);
    
    setTimeout(() => {
      // Check for invalid characters (allow only digits, spaces, commas, dashes, newlines)
      if (/[^\d\s,\-]/.test(text)) {
        setParseErrors(["Harf veya geçersiz karakter kullanılamaz. Yalnızca rakam, virgül, tire ve boşluk kullanın."]);
        setShowError(true);
        setIsParsing(false);
        return;
      }

      // Split by separators (comma, dash, space, newline)
      const tokens = text.split(/[\s,\-]+/).filter(t => t.trim() !== '');
      
      const results = [];
      const errors = [];

      tokens.forEach(token => {
        if (token.length !== 13) {
          errors.push(`"${token}" geçersiz: ISBN-13 tam olarak 13 rakamdan oluşmalıdır.`);
        } else if (!isValidISBN13(token)) {
          errors.push(`"${token}" geçersiz: Bu ISBN'nin check digit değeri hatalı.`);
        } else {
          results.push({
            title: `ISBN: ${token}`,
            author: '',
            isbn: token,
            pageCount: 0,
            cover: '',
            publisher: '',
            price: ''
          });
        }
      });
      
      setIsParsing(false);

      if (errors.length > 0) {
        setParseErrors(errors);
        setShowError(true);
      } else if (results.length === 0) {
        setParseErrors(["Geçerli bir ISBN bulunamadı."]);
        setShowError(true);
      } else {
        setParsedResults(results);
      }
    }, 300);
  };

  const handleAdd = (book) => {
    addBook(book, folderId);
  };

  if (!isOpen) return null;

  const infoContent = (
    <div className="text-sm space-y-2">
      <p>Yalnızca <strong>ISBN-13</strong> numaraları girilebilir.</p>
      <p>Her ISBN tam olarak <strong>13 rakamdan</strong> oluşmalıdır. ISBN-13 zorunludur.</p>
      <p>Harf, kitap adı, yazar adı, yayın yılı veya sayfa sayısı <strong>GİRİLMEMELİDİR.</strong></p>
      <p>Birden fazla ISBN girilecekse aralarında <code className="bg-zinc-100 px-1 py-0.5 rounded">,</code> (virgül), <code className="bg-zinc-100 px-1 py-0.5 rounded">-</code> (tire) veya <strong>boşluk</strong> kullanılmalıdır.</p>
      <p className="mt-2 text-zinc-500 italic text-xs border-t pt-2">
        Örnek (Tek):<br/>9789750719387<br/><br/>
        Örnek (Çoklu):<br/>9789750719387, 9789750719388<br/>
        9789750719387 - 9789750719388<br/>
        9789750719387 9789750719388
      </p>
    </div>
  );

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center sm:p-4 z-[100] items-end sm:items-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium text-zinc-800">Toplu Ekle</h2>
            <div className="relative">
              <button 
                onClick={() => setShowInfo(!showInfo)} 
                className="w-6 h-6 rounded-full border border-zinc-300 text-zinc-400 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                title="Format İpuçları"
              >
                <Info size={14} />
              </button>
              {showInfo && (
                <div className="absolute top-8 left-0 w-80 bg-white border border-zinc-200 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  {infoContent}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white relative flex flex-col min-h-0">
          {parsedResults.length === 0 ? (
            <textarea 
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="ISBN numaralarını buraya yapıştır... (Örn: 9789750719387, 9789750719388)"
              className="w-full h-full p-6 text-base text-zinc-800 resize-none focus:outline-none bg-transparent font-mono leading-relaxed placeholder-zinc-300"
              autoFocus
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
              <div className="flex flex-col gap-3">
                <div className="px-1 pb-2 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                  <span className="text-sm font-medium text-zinc-500">{parsedResults.length} ISBN algılandı</span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => {
                        let addedCount = 0;
                        parsedResults.forEach(b => {
                          const success = addBook(b, folderId);
                          if (success) addedCount++;
                        });
                        if (addedCount > 0) {
                          showToast(`Toplam ${addedCount} kitap eklendi! Fiyat ve detaylar arka planda çekilecek.`, 'success');
                          setParsedResults([]);
                          setText('');
                        }
                      }} 
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all duration-500 flex justify-center items-center gap-2 animate-in fade-in zoom-in-95 shadow-[0_0_15px_rgba(5,150,105,0.2)] text-sm"
                    >
                      <CheckSquare size={16} />
                      Tümünü Ekle
                    </button>
                    <button onClick={() => setParsedResults([])} className="text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap">Düzenlemeye Dön</button>
                  </div>
                </div>
                {parsedResults.map((book, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="w-10 h-14 bg-zinc-100 rounded-md border border-zinc-200 shrink-0 flex items-center justify-center">
                        <BookOpen size={14} className="text-zinc-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-800 leading-tight mb-1 truncate">{book.title}</h3>
                        <p className="text-xs text-zinc-500 mb-0.5 truncate">
                          Detaylar web'den çekilecek...
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleAdd(book)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors shrink-0">
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedResults.length === 0 && (
          <div className="p-4 border-t border-zinc-100 bg-white flex justify-end shrink-0">
            <button 
              onClick={handleParse} 
              disabled={isParsing || !text.trim()} 
              className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isParsing ? 'Doğrulanıyor...' : 'Doğrula ve Listele'}
            </button>
          </div>
        )}

        {/* Error Popup Overlay */}
        {showError && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                <X size={32} />
              </div>
              <h3 className="text-xl font-medium text-zinc-800 mb-2">Hatalı Giriş</h3>
              
              <div className="bg-red-50/50 rounded-2xl p-4 w-full text-left border border-red-100 mb-6 max-h-48 overflow-y-auto">
                <ul className="text-sm text-red-600 space-y-2 list-disc pl-4">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="leading-snug">{err}</li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => setShowError(false)} 
                className="w-full py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Geri Dön ve Düzelt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
