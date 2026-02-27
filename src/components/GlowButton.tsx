import React from 'react';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline';
    children: React.ReactNode;
}

const GlowButton: React.FC<GlowButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
    const baseClass = variant === 'primary' ? 'btn-glow' : 'btn-glow btn-outline';

    return (
        <button
            className={`${baseClass} ${className || ''}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default GlowButton;
