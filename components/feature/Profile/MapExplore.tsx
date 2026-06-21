'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getJitteredCoordinates } from '@/lib/constants/countryCoords';
import { getFlagImageUrl, getCountryName } from '@/lib/constants/countries';

// Fix Leaflet marker icons issue in Next.js environment
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface ExploreUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  countryCode: string | null;
  isPartner: boolean;
  verifiedOrosCount: number;
}

interface MapExploreProps {
  users: ExploreUser[];
}

export default function MapExplore({ users }: MapExploreProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(leafletMapRef.current);
    }

    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Group users by country to apply jitter
    const countryCount: Record<string, number> = {};

    users.forEach((user) => {
      if (!user.countryCode) return;

      const code = user.countryCode.toUpperCase();
      const index = countryCount[code] || 0;
      countryCount[code] = index + 1;

      const position = getJitteredCoordinates(code, index);

      const flagUrl = getFlagImageUrl(user.countryCode);
      const countryName = getCountryName(user.countryCode);

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #458B9E; display: flex; align-items: center; justify-content: center; overflow: hidden; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0;">
              ${user.avatar 
                ? `<img src="/api/user/${user.id}/avatar" style="width: 100%; height: 100%; object-fit: cover;" />` 
                : `<span>${user.name.charAt(0).toUpperCase()}</span>`
              }
            </div>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis;">${user.name}</h4>
              ${user.username ? `<p style="margin: 0; font-size: 11px; color: #888; overflow: hidden; text-overflow: ellipsis;">@${user.username}</p>` : ''}
            </div>
          </div>
          <div style="font-size: 11px; color: #555; margin-bottom: 10px; line-height: 1.4;">
            ${user.title ? `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>Title:</strong> ${user.title}</div>` : ''}
            ${user.company ? `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>Company:</strong> ${user.company}</div>` : ''}
            ${user.location ? `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>Location:</strong> ${user.location}</div>` : ''}
            ${flagUrl ? `<div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;"><strong>Country:</strong> <img src="${flagUrl}" style="border-radius: 2px;" width="14" height="10" /> ${countryName}</div>` : ''}
          </div>
          <a href="/oro/${user.id}" style="display: block; text-align: center; background: #458B9E; color: white; border-radius: 6px; padding: 6px 12px; font-size: 11px; text-decoration: none; font-weight: 600; transition: background 0.2s;">View Profile</a>
        </div>
      `;

      const marker = L.marker(position)
        .addTo(map)
        .bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    // Auto pan/zoom to fit markers if there are any
    if (markersRef.current.length > 0) {
      try {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.15));
      } catch (err) {
        console.error('Error fitting map bounds:', err);
      }
    } else {
      map.setView([20, 0], 2);
    }

  }, [users]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div ref={mapRef} style={{ height: '500px', width: '100%', zIndex: 1 }} />
    </div>
  );
}
