
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NovelContent, VoiceName, VoiceOption, ReaderTheme } from './types';
import { geminiTTSService } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audio';

// --- 常量与类型 ---
const VOICE_OPTIONS: VoiceOption[] = [
  { id: VoiceName.CHARON, label: '说书人(默认)', description: '低沉浑厚，富有叙事感' },
  { id: VoiceName.ZEPHYR, label: '温润青年', description: '语气平缓，适合散文' },
  { id: VoiceName.KORE, label: '知性女主播', description: '清晰自然，富有情感' },
  { id: VoiceName.PUCK, label: '灵动小顽童', description: '俏皮可爱，适合童话' },
  { id: VoiceName.FENRIR, label: '威严老者', description: '苍劲有力，适合武侠' },
];

const THEME_LABELS = { [ReaderTheme.LIGHT]: '明亮', [ReaderTheme.DARK]: '深邃', [ReaderTheme.SEPIA]: '复古' };
const THEMES = {
  [ReaderTheme.LIGHT]: 'bg-white text-gray-900 border-gray-200',
  [ReaderTheme.DARK]: 'bg-zinc-900 text-zinc-100 border-zinc-800',
  [ReaderTheme.SEPIA]: 'bg-[#f4ecd8] text-[#5b4636] border-[#e2d1a6]',
};

// --- 子组件 ---

