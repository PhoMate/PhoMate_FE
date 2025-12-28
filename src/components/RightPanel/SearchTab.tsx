import React, { useState, useRef, useEffect } from 'react';
import { startChatSession, streamChatSearch } from '../../api/chat';
import MessageItem, { Message } from './MessageItem';

type SearchTabProps = {
    isGuest: boolean;
};

export default function SearchTab({ isGuest }: SearchTabProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'm-1', role: 'bot', content: '무엇을 도와드릴까요?', streaming: false, type: 'text' },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [chatSessionId, setChatSessionId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        const token = localStorage.getItem('accessToken');
        if (isGuest || !token) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content: '로그인 후 사용할 수 있습니다.', streaming: false, type: 'text' }]);
            return;
        }

        setIsStreaming(true);
        const botMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: botMessageId, role: 'bot', content: '', streaming: true, type: 'text' }]);

        let fullText = '';
        
        try {
            let newSessionId = chatSessionId;
            if (!chatSessionId) {
                const res = await startChatSession();
                newSessionId = typeof res === 'number' ? res : res.chatSessionId;
                setChatSessionId(newSessionId);
            }

            if (!newSessionId) throw new Error('세션 생성 실패');

            const dispatchFeedResults = (payload: any) => {
                try {
                    window.dispatchEvent(new CustomEvent('phomate:search-results', { detail: payload }));
                } catch (e) {
                    console.error('검색 결과 디스패치 실패', e);
                }
            };

            const extractItems = (data: any): any[] => {
                if (!data) return [];
                const candidates = [
                    data.items,
                    data.results,
                    data.data?.items,
                    data.data?.results,
                    data.result?.items,
                    data.posts,
                    data.photos,
                ].filter(Array.isArray);
                if (candidates.length > 0) return candidates[0] as any[];
                if (Array.isArray(data)) return data;
                if (data.postId || data.thumbnailUrl || data.imageUrl || data.id) return [data];
                return [];
            };

            streamChatSearch(
                { chatSessionId: newSessionId, userText: text },
                {
                    onDelta: (delta) => {
                        fullText += delta;
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { ...m, content: fullText, streaming: true } : m
                        ));
                    },
                    onResult: (data: any) => {
                        // 스트림 결과를 메인 피드로 전달
                        const items = extractItems(data);
                        if (items.length > 0) {
                            dispatchFeedResults({ items, query: text });
                            // UI 안내: 결과를 메인 피드에 표시
                            setMessages(prev => prev.map(m =>
                                m.id === botMessageId ? { ...m, streaming: false, content: fullText || '메인 피드에 검색 결과를 표시했습니다.' } : m
                            ));
                            setIsStreaming(false);
                        }
                    },
                    onError: (err) => {
                        console.error(err);
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { ...m, streaming: false, content: fullText || '오류가 발생했습니다.' } : m
                        ));
                        setIsStreaming(false);
                    },
                    onComplete: () => {
                        setMessages(prev => prev.map(m =>
                            m.id === botMessageId ? { ...m, streaming: false, content: fullText || '응답 없음' } : m
                        ));
                        setIsStreaming(false);
                    }
                }
            );
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.map(m =>
                m.id === botMessageId ? { ...m, streaming: false, content: '서버 연결 오류' } : m
            ));
            setIsStreaming(false);
        }
    };

    return (
        <div className="panel-content-wrapper">
            <div className="chat-body">
                {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요."
                        className="chat-input"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        disabled={isStreaming}
                    />
                    <button type="submit" className="send-btn" disabled={isStreaming}>
                        전송
                    </button>
                </div>
            </form>
        </div>
    );
}