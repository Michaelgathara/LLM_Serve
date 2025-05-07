import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot } from 'lucide-react';

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hello! How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { sender: 'user', text: inputValue };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const assistantMessageShell = { sender: 'assistant', text: '' };
      setMessages((prevMessages) => [...prevMessages, assistantMessageShell]);

      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedChunks = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulatedChunks += decoder.decode(value, { stream: true });
        
        let boundary = accumulatedChunks.indexOf('\n\n');
        while (boundary !== -1) {
          const messagePart = accumulatedChunks.substring(0, boundary);
          accumulatedChunks = accumulatedChunks.substring(boundary + '\n\n'.length);
          
          if (messagePart.startsWith('data: ')) {
            const data = messagePart.substring('data: '.length);
            setMessages((prevMessages) =>
              prevMessages.map((msg, index) =>
                index === prevMessages.length - 1
                  ? { ...msg, text: msg.text + data }
                  : msg
              )
            );
          }
          boundary = accumulatedChunks.indexOf('\n\n');
        }
      }
      
      if (accumulatedChunks.startsWith('data: ')) {
        const data = accumulatedChunks.substring('data: '.length).replace(/\n\n$/, '');
        setMessages((prevMessages) =>
          prevMessages.map((msg, index) =>
            index === prevMessages.length - 1
              ? { ...msg, text: msg.text + data }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error fetching stream:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg, index) =>
          index === prevMessages.length - 1
            ? { ...msg, text: 'Error: Could not connect to the server.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageText = (text) => {

    return text.split('```').map((segment, i) => {
      if (i % 2 === 1) { // Code block
        return (
          <pre key={i} className="bg-gray-50 p-4 rounded-md my-3 overflow-x-auto border border-gray-200 text-sm font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
            <code>{segment}</code>
          </pre>
        );
      } else {
        return (
          <span key={i}>
            {segment.split('\n').map((line, j) => (
              <span key={j}>
                {line}
                {j !== segment.split('\n').length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 py-3 px-4 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex items-center">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <h1 className="ml-3 text-lg font-medium text-gray-800 dark:text-white">Assistant</h1>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`py-6 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4
                  ${msg.sender === 'user' 
                    ? 'bg-blue-50 text-blue-500 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200'}`}
                >
                  {msg.sender === 'user' 
                    ? <User size={16} /> 
                    : <Bot size={16} />
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {msg.sender === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {formatMessageText(msg.text)}
                  </div>
                  
                  {isLoading && index === messages.length - 1 && msg.sender === 'assistant' && !msg.text && (
                    <div className="flex items-center h-6 space-x-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="What do you want to know?"
                disabled={isLoading}
                className="w-full p-3 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
              className="p-3 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors dark:disabled:bg-purple-900"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}