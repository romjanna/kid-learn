import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    quizzes(subject: String, difficulty: String, limit: Int): [Quiz!]!
    quiz(id: ID!): Quiz
    lessons(subject: String, difficulty: String, gradeLevel: Int, limit: Int): [Lesson!]!
    lesson(id: ID!): Lesson
    studentProgress(userId: ID!): StudentProgress
    weakAreas(userId: ID!): [WeakArea!]!
    engagementTrends(userId: ID!, days: Int): [EngagementDay!]!
    subjects: [Subject!]!
  }

  type Subject {
    id: Int!
    name: String!
    icon: String
    color: String
  }

  type Quiz {
    id: ID!
    title: String!
    difficulty: String!
    subjectName: String!
    subjectColor: String
    questionCount: Int!
    questions: [QuizQuestion!]
  }

  type QuizQuestion {
    id: ID!
    questionText: String!
    questionType: String!
    options: [String!]!
    sortOrder: Int!
  }

  type Lesson {
    id: ID!
    title: String!
    content: String
    difficulty: String!
    gradeMin: Int!
    gradeMax: Int!
    subjectName: String!
    subjectColor: String
  }

  type StudentProgress {
    userId: ID!
    overallAccuracy: Int!
    totalQuestions: Int!
    correctCount: Int!
    subjects: [SubjectProgress!]!
  }

  type SubjectProgress {
    subjectName: String!
    totalQuestions: Int!
    correctCount: Int!
    accuracyPct: Float!
    avgTimeMs: Int
    lastActivity: String
  }

  type WeakArea {
    subjectName: String!
    totalQuestions: Int!
    correctCount: Int!
    accuracyPct: Float!
    avgTimeMs: Int
  }

  type EngagementDay {
    eventDate: String!
    totalEvents: Int!
    sessionsCount: Int!
    quizAnswers: Int!
    lessonsViewed: Int!
    hintsRequested: Int!
  }
`;
