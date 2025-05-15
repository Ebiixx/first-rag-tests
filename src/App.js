import React, { useState } from "react";
import "./App.css";
import { askQuestion, askQuestionWithoutContext } from "./services/ragService";
import ReactMarkdown from "react-markdown";
import KnowledgeManager from "./components/KnowledgeManager";

function App() {
  const [query, setQuery] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [standardAnswer, setStandardAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parallel requests for better performance
      const [ragResponse, standardResponse] = await Promise.all([
        askQuestion(query),
        askQuestionWithoutContext(query),
      ]);

      setRagAnswer(ragResponse);
      setStandardAnswer(standardResponse);
    } catch (error) {
      console.error("Error fetching answers:", error);
      setRagAnswer("An error occurred. Please try again.");
      setStandardAnswer("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowledgeSuccess = () => {
    setRagAnswer(
      "Knowledge base updated successfully. You can now ask questions about it!"
    );
    setStandardAnswer("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AutoRAG Comparison</h1>
        <p>Comparison between RAG answers and standard answers</p>
        <button
          onClick={() => setShowKnowledgeForm(!showKnowledgeForm)}
          className="toggle-knowledge-btn"
        >
          {showKnowledgeForm
            ? "Hide Knowledge Management"
            : "Show Knowledge Management"}
        </button>
      </header>

      {showKnowledgeForm && (
        <section className="knowledge-section">
          <KnowledgeManager onSuccess={handleKnowledgeSuccess} />
        </section>
      )}

      <main className="App-main">
        <form onSubmit={handleSubmit} className="query-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            className="query-input"
          />
          <button type="submit" disabled={isLoading} className="query-button">
            {isLoading ? "Loading..." : "Ask"}
          </button>
        </form>

        <div className="answers-container">
          <div className="answer-column rag-answer">
            <h2>RAG Answer</h2>
            <div className="answer-content">
              {isLoading ? (
                <div className="loading-indicator">Loading RAG answer...</div>
              ) : (
                ragAnswer && <ReactMarkdown>{ragAnswer}</ReactMarkdown>
              )}
            </div>
          </div>

          <div className="answer-column standard-answer">
            <h2>Standard Answer</h2>
            <div className="answer-content">
              {isLoading ? (
                <div className="loading-indicator">
                  Loading standard answer...
                </div>
              ) : (
                standardAnswer && (
                  <ReactMarkdown>{standardAnswer}</ReactMarkdown>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
