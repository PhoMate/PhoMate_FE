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

// 세션 ID 추출 헬퍼 함수
const extractSessionId = (res: any): number | null => {
    if (!res) return null;
    if (typeof res === 'number') return res;
    return res.editSessionId || res.chatSessionId || res.sessionId || res.id || null;
};

export default function EditTab({ selectedPhoto, onClose, onUpdatePhoto }: EditTabProps) {
    // 상태 관리
    const [messages, setMessages] = useState<Message[]>([
        { id: 'm-1', role: 'bot', content: '사진을 어떻게 수정해드릴까요?', streaming: false, type: 'text' },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isEditLoading, setIsEditLoading] = useState(false);
    
    const [editSessionId, setEditSessionId] = useState<number | null>(null);
    const [editChatSessionId, setEditChatSessionId] = useState<number | null>(null);
    const [currentEditUrl, setCurrentEditUrl] = useState<string | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const sessionRef = useRef<number | null>(null); 
    const isSavedRef = useRef(false); 

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 초기화 및 생명주기 관리
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
                    console.log(`✅ 세션 시작: Edit=${extractedEditId}`);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // 🔥 [수정] 403 CORS 에러 때문에 fetch를 포기하고 바로 다운로드 링크를 실행하는 버전
    const handleFinalize = async () => {
        if (!editSessionId) return;
        
        try {
            setIsEditLoading(true);
            isSavedRef.current = true; // 저장 플래그 활성화

            // 1. 서버에 저장 요청
            const res = await finalizeEdit(editSessionId);
            const finalImage = typeof res === 'string' ? res : (res.finalUrl || res.imageUrl);
            
            if (finalImage) {
                if (onUpdatePhoto) onUpdatePhoto(finalImage);

                console.log("다운로드 시도(Direct Link):", finalImage);

                // 2. CORS 문제로 fetch가 불가능하므로, 바로 <a> 태그 생성하여 클릭
                // 주의: CloudFront가 Content-Disposition 헤더를 주지 않으면 새 탭에서 열릴 수 있음
                const link = document.createElement('a');
                link.href = finalImage;
                link.target = "_blank"; // 새 탭에서 열기 (보안 차단 방지)
                link.rel = "noopener noreferrer";
                
                // download 속성은 same-origin(같은 도메인)이 아니면 무시될 수 있음
                // 하지만 최신 브라우저에서 사용자 개입(클릭)으로 간주되면 다운로드가 될 수도 있음
                link.download = `phomate_result.jpg`; 
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 안내 메시지 수정
                alert('저장이 완료되었습니다. (보안 정책으로 인해 새 탭이 열리면 이미지를 우클릭하여 저장해주세요)');
                
                onClose(); 
            }
        } catch (e: any) {
            isSavedRef.current = false; // 실패 시 플래그 복구
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