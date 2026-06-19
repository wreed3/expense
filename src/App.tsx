import React, { useState } from 'react';
import VoiceButton from './components/VoiceButton';
import VoiceTranscription from './components/VoiceTranscription';
import './styles/voice.css';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [isFinal, setIsFinal] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const handleTranscript = (text: string, final: boolean) => {
    setTranscript(text);
    setIsFinal(final);
  };

  const handleStateChange = (listening: boolean) => {
    setIsListening(listening);
    if (!listening) {
      // Clear transcript after a delay when stopped listening
      setTimeout(() => {
        setTranscript('');
        setIsFinal(false);
      }, 3000);
    }
  };

  return (
    <div className="app-container" style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Voice Calculator
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.875rem',
        }}>
          Phase 1: Voice Input Foundation - Click the microphone and speak
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}>
          <VoiceButton 
            onTranscript={handleTranscript}
            onStateChange={handleStateChange}
          />

          <VoiceTranscription 
            transcript={transcript}
            isFinal={isFinal}
            isListening={isListening}
          />

          <div style={{
            padding: '1rem',
            background: '#f3f4f6',
            borderRadius: '0.5rem',
            width: '100%',
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              Phase 1 Features:
            </h3>
            <ul style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              paddingLeft: '1.5rem',
              margin: 0,
            }}>
              <li>✅ Browser compatibility detection</li>
              <li>✅ Microphone permission handling</li>
              <li>✅ Voice capture (start/stop)</li>
              <li>✅ Real-time transcription display</li>
              <li>✅ Visual feedback for listening state</li>
            </ul>
          </div>

          <div style={{
            padding: '1rem',
            background: '#eff6ff',
            borderRadius: '0.5rem',
            width: '100%',
            borderLeft: '4px solid #3b82f6',
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '0.5rem',
            }}>
              Try saying:
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#1e3a8a',
              margin: 0,
            }}>
              "Hello, this is a test"<br />
              "Five plus three"<br />
              "Twenty minus eight"
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#60a5fa',
              marginTop: '0.5rem',
              marginBottom: 0,
            }}>
              Note: Calculation parsing will be added in Phase 2
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        color: 'white',
        fontSize: '0.875rem',
      }}>
        <p>Voice-to-Text Calculator - Phase 1 Implementation</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
          Supported browsers: Chrome, Edge, Safari
        </p>
      </div>
    </div>
  );
};

export default App;