export default function InfoPage() {
    return (

<main className="mx-auto max-w-3xl p-6 space-y-8">
      <section className="space-y-3 max-w-2xl">
        <h1 className="text-3xl font-bold">IDPA 2025 - Civic Score</h1>
        <p className="text-sm opacity-80">
          Während unserer Interdisziplinäre Projektarbeit (IDPA) haben wir uns für das Projekt "Civic Score" entschieden.
          Civic Score ist ein Projekt, das daurauf ausgerichtet ist unsere alltäglichen aktionen festzuhalten und auszuwerten.
          Dabei gibt es die Sogenannte Challenge, der die verschiedenen Probanden beitreten können.
          <br />
          <br />
          <strong>Unsere höchste Priorität ist es, die Software 100% anonymisiert und sicher zu halten.</strong> Dafür wird den Probanden ein anonymer benutzer erstellt, welchen sie selbst zusammen mit dem Passwort abspeichern müssen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">So funktioniert es</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Challenge beitreten mit deinem Code</li>
          <li>Jeden Tag der Challenge die Fragen beantworten</li>
          <li>Am Ende der Challenge die Fragen beantworten</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Datenschutz</h2>
        <p className="text-sm">
          Diese Anwendung ist so gestaltet, dass sie deine Anonymität
          bestmöglich wahrt. Es werden keine personenbezogenen Daten wie Name
          oder E‑Mail benötigt; dein Nutzername ist pseudonym.
        </p>
        <p className="text-sm">
          Personenbezogene Daten, die möglicherweise abgefragt werden:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li className="font-bold">Geschlecht</li>
          <li className="font-bold">Altersgruppe</li>
          <li className="font-bold">Berufsgruppe</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><a className=" font-bold">Lukas Wyss</a>, <a href="mailto:lukas.wyss06@bluewin.ch" className="underline">lukas.wyss06@bluewin.ch</a></li>
          <li><a className=" font-bold">Kevin Rodrigues</a>, <a href="mailto:k.rodriguez@gmail.com" className="underline">k.rodrigues.antelo@gmail.com</a></li>
        </ul>
      </section>
    </main>     
    )
}