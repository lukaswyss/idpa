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
        { id: "pre_gender", label: "Zu welchem Geschlecht gehörst du?", type: "select" , items: [
          { id: "male", label: "Männlich" },
          { id: "female", label: "Weiblich" },
        ]},
        { id: "pre_occupation", label: "Zu welcher Berufsgruppe gehörst du?", type: "select" , items: [
          { id: "student", label: "Student" },
          { id: "apprentice", label: "Lernender" },
          { id: "worker", label: "Arbeiter" },
          { id: "selfemployed", label: "Selbstständig" },
          { id: "retired", label: "Rentner" },
          { id: "other", label: "Anderes" }]},
        { id: "pre_language", label: "Ist deine Muttersprache Deutsch?", type: "boolean" },
        { id: "pre_vote", label: "Wie zuverlässig würdest du dich einschätzen?", type: "stars" , stars: 5 },
        { id: "pre_feedback", label: "Wie gut bist du in die Gesselschaft integriert?", type: "stars" , stars: 5 },
      ],
    },
    postId: "post-001",
    post: {
      questions: [
		{ id: "post_knowledge", label: "Hast du dein Wissen verbessert?", type: "stars" , stars: 5 },
		{ id: "post_influence", label: "Wie stark hatt die Challenge deine alltäglichen Aktionen beeinflusst?", type: "stars" , stars: 5 },
		{ id: "post_feedback", label: "Kurzes Feedback zur Challenge (anonym)", type: "text" },
      ],
    },
  },
  daily: {
    questions: [
      // Public
      { id: "d_donate", label: "Spende für Wohltätigkeit", type: "boolean", weight: 5, category: "Public"},
      { id: "d_report_danger", label: "Öffentliche Gefahren gemeldet (z. B. offenes Feuer, Unfall)", type: "boolean", weight: 3, category: "Public"},
      { id: "d_award", label: "Öffentliche auszeichnung erhalten", type: "boolean", weight: 3, category: "Public"},
		{ id: "d_volunteer", label: "Teilnahme an freiwilliger Gemeindearbeit", type: "boolean", weight: 4, category: "Public"},
      { id: "d_public_transport", label: "Öffentliche Verkehrsmittel statt Auto genutzt", type: "boolean", weight: 2, category: "Public"},
      { id: "d_energy_saving", label: "Strom- oder Wasserverbrauch reduziert", type: "boolean", weight: 1, category: "Public"},
		{ id: "d_volunteer_club", label: "Ehrenamtliche Tätigkeit im Verein", type: "boolean", weight: 3, category: "Public"},
      { id: "d_bike", label: "Velo statt Auto genutzt", type: "boolean", weight: 2, category: "Public"},
      { id: "d_recycling", label: "Müll korrekt entsorgt / Recycling betrieben", type: "boolean", weight: 1, category: "Public"},
      { id: "d_lost_wallet", label: "Fundsache abgegeben (z. B. verlorenes Portemonnaie)", type: "boolean", weight: 3, category: "Public"},
      { id: "d_elderly", label: "Älteren/Menschen mit Handicap im ÖV Platz angeboten", type: "boolean", weight: 2, category: "Public"},
      // Work
      { id: "d_work_promo", label: "Auszeichnung oder Beförderung am Arbeitsplatz", type: "boolean", weight: 4, category: "Work"},
      { id: "d_work_suggestion", label: "Vorschläge zur Prozessverbesserung eingebracht", type: "boolean", weight: 2, category: "Work"},
		{ id: "d_work_overtime", label: "Überstunden geleistet", type: "boolean", weight: 2, category: "Work"},
      { id: "d_work_event", label: "An Team-Events oder Firmenveranstaltungen teilgenommen", type: "boolean", weight: 1, category: "Work"},
      { id: "d_work_training", label: "Weiterbildung abgeschlossen (z.B Kurs, Zertifizierung)", type: "boolean", weight: 3, category: "Work"},
      { id: "d_work_project", label: "Erfolgreich ein Projekt abgeschlossen", type: "boolean", weight: 3, category: "Work"},
      { id: "d_work_colleague", label: "Kolleg:in aktiv unterstützt", type: "boolean", weight: 2, category: "Work"},
      // Private
      { id: "d_private_appt_kept", label: "Termin eingehalten", type: "boolean", weight: 2, category: "Private"},
      { id: "d_private_help", label: "Nachbarschaftshilfe geleistet (z.B Einkäufe für ältere Personen)", type: "boolean", weight: 2, category: "Private"},
		{ id: "d_private_energy", label: "Energiesparmassnahmen im Haushalt umgesetzt", type: "boolean", weight: 1, category: "Private"},
      { id: "d_private_pet", label: "Haustier artgerecht gepflegt", type: "boolean", weight: 1, category: "Private"},
      { id: "d_private_bill", label: "Rechnung pünktlich bezahlt", type: "boolean", weight: 2, category: "Private"},
      { id: "d_private_blood", label: "Blutspenden / Organspendeausweis registriert", type: "boolean", weight: 3, category: "Private"},
      // Digital
		{ id: "d_digital_kind", label: "Sich Online freundlich/konstruktiv äussern", type: "boolean", weight: 1, category: "Digital"},
      { id: "d_digital_report", label: "Fake-News gemeldet", type: "boolean", weight: 2, category: "Digital"},
      { id: "d_digital_discussion", label: "Konstruktive Diskussion online geführt (z.B Forum)", type: "boolean", weight: 1, category: "Digital"},
      { id: "d_digital_security", label: "Eigene Daten sicher verwalten (z.B anhand von 2FA)", type: "boolean", weight: 2, category: "Digital"},
      { id: "d_digital_share", label: "Hilfreiche Inhalte geteilt (z. B. Tutorial, Sicherheitshinweise)", type: "boolean", weight: 1, category: "Digital"},
      { id: "d_digital_mobbing", label: "Mobbing gemeldet", type: "boolean", weight: 2, category: "Digital"},
      
      
      // Negative
      //Public
      { id: "d_negative_fare", label: " Öffentlicher Verkehr ohne Ticket", type: "boolean", weight: -3, category: "Public"},
      { id: "d_negative_littering", label: "Littering", type: "boolean", weight: -2, category: "Public"},
      { id: "d_negative_risk", label: "Öffentliches Risiko geschaffen (z. B. Fahrrad ohne Licht, Hund ohne Leine)", type: "boolean", weight: -3, category: "Public"},
      { id: "d_negative_speed", label: "Geschwidikeit überschritten", type: "boolean", weight: -3, category: "Public"},
      { id: "d_negative_cross", label: "Strasse überqueren ohne fussgänger zu nutzen", type: "boolean", weight: -1, category: "Public"},
      { id: "d_negative_accident", label: "Verkehrsunfall zu verschulden", type: "boolean", weight: -10, category: "Public"},
      { id: "d_negative_park", label: "Parken im Halteverbot / Parkverbot", type: "boolean", weight: -3, category: "Public"},
      { id: "d_negative_litter", label: "Falschentsorgung von Müll (z.B Dosen im Karton)", type: "boolean", weight: -2, category: "Public"},
      { id: "d_negative_noise", label: "Lärmbelästigung in der Öffentlichkeit", type: "boolean", weight: -2, category: "Public"},
      { id: "d_negative_alcohol", label: "Alkohol/Glasflaschen im verbotenen Bereich konsumieren", type: "boolean", weight: -2, category: "Public"},

      // Work
      { id: "d_negative_work_noshow", label: "Unentschuldigtes Fehlen", type: "boolean", weight: -3, category: "Work"},
      { id: "d_negative_work_missdeadline", label: "Projektabgabe verpasst", type: "boolean", weight: -2, category: "Work"},
      { id: "d_negative_work_unproductive", label: "Absichtlich unproduktives Verhalten (z.B Bei der Arbeit Tiktok schauen)", type: "boolean", weight: -2, category: "Work"},  
      { id: "d_negative_conflict", label: "Konflikt am Arbeitsplatz eskalieren lassen", type: "boolean", weight: -2, category: "Work"},

      // Private
      { id: "d_negative_private_apptmissed", label: "Termin verpassen", type: "boolean", weight: -1, category: "Private"},
      { id: "d_negative_private_billlate", label: "Rechnung nicht pünktlich bezahlen", type: "boolean", weight: -2, category: "Private"},
      { id: "d_negative_private_energy", label: "Übermässiger Energieverbrauch (z.B Dauerlicht, Wasserverschwendung)", type: "boolean", weight: -2, category: "Private"},
      { id: "d_negative_private_food", label: "Essensverschwendung (Lebensmittel wegwerfen)", type: "boolean", weight: -2, category: "Private"},
		{ id: "d_negative_private_noise", label: "Ruhestörung durch laute Musik oder feiern", type: "boolean", weight: -3, category: "Private"},
      { id: "d_negative_private_dunning", label: "Eine Mahnung bekommen", type: "boolean", weight: -3, category: "Private"},
		{ id: "d_negative_private_complaint", label: "Nachbarschaftsbeschwerde (z. B. Lärm)", type: "boolean", weight: -2, category: "Private"},

      // Digital
      { id: "d_negative_digital_rude", label: "Sich Online unfreundlich geäussert", type: "boolean", weight: -2, category: "Digital"},
      { id: "d_negative_digital_misinfo", label: "Fake-News geteilt", type: "boolean", weight: -3, category: "Digital"},
      { id: "d_negative_digital_mobbing", label: "Cybermobbing/Beleidigungen", type: "boolean", weight: -4, category: "Digital"},
      { id: "d_negative_digital_piracy", label: "Illegale Downloads/Streaming", type: "boolean", weight: -2, category: "Digital"},
      { id: "d_negative_digital_identity", label: "Falsche Identität im Netz verwentet", type: "boolean", weight: -3, category: "Digital"},
      { id: "d_negative_digital_data", label: "Private Daten anderer veröffentlicht", type: "boolean", weight: -5, category: "Digital"},

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


