// app/(main)/profile/[username]/page.tsx

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  return (
    <>
      <h1>Profile: {username}</h1>
      <p>유저 정보와 이 유저가 올린 사진 리스트가 들어갈 예정입니다.</p>
    </>
  );
}
