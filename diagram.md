```mermaid

erDiagram
  USER {
    string id PK
    datetime createdAt
    string username UNIQUE
    string passwordHash
    int loginCount
  }

  ADMINROLE {
    string id PK
    datetime createdAt
    string userId UNIQUE FK
  }

  AUTHSESSION {
    string id PK
    datetime createdAt
    datetime expiresAt
    string token UNIQUE
    string userId FK
  }

  ACTION {
    string id PK
    string code UNIQUE
    string label
    string category
    int weight
    string polarity
  }

  CHALLENGE {
    string id PK
    datetime createdAt
    string code UNIQUE
    string title
    string description
    datetime startDate
    datetime endDate
    int startScore
    boolean abEnabled
    json config
  }

  CHALLENGEMEMBERSHIP {
    string id PK
    string userId FK
    string challengeId FK
    datetime joinedAt
    enum abGroup  // A | B
    UNIQUE userId,challengeId
  }

  DAYENTRY {
    string id PK
    string userId FK
    datetime date
    string note
    int totalScore
    json answers
    datetime firstAnswerAt
    datetime lastAnswerAt
    datetime submittedAt
    int durationMs
    string challengeId FK
    UNIQUE userId,date,challengeId
  }

  ENTRYACTION {
    string id PK
    string dayEntryId FK
    string actionId FK
    UNIQUE dayEntryId,actionId
  }

  %% Beziehungen
  USER ||--o{ DAYENTRY : has
  USER ||--o{ CHALLENGEMEMBERSHIP : has
  USER ||--o{ AUTHSESSION : has
  USER ||--o| ADMINROLE : has

  CHALLENGE ||--o{ CHALLENGEMEMBERSHIP : has
  CHALLENGE ||--o{ DAYENTRY : has

  DAYENTRY ||--o{ ENTRYACTION : has
  ACTION ||--o{ ENTRYACTION : has


```