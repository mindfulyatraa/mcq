import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuizFromText } from '../services/GeminiService';
import { saveQuizToFirebase } from '../firebase';
import { compressQuizData } from '../utils/lzStringHelper';
import { extractTextFromPDF } from '../utils/pdfHelper';
import { Settings, FileText, Upload, Copy, CheckCircle2, Play } from 'lucide-react';

export default function Creator() {
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      if (file.type === 'application/pdf') {
        const extractedText = await extractTextFromPDF(file);
        setText(extractedText);
      } else {
        const textData = await file.text();
        setText(textData);
      }
    } catch (err) {
      setError('Failed to extract text from file. ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const generateQuiz = async () => {
    if (!text.trim()) {
      setError('Please paste text or upload a PDF first.');
      return;
    }
    if (!apiKey) {
      setShowSettings(true);
      setError('Gemini API Key is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setShareLink('');
      
      const quizJson = await generateQuizFromText(text, apiKey);
      
      if (!Array.isArray(quizJson) || quizJson.length === 0) {
        throw new Error('AI returned an invalid or empty quiz.');
      }

      const quizData = {
        title: "AI Generated Quiz",
        questions: quizJson
      };

      try {
        // Try Firebase first
        const id = await saveQuizToFirebase(quizData);
        setShareLink(`${window.location.origin}/quiz/${id}`);
      } catch (fbError) {
        console.warn("Fallback to URL encoding.", fbError);
        // Fallback to URL Encoding (LZ-String) works flawlessly on Netlify without DB
        const encoded = compressQuizData(quizData);
        setShareLink(`${window.location.origin}/quiz/local?data=${encoded}`);
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2>Create a Quiz</h2>
        <button onClick={() => setShowSettings(!showSettings)} className="secondary-btn" style={{width: 'auto', padding: '0.5rem 1rem'}}>
          <Settings size={18} /> API Key
        </button>
      </div>

      {showSettings && (
        <div className="glass-panel" style={{marginBottom: '2rem'}}>
          <h3>Settings</h3>
          <p className="text-small">Enter your Gemini API Key. It is stored locally in your browser.</p>
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
          />
          <button onClick={handleSaveApiKey}>Save API Key</button>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--error-color)', background: 'rgba(220,53,69,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!shareLink ? (
        <>
          <div className="upload-area" onClick={() => fileInputRef.current.click()}>
            <Upload size={32} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
            <p>Click to Upload PDF or Text File</p>
            <input type="file" accept=".pdf,.txt" ref={fileInputRef} onChange={handleFileUpload} style={{display: 'none'}} />
          </div>
          
          <p className="text-center text-small">OR PASTE TEXT BELOW</p>
          
          <textarea 
            rows={8}
            placeholder="Paste your questions/answers here... E.g. 'What is the capital of France? Paris'"
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>

          <button onClick={generateQuiz} disabled={loading}>
            {loading ? <span className="loader"></span> : <><FileText size={20} /> Generate AI Quiz</>}
          </button>
        </>
      ) : (
        <div className="text-center fade-in">
          <div style={{ background: 'rgba(40,167,69,0.1)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <CheckCircle2 size={48} color="var(--success-color)" style={{margin: '0 auto 1rem auto'}} />
            <h2 style={{color: 'var(--success-color)'}}>Quiz Ready!</h2>
            <p>Share this link with your friends or students. They can take the quiz anytime without any timing limitations.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input type="text" readOnly value={shareLink} style={{marginBottom: 0}} />
              <button 
                onClick={copyToClipboard} 
                style={{width: 'auto'}}
                className={copied ? 'correct' : ''}
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <button 
              className="mt-4" 
              onClick={() => {
                const path = shareLink.split(window.location.origin)[1];
                navigate(path);
              }}
            >
              <Play size={20} /> Take Quiz Now
            </button>
          </div>
          
          <button className="secondary-btn" onClick={() => setShareLink('')}>
            Create Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
