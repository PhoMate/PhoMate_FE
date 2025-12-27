import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getMyFollowList, toggleFollow } from '../api/follow'; 
import '../styles/FollowPage.css';

export type FollowUser = {
    id: string;        
    name: string;
    profileUrl: string;
    isFollowed: boolean; 
};

type FollowPageProps = {
    onBack: () => void;
    onUserClick: (user: FollowUser) => void;
};

export default function FollowPage({ onBack, onUserClick }: FollowPageProps) {
    const [users, setUsers] = useState<FollowUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFollows = async () => {
            try {
                const data = await getMyFollowList();
                
                const mappedUsers: FollowUser[] = data.map(member => ({
                    id: String(member.memberId), 
                    name: member.nickname,
                    profileUrl: member.profileImageUrl,
                    isFollowed: true 
                }));
                
                setUsers(mappedUsers);
            } catch (err) {
                console.error(err);
                alert('팔로우 목록을 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchFollows();
    }, []);

    const handleToggleInList = async (e: React.MouseEvent, user: FollowUser) => {
        e.stopPropagation(); 
        
        const previousState = [...users];
        setUsers(prev => prev.map(u => 
            u.id === user.id ? { ...u, isFollowed: !u.isFollowed } : u
        ));

        try {
            const result = await toggleFollow(Number(user.id));
            setUsers(prev => prev.map(u => 
                u.id === user.id ? { ...u, isFollowed: result.followed } : u
            ));
        } catch (err) {
            console.error(err);
            setUsers(previousState); 
        }
    };

    if (loading) return <div style={{ padding: 20 }}>로딩 중...</div>;

    return (
        <main className="follow-page">
            <div className="follow-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h2>팔로우 목록</h2>
            </div>

            <div className="follow-grid">
                {users.map(user => (
                    <div 
                        key={user.id} 
                        className="follow-user-card"
                        onClick={() => onUserClick(user)} 
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="user-avatar-wrapper">
                            <img src={user.profileUrl} alt={user.name} className="user-avatar" />
                        </div>
                        <span className="user-name">{user.name}</span>
                        
                        <button 
                            className="follow-btn" 
                            onClick={(e) => handleToggleInList(e, user)}
                            style={{
                                position: 'relative', zIndex: 10,
                                backgroundColor: user.isFollowed ? '#e0e0e0' : '#0095f6',
                                color: user.isFollowed ? '#333' : '#fff'
                            }}
                        >
                            {user.isFollowed ? '팔로잉' : '팔로우'}
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}