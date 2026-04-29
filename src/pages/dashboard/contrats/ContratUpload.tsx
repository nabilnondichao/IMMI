import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, ArrowLeft, Calendar, User, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractUploader } from '@/components/upload/FileUploader';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ContratFormData {
  locataire_id: string;
  unite_id: string;
  date_effet: string;
  date_fin: string;
  montant_loyer: number;
  montant_caution: number;
  jour_paiement: number;
  fichier_contrat_url: string | null;
}

export default function ContratUpload() {
  const { contratId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [unites, setUnites] = useState<any[]>([]);
  const [formData, setFormData] = useState<ContratFormData>({
    locataire_id: '',
    unite_id: '',
    date_effet: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    montant_loyer: 0,
    montant_caution: 0,
    jour_paiement: 5,
    fichier_contrat_url: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch locataires
      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', user.id);
      
      setLocataires(locatairesData || []);

      // Fetch unites via maisons
      const { data: maisonsData } = await supabase
        .from('maisons')
        .select('id, nom')
        .eq('proprietaire_id', user.id);

      if (maisonsData && maisonsData.length > 0) {
        const maisonIds = maisonsData.map(m => m.id);
        const { data: unitesData } = await supabase
          .from('unites')
          .select('*, maisons(nom)')
          .in('maison_id', maisonIds);
        
        setUnites(unitesData || []);
      }

      // If editing, fetch existing contrat
      if (contratId) {
        const { data: contratData } = await supabase
          .from('contrats')
          .select('*')
          .eq('id', contratId)
          .single();

        if (contratData) {
          setFormData({
            locataire_id: contratData.locataire_id,
            unite_id: contratData.unite_id,
            date_effet: contratData.date_effet,
            date_fin: contratData.date_fin,
            montant_loyer: contratData.montant_loyer || 0,
            montant_caution: contratData.montant_caution || 0,
            jour_paiement: contratData.jour_paiement || 5,
            fichier_contrat_url: contratData.fichier_contrat_url,
          });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user, contratId]);

  const handleUniteChange = (uniteId: string) => {
    const unite = unites.find(u => u.id === uniteId);
    setFormData(prev => ({
      ...prev,
      unite_id: uniteId,
      montant_loyer: unite?.loyer_mensuel || prev.montant_loyer,
      montant_caution: (unite?.loyer_mensuel || 0) * (unite?.caution_mois || 2),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const contratData = {
        ...formData,
        proprietaire_id: user.id,
        statut: 'actif',
        preavis_jours: 30,
        caution_mois: Math.ceil(formData.montant_caution / formData.montant_loyer) || 2,
      };

      if (contratId) {
        // Update existing
        await supabase
          .from('contrats')
          .update(contratData)
          .eq('id', contratId);
      } else {
        // Create new
        await supabase
          .from('contrats')
          .insert([contratData]);
      }

      // Update unite status to occupied if new contract
      if (!contratId && formData.unite_id) {
        await supabase
          .from('unites')
          .update({ statut: 'occupé' })
          .eq('id', formData.unite_id);
      }

      navigate('/dashboard/contrats');
    } catch (error) {
      console.error('Error saving contrat:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {contratId ? 'Modifier le contrat' : 'Nouveau contrat de bail'}
          </h1>
          <p className="text-muted-foreground">
            Créez ou importez un contrat de location
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parties au contrat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Parties au contrat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Locataire *</Label>
              <Select
                value={formData.locataire_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, locataire_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un locataire" />
                </SelectTrigger>
                <SelectContent>
                  {locataires.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.prenom} {loc.nom} - {loc.telephone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unité / Logement *</Label>
              <Select
                value={formData.unite_id}
                onValueChange={handleUniteChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  {unites.map((unite) => (
                    <SelectItem key={unite.id} value={unite.id}>
                      {unite.maisons?.nom} - {unite.nom} ({new Intl.NumberFormat('fr-FR').format(unite.loyer_mensuel)} FCFA)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dates et durée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Durée du contrat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_effet">Date d&apos;effet *</Label>
              <Input
                id="date_effet"
                type="date"
                value={formData.date_effet}
                onChange={(e) => setFormData(prev => ({ ...prev, date_effet: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin *</Label>
              <Input
                id="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData(prev => ({ ...prev, date_fin: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jour_paiement">Jour de paiement du loyer</Label>
              <Select
                value={formData.jour_paiement.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, jour_paiement: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Le {day} de chaque mois
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conditions financières */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Conditions financières
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant_loyer">Loyer mensuel (FCFA) *</Label>
              <Input
                id="montant_loyer"
                type="number"
                min="0"
                step="1000"
                value={formData.montant_loyer || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, montant_loyer: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant_caution">Caution totale (FCFA) *</Label>
              <Input
                id="montant_caution"
                type="number"
                min="0"
                step="1000"
                value={formData.montant_caution || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, montant_caution: parseInt(e.target.value) || 0 }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Généralement 2 mois de loyer = {new Intl.NumberFormat('fr-FR').format(formData.montant_loyer * 2)} FCFA
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Document du contrat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document du contrat
            </CardTitle>
            <CardDescription>
              Importez votre contrat de bail signé (PDF ou Word)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContractUploader
              existingUrl={formData.fichier_contrat_url || undefined}
              onUpload={(url) => setFormData(prev => ({ ...prev, fichier_contrat_url: url }))}
            />

            {formData.fichier_contrat_url && (
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Contrat importé avec succès</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving || !formData.locataire_id || !formData.unite_id}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {contratId ? 'Mettre à jour' : 'Créer le contrat'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
