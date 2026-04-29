/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  Plus, 
  Search, 
  MapPin, 
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMaisons, useAllUnites, createMaison, deleteMaison } from '@/hooks/useData';

export default function MaisonsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { maisons, isLoading, refresh } = useMaisons();
  const { unites } = useAllUnites();
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMaison, setNewMaison] = useState({
    nom: '',
    ville: '',
    pays: 'Bénin',
    adresse: '',
    commune: '',
  });

  const filteredMaisons = maisons.filter(maison => {
    const matchesSearch = maison.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          maison.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || maison.ville === cityFilter;
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(maisons.map(m => m.ville).filter(Boolean)));

  const handleCreateMaison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      await createMaison({
        ...newMaison,
        proprietaire_id: user.id,
        images_urls: null,
      });
      setNewMaison({ nom: '', ville: '', pays: 'Bénin', adresse: '', commune: '' });
      setIsCreateDialogOpen(false);
      refresh();
    } catch (error) {
      console.error('Error creating maison:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMaison = async (id: string) => {
    try {
      await deleteMaison(id);
      refresh();
    } catch (error) {
      console.error('Error deleting maison:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-[#B8860B] mb-4" size={48} />
          <p className="text-slate-500">Chargement des maisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 lg:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Mes Maisons</h1>
          <p className="text-sm text-slate-500">Gérez votre portefeuille immobilier</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
              <Plus size={18} />
              Ajouter une maison
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="font-black text-xl text-[#1A1A2E]">Nouvelle Maison</DialogTitle>
              <DialogDescription>
                Remplissez les informations de base pour votre nouveau bien immobilier.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaison}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom de la maison</Label>
                  <Input 
                    id="nom" 
                    placeholder="Ex: Résidence La Paix" 
                    className="rounded-xl"
                    value={newMaison.nom}
                    onChange={(e) => setNewMaison({ ...newMaison, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input 
                      id="ville" 
                      placeholder="Cotonou" 
                      className="rounded-xl"
                      value={newMaison.ville}
                      onChange={(e) => setNewMaison({ ...newMaison, ville: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pays">Pays</Label>
                    <Select 
                      value={newMaison.pays} 
                      onValueChange={(value) => setNewMaison({ ...newMaison, pays: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bénin">Bénin</SelectItem>
                        <SelectItem value="Côte d'Ivoire">Côte d&apos;Ivoire</SelectItem>
                        <SelectItem value="Sénégal">Sénégal</SelectItem>
                        <SelectItem value="Togo">Togo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="commune">Commune / Quartier</Label>
                  <Input 
                    id="commune" 
                    placeholder="Akpakpa" 
                    className="rounded-xl"
                    value={newMaison.commune}
                    onChange={(e) => setNewMaison({ ...newMaison, commune: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="adresse">Adresse exacte</Label>
                  <Input 
                    id="adresse" 
                    placeholder="Rue 123, près du marché..." 
                    className="rounded-xl"
                    value={newMaison.adresse}
                    onChange={(e) => setNewMaison({ ...newMaison, adresse: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-[#1A1A2E] text-white font-bold rounded-xl w-full py-6"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer la maison"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTRES */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Rechercher une maison..." 
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {cities.length > 0 && (
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full md:w-[200px] rounded-xl">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Empty State */}
      {filteredMaisons.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="text-slate-400" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {maisons.length === 0 ? "Aucune maison enregistrée" : "Aucun résultat"}
          </h3>
          <p className="text-slate-500 mb-6">
            {maisons.length === 0 
              ? "Commencez par ajouter votre première propriété."
              : "Modifiez vos critères de recherche."
            }
          </p>
          {maisons.length === 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl"
            >
              <Plus size={18} className="mr-2" />
              Ajouter une maison
            </Button>
          )}
        </div>
      )}

      {/* GRILLE DE MAISONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaisons.map(maison => {
          const houseUnits = unites.filter(u => u.maison_id === maison.id);
          const occupied = houseUnits.filter(u => u.statut === 'occupé').length;
          const occRate = houseUnits.length > 0 ? Math.round((occupied / houseUnits.length) * 100) : 0;
          const expectedRent = houseUnits.reduce((sum, u) => sum + u.loyer_mensuel, 0);

          return (
            <Card key={maison.id} className="rounded-[2rem] border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="h-32 bg-[#1A1A2E] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#B8860B]/10 opacity-50"></div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-white/10 text-white backdrop-blur-md border-none font-bold">
                    {maison.ville}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-xl font-black text-white tracking-tight">{maison.nom}</h3>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <MapPin size={14} className="text-[#B8860B]" />
                  {maison.adresse}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Occupation</span>
                      <span className="text-xs font-black text-[#1A1A2E]">{occupied} / {houseUnits.length} unités</span>
                    </div>
                    <Progress value={occRate} className="h-2 bg-slate-50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Unités</p>
                      <p className="text-sm font-black text-[#1A1A2E] leading-none">{houseUnits.length}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Loyers</p>
                      <p className="text-sm font-black text-[#1A1A2E] leading-none">
                        {expectedRent.toLocaleString()} <span className="text-[8px]">FCFA</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 bg-slate-50 flex justify-between gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 rounded-xl font-bold text-xs"
                  onClick={() => navigate(`/dashboard/maisons/${maison.id}`)}
                >
                  Voir détail
                </Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#B8860B]">
                    <Edit size={16} />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {maison.nom} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Toutes les unités et les données associées seront supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                          onClick={() => handleDeleteMaison(maison.id)}
                        >
                          Confirmer la suppression
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
