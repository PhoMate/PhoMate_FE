import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Undo, Redo } from 'lucide-react';
import '../styles/RightPanel.css';

import { startChatSession, streamChatSearch } from '../api/chat';
import { 
    startEditSession, 
    sendChatEdit, 
    undoEdit, 
    redoEdit, 
    finalizeEdit, 
    uploadDirectEdit 
} from '../api/edit';

import DirectEditor from './DirectEditor';
import { PhotoDetail } from '../types';

type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    isGuest?: boolean;
    selectedPhoto?: PhotoDetail | null;
    onUpdatePhoto?: (newUrl: string) => void;
};

type TabType = 'search' | 'edit';

type Message =
    | { id: string; role: 'user' | 'bot'; content: string; streaming?: boolean; type: 'text' }
    | { id: string; role: 'user'; type: 'image'; fileName: string; previewUrl: string };

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
                    <div className="image-msg-wrapper">
                        <img 
                            src={msg.previewUrl} 
                            alt={msg.fileName} 
                            className="chat-image-preview" 
                        />
                        <span style={{ fontSize: '12px', marginTop: '4px' }}>{msg.fileName}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function RightPanel({ isOpen, onClose, isGuest = false, selectedPhoto, onUpdatePhoto }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [inputMessage, setInputMessage] = useState('');
    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    const [messages, setMessages] = useState<Message[]>([
        { id: 'm-1', role: 'bot', content: '무엇을 도와드릴까요?', streaming: false, type: 'text' },
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [chatSessionId, setChatSessionId] = useState<number | null>(null);

    const [editSessionId, setEditSessionId] = useState<number | null>(null);
    const [editChatSessionId, setEditChatSessionId] = useState<number | null>(null);
    const [currentEditUrl, setCurrentEditUrl] = useState<string | null>(null);
    const [isDirectEditing, setIsDirectEditing] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTab]);

    useEffect(() => {
        if (selectedPhoto) {
            setActiveTab('edit');
        }
    }, [selectedPhoto]);

    useEffect(() => {
        if (activeTab === 'edit' && selectedPhoto && !editSessionId) {
            initializeEditSession();
        }
    }, [activeTab, selectedPhoto]);

    const initializeEditSession = async () => {
        if (!selectedPhoto) return;
        try {
            setIsEditLoading(true);
            const editRes = await startEditSession(Number(selectedPhoto.id));
            setEditSessionId(editRes.editSessionId);
            setCurrentEditUrl(selectedPhoto.originalUrl || selectedPhoto.thumbnailUrl);
            setEditChatSessionId(999); 
        } catch (e) {
            console.error(e);
            alert('편집 세션을 시작할 수 없습니다.');
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isStreaming || isEditLoading) return;

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

    const processEditMessage = async (text: string) => {
        if (!editSessionId || !editChatSessionId) return;

        setIsEditLoading(true);
        const botMsgId = crypto.randomUUID();
        
        setMessages(prev => [...prev, {
            id: botMsgId, role: 'bot', content: 'AI가 이미지를 수정 중입니다...', streaming: true, type: 'text'
        }]);

        try {
            const res = await sendChatEdit(editChatSessionId, editSessionId, text);
            setCurrentEditUrl(res.editedUrl);
            
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

    const processSearchMessage = async (text: string) => {
        const token = localStorage.getItem('accessToken');
        if (isGuest || !token) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content: '로그인 후 사용할 수 있습니다.', streaming: false, type: 'text' }]);
            return;
        }

        setIsStreaming(true);
        const botMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: botMessageId, role: 'bot', content: '', streaming: true, type: 'text' }]);

        let fullText = '';
        let abort: (() => void) | undefined;
        let lastUpdateTime = Date.now();
        
        const timeoutId = window.setTimeout(() => {
            console.warn('Stream timeout after 60s');
            abort?.();
            setMessages(prev => prev.map(m =>
                m.id === botMessageId ? { 
                    ...m, 
                    streaming: false, 
                    content: fullText || '응답 시간이 초과되었습니다.' 
                } : m
            ));
            setIsStreaming(false);
        }, 60000);

        try {
            let newSessionId = chatSessionId;
            if (!chatSessionId) {
                console.log('Creating new session...');
                const res = await startChatSession();
                console.log('Session created:', res);
                
                if (typeof res === 'number') {
                    newSessionId = res;
                } else {
                    newSessionId = res.sessionId || res.chatSessionId || res;
                }
                setChatSessionId(newSessionId);
            }

            if (!newSessionId) throw new Error('세션 생성 실패');

            console.log('Starting stream with session:', newSessionId);
            let chunkCount = 0;

            abort = streamChatSearch(
                { chatSessionId: newSessionId, userText: text },
                {
                    onDelta: (delta) => {
                        chunkCount++;
                        lastUpdateTime = Date.now();
                        fullText += delta;
                        console.log(`Chunk ${chunkCount}:`, delta.substring(0, 50));
                        
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { ...m, content: fullText, streaming: true } : m
                        ));
                    },
                    onResult: (result) => {
                        console.log('Search result received:', result);
                    },
                    onError: (err) => {
                        clearTimeout(timeoutId);
                        const elapsedTime = Date.now() - lastUpdateTime;
                        console.error('Stream error after', elapsedTime, 'ms:', err);
                        console.log('Received chunks:', chunkCount);
                        console.log('Full text so far:', fullText);
                        
                        const errorMsg = fullText 
                            ? fullText + '\n\n(연결이 중단되었습니다)'
                            : '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
                        
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { ...m, streaming: false, content: errorMsg } : m
                        ));
                        setIsStreaming(false);
                    },
                    onComplete: () => {
                        clearTimeout(timeoutId);
                        console.log('Stream completed. Total chunks:', chunkCount);
                        console.log('Final text length:', fullText.length);
                        
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { 
                                ...m, 
                                streaming: false, 
                                content: fullText || '응답을 받지 못했습니다.' 
                            } : m
                        ));
                        setIsStreaming(false);
                    }
                }
            );
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Error in processSearchMessage:', err);
            setMessages(prev => prev.map(m =>
                m.id === botMessageId ? { 
                    ...m, 
                    streaming: false, 
                    content: `오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}` 
                } : m
            ));
            setIsStreaming(false);
        }
    };

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
            if (onUpdatePhoto) onUpdatePhoto(res.imageUrl);
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

    return (
        <>
            <aside className={panelClass} aria-hidden={!isOpen}>
                <div className="chat-header">
                    <div className="tab-buttons">
                        <button
                            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => handleTabChange('search')}
                        >
                            검색
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
                            onClick={() => handleTabChange('edit')}
                        >
                            편집
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="panel-content-wrapper">
                    {activeTab === 'search' ? (
                        <div className="chat-body">
                            {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="edit-body">
                            <div className="edit-preview-area">
                                {isEditLoading && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        처리 중...
                                    </div>
                                )}
                                {currentEditUrl ? (
                                    <img src={currentEditUrl} alt="Editing" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ color: '#aaa' }}>편집할 이미지가 없습니다.</div>
                                )}
                            </div>

                            <div className="edit-controls">
                                <button onClick={handleUndo} className="control-btn" title="Undo"><Undo size={18} /></button>
                                <button onClick={handleRedo} className="control-btn" title="Redo"><Redo size={18} /></button>
                                <button onClick={() => setIsDirectEditing(true)} className="control-btn" style={{ fontSize: '13px' }}>
                                    직접 편집
                                </button>
                            </div>
                            
                            <div className="chat-body" style={{ padding: 0, background: 'none' }}>
                                {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                                <div ref={messagesEndRef} />
                            </div>

                            <button onClick={handleFinalize} className="apply-btn">
                                저장 및 종료
                            </button>
                        </div>
                    )}

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder={activeTab === 'edit' ? "사진에 대한 설명을 적어주세요." : "검색어를 입력하세요."}
                                className="chat-input"
                                value={inputMessage}
                                onChange={e => setInputMessage(e.target.value)}
                                disabled={isStreaming || isEditLoading}
                            />
                            <button type="submit" className="send-btn" disabled={isStreaming || isEditLoading}>
                                전송
                            </button>
                        </div>
                    </form>
                </div>
            </aside>

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