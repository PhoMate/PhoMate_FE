// app/(main)/layout.tsx

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '220px 1fr 320px', // 사이드바 / 메인 / AI 패널
      }}
    >
      {/* 왼쪽 사이드바 자리 */}
      <aside style={{ borderRight: '1px solid #ddd', padding: '16px' }}>
        <h2>Phomate</h2>
        <p>사이드바 (nav 자리)</p>
      </aside>

      {/* 가운데 메인 콘텐츠 */}
      <main style={{ padding: '16px' }}>{children}</main>

      {/* 오른쪽 AI 패널 자리 */}
      <aside style={{ borderLeft: '1px solid #ddd', padding: '16px' }}>
        <h3>AI 패널</h3>
        <p>검색/편집 UI가 들어갈 자리입니다.</p>
      </aside>
    </div>
  );
}
