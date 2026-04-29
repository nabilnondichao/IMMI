/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Download,
  MoreVertical,
  Printer,
  ChevronDown,
  ArrowUpRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { 
  useMaisons, 
  useAllUnites, 
  useLocataires, 
  usePaiements 
} from '@/hooks/useData';
import { StatutPaiement, OperateurMoMo } from '@/types/immoafrik';

// --- UTILS ---
const calculerArrieres = (locataireId: string) => 0; // TODO: implement with real data

export default function PaymentsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [houseFilter, setHouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch real data
  const { maisons, isLoading: maisonsLoading } = useMaisons();
  const { unites, isLoading: unitesLoading } = useAllUnites();
  const { locataires, isLoading: locatairesLoading } = useLocataires();
  const { paiements, isLoading: paiementsLoading } = usePaiements({ mois: selectedMonth, annee: selectedYear });

  const isLoading = maisonsLoading || unitesLoading || locatairesLoading || paiementsLoading;

  // --- DERIVED DATA ---
  const filteredTenants = useMemo(() => {
    return locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      
      const matchesHouse = houseFilter === 'all' || msn?.id === houseFilter;
      // Status filtering logic would go here based on monthly status calculation
      return matchesHouse;
    });
  }, [locataires, unites, maisons, houseFilter]);

  const monthlyStats = useMemo(() => {
    const monthsTenants = locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      return houseFilter === 'all' || msn?.id === houseFilter;
    });

    const expected = monthsTenants.reduce((sum, l) => {
      const unt = unites.find(u => u.id === l.unite_id);
      return sum + (unt?.loyer_mensuel || 0);
    }, 0);

    const received = paiements
      .filter(p => p.statut === StatutPaiement.PAYE)
      .reduce((sum, p) => sum + p.montant, 0);

    const pendingConfirm = paiements
      .filter(p => p.statut === StatutPaiement.EN_ATTENTE)
      .reduce((sum, p) => sum + p.montant, 0);

    const arrears = expected - received;
    const recoveryRate = expected > 0 ? Math.round((received / expected) * 100) : 0;

    return { expected, received, arrears, recoveryRate, pendingConfirm };
  }, [selectedMonth, selectedYear, houseFilter, locataires, unites, maisons, paiements]);

  const getMonthName = (m: number) => {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2024, m - 1));
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2023, 2024, 2025, 2026];

  const getStatusBadge = (tenantId: string, monthlyRent: number) => {
    const payment = paiements.find(p => p.locataire_id === tenantId);
    
    if (!payment) return <Badge className="bg-red-100 text-red-600 font-black text-[9px] rounded-full uppercase">Impayé</Badge>;
    if (payment.statut === StatutPaiement.EN_ATTENTE) return <Badge className="bg-purple-100 text-purple-600 font-black text-[9px] rounded-full uppercase">En Attente MoMo</Badge>;
    if (payment.montant >= monthlyRent) return <Badge className="bg-green-100 text-green-600 font-black text-[9px] rounded-full uppercase">Payé</Badge>;
    if (payment.montant > 0) return <Badge className="bg-amber-100 text-amber-600 font-black text-[9px] rounded-full uppercase">Partiel</Badge>;
    
    return <Badge className="bg-red-100 text-red-600 font-black text-[9px] rounded-full uppercase">Impayé</Badge>;
  };

  return (
    <div className="p-8 pb-32 lg:pb-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A2E] mx-auto mb-4"></div>
            <p className="text-slate-500">Chargement des données...</p>
          </div>
        </div>
      ) : (
      {/* SECTION 1: BILAN DU MOIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Gestion des Paiements</h1>
          <p className="text-sm text-slate-500">Suivi des loyers, arriérés et encaissements</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32 border-none font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-4 bg-slate-200"></div>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 border-none font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avances</p>
            <h3 className="text-xl font-black text-[#1A1A2E]">250,000 <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-[#1A1A2E] text-white">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recouvrement</p>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-black">{monthlyStats.recoveryRate}%</h3>
              <Progress value={monthlyStats.recoveryRate} className="h-1.5 w-16 bg-white/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: TABLEAU DE SUIVI */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Suivi des Locataires</h3>
            <div className="flex gap-2">
              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="w-[150px] h-8 rounded-xl text-[10px] font-bold">
                  <SelectValue placeholder="Maison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les maisons</SelectItem>
                  {maisons.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Dialog>
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
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label>Locataire</Label>
                   <Select>
                     <SelectTrigger className="rounded-xl">
                       <SelectValue placeholder="Sélectionner locataire" />
                     </SelectTrigger>
                     <SelectContent>
                       {locataires.map(l => (
                         <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Montant (FCFA)</Label>
                      <Input type="number" placeholder="0" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mois concerné</Label>
                      <Select defaultValue={selectedMonth.toString()}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(m => (
                            <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
                 <div className="grid gap-2">
                   <Label>Note / Commentaire</Label>
                   <Input placeholder="Ex: Paiement en avance..." className="rounded-xl" />
                 </div>
               </div>
               <DialogFooter>
                 <Button className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6 flex items-center gap-2">
                   <Printer size={18} />
                   Confirmer & Imprimer Reçu
                 </Button>
               </DialogFooter>
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
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Payé</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reste</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                <TableHead className="px-8 py-5 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map(loc => {
                const unt = unites.find(u => u.id === loc.unite_id);
                const payment = paiements.find(p => p.locataire_id === loc.id);
                const paid = payment?.montant || 0;
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
                          <p className="text-[10px] text-slate-400 font-medium">Maison {unt?.maison_id.split('-')[1]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-lg border-slate-200 text-slate-500">
                        {unt?.nom}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-800">{owed.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-xs font-bold text-green-600">{paid.toLocaleString()} FCFA</TableCell>
                    <TableCell className={`text-xs font-black ${remaining > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {remaining.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(loc.id, owed)}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-[#B8860B]">
                          <Printer size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-300">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 3: GESTION DES ARRIÉRÉS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              Relances & Arriérés
            </h3>
            <Badge className="bg-red-50 text-red-600 border-none font-black text-[10px]">CRITIQUE</Badge>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {locataires.filter(l => calculerArrieres(l.id) > 0).map(loc => (
              <div key={loc.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{loc.prenom} {loc.nom}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total: {calculerArrieres(loc.id).toLocaleString()} FCFA</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-xs flex items-center gap-2"
                  onClick={() => window.open(`https://wa.me/${loc.telephone.replace(/\s/g, '')}?text=Bonjour%20${loc.prenom},%20votre%20loyer%20est%20en%20retard...`, '_blank')}
                >
                  <MessageSquare size={14} />
                  Rappel
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: GESTION DES AVANCES */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} className="text-blue-500" />
              Réserve d'Avances
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600 text-white border-none font-bold">LOYERS</Badge>
                  <p className="text-xs font-bold text-blue-800">Total prépayé</p>
                </div>
                <span className="text-sm font-black text-blue-900">450,000 FCFA</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imputation ce mois</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Eau / Élec</p>
                    <p className="text-xs font-bold">12,500 FCFA</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Loyers</p>
                    <p className="text-xs font-bold">85,000 FCFA</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl border-dashed border-2 hover:bg-slate-50 text-xs font-bold">
                Voir détails des avances par locataire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )}
  );
}
