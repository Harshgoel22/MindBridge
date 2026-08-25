import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3.6-flash';
const API_KEY = process.env.REACT_APP_API_KEY;

const SYSTEM_INSTRUCTION =
  'You are a friendly and knowledgeable medical assistant chatbot. ' +
  'Give clear, helpful, general health information. Always remind the user ' +
  'to consult a qualified doctor for diagnosis, prescriptions, or emergencies.';

function MediBot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [initError, setInitError] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Client + chat session are created once and kept in refs,
  // not recreated on every render like the old version did.
  const aiClientRef = useRef(null);
  const chatRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize the client + chat session exactly once.
  useEffect(() => {
    if (!API_KEY) {
      setInitError(
        'Missing API key. Add REACT_APP_API_KEY to your .env file at the project root, then restart npm start.'
      );
      return;
    }

    try {
      aiClientRef.current = new GoogleGenAI({ apiKey: API_KEY });
      chatRef.current = aiClientRef.current.chats.create({
        model: MODEL_NAME,
        config: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
    } catch (err) {
      console.error('MediBot init error:', err);
      setInitError(`Failed to initialize chat: ${err.message}`);
    }
  }, []);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = userInput.trim();
    if (!trimmed || isSending) return; // guard against empty sends / double sends

    if (!chatRef.current) {
      setInitError((prev) => prev || 'Chat is not initialized yet. Please wait a moment and try again.');
      return;
    }

    const userMessage = { text: trimmed, role: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsSending(true);

    try {
      const response = await chatRef.current.sendMessage({ message: trimmed });
      const botMessage = {
        text: response.text || "Sorry, I didn't get a response. Please try again.",
        role: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('MediBot send error:', err);
      const friendlyMessage =
        err?.status === 429
          ? "I've hit my usage limit for now. Please try again in a bit."
          : err?.message || 'Something went wrong sending your message. Please try again.';
      setMessages((prev) => [
        ...prev,
        { text: friendlyMessage, role: 'bot', error: true, timestamp: new Date() },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [userInput, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMaximize = () => setIsMaximized((prev) => !prev);

  const chatContainerStyle = isMaximized
    ? {
        width: '80vw',
        height: '80vh',
        position: 'fixed',
        top: '10vh',
        left: '10vw',
        zIndex: 1001,
      }
    : {
        width: '300px',
        height: '400px',
        position: 'absolute',
        bottom: '80px',
        right: '0',
      };

  return (
    <div
      style={{
        ...chatContainerStyle,
        border: '1px solid #ccc',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <h2 style={{ margin: 0, color: '#3498db' }}>Your friend here !</h2>
        <div>
          <button
            onClick={toggleMaximize}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
            aria-label={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '10px',
          border: '1px solid #eee',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        {messages.length === 0 && !initError && (
          <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
            Ask me anything health-related to get started.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}
          >
            <span
              style={{
                backgroundColor: msg.error ? '#fdecea' : msg.role === 'user' ? '#dcf8c6' : '#f2f2f2',
                color: msg.error ? '#c0392b' : 'inherit',
                padding: '8px 12px',
                borderRadius: '18px',
                display: 'inline-block',
                maxWidth: '80%',
                wordWrap: 'break-word',
                fontSize: isMaximized ? '16px' : '14px',
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {isSending && (
          <div style={{ textAlign: 'left', color: '#999', fontSize: '13px' }}>Typing…</div>
        )}

        {initError && (
          <div style={{ color: '#c0392b', textAlign: 'center', fontSize: '13px', marginTop: '10px' }}>
            {initError}
          </div>
        )}
      </div>

      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!initError || isSending}
          style={{
            flex: 1,
            marginRight: '5px',
            padding: '8px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            fontSize: isMaximized ? '16px' : '14px',
            opacity: initError ? 0.6 : 1,
          }}
          placeholder={initError ? 'Chat unavailable' : 'Type your message...'}
        />
        <button
          onClick={handleSendMessage}
          disabled={!!initError || isSending || !userInput.trim()}
          style={{
            padding: '8px 15px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: initError || isSending ? 'not-allowed' : 'pointer',
            opacity: initError || isSending ? 0.6 : 1,
            fontSize: isMaximized ? '16px' : '14px',
          }}
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default MediBot;