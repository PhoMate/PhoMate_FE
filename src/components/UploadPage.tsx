import React, { useState, useRef } from 'react';
import { ImagePlus, X, Upload } from 'lucide-react'; 
import '../styles/UploadPage.css';

export default function UploadPage() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hashtags, setHashtags] = useState('');
    
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, '/');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = () => {
        if (!previewUrl) return alert("사진을 업로드해주세요!");
        if (!title) return alert("제목을 입력해주세요!");

        const uploadData = {
            image: previewUrl,
            title,
            date: today,
            description,
            hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#'))
        };

        console.log("업로드 데이터:", uploadData);
        alert("업로드 완료! (콘솔 확인)");
    };

    return (
        <main className="upload-page">
            <div className="upload-container">

                <section 
                    className={`upload-left ${previewUrl ? 'has-image' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
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
                            <span className="upload-subtext">클릭하거나 파일을 드래그하세요</span>
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
        </main>
    );
}