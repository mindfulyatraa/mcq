import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuizFromFirebase } from '../firebase';
import { decompressQuizData } from '../utils/lzStringHelper';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function QuizView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        let data;
        if (id === 'local') {
          const searchParams = new URLSearchParams(location.search);
          const encodedData = searchParams.get('data');
          if (!encodedData) throw new Error("Invalid share link.");
          data = decompressQuizData(encodedData);
        } else {
          data = await getQuizFromFirebase(id);
        }

        if (!data || !data.questions) throw new Error("Quiz data is corrupted or missing.");
        setQuizData(data);
      } catch (err) {
        setError(err.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, location]);

  useEffect(() => {
    if (quizData && quizData.questions[currentQuestionIndex]) {
      // Shuffle options whenever the question changes
      const q = quizData.questions[currentQuestionIndex];
      const opts = [...q.options].sort(() => Math.random() - 0.5);
      setShuffledOptions(opts);
      setSelectedOption(null);
    }
  }, [quizData, currentQuestionIndex]);

  const handleOptionSelect = (opt) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(opt);
    
    const q = quizData.questions[currentQuestionIndex];
    if (opt === q.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setSelectedOption(null);
  };

  if (loading) {
    return <div className="text-center" style={{padding: '4rem'}}><span className="loader"></span></div>;
  }

  if (error) {
    return (
      <div className="glass-panel text-center fade-in">
        <h2 style={{color: 'var(--error-color)'}}>Error</h2>
        <p>{error}</p>
        <button className="secondary-btn" onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="glass-panel text-center fade-in">
        <h2>Quiz Completed! 🎉</h2>
        <p style={{fontSize: '1.2rem', margin: '2rem 0'}}>
          You scored <strong style={{color: 'var(--primary-color)'}}>{score}</strong> out of <strong>{quizData.questions.length}</strong>
        </p>
        
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '12px', marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%', 
            width: `${(score / quizData.questions.length) * 100}%`,
            background: 'var(--success-color)',
            transition: 'width 1s ease'
          }}></div>
        </div>

        <button onClick={restartQuiz}><RefreshCw size={20}/> Retake Quiz</button>
        <button className="secondary-btn mt-4" onClick={() => navigate('/')}>Create Your Own Quiz</button>
      </div>
    );
  }

  const q = quizData.questions[currentQuestionIndex];

  return (
    <div className="fade-in">
      <button className="secondary-btn mb-4" style={{width:'auto', padding: '0.5rem 1rem'}} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Home
      </button>

      <div className="glass-panel">
        <div className="flex justify-between items-center mb-4">
          <p className="text-small" style={{marginBottom: 0}}>Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
          <p className="text-small" style={{marginBottom: 0}}>Score: {score}</p>
        </div>
        
        <h3 style={{marginBottom: '2rem', lineHeight: 1.4, wordSpacing: '2px'}}>{q.question}</h3>
        
        <div>
          {shuffledOptions.map((opt, idx) => {
            let className = "option-btn";
            
            if (selectedOption) {
              if (opt === q.correctAnswer) {
                className += " correct"; // Always show the correct answer green once clicked
              } else if (opt === selectedOption && opt !== q.correctAnswer) {
                className += " wrong"; // Mark user's wrong guess as red
              }
            }

            return (
              <button 
                key={idx} 
                className={className}
                onClick={() => handleOptionSelect(opt)}
                disabled={!!selectedOption}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {selectedOption && (
          <div className="mt-4 fade-in">
             <button onClick={handleNext}>
               {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
