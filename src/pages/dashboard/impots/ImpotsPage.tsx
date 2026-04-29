/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Globe, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  FileSpreadsheet,
  History,
  Info,
  TrendingUp,
  Receipt,
  Search,
  Bell
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { PAIEMENTS, DEPENSES, PROPRIETAIRES } from '@/lib/mock-data';
import { StatutPaiement } from '@/types/immoafrik';

interface TaxRule {
  country: string;
  rate: number;
  description: string;
}

const TAX_RULES: Record<string, TaxRule> = {
  'Benin': { country: 'Bénin', rate: 0.10, description: 'Taxe foncière : 10% des revenus locatifs nets.' },
  'IvoryCoast': { country: 'Côte d\'Ivoire', rate: 0.15, description: 'Impôt foncier : environ 15% sur le revenu net après abattement.' },
  'Senegal': { country: 'Sénégal', rate: 0.12, description: 'Retenue sur loyer : 12% du montant brut.' },
  'Mali': { country: 'Mali', rate: 0.10, description: 'Impôt foncier simplifié : 10%.' },
  'Togo': { country: 'Togo', rate: 0.08, description: 'Taxes municipales et foncières : ~8%.' },
  'Cameroon': { country: 'Cameroun', rate: 0.15, description: 'Impôt sur le revenu foncier : 15%.' },
  'Other': { country: 'Autre', rate: 0.10, description: 'Configuration personnalisée.' }
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function ImpotsPage() {
  const [selectedCountry, setSelectedCountry] = useState('Benin');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [customRate, setCustomRate] = useState<string>('');

  const currentRule = TAX_RULES[selectedCountry];
  const activeRate = customRate ? parseFloat(customRate) / 100 : currentRule.rate;

  // --- DATA CALCULATIONS ---
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthIndex = index + 1;
      
      // Filter payments for this month
      const grossIncome = PAIEMENTS
        .filter(p => p.annee === parseInt(selectedYear) && p.mois === monthIndex && p.statut === StatutPaiement.PAYE)
        .reduce((sum, p) => sum + p.montant, 0);
      
      // Filter expenses for this month
      const monthExpenses = DEPENSES
        .filter(d => {
          const dDate = new Date(d.date_depense);
          return dDate.getFullYear() === parseInt(selectedYear) && (dDate.getMonth() + 1) === monthIndex;
        })
        .reduce((sum, d) => sum + d.montant, 0);
      
      const netIncome = Math.max(0, grossIncome - monthExpenses);
      const estimatedTax = netIncome * activeRate;
      
      return {
        month,
        grossIncome,
        expenses: monthExpenses,
        netIncome,
        estimatedTax
      };
    });
  }, [selectedYear, activeRate]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, m) => ({
      gross: acc.gross + m.grossIncome,
      expenses: acc.expenses + m.expenses,
      net: acc.net + m.netIncome,
      tax: acc.tax + m.estimatedTax
    }), { gross: 0, expenses: 0, net: 0, tax: 0 });
  }, [monthlyData]);

  const pieData = [
    { name: 'Revenu Net', value: totals.net - totals.tax, color: '#1A1A2E' },
    { name: 'Charges', value: totals.expenses, color: '#94A3B8' },
    { name: 'Impôts Estimés', value: totals.tax, color: '#B8860B' }
  ];

  return (
    <div className="p-8 pb-32 lg:pb-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight flex items-center gap-3">
            Bilan Fiscal & Impôts
            <Calculator className="text-[#B8860B]" size={28} />
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gestion proactive de votre fiscalité immobilière</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-11 flex items-center gap-2">
            <Download size={18} /> Exporter PDF
          </Button>
          <Button className="bg-[#1A1A2E] text-white font-black rounded-xl text-xs h-11 flex items-center gap-2 px-6">
            <FileSpreadsheet size={18} /> Dossier Fiscal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SETTINGS & SUMMARY */}
        <div className="space-y-8">
          
          {/* SECTION 1: CONFIGURATION */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-6">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Globe size={20} className="text-[#B8860B]" />
                Paramètres Fiscaux
              </CardTitle>
              <CardDescription>Sélectionnez votre pays pour les taux par défaut.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pays de résidence fiscale</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="rounded-2xl h-12 bg-white border-slate-100 font-bold">
                    <SelectValue placeholder="Choisir un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAX_RULES).map(([key, rule]) => (
                      <SelectItem key={key} value={key}>{rule.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountry === 'Other' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taux personnalisé (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 12" 
                    className="rounded-2xl h-12"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                  />
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                  {currentRule.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: PREPARED DECLARATION */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-[#1A1A2E] text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#B8860B]" />
                Résumé Declaration {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Revenu Brut</span>
                  <span className="text-lg font-black tracking-tight">{totals.gross.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Charges Déductibles</span>
                  <span className="text-lg font-black tracking-tight text-red-300">-{totals.expenses.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Base Imposable (Net)</span>
                  <span className="text-lg font-black tracking-tight text-[#B8860B]">{totals.net.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-xs text-amber-400 font-black uppercase tracking-widest">Impôt Estimé</span>
                  <span className="text-2xl font-black tracking-tighter text-amber-400">{Math.round(totals.tax).toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                <p className="text-[9px] text-slate-400 italic">
                  Ces estimations sont indicatives. Consultez un expert-comptable pour valider vos déclarations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: ALERTS */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Bell size={20} className="text-red-500" />
                Échéances & Alertes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-red-900">Déclaration Annuelle</p>
                  <p className="text-[10px] text-red-700">À déposer avant le 30 Avril</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100 opacity-60">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900">Seuil de Revenu</p>
                  <p className="text-[10px] text-blue-700">75% du plafond atteint</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: DATA TABLE & CHARTS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 2: BILAN ANNUEL */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Détail du Bilan {selectedYear}</CardTitle>
                <CardDescription>Flux financiers mensuels et calcul fiscal automatique.</CardDescription>
              </div>
              <div className="w-32">
                 <Select value={selectedYear} onValueChange={setSelectedYear}>
                   <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="2024">2024</SelectItem>
                     <SelectItem value="2023">2023</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 border-none">
                      <TableHead className="rounded-l-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Mois</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brut</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Charges</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revenu Net</TableHead>
                      <TableHead className="rounded-r-2xl text-[10px] font-black uppercase tracking-widest text-[#B8860B]">Impôt Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.filter(d => d.grossIncome > 0 || d.expenses > 0).map((row, i) => (
                      <TableRow key={row.month} className="border-slate-50 hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-[#1A1A2E] py-4">{row.month}</TableCell>
                        <TableCell className="font-black text-slate-600 text-xs">{row.grossIncome.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                           <Badge className="bg-slate-100 text-slate-400 border-none px-2 rounded-lg font-bold text-[10px]">
                             {row.expenses.toLocaleString()}
                           </Badge>
                        </TableCell>
                        <TableCell className="font-black text-[#1A1A2E] text-xs">{(row.netIncome).toLocaleString()}</TableCell>
                        <TableCell className="font-black text-[#B8860B] text-xs">{Math.round(row.estimatedTax).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* VISUALIZATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 py-8 border-t border-slate-50">
                <div className="h-[250px]">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Distribution Annuelle</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[250px]">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Performance Revenus vs Impôts</p>
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.filter(d => d.grossIncome > 0)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" hide />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', fontWeight: 'bold' }} />
                      <Bar dataKey="grossIncome" name="Revenu Brut" fill="#1A1A2E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="estimatedTax" name="Impôt" fill="#B8860B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: ARCHIVES */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
             <CardHeader>
               <CardTitle className="text-lg font-black flex items-center gap-2">
                 <History size={20} className="text-slate-400" />
                 Archives Fiscales
               </CardTitle>
               <CardDescription>Historique des exports et documents officiels.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {[
                   { name: 'Dossier Fiscal 2023.pdf', date: '15 Mars 2024', size: '2.4 MB', label: 'OFFICIEL' },
                   { name: 'Justificatifs_Reparations_Q3.zip', date: '10 Jan 2024', size: '12.1 MB', label: 'PIÈCES' },
                   { name: 'Declaration_Provisoire_2024.xlsx', date: 'Il y a 2 jours', size: '156 KB', label: 'BROUILLON' }
                 ].map((doc, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl group hover:bg-slate-50 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#1A1A2E] transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Généré le {doc.date} • {doc.size}</p>
                        </div>
                     </div>
                     <Badge variant="outline" className="text-[9px] font-black tracking-widest border-slate-200">
                       {doc.label}
                     </Badge>
                   </div>
                 ))}
               </div>
               <Button variant="ghost" className="w-full mt-6 text-slate-400 text-xs font-bold hover:bg-slate-50 rounded-xl py-6">
                 Charger d'autres documents
               </Button>
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
