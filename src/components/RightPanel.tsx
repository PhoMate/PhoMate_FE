import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Search, Edit3, Undo, Redo, Save } from 'lucide-react';
import '../styles/RightPanel.css';

// API
import { startChatSession, streamChatSearch } from '../api/chat';
import { 
    startEditSession, 
    sendChatEdit, 
    undoEdit, 
    redoEdit, 
    finalizeEdit, 
    uploadDirectEdit 
} from '../api/edit';

// Components & Types
import DirectEditor from './DirectEditor';
import { PhotoDetail } from '../types';

// --- Types ---
type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    selectedPhoto?: PhotoDetail | null;
    onUpdatePhoto?: (newUrl: string) => void;
};

type TabType = 'search' | 'edit';

type Message =
    | { id: string; role: 'user' | 'bot'; content: string; streaming?: boolean; type: 'text' }
    | { id: string; role: 'user'; type: 'image'; fileName: string; previewUrl: string };

// --- Sub Component: 메시지 렌더링 (분리함) ---
const MessageItem = ({ msg }: { msg: Message }) => {
    const isUser = msg.role === 'user';
    
    return (
        <div className={`message-row ${isUser ? 'is-user' : 'is-bot'}`}>
            <div className={`message-bubble ${isUser ? 'message-user' : 'message-bot'}`}>
                {msg.type === 'text' ? (
                    <>
                        {msg.content}
                        {msg.role === 'bot' && msg.streaming && <span className="streaming-cursor">▍</span>}
                    </>
                ) : (
                    <div className="image-msg-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img 
                            src={msg.previewUrl} 
                            alt={msg.fileName} 
                            className="chat-image-preview" 
                            style={{ maxWidth: '100px', borderRadius: '4px' }} 
                        />
                        <span style={{ fontSize: '12px', marginTop: '4px' }}>{msg.fileName}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
export default function RightPanel({ isOpen, onClose, selectedPhoto, onUpdatePhoto }: RightPanelProps) {
    // 1. UI State
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [inputMessage, setInputMessage] = useState('');
    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    // 2. Chat & Search State
    const [messages, setMessages] = useState<Message[]>([
        { id: 'm-1', role: 'bot', content: '무엇을 도와드릴까요?', streaming: false, type: 'text' },
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);

    // 3. Edit State
    const [editSessionId, setEditSessionId] = useState<number | null>(null);
    const [editChatSessionId, setEditChatSessionId] = useState<number | null>(null);
    const [currentEditUrl, setCurrentEditUrl] = useState<string | null>(null);
    const [isDirectEditing, setIsDirectEditing] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // --- Effects ---

    // 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTab]);

    useEffect(() => {
        if (selectedPhoto) {
            setActiveTab('edit');
        }
    }, [selectedPhoto]);

    // 편집 탭 진입 시 세션 초기화
    useEffect(() => {
        if (activeTab === 'edit' && selectedPhoto && !editSessionId) {
            initializeEditSession();
        }
    }, [activeTab, selectedPhoto]);

    const initializeEditSession = async () => {
        if (!selectedPhoto) return;
        try {
            setIsEditLoading(true);
            // 편집 세션 생성
            const editRes = await startEditSession(Number(selectedPhoto.id));
            setEditSessionId(editRes.editSessionId);
            setCurrentEditUrl(selectedPhoto.originalUrl || selectedPhoto.thumbnailUrl);

            // 편집용 챗 세션 생성 (데모용 임시 ID 사용)
            // const chatRes = await startChatSession(); 
            // setEditChatSessionId(chatRes.chatSessionId);
            setEditChatSessionId(999); 
        } catch (e) {
            console.error(e);
            alert('편집 세션을 시작할 수 없습니다.');
        } finally {
            setIsEditLoading(false);
        }
    };

    // --- Handlers ---

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isStreaming || isEditLoading) return;

        // 유저 메시지 추가
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            streaming: false,
            type: 'text',
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        if (activeTab === 'edit') {
            await processEditMessage(text);
        } else {
            await processSearchMessage(text);
        }
    };

    // [Logic] 편집 모드 메시지 처리 (AI 수정)
    const processEditMessage = async (text: string) => {
        if (!editSessionId || !editChatSessionId) return;

        setIsEditLoading(true);
        const botMsgId = crypto.randomUUID();
        
        // 봇 로딩 메시지 추가
        setMessages(prev => [...prev, {
            id: botMsgId, role: 'bot', content: 'AI가 이미지를 수정 중입니다...', streaming: true, type: 'text'
        }]);

        try {
            const res = await sendChatEdit(editChatSessionId, editSessionId, text);
            setCurrentEditUrl(res.editedUrl); // 이미지 업데이트
            
            // 봇 응답 업데이트
            setMessages(prev => prev.map(m => m.id === botMsgId ? {
                ...m, content: res.assistantContent || '수정이 완료되었습니다.', streaming: false
            } : m));
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m => m.id === botMsgId ? {
                ...m, content: '수정 중 오류가 발생했습니다.', streaming: false
            } : m));
        } finally {
            setIsEditLoading(false);
        }
    };

    // [Logic] 검색 모드 메시지 처리 (스트리밍)
    const processSearchMessage = async (text: string) => {
        setIsStreaming(true);
        const botMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: botMessageId, role: 'bot', content: '', streaming: true, type: 'text' }]);

        try {
            let newSessionId = chatSessionId;
            
            // 첫 메시지일 때만 세션 생성
            if (!chatSessionId) {
                const res = await startChatSession({ message: '' });
                newSessionId = res.sessionId;
                setChatSessionId(res.sessionId);
            }

            if (newSessionId) {
                // 스트리밍으로 메시지 전송
                let fullText = '';
                streamChatSearch(
                    { sessionId: newSessionId, message: text },
                    {
                        onDelta: (delta) => {
                            fullText += delta;
                            setMessages(prev => prev.map(m => 
                                m.id === botMessageId 
                                    ? { ...m, content: fullText, streaming: true } 
                                    : m
                            ));
                        },
                        onResult: (result) => console.log(result),
                        onError: (err) => {
                            console.error('Stream error:', err);
                            setIsStreaming(false);
                        },
                        onComplete: () => {
                            setMessages(prev => prev.map(m => 
                                m.id === botMessageId 
                                    ? { ...m, streaming: false } 
                                    : m
                            ));
                            setIsStreaming(false);
                        }
                    }
                );
            }
        } catch (err) {
            console.error('Search message error:', err);
            setMessages(prev => prev.map(m => 
                m.id === botMessageId 
                    ? { ...m, content: '오류가 발생했습니다.', streaming: false } 
                    : m
            ));
            setIsStreaming(false);
        }
    };

    // [Logic] 편집 도구 핸들러
    const handleUndo = async () => {
        if (!editSessionId) return;
        try {
            const res = await undoEdit(editSessionId);
            setCurrentEditUrl(res.imageUrl);
        } catch (e) { alert('이전 단계가 없습니다.'); }
    };

    const handleRedo = async () => {
        if (!editSessionId) return;
        try {
            const res = await redoEdit(editSessionId);
            setCurrentEditUrl(res.imageUrl);
        } catch (e) { alert('다음 단계가 없습니다.'); }
    };

    const handleFinalize = async () => {
        if (!editSessionId) return;
        try {
            const res = await finalizeEdit(editSessionId);
            if (onUpdatePhoto) onUpdatePhoto(res.finalUrl);
            alert('저장되었습니다.');
            onClose();
        } catch (e) { alert('저장 실패'); }
    };

    const handleDirectEditSave = async (file: File) => {
        if (!editSessionId) return;
        try {
            setIsEditLoading(true);
            const res = await uploadDirectEdit(editSessionId, file);
            setCurrentEditUrl(res.imageUrl);
            setIsDirectEditing(false);
        } catch (e) {
            alert('업로드 실패');
        } finally {
            setIsEditLoading(false);
        }
    };

    // --- Render ---
    return (
        <>
            <aside className={panelClass} aria-hidden={!isOpen}>
                {/* 1. Header */}
                <div className="chat-header">
                    <div className="tab-buttons">
                        <button
                            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => handleTabChange('search')}
                        >
                            <Search className="icon" /> <span>검색</span>
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
                            onClick={() => handleTabChange('edit')}
                        >
                            <Edit3 className="icon" /> <span>편집</span>
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose}><X className="icon" /></button>
                </div>

                {/* 2. Content Body */}
                {activeTab === 'search' ? (
                    // --- Search Tab ---
                    <div className="chat-body">
                        {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    // --- Edit Tab ---
                    <div className="edit-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Preview Area */}
                        <div className="edit-preview-area" style={{ flex: 1, position: 'relative', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isEditLoading && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                    처리 중...
                                </div>
                            )}
                            {currentEditUrl ? (
                                <img src={currentEditUrl} alt="Editing" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ color: '#888' }}>편집할 이미지가 없습니다.</div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="edit-controls" style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                            <button onClick={handleUndo} className="control-btn" title="실행 취소"><Undo size={20} /></button>
                            <button onClick={handleRedo} className="control-btn" title="다시 실행"><Redo size={20} /></button>
                            <div style={{ width: '1px', background: '#ddd', margin: '0 8px' }}></div>
                            <button 
                                onClick={() => setIsDirectEditing(true)} 
                                className="control-btn" 
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                                <Edit3 size={16} /> 직접 편집
                            </button>
                        </div>
                        
                        {/* Chat Log for Edit */}
                        <div className="chat-body" style={{ flex: 1, minHeight: '150px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Save Button */}
                        <button onClick={handleFinalize} className="apply-btn" style={{ marginTop: 'auto' }}>
                            <Save size={16} style={{ marginRight: '8px' }}/> 저장 및 종료
                        </button>
                    </div>
                )}

                {/* 3. Input Area */}
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            placeholder={activeTab === 'edit' ? "AI에게 수정 요청 (예: 배경 지워줘)" : "무엇이든 물어보세요..."}
                            className="chat-input"
                            value={inputMessage}
                            onChange={e => setInputMessage(e.target.value)}
                            disabled={isStreaming || isEditLoading}
                        />
                        <button type="submit" className="send-btn" disabled={isStreaming || isEditLoading}>
                            <Send className="icon" /> 전송
                        </button>
                    </div>
                </form>
            </aside>

            {/* Direct Editor Modal */}
            {isDirectEditing && currentEditUrl && (
                <DirectEditor
                    imageUrl={currentEditUrl}
                    onSave={handleDirectEditSave}
                    onCancel={() => setIsDirectEditing(false)}
                />
            )}
        </>
    );
}