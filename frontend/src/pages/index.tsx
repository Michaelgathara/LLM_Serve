import { useState, useRef, useEffect, FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { Send, Loader2, User, Bot } from 'lucide-react';

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hello! How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent | MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>) => {
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
      inputRef.current?.focus();
    }
  };

  const formatMessageText = (text: string) => {
    return text.split('```').map((segment: string, i: number) => {
      if (i % 2 === 1) { // Code block
        return (
          <pre key={i} className="bg-gray-900 p-4 rounded-md my-3 overflow-x-auto border border-gray-700 text-sm font-mono text-gray-300">
            <code>{segment}</code>
          </pre>
        );
      } else {
        return (
          <span key={i}>
            {segment.split('\n').map((line: string, j: number) => (
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
    <div className="flex flex-col h-screen bg-black text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900 py-4 px-6 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <h1 className="ml-3 text-xl font-medium bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PreTrained Transformer Chat</h1>
          </div>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`py-6 ${index > 0 ? 'border-t border-gray-800' : ''}`}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center mr-4 rounded-xl
                  ${msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                    : 'bg-gradient-to-br from-purple-600 to-indigo-800'}`}
                >
                  {msg.sender === 'user' 
                    ? <User size={18} className="text-gray-100" /> 
                    : <Bot size={18} className="text-gray-100" />
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-400 mb-2">
                    {msg.sender === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <div className="text-gray-200 leading-relaxed">
                    {formatMessageText(msg.text)}
                  </div>
                  
                  {isLoading && index === messages.length - 1 && msg.sender === 'assistant' && !msg.text && (
                    <div className="flex items-center h-6 space-x-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="border-t border-gray-800 bg-gray-900 py-6 px-6">
        <div className="max-w-6xl mx-auto">
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
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="w-full p-4 pr-12 rounded-xl border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
              className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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