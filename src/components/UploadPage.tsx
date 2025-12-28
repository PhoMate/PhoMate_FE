import React, { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { createPost } from '../api/posts'; // 위에서 작성한 API 파일 경로
import '../styles/UploadPage.css';

type UploadPageProps = {
    onUploadSuccess: () => void;
    isPanelOpen?: boolean;
};

export default function UploadPage({ onUploadSuccess, isPanelOpen = false }: UploadPageProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, '/');

    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedFile(file);
        }
    };

    // 드래그 앤 드롭 핸들러
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedFile(file);
        }
    };

    // 업로드 제출 핸들러
    const handleSubmit = async () => {
        if (!selectedFile) return alert("사진을 업로드해주세요!");
        if (!title.trim()) return alert("제목을 입력해주세요!");
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            
            // API 호출 (명세서 규격에 맞춘 데이터 전달)
            await createPost(
                { 
                    title: title, 
                    description: description 
                }, 
                selectedFile
            );
            
            alert("게시글이 성공적으로 등록되었습니다!");
            
            // 입력 폼 초기화
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            setPreviewUrl(null);

            // 목록 새로고침 등 후속 작업 실행
            onUploadSuccess(); 
            
        } catch (error: any) {
            if (error.message === "401" || error.message === "401_NO_TOKEN") {
                alert("인증이 만료되었습니다. 다시 로그인해 주세요.");
            } else {
                console.error("업로드 상세 에러:", error);
                alert(`업로드 실패: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`upload-page ${isPanelOpen ? 'with-panel' : ''}`}>
            <div className="upload-container">
                {/* 왼쪽: 이미지 업로드 영역 */}
                <section 
                    className={`upload-left ${previewUrl ? 'has-image' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/jpg"
                        hidden 
                    />

                    {previewUrl ? (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Preview" className="image-preview" />
                            <button 
                                className="remove-image-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="placeholder-container">
                            <div className="icon-circle">
                                <ImagePlus size={40} color="#aaa" />
                            </div>
                            <span className="upload-text">사진 업로드</span>
                            <span className="upload-subtext">JPG, PNG 파일 지원</span>
                        </div>
                    )}
                </section>

                {/* 오른쪽: 정보 입력 영역 */}
                <section className="upload-right">
                    <div className="form-group">
                        <input 
                            type="text" 
                            className="input-title" 
                            placeholder="제목" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <div className="input-date">{today}</div>
                    </div>

                    <div className="form-group grow">
                        <textarea 
                            className="input-desc" 
                            placeholder="사진에 대한 설명을 적어주세요."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            className="submit-btn" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "업로드 중..." : "업로드"}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}