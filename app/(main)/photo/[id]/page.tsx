// app/photo/[id]/page.tsx

type PhotoPageProps = {
  params: {
    id: string;
  };
};

export default function PhotoDetailPage({ params }: PhotoPageProps) {
  const { id } = params;

  // TODO: id를 이용해 서버에서 사진 상세 정보 가져오기
  return (
    <main style={{ padding: '16px' }}>
      <h1>Photo Detail</h1>
      <p>사진 ID: {id}</p>
      <p>여기에 사진 상세 내용(이미지, 제목, 좋아요 등)이 들어갑니다.</p>
    </main>
  );
}
