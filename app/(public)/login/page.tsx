'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('로그인 시도:', { email, password });
    // TODO: 실제 로그인 로직 연결
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '360px',
        padding: '24px 20px',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <h1 style={{ marginBottom: '16px' }}>로그인</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#111',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}
