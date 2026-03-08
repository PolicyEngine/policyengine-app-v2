import { useCallback, useEffect, useRef, useState } from 'react';
import { IconWorld } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const countries = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
];

export default function CountrySelector() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleCountryChange = useCallback(
    (newCountryId: string) => {
      setOpen(false);
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        pathParts[0] = newCountryId;
        navigate(`/${pathParts.join('/')}`);
      } else {
        navigate(`/${newCountryId}`);
      }
    },
    [location.pathname, navigate]
  );

  useEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setContentHeight(0), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Country selector"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          transition: 'background-color 0.15s ease',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <IconWorld size={18} color={colors.text.inverse} />
      </button>

      {(open || contentHeight > 0) && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, cursor: 'default' }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              transform: visible ? 'translateY(0)' : 'translateY(-8px)',
              marginTop: '10px',
              minWidth: '220px',
              overflow: 'hidden',
              maxHeight: visible ? `${contentHeight}px` : '0px',
              opacity: visible ? 1 : 0,
              transition:
                'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
              zIndex: 1001,
            }}
          >
            <div ref={contentRef} style={{ padding: '8px' }}>
              {countries.map((country, i) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountryChange(country.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: typography.fontFamily.primary,
                    fontWeight:
                      countryId === country.id
                        ? typography.fontWeight.bold
                        : typography.fontWeight.semibold,
                    color: colors.primary[800],
                    transition: 'background-color 0.12s ease, color 0.12s ease, opacity 0.3s ease',
                    transitionDelay: visible ? `${i * 50}ms` : '0ms',
                    opacity: visible ? 1 : 0,
                    lineHeight: '1.3',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary[500];
                    e.currentTarget.style.color = colors.text.inverse;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.primary[800];
                  }}
                >
                  {country.label}
                  {countryId === country.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
