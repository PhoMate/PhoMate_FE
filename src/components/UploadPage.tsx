import React, { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { post } from '../api/apiClient';
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
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, '/');

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
        if (!selectedFile) return alert("사진을 업로드해주세요!");
        if (!title) return alert("제목을 입력해주세요!");

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('image', selectedFile);

            await post('/api/posts', formData);
            
            alert("게시글이 성공적으로 등록되었습니다!");
            
            onUploadSuccess(); 
            
        } catch (error) {
            console.error("업로드 실패:", error);
            alert("업로드 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={`upload-page ${isPanelOpen ? 'with-panel' : ''}`}>
            <div className="upload-container">
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
                        <button className="submit-btn" onClick={handleSubmit}>
                            업로드
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}