import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, ChevronLeft, ChevronRight, BadgeIcon as IdCard } from 'lucide-react';
import DocumentViewer from './DocumentViewer.jsx';
import Message from './Message.jsx';
import { ChatAPIService } from "../../services/chat-service.js";

// Main NHS Policy Chat Component
const NHSPolicyChat = ({ openChat, websiteScrap, onClose }) => {
  if (!openChat) return null; // prevent rendering UI

  const [isWebsiteScrap, setIsWebsiteScrap] = useState(websiteScrap)
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [error, setError] = useState(null);
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    url: '',
    title: ''
  });
  const [isChatOpen, setIsChatOpen] = useState(openChat);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [defaultMessageState, setdefaultMessageState] = useState("Hello! How can I assist you today with NHS policy questions?");

  // Refs for scrolling and input management
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const chatService = new ChatAPIService();

  // Enhanced scroll to bottom function with mobile-specific handling
  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Always scroll during streaming or if forced, otherwise only if user is near bottom
      if (force || isStreaming || isNearBottom) {
        // Use requestAnimationFrame for smoother scrolling on mobile
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        });
      }
    }
  };

  // Enhanced mobile detection and responsive handling
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);

      // Force scroll to bottom on orientation change
      if (newIsMobile !== isMobile) {
        setTimeout(() => scrollToBottom(true), 100);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        handleResize();
        scrollToBottom(true);
      }, 200);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [isMobile]);

  const closeChat = () => {
    setIsChatOpen(false);
    setDocumentViewer({ isOpen: false, url: '', title: '' });
  };

  const handleViewDocument = (url, title) => {
    setIsFullScreen(false);
    setDocumentViewer({
      isOpen: true,
      url: url,
      title: title
    });
    setIsRightPanelCollapsed(false);
  };

  const handleCloseDocumentViewer = () => {
    setDocumentViewer({ isOpen: false, url: '', title: '' });
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question) => {
    if (isLoading || isStreaming) return;
    setInputMessage(question);
    // Auto-send the question
    setTimeout(() => {
      const event = new Event('submit');
      sendMessage(event, question);
    }, 100);
  };

  // Enhanced keyboard handling for mobile
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && documentViewer.isOpen) {
        handleCloseDocumentViewer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [documentViewer.isOpen]);

  // Enhanced scroll effect with mobile-specific timing
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();

    // Additional scroll for mobile after a short delay to handle rendering
    if (isMobile) {
      const timer = setTimeout(() => scrollToBottom(true), 150);
      return () => clearTimeout(timer);
    }
  }, [messages, isMobile]);

  // Scroll to bottom when streaming starts or ends
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom(true);
    } else {
      // When streaming ends, ensure we're at the bottom and focus input
      setTimeout(() => {
        scrollToBottom(true);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isStreaming]);

  const setSystemMessage = () => {
    if (isWebsiteScrap) {
      setdefaultMessageState("Hello, I'm here to help you with anything related to NHS Digital Passport")
    }
    else {
      let defaultMessage = localStorage.getItem("defaultMessage")
      if (defaultMessage) {
        setdefaultMessageState(JSON.parse(defaultMessage))
      }
    }
  }

  useEffect(() => {
    if (isChatOpen) {
      setSystemMessage();
    }
  }, [isChatOpen]);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: defaultMessageState || "Hello! How can I assist you today with NHS policy questions?",
        timestamp: new Date(),
        grounding_docs: [],
        suggested_questions: [],
        isStreaming: false
      },
    ]);
  }, [defaultMessageState]);

  const formatConversationHistory = (messages) => {
    return messages
      .filter(msg => msg.id !== 1)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  };

  const getRecentConversationHistory = (messages) => {
    const conversationHistory = formatConversationHistory(messages);
    return conversationHistory.slice(-6);
  };

  const sendMessage = async (e, suggestedQuestion = null) => {
    e.preventDefault();
    const messageToSend = suggestedQuestion || inputMessage.trim();
    if (!messageToSend || isLoading || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
      grounding_docs: [],
      suggested_questions: [],
      isStreaming: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    // Blur input on mobile to hide keyboard initially
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
    }

    // Force scroll to bottom after user message
    setTimeout(() => scrollToBottom(true), 50);

    // Create initial bot message for streaming
    const botMessageId = Date.now() + 1;
    const initialBotMessage = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      grounding_docs: [],
      suggested_questions: [],
      tool_call: null,
      isStreaming: true
    };

    setMessages(prev => [...prev, initialBotMessage]);
    setStreamingMessageId(botMessageId);

    try {
      const conversationHistory = getRecentConversationHistory([...messages, userMessage]);

      await chatService.chatStream(
        messageToSend,
        isWebsiteScrap,
        conversationHistory,
        // onMessage callback - append to streaming message
        (messageChunk) => {
          console.log('Received message chunk:', JSON.stringify(messageChunk));
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, content: msg.content + messageChunk }
              : msg
          ));
          // Scroll during streaming
          setTimeout(() => scrollToBottom(), 50);
        },
        // onEnd callback - finalize message with metadata
        (finalData) => {
          console.log('Stream ended with data:', finalData);
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? {
                ...msg,
                grounding_docs: finalData.grounding_docs || [],
                suggested_questions: finalData.suggested_questions || [],
                tool_call: finalData.tool_call || null,
                isStreaming: false
              }
              : msg
          ));
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingMessageId(null);

          // Final scroll and focus management after response completes
          setTimeout(() => {
            scrollToBottom(true);
            if (inputRef.current) {
              // Focus input on both mobile and desktop after response completes
              inputRef.current.focus();
            }
          }, 200);
        },
        // onError callback
        (err) => {
          console.error('Error in stream:', err);
          setError(`Failed to connect to API server: ${err.message}`);

          // Remove the streaming message and add error message
          setMessages(prev => prev.filter(msg => msg.id !== botMessageId));

          const errorMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: `I apologize, but I can't connect to the API server. Please make sure your Python FastAPI server is running.`,
            timestamp: new Date(),
            grounding_docs: [],
            suggested_questions: [],
            isError: true,
            isStreaming: false
          };

          setMessages(prev => [...prev, errorMessage]);
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingMessageId(null);

          // Ensure scroll and focus after error
          setTimeout(() => {
            scrollToBottom(true);
            if (inputRef.current && !isMobile) {
              inputRef.current.focus();
            }
          }, 100);
        }
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to connect to API server: ${err.message}`);

      // Remove the streaming message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== botMessageId));

      const errorMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: `I apologize, but I can't connect to the API server. Please make sure your Python FastAPI server is running.`,
        timestamp: new Date(),
        grounding_docs: [],
        suggested_questions: [],
        isError: true,
        isStreaming: false
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingMessageId(null);

      // Ensure scroll and focus after error
      setTimeout(() => {
        scrollToBottom(true);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const viewer = (
    <DocumentViewer
      isOpen={documentViewer.isOpen}
      documentUrl={documentViewer.url}
      documentTitle={documentViewer.title}
      onClose={handleCloseDocumentViewer}
      onToggleFullScreen={handleToggleFullScreen}
      isFullScreen={isFullScreen}
    />
  );

  return (
    <>
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex backdrop-blur-sm p-4 justify-center">
          <div className={`bg-white shadow-2xl h-full flex ${documentViewer.isOpen
            ? 'w-[100%]'
            : 'w-full max-w-4xl'
            }`}>

            {/* Left Panel - Chat Interface */}
            <div className={`flex flex-col transition-all duration-300 ${documentViewer.isOpen && !isMobile
              ? isRightPanelCollapsed
                ? 'w-full'
                : isFullScreen
                  ? 'w-0'
                  : 'w-[65%]'
              : 'w-full'
              }`}>
              <div className="flex flex-col bg-gray-50 h-full">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`${isWebsiteScrap ? "bg-white-500" : "custom-blue-bg"} text-white rounded-full p-2 mr-3`}>
                        {isWebsiteScrap ? <IdCard className="w-6 h-6" style={{ color: "#d5281b" }} /> : <Bot className="w-6 h-6" />}
                      </div>
                      <div className='text-left'>
                        <h1 className="text-xl font-semibold text-gray-900">{isWebsiteScrap ? "Digital Passport Assistant" : "NHS AI Assistant"}</h1>
                        <p className="text-sm text-gray-500">
                          {isStreaming
                            ? "Generating response..."
                            : isWebsiteScrap
                              ? "Ready to help with your digital passport questions"
                              : "Ready to help with your policy questions"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages - Enhanced mobile scrolling */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-4"
                  style={{
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    overscrollBehavior: 'contain' // Prevent scroll chaining
                  }}
                >
                  <div className="max-w-4xl mx-auto">
                    {messages.map((message, index) => {
                      const isLastUser =
                        message.type === 'user' &&
                        (index === messages.length - 1 ||
                          messages.slice(index + 1).find((m) => m.type === 'user') === undefined);

                      return (
                        <div key={message.id}>
                          <Message
                            message={message}
                            onViewDocument={handleViewDocument}
                            onSuggestedQuestionClick={handleSuggestedQuestionClick}
                            isLoading={isLoading}
                            isStreaming={isStreaming && message.id === streamingMessageId}
                          />
                        </div>
                      );
                    })}

                    {/* Thinking indicator - shows when loading but no streaming message exists yet */}
                    {isLoading && !streamingMessageId && (
                      <div className="flex justify-start mb-4">
                        <div className="flex max-w-4xl">
                          <div className="bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="bg-white text-gray-800 border border-gray-200 shadow-sm rounded-lg px-4 py-2">
                            <div className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Thinking...
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll anchor - positioned at the very end */}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="px-6 py-2 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Input - Enhanced mobile handling */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
                  <div className="max-w-4xl mx-auto">
                    <form onSubmit={sendMessage} className="flex space-x-2 items-center">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={isWebsiteScrap ? "Tell me about Digital Passport Assistant." : "Ask me about NHS policies, procedures, or guidelines..."}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading || isStreaming}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || isStreaming || !inputMessage.trim()}
                        className="custom-blue-bg text-white rounded-lg px-4 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading || isStreaming ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </form>

                    {/* Disclaimer message */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      NHS AI assistant can make mistakes. Check important info.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapse/Expand Button */}
            {documentViewer.isOpen && (
              <div className="w-6 bg-gray-100 border-l border-r border-gray-200 flex items-center justify-center">
                <button
                  onClick={toggleRightPanel}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title={isRightPanelCollapsed ? "Expand document panel" : "Collapse document panel"}
                >
                  {isRightPanelCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Document Viewer */}
            {isMobile ? (
              // Mobile overlay mode
              documentViewer.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex backdrop-blur-sm p-4 justify-center">
                  <div className="bg-white shadow-2xl h-full flex w-full max-w-4xl">
                    {viewer}
                  </div>
                </div>
              )
            ) : (
              // Desktop right side panel mode
              <div
                className={`transition-all duration-300 ${documentViewer.isOpen
                  ? isRightPanelCollapsed
                    ? "w-0"
                    : isFullScreen
                      ? "w-full"
                      : "w-[35%]"
                  : "w-0"
                  } overflow-hidden`}
              >
                {documentViewer.isOpen && viewer}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default NHSPolicyChat;