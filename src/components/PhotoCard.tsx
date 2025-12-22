import React from 'react';
import { Heart } from 'lucide-react';
import { Photo } from '../types';
import '../styles/PhotoCard.css';

type PhotoCardProps = {
    photo: Photo;
    onClick?: (photo: Photo) => void;
};

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
    return (
        <div
            className="photo-card"
            onClick={() => onClick?.(photo)}
        >
            <div className="photo-card-image">
                <img
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    loading="lazy"
                />
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