import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  AlertCircle,
  Wallet,
  CheckCircle2,
  MessageSquare,
  Printer,
  MoreVertical,
  Loader2,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMaisons, useAllUnites, useLocataires, usePaiements, useAvances, createPaiement } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RecuPaiement } from '@/components/pdf/RecuPaiement';

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function getMonthName(m: number) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2024, m - 1));
}

export default function PaymentsPage() {
  const { user, profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [houseFilter, setHouseFilter] = useState('all');
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [cashForm, setCashForm] = useState({
    locataire_id: '',
    montant: '',
    mois: String(new Date().getMonth() + 1),
    annee: String(new Date().getFullYear()),
    notes: '',
  });
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);
  const [dernierPaiement, setDernierPaiement] = useState<any>(null);

  const { maisons } = useMaisons();
  const { unites } = useAllUnites();
  const { locataires } = useLocataires();
  const { paiements, isLoading, refresh: refreshPaiements } = usePaiements({ mois: selectedMonth, annee: selectedYear });
  const { paiements: allPaiements } = usePaiements({});
  const { avances } = useAvances();

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2023, 2024, 2025, 2026];

  const filteredTenants = useMemo(() => {
    return locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      return houseFilter === 'all' || msn?.id === houseFilter;
    });
  }, [locataires, unites, maisons, houseFilter]);

  const monthlyStats = useMemo(() => {
    const scopedLocataires = locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      return houseFilter === 'all' || msn?.id === houseFilter;
    });

    const expected = scopedLocataires.reduce((sum, l) => {
      const unt = unites.find(u => u.id === l.unite_id);
      return sum + (unt?.loyer_mensuel || 0);
    }, 0);

    const received = paiements
      .filter(p => p.statut === 'payé')
      .reduce((sum, p) => sum + p.montant, 0);

    const pending = paiements
      .filter(p => p.statut === 'en_attente')
      .reduce((sum, p) => sum + p.montant, 0);

    const arrears = Math.max(0, expected - received);
    const recoveryRate = expected > 0 ? Math.round((received / expected) * 100) : 0;

    const totalAvances = avances
      .filter(a => a.type === 'loyer')
      .reduce((sum, a) => sum + a.montant_restant, 0);

    return { expected, received, arrears, recoveryRate, pending, totalAvances };
  }, [selectedMonth, selectedYear, houseFilter, locataires, unites, maisons, paiements, avances]);

  const locatairesEnArrieres = useMemo(() => {
    return locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      if (!unt) return false;
      const dateEntree = new Date(l.date_entree);
      const now = new Date();
      let totalDu = 0;
      let totalPaye = 0;
      const d = new Date(dateEntree.getFullYear(), dateEntree.getMonth(), 1);
      while (d <= now) {
        totalDu += unt.loyer_mensuel;
        d.setMonth(d.getMonth() + 1);
      }
      totalPaye = allPaiements
        .filter(p => p.locataire_id === l.id && p.statut === 'payé')
        .reduce((s, p) => s + p.montant, 0);
      return totalDu > totalPaye;
    });
  }, [locataires, unites, allPaiements]);

  function calculerMontantArrieres(locataireId: string): number {
    const l = locataires.find(x => x.id === locataireId);
    const unt = unites.find(u => u.id === l?.unite_id);
    if (!l || !unt) return 0;
    const dateEntree = new Date(l.date_entree);
    const now = new Date();
    let totalDu = 0;
    const d = new Date(dateEntree.getFullYear(), dateEntree.getMonth(), 1);
    while (d <= now) {
      totalDu += unt.loyer_mensuel;
      d.setMonth(d.getMonth() + 1);
    }
    const totalPaye = allPaiements
      .filter(p => p.locataire_id === locataireId && p.statut === 'payé')
      .reduce((s, p) => s + p.montant, 0);
    return Math.max(0, totalDu - totalPaye);
  }

  function getStatusBadge(locataireId: string, loyer: number) {
    const payment = paiements.find(p => p.locataire_id === locataireId);
    if (!payment) return <Badge className="bg-red-100 text-red-600 font-black text-[9px] rounded-full uppercase">Impayé</Badge>;
    if (payment.statut === 'en_attente') return <Badge className="bg-purple-100 text-purple-600 font-black text-[9px] rounded-full uppercase">MoMo en attente</Badge>;
    if (payment.statut === 'payé' && payment.montant >= loyer) return <Badge className="bg-green-100 text-green-600 font-black text-[9px] rounded-full uppercase">Payé</Badge>;
    if (payment.statut === 'payé' && payment.montant > 0) return <Badge className="bg-amber-100 text-amber-600 font-black text-[9px] rounded-full uppercase">Partiel</Badge>;
    return <Badge className="bg-red-100 text-red-600 font-black text-[9px] rounded-full uppercase">Impayé</Badge>;
  }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cashForm.locataire_id || !cashForm.montant) {
      setCashError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setCashSubmitting(true);
    setCashError(null);
    try {
      const loc = locataires.find(l => l.id === cashForm.locataire_id);
      const unt = unites.find(u => u.id === loc?.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      if (!loc || !unt || !msn || !user) throw new Error('Données manquantes');

      await createPaiement(
        {
          locataire_id: cashForm.locataire_id,
          unite_id: unt.id,
          maison_id: msn.id,
          proprietaire_id: user.id,
          mois: parseInt(cashForm.mois),
          annee: parseInt(cashForm.annee),
          montant: parseInt(cashForm.montant),
          type: 'cash',
          statut: 'payé',
          numero_transaction_momo: null,
          operateur_momo: null,
          capture_ecran_url: null,
          date_paiement: new Date().toISOString().split('T')[0],
          confirme_par_proprio: true,
          notes: cashForm.notes || null,
        },
        msn.nom,
        unt.nom
      );

      const moisNom = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][parseInt(cashForm.mois) - 1];
      const periodeStr = `${moisNom} ${cashForm.annee}`;
      const montantStr = parseInt(cashForm.montant).toLocaleString();

      setCashDialogOpen(false);
      setDernierPaiement({
        reference: result.reference_immo,
        locataireNom: `${loc.prenom} ${loc.nom}`,
        locataireTel: loc.telephone,
        locataireEmail: loc.email,
        unite: unt.nom,
        maison: msn.nom,
        montant: parseInt(cashForm.montant),
        mois: parseInt(cashForm.mois),
        annee: parseInt(cashForm.annee),
        periodeStr,
        montantStr,
      });
      setCashForm({ locataire_id: '', montant: '', mois: String(new Date().getMonth() + 1), annee: String(new Date().getFullYear()), notes: '' });
      refreshPaiements();
    } catch (err: unknown) {
      setCashError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setCashSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  const MOIS_NOMS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  return (
    <div className="p-8 pb-32 lg:pb-8">
      {/* MODAL SUCCÈS PAIEMENT + REÇU PDF */}
      {dernierPaiement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-black text-[#1A1A2E] mb-1">Paiement enregistré !</h3>
            <p className="text-xs text-slate-500 mb-6">
              {dernierPaiement.locataireNom} — {dernierPaiement.unite} — {MOIS_NOMS_LONG[(dernierPaiement.mois || 1) - 1]} {dernierPaiement.annee}
            </p>
            <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-6">
              <p className="text-2xl font-black text-[#B8860B]">{dernierPaiement.montant?.toLocaleString()} FCFA</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{dernierPaiement.reference}</p>
            </div>
            <PDFDownloadLink
              document={
                <RecuPaiement data={{
                  reference: dernierPaiement.reference || '',
                  proprioNom: profile ? `${profile.prenom} ${profile.nom}` : 'Propriétaire',
                  proprioContact: profile?.telephone || '',
                  locataireNom: dernierPaiement.locataireNom,
                  unite: dernierPaiement.unite,
                  maison: dernierPaiement.maison,
                  montant: dernierPaiement.montant,
                  periode: `${MOIS_NOMS_LONG[(dernierPaiement.mois || 1) - 1]} ${dernierPaiement.annee}`,
                  date: new Date().toLocaleDateString('fr-FR'),
                  mode: 'Espèces (Cash)',
                }} />
              }
              fileName={`Recu_${dernierPaiement.reference}.pdf`}
            >
              {({ loading }) => (
                <button
                  className="w-full bg-[#B8860B] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-3 hover:bg-[#9A700A] transition-all"
                  disabled={loading}
                >
                  <Download size={16} />
                  {loading ? 'Génération...' : 'Télécharger le reçu PDF'}
                </button>
              )}
            </PDFDownloadLink>
            {/* WhatsApp */}
            {dernierPaiement?.locataireTel && (
              <button
                onClick={() => {
                  const msg = encodeURIComponent(
                    `Bonjour ${dernierPaiement.locataireNom} !\n\n` +
                    `✅ *Votre paiement de loyer est confirmé.*\n\n` +
                    `📋 Référence : ${dernierPaiement.reference}\n` +
                    `🏠 Logement : ${dernierPaiement.maison} — ${dernierPaiement.unite}\n` +
                    `📅 Période : ${dernierPaiement.periodeStr}\n` +
                    `💰 Montant : ${dernierPaiement.montantStr} FCFA\n\n` +
                    `Merci pour votre paiement. — ImmoAfrik`
                  );
                  window.open(`https://wa.me/${dernierPaiement.locataireTel.replace(/[\s+]/g, '')}?text=${msg}`, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-2 transition-all"
              >
                <MessageSquare size={16} /> Envoyer sur WhatsApp
              </button>
            )}

            {/* Email */}
            {dernierPaiement?.locataireEmail && (
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Reçu de loyer — ${dernierPaiement.periodeStr}`);
                  const body = encodeURIComponent(
                    `Bonjour ${dernierPaiement.locataireNom},\n\n` +
                    `Votre paiement de loyer est confirmé.\n\n` +
                    `Référence : ${dernierPaiement.reference}\n` +
                    `Logement : ${dernierPaiement.maison} — ${dernierPaiement.unite}\n` +
                    `Période : ${dernierPaiement.periodeStr}\n` +
                    `Montant : ${dernierPaiement.montantStr} FCFA\n\n` +
                    `Merci pour votre paiement.\n\n` +
                    `${profile?.prenom || ''} ${profile?.nom || ''}\nImmoAfrik`
                  );
                  window.open(`mailto:${dernierPaiement.locataireEmail}?subject=${subject}&body=${body}`, '_blank');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-3 transition-all"
              >
                <Receipt size={16} /> Envoyer par Email
              </button>
            )}

            <button
              onClick={() => setDernierPaiement(null)}
              className="w-full py-3 rounded-2xl text-slate-400 font-bold text-sm hover:text-slate-600"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Gestion des Paiements</h1>
          <p className="text-sm text-slate-500">Suivi des loyers, arriérés et encaissements</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32 border-none font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="w-px h-4 bg-slate-200" />
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 border-none font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MÉTRIQUES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendu</p>
            <h3 className="text-xl font-black text-[#1A1A2E]">{monthlyStats.expected.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-1">Encaissé</p>
            <h3 className="text-xl font-black text-green-600">{monthlyStats.received.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-red-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-red-600/70 uppercase tracking-widest mb-1">Arriérés</p>
            <h3 className="text-xl font-black text-red-600">{monthlyStats.arrears.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-blue-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mb-1">Avances loyer</p>
            <h3 className="text-xl font-black text-blue-700">{monthlyStats.totalAvances.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-[#1A1A2E] text-white col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recouvrement</p>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-black">{monthlyStats.recoveryRate}%</h3>
              <Progress value={monthlyStats.recoveryRate} className="h-1.5 w-16 bg-white/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLEAU DE SUIVI */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Suivi des Locataires</h3>
            <Select value={houseFilter} onValueChange={setHouseFilter}>
              <SelectTrigger className="w-[150px] h-8 rounded-xl text-[10px] font-bold">
                <SelectValue placeholder="Maison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les maisons</SelectItem>
                {maisons.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl text-xs h-9 flex items-center gap-2">
                <Plus size={16} />
                Paiement Cash
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="font-black text-xl">Enregistrer un paiement cash</DialogTitle>
                <DialogDescription>Saisissez les détails du paiement reçu en main propre.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCashSubmit}>
                <div className="grid gap-4 py-4">
                  {cashError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{cashError}</div>
                  )}
                  <div className="grid gap-2">
                    <Label>Locataire *</Label>
                    <Select value={cashForm.locataire_id} onValueChange={v => setCashForm(f => ({ ...f, locataire_id: v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Sélectionner un locataire" />
                      </SelectTrigger>
                      <SelectContent>
                        {locataires.map(l => {
                          const unt = unites.find(u => u.id === l.unite_id);
                          return <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom} {unt ? `(${unt.nom})` : ''}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Montant (FCFA) *</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="25000"
                        className="rounded-xl"
                        value={cashForm.montant}
                        onChange={e => setCashForm(f => ({ ...f, montant: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mois concerné</Label>
                      <Select value={cashForm.mois} onValueChange={v => setCashForm(f => ({ ...f, mois: v }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Année</Label>
                    <Select value={cashForm.annee} onValueChange={v => setCashForm(f => ({ ...f, annee: v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Note / Commentaire</Label>
                    <Input
                      placeholder="Ex: Paiement en avance, partiel..."
                      className="rounded-xl"
                      value={cashForm.notes}
                      onChange={e => setCashForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={cashSubmitting}
                    className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6 flex items-center gap-2"
                  >
                    {cashSubmitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : <><Printer size={18} /> Confirmer & Enregistrer</>}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Locataire</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unité</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Loyer Dû</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Payé ce mois</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reste</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                <TableHead className="px-8 py-5 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic text-sm">
                    Aucun locataire pour cette période.
                  </TableCell>
                </TableRow>
              ) : filteredTenants.map(loc => {
                const unt = unites.find(u => u.id === loc.unite_id);
                const msn = maisons.find(m => m.id === unt?.maison_id);
                const payment = paiements.find(p => p.locataire_id === loc.id);
                const paid = payment?.statut === 'payé' ? (payment.montant || 0) : 0;
                const owed = unt?.loyer_mensuel || 0;
                const remaining = Math.max(0, owed - paid);

                return (
                  <TableRow key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                          {loc.prenom[0]}{loc.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">{loc.prenom} {loc.nom}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{msn?.nom || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-lg border-slate-200 text-slate-500">
                        {unt?.nom || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-800">{owed.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-xs font-bold text-green-600">{paid.toLocaleString()} FCFA</TableCell>
                    <TableCell className={`text-xs font-black ${remaining > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {remaining.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>{getStatusBadge(loc.id, owed)}</TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-300">
                        <MoreVertical size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ARRIÉRÉS ET AVANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ARRIÉRÉS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              Relances & Arriérés
            </h3>
            <Badge className="bg-red-50 text-red-600 border-none font-black text-[10px]">
              {locatairesEnArrieres.length} locataire(s)
            </Badge>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {locatairesEnArrieres.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-green-300" />
                Aucun arriéré détecté.
              </div>
            ) : locatairesEnArrieres.map(loc => {
              const montant = calculerMontantArrieres(loc.id);
              return (
                <div key={loc.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{loc.prenom} {loc.nom}</h4>
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                        Arriéré: {montant.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-xs flex items-center gap-2"
                    onClick={() => window.open(`https://wa.me/${loc.telephone.replace(/\s/g, '')}?text=Bonjour%20${loc.prenom},%20votre%20loyer%20est%20en%20retard.%20Merci%20de%20régulariser%20votre%20situation.`, '_blank')}
                  >
                    <MessageSquare size={14} />
                    Rappel
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* AVANCES */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} className="text-blue-500" />
              Réserve d'Avances
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {avances.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-sm">
                Aucune avance enregistrée.
              </div>
            ) : avances.map(av => {
              const loc = locataires.find(l => l.id === av.locataire_id);
              const unt = unites.find(u => u.id === av.unite_id);
              const pct = av.montant_initial > 0 ? Math.round((av.montant_restant / av.montant_initial) * 100) : 0;
              return (
                <div key={av.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{loc ? `${loc.prenom} ${loc.nom}` : '—'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{unt?.nom} — {av.type === 'loyer' ? 'Loyer' : av.type === 'eau' ? 'Eau' : 'Électricité'}</p>
                    </div>
                    <Badge className={`text-[9px] font-black border-none ${pct < 20 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                      {av.montant_restant.toLocaleString()} FCFA
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[9px] text-slate-400 mt-1">{pct}% restant sur {av.montant_initial.toLocaleString()} FCFA</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
