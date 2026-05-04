/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, Subject } from "../types";
import questionsData from "../data/questions.json";

export async function generateQuestion(subject: Subject, level: number): Promise<Question> {
  // Filter questions by subject and level
  const filtered = (questionsData as any[]).filter(q => 
    q.subject.toLowerCase() === subject.toLowerCase() && 
    Number(q.level) === Number(level)
  );

  if (filtered.length > 0) {
    // Pick a random question from the matching set
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const q = filtered[randomIndex];
    
    return {
      subject,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    };
  }

  // Fallback if no question found in local data (using a simple template)
  return {
    subject,
    text: `Challenge: Solve this level ${level} ${subject} puzzle!`,
    options: ["Alpha", "Beta", "Gamma", "Delta"],
    correctAnswer: "Alpha",
    explanation: "Keep practicing to unlock more specific challenges!"
  };
}
