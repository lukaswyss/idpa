export const DEFAULT_CHALLENGE_CONFIG: any = {
  quiz: {
    preId: "pre-001",
    pre: {
      questions: [
        { id: "pre_age", label: "Zu welcher Altersgruppe gehörst du?", type: "select" , items: [
          { id: "18-24", label: "18-24" },
          { id: "25-34", label: "25-34" },
          { id: "35-44", label: "35-44" },
          { id: "45-54", label: "45-54" },
          { id: "55-64", label: "55-64" },
          { id: "65+", label: "65+" }]},
        { id: "pre_city", label: "Ist deine Muttersprache Deutsch?", type: "boolean" },
        { id: "pre_vote", label: "Wie zuverlässig würdest du dich einschätzen?", type: "stars" , stars: 5 },
        { id: "pre_feedback", label: "Wie gut bist du in die Gesselschaft integriert?", type: "stars" , stars: 5 },
      ],
    },
    postId: "post-001",
    post: {
      questions: [
        { id: "post_knowledge", label: "Hast du dein Wissen verbessert?", type: "stars" , stars: 5 },
        { id: "post_feedback", label: "Wie stark hatt die Challenge deine alltäglichen Aktionen beeinflusst?", type: "stars" , stars: 5 },
        { id: "post_feedback", label: "Kurzes Feedback zur Challenge (anonym)", type: "text" },
      ],
    },
  },
  daily: {
    questions: [
      { id: "d_read_news", label: "Heute Nachrichten gelesen?", type: "boolean" },
      { id: "d_minutes", label: "Wie viele Minuten für Civic-Aktivität?", type: "number" },
    ],
  },
  defined: {
    days: [],
    questions: [
      { id: "def_event", label: "Hast du am Event teilgenommen?", type: "boolean" },
      { id: "def_feedback", label: "Kurzes Feedback zum Event", type: "text" },
    ],
  },
};

export function getDefaultChallengeConfig(): any {
  return DEFAULT_CHALLENGE_CONFIG;
}


