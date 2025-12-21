import React, { useState } from 'react';
import './App.css'; 

type TabType = 'search' | 'edit';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('search'); 

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">PHOMATE</div>
        <ul className="nav-menu">
          <li className="nav-item active">
            <span>🏠</span> HOME
          </li>
          <li className="nav-item">
            <span>📤</span> UPROAD
          </li>
          <li className="nav-item">
            <span>👤</span> PROFILE
          </li>
          <li className="nav-item">
            <span>⚙️</span> SETTING
          </li>
        </ul>
      </nav>

      <main className="main-feed">
        <div className="feed-header">
          <h2>PHOMATE</h2>
        </div>
      </main>

      <aside className="right-panel">
        <div className="chat-header">
          <div 
            className={`chat-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            검색
          </div>
          <div 
            className={`chat-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            편집
          </div>
          <div className="close-btn-area">
            ✕
          </div>
        </div>

        <div className="chat-body">
          <div className="message-bubble message-bot">
            사진에 대한 설명을 적어주세요.
          </div>
          
          <button className="action-button">
            사진 설명
          </button>
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <input type="text" placeholder="입력하세요..." className="chat-input" />
            <button className="send-btn">전송</button>
          </div>
        </div>
      </aside>
    </div>
  );
}