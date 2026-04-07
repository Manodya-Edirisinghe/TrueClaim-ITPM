'use client';

const stats = [
  { value: '12,000+', label: 'Items Recovered' },
  { value: '98%', label: 'Match Accuracy' },
  { value: '50+', label: 'Universities' },
  { value: '< 24h', label: 'Avg. Response Time' },
];

export default function StatsBar() {
  return (
    <section className="border-y border-white/[0.06] py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="bg-gradient-to-r from-[#0A66C2] to-blue-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              {s.value}
            </div>
            <p className="mt-1.5 text-sm text-white/45">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
