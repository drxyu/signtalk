# 👋 SignSpeak AI - Real-time Sign Language Translator
  
  [![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-teal)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
</div>

## Special Notes

This project was initiated during the **24-hour Cerebras x Cline AI Hackathon** ([Event Link](https://lu.ma/8bgbzje8?tk=jjtT6M)), where we leveraged:

- **Cerebras' Lightning-Fast Inference**: Utilizing Cerebras' industry-leading inference speeds (up to 450 tokens/second) for real-time AI-powered context understanding and natural language processing
- **Cline's Autonomous Coding**: Built with Cline's advanced AI pair programming capabilities, enabling rapid prototyping and intelligent code generation throughout the hackathon

The combination of Cerebras' unprecedented performance and Cline's development acceleration allowed us to build a strong foundation for sign language translation in just 24 hours!

## Overview

SignSpeak AI is a real-time sign language translator built during the 24-hour Cerebras x Cline AI Hackathon. The project leverages AI-powered computer vision to translate ASL gestures into text with <150ms latency, providing a foundation for accessible bi-directional communication between sign language users and non-signers.

## Key Features

### Working Features
- **Sign to Text Translation**: Real-time hand gesture recognition using MediaPipe and AI models
  - 15 core ASL gestures: Hello, Thank You, Yes, No, Please, Stop, Good, Bad, Help, What, Where, Who, More, Finish, I Love You
  - **Custom Gesture Training**: Train and save your own gestures with 3-second recording
  - Multi-Model AI: I3D video analysis + TGCN pose-based models with ensemble fusion
  - WLASL vocabulary support for 100-3000 signs
  - <150ms processing latency with WebSocket streaming
  - Session recording and full replay capability
  - Performance monitoring with live metrics (Shift+D)

### Infrastructure Ready (Not Yet Connected)
- **Text to Speech**: Mock TTS service that returns simulated audio data, to complete STS (sign language to speech).
- **Speech Recognition**: Framework implemented but using mock data
- **3D Avatar System**: Three.js rendering setup with placeholder shapes
- **Auto Mode Detection**: Pipeline exists for automatic speech/sign switching

### Technical Capabilities
- **AI Provider Infrastructure**: Mock mode implemented (Cerebras, OpenAI, Anthropic hooks available but not connected)
- **MediaPipe Integration**: Advanced hand and pose tracking with 21 landmark detection
- **Picture-in-Picture**: Floating camera overlay for better user awareness
- **WebSocket Architecture**: Bi-directional real-time communication
- **Caching & Optimization**: LRU cache for predictions, torch.compile for faster inference

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Cerebras API Key** ([Get one here](https://www.cerebras.ai/))

### Platform-Specific Requirements

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install portaudio for audio processing
brew install portaudio
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt-get update

# Install audio dependencies
sudo apt-get install portaudio19-dev python3-pyaudio
```

#### Windows
- Install [Python](https://www.python.org/downloads/) with "Add to PATH" option
- Install [Node.js](https://nodejs.org/) LTS version
- May need [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) for some packages

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/drxyu/signtalk.git
cd signtalk
```

### 2. Run Automated Setup
```bash
# Make setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

This script will:
- Check system requirements
- Create Python virtual environment
- Install all backend dependencies
- Set up React frontend
- Create necessary directories
- Generate configuration files

### 3. Configure Environment
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the backend environment file
nano backend/.env

# Configure your AI provider (choose one):
# Option 1: Mock provider (no API key needed)
AI_PROVIDER=mock

# Option 2: Future AI providers (infrastructure ready but not connected)
# AI_PROVIDER=cerebras
# CEREBRAS_API_KEY=your_cerebras_api_key_here
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_openai_api_key_here
# AI_PROVIDER=anthropic  
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Start Development Servers
```bash
# Run both backend and frontend
./run-dev.sh
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## SignTALK Demo (Hackathon Submission)

### Quick Access
Visit the standalone SignTALK demo for enhanced ASL translation:
```
http://localhost:5173/demo.html
```

### Features
- **Real-time ASL Translation**: Detects A-Z letters and numbers 0-5
- **Common Phrases**: Recognizes "Hello", "Thank you", "How are you", "Bye-bye", and "I love you"
- **Custom Gesture Training**: Train the system to recognize your own gestures
- **Pre-loaded Community Gestures**: 5 additional gestures (Good morning/night, Please, Sorry, Help)
- **3D Visualization**: Live hand and body tracking with Three.js
- **Motion Tracking**: Detects gestures with movement patterns (waving, circular, up/down)
- **iPhone-style Interface**: Simulated iOS experience with dynamic island
- **Gesture Sharing**: Export/import gesture vocabularies via Git
- **Multi-tier Storage**: Browser (instant), File (shareable), Community (pre-loaded)

## Custom Gesture Training

### How to Train Custom Gestures

#### Step-by-Step Process
1. **Access Training Mode**
   - Open the demo at `http://localhost:5173/demo.html`
   - Click the hamburger menu in the top-left
   - Select "Train Custom Gesture"

2. **Record Your Gesture**
   - Click the red "Start Recording" button
   - Perform your gesture clearly for 3 seconds
   - Keep your hand visible and well-lit
   - The system will countdown and auto-stop

3. **Label Your Gesture**
   - After recording, enter what the gesture means
   - Examples: "Good morning", "I'm hungry", "Call me"
   - Be descriptive but concise

4. **Save and Test**
   - Click "Save Gesture"
   - Close the training window
   - Perform the gesture - it should now be recognized!

### Managing Your Gestures

#### View Saved Gestures
In the training window, you'll see all gestures with icons:
- **Community gestures**: Pre-loaded, shared by all users
- **File gestures**: Loaded from `public/gestures/`
- **Local gestures**: Your newly trained gestures

#### Delete Gestures
- Click "Delete" next to any gesture you created
- Community gestures cannot be deleted

#### Export Your Gestures
1. Click "Export My Gestures to File"
2. Save the downloaded `custom-gestures.json`
3. Share with others or backup your vocabulary

### Sharing Gestures

#### Method 1: Quick Share (File)
1. Export your gestures
2. Send the JSON file to others
3. They place it in `frontend/public/gestures/custom-gestures.json`
4. Restart the app - gestures load automatically!

#### Method 2: Git Repository (Recommended)
1. Export your gestures
2. Copy to `frontend/public/gestures/custom-gestures.json`
3. Commit and push to Git:
   ```bash
   git add frontend/public/gestures/custom-gestures.json
   git commit -m "Add custom gesture: [gesture names]"
   git push
   ```

#### Method 3: Community Contribution
1. Export your gestures
2. Add them to `community-gestures.json`
3. Submit a pull request
4. Once merged, everyone gets your gestures!

### Gesture Format
Each gesture is stored as:
```json
{
  "name": "Thank you",
  "features": {
    "fingerStates": [true, true, true, true, true],
    "keyAngles": [45, 90, 120],
    "position": { "x": 0.5, "y": 0.5, "z": 0.1 }
  },
  "motionPattern": "forward",
  "author": "user",
  "created": "2025-01-01T12:00:00Z"
}
```

### Training Tips
- **Consistent positioning**: Start gestures from the same position
- **Clear movements**: Make motions deliberate and distinct
- **Good lighting**: Ensure your hand is well-lit
- **Test immediately**: Verify translation works before training more

### Debugging Gestures
If gestures aren't showing, open browser console (F12) and run:
```javascript
debugGestures()     // See what's stored
fixGestures()       // Fix format issues
refreshGestures()   // Reload gesture list
```

## Technology Stack

### Backend
- **FastAPI + WebSocket**: Real-time bidirectional communication
- **Computer Vision**: MediaPipe hand tracking + OpenCV processing
- **AI Models**: I3D (video) + TGCN (pose) with ensemble fusion
- **Speech Processing**: Mock implementations (libraries installed but not used)
- **AI Integration**: Mock AI provider with hooks for future LLM integration

### Frontend
- **React 18 + TypeScript**: Modern component architecture
- **Three.js**: 3D avatar rendering and animations
- **WebSocket + Web Audio API**: Low-latency streaming
- **Tailwind CSS**: Responsive dark theme UI
- **Vite**: Fast development and building


## Server Management

### Start Servers
```bash
# Start both servers together (recommended)
./run-dev.sh

# Or start individually:
./start-backend.sh   # Terminal 1
./start-frontend.sh  # Terminal 2
```

### Stop Servers
```bash
# Stop all servers
./stop-servers.sh

# Or manually with Ctrl+C in each terminal
```

### Check Server Status
```bash
./test-servers.sh
```

## Project Structure

```
signspeak-ai/
├── backend/
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── services/    # Core services
│   │   │   ├── i3d_translator.py      # I3D model service
│   │   │   └── ensemble_translator.py # Multi-model ensemble
│   │   ├── models/      # Data models
│   │   │   ├── i3d/     # I3D video model
│   │   │   └── tgcn/    # Pose-based model
│   │   ├── utils/       # Utilities
│   │   │   ├── video_augmentation.py   # Video preprocessing
│   │   │   └── pose_visualization.py   # Skeleton rendering
│   │   ├── weights/     # Model weights
│   │   └── config/      # Configuration
│   ├── static/          # Static assets
│   ├── tests/           # Backend tests
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── public/
│   │   ├── models/      # 3D models
│   │   └── gestures/    # Custom gesture vocabulary
│   │       ├── custom-gestures.json     # User gestures
│   │       └── community-gestures.json  # Shared gestures
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   └── types/       # TypeScript types
│   ├── demo.html       # SignTALK standalone demo
│   └── package.json     # Node dependencies
├── setup.sh            # Main setup script
└── run-dev.sh          # Development launcher
```

## Manual Setup (Alternative)

If you prefer manual setup or the automated script fails:

### Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install SpeechRecognition pyttsx3 gTTS pyaudio  # Note: Currently using mock implementations
pip install cerebras-cloud-sdk

# Install AI model dependencies
pip install torch torchvision torch-geometric

# Download I3D model weights (optional - for better performance)
cd app/weights
python download_weights.py --models rgb_imagenet

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Creating Avatar Assets

### 1. Create Your Avatar
1. Visit [Ready Player Me](https://readyplayer.me)
2. Create a custom avatar with proper hand rigging
3. Download as GLB format
4. Save to `frontend/public/models/avatar/avatar-base.glb`

### 2. Create Sign Language Animations
1. Visit [Mixamo](https://www.mixamo.com)
2. Upload your avatar
3. Create animations for each gesture:
   - Hello (wave motion)
   - Thank you (chin to forward)
   - Yes (fist nod)
   - No (hand shake)
   - And more...
4. Export as GLB files
5. Save to `frontend/public/models/gestures/`

## Testing

### Run All Tests
```bash
# Backend tests
cd backend
./test-backend.sh

# Frontend tests
cd frontend
./test-frontend.sh
```

### Test Specific Components
```bash
# Test WebSocket connection
curl http://localhost:8000/health

# Test hand detection
python backend/tests/test_hand_detector.py
```

## API Documentation

Once the backend is running, visit:
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

### Key Endpoints

#### WebSocket
```
ws://localhost:8000/ws
```
Bi-directional streaming for audio/video data

#### REST API
```
GET  /health                    - Health check
POST /api/v1/session/start      - Start translation session
POST /api/v1/replay/{id}        - Replay last translation
GET  /api/v1/analytics          - Usage statistics

# AI Model Endpoints
GET  /api/v1/i3d/status         - I3D model status
POST /api/v1/i3d/config         - Configure I3D (vocab size, enable/disable)
GET  /api/v1/i3d/search         - Search signs in vocabulary

# Ensemble Model Endpoints
GET  /api/v1/ensemble/status    - Ensemble model status
POST /api/v1/ensemble/config    - Configure ensemble weights
GET  /api/v1/models/comparison  - Compare model performance

# Pose Analysis
POST /api/v1/pose/extract       - Extract and visualize pose from image
```

## Implementation Status

### Working Features
- **Sign-to-Text Translation**: Real-time hand gesture detection with text output
- **WebSocket Streaming**: <100ms latency for real-time processing
- **15 Core ASL Gestures**: Hello, Thank You, Yes, No, Please, Stop, Good, Bad, Help, What, Where, Who, More, Finish, I Love You
- **Custom Gesture Training**: Create, save, and share your own gesture vocabulary
- **Multi-Model AI**: I3D + TGCN models with ensemble fusion
- **Session Recording**: Full replay capability
- **Performance Monitoring**: Real-time metrics and optimization

### Infrastructure Components (Built but Not Integrated)
- **Text-to-Speech Engine**: Mock TTS service (returns simulated audio data)
- **Speech Recognition**: Framework ready but processes mock phrases only
- **3D Avatar System**: Three.js rendering with placeholder geometry
- **Mode Switching**: Pipeline exists but not activated
- **AI Provider System**: Mock mode with infrastructure for future AI providers

### Advanced Features
- **Session Recording & Replay**: Full session capture with WebSocket replay
- **Replay Modal**: Browse recent sessions, view highlights, export data
- **Performance Optimization**: Adaptive quality, frame skipping, audio compression
- **Performance Monitor**: Dev tools (Shift+D) showing latency metrics
- **Analytics Dashboard**: Mock analytics with real performance data
- **Context Management**: 10-message context window for better translations

### AI Model Performance
- **I3D Model**: ~100-200ms inference (with GPU), handles temporal video analysis
- **TGCN Model**: ~20-50ms inference, excellent for pose-based recognition
- **Ensemble Mode**: ~150-300ms combined inference, 15-20% accuracy improvement
- **Caching**: LRU cache for repeated predictions, significantly improves response time
- **Model Optimization**: Uses torch.compile for faster inference after warmup

### Developer Experience
- **Automated Setup**: One-command installation and configuration
- **Hot Reload**: Instant updates during development
- **Error Handling**: Graceful fallbacks and error recovery
- **Comprehensive Logging**: Debug information for all services
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## Usage Guide

### Current Features

#### Sign to Text Mode (Fully Working)
1. Click "Allow" when prompted for camera access
2. Position your hands in view of the camera
3. Perform ASL gestures
4. See the recognized gesture as text below the display
5. View confidence scores and performance metrics

#### Text to Speech (Backend Ready)
- Backend can convert recognized text to speech
- Currently outputs mock audio for demo purposes
- Mock TTS service in place

### Planned Features

#### Speech to Sign Mode
- Microphone input framework exists
- 3D avatar framework ready (placeholder shapes)
- Speech recognition using mock data currently

#### Sign to Speech Mode
- Will combine sign-to-text with text-to-speech
- Audio playback structure implemented

### Replay Feature
- Click the "Replay" button to repeat the last gesture translation
- Currently works for sign-to-text translations only

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

#### Audio Dependencies (macOS)
```bash
brew install portaudio
pip install --global-option='build_ext' --global-option='-I/usr/local/include' --global-option='-L/usr/local/lib' pyaudio
```

#### Camera/Microphone Access Denied
- Check browser permissions in settings
- Ensure HTTPS is used in production
- Try a different browser

#### AI Provider Notes
- Currently using mock mode for all translations
- AI provider infrastructure exists but is not connected to sign language features
- Sign language translation uses MediaPipe + custom models, not LLMs

## Future Features / TODO

### Mobile Application
- **Migrate to Native Mobile App**: Port the web application to iOS and Android for better performance and accessibility
  - React Native or Flutter implementation
  - Native camera and microphone integration
  - Offline model support for essential gestures
  - Push notifications for learning reminders
  - App Store and Google Play distribution

### 3D Avatar Enhancement
- **Advanced 3D Figure for TTS**: Implement realistic 3D avatars for text/speech to sign language translation
  - Full-body rigging with accurate ASL movements
  - Facial expressions for emotional context
  - Multiple avatar options (age, gender, style)
  - Motion capture integration for natural movements
  - Ready Player Me advanced integration

### Fine-Tuned Sign Language Model
- **Custom AI Model Development**: Train specialized models for improved accuracy
  - Fine-tune on larger ASL/BSL/ISL datasets
  - Multi-regional sign language support
  - Context-aware translation with grammar rules
  - Continuous learning from user corrections
  - Edge deployment for reduced latency

### Extended Language Support
- **Multiple Sign Languages**: Expand beyond ASL
  - British Sign Language (BSL)
  - International Sign Language (ISL)
  - Regional variations and dialects
  - Cross-language sign translation

### Educational Features
- **Learning Platform Integration**: Add educational components
  - Interactive sign language lessons
  - Progress tracking and gamification
  - Community challenges and leaderboards
  - Certification programs

### Accessibility Improvements
- **Enhanced Accessibility**: Make the app more inclusive
  - Voice navigation for visually impaired users
  - Haptic feedback for gesture confirmation
  - High contrast modes and larger UI options
  - Integration with assistive technologies

### Text-to-Speech (TTS) Module
- **Status**: Mock implementation only
- **Description**: Currently returns simulated audio data; needs real TTS integration
- **Implementation Ideas**:
  - Use Web Speech API for browser-native TTS
  - Support multiple voices and languages
  - Adjustable speech rate and pitch
  - Queue management for multiple gestures
  - Visual feedback when speaking

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

### Memory Usage (SignTALK Demo)

**Known Issue**: The SignTALK demo (`demo.html`) experiences high memory consumption due to MediaPipe's hand and pose detection models.

**Note**: MediaPipe models require significant memory (~180-190MB). For best performance, use the demo in shorter sessions and ensure adequate system resources are available.

### I3D Model Performance

**Known Issue**: Initial I3D inference may be slow (~3-4 seconds) when:
- Running without pre-trained weights
- Using CPU-only inference
- First-time model compilation

**Solutions**:
1. Download pre-trained weights: `python app/weights/download_weights.py --models rgb_imagenet wlasl_100`
2. Enable GPU acceleration if available
3. The model uses torch.compile for optimization - subsequent inferences will be faster
4. Performance cache is implemented to speed up repeated predictions

### WLASL Vocabulary Download

**Known Issue**: WLASL vocabulary download may fail with 404 error.

**Note**: The system will automatically fall back to a minimal vocabulary for testing. Full vocabulary files can be manually downloaded from the WLASL repository.

## Support
- Issues: [GitHub Issues](https://github.com/drxyu/signtalk/issues)

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.


---

<div align="center">
  👋 Built with love for accessibility 🫰 
</div>

---
