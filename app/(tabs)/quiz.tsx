import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Card } from 'react-native-paper';


const API_BASE_URL = 'https://c-college.onrender.com/api';

export default function QuizScreen() {
  const [auth, setAuth] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // ✅ initializeAuth only on first mount
    const setupFirebase = async () => {
      try {
        setAuth(authInstance);
      } catch (err) {
        const authInstance = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
        setAuth(authInstance);
      }
    };

    setupFirebase();

    fetch(`${API_BASE_URL}/questions`)
      .then(res => res.json())
      .then(setQuestions)
      .catch(err => console.error('Failed to load questions', err));
  }, []);

  const handleSelect = (qId, index) => {
    if (!submitted) {
      setAnswers(prev => ({ ...prev, [qId]: index }));
    }
  };

  const handleSubmit = async () => {
    let total = 0;
    questions.forEach(q => {
      if (answers[q._id] === q.correctAnswerIndex) {
        total++;
      }
    });
    setScore(total);
    setSubmitted(true);

    try {
      const user = auth?.currentUser;
      const userId = user?.uid || 'anonymous';

      await fetch(`${API_BASE_URL}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          score: total,
          total: questions.length,
          answers,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Progress save failed', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Thermodynamics Quiz</Text>

      {questions.map((q, i) => (
        <Card key={q._id} style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text>{i + 1}. {q.question}</Text>
            {q.options.map((opt, idx) => {
              const isSelected = answers[q._id] === idx;
              const isCorrect = submitted && q.correctAnswerIndex === idx;
              const isWrong = submitted && isSelected && !isCorrect;

              let mode = 'outlined';
              if (isSelected || isCorrect || isWrong) mode = 'contained';

              return (
                <Button
                  key={idx}
                  mode={mode}
                  onPress={() => handleSelect(q._id, idx)}
                  style={{
                    marginVertical: 4,
                    backgroundColor: submitted
                      ? isCorrect ? '#c8e6c9' : isWrong ? '#ffcdd2' : undefined
                      : isSelected ? '#bbdefb' : undefined
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </Button>
              );
            })}
            {submitted && (
              <Text style={{ marginTop: 8 }}>
                Correct Answer: {q.options[q.correctAnswerIndex]}
              </Text>
            )}
          </Card.Content>
        </Card>
      ))}

      {!submitted ? (
        <Button mode="contained" onPress={handleSubmit}>
          Submit Answers
        </Button>
      ) : (
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
          Your score: {score} / {questions.length}
        </Text>
      )}
    </ScrollView>
  );
}