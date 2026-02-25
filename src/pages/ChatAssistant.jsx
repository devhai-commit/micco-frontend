import { useState, useRef, useEffect } from 'react';
import {
    Send, FileText, CheckSquare, Square, Sparkles,
    Bot, User, ExternalLink, Loader2, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { examplePrompts } from '../data/mockData';

export default function ChatAssistant() {
    const { authFetch } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: 0,
            role: 'ai',
            content: 'Hello! I\'m your AI Document Assistant. I can help you find information, summarize documents, or answer questions based on your uploaded files. How can I help you today?',
            sources: [],
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState(new Set());
    const [showDocs, setShowDocs] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch documents for the context panel
    useEffect(() => {
        fetchDocuments();
        fetchChatHistory();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await authFetch('/api/documents');
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
                // Auto-select first few documents
                const autoSelect = new Set(data.slice(0, 4).map(d => d.id));
                setSelectedDocs(autoSelect);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const fetchChatHistory = async () => {
        try {
            const res = await authFetch('/api/chat/history');
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setMessages(prev => [prev[0], ...data]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        }
    };

    const toggleDoc = (id) => {
        setSelectedDocs(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const sendMessage = async (text) => {
        if (!text.trim()) return;
        const userMsg = { id: Date.now(), role: 'user', content: text, sources: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await authFetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    document_ids: Array.from(selectedDocs),
                }),
            });

            if (res.ok) {
                const aiMsg = await res.json();
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'ai',
                    content: 'Sorry, I encountered an error processing your request. Please try again.',
                    sources: [],
                }]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: 'Sorry, I couldn\'t connect to the server. Please check if the backend is running.',
                sources: [],
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Document Context Panel */}
            <div className={`${showDocs ? 'w-80 flex-shrink-0' : 'w-0'} transition-all duration-300 overflow-hidden hidden lg:block`}>
                <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Document Context</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Select documents for the AI to reference
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
                        {documents.map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => toggleDoc(doc.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${selectedDocs.has(doc.id)
                                    ? 'bg-primary-600/10 dark:bg-primary-600/20 border border-primary-600/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                    }`}
                            >
                                {selectedDocs.has(doc.id) ? (
                                    <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                ) : (
                                    <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                        {doc.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {doc.type} • {doc.size}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">AI Document Assistant</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ask questions about your documents • {selectedDocs.size} docs in context
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDocs(!showDocs)}
                        className="ml-auto hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 transition-colors"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {showDocs ? 'Hide' : 'Show'} Docs
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gradient-to-br from-secondary-500 to-accent-500 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                                        <div className="text-sm leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                                            __html: msg.content
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br/>')
                                        }} />
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {msg.sources.map((source, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-accent-500/10 text-accent-600 dark:bg-accent-500/20 dark:text-accent-400 cursor-pointer hover:bg-accent-500/20 transition-colors">
                                                    <FileText className="w-3 h-3" />
                                                    {source}
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="chat-bubble-ai flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-secondary-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Analyzing documents...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Example Prompts */}
                {messages.length <= 1 && (
                    <div className="px-6 pb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                            {examplePrompts.slice(0, 4).map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-600/10 hover:text-primary-600 dark:hover:bg-primary-600/20 dark:hover:text-primary-400 transition-colors border border-transparent hover:border-primary-600/20"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your documents..."
                            className="input-field flex-1"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="btn-primary !px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
