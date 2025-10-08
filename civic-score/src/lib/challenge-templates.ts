export const DEFAULT_CHALLENGE_CONFIG: any = {
  quiz: {
    preId: "pre-001",
    pre: {
      questions: [
        { id: "pre_age", label: "Wie alt bist du?", type: "number" },
        { id: "pre_city", label: "In welcher Stadt lebst du?", type: "text" },
        { id: "pre_vote", label: "Hast du bereits gewählt?", type: "boolean" },
      ],
    },
    postId: "post-001",
    post: {
      questions: [
        { id: "post_knowledge", label: "Hast du dein Wissen verbessert?", type: "boolean" },
        { id: "post_comment", label: "Was hast du gelernt?", type: "text" },
      ],
    },
  },
  daily: {
    questions: [
      { id: "d_read_news", label: "Heute Nachrichten gelesen?", type: "boolean" },
      { id: "d_minutes", label: "Wie viele Minuten für Civic-Aktivität?", type: "number" },
      { id: "d_note", label: "Kurze Notiz zum Tag", type: "text" },
    ],
  },
  defined: {
    days: ["2025-10-01", "2025-10-05"],
    questions: [
      { id: "def_event", label: "Hast du am Event teilgenommen?", type: "boolean" },
      { id: "def_feedback", label: "Kurzes Feedback zum Event", type: "text" },
    ],
  },
};

export function getDefaultChallengeConfig(): any {
  return DEFAULT_CHALLENGE_CONFIG;
}


