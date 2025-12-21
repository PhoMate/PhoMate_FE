import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Search, Edit3, Sliders } from 'lucide-react';
import '../styles/RightPanel.css';

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
    const streamTimerRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    // 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 스트리밍 시뮬레이션
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

    const handleSendMessage = (e: React.FormEvent) => {
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

        // ✅ 백엔드 연결 대비
        // const response = await sendChatMessage(text);
        // simulateStream(botMessageId, response);
        
        // 현재는 로컬 시뮬레이션
        const fakeResponse = '요청을 받았어요. 곧 도와드릴게요!';
        simulateStream(botMessageId, fakeResponse);
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

    // 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
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