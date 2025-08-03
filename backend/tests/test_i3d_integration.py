"""
End-to-end tests for I3D integration
"""

import pytest
import asyncio
import numpy as np
import cv2
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.i3d import I3DProcessor, VocabularyManager, TemporalBuffer
from app.services.i3d_translator import I3DTranslatorService
from app.translation_engine import TranslationEngine


class TestI3DIntegration:
    """Test I3D model integration"""
    
    @pytest.fixture
    def mock_frames(self):
        """Generate mock video frames"""
        frames = []
        for i in range(64):  # 64 frames for I3D
            # Create a simple frame with changing pattern
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            # Add some movement
            cv2.circle(frame, (320 + i * 2, 240), 50, (255, 255, 255), -1)
            frames.append(frame)
        return frames
    
    def test_vocabulary_manager(self):
        """Test vocabulary manager initialization"""
        vocab = VocabularyManager(vocab_size=100)
        
        assert len(vocab.gloss_to_id) > 0
        assert len(vocab.id_to_gloss) > 0
        
        # Test gloss lookup
        hello_id = vocab.get_gloss_id("hello")
        assert hello_id is not None
        
        # Test text conversion
        text = vocab.get_gloss_text("hello")
        assert text == "Hello!"
        
        # Test search
        results = vocab.search_glosses("hel")
        assert len(results) > 0
        assert results[0][0] == "hello"
    
    def test_temporal_buffer(self):
        """Test temporal buffer functionality"""
        buffer = TemporalBuffer(
            buffer_size=128,
            sequence_length=64,
            stride=16
        )
        
        # Add frames
        for i in range(100):
            frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            buffer.add_frame(frame)
        
        # Check buffer state
        info = buffer.get_buffer_info()
        assert info['current_size'] <= 128
        assert info['total_frames'] == 100
        
        # Get latest sequence
        sequence = buffer.get_latest_sequence()
        assert sequence is not None
        assert len(sequence) == 64
    
    def test_i3d_processor(self):
        """Test I3D processor"""
        processor = I3DProcessor(num_classes=100, device='cpu')
        
        # Test frame preprocessing
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        processed = processor.preprocess_frame(frame)
        
        assert processed.shape == (3, 224, 224)
        assert processed.dtype == np.float32
    
    @pytest.mark.asyncio
    async def test_i3d_translator_service(self, mock_frames):
        """Test I3D translator service"""
        service = I3DTranslatorService(vocab_size=100)
        
        # Process frames
        for frame in mock_frames[:80]:  # Add more than 64 frames
            await service.process_frame(frame)
        
        # Wait a bit for processing
        await asyncio.sleep(0.5)
        
        # Get translation
        result = await service.get_latest_translation()
        
        # Since we're using mock frames, we might not get a valid translation
        # but the service should not crash
        assert result is None or isinstance(result, dict)
        
        # Check stats
        stats = service.get_stats()
        assert isinstance(stats, dict)
        assert 'buffer_info' in stats
    
    @pytest.mark.asyncio
    async def test_translation_engine_integration(self):
        """Test translation engine with I3D"""
        engine = TranslationEngine()
        
        # Check I3D is enabled
        assert engine.i3d_enabled == True
        
        # Test video frame processing
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        processed = await engine.process_video_frame(frame)
        assert isinstance(processed, bool)
        
        # Test I3D stats
        stats = engine.get_i3d_stats()
        assert isinstance(stats, dict)
        
        # Test vocabulary search
        results = await engine.search_signs("hello")
        assert isinstance(results, list)
    
    def test_i3d_vocabulary_sizes(self):
        """Test different vocabulary sizes"""
        for vocab_size in [100, 300]:  # Test smaller sizes for speed
            vocab = VocabularyManager(vocab_size=vocab_size)
            assert len(vocab.gloss_to_id) <= vocab_size
            
            processor = I3DProcessor(num_classes=vocab_size, device='cpu')
            assert processor.num_classes == vocab_size
    
    @pytest.mark.asyncio
    async def test_i3d_performance_settings(self):
        """Test I3D performance optimization"""
        from app.performance_optimizer import PerformanceOptimizer
        
        optimizer = PerformanceOptimizer()
        
        # Check I3D settings
        i3d_settings = optimizer.get_i3d_optimization_settings()
        assert i3d_settings['enabled'] == True
        assert i3d_settings['buffer_size'] == 128
        assert i3d_settings['sequence_length'] == 64
        
        # Update settings
        optimizer.update_i3d_settings({
            'buffer_size': 256,
            'stride': 32
        })
        
        updated = optimizer.get_i3d_optimization_settings()
        assert updated['buffer_size'] == 256
        assert updated['stride'] == 32
    
    def test_frame_interpolation(self):
        """Test frame interpolation in temporal buffer"""
        buffer = TemporalBuffer()
        
        # Create frames
        frames = [np.ones((100, 100, 3), dtype=np.uint8) * i for i in range(10)]
        
        # Test upsampling
        interpolated = buffer.interpolate_frames(frames, 20)
        assert len(interpolated) == 20
        
        # Test downsampling
        downsampled = buffer.interpolate_frames(frames, 5)
        assert len(downsampled) == 5


@pytest.mark.asyncio
async def test_full_pipeline():
    """Test full I3D pipeline integration"""
    # This would be a more comprehensive test with actual video data
    # For now, we just ensure the pipeline doesn't crash
    
    engine = TranslationEngine()
    
    # Simulate video stream
    for i in range(100):
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        await engine.process_video_frame(frame)
        
        # Check for translations periodically
        if i % 20 == 0:
            result = await engine.get_i3d_translation()
            # Result might be None if no valid gesture detected
            assert result is None or isinstance(result, dict)
    
    # Final check
    stats = engine.get_i3d_stats()
    assert stats['buffer_info']['total_frames'] >= 100


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])