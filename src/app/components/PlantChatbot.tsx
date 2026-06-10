import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Sprout, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from './ui/button';

interface SensorInfo {
  label: string;
  value: 'good' | 'warning' | 'critical';
  currentValue: number | string;
  unit: string;
}

interface PlantChatbotProps {
  plantName: string;
  sensorData: SensorInfo[];
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

// 💡 챗봇 빠른 추천 질문들
const QUICK_QUESTIONS = [
  "현재 내 식물 상태는 어때?",
  "흙이 건조한데 물을 줘야 할까?",
  "방 조도가 적당한지 확인해줘",
  "식물이 더 잘 자라게 하려면 어떻게 해?"
];

export function PlantChatbot({ plantName, sensorData }: PlantChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `안녕하세요! ${plantName} 관리 비서 **그린메이트**입니다. 🌿\n현재 실시간 센서 데이터를 확인하고 맞춤 가이드를 드릴 수 있어요. 궁금한 점을 편하게 질문해보세요!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤 하단 고정
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // 💡 실시간 센서 정보를 바탕으로 시스템 프롬프트(지침) 작성
  const getSystemInstruction = () => {
    const sensorStatusStr = sensorData
      .map(s => `- ${s.label}: ${s.currentValue}${s.unit} (상태: ${s.value})`)
      .join('\n');

    return `너는 사용자의 반려식물 재배를 돕는 친절하고 전문적인 AI 식물 가이드 '그린메이트'이다.
현재 사용자가 기르고 있는 식물은 '${plantName}'이며, IoT 센서로 측정한 실시간 식물 상태는 다음과 같다:
${sensorStatusStr}

[답변 가이드라인]
1. 사용자가 질문을 하면, 제공된 실시간 센서 수치를 최우선으로 참고해서 구체적인 대처법이나 피드백을 제공해라.
2. 수치가 비정상(warning 또는 critical)인 항목이 있다면, 그에 맞춰 물을 더 주거나 조명을 조절하거나 온도를 환기시키는 등의 구체적인 해결책을 친절히 안내해라.
3. 친근하고 부드러운 반려식물 매니저 어조(예: "~에요", "~해주세요!")를 사용하고 반드시 한국어로 답변해라.
4. 답변은 가독성이 좋게 적절한 마크다운(굵은 글씨, 글머리 기호)이나 줄바꿈을 활용해 짧고 명료하게 작성해라. (너무 길거나 잡다한 설명은 지양할 것)`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: "⚠️ **Gemini API Key가 설정되지 않았습니다.**\n\n프로젝트 루트 폴더의 `.env.local` 파일에 `VITE_GEMINI_API_KEY`가 올바르게 세팅되어 있는지 확인해주세요!"
          }
        ]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      // 1. Gemini AI 클라이언트 초기화
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 2. 모델 로드 및 시스템 지침 삽입
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: getSystemInstruction()
      });

      // 3. 대화 세션 생성 (이전 대화 맥락 포함)
      // 첫 번째 환영 메세지를 제외하고 히스토리 전달
      const chatHistory = messages
        .slice(1)
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));

      const chat = model.startChat({
        history: chatHistory
      });

      // 4. API 요청 전송
      const result = await chat.sendMessage(text);
      const replyText = result.response.text();

      setMessages(prev => [
        ...prev,
        { role: 'model', content: replyText }
      ]);
    } catch (error) {
      console.error("Gemini API 호출 오류:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: "😢 **죄송합니다. API 호출 도중 오류가 발생했습니다.**\n\n네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 🟢 우하단 플로팅 챗봇 버튼 */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-emerald-500/30"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="size-6 text-white" />
      </motion.button>

      {/* 💬 챗봇 모달 바텀시트 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-xs"
            />

            {/* 메인 챗 윈도우 */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[75dvh] bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] border-t border-emerald-100 shadow-2xl z-[70] flex flex-col overflow-hidden touch-auto"
            >
              {/* 상단 헤더 영역 */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-100/80 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                    <Sprout className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                      그린메이트 AI 비서
                      <span className="inline-flex items-center gap-0.5 bg-emerald-100/80 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                        <Sparkles className="size-2 text-emerald-600 animate-pulse" /> Gemini
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">실시간 센서 기반 맞춤 케어 피드백</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400 hover:text-slate-600 active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* 💬 메세지 이력 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-none">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      {/* 프로필 아이콘 */}
                      <div className={`p-2 rounded-xl shrink-0 ${isUser ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                      </div>

                      {/* 말풍선 본문 */}
                      <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                        isUser 
                          ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-700/10'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/40'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {/* 로딩 표시 */}
                {isLoading && (
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
                      <Bot className="size-4" />
                    </div>
                    <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-none p-3.5 border border-slate-200/40 text-xs flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-emerald-600" />
                      <span>그린메이트가 생각하는 중...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* 💡 추천 질문 가이드 바 */}
              <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 overflow-x-auto flex gap-2 scrollbar-none whitespace-nowrap">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] md:text-xs font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition-all shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* ⌨️ 입력창 하단 영역 */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex gap-2.5 items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(inputValue);
                  }}
                  disabled={isLoading}
                  placeholder="식물에 대해 무엇이든 물어보세요..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-base md:text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-0 transition-colors bg-slate-50 disabled:opacity-50"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <Send className="size-4.5" />
                </Button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
