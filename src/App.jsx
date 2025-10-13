import React, { useState, useCallback, useMemo } from 'react';
import { useGeminiAPI } from './useGeminiAPI';
import './App.css' // Import the new custom CSS file

// Display text with newlines
const FormattedResponse = ({ text }) => {
  if (!text) return null;
  return (
    // Custom class for text styling
    <div className="formatted-response">
      {text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
    </div>
  );
};

const App = () => {
  const [prompt, setPrompt] = useState('');
  const { response, isLoading, error, generateContent } = useGeminiAPI();

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateContent(prompt);
    }
  }, [prompt, generateContent]);

  const responseContent = useMemo(() => {
    if (!response) return null;
    const parts = response.split(/(\n---\n\*\*Sources:\*\*)/);
    const mainText = parts[0];
    const sourceBlock = parts[2];

    return (
      <div className="response-content-area">
        <FormattedResponse text={mainText} />
        {sourceBlock && (
          // Custom class for source styling
          <div className="source-section">
            <p className="source-title">Sources:</p>
            {sourceBlock.split('\n').slice(1).map((sourceLine, index) => {
              const match = sourceLine.match(/(\d+\. )\[([^\]]+)\]\(([^)]+)\)/);
              if (match) {
                const [, prefix, title, uri] = match;
                return (
                  // Custom class for link item
                  <p key={index} className="source-link-item">
                    {prefix}
                    <a href={uri} target="_blank" rel="noopener noreferrer">
                      {title}
                    </a>
                  </p>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  }, [response]);

  return (
    // Custom wrapper for main layout
    <div className="app-wrapper">
      {/* Custom class for the main application card */}
      <div className="main-card">
        {/* Custom header styling */}
        <header className="app-header">
          <h1 className="app-title">
            AI Assistant
          </h1>
          <p className="app-subtitle">Generate content powered by Gemini (No Backend Required)</p>
        </header>

        <div className="form-group-container">
          <div className="form-group">
            <label htmlFor="prompt-input" className="prompt-label">Enter your prompt:</label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="4"
              // Custom input class
              className="prompt-input"
              placeholder="e.g., Explain React hooks in simple terms."
              disabled={isLoading}
            />
          </div>

          <div className="button-container">
            <button
              onClick={() => generateContent(prompt)}
              disabled={isLoading || !prompt.trim()}
              // Custom button class
              className="submit-button"
            >
              {isLoading ? 'Generating...' : 'Generate Content'}
            </button>
          </div>

          {(response || error) && (
            // Custom response container class
            <div className="response-box">
              <h2 className="response-title">AI Response</h2>
              {error && (
                // Custom error message class
                <div className="error-message">{error}</div>
              )}
              {responseContent && !error && <div>{responseContent}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
