type MatchResult = {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
};

export default function ResultCard({ item, isHighlighted = false }: ResultCardProps) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/10 ${
        isHighlighted ? 'border-cyan-300/70 ring-1 ring-cyan-400/50' : 'border-white/10'
      }`}
    >
      <div className="relative">
        <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
        <div className="absolute right-3 top-3 rounded-full border border-blue-300/50 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
          {item.matchScore}% Match
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>

        <div className="space-y-1 text-sm text-white/75">
          <p>
            <span className="text-white/55">Category:</span> {item.category}
          </p>
          <p>
            <span className="text-white/55">Location:</span> {item.location}
          </p>
          <p>
            <span className="text-white/55">Date Reported:</span> {item.date}
          </p>
        </div>

        <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
          View Details
        </button>
      </div>
    </article>
  );
}
