import React, { useState, useEffect } from 'react';
import { X, Heart, Wand2, Search, Save } from 'lucide-react';
import { PhotoDetail } from '../types';
import { togglePhotoLike, savePhoto } from '../api/photos';
import '../styles/PhotoDetailModal.css';

type PhotoDetailModalProps = {
    photo: PhotoDetail | null;
    isOpen: boolean;
    onClose: () => void;
    onAiEdit?: (photo: PhotoDetail) => void;
    onAiSearch?: (photo: PhotoDetail) => void;
    currentMemberId?: string; // 추가
};

export default function PhotoDetailModal({
    photo,
    isOpen,
    onClose,
    onAiEdit,
    onAiSearch,
    currentMemberId,
}: PhotoDetailModalProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(photo?.likeCount || 0);

    if (!isOpen || !photo) return null;

    const handleLike = async () => {
        if (!photo) return;
        // API가 준비되면 서버 연동
        if (currentMemberId) {
            try {
                const res = await togglePhotoLike(currentMemberId, photo.id);
                setIsLiked(res.liked);
                setLikeCount(res.likeCount);
                return;
            } catch {
                // 실패 시 로컬 토글로 폴백
            }
        }
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    };

    const handleSave = async () => {
        if (!photo) return;

        // 서버 저장 우선 (memberId가 있으면)
        if (currentMemberId) {
            try {
                await savePhoto(currentMemberId, {
                    originalUrl: photo.originalUrl,
                    thumbnailUrl: photo.thumbnailUrl,
                    title: photo.title,
                });
                alert('사진이 저장되었습니다.');
                return;
            } catch (e) {
                // 서버 실패 시 로컬 다운로드로 폴백
            }
        }

        // 로컬 다운로드 폴백
        try {
            const resp = await fetch(photo.originalUrl);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${photo.title || 'photo'}.jpg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            alert('사진 저장에 실패했습니다.');
        }
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

                        {/* AI Action Buttons + 저장 */}
                        <div className="action-buttons action-buttons--three">
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
                            <button
                                className="action-btn save-btn"
                                onClick={handleSave}
                            >
                                <Save className="icon" />
                                <span>사진 저장</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}