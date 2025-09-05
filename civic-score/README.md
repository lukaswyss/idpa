# Civic Score

## Challenges (neu)

- Admin-Seite: `/admin` (versteckt, keine Links). Hier kannst du Challenges erstellen (Code, Titel, Start/Ende) und pro Tag eine Frage definieren.
- Beitreten: `/join` – gib den Challenge-Code ein, um Mitglied zu werden.
- Challenge-Ansicht: `/challenge` – zeigt aktuelle Challenge, Tagesfrage und Formular. Einträge werden der Challenge zugeordnet.
- Heute-Ansicht: `/` – zeigt ein Aktivitätsraster wie bei GitHub. Der heutige Tag ist markiert. Navigation oben links via Tabs.

## Entwicklung

Nach Schema-Änderungen bitte lokal Prisma-Client generieren und Migrationen anwenden:

```
npx prisma generate
npx prisma migrate dev --name add_challenges
```

Falls auf Windows ein EPERM bei `query_engine-windows.dll.node` auftritt, bitte Editor/Dev-Server kurz stoppen und erneut ausführen.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
