import React from 'react';
import { Heart, Edit2, Trash2 } from 'lucide-react';
import { Photo } from '../types';
import '../styles/PhotoCard.css';

type PhotoCardProps = {
    photo: Photo;
    onClick?: (photo: Photo) => void;
    isMe?: boolean;               
    onEditClick?: (photo: Photo) => void;    
    onDeleteClick?: (photo: Photo) => void;
};

export default function PhotoCard({ photo, onClick, isMe, onEditClick, onDeleteClick }: PhotoCardProps) {
    
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditClick?.(photo);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick?.(photo);
    };

    return (
        <div className="photo-card" onClick={() => onClick?.(photo)}>
            <div className="photo-card-image">
                <img
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    loading="lazy"
                />
                
                {isMe && (
                    <div className="photo-card-actions">
                        <button className="action-btn edit" onClick={handleEdit} title="수정">
                            <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={handleDelete} title="삭제">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
            <div className="photo-card-info">
                <h3 className="photo-card-title">{photo.title}</h3>
                <div className="photo-card-meta">
                    <Heart className="icon" />
                    <span>{photo.likeCount}</span>
                </div>
            </div>
        </div>
    );
}