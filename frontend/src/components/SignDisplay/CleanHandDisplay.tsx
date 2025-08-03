import React, { useEffect, useState } from 'react';

interface CleanHandDisplayProps {
  signName: string;
  className?: string;
}

const CleanHandDisplay: React.FC<CleanHandDisplayProps> = ({ signName, className = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(false);
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, [signName]);

  // Clean, professional hand designs inspired by the reference
  const renderCleanHand = (type: string) => {
    const skinTone = '#f4c2a1';
    const outlineColor = '#c8927a';
    const shadowColor = '#e8a890';
    
    switch (type) {
      case 'open-palm':
        return (
          <g id="open-palm">
            {/* Wrist */}
            <rect x="185" y="240" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Palm */}
            <path d="M 175 180 Q 175 170 185 170 L 215 170 Q 225 170 225 180 L 225 240 L 175 240 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Thumb */}
            <path d="M 175 200 Q 165 195 160 200 Q 155 205 155 215 Q 155 225 160 230 Q 165 235 170 230 L 175 220 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Fingers - clean and simple */}
            {/* Index */}
            <rect x="178" y="140" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            {/* Middle */}
            <rect x="193" y="135" width="15" height="50" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            {/* Ring */}
            <rect x="208" y="140" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            {/* Pinky */}
            <rect x="223" y="150" width="12" height="35" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="6" />
            
            {/* Subtle palm detail */}
            <line x1="185" y1="200" x2="215" y2="200" stroke={shadowColor} strokeWidth="1" opacity="0.3" />
            <line x1="190" y1="220" x2="210" y2="220" stroke={shadowColor} strokeWidth="1" opacity="0.3" />
          </g>
        );

      case 'fist':
        return (
          <g id="fist">
            {/* Wrist */}
            <rect x="185" y="230" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Main fist body */}
            <rect x="175" y="180" width="50" height="50" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="15" />
            
            {/* Folded fingers detail */}
            <line x1="185" y1="195" x2="215" y2="195" stroke={outlineColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="185" y1="205" x2="215" y2="205" stroke={outlineColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="185" y1="215" x2="215" y2="215" stroke={outlineColor} strokeWidth="2" strokeLinecap="round" />
            
            {/* Thumb */}
            <ellipse cx="170" cy="200" rx="10" ry="15" fill={skinTone} stroke={outlineColor} strokeWidth="2" />
          </g>
        );

      case 'point':
        return (
          <g id="point">
            {/* Wrist */}
            <rect x="185" y="240" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Palm (partially closed) */}
            <path d="M 175 190 Q 175 180 185 180 L 215 180 Q 225 180 225 190 L 225 240 L 175 240 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Extended index finger */}
            <rect x="193" y="120" width="15" height="70" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            
            {/* Folded fingers */}
            <rect x="178" y="180" width="15" height="20" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="208" y="180" width="15" height="20" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="223" y="185" width="12" height="15" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="6" />
            
            {/* Thumb */}
            <path d="M 175 210 Q 165 205 160 210 Q 155 215 155 225 Q 155 235 160 240 Q 165 245 170 240 L 175 230 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
          </g>
        );

      case 'peace':
        return (
          <g id="peace">
            {/* Wrist */}
            <rect x="185" y="240" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Palm */}
            <path d="M 175 190 Q 175 180 185 180 L 215 180 Q 225 180 225 190 L 225 240 L 175 240 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Extended fingers (V sign) */}
            <rect x="183" y="120" width="15" height="70" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="203" y="120" width="15" height="70" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            
            {/* Folded fingers */}
            <rect x="218" y="185" width="12" height="15" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="6" />
            
            {/* Thumb */}
            <path d="M 175 210 Q 165 205 160 210 Q 155 215 155 225 Q 155 235 160 240 Q 165 245 170 240 L 175 230 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
          </g>
        );

      case 'thumbs-up':
        return (
          <g id="thumbs-up">
            {/* Wrist */}
            <rect x="185" y="230" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Closed fist */}
            <rect x="175" y="190" width="50" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="15" />
            
            {/* Extended thumb */}
            <rect x="185" y="150" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            
            {/* Finger details */}
            <line x1="185" y1="205" x2="215" y2="205" stroke={outlineColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="185" y1="215" x2="215" y2="215" stroke={outlineColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'ok':
        return (
          <g id="ok">
            {/* Wrist */}
            <rect x="185" y="240" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Palm */}
            <path d="M 175 180 Q 175 170 185 170 L 215 170 Q 225 170 225 180 L 225 240 L 175 240 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Circle with thumb and index */}
            <circle cx="175" cy="170" r="15" fill="none" stroke={outlineColor} strokeWidth="2" />
            <path d="M 160 170 Q 165 160 175 160 Q 185 160 190 170" 
                  fill="none" stroke={outlineColor} strokeWidth="2" />
            
            {/* Extended fingers */}
            <rect x="193" y="140" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="208" y="140" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="223" y="150" width="12" height="35" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="6" />
          </g>
        );

      case 'love':
        return (
          <g id="love">
            {/* Wrist */}
            <rect x="185" y="240" width="30" height="40" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="5" />
            
            {/* Palm */}
            <path d="M 175 180 Q 175 170 185 170 L 215 170 Q 225 170 225 180 L 225 240 L 175 240 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Extended thumb */}
            <path d="M 175 200 Q 160 195 155 200 Q 150 205 150 215 Q 150 225 155 230 Q 160 235 165 230 L 175 220 Z" 
                  fill={skinTone} stroke={outlineColor} strokeWidth="2" />
            
            {/* Extended index */}
            <rect x="178" y="140" width="15" height="45" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            
            {/* Folded middle and ring */}
            <rect x="193" y="175" width="15" height="20" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            <rect x="208" y="175" width="15" height="20" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="7" />
            
            {/* Extended pinky */}
            <rect x="223" y="150" width="12" height="35" fill={skinTone} stroke={outlineColor} strokeWidth="2" rx="6" />
          </g>
        );

      default:
        return renderCleanHand('open-palm');
    }
  };

  const getHandTypeForSign = () => {
    const sign = signName.toLowerCase();
    
    switch (sign) {
      case 'hello':
      case 'goodbye':
      case 'stop':
      case 'what':
        return 'open-palm';
      case 'yes':
      case 'sorry':
        return 'fist';
      case 'no':
        return 'peace';
      case 'good':
        return 'thumbs-up';
      case 'bad':
        return 'thumbs-up'; // Will be rotated
      case 'help':
      case 'where':
        return 'point';
      case 'i love you':
        return 'love';
      case 'ok':
      case 'perfect':
        return 'ok';
      default:
        return 'open-palm';
    }
  };

  const getAnimationStyle = (): React.CSSProperties => {
    if (!isAnimating) return {};
    
    const sign = signName.toLowerCase();
    switch (sign) {
      case 'hello':
      case 'goodbye':
        return { animation: 'wave 1s ease-in-out infinite', transformOrigin: '200px 260px' };
      case 'yes':
        return { animation: 'nod 0.8s ease-in-out infinite' };
      case 'no':
        return { animation: 'shake 0.8s ease-in-out infinite' };
      case 'thank you':
        return { animation: 'thankYou 1.2s ease-in-out infinite' };
      case 'please':
      case 'sorry':
        return { animation: 'circular 2s ease-in-out infinite', transformOrigin: '200px 200px' };
      case 'bad':
        return { transform: 'rotate(180deg)', transformOrigin: '200px 200px' };
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 rounded-lg p-8 min-h-[400px]">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes nod {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-15px); }
          75% { transform: translateX(15px); }
        }
        @keyframes thankYou {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 20px); }
        }
        @keyframes circular {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="relative w-96 h-96 mb-4">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))' }}
        >
          {/* Clean background circle */}
          <circle cx="200" cy="200" r="180" fill="rgba(255,255,255,0.05)" />
          
          <g style={getAnimationStyle()}>
            {renderCleanHand(getHandTypeForSign())}
          </g>
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-2">{signName}</h3>
        <p className="text-purple-200 text-sm uppercase tracking-wider">ASL Sign Animation</p>
      </div>
    </div>
  );
};

export default CleanHandDisplay;