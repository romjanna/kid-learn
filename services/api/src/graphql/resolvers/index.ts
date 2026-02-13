import { pool } from '../../db/pool';

export const resolvers = {
  Query: {
    subjects: async () => {
      const result = await pool.query('SELECT id, name, icon, color FROM subjects ORDER BY name');
      return result.rows;
    },

    quizzes: async (_: any, args: { subject?: string; difficulty?: string; limit?: number }) => {
      const { subject, difficulty, limit = 20 } = args;
      let query = `
        SELECT q.id, q.title, q.difficulty,
               s.name as "subjectName", s.color as "subjectColor",
               (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)::int as "questionCount"
        FROM quizzes q
        JOIN subjects s ON s.id = q.subject_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (subject) {
        params.push(subject);
        query += ` AND LOWER(s.name) = LOWER($${params.length})`;
      }
      if (difficulty) {
        params.push(difficulty);
        query += ` AND q.difficulty = $${params.length}`;
      }
      params.push(limit);
      query += ` ORDER BY q.created_at DESC LIMIT $${params.length}`;

      const result = await pool.query(query, params);
      return result.rows;
    },

    quiz: async (_: any, args: { id: string }) => {
      const quizResult = await pool.query(
        `SELECT q.id, q.title, q.difficulty,
                s.name as "subjectName", s.color as "subjectColor",
                (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)::int as "questionCount"
         FROM quizzes q
         JOIN subjects s ON s.id = q.subject_id
         WHERE q.id = $1`,
        [args.id]
      );
      if (quizResult.rows.length === 0) return null;

      const questionsResult = await pool.query(
        `SELECT id, question_text as "questionText", question_type as "questionType",
                options, sort_order as "sortOrder"
         FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order`,
        [args.id]
      );

      return {
        ...quizResult.rows[0],
        questions: questionsResult.rows,
      };
    },

    lessons: async (_: any, args: { subject?: string; difficulty?: string; gradeLevel?: number; limit?: number }) => {
      const { subject, difficulty, gradeLevel, limit = 20 } = args;
      let query = `
        SELECT l.id, l.title, l.difficulty, l.grade_min as "gradeMin", l.grade_max as "gradeMax",
               s.name as "subjectName", s.color as "subjectColor"
        FROM lessons l
        JOIN subjects s ON s.id = l.subject_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (subject) {
        params.push(subject);
        query += ` AND LOWER(s.name) = LOWER($${params.length})`;
      }
      if (difficulty) {
        params.push(difficulty);
        query += ` AND l.difficulty = $${params.length}`;
      }
      if (gradeLevel) {
        params.push(gradeLevel);
        query += ` AND l.grade_min <= $${params.length} AND l.grade_max >= $${params.length}`;
      }
      params.push(limit);
      query += ` ORDER BY l.created_at DESC LIMIT $${params.length}`;

      const result = await pool.query(query, params);
      return result.rows;
    },

    lesson: async (_: any, args: { id: string }) => {
      const result = await pool.query(
        `SELECT l.id, l.title, l.content, l.difficulty,
                l.grade_min as "gradeMin", l.grade_max as "gradeMax",
                s.name as "subjectName", s.color as "subjectColor"
         FROM lessons l
         JOIN subjects s ON s.id = l.subject_id
         WHERE l.id = $1`,
        [args.id]
      );
      return result.rows[0] || null;
    },

    studentProgress: async (_: any, args: { userId: string }) => {
      try {
        const result = await pool.query(
          `SELECT subject_name as "subjectName", total_questions as "totalQuestions",
                  correct_count as "correctCount", accuracy_pct as "accuracyPct",
                  avg_time_ms as "avgTimeMs", last_activity::text as "lastActivity"
           FROM mart_student_progress WHERE user_id = $1`,
          [args.userId]
        );

        const totals = result.rows.reduce(
          (acc: any, row: any) => ({
            totalQuestions: acc.totalQuestions + parseInt(row.totalQuestions),
            correctCount: acc.correctCount + parseInt(row.correctCount),
          }),
          { totalQuestions: 0, correctCount: 0 }
        );

        return {
          userId: args.userId,
          overallAccuracy: totals.totalQuestions > 0
            ? Math.round((totals.correctCount / totals.totalQuestions) * 100)
            : 0,
          totalQuestions: totals.totalQuestions,
          correctCount: totals.correctCount,
          subjects: result.rows,
        };
      } catch {
        return { userId: args.userId, overallAccuracy: 0, totalQuestions: 0, correctCount: 0, subjects: [] };
      }
    },

    weakAreas: async (_: any, args: { userId: string }) => {
      try {
        const result = await pool.query(
          `SELECT subject_name as "subjectName", total_questions as "totalQuestions",
                  correct_count as "correctCount", accuracy_pct as "accuracyPct",
                  avg_time_ms as "avgTimeMs"
           FROM mart_weak_areas WHERE user_id = $1 ORDER BY accuracy_pct ASC`,
          [args.userId]
        );
        return result.rows;
      } catch {
        return [];
      }
    },

    engagementTrends: async (_: any, args: { userId: string; days?: number }) => {
      try {
        const result = await pool.query(
          `SELECT event_date::text as "eventDate", total_events as "totalEvents",
                  sessions_count as "sessionsCount", quiz_answers as "quizAnswers",
                  lessons_viewed as "lessonsViewed", hints_requested as "hintsRequested"
           FROM mart_engagement_trends
           WHERE user_id = $1 AND event_date >= NOW() - INTERVAL '1 day' * $2
           ORDER BY event_date ASC`,
          [args.userId, args.days || 30]
        );
        return result.rows;
      } catch {
        return [];
      }
    },
  },
};
