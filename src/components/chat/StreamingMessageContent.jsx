import React, { useState, useRef, useEffect } from 'react';
import FormatMessageContent from "./FormatMessageContent.jsx";

// Enhanced streaming message formatter with smooth word-by-word typing like ChatGPT
const StreamingMessageContent = ({ content, isStreaming }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingSpeedRef = useRef(25); // Dynamic typing speed

  // Smooth word-by-word typewriter effect
  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      setIsTyping(false);
      return;
    }

    // If content is longer than displayed content (new streaming data)
    if (content.length > displayedContent.length) {
      setIsTyping(true);

      // Find the next word to add
      const remaining = content.slice(displayedContent.length);
      const nextWordMatch = remaining.match(/^\S*\s*/);
      const nextChunk = nextWordMatch ? nextWordMatch[0] : remaining.slice(0, 1);

      // Calculate lag and adjust speed dynamically
      const lag = content.length - displayedContent.length;

      // // If we're too far behind, speed up significantly
      // if (lag > 50) {
      //   typingSpeedRef.current = 5;
      // } else if (lag > 20) {
      //   typingSpeedRef.current = 15;
      // } else {
      //   typingSpeedRef.current = 25;
      // }

      // Increase delay values for slower typing
      if (lag > 50) {
        typingSpeedRef.current = 30; // was 5
      } else if (lag > 20) {
        typingSpeedRef.current = 50; // was 15
      } else {
        typingSpeedRef.current = 70; // was 25
      }

      // If streaming stopped, show remaining content immediately
      if (!isStreaming) {
        setDisplayedContent(content);
        setIsTyping(false);
        return;
      }

      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + nextChunk);
      }, typingSpeedRef.current);

      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      // Ensure all content is shown when streaming ends
      setDisplayedContent(content);
      setIsTyping(false);
    }
  }, [content, displayedContent, isStreaming]);

  // Reset when new message starts
  useEffect(() => {
    if (isStreaming && !content) {
      setDisplayedContent('');
      setIsTyping(false);
    }
  }, [isStreaming, content]);

  return (
    <div className="leading-relaxed">
      {displayedContent ? (
        FormatMessageContent(displayedContent)
      ) : isStreaming ? (
        <div className="flex items-center">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-2 custom-blue-bg rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 custom-blue-bg rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 custom-blue-bg rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          {/* <span className="text-gray-600">Thinking...</span> */}
        </div>
      ) : null}
    </div>
  );
};

export default StreamingMessageContent;