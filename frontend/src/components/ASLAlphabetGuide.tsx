import React from 'react';

const ASLAlphabetGuide: React.FC = () => {
  const letters = [
    { letter: 'A', description: 'Closed fist with thumb on the side' },
    { letter: 'B', description: 'Flat hand with thumb across palm' },
    { letter: 'C', description: 'Curved hand forming C shape' },
    { letter: 'D', description: 'Index finger up, thumb touches middle finger' },
    { letter: 'E', description: 'All fingers curled down, thumb across fingers' },
    { letter: 'F', description: 'OK sign - thumb and index touch, others up' },
    { letter: 'G', description: 'Index pointing sideways, thumb parallel' },
    { letter: 'H', description: 'Index and middle pointing sideways' },
    { letter: 'I', description: 'Pinky up, others closed' },
    { letter: 'J', description: 'Pinky up with J motion (requires movement)' },
    { letter: 'K', description: 'Index and middle up, thumb between them' },
    { letter: 'L', description: 'Index up, thumb out at 90 degrees' },
    { letter: 'M', description: 'Three fingers down over thumb' },
    { letter: 'N', description: 'Two fingers down over thumb' },
    { letter: 'O', description: 'All fingers and thumb form circle' },
    { letter: 'P', description: 'Like K but pointing down' },
    { letter: 'Q', description: 'Like G but pointing down' },
    { letter: 'R', description: 'Index and middle crossed' },
    { letter: 'S', description: 'Closed fist with thumb over fingers' },
    { letter: 'T', description: 'Thumb between index and middle fingers' },
    { letter: 'U', description: 'Index and middle up together' },
    { letter: 'V', description: 'Index and middle up spread apart (peace sign)' },
    { letter: 'W', description: 'Index, middle, and ring fingers up' },
    { letter: 'X', description: 'Index finger bent/hooked' },
    { letter: 'Y', description: 'Thumb and pinky extended (hang loose)' },
    { letter: 'Z', description: 'Index finger traces Z in air (requires movement)' }
  ];

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">ASL Alphabet Reference</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {letters.map(({ letter, description }) => (
          <div key={letter} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-3xl font-bold text-blue-400 w-10">{letter}</span>
              <p className="text-sm text-gray-300 flex-1">{description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2 text-yellow-400">Tips for Better Recognition:</h3>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>• Keep your hand clearly visible and well-lit</li>
          <li>• Hold each letter for about 1 second for detection</li>
          <li>• Face your palm toward the camera (except for G, H, P, Q)</li>
          <li>• Letters J and Z require motion and may not be detected in static mode</li>
          <li>• Some letters like M, N, and T can be challenging - practice the exact finger positions</li>
        </ul>
      </div>
    </div>
  );
};

export default ASLAlphabetGuide;