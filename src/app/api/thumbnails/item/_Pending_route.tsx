import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';



// seems to be some sort of build/deploy error caused by resvg_wasm ??
// tried to use the @cloudflare/pages-plugin-vercel-og but it didnt help either, ended up with same error
// may be something in our wrangler config 

const WIDTH = 600;
const HEIGHT = 400;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name')?.trim() || 'Unknown item';
  const type = searchParams.get('type')?.trim() || 'Unknown';
  const keywords = searchParams.get('keywords')?.trim() || '';
  const worn = searchParams.get('worn')?.trim() || '';
  const damage = searchParams.get('damage')?.trim();
  const ac = searchParams.get('ac')?.trim();
  const weight = searchParams.get('weight')?.trim();
  const ego = searchParams.get('ego')?.trim();
  const droppedBy = searchParams.get('droppedBy')?.trim();
  const submittedBy = searchParams.get('submittedBy')?.trim();
  const isArtifact = searchParams.get('artifact') === '1' || searchParams.get('artifact') === 'true';
  const flags = (searchParams.get('flags') ?? '')
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);
  const affects = parseAffects(searchParams.get('affects'));

  const { icon, color } = getTypeMeta(type);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#18181b',
          color: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
          padding: 20,
          boxSizing: 'border-box',
          gap: 12,
          paddingTop: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#1f1f23',
                border: `1px solid ${color}`,
                color,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 14, color: '#a1a1aa' }}>
                <div style={{ display: 'flex' }}>{keywords || 'No keywords'}</div>
                <div style={{ display: 'flex', color: '#e4e4e7', textTransform: 'uppercase' }}>{type}</div>
                {worn ? <div style={{ display: 'flex' }}>{worn}</div> : null}
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {isArtifact ? (
              <div
                style={{
                  display: 'flex',
                  padding: '4px 8px',
                  borderRadius: 8,
                  backgroundColor: '#1f1f23',
                  border: '1px solid #3f3f46',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: '#a1a1aa',
                }}
              >
                Artifact: Yes
              </div>
            ) : null}
          </div>
        </div>
        

        {/* Teaser / Click Prompt – replaces ego, flags, stats, affects, droppedBy, submittedBy */}
        <div
          style={{
            // margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '16px 0',
            background: 'linear-gradient(to bottom, rgba(31,31,35,0.6), rgba(24,24,27,0.9))',
            borderRadius: 12,
            border: '1px dashed #ea580c',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 20,
              fontWeight: 600,
              color: '#fbbf24',
            }}
          >
            <span style={{ fontSize: 28 }}>🔍</span>
            <span>CLICK TO VIEW MORE</span>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: '#a1a1aa',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            Full stats • Affects • Ego • Flags • Dropped by • Stat Weights • etc
          </div>

        
        </div>

        
        {/* {ego ? (
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                padding: '3px 6px',
                borderRadius: 6,
                border: '1px solid #52525b',
                fontSize: 10,
                textTransform: 'uppercase',
                color: '#e4e4e7',
                
              }}
            >
              Ego: {ego}
            </div>
          </div>
        ) : null} */}

        {/* {flags.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {flags.slice(0, 10).map((flag) => (
              <div
                key={flag}
                style={{
                  display: 'flex',
                  padding: '3px 6px',
                  borderRadius: 6,
                  border: '1px solid #3f3f46',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: '#a1a1aa',
                }}
              >
                {flag}
              </div>
            ))}
          </div>
        ) : null} */}

        {/* Item Stats */}
        {/* <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {weight ? <StatBadge label="Weight" value={weight} accent="#fbbf24" /> : null}
          {ac ? <StatBadge label="AC" value={ac} accent="#60a5fa" /> : null}
          {damage ? <StatBadge label="Damage" value={damage} accent="#f87171" /> : null}
        </div> */}

        {/* Item Affects */}
        {/* {affects.length ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              backgroundColor: '#1f1f23',
              border: '0px solid #ea580c',
              borderLeftWidth: 2,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 10,
                textTransform: 'uppercase',
                color: '#a1a1aa',
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              Affects
            </div>
            {affects.slice(0, 6).map((affect, index) => (
              <div
                key={`${affect.label}-${index}`}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}
              >
                <div style={{ display: 'flex', color: '#e4e4e7' }}>{affect.label}</div>
                <div style={{ display: 'flex', color: affect.valueColor }}>{affect.value}</div>
              </div>
            ))}
          </div>

        ) : null} */}

        {/* Item Dropped & Submitted by */}
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}> */}

        {/* If dropped by, otherwise a spacer */}
        {/* {droppedBy ? (
            <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#a1a1aa' }}>
              <div style={{ display: 'flex', fontStyle: 'italic' }}>Dropped by:</div>
              <div style={{ display: 'flex', color: '#e4e4e7' }}>{droppedBy}</div>
            </div>

          ) : (

            <div style={{ display: 'flex' }} />

          )} */}

        {/* Submitted by */}
        {/* <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#a1a1aa' }}>
            <div style={{ display: 'flex' }}>Submitted by:</div>
            <div style={{ display: 'flex', color: '#e4e4e7' }}>{submittedBy || 'Unknown'}</div>
          </div> */}

        {/* </div> */}


      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

