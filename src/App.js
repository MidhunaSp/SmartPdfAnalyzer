import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

export default function SmartPDFAnalyzer() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const extractText = async (file) => {
    const reader = new FileReader();
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        fullText += strings.join(" ") + "\n";
      }

      setText(fullText);
      generateSummary(fullText);
      generateQuiz(fullText);
    };

    reader.readAsArrayBuffer(file);
  };

  const generateSummary = (text) => {
    let sentences = text.split(".");
    setSummary(sentences.slice(0, 5).join("."));
  };

 const generateQuiz = (text) => {
  const stopWords = [
    "the", "is", "in", "at", "of", "a", "to", "and", "on", "for",
    "with", "as", "by", "an", "be", "this", "that", "it"
  ];

  let words = text
    .toLowerCase()
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(word => word.length > 4 && !stopWords.includes(word));

  let uniqueWords = [...new Set(words)];

  let q = [];

  for (let i = 0; i < 5; i++) {
    let word = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
    q.push(`Explain the concept of "${word}"`);
  }

  setQuiz(q);
};

  const speak = () => {
    const speech = new SpeechSynthesisUtterance(summary);
    window.speechSynthesis.speak(speech);
  };

 const askQuestion = () => {
  let q = question.toLowerCase();

  let keywords = q
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(word => word.length > 3);

  let sentences = text.split(".").map(s => s.trim());

  let scored = [];

  sentences.forEach(sentence => {
    let score = 0;
    let lower = sentence.toLowerCase();

    keywords.forEach(word => {
      if (lower.includes(word)) score++;
    });

    if (score > 0) {
      scored.push({ sentence, score });
    }
  });

  if (scored.length === 0) {
    setAnswer("❌ This topic is not found in the PDF.");
    return;
  }

  scored.sort((a, b) => b.score - a.score);

  let bestAnswers = scored.slice(0, 3).map(item => item.sentence);

  let finalAnswer =
    "📌 Based on the document:\n\n" +
    bestAnswers.join(". ") +
    ".";

  setAnswer(finalAnswer);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-500 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        📚 Smart PDF Insight Analyzer
      </h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => extractText(e.target.files[0])}
        className="mb-4"
      />

      <div className="bg-white/10 p-4 rounded-xl mb-4">
        <h2 className="text-xl mb-2">📄 Extracted Text</h2>
        <textarea
          value={text}
          readOnly
          className="w-full h-40 text-black p-2 rounded"
        />
      </div>

      <div className="bg-white/10 p-4 rounded-xl mb-4">
        <h2 className="text-xl mb-2">✨ Summary</h2>
        <p>{summary}</p>
        <button
          onClick={speak}
          className="mt-2 bg-orange-500 px-4 py-2 rounded"
        >
          🔊 Listen
        </button>
      </div>

      <div className="bg-white/10 p-4 rounded-xl mb-4">
        <h2 className="text-xl mb-2">🧠 Quiz</h2>
        {quiz.map((q, i) => (
          <p key={i}>{q}</p>
        ))}
      </div>

      <div className="bg-white/10 p-4 rounded-xl">
        <h2 className="text-xl mb-2">💬 Chat with PDF</h2>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
          className="text-black p-2 rounded w-full mb-2"
        />
        <button
          onClick={askQuestion}
          className="bg-orange-500 px-4 py-2 rounded"
        >
          Ask
        </button>
        <p className="mt-2">{answer}</p>
      </div>
    </div>
  );
}
