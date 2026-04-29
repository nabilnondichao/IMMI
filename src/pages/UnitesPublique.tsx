import { useState, type ReactNode } from 'react';
import { Heart, MapPin, Wifi, Wind, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { usePublicUnites } from '../hooks/useData';
import { WhatsAppButton } from '../components/contact/WhatsAppButton';

export default function UnitesPublique() {
  const [searchCity, setSearchCity] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const { unites, isLoading } = usePublicUnites({
    ville: searchCity,
    type_location: selectedType,
  });

  const handleBooking = (unite: any) => {
    // Send to reservation page with pre-filled data
    window.location.href = `/booking/${unite.id}`;
  };

  const getAmenityIcon = (amenity: string): ReactNode => {
    const amenityIcons: { [key: string]: ReactNode } = {
      wifi: <Wifi className="w-4 h-4" />,
      climatisation: <Wind className="w-4 h-4" />,
    };
    return amenityIcons[amenity.toLowerCase()] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Découvrez nos Chambres</h1>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par ville..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['court_terme', 'long_terme', 'mixte'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedType(selectedType === type ? '' : type)}
                  className="capitalize"
                >
                  {type === 'court_terme' ? 'Court terme' : type === 'long_terme' ? 'Long terme' : 'Mixte'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-300 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : unites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">Aucune chambre trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unites.map((unite: any) => (
              <Card key={unite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Photo Gallery */}
                <div className="relative h-64 bg-slate-200">
                  {unite.photos && unite.photos.length > 0 ? (
                    <img
                      src={unite.photos[0]}
                      alt={unite.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-300">
                      <MapPin className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                  {unite.photos && unite.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      +{unite.photos.length - 1} photos
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {unite.numero_chambre} - {unite.nom}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Étage {unite.etage}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary">
                      {unite.type_location === 'court_terme' ? '📅 Court terme' : '📆 Long terme'}
                    </Badge>
                    {unite.meuble && <Badge variant="outline">Meublé</Badge>}
                  </div>

                  {/* Details */}
                  <div className="text-sm text-slate-600 mb-3 space-y-1">
                    <p>{unite.superficie_m2}m² | Position: {unite.position}</p>
                    {unite.amenities && unite.amenities.length > 0 && (
                      <div className="flex gap-2">
                        {unite.amenities.slice(0, 3).map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-1 text-xs text-slate-600"
                          >
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600">Loyer mensuel</p>
                        <p className="font-bold text-lg text-slate-900">
                          {unite.loyer_mensuel?.toLocaleString()} FCFA
                        </p>
                      </div>
                      {unite.loyer_journalier && (
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Par jour</p>
                          <p className="font-semibold text-slate-900">
                            {unite.loyer_journalier?.toLocaleString()} FCFA
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBooking(unite)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Réserver
                    </Button>
                    {unite.maisons?.whatsapp_contact && (
                      <WhatsAppButton
                        phoneNumber={unite.maisons.whatsapp_contact}
                        message={`Bonjour, je suis intéressé par la chambre ${unite.nom} à ${unite.maisons.nom}`}
                        variant="outline"
                        showText={false}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
