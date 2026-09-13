import React from 'react';

interface PartnerAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const isAvatarImage = (avatar?: string): boolean => {
  if (!avatar) return false;
  return (
    avatar.startsWith('data:image') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('blob:')
  );
};

export const PartnerAvatar: React.FC<PartnerAvatarProps> = ({
  avatar = '👩🏻',
  name = 'Parceira',
  size = 'md',
  className = '',
}) => {
  const isImage = isAvatarImage(avatar);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[11px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-20 h-20 text-4xl',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none ${sizeClasses} ${className}`}
    >
      {isImage ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span className="leading-none flex items-center justify-center">{avatar}</span>
      )}
    </div>
  );
};
