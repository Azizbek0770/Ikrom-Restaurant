import React, { useEffect, useRef, useState } from 'react';

// Lightweight Leaflet loader and map picker using OpenStreetMap tiles and Nominatim reverse-geocoding.
// Loads Leaflet from CDN if not present.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.L) return resolve(window.L);

    // load css
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // load script
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    } else {
      // already added but not ready
      const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
      existing.onload = () => resolve(window.L);
      existing.onerror = (e) => reject(e);
    }
  });
}

const MapPicker = ({ initialLat, initialLng, onChange }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [addrLabel, setAddrLabel] = useState('');

  useEffect(() => {
    let mounted = true;
    loadLeaflet().then((L) => {
      if (!mounted) return;
      const center = initialLat && initialLng ? [initialLat, initialLng] : [41.2995, 69.2401];
      mapRef.current = L.map(containerRef.current, { center, zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      mapRef.current.on('click', async (ev) => {
        const { lat, lng } = ev.latlng;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);

        // attach dragend handler
        markerRef.current.on('dragend', async (e) => {
          const p = e.target.getLatLng();
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`);
            const json = await res.json();
            const display = json.display_name || '';
            setAddrLabel(display);
            if (onChange) onChange({ latitude: p.lat, longitude: p.lng, street_address: display });
          } catch (err) {
            if (onChange) onChange({ latitude: p.lat, longitude: p.lng, street_address: '' });
          }
        });

        // reverse geocode via Nominatim for initial click
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const json = await res.json();
          const display = json.display_name || '';
          setAddrLabel(display);
          if (onChange) onChange({ latitude: lat, longitude: lng, street_address: display });
        } catch (e) {
          if (onChange) onChange({ latitude: lat, longitude: lng, street_address: '' });
        }
      });

      // if initial position provided, place marker and reverse
      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(mapRef.current);
        mapRef.current.setView([initialLat, initialLng], 14);
        (async () => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${initialLat}&lon=${initialLng}`);
            const json = await res.json();
            const display = json.display_name || '';
            setAddrLabel(display);
            if (onChange) onChange({ latitude: initialLat, longitude: initialLng, street_address: display });
          } catch (e) {}
        })();
      }

      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { mounted = false; if (mapRef.current) mapRef.current.remove(); };
  }, []);

  // respond to prop changes (when editing existing address)
  useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    if (initialLat && initialLng) {
      const lat = parseFloat(initialLat);
      const lng = parseFloat(initialLng);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
      mapRef.current.setView([lat, lng], 14);
      (async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const json = await res.json();
          const display = json.display_name || '';
          setAddrLabel(display);
          if (onChange) onChange({ latitude: lat, longitude: lng, street_address: display });
        } catch (e) {}
      })();
    }
  }, [initialLat, initialLng]);

  return (
    <div>
      <div ref={containerRef} style={{ height: 240, width: '100%' }} className="rounded-lg overflow-hidden" />
      <p className="text-sm text-gray-600 mt-2">{addrLabel || 'Click on the map to select a location'}</p>
    </div>
  );
};

export default MapPicker;


