export function AstroWheel({ compact = false }: { compact?: boolean }) {
  const signs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  return (
    <div className={`astro-visual ${compact ? "astro-visual--compact" : ""}`} aria-hidden="true">
      <div className="planet planet--one" /><div className="planet planet--two" /><div className="planet planet--three" />
      <svg className="astro-wheel" viewBox="0 0 600 600" role="img" aria-label="Roue astrale décorative dorée">
        <defs><radialGradient id="sun"><stop offset="0" stopColor="#fff"/><stop offset=".18" stopColor="#fff3b0"/><stop offset=".48" stopColor="#f6b347" stopOpacity=".9"/><stop offset="1" stopColor="#f6b347" stopOpacity="0"/></radialGradient></defs>
        <g className="wheel-spin" fill="none" stroke="currentColor">
          {[82,126,178,232,274].map((r) => <circle key={r} cx="300" cy="300" r={r} strokeWidth={r === 274 ? 2 : 1}/>) }
          {Array.from({ length: 24 }, (_, i) => { const a=i*Math.PI/12, x1=300+126*Math.cos(a), y1=300+126*Math.sin(a), x2=300+274*Math.cos(a), y2=300+274*Math.sin(a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity={i%2 ? .35 : .72}/>; })}
          <polygon points="300,68 500,416 100,416" opacity=".55"/><polygon points="300,532 500,184 100,184" opacity=".45"/>
          {signs.map((sign,i)=>{const a=(i*Math.PI/6)-Math.PI/2; return <text key={sign} x={300+206*Math.cos(a)} y={307+206*Math.sin(a)} fill="currentColor" stroke="none" textAnchor="middle" fontSize="32">{sign}</text>;})}
        </g>
        <circle cx="300" cy="300" r="118" fill="url(#sun)" />
        <g stroke="#f9d98b" strokeWidth="2"><line x1="300" y1="232" x2="300" y2="368"/><line x1="232" y1="300" x2="368" y2="300"/><line x1="252" y1="252" x2="348" y2="348"/><line x1="348" y1="252" x2="252" y2="348"/></g>
        <circle cx="300" cy="300" r="15" fill="#fffbe8"/><circle cx="300" cy="300" r="7" fill="#f7b43f"/>
      </svg>
      {Array.from({length:10},(_,i)=><i key={i} className={`star star--${i+1}`}>✦</i>)}
    </div>
  );
}
