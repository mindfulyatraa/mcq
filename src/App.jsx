import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Creator from './components/Creator';
import QuizView from './components/QuizView';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <h1>AI MCQ Generator</h1>
        <Routes>
          <Route path="/" element={<Creator />} />
          <Route path="/quiz/:id" element={<QuizView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
