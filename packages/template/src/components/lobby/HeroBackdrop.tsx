export function HeroBackdrop() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full"
          style={{
            left: -90,
            top: -110,
            width: 360,
            height: 360,
            background: 'rgba(124,58,237,0.32)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            right: -50,
            top: 30,
            width: 230,
            height: 230,
            background: 'rgba(34,211,238,0.22)',
            filter: 'blur(75px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: 40,
            left: '25%',
            width: 280,
            height: 200,
            background: 'rgba(217,70,239,0.18)',
            filter: 'blur(80px)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(167,139,250,0.16) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.16) 2px,rgba(0,0,0,0.16) 4px)',
        }}
      />
    </>
  );
}
