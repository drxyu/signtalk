import React, { useEffect, useState } from 'react';

interface RealisticHandDisplayProps {
  signName: string;
  className?: string;
}

const RealisticHandDisplay: React.FC<RealisticHandDisplayProps> = ({ signName, className = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(false);
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, [signName]);

  const renderPersonBackground = () => (
    <g id="person-silhouette" opacity="0.15">
      {/* Head */}
      <ellipse cx="200" cy="100" rx="35" ry="40" fill="#4B5563" />
      {/* Neck */}
      <rect x="185" y="130" width="30" height="30" fill="#4B5563" />
      {/* Shoulders and upper body */}
      <path d="M 150 160 Q 200 150 250 160 L 260 220 L 140 220 Z" fill="#4B5563" />
    </g>
  );

  const renderRealisticHand = (type: string) => {
    // More realistic hand with better proportions and shading
    const handBase = (
      <g id="realistic-hand">
        <defs>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#fdbcb4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f4a09a', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="palmGradient">
            <stop offset="0%" style={{ stopColor: '#fdc5bd', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f4a09a', stopOpacity: 1 }} />
          </radialGradient>
        </defs>
      </g>
    );

    switch (type) {
      case 'open':
        return (
          <>
            {handBase}
            {/* Open hand with spread fingers */}
            <g id="open-hand">
              {/* Palm */}
              <path d="M 180 140 Q 165 135 155 145 L 155 185 Q 155 200 170 210 L 210 210 Q 225 200 225 185 L 225 145 Q 215 135 200 140 Q 190 138 180 140 Z" 
                    fill="url(#palmGradient)" stroke="#e8958d" strokeWidth="1.5" />
              
              {/* Thumb */}
              <path d="M 150 160 Q 145 155 140 160 L 135 175 Q 135 185 142 188 L 150 185 Q 155 180 155 170 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              
              {/* Index finger */}
              <path d="M 170 130 Q 168 125 165 120 Q 165 110 168 105 Q 172 102 176 105 Q 179 110 179 120 Q 176 125 174 130 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              <circle cx="172" cy="112" r="5" fill="#f8b5ac" opacity="0.3" />
              
              {/* Middle finger */}
              <path d="M 185 125 Q 183 120 181 110 Q 181 98 184 93 Q 188 90 192 93 Q 195 98 195 110 Q 193 120 191 125 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              <circle cx="188" cy="102" r="5" fill="#f8b5ac" opacity="0.3" />
              
              {/* Ring finger */}
              <path d="M 200 127 Q 198 122 196 112 Q 196 102 199 97 Q 203 94 207 97 Q 210 102 210 112 Q 208 122 206 127 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              <circle cx="203" cy="106" r="5" fill="#f8b5ac" opacity="0.3" />
              
              {/* Pinky */}
              <path d="M 215 135 Q 213 130 211 123 Q 211 115 214 112 Q 217 110 220 112 Q 223 115 223 123 Q 221 130 219 135 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              <circle cx="217" cy="118" r="4" fill="#f8b5ac" opacity="0.3" />
              
              {/* Palm lines */}
              <path d="M 165 160 Q 180 155 195 160" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
              <path d="M 160 175 Q 175 170 190 175" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
            </g>
          </>
        );

      case 'fist':
        return (
          <>
            {handBase}
            {/* Closed fist */}
            <g id="fist">
              {/* Main fist shape */}
              <ellipse cx="190" cy="160" rx="35" ry="40" fill="url(#palmGradient)" stroke="#e8958d" strokeWidth="2" />
              
              {/* Knuckles */}
              <ellipse cx="175" cy="150" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="185" cy="148" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="195" cy="148" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="205" cy="150" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              
              {/* Thumb */}
              <path d="M 160 155 Q 155 160 155 170 Q 155 175 160 178 L 170 175 Q 172 170 170 165 Q 168 158 160 155 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
              
              {/* Finger creases */}
              <path d="M 170 155 Q 175 153 180 155" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
              <path d="M 180 153 Q 185 151 190 153" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
              <path d="M 190 153 Q 195 151 200 153" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
              <path d="M 200 155 Q 205 153 210 155" stroke="#e8958d" strokeWidth="0.5" fill="none" opacity="0.5" />
            </g>
          </>
        );

      case 'point':
        return (
          <>
            {handBase}
            {/* Pointing hand */}
            <g id="pointing-hand">
              {/* Palm (partially closed) */}
              <path d="M 180 150 Q 170 145 165 155 L 165 185 Q 165 195 175 200 L 205 200 Q 215 195 215 185 L 215 155 Q 210 145 200 150 Q 190 148 180 150 Z" 
                    fill="url(#palmGradient)" stroke="#e8958d" strokeWidth="1.5" />
              
              {/* Extended index finger */}
              <path d="M 180 140 Q 178 130 176 115 Q 176 100 179 90 Q 183 85 187 90 Q 190 100 190 115 Q 188 130 186 140 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1.5" />
              <circle cx="183" cy="95" r="6" fill="#f8b5ac" opacity="0.3" />
              
              {/* Folded fingers */}
              <ellipse cx="195" cy="160" rx="8" ry="6" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="205" cy="162" rx="8" ry="6" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="213" cy="165" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              
              {/* Thumb */}
              <path d="M 160 165 Q 155 160 150 165 L 148 175 Q 148 180 153 183 L 160 180 Q 165 175 165 170 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
            </g>
          </>
        );

      case 'peace':
        return (
          <>
            {handBase}
            {/* Peace sign */}
            <g id="peace-sign">
              {/* Palm */}
              <path d="M 180 150 Q 170 145 165 155 L 165 185 Q 165 195 175 200 L 205 200 Q 215 195 215 185 L 215 155 Q 210 145 200 150 Q 190 148 180 150 Z" 
                    fill="url(#palmGradient)" stroke="#e8958d" strokeWidth="1.5" />
              
              {/* Index finger (V sign) */}
              <path d="M 175 140 Q 172 130 168 115 Q 166 100 169 90 Q 173 85 177 90 Q 180 100 178 115 Q 176 130 178 140 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1.5" />
              
              {/* Middle finger (V sign) */}
              <path d="M 195 140 Q 198 130 202 115 Q 204 100 201 90 Q 197 85 193 90 Q 190 100 192 115 Q 194 130 192 140 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1.5" />
              
              {/* Folded fingers */}
              <ellipse cx="208" cy="165" rx="7" ry="5" fill="#f8b5ac" opacity="0.4" />
              <ellipse cx="215" cy="168" rx="6" ry="4" fill="#f8b5ac" opacity="0.4" />
              
              {/* Thumb */}
              <path d="M 160 165 Q 155 160 150 165 L 148 175 Q 148 180 153 183 L 160 180 Q 165 175 165 170 Z" 
                    fill="url(#skinGradient)" stroke="#e8958d" strokeWidth="1" />
            </g>
          </>
        );

      default:
        return null;
    }
  };

  const getHandConfigForSign = () => {
    const sign = signName.toLowerCase();
    
    switch (sign) {
      case 'hello':
      case 'goodbye':
      case 'stop':
        return 'open';
      case 'yes':
      case 'sorry':
        return 'fist';
      case 'no':
      case 'where':
        return 'point';
      case 'peace':
        return 'peace';
      default:
        return 'open';
    }
  };

  const getAnimationStyle = (): React.CSSProperties => {
    if (!isAnimating) return {};
    
    const sign = signName.toLowerCase();
    switch (sign) {
      case 'hello':
      case 'goodbye':
        return { animation: 'wave 1s ease-in-out infinite' };
      case 'yes':
        return { animation: 'nod 0.8s ease-in-out infinite' };
      case 'no':
        return { animation: 'shake 0.8s ease-in-out infinite' };
      case 'thank you':
        return { animation: 'thankYou 1.2s ease-in-out infinite' };
      case 'please':
      case 'sorry':
        return { animation: 'circular 2s ease-in-out infinite' };
      default:
        return { animation: 'pulse 2s ease-in-out infinite' };
    }
  };

  const getTransformForSign = () => {
    const sign = signName.toLowerCase();
    
    switch (sign) {
      case 'hello':
      case 'goodbye':
        return 'translate(20, -20)';
      case 'thank you':
      case 'you\'re welcome':
        return 'translate(0, -30)';
      case 'please':
      case 'sorry':
        return 'translate(0, 20)';
      default:
        return 'translate(0, 0)';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 min-h-[400px]" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes nod {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes thankYou {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, 20px); }
        }
        @keyframes circular {
          0% { transform: rotate(0deg) translateX(15px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(15px) rotate(-360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
      `}</style>
      
      <div className="relative w-96 h-80 mb-4">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }}
        >
          {renderPersonBackground()}
          <g style={getAnimationStyle()} transform={getTransformForSign()}>
            {renderRealisticHand(getHandConfigForSign())}
          </g>
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{signName}</h3>
        <p className="text-gray-400 text-sm">ASL Sign Animation</p>
        <p className="text-xs text-gray-500 mt-2">Realistic hand illustration</p>
      </div>
    </div>
  );
};

export default RealisticHandDisplay;