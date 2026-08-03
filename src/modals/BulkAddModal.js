const { useState, useEffect, useRef } = React;
const { Info, X, Check, Search, Plus, BookOpen } = window.LucideReact;

const BulkAddModal = ({ isOpen, onClose, folderId }) => {
  const { addBook } = useData();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [parsedResults, setParsedResults] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setParsedResults([]);
      setShowInfo(false);
      setShowError(false);
    }
  }, [isOpen]);

  const handleParse = () => {
    if (!text.trim()) return;
    setIsParsing(true);
    
    setTimeout(() => {
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const results = [];
      
      lines.forEach(line => {
        let currentLine = line.trim();
        let isbn = '';
        let pageCount = '';
        let author = '';
        let title = '';

        const isbnMatch = currentLine.match(/\b\d{10,13}\b/);
        if (isbnMatch) {
          isbn = isbnMatch[0];
          currentLine = currentLine.replace(isbn, '').trim();
        }

        const pageMatch = currentLine.match(/\b(\d{2,4})\s*(sayfa|s\.|pages?)\b/i) || currentLine.match(/\b(\d{2,4})\b$/);
        if (pageMatch) {
          pageCount = pageMatch[1];
          currentLine = currentLine.replace(pageMatch[0], '').trim();
        }

        currentLine = currentLine.replace(/^[-\|,]+|[-\|,]+$/g, '').trim();

        const separators = [' - ', ' | ', ',', ';'];
        let splitPoint = -1;
        let usedSeparator = '';
        
        for (const sep of separators) {
          splitPoint = currentLine.indexOf(sep);
          if (splitPoint !== -1) {
            usedSeparator = sep;
            break;
          }
        }

        if (splitPoint !== -1) {
          title = currentLine.substring(0, splitPoint).trim();
          author = currentLine.substring(splitPoint + usedSeparator.length).trim();
        } else {
          title = currentLine;
        }
        
        title = title.replace(/^[-\|,]+|[-\|,]+$/g, '').trim();
        author = author.replace(/^[-\|,]+|[-\|,]+$/g, '').trim();

        if (title.length >= 2 || isbn) {
          results.push({
            title: title || 'İsimsiz Kitap',
            author: author || '',
            isbn: isbn || '',
            pageCount: pageCount || 0,
            cover: '',
            publisher: '',
            year: '',
            price: ''
          });
        }
      });
      
      setIsParsing(false);

      if (results.length === 0) {
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
      <p>Her kitabı <strong>ayrı bir satıra</strong> yazmalısın.</p>
      <p><strong>Önerilen Format:</strong> Kitap Adı - Yazar Adı - ISBN - Sayfa</p>
      <p>Sistem ISBN ve Sayfa sayısını otomatik tanır. İsim ve yazarı ayırmak için <code className="bg-zinc-100 px-1 py-0.5 rounded">-</code>, <code className="bg-zinc-100 px-1 py-0.5 rounded">|</code> veya <code className="bg-zinc-100 px-1 py-0.5 rounded">,</code> kullanabilirsin.</p>
      <p className="mt-2 text-zinc-500 italic text-xs border-t pt-2">Örnek:<br/>Suç ve Ceza - Dostoyevski - 9781234567890 - 600<br/>Simyacı, Paulo Coelho, 200 sayfa</p>
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
                <div className="absolute top-8 left-0 w-72 bg-white border border-zinc-200 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
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
              placeholder="Kitap bilgilerini buraya yapıştır..."
              className="w-full h-full p-6 text-base text-zinc-800 resize-none focus:outline-none bg-transparent font-mono leading-relaxed placeholder-zinc-300"
              autoFocus
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
              <div className="flex flex-col gap-3">
                <div className="px-1 pb-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">{parsedResults.length} kitap algılandı</span>
                  <button onClick={() => setParsedResults([])} className="text-xs font-medium text-orange-600 hover:text-orange-700">Düzenlemeye Dön</button>
                </div>
                {parsedResults.map((book, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="w-10 h-14 bg-zinc-100 rounded-md border border-zinc-200 shrink-0 flex items-center justify-center">
                        <BookOpen size={14} className="text-zinc-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-800 leading-tight mb-1 truncate">{book.title}</h3>
                        <p className="text-xs text-zinc-500 mb-0.5 truncate">{book.author || 'Yazar Belirtilmemiş'}</p>
                        <p className="text-[10px] text-zinc-400">ISBN: {book.isbn || 'Yok'} | {book.pageCount || 0} Sayfa</p>
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
              {isParsing ? 'Ayıklanıyor...' : 'Ayıkla ve Listele'}
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
              <h3 className="text-xl font-medium text-zinc-800 mb-2">Lütfen istenilen formatta giriniz</h3>
              <p className="text-zinc-500 text-sm mb-6">Sistem girdiğiniz metinde hiçbir kitap verisi algılayamadı.</p>
              
              <div className="bg-zinc-50 rounded-2xl p-5 w-full text-left border border-zinc-100 mb-6">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Info size={16} />
                  <span className="font-medium text-sm">Nasıl girmeliyim?</span>
                </div>
                <div className="text-sm text-zinc-500 space-y-2 opacity-80">
                  <p>Her kitabı <strong>ayrı bir satıra</strong> yazmalısın.</p>
                  <p><strong>Önerilen:</strong> Kitap Adı - Yazar Adı - ISBN - Sayfa</p>
                  <p>İsim ve yazarı ayırmak için <code className="bg-zinc-200/50 px-1 rounded">-</code> veya <code className="bg-zinc-200/50 px-1 rounded">,</code> kullan.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowError(false)} 
                className="w-full py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
