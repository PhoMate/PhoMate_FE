import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo } from 'lucide-react';
import { 
    startEditSession, sendChatEdit, undoEdit, redoEdit, finalizeEdit, uploadDirectEdit 
} from '../../api/edit';
import DirectEditor from '../DirectEditor';
import { Message, MessageItem } from './MessageItem';
import { PhotoDetail } from '../../types';

type EditTabProps = {
    selectedPhoto: PhotoDetail;
    onClose: () => void;
    onUpdatePhoto?: (newUrl: string) => void;
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
    const [isDirectEditing, setIsDirectEditing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const initializeEditSession = async () => {
            if (!selectedPhoto || editSessionId) return;
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
        initializeEditSession();
    }, [selectedPhoto]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isEditLoading || !editSessionId || !editChatSessionId) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            streaming: false,
            type: 'text',
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

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
        <div className="panel-content-wrapper">
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

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="사진에 대한 설명을 적어주세요."
                        className="chat-input"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        disabled={isEditLoading}
                    />
                    <button type="submit" className="send-btn" disabled={isEditLoading}>
                        전송
                    </button>
                </div>
            </form>

            {isDirectEditing && currentEditUrl && (
                <DirectEditor
                    imageUrl={currentEditUrl}
                    onSave={handleDirectEditSave}
                    onCancel={() => setIsDirectEditing(false)}
                />
            )}
        </div>
    );
}