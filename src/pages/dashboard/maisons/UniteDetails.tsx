import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Home, MapPin, Calendar,
  DollarSign, CheckCircle, Wifi, Wind, Car, History, UserCheck, LogOut as LogOutIcon, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoGallery } from '@/components/gallery/PhotoGallery';
import { WhatsAppButton, FloatingWhatsAppButton } from '@/components/contact/WhatsAppButton';
import { supabase, Unite, Maison } from '@/lib/supabase';
import { useHistoriqueLocataires, createHistorique, updateHistorique } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

export default function UniteDetails() {
  const { uniteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unite, setUnite] = useState<Unite | null>(null);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [loading, setLoading] = useState(true);
  const { historique, refresh: refreshHistorique } = useHistoriqueLocataires(uniteId);
  const [histDialogOpen, setHistDialogOpen] = useState(false);
  const [sortieDialogOpen, setSortieDialogOpen] = useState(false);
  const [selectedHistId, setSelectedHistId] = useState<string | null>(null);
  const [histForm, setHistForm] = useState({ nom_locataire: '', prenom_locataire: '', telephone_locataire: '', date_entree: new Date().toISOString().split('T')[0], loyer_mensuel: '', notes: '' });
  const [sortieForm, setSortieForm] = useState({ date_sortie: new Date().toISOString().split('T')[0], motif_depart: '' });
  const [histSubmitting, setHistSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!uniteId) return;

      const { data: uniteData, error: uniteError } = await supabase
        .from('unites')
        .select('*')
        .eq('id', uniteId)
        .single();

      if (uniteError) {
        console.error('Error fetching unite:', uniteError);
        setLoading(false);
        return;
      }

      setUnite(uniteData);

      // Fetch maison info
      const { data: maisonData } = await supabase
        .from('maisons')
        .select('*')
        .eq('id', uniteData.maison_id)
        .single();

      setMaison(maisonData);
      setLoading(false);
    };

    fetchData();
  }, [uniteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!unite) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unité non trouvée</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'libre': return 'bg-green-100 text-green-800';
      case 'occupé': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      chambre_simple: 'Chambre simple',
      chambre_double: 'Chambre double',
      chambre_salon: 'Chambre + Salon',
      studio: 'Studio',
      appartement: 'Appartement',
      boutique: 'Boutique / Local',
    };
    return labels[type] || type;
  };

  const getLocationTypeLabel = (type?: string) => {
    switch (type) {
      case 'court_terme': return 'Location courte durée';
      case 'long_terme': return 'Location longue durée';
      case 'mixte': return 'Court et long terme';
      default: return 'Location longue durée';
    }
  };

  const amenityIcons: Record<string, ReactNode> = {
    'Climatisation': <Wind className="h-4 w-4" />,
    'Wifi': <Wifi className="h-4 w-4" />,
    'Parking': <Car className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={() => navigate(`/dashboard/unites/${uniteId}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      {/* Photo Gallery */}
      {unite.photos && unite.photos.length > 0 && (
        <PhotoGallery photos={unite.photos} unitName={unite.nom} />
      )}

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{unite.nom}</h1>
              <Badge className={getStatusColor(unite.statut)}>
                {unite.statut === 'libre' ? 'Disponible' : unite.statut}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {getTypeLabel(unite.type)}
              </span>
              {maison && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {maison.nom}, {maison.ville}
                </span>
              )}
              {unite.superficie_m2 && (
                <span>{unite.superficie_m2} m²</span>
              )}
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {unite.etage !== undefined && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {unite.etage === 0 ? 'RDC' : `${unite.etage}e`}
                  </p>
                  <p className="text-xs text-muted-foreground">Étage</p>
                </CardContent>
              </Card>
            )}
            {unite.numero_chambre && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{unite.numero_chambre}</p>
                  <p className="text-xs text-muted-foreground">N° Chambre</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{unite.caution_mois || 1}</p>
                <p className="text-xs text-muted-foreground">Mois caution</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{unite.meuble ? 'Oui' : 'Non'}</p>
                <p className="text-xs text-muted-foreground">Meublé</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="amenities">Équipements</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
              {unite.video_url && <TabsTrigger value="video">Vidéo</TabsTrigger>}
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {unite.description ? (
                    <p className="whitespace-pre-line">{unite.description}</p>
                  ) : (
                    <p className="text-muted-foreground">Aucune description disponible</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="amenities" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {unite.amenities && unite.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {unite.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {amenityIcons[amenity] || <CheckCircle className="h-4 w-4 text-green-500" />}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun équipement spécifié</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historique" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" /> Historique des locataires
                  </CardTitle>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold"
                    onClick={() => { setHistForm({ nom_locataire: '', prenom_locataire: '', telephone_locataire: '', date_entree: new Date().toISOString().split('T')[0], loyer_mensuel: '', notes: '' }); setHistDialogOpen(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Ajouter
                  </Button>
                </CardHeader>
                <CardContent>
                  {historique.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Aucun historique enregistré pour cette unité.</p>
                  ) : (
                    <div className="space-y-3">
                      {historique.map(h => (
                        <div key={h.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                          <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center font-black text-[#B8860B] text-sm shrink-0">
                            {h.prenom_locataire[0]}{h.nom_locataire[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-slate-800">{h.prenom_locataire} {h.nom_locataire}</p>
                            <p className="text-xs text-slate-500">{h.loyer_mensuel.toLocaleString()} FCFA/mois</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><UserCheck size={10} /> Entrée : {new Date(h.date_entree).toLocaleDateString('fr-FR')}</span>
                              {h.date_sortie ? (
                                <span className="flex items-center gap-1"><LogOutIcon size={10} /> Sortie : {new Date(h.date_sortie).toLocaleDateString('fr-FR')}</span>
                              ) : (
                                <button className="text-[#B8860B] font-bold hover:underline" onClick={() => { setSelectedHistId(h.id); setSortieForm({ date_sortie: new Date().toISOString().split('T')[0], motif_depart: '' }); setSortieDialogOpen(true); }}>
                                  Enregistrer sortie
                                </button>
                              )}
                            </div>
                            {h.motif_depart && <p className="text-[10px] text-slate-400 mt-1">Motif : {h.motif_depart}</p>}
                          </div>
                          {!h.date_sortie && (
                            <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black shrink-0">Actuel</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {unite.video_url && (
              <TabsContent value="video" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="aspect-video">
                      <iframe
                        src={unite.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar - Pricing & Contact */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tarifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(unite.loyer_mensuel)}
                </p>
                <p className="text-sm text-muted-foreground">par mois</p>
              </div>

              {(unite.type_location === 'court_terme' || unite.type_location === 'mixte') && (
                <>
                  {unite.loyer_journalier && (
                    <div className="pt-3 border-t">
                      <p className="text-xl font-semibold">
                        {formatPrice(unite.loyer_journalier)}
                      </p>
                      <p className="text-sm text-muted-foreground">par nuit</p>
                    </div>
                  )}
                  {unite.loyer_hebdomadaire && (
                    <div>
                      <p className="text-xl font-semibold">
                        {formatPrice(unite.loyer_hebdomadaire)}
                      </p>
                      <p className="text-sm text-muted-foreground">par semaine</p>
                    </div>
                  )}
                </>
              )}

              <Badge variant="outline" className="w-full justify-center py-2">
                {getLocationTypeLabel(unite.type_location)}
              </Badge>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contacter le propriétaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {maison?.whatsapp_contact && (
                <WhatsAppButton
                  phoneNumber={maison.whatsapp_contact}
                  propertyName={maison.nom}
                  unitName={unite.nom}
                  className="w-full"
                />
              )}
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Planifier une visite
              </Button>
            </CardContent>
          </Card>

          {/* Property Info */}
          {maison && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Propriété</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{maison.nom}</p>
                <p className="text-sm text-muted-foreground">{maison.adresse}</p>
                <p className="text-sm text-muted-foreground">{maison.ville}, {maison.pays}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      {maison?.whatsapp_contact && (
        <FloatingWhatsAppButton
          phoneNumber={maison.whatsapp_contact}
          propertyName={maison.nom}
        />
      )}

      {/* Dialog Ajouter Historique */}
      <Dialog open={histDialogOpen} onOpenChange={setHistDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black">Ajouter un locataire à l'historique</DialogTitle>
          </DialogHeader>
          <form onSubmit={async e => {
            e.preventDefault();
            if (!histForm.prenom_locataire || !histForm.nom_locataire || !histForm.loyer_mensuel || !user || !uniteId || !unite) return;
            setHistSubmitting(true);
            try {
              await createHistorique({
                unite_id: uniteId,
                locataire_id: null,
                proprietaire_id: user.id,
                nom_locataire: histForm.nom_locataire.trim(),
                prenom_locataire: histForm.prenom_locataire.trim(),
                telephone_locataire: histForm.telephone_locataire || null,
                date_entree: histForm.date_entree,
                date_sortie: null,
                loyer_mensuel: parseInt(histForm.loyer_mensuel),
                motif_depart: null,
                notes: histForm.notes || null,
              });
              setHistDialogOpen(false);
              refreshHistorique();
            } finally { setHistSubmitting(false); }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Prénom *</Label><Input className="rounded-xl" value={histForm.prenom_locataire} onChange={e => setHistForm(f => ({ ...f, prenom_locataire: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Nom *</Label><Input className="rounded-xl" value={histForm.nom_locataire} onChange={e => setHistForm(f => ({ ...f, nom_locataire: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Téléphone</Label><Input className="rounded-xl" value={histForm.telephone_locataire} onChange={e => setHistForm(f => ({ ...f, telephone_locataire: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Loyer mensuel (FCFA) *</Label><Input className="rounded-xl" type="number" value={histForm.loyer_mensuel} onChange={e => setHistForm(f => ({ ...f, loyer_mensuel: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Date d'entrée</Label><Input className="rounded-xl" type="date" value={histForm.date_entree} onChange={e => setHistForm(f => ({ ...f, date_entree: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={histSubmitting} className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-5">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Enregistrer Sortie */}
      <Dialog open={sortieDialogOpen} onOpenChange={setSortieDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black">Enregistrer la sortie</DialogTitle>
          </DialogHeader>
          <form onSubmit={async e => {
            e.preventDefault();
            if (!selectedHistId) return;
            setHistSubmitting(true);
            try {
              await updateHistorique(selectedHistId, { date_sortie: sortieForm.date_sortie, motif_depart: sortieForm.motif_depart || null });
              setSortieDialogOpen(false);
              refreshHistorique();
            } finally { setHistSubmitting(false); }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Date de sortie</Label><Input className="rounded-xl" type="date" value={sortieForm.date_sortie} onChange={e => setSortieForm(f => ({ ...f, date_sortie: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Motif de départ</Label><Input className="rounded-xl" placeholder="Fin de contrat, déménagement..." value={sortieForm.motif_depart} onChange={e => setSortieForm(f => ({ ...f, motif_depart: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={histSubmitting} className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-5">
                Confirmer la sortie
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
