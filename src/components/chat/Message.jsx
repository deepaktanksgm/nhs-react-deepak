import React, { useState, useRef, useEffect } from 'react';
import  StreamingMessageContent  from "./StreamingMessageContent.jsx";
import  DocumentCard  from "./DocumentCard.jsx";
import { ChevronDown, Bot, User, FileText, ChevronRight, MessageCircle } from 'lucide-react';

// Enhanced Message Component
const Message = ({ message, onViewDocument, onSuggestedQuestionClick, isLoading, isStreaming }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-4xl ${message.type === 'user' ? 'flex-row-reverse w-[88%]' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user'
            ? 'custom-blue-bg text-white ml-3'
            : 'bg-gray-200 text-gray-600 mr-3'
        }`}>
          {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        <div className={`rounded-lg text-left px-4 py-3 ${
          message.type === 'user'
            ? 'custom-blue-bg text-white'
            : message.isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
        }`}>
          <div className="break-words">
            {message.type === 'user' ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <StreamingMessageContent 
                content={message.content} 
                isStreaming={isStreaming && message.isStreaming} 
              />
            )}
          </div>

          {message.grounding_docs && message.grounding_docs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowSources(!showSources)}
                className="text-sm font-medium text-gray-700 mb-3 flex items-center focus:outline-none hover:text-gray-900 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showSources ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                Sources ({message.grounding_docs.length})
              </button>

              {showSources && (
                <div className="space-y-3">
                  {message.grounding_docs.map((doc, index) => (
                    <DocumentCard
                      key={index}
                      doc={doc}
                      index={index}
                      onViewDocument={onViewDocument}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggested Questions */}
          {message.type === 'bot' && message.suggested_questions && message.suggested_questions.length > 0 && !isStreaming && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <MessageCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  You might also ask:
                </span>
              </div>
              <div className="space-y-2">
                {message.suggested_questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedQuestionClick(question)}
                    disabled={isLoading}
                    className="w-full text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 transition-colors disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Message;