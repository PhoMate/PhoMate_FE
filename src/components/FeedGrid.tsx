import React from 'react';
import { Photo } from '../types';
import PhotoCard from './PhotoCard';
import '../styles/FeedGrid.css';

type FeedGridProps = {
    photos: Photo[];
    isLoading?: boolean;
    onPhotoClick?: (photo: Photo) => void;
};

export default function FeedGrid({ photos = [], isLoading, onPhotoClick }: FeedGridProps) {
    return (
        <div className="feed-grid">
            {photos.map((photo, idx) => (
                <PhotoCard
                    key={photo.id ?? `${photo.title ?? 'photo'}-${idx}`}
                    photo={photo}
                    onClick={onPhotoClick}
                />
            ))}
            {isLoading && (
                <div className="loading-item">
                    <div className="spinner" />
                </div>
            )}
        </div>
    );
}