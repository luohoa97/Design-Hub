const steps = [
  {
    step: "01",
    title: "Start a team",
    body: "Gather your young designers, give your team a name, and invite a parent or teacher to help run it.",
  },
  {
    step: "02",
    title: "Make something",
    body: "Design and handcraft a small batch of products at home or in class. Photograph them on a plain background.",
  },
  {
    step: "03",
    title: "Connect payouts",
    body: "The team's adult lead connects Stripe once. From then on, every sale is paid out directly to the team.",
  },
  {
    step: "04",
    title: "Publish & sell",
    body: "List the products in the shop with a price and a short story. Real customers buy, and the team keeps earning.",
  },
]

export function HowItWorks() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">How it works</span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance text-foreground sm:text-4xl">
            From sketchbook to sold, in four honest steps.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col bg-background p-6">
              <span className="font-mono text-xs text-muted-foreground">{s.step}</span>
              <h3 className="mt-3 font-serif text-lg tracking-tight text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
