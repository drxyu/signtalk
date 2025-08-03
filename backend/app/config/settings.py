import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
    
    # Server Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    RELOAD = os.getenv("RELOAD", "true").lower() == "true"
    
    # CORS Settings
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ]
    
    # WebSocket Settings
    WS_HEARTBEAT_INTERVAL = int(os.getenv("WS_HEARTBEAT_INTERVAL", 30))
    WS_MAX_CONNECTIONS = int(os.getenv("WS_MAX_CONNECTIONS", 100))
    
    # Audio Settings
    AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", 16000))
    AUDIO_CHANNELS = int(os.getenv("AUDIO_CHANNELS", 1))
    
    # Video Settings
    VIDEO_WIDTH = int(os.getenv("VIDEO_WIDTH", 640))
    VIDEO_HEIGHT = int(os.getenv("VIDEO_HEIGHT", 480))
    VIDEO_FPS = int(os.getenv("VIDEO_FPS", 30))
    
    # Feature Flags
    ENABLE_MOCK_MODE = os.getenv("ENABLE_MOCK_MODE", "false").lower() == "true"
    ENABLE_PERFORMANCE_LOGGING = os.getenv("ENABLE_PERFORMANCE_LOGGING", "true").lower() == "true"

settings = Settings()
