import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/upload/FileUploader';
import { Loader2, Save, Home, Camera, DollarSign, MapPin } from 'lucide-react';

// Types for the form
type TypeUnite = 'chambre_simple' | 'chambre_double' | 'chambre_salon' | 'studio' | 'appartement' | 'boutique';
type StatutUnite = 'libre' | 'occupé' | 'maintenance';
type TypeLocation = 'court_terme' | 'long_terme' | 'mixte';

interface UniteFormData {
  nom: string;
  type: TypeUnite;
  statut: StatutUnite;
  description: string;
  etage: number;
  numero_chambre: string;
  position: string;
  type_location: TypeLocation;
  loyer_mensuel: number;
  loyer_journalier: number;
  loyer_hebdomadaire: number;
  caution_mois: number;
  superficie_m2: number;
  meuble: boolean;
  amenities: string[];
  photos: string[];
  video_url: string;
  disponible_a_partir: string;
}

interface UniteFormProps {
  maisonId: string;
  initialData?: Partial<UniteFormData>;
  onSubmit: (data: UniteFormData) => Promise<void>;
  onCancel: () => void;
}

const AMENITIES_OPTIONS = [
  'Climatisation',
  'Ventilateur',
  'Wifi',
  'Eau chaude',
  'Cuisine équipée',
  'Réfrigérateur',
  'TV',
  'Parking',
  'Balcon',
  'Sécurité 24h',
  'Gardien',
  'Groupe électrogène',
];

export function UniteForm({ maisonId, initialData, onSubmit, onCancel }: UniteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UniteFormData>({
    nom: initialData?.nom || '',
    type: initialData?.type || 'chambre_simple',
    statut: initialData?.statut || 'libre',
    description: initialData?.description || '',
    etage: initialData?.etage || 0,
    numero_chambre: initialData?.numero_chambre || '',
    position: initialData?.position || '',
    type_location: initialData?.type_location || 'long_terme',
    loyer_mensuel: initialData?.loyer_mensuel || 0,
    loyer_journalier: initialData?.loyer_journalier || 0,
    loyer_hebdomadaire: initialData?.loyer_hebdomadaire || 0,
    caution_mois: initialData?.caution_mois || 1,
    superficie_m2: initialData?.superficie_m2 || 0,
    meuble: initialData?.meuble || false,
    amenities: initialData?.amenities || [],
    photos: initialData?.photos || [],
    video_url: initialData?.video_url || '',
    disponible_a_partir: initialData?.disponible_a_partir || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Position</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Tarifs</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Photos</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l&apos;unité *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Chambre R1, Studio A2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d&apos;unité *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TypeUnite }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chambre_simple">Chambre simple</SelectItem>
                  <SelectItem value="chambre_double">Chambre double</SelectItem>
                  <SelectItem value="chambre_salon">Chambre + Salon</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="boutique">Boutique / Local</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData(prev => ({ ...prev, statut: value as StatutUnite }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="occupé">Occupé</SelectItem>
                  <SelectItem value="maintenance">En maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_location">Type de location</Label>
              <Select
                value={formData.type_location}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type_location: value as TypeLocation }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long_terme">Location longue durée</SelectItem>
                  <SelectItem value="court_terme">Location courte durée</SelectItem>
                  <SelectItem value="mixte">Mixte (les deux)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="superficie">Superficie (m²)</Label>
              <Input
                id="superficie"
                type="number"
                min="0"
                value={formData.superficie_m2 || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, superficie_m2: parseInt(e.target.value) || 0 }))}
                placeholder="25"
              />
            </div>

            <div className="space-y-2 flex items-center justify-between">
              <Label htmlFor="meuble">Meublé</Label>
              <Switch
                id="meuble"
                checked={formData.meuble}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, meuble: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez l'unité, ses avantages, équipements..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Équipements et commodités</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etage">Étage</Label>
              <Select
                value={formData.etage.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, etage: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Rez-de-chaussée</SelectItem>
                  <SelectItem value="1">1er étage</SelectItem>
                  <SelectItem value="2">2ème étage</SelectItem>
                  <SelectItem value="3">3ème étage</SelectItem>
                  <SelectItem value="4">4ème étage</SelectItem>
                  <SelectItem value="5">5ème étage+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_chambre">Numéro de chambre</Label>
              <Input
                id="numero_chambre"
                value={formData.numero_chambre}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_chambre: e.target.value }))}
                placeholder="Ex: 101, A2, R1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vue_rue">Vue sur rue</SelectItem>
                  <SelectItem value="vue_cour">Vue sur cour</SelectItem>
                  <SelectItem value="coin">En coin</SelectItem>
                  <SelectItem value="centre">Centre</SelectItem>
                  <SelectItem value="facade">Façade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disponible">Disponible à partir du</Label>
            <Input
              id="disponible"
              type="date"
              value={formData.disponible_a_partir}
              onChange={(e) => setFormData(prev => ({ ...prev, disponible_a_partir: e.target.value }))}
            />
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location longue durée</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loyer_mensuel">Loyer mensuel (FCFA) *</Label>
                <Input
                  id="loyer_mensuel"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.loyer_mensuel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, loyer_mensuel: parseInt(e.target.value) || 0 }))}
                  placeholder="50000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caution">Caution (mois)</Label>
                <Select
                  value={formData.caution_mois.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, caution_mois: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="2">2 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {(formData.type_location === 'court_terme' || formData.type_location === 'mixte') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location courte durée</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loyer_journalier">Tarif par nuit (FCFA)</Label>
                  <Input
                    id="loyer_journalier"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.loyer_journalier || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, loyer_journalier: parseInt(e.target.value) || 0 }))}
                    placeholder="15000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loyer_hebdo">Tarif hebdomadaire (FCFA)</Label>
                  <Input
                    id="loyer_hebdo"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.loyer_hebdomadaire || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, loyer_hebdomadaire: parseInt(e.target.value) || 0 }))}
                    placeholder="80000"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Photos de l&apos;unité</Label>
            <p className="text-sm text-muted-foreground">
              Ajoutez des photos pour permettre aux visiteurs de faire une visite virtuelle
            </p>
            <FileUploader
              accept="image/*"
              multiple={true}
              maxFiles={10}
              maxSizeMB={5}
              folder={`units/${maisonId}`}
              label="Glissez vos photos ici (max 10 photos)"
              existingFiles={formData.photos}
              onUpload={(urls) => setFormData(prev => ({ ...prev, photos: urls }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Lien vidéo (YouTube, etc.)</Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
