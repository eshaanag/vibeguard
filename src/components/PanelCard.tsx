import React from 'react';

interface PanelCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: 'green' | 'cyan';
}

const PanelCard: React.FC<PanelCardProps> = ({ children, className, glowColor = 'green' }) => {
    return (
        <div className={`tech-panel ${className || ''}`}>
            <div className="p-6 md:p-8">
                {children}
            </div>
        </div>
    );
};

export default PanelCard;
