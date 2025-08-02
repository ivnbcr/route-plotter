import { useMapEvents } from 'react-leaflet';
import type { LatLng } from '../types';

type Props = {
  onMapClick: (e: { latlng: LatLng }) => void;
};

export const MapClickHandler = ({ onMapClick }: Props) => {
  useMapEvents({
    click: onMapClick
  });
  return null;
};