import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <section className="space-y-3 max-w-2xl">
        <h1 className="text-3xl font-bold">IDPA 2025 - Civic Score</h1>
        <p className="text-sm opacity-80">
          Civic Score ist eine Challenge rund um bürgerschaftliches Engagement: Sammle Punkte für positive Taten,
          reflektiere negative, und verfolge deinen Fortschritt über die Zeit. Tägliche Fragen und optionale
          Wochenaufgaben helfen dir dranzubleiben.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">So funktioniert es</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Challenge beitreten mit deinem Code</li>
          <li>Heute deine Aktionen erfassen und Zusatzfragen beantworten</li>
          <li>Wöchentlich reflektieren und Fortschritt in der Historie sehen</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Datenschutz</h2>
        <p className="text-sm">
          Diese Anwendung ist so gestaltet, dass sie deine Anonymität
          bestmöglich wahrt. Es werden keine personenbezogenen Daten wie Name
          oder E‑Mail benötigt; dein Nutzername ist pseudonym. Das einzigste was wir von dir benötigen ist deine Altersgruppe.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><a className=" font-bold">Lukas Wyss</a>, <a href="mailto:lukas.wyss06@bluewin.ch" className="underline">lukas.wyss06@bluewin.ch</a></li>
          <li><a className=" font-bold">Kevin Rodrigues</a>, <a href="mailto:k.rodriguez@gmail.com" className="underline">k.rodrigues.antelo@gmail.com</a></li>
        </ul>
      </section>
    </main>
  );
}
