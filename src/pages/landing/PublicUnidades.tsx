/**
 * PublicUnidades.tsx — Página pública de Unidades da Landing Page
 * Exibe todas as unidades cadastradas com as informações dos usuários associados
 * Inclui mapa satélite Esri World Imagery (via Leaflet CDN) integrado ao visual do site
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Search, Building2, ChevronRight, Mail, Globe2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

const BLUE = '#1D4ED8';
const GREEN = '#059669';
const SITE_BG = '#08090c';

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
const FABLAB_LOGO_URL = 'https://images.seeklogo.com/logo-png/20/2/fablab-logo-png_seeklogo-203707.png';

function FabLabLogo({ size = 28 }: { size?: number }) {
  return (
    <img
      src={FABLAB_LOGO_URL}
      alt="FabLab"
      style={{ height: size, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Cores dos cards
// ---------------------------------------------------------------------------
const UNIT_COLORS = [
  { bg: 'rgba(29,78,216,0.15)', border: 'rgba(29,78,216,0.35)', accent: '#93C5FD' },
  { bg: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.35)', accent: '#6EE7B7' },
  { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)', accent: '#C4B5FD' },
  { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.35)', accent: '#FCA5A5' },
  { bg: 'rgba(234,88,12,0.15)', border: 'rgba(234,88,12,0.35)', accent: '#FED7AA' },
  { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.35)', accent: '#BAE6FD' },
];

interface UnitInfo {
  name: string;
  userCount: number;
  adminName?: string;
  adminEmail?: string;
}

// ---------------------------------------------------------------------------
// Satellite Map Section (Esri World Imagery via Leaflet CDN)
// ---------------------------------------------------------------------------

// Coordenadas de exemplo para FabLabs brasileiros
const SAMPLE_POINTS = [
  { lat: -23.5505, lng: -46.6333, label: 'São Paulo' },
  { lat: -22.9068, lng: -43.1729, label: 'Rio de Janeiro' },
  { lat: -19.9167, lng: -43.9345, label: 'Belo Horizonte' },
  { lat: -15.7801, lng: -47.9292, label: 'Brasília' },
  { lat: -30.0346, lng: -51.2177, label: 'Porto Alegre' },
  { lat: -3.7172, lng: -38.5433, label: 'Fortaleza' },
  { lat: -8.0476, lng: -34.8770, label: 'Recife' },
  { lat: -12.9714, lng: -38.5014, label: 'Salvador' },
  { lat: -1.4558, lng: -48.4902, label: 'Belém' },
  { lat: -3.1190, lng: -60.0217, label: 'Manaus' },
  { lat: -25.4284, lng: -49.2733, label: 'Curitiba' },
];

function SatelliteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<unknown>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    function initMap(L: unknown) {
      if (!mapRef.current || mapInstanceRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Lmap = L as any;

      const map = Lmap.map(mapRef.current, {
        center: [-14.2350, -51.9253],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Esri World Imagery — visão de satélite
      Lmap.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map);

      // Esri World Boundaries and Places overlay (rótulos de cidades/países)
      Lmap.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.7 }
      ).addTo(map);

      // Custom marker icon
      const markerIcon = Lmap.divIcon({
        className: '',
        html: `
          <div style="
            width: 28px; height: 28px;
            background: ${BLUE};
            border: 2.5px solid rgba(147,197,253,0.9);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 0 12px rgba(29,78,216,0.7), 0 2px 8px rgba(0,0,0,0.5);
            position: relative;
          ">
            <div style="
              position: absolute; top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              width: 8px; height: 8px;
              background: #fff; border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      // Add markers
      SAMPLE_POINTS.forEach(pt => {
        Lmap.marker([pt.lat, pt.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="
              background: #0f111a; color: #fff;
              border-radius: 10px; padding: 10px 14px;
              font-family: 'Space Grotesk', sans-serif;
              border: 1px solid rgba(29,78,216,0.4);
              min-width: 140px;
            ">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <div style="width:8px;height:8px;border-radius:50%;background:${GREEN};flex-shrink:0"></div>
                <span style="font-size:13px;font-weight:700">${pt.label}</span>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.06em">FabLab Unidade</div>
            </div>
          `, {
            className: 'fablab-popup',
          });
      });

      // Zoom control custom position
      Lmap.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution bottom-left, styled
      Lmap.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    }

    if ((window as unknown as { L?: unknown }).L) {
      initMap((window as unknown as { L: unknown }).L);
      leafletRef.current = (window as unknown as { L: unknown }).L;
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      initMap((window as unknown as { L: unknown }).L);
      leafletRef.current = (window as unknown as { L: unknown }).L;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Top fade — blends map into site background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(to bottom, ${SITE_BG} 0%, transparent 100%)`,
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: `linear-gradient(to top, ${SITE_BG} 0%, transparent 100%)`,
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Left fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 80,
        background: `linear-gradient(to right, ${SITE_BG} 0%, transparent 100%)`,
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Right fade */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
        background: `linear-gradient(to left, ${SITE_BG} 0%, transparent 100%)`,
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Dark overlay para harmonizar com o tema escuro do site */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(8,9,12,0.18)',
        zIndex: 5, pointerEvents: 'none',
      }} />

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: 500,
          background: SITE_BG,
        }}
      />

      {/* Floating badge */}
      <div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(8,9,12,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(29,78,216,0.35)',
        borderRadius: 12, padding: '8px 14px',
        fontSize: 12, fontWeight: 700, color: '#93C5FD',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        letterSpacing: '0.04em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <Globe2 size={14} style={{ color: BLUE }} />
        Esri Satellite
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit Card
// ---------------------------------------------------------------------------
function UnitCard({ unit, index }: { unit: UnitInfo; index: number }) {
  const { t } = useTranslation();
  const color = UNIT_COLORS[index % UNIT_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 20,
        padding: 28,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color.border;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${color.bg}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        borderRadius: '50%', background: color.bg, filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: color.bg, border: `1px solid ${color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={22} style={{ color: color.accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{unit.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <MapPin size={11} />
            <span>{t('publicUnidades.fablabUnit')}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={14} style={{ color: color.accent }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{unit.userCount}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {unit.userCount === 1 ? t('publicUnidades.user') : t('publicUnidades.users')}
            </div>
          </div>
        </div>
      </div>

      {unit.adminName && (
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {t('app.responsible')}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{unit.adminName}</div>
          {unit.adminEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              <Mail size={10} /> {unit.adminEmail}
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 700, color: '#6EE7B7',
        background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
        padding: '3px 10px', borderRadius: 100,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN }} />
        {t('publicUnidades.active')}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function PublicUnidades() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Inject Leaflet popup styles to match dark theme
    if (!document.getElementById('leaflet-dark-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-dark-styles';
      style.textContent = `
        .fablab-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .fablab-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .fablab-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(8,9,12,0.9) !important;
          color: rgba(255,255,255,0.7) !important;
          border-color: rgba(255,255,255,0.08) !important;
          font-size: 18px !important;
          line-height: 28px !important;
          width: 30px !important;
          height: 30px !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(29,78,216,0.4) !important;
          color: #fff !important;
        }
        .leaflet-control-attribution {
          background: rgba(8,9,12,0.7) !important;
          color: rgba(255,255,255,0.25) !important;
          font-size: 9px !important;
          backdrop-filter: blur(8px);
          border-radius: 6px 6px 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: rgba(255,255,255,0.35) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      const { data } = await supabase
        .from('users')
        .select('unit, name, email, role, active')
        .eq('active', true);

      if (!data) { setLoading(false); return; }

      const map = new Map<string, { users: typeof data; admin?: typeof data[0] }>();

      data.forEach(user => {
        const unitName = user.unit?.trim() || t('publicUnidades.noUnit');
        if (!map.has(unitName)) map.set(unitName, { users: [] });
        const entry = map.get(unitName)!;
        entry.users.push(user);
        if (!entry.admin || user.role === 'admin' || user.role === 'manager') {
          entry.admin = user;
        }
      });

      const result: UnitInfo[] = Array.from(map.entries())
        .filter(([name]) => name !== t('publicUnidades.noUnit'))
        .map(([name, { users, admin }]) => ({
          name,
          userCount: users.length,
          adminName: admin?.name,
          adminEmail: admin?.email,
        }))
        .sort((a, b) => b.userCount - a.userCount);

      setUnits(result);
      setLoading(false);
    }

    fetchUnits();
  }, []);

  const filtered = units.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: SITE_BG, color: '#fff', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64,
        background: 'rgba(8,9,12,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/landing')}>
          <FabLabLogo size={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              fab<span style={{ color: BLUE }}>lab</span>
            </span>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>platform</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button onClick={() => navigate('/landing')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }} className="hover:text-white transition-colors">{t('publicBlog.home')}</button>
          <button onClick={() => navigate('/landing/blog')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }} className="hover:text-white transition-colors">{t('sidebar.blog')}</button>
          <button onClick={() => navigate('/landing/unidades')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('publicBlog.units')}</button>
        </div>
        <button onClick={() => navigate('/login')} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {t('app.login')}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: 120, paddingBottom: 60, textAlign: 'center', padding: '120px 24px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700,
            padding: '6px 16px', borderRadius: 100, marginBottom: 20,
            background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#6EE7B7',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{t('publicUnidades.fablabNetwork')}</span>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
            {t('publicUnidades.ourUnits')}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 36px' }}>
            {t('publicUnidades.heroDesc')}
          </p>

          <div style={{ maxWidth: 400, margin: '0 auto', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('publicUnidades.searchUnit')}
              style={{
                width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {!loading && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
              {filtered.length} {filtered.length === 1 ? t('publicUnidades.unitFound') : t('publicUnidades.unitsFound')}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── SATELLITE MAP SECTION ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ marginBottom: -40 }}
      >
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 24, padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
          }}>
            <Globe2 size={13} style={{ color: BLUE }} />
            {t('publicUnidades.geoDistribution')}
          </div>
        </div>

        <SatelliteMap />
      </motion.div>

      {/* Units grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                height: 200, borderRadius: 20, background: 'rgba(255,255,255,0.04)',
                animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t('publicUnidades.noUnitsFound')}</p>
            <p style={{ fontSize: 14 }}>{t('publicUnidades.unitsWillAppear')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filtered.map((unit, i) => (
              <UnitCard key={unit.name} unit={unit} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {!loading && units.length > 0 && (
        <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            padding: '40px 60px', borderRadius: 24,
            background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)',
            maxWidth: 460,
          }}>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
              {t('publicUnidades.unitNotListed')}
            </p>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: BLUE, color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {t('publicUnidades.registerMyUnit')} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
