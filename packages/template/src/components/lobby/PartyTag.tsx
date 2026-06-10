interface Props {
  partyName: string;
}

export function PartyTag({ partyName }: Props) {
  return (
    <span
      className="inline-flex items-center rounded-full text-[9.5px] font-semibold"
      style={{
        padding: '2px 7px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {partyName}
    </span>
  );
}
