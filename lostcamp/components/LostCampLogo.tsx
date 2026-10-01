import React from 'react';
import logoPng from '../assets/logo.png';

interface LostCampLogoProps {
  className?: string;
  variant?: 'black' | 'white';
  onClick?: () => void;
}

export const LostCampLogo: React.FC<LostCampLogoProps> = ({
  className = "h-11 w-auto",
  variant = 'black',
  onClick,
}) => {
  return (
    <img
      src={logoPng}
      alt="LOST CAMP"
      onClick={onClick}
      className={`object-contain transition-opacity select-none ${
        variant === 'white' ? 'brightness-0 invert' : ''
      } ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    />
  );
};
