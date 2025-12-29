import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo } from 'lucide-react';

import { 
    startEditSession, 
    startChatSession, 
    sendChatEdit, 
    undoEdit, 
    redoEdit, 
    finalizeEdit, 
    deleteEditSession
} from '../../api/edit';
import { PhotoDetail } from '../../types';
import MessageItem, { Message } from './MessageItem';

type EditTabProps = {
    selectedPhoto: PhotoDetail;
    onClose: () => void;
    onUpdatePhoto?: (newUrl: string) => void;
};

const extractSessionId = (res: any): number | null => {
    if (!res) return null;
    if (typeof res === 'number') return res;
    return res.editSessionId || res.chatSessionId || res.sessionId || res.id || null;
};

export default function EditTab({ selectedPhoto, onClose, onUpdatePhoto }: EditTabProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'm-1', role: 'bot', content: '사진을 어떻게 수정해드릴까요?', streaming: false, type: 'text' },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isEditLoading, setIsEditLoading] = useState(false);
    
    const [editSessionId, setEditSessionId] = useState<number | null>(null);
    const [editChatSessionId, setEditChatSessionId] = useState<number | null>(null);
    const [currentEditUrl, setCurrentEditUrl] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const sessionRef = useRef<number | null>(null);
    const isSavedRef = useRef(false); 

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        let isMounted = true;

        const initializeEditSession = async () => {
            if (!selectedPhoto) return;
            
            try {
                setIsEditLoading(true);
                
                const editRes = await startEditSession(Number(selectedPhoto.id));
                const extractedEditId = extractSessionId(editRes);
                if (!extractedEditId) throw new Error("편집 세션 ID 없음");

                const chatRes = await startChatSession();
                const newChatSessionId = extractSessionId(chatRes);
                if (!newChatSessionId) throw new Error("채팅 세션 ID 없음");
                
                if (isMounted) {
                    setEditSessionId(extractedEditId);
                    setEditChatSessionId(newChatSessionId);
                    setCurrentEditUrl(selectedPhoto.originalUrl || selectedPhoto.thumbnailUrl);
                    
                    sessionRef.current = extractedEditId;
                    console.log(`세션 시작: Edit=${extractedEditId}`);
                }

            } catch (e) {
                console.error(e);
                if (isMounted) alert('편집 세션을 시작할 수 없습니다.');
            } finally {
                if (isMounted) setIsEditLoading(false);
            }
        };

        initializeEditSession();

        return () => {
            isMounted = false;
          
            if (!isSavedRef.current && sessionRef.current) {
                console.log(`🗑️ 세션 삭제(초기화): ${sessionRef.current}`);
                deleteEditSession(sessionRef.current).catch(err => console.warn("삭제 실패(이미 없음)", err));
            }
        };
    }, [selectedPhoto.id]); 

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isEditLoading) return;

        if (!editSessionId || !editChatSessionId) {
            alert('세션이 준비되지 않았습니다.');
            return;
        }

        const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text, streaming: false, type: 'text' };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsEditLoading(true);

        try {
            const res = await sendChatEdit(editChatSessionId, editSessionId, text);
            if (res.editedUrl) {
                setCurrentEditUrl(res.editedUrl);
                setMessages(prev => prev.map(m => m.role === 'bot' && m.streaming ? {
                    ...m, content: res.assistantContent || '수정이 완료되었습니다.', streaming: false
                } : m));
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m => m.role === 'bot' && m.streaming ? {
                ...m, content: '오류가 발생했습니다.', streaming: false
            } : m));
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleUndo = async () => {
        if (!editSessionId) return;
        try {
            const res = await undoEdit(editSessionId);
            if (res.imageUrl) setCurrentEditUrl(res.imageUrl);
        } catch (e) { alert('이전 단계가 없습니다.'); }
    };

    const handleRedo = async () => {
        if (!editSessionId) return;
        try {
            const res = await redoEdit(editSessionId);
            if (res.imageUrl) setCurrentEditUrl(res.imageUrl);
        } catch (e) { alert('다음 단계가 없습니다.'); }
    };

    const handleFinalize = async () => {
        if (!editSessionId) return;
        
        try {
            setIsEditLoading(true);
            isSavedRef.current = true;

            const res = await finalizeEdit(editSessionId);
            const finalImage = typeof res === 'string' ? res : (res.finalUrl || res.imageUrl);
            
            if (finalImage) {
                if (onUpdatePhoto) onUpdatePhoto(finalImage);
                console.log("다운로드 시도:", finalImage);

                try {
                    const response = await fetch(finalImage, { 
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-cache' 
                    });

                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                    const blob = await response.blob(); 
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `phomate_result_${Date.now()}.jpg`; 
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);

                    alert('이미지가 기기에 저장되었습니다.');

                } catch (error) {
                    console.warn("Fetch 다운로드 실패, 직접 링크로 전환합니다.", error);
                    
                    const link = document.createElement('a');
                    link.href = finalImage;
                    link.target = "_blank"; 
                    link.download = `phomate_result.jpg`; 
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    alert('저장이 완료되었습니다. (보안 정책으로 인해 새 탭이 열리면 우클릭하여 저장해주세요)');
                }
                
                onClose(); 
            }
        } catch (e: any) {
            isSavedRef.current = false; 
            alert(`저장 실패: ${e.message}`);
        } finally {
            setIsEditLoading(false);
        }
    };

    return (
        <div className="edit-body">
            <div className="edit-preview-area">
                {isEditLoading && (
                    <div className="loading-overlay" style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10, color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        처리 중...
                    </div>
                )}
                {currentEditUrl ? (
                    <img src={currentEditUrl} alt="Editing" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                    <div style={{ color: '#aaa' }}>이미지가 없습니다.</div>
                )}
            </div>

            <div className="edit-controls">
                <button onClick={handleUndo} className="control-btn" title="실행 취소"><Undo size={18} /></button>
                <button onClick={handleRedo} className="control-btn" title="다시 실행"><Redo size={18} /></button>
            </div>
            
            <div className="chat-body" style={{flex:1, overflowY:'auto'}}>
                {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                <div ref={messagesEndRef} />
            </div>

            <button onClick={handleFinalize} className="apply-btn">저장 및 종료</button>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                    <input type="text" className="chat-input" value={inputMessage} onChange={e => setInputMessage(e.target.value)} disabled={isEditLoading} placeholder="메시지 입력..." />
                    <button type="submit" className="send-btn" disabled={isEditLoading}>전송</button>
                </div>
            </form>
        </div>
    );
}