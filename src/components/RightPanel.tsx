import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Search, Edit3, Sliders } from 'lucide-react';
import '../styles/RightPanel.css';
import { startChatSession, streamChatSearch } from '../api/chat';

type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void;
};

type TabType = 'search' | 'edit';

type Message =
  | { id: string; role: 'user' | 'bot'; content: string; streaming?: boolean; type: 'text' }
  | { id: string; role: 'user'; type: 'image'; fileName: string; previewUrl: string };

export default function RightPanel({ isOpen, onClose }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
    {
        id: 'm-1',
        role: 'bot',
        content: '사진에 대한 설명을 적어주세요.',
        streaming: false,
        type: 'text', // ✅ 누락된 타입 추가
    },
]);
    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(50);
    const [saturation, setSaturation] = useState(50);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const streamTimerRef = useRef<number | null>(null);
    const abortRef = useRef<(() => void) | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    // 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 스트리밍 시뮬레이터는 fallback 용도로 유지
    const simulateStream = (botMessageId: string, fullText: string) => {
        if (streamTimerRef.current) {
            window.clearInterval(streamTimerRef.current);
        }

        let idx = 0;
        const step = 2;

        streamTimerRef.current = window.setInterval(() => {
            idx += step;

            setMessages(prev =>
                prev.map(m => {
                    if (m.id !== botMessageId) return m;

                    const nextContent = fullText.slice(0, idx);
                    const done = idx >= fullText.length;

                    return {
                        ...m,
                        content: nextContent,
                        streaming: !done,
                    };
                })
            );

            if (idx >= fullText.length) {
                if (streamTimerRef.current) {
                    window.clearInterval(streamTimerRef.current);
                }
                streamTimerRef.current = null;
                setIsStreaming(false);
            }
        }, 25);
    };

    // 추가: result 전용 핸들러 (백엔드 result 이벤트 처리 지점)
    const handleResult = (result: any) => {
        // 필요 시 결과를 별도 상태/그리드에 반영
        // 예: window.dispatchEvent(new CustomEvent('chat:result', { detail: result }));
        console.log('RESULT:', result);
    };

    // 수정: 실제 API 연결 (첫 채팅=세션 생성, 이후=스트리밍)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isStreaming) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            streaming: false,
            type: 'text',
        };

        const botMessageId = crypto.randomUUID();
        const botMessage: Message = {
            id: botMessageId,
            role: 'bot',
            content: '',
            streaming: true,
            type: 'text',
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
        setInputMessage('');
        setIsStreaming(true);

        try {
            // 1) 첫 메시지면 세션 생성
            if (!sessionId) {
                const res = await startChatSession({ message: text });
                setSessionId(res.sessionId);
                // 서버가 주는 첫 답변으로 봇 메시지 갱신
                setMessages(prev =>
                    prev.map(m => (m.id === botMessageId
                        ? { ...m, content: res.message, streaming: false }
                        : m))
                );
                setIsStreaming(false);
                return;
            }

            // 2) 기존 세션이면 스트리밍(delta/result 분리)
            let full = '';
            const stop = streamChatSearch(
                { sessionId, query: text },
                {
                    onDelta: (delta) => {
                        full += delta;
                        setMessages(prev =>
                            prev.map(m => (m.id === botMessageId
                                ? { ...m, content: full, streaming: true }
                                : m))
                        );
                    },
                    onResult: (result) => {
                        handleResult(result);
                    },
                    onError: (err) => {
                        setMessages(prev =>
                            prev.map(m => (m.id === botMessageId
                                ? { ...m, content: `오류: ${err}`, streaming: false }
                                : m))
                        );
                        setIsStreaming(false);
                    },
                    onComplete: () => {
                        setMessages(prev =>
                            prev.map(m => (m.id === botMessageId
                                ? { ...m, content: full, streaming: false }
                                : m))
                        );
                        setIsStreaming(false);
                    },
                }
            );
            abortRef.current = stop;
        } catch (err) {
            console.error(err);
            // 실패 시 간단한 fallback 메시지
            setMessages(prev =>
                prev.map(m => (m.id === botMessageId
                    ? { ...m, content: '요청 처리 중 오류가 발생했습니다.', streaming: false }
                    : m))
            );
            setIsStreaming(false);
        }
    };

    const handleFileDrop = (e: React.DragEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isStreaming) return;
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        const previewUrl = URL.createObjectURL(file);
        const imgMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            type: 'image',
            fileName: file.name,
            previewUrl,
        };
        setMessages(prev => [...prev, imgMsg]);
    };

    // 언마운트 시 정리
    useEffect(() => {
        return () => {
            abortRef.current?.();
            if (streamTimerRef.current) {
                window.clearInterval(streamTimerRef.current);
            }
        };
    }, []);

    return (
        <aside className={panelClass} aria-hidden={!isOpen}>
            <div className="chat-header">
                <div className="tab-buttons">
                    <button
                        className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        <Search className="icon" />
                        <span>검색</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('edit')}
                    >
                        <Edit3 className="icon" />
                        <span>편집</span>
                    </button>
                </div>
                <button className="close-btn" onClick={onClose} aria-label="패널 닫기">
                    <X className="icon" />
                </button>
            </div>

            {activeTab === 'search' ? (
                <div className="chat-body">
                    {messages.map(msg => {
                      if (msg.type === 'image') {
                        return (
                          <div key={msg.id} className="message-row is-user">
                            <div className="message-bubble message-user">
                              <img src={msg.previewUrl} alt={msg.fileName} className="chat-image-preview" />
                              <div className="chat-image-name">{msg.fileName}</div>
                            </div>
                          </div>
                        );
                      }

                        return (
                            <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'is-user' : 'is-bot'}`}>
                                <div className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
                                    {msg.content}
                                    {msg.role === 'bot' && msg.streaming ? (
                                        <span className="streaming-cursor">▍</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                <div className="edit-body">
                    <div className="section">
                        <h3 className="section-title">
                            <Sliders className="icon" /> 기본 보정
                        </h3>
                        <div className="section-group">
                            <label className="section-label">밝기 {brightness}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={brightness}
                                onChange={e => setBrightness(Number(e.target.value))}
                                className="slider"
                            />
                            <label className="section-label">대비 {contrast}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={contrast}
                                onChange={e => setContrast(Number(e.target.value))}
                                className="slider"
                            />
                            <label className="section-label">채도 {saturation}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={saturation}
                                onChange={e => setSaturation(Number(e.target.value))}
                                className="slider"
                            />
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">프리셋</h3>
                        <div className="preset-grid">
                            {['Vivid', 'B&W', 'Vintage', 'Cool', 'Warm', 'Film'].map(name => (
                                <button key={name} type="button" className="preset-btn">
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="button" className="apply-btn">적용하기</button>
                </div>
            )}

            <form
              className="chat-input-area"
              onSubmit={handleSendMessage}
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
            >
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder={isStreaming ? 'AI가 답변 중...' : '입력하세요...'}
                        className="chat-input"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        disabled={isStreaming}
                    />
                    <button type="submit" className="send-btn" disabled={isStreaming}>
                        <Send className="icon" />
                        전송
                    </button>
                </div>
            </form>
        </aside>
    );
}