import React, { useState, useEffect } from 'react';
import { X, Heart, Wand2, Search } from 'lucide-react';
import { PhotoDetail } from '../types';
import '../styles/PhotoDetailModal.css';

type PhotoDetailModalProps = {
    photo: PhotoDetail | null;
    isOpen: boolean;
    onClose: () => void;
    onAiEdit?: (photo: PhotoDetail) => void;
    onAiSearch?: (photo: PhotoDetail) => void;
};

export default function PhotoDetailModal({
    photo,
    isOpen,
    onClose,
    onAiEdit,
    onAiSearch,
}: PhotoDetailModalProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(photo?.likeCount || 0);

    if (!isOpen || !photo) return null;

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button className="modal-close-btn" onClick={onClose}>
                    <X className="icon" />
                </button>

                {/* Photo Viewer */}
                <div className="modal-content">
                    <div className="photo-viewer">
                        <img
                            src={photo.originalUrl}
                            alt={photo.title}
                            className="photo-image"
                        />
                    </div>

                    {/* Photo Meta */}
                    <div className="photo-meta">
                        <div className="meta-header">
                            <h2 className="photo-title">{photo.title}</h2>
                            <button
                                className={`like-btn ${isLiked ? 'liked' : ''}`}
                                onClick={handleLike}
                            >
                                <Heart className="icon" />
                                <span>{likeCount}</span>
                            </button>
                        </div>

                        {photo.description && (
                            <p className="photo-description">{photo.description}</p>
                        )}

                        <div className="meta-info">
                            {photo.uploadedBy && (
                                <div className="meta-item">
                                    <span className="meta-label">업로더:</span>
                                    <span className="meta-value">{photo.uploadedBy}</span>
                                </div>
                            )}
                            {photo.createdAt && (
                                <div className="meta-item">
                                    <span className="meta-label">업로드 날짜:</span>
                                    <span className="meta-value">
                                        {new Date(photo.createdAt).toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* AI Action Buttons */}
                        <div className="action-buttons">
                            <button
                                className="action-btn ai-edit-btn"
                                onClick={() => onAiEdit?.(photo)}
                            >
                                <Wand2 className="icon" />
                                <span>AI 편집</span>
                            </button>
                            <button
                                className="action-btn ai-search-btn"
                                onClick={() => onAiSearch?.(photo)}
                            >
                                <Search className="icon" />
                                <span>유사 사진 찾기</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}