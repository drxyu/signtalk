# Sign Language Translation Integration Guide

## Overview

The sign language translation system now integrates the SLP (Sign Language Processing) library to provide real-time translation between hand gestures and natural language.

## Key Components Added

### Backend

1. **SLP Translation Service** (`backend/app/slp_translator.py`)
   - Translates text to sign language representation with detailed sign information
   - Converts hand landmarks to natural language text
   - Provides landmark sequences for sign animation
   - Includes caching for improved performance

2. **Updated Translation Engine** (`backend/app/translation_engine.py`)
   - Integrates SLP as the primary translation method
   - Falls back to AI providers and rule-based translation
   - New `process_landmarks()` method for direct landmark translation

3. **New API Endpoints** (`backend/app/main.py`)
   - `POST /api/v1/translate/landmarks` - Translate hand landmarks to text
   - `POST /api/v1/translate/text-to-sign` - Convert text to sign language

### Frontend

1. **Translation Service** (`frontend/src/utils/translationService.ts`)
   - TypeScript service for API communication
   - Manages translation context
   - Handles session management

2. **Updated SignLanguageTranslator Component**
   - Real-time landmark translation toggle
   - Displays both gesture recognition and AI translation
   - Shows translation confidence scores

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The SLP library (`sign-language-translator==0.8.1`) has been added to requirements.txt.

**Note**: If you encounter installation issues with the SLP library, the system will automatically fall back to a simple rule-based translator that provides basic functionality.

### 2. Start the Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

## Using the Translation Features

### Real-Time Hand Gesture Translation

1. Navigate to the Sign Language Translator component
2. Allow camera permissions when prompted
3. Click "Start Recording" to begin tracking gestures
4. Click "Translation ON" to enable AI-powered translation
5. Make hand gestures - the system will:
   - Show basic gesture recognition (letters, numbers)
   - Display AI translation of the gesture sequence

### API Usage Examples

#### Translate Landmarks to Text

```bash
curl -X POST http://localhost:8000/api/v1/translate/landmarks \
  -H "Content-Type: application/json" \
  -d '{
    "landmarks": [
      {"x": 0.5, "y": 0.5, "z": 0.0},
      ... // 21 landmarks total
    ],
    "language": "ASL"
  }'
```

#### Translate Text to Sign

```bash
curl -X POST http://localhost:8000/api/v1/translate/text-to-sign \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "language": "ASL"
  }'
```

## Features

- **Multi-layer Translation**: Uses SLP → AI Provider → Rule-based fallback
- **Context Awareness**: Maintains conversation context for better accuracy
- **Detailed Sign Information**: Returns handshape, movement, and location data
- **Performance Optimization**: Includes caching and frame skipping
- **Language Support**: Currently configured for ASL with English text

## Technical Details

### SLP Integration

The system uses the `sign-language-translator` library which provides:
- Text to sign gloss conversion
- Sign language grammar rules
- MediaPipe integration for landmark processing
- Support for multiple sign languages (ASL, BSL, ISL, etc.)

### Translation Flow

1. **Hand Detection**: MediaPipe detects hand landmarks in real-time
2. **Gesture Recognition**: Basic gesture classifier identifies common signs
3. **Translation Pipeline**:
   - **Primary**: SLP (Sign Language Processing) library for advanced translation
   - **Fallback 1**: Simple rule-based translator with ASL grammar rules
   - **Fallback 2**: AI provider (Cerebras/OpenAI) if configured
   - **Fallback 3**: Basic word-to-sign mapping
4. **Context Management**: Previous translations inform current ones
5. **Output**: Both gesture labels and translated text are displayed

### Fallback System

The system includes a robust fallback mechanism:
- If SLP library is not available, it uses a simple rule-based translator
- The simple translator includes basic ASL grammar rules (question word ordering, article removal)
- Supports common phrases and individual word translation

## Troubleshooting

1. **"AI translation requires backend server"**: Ensure the backend is running on port 8000
2. **No translation appearing**: Check browser console for errors, verify API connectivity
3. **Poor translation quality**: Ensure good lighting and clear hand visibility
4. **High latency**: The system includes performance optimization, but complex translations may take time

## Next Steps

1. Add support for continuous sign language sentences
2. Implement sign language video generation from text
3. Add support for more sign languages
4. Improve gesture recognition accuracy with custom models
5. Add facial expression recognition for non-manual markers

## References

- [SLP Documentation](https://github.com/sign-language-translator/sign-language-translator)
- [MediaPipe Hand Tracking](https://google.github.io/mediapipe/solutions/hands.html)
- [ASL Grammar Rules](https://www.handspeak.com/learn/index.php?id=27)