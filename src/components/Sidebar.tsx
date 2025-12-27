import React from 'react';
import '../styles/Sidebar.css';

type SidebarProps = {
	activeNav?: string;
	onNavClick?: (item: string) => void;
	onLogout?: () => void;
};

export default function Sidebar({ activeNav = 'home', onNavClick, onLogout }: SidebarProps) {
	const navItems = [
		{ id: 'home', label: 'HOME', icon: '🏠' },
		{ id: 'upload', label: 'UPLOAD', icon: '📤' },
		{ id: 'profile', label: 'PROFILE', icon: '👤' }
	];

	return (
		<nav className="sidebar">
			<div className="logo">PHOMATE</div>
			<ul className="nav-menu">
				{navItems.map(item => (
					<li
						key={item.id}
						className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
						onClick={() => onNavClick?.(item.id)}
					>
						<span>{item.icon}</span>
						<span>{item.label}</span>
					</li>
				))}
			</ul>
			<button className="logout-btn" onClick={onLogout}>
				로그아웃
			</button>
		</nav>
	);
}