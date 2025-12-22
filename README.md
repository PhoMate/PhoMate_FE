# Phomate Frontend

React + Vite 기반 사진 공유 플랫폼 프론트엔드

## 프로젝트 구조

```
src/
├── components/      # React 컴포넌트
├── pages/          # 페이지 컴포넌트
├── api/            # API 함수
├── types/          # TypeScript 타입
├── styles/         # CSS 파일
├── utils/          # 유틸 함수
└── context/        # Context API
```

## 시작하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 열기

### 빌드
```bash
npm run build
```

### 프리뷰
```bash
npm run preview
```

## 주요 기능

- 📸 사진 피드 (무한 스크롤)
- 💬 AI 채팅 (SSE 스트리밍)
- 🔐 Google OAuth 로그인 (PKCE)
- ❤️ 좋아요/저장 기능
- ✏️ 사진 편집 (밝기, 명도, 채도)

## 기술 스택

- **프레임워크**: React 18
- **빌드**: Vite
- **언어**: TypeScript
- **스타일**: CSS3
- **인증**: Google OAuth 2.0 (PKCE)
- **상태관리**: Context API

## 환경변수 설정

`.env` 파일 생성:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
```

## ESLint

TypeScript 프로젝트로 type-aware lint 규칙 적용

```bash
npm run lint
```

## 배포

Vercel 또는 다른 정적 호스팅 서비스에 배포 가능
