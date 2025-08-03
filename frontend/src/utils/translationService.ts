// Translation service for communicating with the backend API

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface LandmarkData {
  x: number;
  y: number;
  z: number;
}

export interface TranslationResult {
  type: string;
  output_text?: string;
  text_variations?: string[];
  signs?: string[];
  detailed_signs?: any[];
  landmarks?: any[];
  gloss?: string;
  confidence: number;
  audio?: any;
  timestamp: string;
}

export interface TextToSignResult {
  signs: string[];
  sign_sequence: string;
  gloss: string;
  detailed_signs?: any[];
  landmarks?: any[];
  confidence: number;
  timestamp: string;
}

class TranslationService {
  private context: any[] = [];
  
  /**
   * Translate hand landmarks to text
   */
  async translateLandmarks(landmarks: LandmarkData[]): Promise<TranslationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/translate/landmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landmarks,
          context: this.context.slice(-3), // Last 3 context items
          language: 'ASL'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update context
      if (result.translation?.output_text) {
        this.addToContext('landmarks', result.translation.output_text);
      }
      
      return result.translation;
    } catch (error) {
      console.error('Error translating landmarks:', error);
      throw error;
    }
  }

  /**
   * Translate text to sign language
   */
  async translateTextToSign(text: string): Promise<TextToSignResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/translate/text-to-sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context: this.context.slice(-3),
          language: 'ASL'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update context
      if (text) {
        this.addToContext('text', text);
      }
      
      return result.translation;
    } catch (error) {
      console.error('Error translating text to sign:', error);
      throw error;
    }
  }

  /**
   * Process video frame and get translation
   */
  async processVideoFrame(frameData: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/process/frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: frameData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing video frame:', error);
      throw error;
    }
  }

  /**
   * Start a new translation session
   */
  async startSession(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.clearContext(); // Clear context for new session
      return result;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Add item to context
   */
  private addToContext(type: string, content: string): void {
    this.context.push({
      type,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep context size limited
    if (this.context.length > 10) {
      this.context.shift();
    }
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = [];
  }

  /**
   * Get current context
   */
  getContext(): any[] {
    return this.context;
  }
}

// Export singleton instance
export const translationService = new TranslationService();