const Sidebar: React.FC<{
  library: NovelContent[];
  activeNovelIndex: number | null;
  onSelectNovel: (index: number) => void;
  onUpload: (file: File) => void;
  onPaste: (text: string, title: string) => void;
  onDeleteNovel: (index: number) => void;
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  isSmartVoice: boolean;
  setIsSmartVoice: (v: boolean) => void;
}> = ({ library, activeNovelIndex, onSelectNovel, onUpload, onPaste, onDeleteNovel, selectedVoice, onVoiceChange, theme, onThemeChange, isSmartVoice, setIsSmartVoice }) => {
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');

  return (
    <div className={`w-80 h-full border-r p-6 flex flex-col gap-6 overflow-y-auto ${THEMES[theme]}`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">AI 悦读</h1>
        <p className="text-xs opacity-50 uppercase tracking-widest">智能流畅听书</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase opacity-40">导入书籍</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl border-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
            <span className="text-[11px] font-bold">文件导入</span>
            <input type="file" accept=".txt,.nb" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
          <button onClick={() => setIsPasting(true)} className="flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl border-current opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-bold">粘贴文本</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase opacity-40">智能模式</h2>
        <div className="flex flex-col gap-2 p-3 bg-black bg-opacity-5 rounded-xl">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium">AI 角色化音色</span>
            <input type="checkbox" checked={isSmartVoice} onChange={(e) => setIsSmartVoice(e.target.checked)} className="accent-blue-600 w-4 h-4" />
          </label>
          <p className="text-[10px] opacity-50 italic leading-tight">开启后将根据文本语义自动切换旁白与角色音色</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <h2 className="text-xs font-bold uppercase opacity-40">书架 ({library.length})</h2>
        <div className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
          {library.map((item, idx) => (
            <div key={idx} className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all ${activeNovelIndex === idx ? 'bg-blue-600 text-white' : 'hover:bg-black hover:bg-opacity-5'}`} onClick={() => onSelectNovel(idx)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className={`text-[10px] ${activeNovelIndex === idx ? 'text-blue-100' : 'opacity-50'}`}>共 {item.paragraphs.length} 段</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteNovel(idx); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase opacity-40">首选音色</h2>
        <div className="flex flex-col gap-1">
          {VOICE_OPTIONS.map((v) => (
            <button key={v.id} onClick={() => onVoiceChange(v.id)} className={`flex items-center gap-2 p-2 rounded-lg text-left ${selectedVoice === v.id ? 'bg-blue-600 bg-opacity-10 border border-blue-600' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex-1">
                <div className="text-xs font-bold">{v.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-black bg-opacity-5 p-1 rounded-lg">
        {Object.values(ReaderTheme).map((t) => (
          <button key={t} onClick={() => onThemeChange(t)} className={`flex-1 py-1 text-[10px] font-bold rounded ${theme === t ? 'bg-white text-blue-600 shadow-sm' : 'opacity-50'}`}>{THEME_LABELS[t]}</button>
        ))}
      </div>

      {isPasting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-gray-900 w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 scale-in-center">
            <h3 className="text-xl font-bold">导入文本</h3>
            <input type="text" placeholder="书名" className="w-full p-3 bg-gray-100 rounded-xl outline-none" value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} />
            <textarea placeholder="粘贴正文..." className="w-full h-80 p-4 bg-gray-100 rounded-xl outline-none resize-none font-serif" value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setIsPasting(false)} className="flex-1 py-3 opacity-50">取消</button>
              <button onClick={() => { if (pasteText.trim()) { onPaste(pasteText, pasteTitle || '未命名'); setIsPasting(false); setPasteText(''); setPasteTitle(''); } }} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold">导入并开始</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [library, setLibrary] = useState<NovelContent[]>([]);
  const [activeNovelIndex, setActiveNovelIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<ReaderTheme>(ReaderTheme.LIGHT);
  const [voice, setVoice] = useState<VoiceName>(VoiceName.CHARON);
  const [isSmartVoice, setIsSmartVoice] = useState(true);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // 核心预读缓存
  const bufferCache = useRef<Map<number, AudioBuffer>>(new Map());
  const loadingQueue = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // 预加载逻辑：分析语义 -> 合成 -> 解码 -> 存入 Cache
  const prefetchParagraph = async (novelIdx: number, paraIdx: number) => {
    const novel = library[novelIdx];
    if (!novel || paraIdx >= novel.paragraphs.length || bufferCache.current.has(paraIdx) || loadingQueue.current.has(paraIdx)) return;

    loadingQueue.current.add(paraIdx);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const text = novel.paragraphs[paraIdx];
      
      let targetVoice = voice;
      let targetPersona = "说书人风格";

      if (isSmartVoice) {
        const analysis = await geminiTTSService.analyzeParagraph(text);
        targetVoice = analysis.voice;
        targetPersona = analysis.persona;
      }

      const audioData = await geminiTTSService.synthesizeSpeech(text, targetVoice, targetPersona);
      if (audioData) {
        const decoded = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        bufferCache.current.set(paraIdx, decoded);
      }
    } finally {
      loadingQueue.current.delete(paraIdx);
    }
  };

  // 核心播放循环
  const playParagraph = async (novelIdx: number, paraIdx: number) => {
    const novel = library[novelIdx];
    if (!novel || paraIdx >= novel.paragraphs.length) {
      stopPlayback();
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    let buffer = bufferCache.current.get(paraIdx);
    
    if (!buffer) {
      setIsLoadingNext(true);
      await prefetchParagraph(novelIdx, paraIdx);
      buffer = bufferCache.current.get(paraIdx);
      setIsLoadingNext(false);
    }

    if (!buffer) {
      console.error("无法加载该段落音频");
      stopPlayback();
      return;
    }

    // 播放的同时预取后续两段
    prefetchParagraph(novelIdx, paraIdx + 1);
    prefetchParagraph(novelIdx, paraIdx + 2);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      // 播放结束后清理当前缓存
      bufferCache.current.delete(paraIdx);
      if (isPlayingRef.current) {
        setCurrentParagraphIndex(prev => {
          const next = prev + 1;
          if (next < novel.paragraphs.length) {
            playParagraph(novelIdx, next);
            return next;
          }
          stopPlayback();
          return prev;
        });
      }
    };

    sourceRef.current = source;
    source.start();
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (activeNovelIndex !== null) {
      setIsPlaying(true);
      playParagraph(activeNovelIndex, currentParagraphIndex);
    }
  };

  useEffect(() => {
    const activeEl = document.getElementById(`para-${currentParagraphIndex}`);
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentParagraphIndex]);

  // 当切换书或段落时，清理旧缓存并触发预读
  useEffect(() => {
    if (activeNovelIndex !== null) {
      bufferCache.current.clear();
      prefetchParagraph(activeNovelIndex, currentParagraphIndex);
      prefetchParagraph(activeNovelIndex, currentParagraphIndex + 1);
    }
  }, [activeNovelIndex, currentParagraphIndex]);

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden ${THEMES[theme]}`}>
      <Sidebar 
        library={library}
        activeNovelIndex={activeNovelIndex}
        onSelectNovel={(idx) => { stopPlayback(); setActiveNovelIndex(idx); setCurrentParagraphIndex(0); }}
        onUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
            setLibrary(prev => [...prev, { title: file.name.replace(/\.(txt|nb)$/i, ''), paragraphs }]);
            setActiveNovelIndex(library.length);
            setCurrentParagraphIndex(0);
          };
          reader.readAsText(file);
        }}
        onPaste={(text, title) => {
          const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
          setLibrary(prev => [...prev, { title, paragraphs }]);
          setActiveNovelIndex(library.length);
          setCurrentParagraphIndex(0);
        }}
        onDeleteNovel={(idx) => {
          if (activeNovelIndex === idx) stopPlayback();
          setLibrary(prev => prev.filter((_, i) => i !== idx));
          if (activeNovelIndex === idx) setActiveNovelIndex(null);
        }}
        selectedVoice={voice}
        onVoiceChange={(v) => { setVoice(v); bufferCache.current.clear(); if (isPlaying) stopPlayback(); }}
        theme={theme}
        onThemeChange={setTheme}
        isSmartVoice={isSmartVoice}
        setIsSmartVoice={(v) => { setIsSmartVoice(v); bufferCache.current.clear(); }}
      />

      <main className="flex-1 flex flex-col items-center relative h-full">
        {/* 控制面板 */}
        <div className="absolute top-6 w-full max-w-xl px-4 z-20">
          <div className="bg-black bg-opacity-10 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between border border-white border-opacity-10 shadow-2xl">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-sm font-bold truncate">{activeNovelIndex !== null ? library[activeNovelIndex].title : "等待阅读..."}</h3>
              {activeNovelIndex !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-black bg-opacity-20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((currentParagraphIndex + 1) / library[activeNovelIndex].paragraphs.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono opacity-60">{currentParagraphIndex + 1}/{library[activeNovelIndex].paragraphs.length}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isLoadingNext && <span className="text-[10px] font-bold text-blue-500 animate-pulse">缓冲中...</span>}
              <button disabled={activeNovelIndex === null} onClick={togglePlay} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${isPlaying ? 'bg-red-500' : 'bg-blue-600'} text-white`}>
                {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg> : <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
              </button>
            </div>
          </div>
        </div>

        {/* 阅读视口 */}
        <div ref={scrollContainerRef} className="flex-1 w-full max-w-3xl overflow-y-auto px-10 pt-36 pb-64 no-scrollbar scroll-smooth">
          {activeNovelIndex === null ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
              <h4 className="text-3xl font-bold italic">您的私人书房</h4>
              <p className="text-sm">导入 TXT 开启预读流式听书体验</p>
            </div>
          ) : (
            <div className="space-y-16">
              {library[activeNovelIndex].paragraphs.map((p, idx) => (
                <div key={idx} id={`para-${idx}`} className={`text-2xl font-serif leading-[1.8] transition-all duration-700 cursor-pointer p-8 rounded-3xl ${idx === currentParagraphIndex ? 'scale-105 opacity-100 bg-blue-600 bg-opacity-5 ring-1 ring-blue-600 ring-opacity-10 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                  onClick={() => {
                    setCurrentParagraphIndex(idx);
                    if (isPlaying) { stopPlayback(); setTimeout(() => { setIsPlaying(true); playParagraph(activeNovelIndex, idx); }, 100); }
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .font-serif { font-family: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", serif; }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-in-center { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
