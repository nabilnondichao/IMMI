/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  User, 
  Home, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Download, 
  MoreVertical,
  Printer,
  ChevronRight,
  Search,
  Filter,
  FilePlus,
  AlertTriangle,
  History,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useMaisons, 
  useAllUnites, 
  useLocataires, 
  useContrats 
} from '@/hooks/useData';
import { StatutContrat, StatutUnite } from '@/types/immoafrik';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContratPDF } from '@/components/contrats/ContratPDF';
import { useAuth } from '@/contexts/AuthContext';

export default function ContratsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form State for new contract
  const [newContract, setNewContract] = useState({
    locataireId: '',
    uniteId: '',
    dateEffet: '',
    dateFin: '',
    cautionMois: 1,
    preavisJours: 30,
    loyerSpecial: 0,
    conditions: ''
  });

  const { profile } = useAuth();
  // Fetch real data
  const { maisons, isLoading: maisonsLoading } = useMaisons();
  const { unites, isLoading: unitesLoading } = useAllUnites();
  const { locataires, isLoading: locatairesLoading } = useLocataires();
  const { contrats, isLoading: contratsLoading } = useContrats();

  const isLoading = maisonsLoading || unitesLoading || locatairesLoading || contratsLoading;

  // Get current user as proprietaire (assuming authenticated user)
  const proprio = { nom: profile?.nom || 'Propriétaire', prenom: profile?.prenom || '', email: profile?.email || '', pays: profile?.pays || 'Bénin' };

  // --- DERIVED DATA ---
  const filteredContracts = useMemo(() => {
    return contrats.filter(c => {
      const loc = locataires.find(l => l.id === c.locataire_id);
      const matchesSearch = loc?.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loc?.prenom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, contrats, locataires]);

  const expiringSoonCount = contrats.filter(c => {
    const daysToExpiry = Math.floor((new Date(c.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return c.statut === StatutContrat.ACTIF && daysToExpiry <= 30 && daysToExpiry > 0;
  }).length;

  const getStatusBadge = (contrat: any) => {
    const daysToExpiry = Math.floor((new Date(contrat.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    if (contrat.statut === StatutContrat.RESILIE) return <Badge className="bg-slate-100 text-slate-500 font-black text-[9px] rounded-full uppercase">Résilié</Badge>;
    if (daysToExpiry < 0) return <Badge className="bg-red-100 text-red-600 font-black text-[9px] rounded-full uppercase">Expiré</Badge>;
    if (daysToExpiry <= 30) return <Badge className="bg-amber-100 text-amber-600 font-black text-[9px] rounded-full uppercase">Expire bientôt</Badge>;
    
    return <Badge className="bg-green-100 text-green-600 font-black text-[9px] rounded-full uppercase">Actif</Badge>;
  };

  const getPDFData = (c: any) => {
    const loc = locataires.find(l => l.id === c.locataire_id);
    const unt = unites.find(u => u.id === c.unite_id);
    const msn = maisons.find(m => m.id === unt?.maison_id);
    
    return {
      contratId: c.id,
      proprioNom: `${proprio.prenom} ${proprio.nom}`,
      proprioAddress: proprio.pays,
      locataireNom: loc?.nom || '',
      locatairePrenom: loc?.prenom || '',
      locatairePiece: loc?.numero_piece_identite || '',
      maisonNom: msn?.nom || '',
      uniteNom: unt?.nom || '',
      loyer: unt?.loyer_mensuel || 0,
      caution: (unt?.loyer_mensuel || 0) * c.caution_mois,
      dateEffet: c.date_effet,
      dateFin: c.date_fin,
      preavis: c.preavis_jours,
      conditions: "Contrat standard ImmoAfrik."
    };
  };

  return (
    <div className="p-8 pb-32 lg:pb-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A2E] mx-auto mb-4"></div>
            <p className="text-slate-500">Chargement des contrats...</p>
          </div>
        </div>
      ) : (<>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight flex items-center gap-3">
            Gestion des Contrats
            {expiringSoonCount > 0 && (
              <div className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {expiringSoonCount} ALERTES
              </div>
            )}
          </h1>
          <p className="text-sm text-slate-500">Baux, renouvellements et gestion des préavis</p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog>
             <DialogTrigger asChild>
               <Button className="bg-[#1A1A2E] text-white font-black rounded-xl text-xs h-11 flex items-center gap-2 px-6">
                 <FilePlus size={18} />
                 Nouveau Contrat
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[700px] rounded-[3rem]">
               <DialogHeader>
                 <DialogTitle className="font-black text-2xl">Établir un nouveau contrat</DialogTitle>
                 <DialogDescription>Générez un contrat de bail complet et conforme en quelques secondes.</DialogDescription>
               </DialogHeader>
               
               <div className="grid grid-cols-2 gap-6 py-4">
                 <div className="space-y-4">
                   <div className="grid gap-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locataire</Label>
                     <Select onValueChange={(v) => setNewContract({...newContract, locataireId: v})}>
                       <SelectTrigger className="rounded-xl font-bold">
                         <SelectValue placeholder="Sélectionner..." />
                       </SelectTrigger>
                       <SelectContent>
                         {locataires.map(l => (
                           <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid gap-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bien / Unité</Label>
                     <Select onValueChange={(v) => setNewContract({...newContract, uniteId: v})}>
                       <SelectTrigger className="rounded-xl font-bold">
                         <SelectValue placeholder="Choisir unité libre..." />
                       </SelectTrigger>
                       <SelectContent>
                         {unites.filter(u => u.statut === StatutUnite.LIBRE).map(u => (
                           <SelectItem key={u.id} value={u.id}>{u.nom} ({maisons.find(m => m.id === u.maison_id)?.nom})</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caution (mois)</Label>
                       <Input type="number" defaultValue="2" className="rounded-xl font-bold" />
                     </div>
                     <div className="grid gap-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Préavis (jours)</Label>
                       <Input type="number" defaultValue="30" className="rounded-xl font-bold" />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date d'effet</Label>
                        <Input type="date" className="rounded-xl font-bold" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date fin</Label>
                        <Input type="date" className="rounded-xl font-bold" />
                      </div>
                   </div>
                   <div className="grid gap-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conditions particulières</Label>
                     <Textarea placeholder="Clauses spécifiques..." className="rounded-xl min-h-[120px]" />
                   </div>
                 </div>
               </div>

               <DialogFooter className="flex-col sm:flex-row gap-4 pt-4">
                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 w-full">
                   <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-800 font-medium">L'unité sera automatiquement passée en statut "OCCUPÉ" dès la validation du contrat.</p>
                 </div>
                 <Button className="w-full bg-[#B8860B] text-white font-black rounded-2xl py-6 flex items-center gap-2">
                   <CheckCircle2 size={18} />
                   Valider & Générer PDF
                 </Button>
               </DialogFooter>
             </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Rechercher un locataire..." 
            className="pl-12 rounded-2xl h-12 bg-white border-slate-100 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] rounded-2xl h-12 bg-white border-slate-100 font-bold text-xs uppercase tracking-widest">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les contrats</SelectItem>
            <SelectItem value={StatutContrat.ACTIF}>Actifs</SelectItem>
            <SelectItem value={StatutContrat.EXPIRE}>Expirés</SelectItem>
            <SelectItem value={StatutContrat.RESILIE}>Résiliés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Locataire</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bien / Unité</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Période</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Loyer</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                <TableHead className="px-8 py-5 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map(c => {
                const loc = locataires.find(l => l.id === c.locataire_id);
                const unt = unites.find(u => u.id === c.unite_id);
                const msn = maisons.find(m => m.id === unt?.maison_id);
                
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1A1A2E] flex items-center justify-center font-bold text-white text-[10px]">
                          {loc?.prenom[0]}{loc?.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">{loc?.prenom} {loc?.nom}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{unt?.nom}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{msn?.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-[#B8860B]" />
                        <span>{c.date_effet}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span>{c.date_fin}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black text-slate-800">
                      {unt?.loyer_mensuel.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(c)}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <PDFDownloadLink document={<ContratPDF data={getPDFData(c)} />} fileName={`Contrat_${loc?.nom}_${c.id}.pdf`}>
                          {({ loading }) => (
                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-[#B8860B]" disabled={loading}>
                              <Printer size={18} />
                            </Button>
                          )}
                        </PDFDownloadLink>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-red-500">
                              <History size={18} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[2.5rem]">
                            <DialogHeader>
                              <DialogTitle className="font-black text-xl">Signification de préavis</DialogTitle>
                              <DialogDescription>Entamez la procédure de résiliation du bail.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date de notification</Label>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="rounded-xl font-bold" />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motif de départ</Label>
                                <Select>
                                   <SelectTrigger className="rounded-xl font-bold">
                                     <SelectValue placeholder="Sélectionner..." />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="proprio">À l'initiative du bailleur</SelectItem>
                                     <SelectItem value="tenant">À l'initiative du preneur</SelectItem>
                                     <SelectItem value="violation">Violation des clauses</SelectItem>
                                   </SelectContent>
                                </Select>
                              </div>
                              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Calcul Libération</p>
                                <p className="text-xs font-bold text-red-900">Date de libération estimée : 28 Mai 2026 (30 jours)</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button className="w-full bg-red-600 text-white font-black rounded-2xl py-6">
                                Acter le préavis
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-300">
                          <MoreVertical size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium italic">
                    Aucun contrat trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* ALERTS SECTION (Internal) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1A1A2E] text-white rounded-[2.5rem] p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
               <AlertTriangle size={24} />
             </div>
             <div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Contrats à risque</p>
               <h4 className="text-xl font-black">{expiringSoonCount} contrats expirent sous 30j</h4>
             </div>
           </div>
           <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
             Voir
           </Button>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
               <CheckCircle2 size={24} />
             </div>
             <div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Taux Renouvellement</p>
               <h4 className="text-xl font-black text-[#1A1A2E]">92% cette année</h4>
             </div>
           </div>
           <Button variant="ghost" className="text-slate-400 hover:bg-slate-50 rounded-xl">
             Analyse
           </Button>
        </div>
      </div>
    </>)}
  </div>
  );
}
