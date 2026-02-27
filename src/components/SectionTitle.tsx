import React from 'react';

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    className?: string;
    align?: 'left' | 'center';
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className, align = 'left' }) => {
    const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

    return (
        <div className={`flex flex-col mb-12 ${alignClass} ${className || ''}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-neon-green/50"></div>
                <span className="text-neon-green text-xs font-black tracking-[0.4em] uppercase">
                    VibeGuard Protocol
                </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-4">
                {title.split(' ').map((word, i) => (
                    <React.Fragment key={i}>
                        {i % 2 === 1 ? <span className="text-soft-cyan">{word} </span> : word + ' '}
                    </React.Fragment>
                ))}
            </h2>
            {subtitle && (
                <p className="text-gray-400 text-lg max-w-2xl font-medium leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default SectionTitle;