type StatBadgeProps = {
  label: string;
  value: string;
  accent: string;
};

type AffectView = {
  label: string;
  value: string;
  valueColor: string;
};

const getTypeMeta = (type: string) => {
  const lowered = type.toLowerCase();
  if (lowered.includes('weapon')) return { icon: '⚔', color: '#f87171' };
  if (lowered.includes('armor')) return { icon: '🛡', color: '#60a5fa' };
  if (lowered.includes('scroll') || lowered.includes('wand')) return { icon: '📜', color: '#a78bfa' };
  if (lowered.includes('light')) return { icon: '✨', color: '#fbbf24' };
  if (lowered.includes('worn')) return { icon: '🪶', color: '#4ade80' };
  return { icon: '⬡', color: '#94a3b8' };
};

const parseAffects = (raw: string | null): AffectView[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{
      type?: string;
      stat?: string;
      value?: number;
      min?: number;
      max?: number;
      spell?: string;
      level?: number;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((affect) => {
      if (affect.type === 'spell') {
        const label = `Cast: ${affect.spell ?? 'Unknown'}`;
        const value = affect.level ? `Lvl ${affect.level}` : 'Spell';
        return { label, value, valueColor: '#c084fc' };
      }
      const statLabel = affect.stat ?? 'Stat';
      const range = formatValueRange(affect.value, affect.min, affect.max, true);
      const valueNum = affect.max ?? affect.value ?? 0;
      return {
        label: statLabel,
        value: range || '0',
        valueColor: valueNum >= 0 ? '#fb923c' : '#f87171',
      };
    });
  } catch {
    return [];
  }
};

const formatValueRange = (value?: number, min?: number, max?: number, signed = false): string => {
  const fmt = (num?: number): string => {
    if (num === undefined || num === null || Number.isNaN(num)) return '';
    const rounded = Number.isInteger(num) ? num.toString() : num.toFixed(1);
    if (!signed) return rounded;
    return num > 0 ? `+${rounded}` : rounded;
  };
  const fmin = fmt(min ?? value);
  const fmax = fmt(max ?? value);
  if (fmin && fmax && fmin !== fmax) return `${fmin} / ${fmax}`;
  if (fmin) return fmin;
  return value !== undefined ? fmt(value) : '';
};

const StatBadge = ({ label, value, accent }: StatBadgeProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '6px 10px',
      borderRadius: 10,
      backgroundColor: '#1f1f23',
      border: `1px solid ${accent}`,
      minWidth: 110,
    }}
  >
    <div style={{ display: 'flex', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' }}>
      {label}
    </div>
    <div style={{ display: 'flex', fontSize: 16, fontWeight: 600, color: accent }}>{value}</div>
  </div>
);
