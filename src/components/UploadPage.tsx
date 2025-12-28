import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { createPost, updatePost } from '../api/posts'; 
import { PhotoDetail } from '../types';
import '../styles/UploadPage.css';

type UploadPageProps = {
    onUploadSuccess: () => void;
    isPanelOpen?: boolean;
    editData?: PhotoDetail | null; // 수정 시 전달받을 데이터
};

export default function UploadPage({ onUploadSuccess, isPanelOpen = false, editData }: UploadPageProps) {
    const isEditMode = !!editData; // editData가 있으면 수정 모드
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, '/');

    // 수정 모드일 경우 초기 데이터 세팅
    useEffect(() => {
        if (isEditMode && editData) {
            setTitle(editData.title);
            setDescription(editData.description || '');
            setPreviewUrl(editData.thumbnailUrl); // 기존 이미지를 미리보기로 표시
        }
    }, [isEditMode, editData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return alert("제목을 입력해주세요!");
        // 등록 모드일 때만 파일 필수 체크
        if (!isEditMode && !selectedFile) return alert("사진을 업로드해주세요!");
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            
            if (isEditMode && editData) {
                // 1. 게시글 수정 API 호출
                await updatePost(
                    Number(editData.id),
                    { title, description },
                    selectedFile || undefined // 새 파일이 없으면 undefined 전달 (기존 이미지 유지)
                );
                alert("게시글이 성공적으로 수정되었습니다!");
            } else {
                // 2. 새 게시글 등록 API 호출
                await createPost(
                    { title, description }, 
                    selectedFile!
                );
                alert("게시글이 성공적으로 등록되었습니다!");
            }
            
            // 입력 폼 초기화
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            setPreviewUrl(null);

            // 목록 새로고침 및 이동
            onUploadSuccess(); 
            
        } catch (error: any) {
            if (error.message === "401" || error.message === "401_NO_TOKEN") {
                alert("인증이 만료되었습니다. 다시 로그인해 주세요.");
            } else {
                console.error("처리 중 에러 발생:", error);
                alert(`요청 실패: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`upload-page ${isPanelOpen ? 'with-panel' : ''}`}>
            <div className="upload-container">
                <h2 className="upload-page-title">
                    {isEditMode ? "게시글 수정" : "새 게시글 작성"}
                </h2>
                
                <div className="upload-flex-content">
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
                            {isEditMode && (
                                <button 
                                    className="cancel-btn" 
                                    onClick={onUploadSuccess}
                                    disabled={isSubmitting}
                                    style={{ marginRight: '10px', background: '#ccc' }}
                                >
                                    취소
                                </button>
                            )}
                            <button 
                                className="submit-btn" 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "처리 중..." : (isEditMode ? "수정 완료" : "업로드")}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}