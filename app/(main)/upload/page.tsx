// app/(main)/upload/page.tsx

'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('업로드 시도:', { title });
    // TODO: 실제 파일 업로드 + API 연결
  };

  return (
    <>
      <h1>Upload Photo</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="사진 제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          style={{
            width: '160px',
            padding: 10,
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#111',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          업로드
        </button>
      </form>
    </>
  );
}
