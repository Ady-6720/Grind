import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { ChangeEvent } from 'react';

interface Question {
  Title: string;
  Difficulty: string;
  Frequency: string;
  Link: string;
  AcceptanceRate: string;
  Topics: string;
  completed?: boolean;
}

interface ParseResult {
  data: Question[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

function getNormalizedDifficulty(difficulty: string) {
  if (!difficulty) return '';
  const d = difficulty.trim().toLowerCase();
  if (d === 'easy') return 'Easy';
  if (d === 'medium') return 'Medium';
  if (d === 'hard') return 'Hard';
  return difficulty;
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Question; direction: 'asc' | 'desc' }>({
    key: 'Frequency',
    direction: 'desc',
  });

  useEffect(() => {
    // Load questions from CSV
    fetch('/Sorted_LeetCode_Questions_by_Frequency.csv')
      .then(response => response.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results: ParseResult) => {
            const questions = results.data;
            // Load completed status from localStorage
            const completedQuestions = JSON.parse(localStorage.getItem('completedQuestions') || '{}');
            const questionsWithStatus = questions.map(q => ({
              ...q,
              completed: completedQuestions[q.Title] || false
            }));
            setQuestions(questionsWithStatus);
            setFilteredQuestions(questionsWithStatus);
          }
        });
      });
  }, []);

  useEffect(() => {
    let filtered = [...questions];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.Topics.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.Difficulty === difficultyFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.key === 'Frequency') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(a.Frequency) - parseFloat(b.Frequency)
          : parseFloat(b.Frequency) - parseFloat(a.Frequency);
      }
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
    
    setFilteredQuestions(filtered);
  }, [questions, searchTerm, difficultyFilter, sortConfig]);

  const handleSort = (key: keyof Question) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleQuestion = (title: string) => {
    const updatedQuestions = questions.map(q => 
      q.Title === title ? { ...q, completed: !q.completed } : q
    );
    setQuestions(updatedQuestions);
    
    // Update localStorage
    const completedQuestions = updatedQuestions.reduce((acc, q) => ({
      ...acc,
      [q.Title]: q.completed
    }), {});
    localStorage.setItem('completedQuestions', JSON.stringify(completedQuestions));
  };

  const resetProgress = () => {
    const updatedQuestions = questions.map(q => ({ ...q, completed: false }));
    setQuestions(updatedQuestions);
    localStorage.removeItem('completedQuestions');
  };

  const progress = questions.length > 0
    ? Math.round((questions.filter(q => q.completed).length / questions.length) * 100)
    : 0;

  // Download progress as JSON
  const downloadProgress = () => {
    const completedQuestions = questions.reduce((acc, q) => ({
      ...acc,
      [q.Title]: q.completed
    }), {} as Record<string, boolean>);
    const blob = new Blob([JSON.stringify(completedQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import progress from JSON
  const importProgress = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const updatedQuestions = questions.map(q => ({
          ...q,
          completed: imported[q.Title] || false
        }));
        setQuestions(updatedQuestions);
        localStorage.setItem('completedQuestions', JSON.stringify(imported));
      } catch (err) {
        alert('Invalid progress file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Amazon LeetCode Questions</h1>
          <div className="flex gap-2">
            <button
              onClick={downloadProgress}
              className="btn btn-primary"
            >
              Download Progress
            </button>
            <label className="btn btn-secondary cursor-pointer">
              Import Progress
              <input
                type="file"
                accept="application/json"
                onChange={importProgress}
                className="hidden"
              />
            </label>
            <button
              onClick={resetProgress}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset Progress
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="w-full bg-surface rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">Progress: {progress}%</p>
        </div>

        <div className="mb-2">
          <p className="text-xs text-purple-300">Progress is saved in your browser (localStorage). If you clear your browser data, progress will be lost.</p>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 bg-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="table-header px-6 py-3">
                  <input 
                    type="checkbox" 
                    className="rounded checkbox-lg"
                    aria-label="Select all questions"
                  />
                </th>
                <th className="table-header px-6 py-3">
                  <button
                    onClick={() => handleSort('Title')}
                    className="flex items-center gap-1"
                  >
                    Title
                    {sortConfig.key === 'Title' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="table-header px-6 py-3">
                  <button
                    onClick={() => handleSort('Difficulty')}
                    className="flex items-center gap-1"
                  >
                    Difficulty
                    {sortConfig.key === 'Difficulty' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="table-header px-6 py-3">
                  <button
                    onClick={() => handleSort('Frequency')}
                    className="flex items-center gap-1"
                  >
                    Frequency
                    {sortConfig.key === 'Frequency' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="table-header px-6 py-3">Acceptance Rate</th>
                <th className="table-header px-6 py-3">Topics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {filteredQuestions.map((question) => (
                <tr
                  key={question.Title}
                  className={`table-row ${question.completed ? 'bg-purple-900/60' : ''}`}
                >
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      checked={question.completed}
                      onChange={() => toggleQuestion(question.Title)}
                      className="rounded checkbox-lg"
                      aria-label={`Mark ${question.Title} as completed`}
                    />
                  </td>
                  <td className="table-cell">
                    <a
                      href={question.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {question.Title}
                    </a>
                  </td>
                  <td className="table-cell">
                    {(() => {
                      const norm = getNormalizedDifficulty(question.Difficulty);
                      if (norm === 'Easy')
                        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-green-100">EASY</span>;
                      if (norm === 'Medium')
                        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500 text-yellow-900">MEDIUM</span>;
                      if (norm === 'Hard')
                        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-red-100">HARD</span>;
                      return <span>{question.Difficulty}</span>;
                    })()}
                  </td>
                  <td className="table-cell">{question.Frequency}</td>
                  <td className="table-cell">{question.AcceptanceRate}</td>
                  <td className="table-cell">{question.Topics}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
