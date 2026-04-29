import { useState } from 'react';
import { CheckCircle, AlertCircle, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/upload/FileUploader';
import { OperateurMoMo } from '@/types/immoafrik';

interface MoMoConfig {
  operateur: OperateurMoMo;
  numero: string;
  nom_compte: string;
}

interface MoMoPaymentProps {
  montant: number;
  reference: string;
  momoConfigs: MoMoConfig[];
  onPaymentSubmit: (data: {
    operateur: OperateurMoMo;
    numero_transaction: string;
    capture_ecran_url?: string;
  }) => Promise<void>;
}

// Operator colors and logos
const operatorStyles: Record<OperateurMoMo, { bg: string; text: string; logo: string }> = {
  MTN: { bg: 'bg-yellow-400', text: 'text-black', logo: '/mtn-logo.png' },
  Orange: { bg: 'bg-orange-500', text: 'text-white', logo: '/orange-logo.png' },
  Wave: { bg: 'bg-blue-500', text: 'text-white', logo: '/wave-logo.png' },
  Moov: { bg: 'bg-blue-700', text: 'text-white', logo: '/moov-logo.png' },
};

export function MoMoPayment({ montant, reference, momoConfigs, onPaymentSubmit }: MoMoPaymentProps) {
  const [selectedOperator, setSelectedOperator] = useState<OperateurMoMo | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'select' | 'pay' | 'confirm'>('select');

  const selectedConfig = momoConfigs.find(c => c.operateur === selectedOperator);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!selectedOperator || !transactionNumber) return;
    
    setIsSubmitting(true);
    try {
      await onPaymentSubmit({
        operateur: selectedOperator,
        numero_transaction: transactionNumber,
        capture_ecran_url: screenshotUrl || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Résumé du paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Montant à payer</span>
            <span className="text-2xl font-bold">{formatPrice(montant)} FCFA</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Référence</span>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">{reference}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(reference)}
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Operator */}
      {step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>1. Choisissez votre opérateur</CardTitle>
            <CardDescription>
              Sélectionnez l&apos;opérateur Mobile Money que vous souhaitez utiliser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {momoConfigs.map((config) => {
                const style = operatorStyles[config.operateur];
                const isSelected = selectedOperator === config.operateur;
                
                return (
                  <button
                    key={config.operateur}
                    onClick={() => {
                      setSelectedOperator(config.operateur);
                      setStep('pay');
                    }}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                      }
                    `}
                  >
                    <div className={`${style.bg} ${style.text} rounded-lg p-3 mb-2 flex items-center justify-center`}>
                      <span className="font-bold text-lg">{config.operateur}</span>
                    </div>
                    <p className="text-sm font-medium">{config.nom_compte}</p>
                    <p className="text-xs text-muted-foreground">{config.numero}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Make Payment */}
      {step === 'pay' && selectedConfig && (
        <Card>
          <CardHeader>
            <CardTitle>2. Effectuez le paiement</CardTitle>
            <CardDescription>
              Envoyez {formatPrice(montant)} FCFA via {selectedOperator}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`${operatorStyles[selectedOperator!].bg} ${operatorStyles[selectedOperator!].text} rounded-xl p-6 text-center`}>
              <p className="text-sm opacity-90 mb-1">Envoyer à</p>
              <p className="text-3xl font-bold mb-2">{selectedConfig.numero}</p>
              <p className="text-sm opacity-90">{selectedConfig.nom_compte}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => copyToClipboard(selectedConfig.numero)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le numéro
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li>1. Ouvrez votre application {selectedOperator} Money</li>
                <li>2. Sélectionnez &quot;Envoyer de l&apos;argent&quot;</li>
                <li>3. Entrez le numéro: <strong>{selectedConfig.numero}</strong></li>
                <li>4. Montant: <strong>{formatPrice(montant)} FCFA</strong></li>
                <li>5. Ajoutez la référence: <strong>{reference}</strong></li>
                <li>6. Validez avec votre code PIN</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Changer d&apos;opérateur
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1">
                J&apos;ai effectué le paiement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm Payment */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle>3. Confirmez votre paiement</CardTitle>
            <CardDescription>
              Entrez les détails de votre transaction pour validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction">Numéro de transaction *</Label>
              <Input
                id="transaction"
                placeholder="Ex: TXN123456789"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Vous trouverez ce numéro dans le SMS de confirmation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Capture d&apos;écran (optionnel mais recommandé)</Label>
              <FileUploader
                accept="image/*"
                multiple={false}
                maxFiles={1}
                maxSizeMB={3}
                folder="payment-proofs"
                label="Ajoutez une capture d'écran de la confirmation"
                onUpload={(urls) => setScreenshotUrl(urls[0] || null)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('pay')} className="flex-1">
                Retour
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!transactionNumber || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Soumettre
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Besoin d&apos;aide?</p>
              <p>
                Si vous rencontrez des difficultés, contactez le propriétaire via WhatsApp 
                ou appelez le service client de votre opérateur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick MoMo selector for payment pages
export function MoMoSelector({ 
  configs, 
  selected, 
  onSelect 
}: { 
  configs: MoMoConfig[];
  selected?: OperateurMoMo;
  onSelect: (op: OperateurMoMo) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {configs.map((config) => {
        const style = operatorStyles[config.operateur];
        const isSelected = selected === config.operateur;
        
        return (
          <button
            key={config.operateur}
            onClick={() => onSelect(config.operateur)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${style.bg} ${style.text}
              ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-70 hover:opacity-100'}
            `}
          >
            {config.operateur}
          </button>
        );
      })}
    </div>
  );
}
