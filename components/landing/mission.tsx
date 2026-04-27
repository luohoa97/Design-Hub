import { Sparkles, HandHeart, Users } from "lucide-react"

const pillars = [
  {
    icon: Sparkles,
    title: "A real studio",
    body: "Young designers sketch, make, and photograph their work — then publish it like a real product studio would.",
  },
  {
    icon: HandHeart,
    title: "Handmade only",
    body: "Every item is genuinely handmade. We keep runs small, thoughtful, and made by the young designers themselves.",
  },
  {
    icon: Users,
    title: "Teams, not solos",
    body: "Designers form small teams, usually with a parent or teacher, and earn together when their products sell.",
  },
]

export function Mission() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Our mission</span>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl tracking-tight text-balance text-foreground sm:text-4xl">
            Design is a real skill. We treat it that way — from day one.
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Atelier Junior is a small, family-run Australian studio built around one idea: if you give school-age
            designers real tools, a real shop, and real customers, they&apos;ll surprise you.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col rounded-xl border border-border/60 bg-background p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <pillar.icon className="h-5 w-5 text-foreground" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-xl tracking-tight text-foreground">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
