/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Home, 
  Users, 
  Receipt, 
  CreditCard, 
  Building2, 
  MapPin, 
  Edit, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { 
  MAISONS, 
  UNITES, 
  LOCATAIRES, 
  PAIEMENTS, 
  getTotalArrieres 
} from '@/lib/mock-data';
import { StatutPaiement, TypeUnite } from '@/types/immoafrik';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MaisonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const maison = MAISONS.find(m => m.id === id);

  if (!maison) {
    return <div className="p-12 text-center font-bold">Maison non trouvée.</div>;
  }

  const houseUnits = UNITES.filter(u => u.maison_id === maison.id);
  const houseTenants = LOCATAIRES.filter(l => houseUnits.some(u => u.id === l.unite_id));
  const totalLoyerAttendu = houseUnits.reduce((sum, u) => sum + u.loyer_mensuel, 0);
  const occupiedCount = houseUnits.filter(u => u.statut === 'occupé').length;

  return (
    <div className="p-8 pb-24 lg:pb-8">
      {/* HEADER */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/dashboard/maisons')}
          className="flex items-center gap-2 text-slate-400 hover:text-[#1A1A2E] mb-4 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux maisons
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1A1A2E] rounded-[1.5rem] flex items-center justify-center text-[#B8860B] shadow-lg">
              <Home size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">{maison.nom}</h1>
              <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                <MapPin size={14} className="text-[#B8860B]" />
                {maison.adresse}, {maison.ville}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Potentiel</p>
              <p className="text-lg font-black text-[#1A1A2E]">{totalLoyerAttendu.toLocaleString()} <span className="text-xs">FCFA</span></p>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupation</p>
              <p className="text-lg font-black text-[#B8860B]">{occupiedCount} / {houseUnits.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="unites" className="space-y-8">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 inline-block">
          <TabsList className="bg-transparent gap-2 h-auto p-1">
            <TabsTrigger value="unites" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white">Unités</TabsTrigger>
            <TabsTrigger value="locataires" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white">Locataires</TabsTrigger>
            <TabsTrigger value="paiements" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white">Paiements</TabsTrigger>
            <TabsTrigger value="depenses" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white">Dépenses</TabsTrigger>
          </TabsList>
        </div>

        {/* ONGLET UNITÉS */}
        <TabsContent value="unites" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-[#1A1A2E] tracking-tight">Liste des unités ({houseUnits.length})</h3>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#1A1A2E] hover:bg-black text-white font-bold rounded-xl flex items-center gap-2">
                  <Plus size={18} />
                  Nouvelle unité
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl text-[#1A1A2E]">Ajouter une unité</DialogTitle>
                  <DialogDescription>Créez un nouvel espace locatif dans cette maison.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="num">Numéro/Nom</Label>
                      <Input id="num" placeholder="Ex: A1, Boutique 4..." className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select defaultValue="chambre">
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Choisir type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chambre">Chambre</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="appartement">Appartement</SelectItem>
                          <SelectItem value="boutique">Boutique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="loyer">Loyer Mensuel (FCFA)</Label>
                      <Input id="loyer" type="number" placeholder="50000" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="etage">Étage</Label>
                      <Input id="etage" type="number" placeholder="0" className="rounded-xl" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-[#B8860B] text-white font-bold rounded-xl w-full py-6">Créer l'unité</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {houseUnits.map(unit => {
              const tenant = LOCATAIRES.find(l => l.unite_id === unit.id);
              return (
                <Card key={unit.id} className="rounded-[2.5rem] border-slate-100 shadow-sm hover:border-[#B8860B]/30 transition-all group overflow-hidden">
                  <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div>
                      <h4 className="text-xl font-black text-[#1A1A2E] tracking-tight">{unit.nom}</h4>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400 mt-1">
                        {unit.type}
                      </Badge>
                    </div>
                    <div className={`p-2 rounded-xl ${unit.statut === 'occupé' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {unit.statut === 'occupé' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loyer</span>
                      <span className="text-sm font-black text-[#1A1A2E]">{unit.loyer_mensuel.toLocaleString()} FCFA</span>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      {tenant ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1A1A2E] rounded-full flex items-center justify-center text-white text-xs font-black">
                            {tenant.prenom[0]}{tenant.nom[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 leading-none">{tenant.prenom} {tenant.nom}</p>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1">Payé ce mois</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Actuellement libre</p>
                          <Button variant="link" size="sm" className="text-[#B8860B] font-black text-[10px] uppercase p-0 h-auto mt-1 tracking-widest">Assigner un locataire</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="p-3 bg-slate-50 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Modifier</Button>
                    {unit.statut === 'occupé' && (
                      <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500">Libérer</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ONGLET LOCATAIRES */}
        <TabsContent value="locataires">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Locataires actifs</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input placeholder="Rechercher..." className="pl-9 h-9 rounded-xl text-xs" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/30">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6">Locataire</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unité</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arriérés</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                    <TableHead className="text-right px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {houseTenants.map(tenant => (
                    <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-[10px]">
                            {tenant.prenom[0]}{tenant.nom[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 tracking-tight">{tenant.prenom} {tenant.nom}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{tenant.telephone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg text-[9px] font-black text-slate-500">
                          {UNITES.find(u => u.id === tenant.unite_id)?.nom || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className={`text-xs font-black ${getTotalArrieres(tenant.id) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {getTotalArrieres(tenant.id).toLocaleString()} FCFA
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] font-black rounded-full ${getTotalArrieres(tenant.id) > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {getTotalArrieres(tenant.id) > 0 ? 'IMPAYÉ' : 'À JOUR'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-300">
                          <MoreVertical size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ONGLET PAIEMENTS */}
        <TabsContent value="paiements">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Historique des paiements</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                  <Filter size={14} /> Filtres
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                  <Download size={14} /> Export
                </Button>
              </div>
            </div>
            <div className="p-12 text-center">
              <Receipt size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 font-bold">Aucun paiement trouvé pour les filtres actuels.</p>
            </div>
          </Card>
        </TabsContent>

        {/* ONGLET DÉPENSES */}
        <TabsContent value="depenses">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Réparations & Travaux</h3>
              <Button className="bg-[#B8860B] hover:bg-[#9A700A] text-white text-[10px] font-black rounded-xl uppercase tracking-widest h-9">Ajouter dépense</Button>
            </div>
            <div className="p-20 text-center">
              <Wrench size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 font-bold">Zéro dépense enregistrée pour cette maison.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
