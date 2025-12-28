import React from 'react';

export type Message =
    | { id: string; role: 'user' | 'bot'; content: string; streaming?: boolean; type: 'text' }
    | { id: string; role: 'user'; type: 'image'; fileName: string; previewUrl: string };

export default function MessageItem({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user';
    
    return (
        <div className={`message-row ${isUser ? 'is-user' : 'is-bot'}`}>
            <div className={`message-bubble ${isUser ? 'message-user' : 'message-bot'}`}>
                {msg.type === 'text' ? (
                    <div className="chat-text">
                        {msg.content}
                        {msg.role === 'bot' && msg.streaming && <span className="streaming-cursor">▍</span>}
                    </div>
                ) : (
                    <div className="image-msg-wrapper">
                        <img src={msg.previewUrl} alt={msg.fileName} className="chat-image-preview" />
                        <span style={{ fontSize: '12px', marginTop: '4px' }}>{msg.fileName}</span>
                    </div>
                )}
            </div>
        </div>
    );
}